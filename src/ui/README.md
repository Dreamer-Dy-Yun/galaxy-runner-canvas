# src/ui

## 역할

`src/ui`는 게임 화면 위에 표시되는 HUD와 overlay 정보를 담당한다.

## 파일 책임

- `game-hud.js`: HP, shield, stage, kill, distance, score, special meter, 상태 tag를 Canvas에 그린다.
- `game-overlay.js`: 기본 기체 출격을 안내하는 ready, paused, gameover 화면과 pause 정보 패널, 정보 버튼 hit test를 그린다.
- `game-feedback-messages.js`: semantic feedback event를 한국어 사용자 문구로 변환한다.
- `game-feedback.js`: 현재 transient feedback 한 건을 기존 Canvas 리듬의 toast로 그린다.
- `game-accessibility.js`: semantic feedback를 기존 aria-live node에 전달한다.

## 경계

- UI는 gameplay 값을 계산하거나 보정하지 않는다.
- 표시할 값이 없으면 숨기거나 명확한 빈 상태로 둔다.
- HUD 문구와 정보 패널 데이터는 가능하면 `src/gameplay/game-info.js`와 config에서 받는다.
- overlay는 비실행 상태 표시만 소유한다. 실행 중 gameplay update, item drop, enemy lifecycle은 다루지 않는다.
- ready overlay는 노선 선택을 제공하지 않는다. 실제 노선 선택은 running 상태의 고정 field item과 `CollectibleLifecycleSystem`이 담당한다.
- feedback UI는 semantic details를 표시할 뿐 gameplay 성공·실패를 다시 계산하지 않는다.
