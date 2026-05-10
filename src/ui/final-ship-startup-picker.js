// Galaxy Runner - startup final ship picker (development helper).
// Keeps the "which final ship level should start enabled" decision out of core gameplay.

class FinalShipStartupPicker {
  static STORAGE_KEY = "galaxy-runner-final-ship-startup-v1";
  static ELEMENT_IDS = Object.freeze({
    panel: "startup-final-picker",
    startWeapon: "startup-start-weapon",
    rapidLevel: "startup-rapid-level",
    energyLevel: "startup-energy-level",
    spreadLevel: "startup-spread-level",
    novaLevel: "startup-nova-level",
  });

  static defaultProfile() {
    const weaponLevels = {};
    for (const kind of WEAPON_KINDS) {
      weaponLevels[kind] = 1;
    }

    return {
      startWeapon: WeaponCatalog.defaultKind(),
      weaponLevels,
    };
  }

  constructor({
    storageKey = FinalShipStartupPicker.STORAGE_KEY,
    rootId = FinalShipStartupPicker.ELEMENT_IDS.panel,
  } = {}) {
    this.storageKey = storageKey;
    this.root = document.getElementById(rootId);
    this.inputs = new Map();

    if (!this.root) return;

    this.root.hidden = false;
    this.bindElements();
    this.populateLevelOptions();
    this.restoreFromStorage();
    this.setUpEventBindings();
  }

  snapshot() {
    if (!this.root) return FinalShipStartupPicker.defaultProfile();

    const profile = {
      startWeapon: this.readWeapon(this.inputFor("startWeapon").value),
      weaponLevels: {},
    };

    for (const kind of WEAPON_KINDS) {
      profile.weaponLevels[kind] = this.readLevel(kind, this.inputFor(`${kind}Level`).value);
    }

    return profile;
  }

  restoreFromStorage() {
    const source = this.loadProfile();
    this.applyToInputs(source);
  }

  applyToInputs(profile) {
    if (!profile || !this.root) return;

    const safeProfile = this.normalizeProfile(profile);
    this.inputFor("startWeapon").value = safeProfile.startWeapon ?? "none";

    for (const kind of WEAPON_KINDS) {
      this.inputFor(`${kind}Level`).value = String(safeProfile.weaponLevels[kind]);
    }
  }

  label() {
    const profile = this.snapshot();
    if (!profile.startWeapon) return "Base";
    return `${profile.startWeapon.toUpperCase()}-${String(profile.weaponLevels[profile.startWeapon]).padStart(2, "0")}`;
  }

  setUpEventBindings() {
    const onChange = () => this.persistProfile(this.snapshot());
    this.root.addEventListener("change", onChange);
    this.persistProfile(this.snapshot());
  }

  persistProfile(profile) {
    if (!this.root || !window.localStorage) return;
    window.localStorage.setItem(this.storageKey, JSON.stringify(profile));
  }

  loadProfile() {
    if (!window.localStorage) return FinalShipStartupPicker.defaultProfile();

    const raw = window.localStorage.getItem(this.storageKey);
    if (!raw) return FinalShipStartupPicker.defaultProfile();

    try {
      return this.normalizeProfile(JSON.parse(raw));
    } catch (error) {
      return FinalShipStartupPicker.defaultProfile();
    }
  }

  normalizeProfile(profile = null) {
    if (!profile || typeof profile !== "object") return FinalShipStartupPicker.defaultProfile();

    const startWeapon = this.readWeapon(profile.startWeapon);
    const weaponLevels = {};

    for (const kind of WEAPON_KINDS) {
      weaponLevels[kind] = this.readLevel(kind, profile.weaponLevels?.[kind]);
    }

    return {
      startWeapon,
      weaponLevels,
    };
  }

  readWeapon(value) {
    if (isWeaponKind(value)) return value;
    return null;
  }

  readLevel(kind, value) {
    return WeaponCatalog.normalizeStartupLevel(kind, value);
  }

  inputFor(name) {
    if (this.inputs.has(name)) return this.inputs.get(name);
    const element = document.getElementById(FinalShipStartupPicker.ELEMENT_IDS[name]);
    if (!element) {
      throw new Error(`FinalShipStartupPicker: missing element ${name}`);
    }
    this.inputs.set(name, element);
    return element;
  }

  bindElements() {
    for (const kind of WEAPON_KINDS) {
      const element = document.getElementById(FinalShipStartupPicker.ELEMENT_IDS[`${kind}Level`]);
      if (element) this.inputs.set(`${kind}Level`, element);
    }

    const startWeapon = document.getElementById(FinalShipStartupPicker.ELEMENT_IDS.startWeapon);
    if (startWeapon) this.inputs.set("startWeapon", startWeapon);
  }

  populateLevelOptions() {
    for (const kind of WEAPON_KINDS) {
      const select = this.inputFor(`${kind}Level`);
      if (select.options.length) continue;

      for (let level = 1; level <= WeaponCatalog.maxLevel(kind); level += 1) {
        const option = document.createElement("option");
        const label = String(level).padStart(2, "0");
        option.value = String(level);
        option.textContent = label;
        select.appendChild(option);
      }
    }
  }
}
