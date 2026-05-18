# PLAN-2026-05-18-startup-performance

## 목적

- 게임 초반 프레임 버벅임을 줄인다.
- 엔진 런타임과 렌더러가 시작 직후 에셋 로딩, atlas 생성, Canvas 리소스 생성을 한 프레임에 몰아넣지 않게 한다.
- 최적화는 체감 개선이 큰 순서로 적용하고, 남은 계측/풀링 작업은 별도 TODO로 추적한다.

## 1차 적용 범위

- `src/renderers/final-ship-art.js`
  - 모든 final-form 이미지를 생성자에서 즉시 요청하던 구조를 lazy load로 변경한다.
  - 기본 무기 1레벨 이미지만 critical preload로 요청한다.
  - 나머지 final-form 이미지는 idle callback 또는 지연 타이머로 batch preload한다.
- `src/entities/projectile.js`
  - projectile atlas warm-up 진입점을 제공한다.
- `src/entities/enemy.js`
  - enemy atlas warm-up 진입점을 제공한다.
- `src/renderers/item-icon-renderer.js`
  - 아이콘 이미지 참조를 renderer 내부 cache 뒤에 둔다.
  - 시작 시점 warm-up 진입점을 제공한다.
- `src/renderers/space-background.js`
  - 배경 gradient를 매 프레임 생성하지 않고 cache한다.
- `src/main.js`
  - 게임 생성 전에 startup asset warm-up을 실행한다.

## 남은 작업

- 엔진 런타임 계측
  - `frameMs`, `updateMs`, `drawMs`, spike max/p95 기록
  - debug overlay에 최근 프레임 비용 표시
- AssetLoader 디코딩 계약 확장
  - `HTMLImageElement.decode()` 기반 ready/preload 흐름 검토
  - critical/deferred asset group 계약 문서화
- 엔티티 풀링
  - `ProjectilePool`
  - `BurstParticlePool`
  - pool 적용 전후 생성량과 GC spike 비교

## 주의

- 이번 1차 변경은 검증 명령을 실행하지 않았다.
- 체감 개선은 브라우저에서 실제 프레임 spike를 확인해야 최종 판단할 수 있다.
