# src/gameplay

## 역할

`src/gameplay`는 Galaxy Runner의 데이터 계약과 balance source를 담는다. 화면이나 entity가 임의의 gameplay 값을 만들지 않도록 catalog와 config를 제공한다.

## 파일 책임

- `game-config.js`: 플레이필드, balance, spawn, 적/보스, HUD, item field, special 등 런타임 조정값.
- `run-rules.js`: 기본 기체 공개, 4노선 선택, 선택 노선 고정, Assist Continue 설정과 판별 계약.
- `player-rig-catalog.js`: 승인된 기본/final-form 안정 snapshot, transition-only assetKey와 실제 경로 계약.
- `player-animation-profiles.js`: 공통 엔진이 소비하는 bank 응답 시간, detach·attach phase와 태그별 이동 parameter.
- `player-defense-rules.js`: 플레이어 기체별 방어 profile, flat cap, 최소 HP 피해 계약.
- `weapon-definition.js`: 무기 정의 정규화와 `WeaponDefinition` 계약.
- `weapon-catalog.js`: `WeaponCatalog` public accessor.
- `weapon-definitions.js`: 무기 종류, 진행 cap, item metadata, projectile/footprint/asset concrete data.
- `item-definitions.js`: 필드 아이템과 HUD/help에서 쓰는 item metadata.
- `game-info.js`: pause 정보 패널에 표시되는 ship/item 설명과 배치 설정.

## 경계

- 정상적인 생략 옵션은 조용한 기본값으로 처리한다.
- 알 수 없는 kind, 잘못된 타입, 계약 누락은 경고로 드러낸다.
- gameplay 파일은 DOM, Canvas drawing, input event를 직접 다루지 않는다.
- run/defense 규칙은 상태를 직접 변경하지 않으며 system과 UI가 같은 공개 계약을 읽는다.
- rig catalog/profile은 이미지 로딩, 시간 누적, Canvas 변환, weapon state 변경을 하지 않는다.
