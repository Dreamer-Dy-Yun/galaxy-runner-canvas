# TODO: Rig 자산 계약과 Base/4노선 transition 자산 구축

## 목적

공통 엔진 입력으로 사용할 등록 파츠 자산과 immutable Player rig catalog를 정의하고, Base에서 네 노선의 승인된 완성본으로 전환하는 흐름과 same-route 강화 재결합을 검증한다.

## 참조 plan

- `mulAg/md/plan/active/PLAN-2026-07-16-opening-player-animation-redesign.md`

## 작업 범위

- 512x512 등록 캔버스, pivot, part id, assetKey, z-order 계약
- Base, Rapid/Energy/Spread/Nova transition 파츠와 승인된 final-form settle manifest
- direct image registrar와 sheet cell cropper의 별도 책임
- imagegen 전송물 크기 예외를 canonical 1024 source로 흡수하는 별도 source normalizer
- bank/detach/attach/settle contact sheet
- alpha bounds, pivot, manifest delta 자동 검증
- final-form-only 문서를 rig/fallback 계약으로 갱신

## 실행 조건

- TODO-001 review가 QA 승인되어 engine snapshot/profile 계약이 고정된 뒤 실행한다.
- 이미지 생성 작업을 시작할 때 `imagegen` 스킬 사용을 사용자에게 알린다.
- 승인된 final-form 자체는 생성하거나 교체하지 않는다.

## 수정 가능한 파일

- `assets/README.md`
- `docs/PLAYER_RIG_SPEC.md`
- `docs/PLAYER_ASSET_STYLE_GUIDE.md`
- `docs/AI_ASSET_PROMPT_RULES.md`
- `docs/PLAYER_SHIP_REDESIGN_V5.md`
- `src/gameplay/README.md`
- `tools/assets/README.md`

## 생성 가능한 파일

- `assets/player/rig/README.md`
- `assets/player/rig/base/**`
- `assets/player/rig/rapid/**`
- `assets/player/rig/energy/**`
- `assets/player/rig/spread/**`
- `assets/player/rig/nova/**`
- `tools/assets/rig-sources/**`
- `tools/assets/rig_asset_direct.py`
- `tools/assets/rig_asset_cropper.py`
- `tools/assets/rig_asset_pipeline.py`
- `tools/assets/rig_asset_source_normalizer.py`
- `tools/assets/test_rig_asset_source_normalizer.py`
- `tools/assets/test_rig_asset_pipeline.py`
- `src/gameplay/player-animation-profiles.js`
- `src/gameplay/player-rig-catalog.js`
- `tests/player-rig-catalog.test.mjs`
- `mulAg/md/review/REVIEW-RIG-ASSET-POC-002.md`

## 읽기 전용 파일

- `assets/player/player-registered-parts-v1.png`
- `assets/player/final-forms/rapid/**`
- `src/engine/animation/README.md`
- `src/engine/animation/rig-animation-engine.js`
- `src/engine/rendering/rig-animation-renderer.js`
- 참조 plan

## 수정 금지 파일

- `src/engine/**`
- `src/entities/**`
- `src/systems/**`
- `src/renderers/**`
- `src/ui/**`
- `galaxy-runner.html`

## 입력

- 입력 파일: 승인된 기본 기체, Rapid 완성 기체, TODO-001 engine contract
- 입력 데이터 구조: engine `RigSnapshot`, `TransitionProfile`
- 참조해야 할 함수/클래스: `RigAnimationEngine.start`, `RigAnimationRenderer.draw`
- 변경하지 말아야 할 인터페이스: engine snapshot 필드와 fallback status

## 출력

- 생성/수정 파일: Base/Rapid rig assets, catalog, profile, 검증 테스트, 관련 문서
- 반환 형식: frozen `RigSnapshot`
- 외부에서 참조할 함수/클래스: `PlayerRigCatalog.snapshot(kind, level)`, profile catalog lookup
- 유지해야 할 인터페이스: weapon kind와 level의 gameplay 의미

## 작업 단계

- [x] 1. 자산 원점, pivot, id, z-order, naming 계약을 문서화한다.
- [x] 2. direct registrar와 sheet cropper를 별도 모듈로 구현하고 단위 테스트한다.
- [x] 3. 단일 원본은 1024x1024 direct 입력, sheet 원본은 1024x1024 2x2 셀로 생성한다.
- [x] 4. chroma 제거 뒤 모든 runtime output을 512x512 RGBA로 등록한다.
- [x] 5. Base와 네 노선 transition 파츠를 제작하고 외곽 alpha bounds를 검증한다.
- [x] 6. 기존 네 노선 final-form PNG를 settled visual 정본으로 유지하는 catalog와 profile을 선언형 데이터로 작성한다.
- [x] 7. 동일 part id의 add/remove/replace delta를 자동 검증한다.
- [x] 8. 정지/bank/detach/attach/final settle을 실제 게임 경로에서 검수한다.
- [x] 9. 실제 게임 배율 preview와 review 문서를 작성한다.

## 완료 기준

- runtime crop 없이 등록 파츠가 같은 원점에서 합성된다.
- direct 처리와 sheet crop 처리가 서로 다른 모듈·테스트로 유지된다.
- sheet input은 정확히 1024x1024, output은 각각 512x512 RGBA다.
- runtime은 source sheet 또는 cropper를 참조하지 않는다.
- Base에서 네 노선 완성본으로 가는 구조 delta와, same-route 강화 시 transition-only 파츠의 분해·재결합 delta가 명시적이다.
- 모든 transition 완료 후에는 해당 노선의 기존 final-form PNG만 settled visual로 남는다.
- catalog/profile에 timeline 알고리즘이나 gameplay mutation이 없다.
- 누락 assetKey와 중복 part id가 테스트에서 실패한다.
- 레벨별 영구 외형을 임의 생성하지 않고도 네 노선 transition 품질을 판단할 수 있다.

## 주의사항

- 과거 evolution atlas를 그대로 복구하지 않는다.
- AI 결과를 검수 없이 production asset으로 채택하지 않는다.
- 완성 PNG는 이관 전 fallback으로 유지한다.
