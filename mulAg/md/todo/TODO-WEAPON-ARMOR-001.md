# TODO: Flat armor and enemy damage contract

## 목적

적 role별 flat armor와 플레이어 무기 데미지 상향을 적용해, 빠른 약타와 느린 강타의 상성을 만든다.

## 참조 plan

- `mulAg/md/plan/PLAN-2026-05-19-weapon-armor-redesign.md`

## 작업 범위

- 전체 플레이어 무기 데미지 배율을 정의한다.
- 적 role별 armor 값을 정의한다.
- 적 HP 피해에 `max(1, rawDamage - armor)` 공식을 적용한다.
- Energy 데미지/흡수 공통 판정을 키운다.

## 선행 조건

- 없음

## 수정 가능 파일

- `src/core/constants.js`
- `src/gameplay/game-config.js`
- `src/entities/enemy.js`

## 생성 가능 파일

- 없음

## 읽기 전용 파일

- `mulAg/md/plan/PLAN-2026-05-19-weapon-armor-redesign.md`
- `docs/GAMEPLAY_SYSTEMS.md`

## 수정 금지 파일

- `src/gameplay/weapon-catalog.js`
- `src/systems/weapon-system.js`
- `src/entities/projectile.js`

## 입력

- 입력 파일: 참조 plan, enemy role config, enemy damage handling
- 입력 데이터 구조: `BALANCE`, `ENEMY_CONFIG.roles`, `Enemy.receiveDamage`
- 참조해야 할 함수/클래스: `Enemy.setupStats`, `Enemy.receiveDamage`
- 변경하지 말아야 할 인터페이스: `Enemy.receiveHit(projectile)` 호출 계약

## 출력

- 생성/수정 파일: 수정 가능 파일 목록
- 반환 형식: 기존 damage result object 유지
- 외부에서 참조할 함수/클래스: `BALANCE.weaponDamageMultiplier`, enemy `armor`
- 유지해야 할 호환성: Guardian shield 흡수 흐름은 유지

## 작업 단계

- [ ] 1. `BALANCE`에 플레이어 무기 데미지 배율을 추가한다.
- [ ] 2. `ENEMY_CONFIG.roles`에 role별 armor 값을 추가한다.
- [ ] 3. `Enemy.setupStats`에서 `this.armor`를 설정한다.
- [ ] 4. `Enemy.receiveDamage`에서 shield 흡수 후 HP 피해에 armor 공식을 적용한다.
- [ ] 5. Energy hit radius를 방어막 감각에 맞게 확대한다.

## 완료 기준

- 모든 enemy role에 armor가 명시되어 있다.
- HP 피해는 `max(1, rawDamage - armor)`로 계산된다.
- Guardian shield는 기존처럼 먼저 damage를 흡수한다.
- Energy 일반/특수 탄의 데미지와 흡수 판정은 동일한 hit radius를 사용한다.

## 주의사항

- 다른 Sub-Agent가 무기 발사/렌더링 파일을 수정할 수 있으므로 수정 금지 파일을 건드리지 않는다.
