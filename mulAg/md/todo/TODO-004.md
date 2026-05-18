# TODO-004: 충돌·프로젝트타일 성능 하드닝

## 목적

- 적/탄환/아이템 업데이트에서 반복 계산량을 줄여 프레임 안정성을 높인다.
- 빈번한 배열 조작과 충돌 검사 경로를 안전하게 정리한다.

## 상태 추적 (2026-05-18)

- 진행 상태: 대기
- 증빙: 해당 TODO에 대한 review 아직 미작성
- 선행 조건: TODO-001 검증 결과 승인

## 작업 범위

- 적/탄환/아이템 갱신 경로의 계산량 감소.
- 충돌 검사에서 중복 탐색 및 불필요 객체 생성을 줄이기.
- 드론/아이템/특수 이펙트의 갱신 빈도 조정 및 정합성 점검.

## 수정 가능 파일

- `src/entities/enemy.js`
- `src/entities/projectile.js`
- `src/entities/collectible-item.js`
- `src/systems/drone-system.js`
- `src/renderers/space-background.js`
- `src/entities/burst-particle.js`
- `src/engine/game.js`
- `src/entities/player.js`
- `src/entities/nova-explosion.js`
- `src/ui/game-hud.js`
- `src/engine/game.js`
- `src/entities/player.js`
- `src/entities/nova-explosion.js`
- `src/ui/game-hud.js`

## 읽기 전용 파일

- `src/systems/special-system.js`
- `src/systems/weapon-system.js`

## 수정 금지 파일

- `mulAg/md/done/*`
- `mulAg/md/review/*`

## 입력

- 입력 파일:
  - [Plan 문서](D:/PROJ/galaxy-runner-canvas/mulAg/md/plan/PLAN-2026-05-18-game-improvement.md)
- 입력 데이터 구조:
  - `ENEMY_CONFIG`, `SPECIAL_CONFIG`, `ITEM_FIELD_CONFIG`, `DRONE_CONFIG`, `BACKGROUND_CONFIG`
- 참조해야 할 함수/클래스:
  - `Enemy.update`, `Projectile.update`, `CollectibleItem.update`
  - `DroneSystem.count/upgradeCount/fireDelay`
- 변경하지 말아야 할 인터페이스:
  - `Enemy`/`Projectile`/`CollectibleItem` 공개 속성 기반 렌더링 계약

## 출력

- 생성/수정 파일:
  - `src/entities/enemy.js`
  - `src/entities/projectile.js`
  - `src/entities/collectible-item.js`
  - `src/systems/drone-system.js`
  - `src/renderers/space-background.js`
- 반환 형식:
  - 개선 전/후 병목 지점과 효과를 기록한 리뷰 항목
- 외부에서 참조할 함수/클래스:
  - `Enemy`, `Projectile`, `CollectibleItem`, `DroneSystem`
- 유지해야 할 호환성:
  - 충돌 판정 규칙(명중 판정, 생존 조건, 소멸 조건)은 유지

## 현재 진행 반영(2026-05-18)

- 핵심 범위를 `src/engine/game.js`, `src/entities/player.js`, `src/entities/collectible-item.js`, `src/entities/nova-explosion.js`, `src/ui/game-hud.js`로 확장.
- `game.js`: 충돌 대상 캐시 재사용(에너지 흡수탄/노바 지뢰), 보스 존재 O(1) 체크로 `hasBossEnemy` 스캔 제거, 아이템 제거를 splice 기반에서 tail-compaction으로 변경, 불필요 객체/배열 생성 최소화(노바 지뢰 캐시 재사용 및 nova 목록 길이 캐시), RAF delta는 `clampNumber` 기반으로 고정 최대/음수 가드 적용.
- `player.js`: `droneSlots()`의 매 프레임 `Array.from` 생성 제거, `droneSlotsCache` 재사용.
- `collectible-item.js`: `bounce` 경계 패딩을 한 번 계산해 매 프레임 재산정 제거.
- `nova-explosion.js`: 적 목록 스냅샷 복사(`[...]`) 제거 후 역방향 배열 순회로 충돌/대미지 루프 단순화.
- `src/ui/game-hud.js`: 방어력 값 계산 중복 호출(armor/방어력) 최소화.

## 작업 단계

- [ ] `Projectile`의 `hitCooldowns` 및 타깃 캐싱 전략 점검
- [ ] `Enemy` `update`에서 이동/행동 계산 분기를 정리해 불필요 분기 감소
- [ ] `CollectibleItem` `updateMorph`/`bounceWithinField` 호출 빈도/조건 정리
- [ ] 드론 발사 스케줄 계산에서 중복 산출량 감축
- [ ] 배경 업데이트 비용(별 위치/패턴 갱신)에서 상수 오버헤드 정리

## 완료 상태

- [x] `src/engine/game.js`: 충돌 대상 캐시 재사용 + bossCount + 프레임/루프 정리
- [x] `src/entities/player.js`: 드론 슬롯 캐시화
- [x] `src/entities/collectible-item.js`: `bounce` 경계 계산 재사용
- [x] `src/entities/nova-explosion.js`: `[...game.enemies]` 복사 제거
- [x] `src/ui/game-hud.js`: 방어력 계산 중복 감소

## 완료 기준

- 동일 조건에서 충돌 판정 결과와 삭제/생존 조건이 바뀌지 않는다.
- 반복 객체 생성/스캔이 줄어든 변경 포인트를 리뷰에 수치 또는 근거로 제출한다.
- 플레이 체감에서 프레임 드랍이 줄었다는 정성/정량 확인을 남긴다.

## 주의사항

- 성능 개선 명분으로 게임 플레이 규칙(샷 수/데미지/탐지 범위) 임의 축소는 금지.
- 규칙 변경이 필요한 경우 바로 TODO 보강 항목으로 기록한다.
