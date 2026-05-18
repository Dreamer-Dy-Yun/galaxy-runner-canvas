# REVIEW: TODO-001 엔진 안정성 및 입력/루프 견고화

## 수행 일시

2026-05-18 12:00:00

최종 갱신: 2026-05-18

## 참조한 todo

- [TODO-001](/D:/PROJ/galaxy-runner-canvas/mulAg/md/todo/TODO-001.md)

## 수행 내용

- 게임 진입점에 캔버스/재시작 버튼 존재성 방어 로직 추가
- `InputController` 이벤트 바인딩을 바인딩 핸들러 보관 방식으로 변경하여 반복 바인딩 위험 축소
- `InputController` 종료 메서드(`destroy`) 추가로 향후 인스턴스 재생성 시 정리 경로 확보
- 동일 키 자동 반복(autorepeat)로 인한 중복 처리 방지 로직 추가 (`pause`, `start`, `restart`는 최초 눌림에서만 동작)
- 게임 상태 전이에서 비정상 상태 대응 강화 (`continueRun`, `togglePause`, `frame`)
- `Game.frame`에서 현재 프레임 타임 방어 처리 및 루프 핸들 저장 추가

## 변경 파일

- `src/main.js`
- `src/engine/input.js`
- `src/engine/game.js`

## 미변경 파일

- `src/core/constants.js`

## 경계 판단

- TODO-001의 계약 범위(루프/입력/상태 전이) 내에서만 코드 수정이 이루어졌는지 확인.
- `mulAg/md` 문서 체계(권한/흐름)와 충돌하지 않도록 review 출력 텍스트만 기록.
- `review` 산출물은 실행 증빙만 남기고, 원래 `done/*`은 덮어쓰지 않음.

## 검증 내용

- 정적 분석/구문 실행 테스트는 수행하지 않았고, 수동 동작 확인 대상은 다음과 같음
  - 게임 초기 진입 시 `#game`, `#restart` 누락 처리 시 콘솔 오류 메시지 출력
  - 자동 반복 키 이벤트에서 `Pause/Start/Restart` 동작의 중복 호출 감소
  - `gameover -> continue` 전이 시 `continueRun`만 허용되는 경로 확인
  - 프레임 타임이 유효하지 않을 때 프레임 루프 기본 동작 유지

## 남은 이슈

- `main.js`에서 게임 인스턴스 중복 생성 방지(싱글톤 가드)는 미적용.
- `InputController.destroy`는 구현되었으나 현재 게임 수명주기에서 호출하는 진입점은 아직 없음.
- `frame`에서 `requestAnimationFrame` 취소/중단을 위한 `stop` 시그니처는 미도입.

## QA 확인 요청 사항

- `TODO-001`의 완료 기준 항목(이중 반응 방지, 상태 전이 안정성)에 대해 브라우저에서 수동으로 확인 부탁
- 입력 자동반복 동작 중 게임이 일시 정지/재개 모드로 오동작하지 않는지 재검증 요청
- 필요 시 `frame` 중단/종료 시나리오(탭 변경, 스코프 전환 시) 추가 처리 여부 검토
