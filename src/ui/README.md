# src/ui

## 역할

`src/ui`는 게임 화면 위에 표시되는 HUD와 overlay 정보를 담당한다.

## 파일 책임

- `game-hud.js`: HP, shield, stage, kill, distance, score, special meter, 상태 tag를 Canvas에 그린다.
- `game-overlay.js`: ready, paused, gameover 화면과 pause 정보 패널, 정보 버튼 hit test를 그린다.

## 경계

- UI는 gameplay 값을 계산하거나 보정하지 않는다.
- 표시할 값이 없으면 숨기거나 명확한 빈 상태로 둔다.
- HUD 문구와 정보 패널 데이터는 가능하면 `src/gameplay/game-info.js`와 config에서 받는다.
- overlay는 비실행 상태 표시만 소유한다. 실행 중 gameplay update, item drop, enemy lifecycle은 다루지 않는다.
