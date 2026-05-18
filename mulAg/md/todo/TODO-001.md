# TODO-001: 게임 엔진 안정성 및 입력/루프 견고화

## 목적

- `requestAnimationFrame` 루프, 입력 바인딩, 게임 상태 전이에서 발생 가능한 런타임 취약점을 정리한다.
- 게임 시작/중단/재시작/일시정지/계속 진행 경계에서 예외가 발생해도 복구되도록 정합성을 높인다.

## 상태 추적 (2026-05-18)

- 진행 상태: REVIEW-001(부분완료) 제출
- 증빙: `mulAg/md/review/REVIEW-001.md`
- 미해결 이슈: 인스턴스 싱글톤 가드, `InputController.destroy` 호출 흐름, 루프 정지 제어 시그니처
- 다음 단계: QA 수동 검증 및 필요시 TODO-001 리오픈 또는 TODO-001-보완 작성

## 작업 범위

- 입력 시스템과 게임 상태 전이의 책임 경계 분리.
- 핵심 루프 시작 조건과 가드 조건 보강.
- 자산 로딩/시작 순서의 결함 대응.

## 수정 가능 파일

- `src/engine/input.js`
- `src/engine/game.js`
- `src/main.js`

## 읽기 전용 파일

- `mulAg/md/plan/PLAN-2026-05-18-game-improvement.md`
- `src/core/constants.js`
- `src/core/asset-loader.js`

## 수정 금지 파일

- `mulAg/md/done/*`
- `mulAg/md/review/*`

## 입력

- 입력 파일:
  - [Plan 문서](D:/PROJ/galaxy-runner-canvas/mulAg/md/plan/PLAN-2026-05-18-game-improvement.md)
  - 현재 게임 상태 전이 코드 (`src/engine/game.js`, `src/engine/input.js`, `src/main.js`)
- 입력 데이터 구조:
  - `GAME_CONFIG.initialState`, `INPUT_CONFIG`
- 참조해야 할 함수/클래스:
  - `Game.start`, `Game.continueRun`, `Game.reset`, `InputController.handleKeyDown`
- 변경하지 말아야 할 인터페이스:
  - `game.frame`, `requestAnimationFrame` 호출 인터페이스

## 출력

- 생성/수정 파일:
  - `src/engine/input.js`
  - `src/engine/game.js`
  - `src/main.js`
- 반환 형식:
  - 동작 변경 후 `review` 문서에서 실행 항목을 체크리스트로 제출
- 외부에서 참조할 함수/클래스:
  - `Game`, `InputController`
- 유지해야 할 호환성:
  - 기존 키 맵/조작 동작(기능 레벨)은 유지

## 작업 단계

- [ ] `InputController` 이벤트 바인딩을 중복 등록 없이 한 번만 등록되도록 정리
- [ ] `Game.start/continueRun/reset` 상태 전이 경계 가드 강화
- [ ] `main.js`에서 캔버스/버튼 nil 체크 및 안전 초기화 처리
- [ ] 게임 오버/재시작/계속 진행에서 생명주기 플래그 정합성 점검
- [ ] 자산 로딩 지연으로 인한 초기 렌더링 예외 대응(필요 시 방어 코드 추가)

## 완료 기준

- 에러 로그 없이 새로고침/탭 복귀/연속 입력 시도 시 게임이 비정상 종료되지 않는다.
- 게임 상태 전이(ready/running/paused/gameover)가 서로 충돌 없이 동작한다.
- 키 입력 이벤트가 1회성 바인딩으로 동작하고, 동일 동작이 이중 반응하지 않는다.
- TODO 수행 항목별 결과가 review 문서에 기록된다.

## 주의사항

- 기존 입력 키 맵(공개 키 구성)은 유지한다.
- Sub-Agent는 이 TODO의 범위를 벗어나 `game-config.js` 값만 수정하지 않는다.
