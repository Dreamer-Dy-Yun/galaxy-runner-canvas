# PLAN: P1 제품 계약과 P2 사용자 경험 하드닝

## 작성 일시

2026-07-16

## 현재 기준

- 브랜치/HEAD: `main` / `a1f768e`
- 작업 트리: clean, `origin/main`과 일치
- P0 완료 근거: `mulAg/md/done/DONE-2026-07-16-runtime-hardening.md`
- 기획 근거: `mulAg/md/review/REVIEW-QA-DESIGN-001.md`
- 검증 근거: `mulAg/md/review/REVIEW-QA-EVIDENCE-001.md`
- 시작 기준 자동 검증: `corepack pnpm run test:run` 20/20 PASS

## 실행 상태 (2026-07-16)

- Phase 1 시작 무기·Assist Continue·방어 계약: 완료.
- Phase 2 session/input와 classic script 순서 회귀: 완료.
- Phase 3 semantic feedback·접근성·lazy Web Audio: 완료.
- Phase 4 blur/visibility 복구·status 관측·seeded browser soak: 완료.
- Phase 5 독립 계약/브라우저 QA: 최초 발견 3건을 교정한 뒤 최종 PASS.
- 로컬 gate: `test:run` 51/51, build 158 files, browser smoke, 12초 soak PASS.
- 남은 단계: implementation commit/push, Pages workflow, live URL을 분리 검증하고 lifecycle 문서를 마감한다.

## 범위와 제외

이번 작업은 위 review의 P1과 P2를 현재 코드에서 다시 확인한 뒤 구현·검증·배포한다.

포함 범위:

- P1 시작 무기, Continue 의미, 방어 계산 계약
- P1 session/input 및 classic script 순서 회귀 테스트
- P2 특수기 실패·아이템 획득·전투 이벤트 피드백
- P2 언어, Canvas 접근성, Game Info와 특수기 대체 키
- P2 음소거 가능한 최소 Web Audio SFX
- P2 blur/visibility 입력 복구, capacity 계약, 짧은 browser soak
- 관련 폴더 README, gameplay 문서, 테스트 문서와 배포 gate 동기화

제외 범위:

- P3 종료 조건·장기 메타·모바일 터치 조작
- `src/entities/enemy.js`, `src/gameplay/game-config.js` 전체 분리
- `src/entities/player.js` 전체 분리와 `src/engine/game.js` 위치 이동
- 수치 밸런스 전면 조정과 외부 음원 asset 제작

기존 300라인 초과 파일은 새 책임을 더 쌓지 않는다. 이번 계약과 직접 관련된 방어·획득 계산은 작은 system으로 추출하고, 나머지 대형 분리는 별도 하드닝 항목으로 유지한다.

## 이벤트 역추적

### 시작과 Restart

```text
키 입력
  -> ActionMap / InputState
  -> InputController.handleAction
  -> GameSessionSystem
  -> ready 선택 변경 또는 start/restart
  -> Player.equipWeapon
  -> running
```

현재 문제:

- ready에서 선택 없이 running으로 전환하고 Player의 모든 무기 레벨은 0이다.
- 핵심 기능인 4개 무기 함선과 특수기를 첫 세션에서 보장하지 않는다.
- session/input 동작을 고정하는 단위 테스트가 없다.

### Continue

```text
gameover + Space
  -> start action
  -> continueRun
  -> 위험 field 정리
  -> HP/Shield 회복 + 무적
  -> 진행·강화·점수 보존
```

현재 문제:

- 구현과 gameplay 문서는 보존형 Continue로 일치한다.
- 화면은 무엇을 보존하는지, 이후 run이 assisted 상태인지 설명하지 않는다.

### 피격과 방어

```text
적 탄/충돌
  -> Player.hit
  -> shield pool 흡수
  -> outer flat
  -> percent reduction
  -> inner flat
  -> HP 피해
```

현재 문제:

- 문서의 shield defense 단계당 0.5와 실제 0.45가 다르다.
- 문서는 방어 이하 피해 0, 코드는 일부 단계에서만 0이고 이후 최소 1이다.
- HUD의 D10.5 cap은 실제 계산에 적용되지 않고 percent 방어도 숨긴다.

