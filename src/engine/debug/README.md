# src/engine/debug

## 역할

- 엔진 런타임을 직접 변경하지 않고 진단 정보를 수집하거나 표시하는 개발 보조 계층이다.

## 파일

- `debug-overlay.js`
  - debug query/storage flag를 기준으로 런타임 위에 디버그 HUD를 표시한다.
  - world/entity 상태처럼 게임 구조를 이해하는 진단 정보를 다룬다.
- `frame-profiler.js`
  - scene update/draw와 runtime frame 비용을 측정한다.
  - 최근 샘플 평균, p95, max, 시작 구간 spike 수를 제공한다.
  - 게임 로직이 profiler API를 직접 호출하지 않도록 runtime/scene을 바깥에서 감싼다.

## 경계

- debug 계층은 게임 결과를 바꾸지 않는다.
- 성능 최적화 판단에 필요한 계측만 제공하며, gameplay 수치나 렌더링 정책은 소유하지 않는다.
