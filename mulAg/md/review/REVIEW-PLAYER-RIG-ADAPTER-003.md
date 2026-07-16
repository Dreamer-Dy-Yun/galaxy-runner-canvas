# REVIEW: Player rig adapter와 renderer 통합

## 수행 일시

2026-07-16 12:27:38 +09:00

## 참조한 todo

- `mulAg/md/todo/TODO-PLAYER-RIG-ADAPTER-003.md`

## 수행 내용

- progression result에 frozen `rigChange.from/to`를 추가했다.
- adapter는 현재 수평 입력을 bank 목표값으로, progression result를 공통 engine request로만 변환한다.
- Player에 있던 lean 보간과 전체 이미지 scale/skew 왜곡을 제거했다.
- base rig reset 때부터 선언 profile을 활성화해 기본 기체도 engine bank pose를 사용한다.
- pause/resume가 assembly timeline과 pose interpolation 양쪽에 전달된다.

## 변경/생성 파일

- `src/systems/player-rig-animation-adapter.js`
- `src/renderers/player-rig-art.js`
- `src/systems/player-progression-system.js`
- `src/entities/player.js`
- `src/renderers/player-renderer.js`
- `tests/player-rig-animation.test.mjs`
- entities/systems/renderers 책임 문서

## 검증 내용

- base bank enter/hold/reverse/return/pause와 same-route upgrade를 자동 검증했다.
- transition asset 누락 시 `degraded=true`를 유지하며 승인된 target final-form으로 settle한다.
- adapter에는 duration/easing/diff/fallback 알고리즘이 없다.
- `player.js`는 애니메이션 책임을 추가하지 않고 순감소했다.

## 남은 이슈

- browser 자동화는 좌우 pose pixel diff를 정량 비교하지 않고 runtime/console contract를 확인한다.

## QA 확인 요청 사항

- 기본 기체와 final-form 모두 bank가 적용되고 shield/effect가 비균일 왜곡되지 않는지 확인한다.
