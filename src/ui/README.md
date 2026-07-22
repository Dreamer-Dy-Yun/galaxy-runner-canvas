# src/ui

## 역할

`src/ui`는 게임 화면 위에 표시되는 HUD와 overlay 정보를 담당한다.

## 파일 책임

- `game-hud.js`: HP, shield, stage, kill, distance, score, special meter, 상태 tag를 Canvas에 그린다.
- `game-overlay.js`: ready, paused, gameover 화면과 pause 정보 패널, 정보 버튼 hit test를 그린다.
- `loadout-selector.js`: ready 화면의 4종 시작 함선 선택 상태를 읽어 카드로 표시한다.
- `game-feedback-messages.js`: semantic feedback event를 한국어 사용자 문구로 변환한다.
- `game-feedback.js`: 현재 transient feedback 한 건을 기존 Canvas 리듬의 toast로 그린다.
- `game-accessibility.js`: semantic feedback를 기존 aria-live node에 전달한다.

## 경계

- UI는 gameplay 값을 계산하거나 보정하지 않는다.
- 표시할 값이 없으면 숨기거나 명확한 빈 상태로 둔다.
- HUD 문구와 정보 패널 데이터는 가능하면 `src/gameplay/game-info.js`와 config에서 받는다.
- overlay는 비실행 상태 표시만 소유한다. 실행 중 gameplay update, item drop, enemy lifecycle은 다루지 않는다.
- loadout selector는 선택을 변경하지 않으며 `RunRules`와 game state를 읽어 표시만 한다.
- feedback UI는 semantic details를 표시할 뿐 gameplay 성공·실패를 다시 계산하지 않는다.
