# src/systems

## 역할

`src/systems`는 entity 밖에서 재사용되는 gameplay 계산과 bounded orchestration을 담당한다.

## 파일 책임

- `game-session-system.js`: start, continue, pause, restart, pause overlay click 같은 session mode 전환.
- `game-loop-system.js`: running frame의 timer, spawn cadence, update 순서 orchestration.
- `weapon-system.js`: 현재 무기의 이동, 발사, 피해 계산과 projectile spec 생성.
- `special-system.js`: 특수기 meter, cost, 발동 조건, 무기별 특수기 생성.
- `game-feedback-system.js`: gameplay 의미 event의 immutable payload, 우선순위, transient 수명과 subscriber 경계.
- `player-defense-system.js`: 플레이어 방어 profile snapshot, 실제 flat cap, 최소 HP 피해 계산.
- `player-progression-system.js`: 아이템 획득 결과와 무기 장착/레벨·core 전이, immutable rig from/to 의미 snapshot.
- `player-rig-animation-adapter.js`: Player 이동·획득 결과를 공통 `RigAnimationEngine` request와 bank pose 목표로 변환하며 보간 알고리즘은 소유하지 않는다.
- `drone-system.js`: 드론 개수, 업그레이드, 발사 주기, 피해 계산.
- `boss-ai.js`: 스테이지 보스 phase, 약점 vulnerability, pattern 선택, 보스 전용 렌더 프레임.
- `enemy-spawn-system.js`: 일반 적, train formation, midboss, boss, splitter child 생성과 stage advance.
- `enemy-lifecycle-system.js`: 적 업데이트 중 피격, 충돌, 사망 보상, 분열, 아이템 드랍, 점수 계산.
- `projectile-lifecycle-system.js`: friendly/hostile projectile update, energy absorb, nova mine detonation, nova explosion.
- `collectible-lifecycle-system.js`: item spawn, route 선택, expired cleanup, player pickup collision, progression 결과의 rig adapter 전달.
- `effect-lifecycle-system.js`: burst particle 생성, explosion/particle cleanup.

## 경계

- system은 DOM event와 Canvas lifecycle을 소유하지 않는다.
- system은 entity 상태를 읽고 필요한 변경을 수행하되, `Game` facade를 통해 world와 scene state에 접근한다.
- 입력은 action 이름 기준으로 받아야 하며 raw key code를 직접 해석하지 않는다.
- `Game`은 기존 호출 호환을 위한 얇은 위임과 scene state 소유만 유지한다.
- 플레이어 방어와 획득 계산은 `Player`에 중복 구현하지 않고 전용 system으로 위임한다.
- feedback system은 사용자 문구, Canvas, DOM, Audio를 소유하지 않는다.
- adapter는 detach/attach timer나 Canvas drawing을 소유하지 않고 engine request 변환만 담당한다.
