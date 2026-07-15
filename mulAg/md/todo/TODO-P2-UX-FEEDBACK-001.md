# TODO-P2-UX-FEEDBACK-001: 피드백·접근성·SFX

## 목적

게임 판정을 바꾸지 않고 특수기·획득·전투 결과를 시각·접근성·선택적 소리로 전달한다.

## 참조 plan

`mulAg/md/plan/active/PLAN-2026-07-16-p1-p2-hardening.md`

## 작업 범위

- semantic feedback event와 transient 표시
- special/pickup/hit/kill/boss 결과 연결
- KeyI/KeyX, 한국어 UI, Canvas fallback/live region/focus
- lazy Web Audio와 mute persistence

## 선행 조건

- P1 run 계약 구현 완료

## 수정 가능 파일

- `src/systems/special-system.js`
- `src/systems/collectible-lifecycle-system.js`
- `src/systems/enemy-lifecycle-system.js`
- `src/systems/enemy-spawn-system.js`
- `src/systems/game-loop-system.js`
- `src/entities/player.js`
- `src/engine/input/action-map.js`
- `src/systems/game-session-system.js`
- `src/engine/game.js`
- `src/renderers/game-scene-renderer.js`
- `src/ui/game-hud.js`
- `src/ui/game-overlay.js`
- `src/gameplay/game-config.js`
- `src/gameplay/game-info.js`
- `src/main.js`
- `galaxy-runner.html`
- `index.html`
- `galaxy-runner.css`
- `README.md`
- `docs/GAMEPLAY_SYSTEMS.md`
- `docs/PROJECT_STRUCTURE.md`
- `src/README.md`
- `src/gameplay/README.md`
- `src/systems/README.md`
- `src/renderers/README.md`
- `src/ui/README.md`

## 생성 가능 파일

- `src/systems/game-feedback-system.js`
- `src/ui/game-feedback-messages.js`
- `src/ui/game-feedback.js`
- `src/ui/game-accessibility.js`
- `src/audio/game-audio.js`
- `src/audio/README.md`
- `tests/game-feedback.test.mjs`
- `tests/game-audio.test.mjs`
- `mulAg/md/review/REVIEW-P2-UX-FEEDBACK-001.md`

## 읽기 전용 파일

- `src/engine/runtime/**`
- `src/engine/debug/**`
- `.github/**`

## 수정 금지 파일

- `.git/**`
- `assets/**`
- `src/entities/enemy.js`
- 위 목록에 없는 기존 파일

## 작업 단계

- [x] 1. feedback result/event 계약과 메시지를 만든다.
- [x] 2. gameplay 발생 지점과 Canvas/live region을 연결한다.
- [x] 3. 접근성 DOM, 키, focus 경로를 구현한다.
- [x] 4. lazy audio/mute를 구현하고 테스트한다.
- [x] 5. 문서와 review를 갱신한다.

## 완료 기준

- special 실패와 pickup 결과가 사용자에게 드러난다.
- 주요 전투 이벤트에 mute 가능한 SFX가 있고 gesture 전에는 audio를 만들지 않는다.
- Canvas와 Game Info를 키보드·스크린리더 경로에서 접근할 수 있다.
- 새 모듈은 모두 300라인 이하이다.
