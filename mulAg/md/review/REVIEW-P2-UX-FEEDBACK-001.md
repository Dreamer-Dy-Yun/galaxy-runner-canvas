# REVIEW-P2-UX-FEEDBACK-001: 피드백·접근성·SFX 구현

## 수행 일시

2026-07-16

## 참조

- `mulAg/md/todo/TODO-P2-UX-FEEDBACK-001.md`
- `mulAg/md/plan/PLAN-2026-07-16-p1-p2-hardening.md`

## 구현 결과

- `GameFeedbackSystem`이 여섯 semantic event의 immutable details, subscriber, 우선순위와 transient 수명을 소유한다.
- `SpecialSystem.tryUse`는 무기 없음, meter 부족, Nova cap, 성공을 구분하고 실패 시 meter를 쓰지 않는다.
- `PlayerProgressionSystem.collect`는 repair/overflow, armor, shield, shield defense, weapon level/core/switch, drone, overdrive 결과를 반환한다.
- 피격, 처치, boss spawn과 pickup 발생 지점이 semantic event를 발행한다.
- Canvas toast, 한국어 message mapping, aria-live presenter는 gameplay 계산과 분리했다.
- `X/Ctrl` 특수기, pause 중 `I` 정보 토글, Canvas focus/fallback/label/description, 한국어 문서 언어와 focus-visible을 추가했다.
- `GameAudio`는 사용자 gesture 뒤에만 Web Audio를 만들며 mute 저장, `aria-pressed`, label/text, kill throttle을 소유한다.
- 외부 음원 asset과 gameplay 수치 변경은 없다.

## 책임 경계

- `src/systems/game-feedback-system.js`: 의미 event만 소유한다.
- `src/ui/game-feedback-messages.js`, `game-feedback.js`, `game-accessibility.js`: 문구·Canvas·aria-live 표현을 분리한다.
- `src/audio/game-audio.js`: 선택적 audio output과 mute lifecycle만 소유한다.
- `src/entities/player.js`는 event 의미를 최소 결과로 발행하지만 copy/audio를 참조하지 않는다.

## 검증

- feedback/audio 전용 Node 테스트: 5/5 PASS
- special/pickup 및 blur 직후 재입력 의미 결과 테스트: 3/3 PASS
- 전체 `test:run`: 51/51 PASS
- browser smoke: loadout, `X` 실패 feedback과 blur 직후 재입력, `I` info, Canvas 접근성, mute, debug off/on, browser failure 0건 PASS
- 신규 production/test 파일: 300라인 이하

## 판정

P2 feedback/accessibility/audio 계약 PASS. touch 조작은 계획대로 제품 범위 밖이며 README에 desktop keyboard 범위를 명시했다.