### 특수기·획득·전투 피드백

```text
X/Ctrl
  -> SpecialSystem.tryUse
  -> 성공 또는 weapon/meter/mine-limit 실패
  -> 현재는 boolean만 남아 이유 소실

아이템 충돌
  -> Player.collect
  -> 회복/점수/레벨/core 상태 변경
  -> 현재는 결과 소실
```

현재 문제:

- 사용자가 실패 원인과 획득 결과를 알기 어렵다.
- 피격·처치·획득·특수기·보스 신호가 시각 효과에만 의존한다.

### 탭 이탈과 장시간 실행

```text
keydown
  -> downCodes 유지
  -> blur/visibility change
  -> 현재 reset 경로 없음
```

현재 문제:

- keyup 전에 탭이 포커스를 잃으면 이동/사격 입력이 붙을 수 있다.
- FrameClock clamp와 entity cleanup 구현은 있으나 capacity·soak 회귀 증거가 없다.

## 제품 결정

### Decision 1 — 시작 무기 선택

- ready 화면에서 Rapid, Energy, Spread, Nova 중 하나를 선택한다.
- 기본 선택은 Rapid다.
- 좌우/A·D와 숫자 1~4로 선택하고 Space로 확정한다.
- start 시 선택 무기만 level 1로 장착한다.
- Restart는 현재 선택을 보존한 `ready`로 돌아가며, Space로 새 run을 시작한다.

이 결정은 핵심 무기 경험을 첫 프레임부터 보장하며 랜덤 드롭의 성장 규칙은 유지한다.

### Decision 2 — Assist Continue

- 프로젝트의 playable prototype 성격을 유지해 무제한 보존형 Continue를 유지한다.
- `continues > 0`은 assisted run으로 간주한다.
- 거리·점수·처치·시간·위험도·강화는 현재처럼 보존한다.
- game-over와 HUD에 보존형 Assist임을 명시한다.
- 별도 영구 기록·리더보드는 이번 범위에 없으므로 state를 중복 저장하지 않는다.

### Decision 3 — 방어 계약

- shield pool은 피해를 완전히 흡수할 수 있다.
- shield를 통과한 양수 HP hit은 최소 1 피해를 준다.
- flat 방어는 outer와 inner 합계 10.5 cap을 실제 계산에 적용한다.
- cap은 outer를 먼저 보존하고 남은 한도에 inner를 배정한다.
- percent 방어는 flat cap과 별도이며 HUD 한 셀 안에서 `A5/D10.5`와 `R8%`를 두 줄로 표시한다.
- shield defense 단계당 실제 상수 0.45를 기준으로 문서와 도움말을 맞춘다.

### Decision 4 — 접근성과 플랫폼 범위

- 기본 문서 언어는 한국어로 맞춘다. 고유명과 HUD 약어는 유지할 수 있다.
- Canvas fallback, label, description, live region, focus-visible을 제공한다.
- `I`는 Game Info, `X`는 Ctrl과 같은 특수기 대체 키다.
- 모바일 터치 플레이는 이번 P2 범위 밖이며 README에 데스크톱 키보드 범위를 명시한다.

### Decision 5 — SFX와 성능 gate

- 외부 asset 없이 lazy Web Audio oscillator 기반 최소 신호를 사용한다.
- 사용자 gesture 전에는 AudioContext를 만들지 않는다.
- mute 상태를 버튼과 `localStorage`에 반영한다.
- 절대 FPS는 환경 의존적이므로 CI 합격 기준으로 두지 않는다.
- deterministic capacity 테스트와 짧은 browser soak에서 오류, 입력 복구, entity high-water의 유한성과 비폭증을 검증한다.

## 실행 계획

### Phase 1 — P1 제품 계약

실행 TODO: `mulAg/md/todo/TODO-P1-RUN-CONTRACT-001.md`

