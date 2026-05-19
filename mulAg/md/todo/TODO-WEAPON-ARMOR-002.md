# TODO: Weapon feel redesign first pass

## 목적

Rapid, Energy, Nova의 일반공격 체감을 강화하고, 특수공격과 역할을 구분한다.

## 참조 plan

- `mulAg/md/plan/PLAN-2026-05-19-weapon-armor-redesign.md`

## 작업 범위

- Rapid 일반공격을 얇고 짧은 pulse laser처럼 보이게 한다.
- Rapid 특수공격 `rapidBeam`은 지속 대형 beam으로 유지한다.
- Energy 레벨별 radius, absorbLevel, damage scaling 체감을 키운다.
- Nova 레벨별 radius, blastRadius, blastDuration, damage scaling 체감을 키운다.

## 선행 조건

- 없음

## 수정 가능 파일

- `src/gameplay/weapon-catalog.js`
- `src/systems/weapon-system.js`
- `src/entities/projectile.js`

## 생성 가능 파일

- 없음

## 읽기 전용 파일

- `mulAg/md/plan/PLAN-2026-05-19-weapon-armor-redesign.md`
- `src/gameplay/game-config.js`
- `src/entities/enemy.js`

## 수정 금지 파일

- `src/core/constants.js`
- `src/gameplay/game-config.js`
- `src/entities/enemy.js`

## 입력

- 입력 파일: 참조 plan, weapon catalog, weapon system, projectile renderer
- 입력 데이터 구조: `WeaponCatalog.DEFINITIONS`, `WeaponSystem.mainShot`, `Projectile.drawRapidShot`
- 참조해야 할 함수/클래스: `WeaponCatalog.projectileRadius`, `WeaponSystem.scaledWeaponDamage`
- 변경하지 말아야 할 인터페이스: `game.addBullet(...)` 호출 계약

## 출력

- 생성/수정 파일: 수정 가능 파일 목록
- 반환 형식: 기존 projectile option object 유지
- 외부에서 참조할 함수/클래스: 기존 `WeaponCatalog`/`WeaponSystem` API 유지
- 유지해야 할 호환성: Rapid special `rapidBeam` 동작 유지

## 작업 단계

- [ ] 1. Rapid 일반 projectile 렌더링을 pulse laser 시각으로 변경한다.
- [ ] 2. Rapid special beam 렌더링/동작은 변경하지 않는다.
- [ ] 3. Energy 일반공격 레벨별 radius/absorbLevel/damage scaling을 강화한다.
- [ ] 4. Nova 일반공격 레벨별 radius/blastRadius/blastDuration/damage scaling을 강화한다.

## 완료 기준

- Rapid 일반공격과 특수공격이 시각/역할상 구분된다.
- Energy 레벨 상승 시 방어막 구체로서 체감이 증가한다.
- Nova 레벨 상승 시 고데미지 폭발탄 체감이 증가한다.
- 충돌 시스템 자체는 변경하지 않는다.

## 주의사항

- 다른 Sub-Agent가 enemy armor와 damage contract를 수정할 수 있으므로 수정 금지 파일을 건드리지 않는다.
