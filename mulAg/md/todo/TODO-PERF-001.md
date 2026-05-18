# TODO-PERF-001 Startup frame stability

## 배경

게임 초반에 약간의 버벅임이 체감된다. 1차로 에셋 요청 분산, atlas warm-up, 배경 gradient cache를 적용했지만, 엔진 수준의 계측과 풀링은 아직 남아 있다.

## 남은 작업

- `EngineRuntime` 프레임 계측 추가
- `DebugOverlay`에 frame/update/draw 비용 표시
- `AssetLoader` preload/decode 계약 확장
- `ProjectilePool` 설계 및 적용
- `BurstParticlePool` 설계 및 적용
- 실제 브라우저에서 시작 후 5초 frame spike 기록

## 2차 적용

- `src/engine/debug/frame-profiler.js` 추가
- `src/engine/assets/asset-preloader.js` 추가
- debug overlay 활성화 시 frame/update/draw 비용 표시
- `AssetLoader.image()` 경로에 decode 예약 보강

## 남은 작업

- `ProjectilePool` 설계 및 적용
- `BurstParticlePool` 설계 및 적용
- 실제 브라우저에서 시작 후 5초 frame spike 기록

## 완료 기준

- 시작 후 5초 동안 반복적인 긴 프레임이 줄어든다.
- debug overlay에서 update/draw 중 어느 경로가 spike를 만드는지 확인할 수 있다.
- projectile/burst 대량 생성 시 GC spike가 줄어든다.
