# PLAN: 2D Canvas engine refactor

## 작성 일시

2026-05-18

## 목적

현재 `src/engine/game.js` 중심 구조를 Galaxy Runner 전용 오케스트레이터에서 재사용 가능한 2D Canvas 아케이드 런타임으로 분리한다.

## 배경

현재 `engine` 폴더는 이름과 달리 게임 루프, 입력, 월드 배열, 충돌, 스폰 규칙, 점수, HUD 일부, 무기별 특수 충돌을 함께 가진다.
이 구조는 빠르게 기능을 만들기에는 좋지만, 기능이 늘수록 `Game` 클래스가 계속 비대해지고 다른 2D 모드나 화면으로 재사용하기 어렵다.

## 목표 구조

```text
EngineRuntime
  -> CanvasSurface
  -> FrameClock
  -> InputState
  -> SceneManager
  -> World / EntityStore
  -> Collision / Render / Asset helpers

GalaxyRunnerScene
  -> Galaxy Runner state
  -> spawn / score / stage / continue
  -> weapon / special / item / enemy systems
  -> HUD and game info rendering
```

## 엔진 책임

- Canvas/context/DPR 관리
- `requestAnimationFrame` 기반 loop와 `dt` 계산
- scene lifecycle (`enter`, `update`, `draw`, `exit`)
- input 상태와 action mapping 기반 입력 조회
- entity group 보관, update/draw 순서, 제거 정책
- collision primitive와 query helper
- asset preload, load/error 상태, sprite atlas helper
- debug hook과 계측 지점

## 게임 책임

- `rapid`, `energy`, `spread`, `nova` 같은 무기 정체성
- 특수기 meter/cost/tier/effect 규칙
- 적/보스 스폰 규칙
- 점수, stage, danger, continue
- item 효과와 드랍 확률
- Galaxy Runner HUD 문구와 정보 패널
- player final-form 렌더링 정책

## 실행 순서

1. `TODO-ENGINE-001`: 엔진 계약 문서와 폴더 책임 문서 작성
2. `TODO-ENGINE-002`: `EngineRuntime`, `FrameClock`, `CanvasSurface` 도입
3. `TODO-ENGINE-003`: scene lifecycle과 input action mapping 분리
4. `TODO-ENGINE-004`: `World`, `EntityStore`, collision query 도입
5. `TODO-ENGINE-005`: asset/render/debug helper 정리와 QA 회귀 검증

## 서브에이전트 운영 방식

- 각 TODO는 독립 서브에이전트가 맡을 수 있는 경계로 작성한다.
- 서브에이전트는 자기 TODO에 명시된 파일 범위 밖 변경을 최소화한다.
- 범위 밖 변경이 필요하면 review 문서의 `QA 확인 요청 사항`에 남긴다.
- 코드 변경이 있는 TODO는 관련 문서도 함께 갱신한다.
- 완료 후 `mulAg/md/review/REVIEW-ENGINE-00N.md`를 작성한다.

## 선행 조건

- 현재 스테이징된 1차 개선 묶음과 보류된 asset/visual cleanup 변경을 구분한 상태를 유지한다.
- 엔진화 작업은 asset 대량 삭제 또는 startup picker 제거와 섞이지 않게 별도 단위로 진행한다.
- `pnpm`/`package.json`이 없는 현재 검증 제약을 review에 명시한다.

## 완료 기준

- `Game` 또는 후속 scene 클래스가 엔진 루프를 직접 소유하지 않는다.
- 엔진 폴더의 공통 모듈이 Galaxy Runner 전용 무기/점수/스폰/아이템 값을 직접 알지 않는다.
- Galaxy Runner는 `Scene`으로 실행된다.
- 입력은 raw key 대신 action mapping을 통해 게임 규칙으로 전달된다.
- entity 배열 관리와 충돌 query는 공통 helper를 통해 수행된다.
- `node --check src/**/*.js`가 통과한다.
