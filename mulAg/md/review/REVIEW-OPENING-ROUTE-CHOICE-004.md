# REVIEW: 기본 기체 오프닝과 route choice

## 수행 일시

2026-07-16 12:27:38 +09:00

## 참조한 todo

- `mulAg/md/todo/TODO-OPENING-ROUTE-CHOICE-004.md`

## 수행 내용

- ready의 기체 선택 UI와 숫자 action을 제거했다.
- `baseLaunch -> routeChoice -> combat` phase를 도입해 1초 동안 무장하지 않은 기본 기체를 먼저 보여 준다.
- Rapid/Energy/Spread/Nova 고정 선택 아이템을 한 번만 생성하고 하나 획득 시 나머지를 제거한다.
- 이후 weapon drop과 morph는 선택 route로 잠근다.
- Restart는 route를 지우고 Continue는 route/강화/진행을 보존한다.

## 변경/생성 파일

- run/session/loop/collectible 관련 gameplay·system 파일
- `src/ui/game-overlay.js`, 삭제된 `src/ui/loadout-selector.js`
- `tests/opening-route-choice.test.mjs`, session/run/browser tests
- gameplay/project structure/UI 책임 문서

## 검증 내용

- 1초 전에는 적/일반 item이 없고 이후 네 선택 item만 생성됨을 Node test로 확인했다.
- 선택, 나머지 제거, adapter 호출 1회, 이후 drop/morph route lock을 자동 검증했다.
- browser smoke에서 base launch → route choice → combat → pause/info → restart-ready 경로가 PASS했다.

## 남은 이슈

- feature branch와 main의 실제 Pages 배포 및 live URL 증거가 아직 없다.

## QA 확인 요청 사항

- 기존 ready loadout 계약이 current code/docs에 남지 않았는지와 Restart/Continue 의미를 확인한다.