1. 시작 선택과 Assist 규칙을 game-owned 계약으로 만든다.
2. 방어 profile·cap·최소 피해를 순수 system으로 추출한다.
3. session, overlay, HUD, 도움말, Player delegate를 계약에 맞춘다.
4. 코드·문서의 방어 값과 Continue 문구를 일치시킨다.

완료 기준: 첫 시작 무기가 보장되고, Continue·방어의 화면/코드/문서가 한 규칙을 사용한다.

### Phase 2 — P1 회귀 테스트와 classic order

실행 TODO: `mulAg/md/todo/TODO-P1-CONTRACT-TESTS-001.md`

1. action/repeat/pause/start/restart/Continue 전이 테스트를 추가한다.
2. HTML classic script provider-before-consumer와 main 최종 순서를 검사한다.
3. 동적 engine script 실패가 boot 오류로 드러나는 계약을 고정한다.

완료 기준: P1 규칙과 실제 부트 순서 변경이 CI에서 의미 있는 오류로 실패한다.

### Phase 3 — P2 피드백·접근성·SFX

실행 TODO: `mulAg/md/todo/TODO-P2-UX-FEEDBACK-001.md`

1. semantic feedback event와 transient queue/subscription을 만든다.
2. 특수기 결과와 아이템 획득 결과가 의미 객체를 반환하게 한다.
3. Canvas toast, aria-live, HUD 상태, 한국어 도움말을 연결한다.
4. 접근 가능한 mute control과 lazy Web Audio SFX를 연결한다.

완료 기준: 실패·획득·주요 전투 신호를 화면과 선택적 소리로 인지할 수 있고 게임 판정은 바뀌지 않는다.

### Phase 4 — P2 복구·capacity·soak

실행 TODO: `mulAg/md/todo/TODO-P2-CAPACITY-001.md`

1. blur/hidden 입력 reset과 destroy 대칭을 구현한다.
2. read-only status에 선택 무기, Assist, feedback, entity/profiler capacity를 추가한다.
3. deterministic Node capacity 테스트와 browser soak를 추가한다.
4. Pages workflow가 P1/P2 test, build, browser smoke, 짧은 soak 뒤에만 배포하게 한다.

완료 기준: 탭 복귀 입력 stuck이 재현되지 않고, 짧은 장시간 실행에서 오류·비유한 상태·명백한 entity 폭증이 없다.

### Phase 5 — 독립 QA와 배포

실행 TODO: `mulAg/md/todo/TODO-P1-P2-QA-001.md`

1. 기능·계약·접근성·capacity diff를 독립 재검토한다.
2. `pnpm run test:run`, `pnpm run build`, `pnpm run test:browser`, `pnpm run test:soak`를 통과한다.
3. `git diff --check`, line count, status/diff를 확인한다.
4. `main`에 의도한 파일만 commit/push하고 Pages workflow와 live URL을 검증한다.

## 검증 기준

- 시작 선택 wrap/direct select/확정/Restart 보존
- Continue의 state 보존, 위험 field 정리, Assist 표기
- 방어 0 입력, 최소 1, layer 순서, flat cap, HUD summary
- special 실패 reason과 성공 시에만 meter 차감
- pickup의 repair overflow, weapon level/core 결과
- KeyI/KeyX, keyboard info toggle, Canvas 접근성 속성
- gesture 전 audio 없음, mute 시 재생 없음
- blur/visibility 입력 reset과 transient 정리
- classic script 현재 순서, provider-before-consumer, 동적 load failure
- FrameClock clamp, profiler bounded sample/spike, entity cleanup
- 실제 browser lifecycle, 접근성 DOM, no console/network/page error
- 짧은 soak의 유한 status와 entity high-water/끝값 비교

## 완료 기준

- P1/P2 review의 현재 유효 항목이 코드·문서·테스트로 닫힌다.
- 새 코드와 테스트 파일은 각각 300라인 이하이며 기존 대형 파일에 새 책임을 쌓지 않는다.
- 폴더/파일 책임 README가 실제 구조와 일치한다.
- 독립 QA와 모든 로컬 gate가 통과한다.
- 배포 commit, workflow conclusion, live Pages 상태를 서로 분리해 증명한다.
