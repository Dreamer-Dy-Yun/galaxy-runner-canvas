// Galaxy Runner - player progression system
// Owns pickup outcomes and weapon acquisition while Player retains the resulting state.

(() => {
  class PlayerProgressionSystem {
    static collect(player, item, game) {
      if (item.kind === "repair") {
        const beforeHealth = player.health;
        if (player.health < player.maxHealth) {
          player.health = Math.min(player.maxHealth, player.health + BALANCE.repairAmount);
        } else {
          game.state.score += BALANCE.repairOverflowScore;
        }
        game.burst(item.x, item.y, item.color, 12);
        return PlayerProgressionSystem.result(item.kind, {
          outcome: player.health > beforeHealth ? "healed" : "score",
          amount: player.health > beforeHealth ? player.health - beforeHealth : BALANCE.repairOverflowScore,
        });
      } else if (item.kind === "armor") {
        player.armorLevel = Math.min(BALANCE.armorMaxLevel, player.armorLevel + 1);
        const nextMaxHealth = BALANCE.basePlayerHealth + player.armorLevel * BALANCE.armorHealthStep;
        const gainedHealth = nextMaxHealth - player.maxHealth;
        player.maxHealth = nextMaxHealth;
        player.health = Math.min(player.maxHealth, player.health + Math.max(BALANCE.armorPickupMinHeal, gainedHealth));
        game.burst(item.x, item.y, item.color, 16);
        return PlayerProgressionSystem.result(item.kind, {
          outcome: "level",
          level: player.armorLevel,
          maxHealth: player.maxHealth,
        });
      } else if (item.kind === "shield") {
        const beforeMaxShield = player.maxShield;
        player.upgradeShieldCapacity();
        game.burst(item.x, item.y, item.color, 16);
        return PlayerProgressionSystem.result(item.kind, {
          outcome: "capacity",
          amount: player.maxShield - beforeMaxShield,
          maxShield: player.maxShield,
        });
      } else if (item.kind === "shieldDefense") {
        player.shieldDefenseLevel = Math.min(BALANCE.shieldDefenseMaxLevel, player.shieldDefenseLevel + 1);
        game.burst(item.x, item.y, item.color, 18);
        return PlayerProgressionSystem.result(item.kind, {
          outcome: "level",
          level: player.shieldDefenseLevel,
          amount: player.shieldDefenseLevel * BALANCE.shieldDefensePerLevel,
        });
      } else if (isWeaponKind(item.kind)) {
        const result = PlayerProgressionSystem.equipWeapon(player, item.kind);
        game.burst(item.x, item.y, item.color, WeaponCatalog.pickupBurst(item.kind));
        return result;
      } else if (item.kind === "drone") {
        player.droneLevel = Math.min(DroneSystem.maxLevel, player.droneLevel + 1);
        player.drones = DroneSystem.count(player.droneLevel);
        game.burst(item.x, item.y, item.color, 18);
        return PlayerProgressionSystem.result(item.kind, {
          outcome: "level",
          level: player.droneLevel,
          count: player.drones,
        });
      } else if (item.kind === "bonus") {
        player.activateSpecialOverdrive();
        game.burst(item.x, item.y, item.color, 24);
        return PlayerProgressionSystem.result(item.kind, {
          outcome: "overdrive",
          duration: player.specialOverdriveTimer,
        });
      } else {
        game.burst(item.x, item.y, item.color, 18);
        return PlayerProgressionSystem.result(item.kind, { outcome: "collected" });
      }
    }

    static equipWeapon(player, kind) {
      if (!isWeaponKind(kind)) return null;

      const rigFrom = PlayerProgressionSystem.rigState(player);
      const activeKind = player.activeWeaponKind();
      const maxLevel = WeaponCatalog.maxLevel(kind);
      const ownedLevel = Math.max(player.weaponHighestLevel(kind), player.weaponLevel(kind));
      const previousCoreLevel = player.weaponCoreLevel(kind);
      let nextLevel = Math.max(1, ownedLevel);
      player.fireTimer = 0;

      if (ownedLevel >= maxLevel) {
        player.addWeaponCore(kind);
        nextLevel = maxLevel;
      } else if (activeKind === kind) {
        nextLevel = Math.min(maxLevel, ownedLevel + 1);
      }

      player.setWeaponHighestLevel(kind, nextLevel);
      player.clearWeaponLevels();
      player.setWeaponLevel(kind, nextLevel);
      player.updateWeaponFootprint();
      const coreLevel = player.weaponCoreLevel(kind);
      const outcome = coreLevel > previousCoreLevel
        ? "core"
        : activeKind && activeKind !== kind
          ? "switched"
          : ownedLevel > 0
            ? "level"
            : "equipped";
      const rigTo = PlayerProgressionSystem.rigState(player);
      return PlayerProgressionSystem.result(kind, {
        outcome,
        level: nextLevel,
        coreLevel,
        rigChange: Object.freeze({ from: rigFrom, to: rigTo }),
      });
    }

    static rigState(player) {
      const kind = player.activeWeaponKind();
      return Object.freeze({ kind, level: kind ? player.weaponLevel(kind) : 0 });
    }

    static result(kind, details) {
      return Object.freeze({ kind, ...details });
    }
  }

  globalThis.PlayerProgressionSystem = PlayerProgressionSystem;
})();
