# TODO-002: 게임플레이 계약 정합성(밸런스·아이템·무기) 정리

## 목적

- 무기, 아이템, 적 난이도/점수 정책의 단일 규칙화를 통해 계약 불일치를 제거한다.
- 데이터 계약 변경 시 문서와 코드가 동기화되도록 고정점검 기준을 둔다.

## 상태 추적 (2026-05-18)

- 진행 상태: 대기
- 증빙: 해당 TODO에 대한 review 아직 미작성
- 선행 조건: TODO-001 부분검토 후 실행 승인

## 작업 범위

- 무기 카탈로그, 아이템 정의, 게임 설정값의 우선순위 정리.
- 점수/거리/난이도 계산 경로의 산출 기준 일치화.
- 게임 정보 패널 텍스트와 실제 값의 불일치 점검.

## 수정 가능 파일

- `src/gameplay/game-config.js`
- `src/gameplay/item-definitions.js`
- `src/gameplay/weapon-catalog.js`
- `src/gameplay/game-info.js`
- `docs/GAMEPLAY_SYSTEMS.md`

## 읽기 전용 파일

- `mulAg/md/plan/PLAN-2026-05-18-game-improvement.md`
- `src/entities/player.js`
- `src/entities/enemy.js`
- `src/entities/collectible-item.js`

## 수정 금지 파일

- `mulAg/md/done/*`
- `mulAg/md/review/*`

## 입력

- 입력 파일:
  - [Plan 문서](D:/PROJ/galaxy-runner-canvas/mulAg/md/plan/PLAN-2026-05-18-game-improvement.md)
  - `docs/GAMEPLAY_SYSTEMS.md`와 현재 구현 코드
- 입력 데이터 구조:
  - `GAME_CONFIG`, `ENEMY_CONFIG`, `SPECIAL_CONFIG`, `ITEM_DEFINITIONS`, `WEAPON_KINDS`
- 참조해야 할 함수/클래스:
  - `WeaponCatalog.itemDefinitions`, `WeaponCatalog.maxLevel`, `CollectibleItem.pickKind`
- 변경하지 말아야 할 인터페이스:
  - 아이템 `kind` 열거형의 공개 문자열 이름(현재 시스템 연동용)

## 출력

- 생성/수정 파일:
  - `src/gameplay/game-config.js`
  - `src/gameplay/item-definitions.js`
  - `src/gameplay/weapon-catalog.js`
  - `src/gameplay/game-info.js`
  - `docs/GAMEPLAY_SYSTEMS.md`
- 반환 형식:
  - 변경된 계약-코드 매핑 표를 REVIEW에 첨부
- 외부에서 참조할 함수/클래스:
  - `WeaponCatalog`, `WeaponSystem`, `CollectibleItem`
- 유지해야 할 호환성:
  - 기존 아이템/무기 문자열 토큰(`repair`, `armor`, `rapid`, `energy`, 등) 호환성 유지

## 작업 단계

- [ ] 밸런스 상수의 소스 오너십 정리(예: 스피드/데미지/드랍/회복 값을 소스 위치로 정착)
- [ ] 아이템 가중치/카테고리 룰과 실제 드랍 규칙 정합성 점검
- [ ] 무기 레벨/최대 레벨/코어 레벨 해석 규칙을 문서와 코드로 동일하게 정리
- [ ] 점수 산정(`enemyScore`)와 표시(`GAME_INFO`)의 문구 일치 검증
- [ ] TODO 산출물에 변경 전/후 차이와 리스크를 기록

## 완료 기준

- 아이템/무기/난이도 규칙이 코드 및 문서 모두에서 같은 값 기준으로 설명됨.
- 변경 지점이 명확히 한 군데에서 읽히도록 구조화되고, 임의 하드코딩이 줄어든다.
- 게임 패널/정보 텍스트와 실제 보정 규칙이 일치한다.

## 주의사항

- 기존 API 토큰(문자열 키) 기반 연동은 유지한다.
- 보정 수치 변경은 문서에서 변경 이유를 반드시 기록한다.
