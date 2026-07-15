// Galaxy Runner - Korean feedback copy
// Converts semantic feedback details to user-facing Korean text only.

(() => {
  const KIND_LABELS = Object.freeze({
    rapid: "Rapid",
    energy: "Energy",
    spread: "Spread",
    nova: "Nova",
    repair: "수리",
    armor: "장갑",
    shield: "실드",
    shieldDefense: "실드 방어",
    drone: "드론",
    bonus: "오버드라이브",
  });

  function finiteText(value) {
    return Number.isFinite(value) ? String(Math.max(0, Math.round(value * 10) / 10)) : "";
  }

  function kindLabel(kind) {
    return KIND_LABELS[kind] || "장비";
  }

  function specialUsed(details) {
    const cost = finiteText(details.cost);
    return `${kindLabel(details.kind)} 특수기 발동${cost ? ` · ${cost}%` : ""}`;
  }

  function specialFailed(details) {
    if (details.reason === "no-weapon") return "특수기 잠김 · 무기를 먼저 획득하세요";
    if (details.reason === "insufficient-meter" || details.reason === "meter") {
      const required = finiteText(details.required ?? details.cost);
      return required ? `특수 게이지 부족 · ${required}% 필요` : "특수 게이지가 부족합니다";
    }
    if (details.reason === "nova-cap" || details.reason === "mine-cap") {
      const active = finiteText(details.active);
      const maximum = finiteText(details.maximum ?? details.max);
      return active && maximum ? `Nova 지뢰 한도 · ${active}/${maximum}` : "Nova 지뢰 한도에 도달했습니다";
    }
    return "지금은 특수기를 사용할 수 없습니다";
  }

  function weaponResult(details) {
    const label = kindLabel(details.kind);
    const level = finiteText(details.level);
    const coreLevel = finiteText(details.coreLevel);
    if (details.outcome === "core" || coreLevel) return `${label} 코어 강화${coreLevel ? ` · ${coreLevel}단계` : ""}`;
    if (details.outcome === "switched" || details.outcome === "equipped") {
      return `${label} 장착${level ? ` · LV ${level}` : ""}`;
    }
    return `${label} 강화${level ? ` · LV ${level}` : ""}`;
  }

  function itemCollected(details) {
    if (["rapid", "energy", "spread", "nova"].includes(details.kind)) return weaponResult(details);

    const amount = finiteText(details.amount);
    if (details.kind === "repair") {
      if (details.outcome === "score") return `HP 최대 · 점수 +${amount || "보너스"}`;
      return `수리 획득${amount ? ` · HP +${amount}` : ""}`;
    }
    if (details.kind === "armor") {
      const maxHealth = finiteText(details.maxHealth);
      return `장갑 강화${maxHealth ? ` · 최대 HP ${maxHealth}` : ""}`;
    }
    if (details.kind === "shield") {
      const maxShield = finiteText(details.maxShield);
      return `실드 강화${maxShield ? ` · 최대 ${maxShield}` : ""}`;
    }
    if (details.kind === "shieldDefense") {
      const level = finiteText(details.level);
      return `실드 방어 강화${level ? ` · ${level}단계` : ""}`;
    }
    if (details.kind === "drone") {
      const level = finiteText(details.level);
      return `드론 강화${level ? ` · ${level}단계` : ""}`;
    }
    if (details.kind === "bonus") return "특수 오버드라이브 · 100% 유지";
    return `${kindLabel(details.kind)} 획득`;
  }

  function playerHit(details) {
    if (details.outcome === "blocked") return "공격을 방어했습니다";
    const amount = finiteText(details.amount ?? details.damage);
    if (details.outcome === "shield") return `실드 피해${amount ? ` · ${amount}` : ""}`;
    return `HP 피해${amount ? ` · ${amount}` : ""}`;
  }

  function enemyDestroyed(details) {
    if (details.role === "boss") return "보스 격파";
    if (details.role === "midboss") return "중간 보스 격파";
    return "";
  }

  function bossSpawned(details) {
    const stage = finiteText(details.stage);
    return stage ? `스테이지 ${stage} 보스 접근` : "보스 접근 경고";
  }

  function text(event) {
    if (!event || typeof event.type !== "string") return "";
    const details = event.details || {};
    if (event.type === "special.used") return specialUsed(details);
    if (event.type === "special.failed") return specialFailed(details);
    if (event.type === "item.collected") return itemCollected(details);
    if (event.type === "player.hit") return playerHit(details);
    if (event.type === "enemy.destroyed") return enemyDestroyed(details);
    if (event.type === "boss.spawned") return bossSpawned(details);
    return "";
  }

  globalThis.GameFeedbackMessages = Object.freeze({ text });
})();
