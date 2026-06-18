# docs

## 역할

`docs`는 플레이 가능한 Galaxy Runner의 구조, gameplay 계약, asset 제작 기준을 설명한다. 코드가 바뀌어 책임 경계나 gameplay 규칙이 달라지면 관련 문서를 함께 갱신한다.

## 주요 파일

- `PROJECT_STRUCTURE.md`: 루트 폴더, 런타임 source, asset, governance 문서의 책임 요약.
- `ENGINE_ARCHITECTURE.md`: 엔진과 Galaxy Runner 전용 game layer의 경계 계약.
- `GAMEPLAY_SYSTEMS.md`: 무기, 아이템, 적, 보스, 점수/진행 규칙.
- `PLAYER_*`, `AI_ASSET_PROMPT_RULES.md`: 플레이어 ship asset과 생성 기준.

## 경계

- 문서는 현재 코드의 계약을 설명해야 한다.
- 아직 코드와 맞지 않는 방향성은 확정된 사실처럼 쓰지 않고 TODO 또는 남은 이슈로 구분한다.
