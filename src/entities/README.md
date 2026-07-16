# src/entities

## 역할

`src/entities`는 게임 world에 배치되는 객체의 상태와 객체 단위 동작을 담당한다.

## 파일 책임

- `player.js`: 플레이어 상태, 이동/발사 호출, 방어/쉴드/드론 상태와 rig adapter 수명주기. 방어·획득·애니메이션 계산과 ship asset draw는 전용 모듈에 위임한다.
- `enemy.js`: 일반 적, 특수 적, 중간 보스, 스테이지 보스 entity 상태와 공격/발사/렌더 프레임.
- `projectile.js`: 플레이어/적 투사체 상태, 이동, 수명, hit interval, hit radius, homing/follow/beam/mine 계약. 렌더링은 `src/renderers/projectile-*.js`에 위임한다.
- `collectible-item.js`: 필드 아이템 생성, morph, bounce, pickup 대상 종류.
- `burst-particle.js`, `nova-explosion.js`: 짧은 수명 visual/effect entity.

## 경계

- entity는 자기 상태와 객체 단위 규칙만 가진다.
- stage 진행, 점수, spawn budget, 전체 collision loop는 `Game` 또는 system 계층의 책임이다.
- 한 entity가 내부 catalog 값을 만들면 안 되며, 필요한 값은 `src/gameplay` 계약에서 받아야 한다.
- `Player`는 `PlayerDefenseSystem`과 `PlayerProgressionSystem`의 결과 상태를 보유하지만 해당 계산 규칙을 중복 소유하지 않는다.
- `Player`는 현재 수평 입력값만 engine bank pose 목표로 제공한다. bank 진입·복귀·방향 반전 보간과 전체 이미지 rigid transform은 공통 animation engine이 소유한다.
