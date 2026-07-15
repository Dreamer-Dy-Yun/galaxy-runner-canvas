# PLAN: 런타임 계약 하드닝과 제품 결정 분리

## 작성 일시

2026-07-15

## 기준

- 브랜치/HEAD: `main` / `8e5c713`
- 조사 완료 기록: `mulAg/md/done/DONE-2026-07-15-runtime-contract-reinvestigation.md`
- 런타임 근거: `mulAg/md/review/REVIEW-QA-RUNTIME-001.md`
- 기획 근거: `mulAg/md/review/REVIEW-QA-DESIGN-001.md`
- 검증 근거: `mulAg/md/review/REVIEW-QA-EVIDENCE-001.md`

## 실행 상태 (2026-07-16)

- Phase 1 자동 검증 기반: 완료, 독립 QA PASS.
- Phase 2 canonical frame/observer: 최초 독립 QA FAIL 2건을 `TODO-RUNTIME-HARDEN-002A`로 보정 후 재QA PASS.
- Phase 3 diagnostics observer 전환: 완료, 독립 QA PASS.
- Phase 4 browser/Pages gate: 로컬과 GitHub Actions의 `test:run`, build, debug off/on browser smoke PASS. implementation commit과 live Pages 증거를 확인했다.
- Phase 5와 기획/UX/대형 파일 분리는 이번 P0 배포 범위에서 제외하며 별도 사용자 결정과 TODO가 필요하다.

## 조사 기준 결론

현재 게임은 실행 가능하지만 debug/runtime 조합은 하드닝 완료 상태가 아니다. 실제 성공 순서는 결정적이지만, optional 진단 모듈의 선행 side effect가 profiler의 receiver를 보존하고 있어 독립 결합성과 순서 교환성이 없다. 또한 profiler의 update/draw metric이 실제 dispatch 경로를 통과하지 않아 관측 계약도 성립하지 않는다.

기획 문제는 런타임 결함과 섞지 않는다. 시작 무기, Continue, 방어 최소 피해는 제품 결정이 먼저이며, 접근성과 피드백은 작은 UX 작업으로 별도 수행한다.

## 목표 계약

### Canonical frame 소유권

권장안은 `EngineRuntime`이 frame과 phase 경계를 한 곳에서 소유하는 것이다.

```text
FrameClock
  -> EngineRuntime.frame
      -> beforeFrame observers
      -> SceneManager.update -> active scene update
      -> afterUpdate observers
      -> SceneManager.draw -> active scene draw
      -> afterDraw observers
      -> active scene afterFrame/input cleanup
      -> afterFrame observers
```

- `SceneManager`와 game scene은 임의로 RAF를 소유하지 않는다.
- `Game.frame` 우회 경로는 제거하거나 명시적 호환 adapter로 축소한다.
- frame마다 update/draw/cleanup이 각각 정확히 한 번 호출되는 계약을 테스트한다.

### Observer 계약

- `EngineRuntime`은 등록과 해제가 대칭인 subscribe/unsubscribe API를 제공한다.
- observer는 runtime/scene 메서드를 교체하지 않는다.
- observer의 순서, 중복 등록, 제거, 오류 처리와 gameplay 영향 정책을 명시한다.
- 진단 observer 실패는 콘솔/오류 hook으로 가시화하고 gameplay 경로와 분리한다.

### Debug 역할 분리

- `FrameProfiler`: 측정과 snapshot만 담당하며 Canvas를 그리지 않는다.
- `DebugOverlay`: after-frame 표시만 담당하고 필요한 profiler snapshot을 읽는다.
- 두 모듈의 enabled/disabled 및 연결 순서가 게임 실행 가능성을 바꾸지 않는다.
- update/draw metric은 실제 phase hook에서만 기록한다.

## 권한 게이트

`src/engine/**`는 기존 문서와 커밋에서 하드닝 대상으로 취급된다. 아래 코드 TODO는 사용자의 명시적 수정 허가 전에는 생성·배정·실행하지 않는다. 허가 전 허용 범위는 조사 문서, 계획, 파일 경계와 검증 계약 작성뿐이다.

### 승인 상태

- 2026-07-15 사용자 요청 `계획 세워서 수정/배포까지`로 이 계획의 기술적 P0 범위 수정과 배포를 명시적으로 승인받았다.
- 이번 실행 범위: Phase 1~4 및 관련 계약 문서 동기화.
- 별도 보류: 시작 무기, Continue, 방어 최소 피해, UX/접근성, 300라인 초과 파일 분리, `Game` 위치 이동. 이 항목은 기술적 P0 배포에 섞지 않는다.
- 배포 조건: 모든 로컬 검증과 독립 QA가 통과하고 의도한 diff만 남아야 한다.

## 실행 계획

### Phase 0 — 계약 승인과 파일 소유권 확정

1. `EngineRuntime` canonical frame 소유권과 phase 목록을 승인한다.
2. observer 오류가 gameplay를 중단할지, 오류를 표시하고 해당 observer만 해제할지 결정한다.
3. hardened engine/debug 파일 수정 허가를 받는다.
4. 아래 TODO별 수정·생성·읽기·금지 파일을 확정한다.

완료 기준: 코드 구현 전에 공개 API, 부작용, 실패, 해제 계약이 문서로 확정된다.

### Phase 1 — 자동 검증 기반 마련

실행 TODO: `mulAg/md/todo/TODO-RUNTIME-HARDEN-001.md`

- 최소 `package.json`과 package manager/version 계약을 둔다.
- `test:run`은 runtime/observer/diagnostics 계약 테스트를 실행하고, 실제 keyboard/session 흐름은 Phase 4 browser smoke에서 검증한다.
- `build`는 no-op가 아니라 배포 artifact 조립 또는 정적 참조 검증을 수행한다.
- baseline, overlay-only, profiler-only, 두 연결 순서, disabled, 중복 attach, detach 테스트를 만든다.
- 현재 동작 보존 테스트가 통과하는 상태로 끝낸다.

선행 조건: Phase 0 계약 승인.

### Phase 2 — Runtime frame/phase observer 구현

실행 TODO: `mulAg/md/todo/TODO-RUNTIME-HARDEN-002.md`

독립 QA 보정 TODO: `mulAg/md/todo/TODO-RUNTIME-HARDEN-002A.md`

- `EngineRuntime`에 canonical phase와 subscribe/unsubscribe 계약을 구현한다.
- `SceneManager`와 game scene의 중복 frame 우회 경로를 정리한다.
- input transient cleanup 시점을 명시적 after-frame 단계로 둔다.
- observer 유무와 무관하게 game update/draw가 한 번씩 실행되는 테스트를 통과한다.

선행 조건: Phase 1 done 및 hardened 파일 수정 허가.

### Phase 3 — DebugOverlay/FrameProfiler 전환

실행 TODO: `mulAg/md/todo/TODO-RUNTIME-HARDEN-003.md`

- 두 모듈의 runtime/scene monkey patch를 제거한다.
- `FrameProfiler`를 순수 측정 모듈로, `DebugOverlay`를 표시 모듈로 분리한다.
- profiler update/draw metric이 실제 phase 비용을 측정하는지 non-zero synthetic workload로 검증한다.
- default production 경로에서 diagnostics를 opt-in으로 둘지 확정한다.
- 관련 engine/debug/runtime 문서를 같은 변경 단위에서 갱신한다.

선행 조건: Phase 2 done.

### Phase 4 — 실제 페이지와 배포 gate

실행 TODO: `mulAg/md/todo/TODO-RUNTIME-QA-001.md`

- ready → running → paused → resume → restart browser smoke를 만든다.
- game-over → Continue는 제품 의미 결정 전 자동화 범위에서 제외하고 기획 후속으로 남긴다.
- pause 중 거리/시간 고정, 콘솔 오류, script/asset 404를 검사한다.
- debug off/on 양쪽을 검증한다.
- Pages workflow는 syntax, unit/integration, browser smoke 성공 뒤에만 artifact를 업로드한다.
- 배포 SHA, workflow conclusion, live URL을 분리해 기록한다.

선행 조건: Phase 3 done.

### Phase 5 — Engine/game 폴더 경계 정리

예정 TODO: `TODO-GAME-BOUNDARY-001`

- Galaxy Runner 전용 `src/engine/game.js`를 game/scene 책임 위치로 옮기거나 명시적 compatibility facade로 축소한다.
- classic global script 순서는 현재 프로토타입 호환 경로로 문서화하고, ES module 단일 진입점 전환은 별도 설계로 판단한다.
- import/global 의존 순서와 폴더 README를 실제 코드에 맞춘다.

선행 조건: Phase 4 done. Runtime diagnostics 수정과 같은 작업에 섞지 않는다.

## 기획 계획

### Decision 1 — 첫 무기 경험

다음 중 하나를 먼저 선택한다.

1. ready 화면에서 4종 중 시작 무기 선택
2. 초반 보장 선택 드롭
3. 무무기 상태를 의도된 Base Ship 단계로 정의하고 첫 획득 목표를 표시

결정 전에는 랜덤 가중치만 임의 조정하지 않는다.

### Decision 2 — Continue의 제품 의미

- 점수 도전형: 횟수/비용/점수 구간 또는 기록 분리
- 성장 체험형: 진행 보존 Continue임을 UI에서 명시

결정 전에는 Continue 수치만 변경하지 않는다.

### Decision 3 — 방어 최소 피해

- 방어 이하 피해 완전 무효
- outer flat이 남은 경우 최소 1 피해

의도 확정 후 코드, `GAMEPLAY_SYSTEMS.md`, 게임 정보, HUD 설명을 함께 맞춘다.

## UX와 접근성 후속

예정 TODO: `TODO-GAME-UX-001`

- 특수기 잠금/게이지 부족/지뢰 한도 실패 사유 표시
- 아이템·무기·코어 획득 결과 피드백
- HTML 언어와 실제 UI 언어 정합화
- Canvas `aria-label`과 fallback 설명
- Game Info의 키보드 접근 경로와 Ctrl 대체 키 검토
- 모바일/터치 지원은 제품 범위를 먼저 결정

기존 화면 리듬과 Canvas 스타일을 유지하는 작은 UI 작업으로 분리한다.

## 300라인 초과 파일 후속

다음 파일은 runtime P0와 섞지 않고 각각 별도 하드닝 TODO로 처리한다.

- `src/gameplay/game-config.js` — 1056 lines: 도메인별 설정/검증 책임 분리
- `src/entities/player.js` — 824 lines: 입력·공격·피해/방어·아이템·렌더 bridge 분리
- `src/entities/enemy.js` — 742 lines: 역할 stats·이동/AI·보스 bridge·draw 분리

각 파일은 한 번에 한 Sub-Agent만 수정하고, 공개 계약과 회귀 테스트를 먼저 둔다.

## 검증 기준

- `pnpm run test:run`
- `pnpm run build`
- JavaScript syntax/static reference 검사
- runtime observer 조합 및 detach 테스트
- 실제 브라우저 상태 전이 smoke
- GitHub Pages workflow 및 live SHA 증거
- `git status`와 `git diff`에서 의도한 파일만 변경

## 완료 기준

- optional diagnostics의 유무·순서가 게임 실행 가능성을 바꾸지 않는다.
- profiler metric이 실제 frame/update/draw phase를 측정한다.
- attach/detach와 observer 오류 계약이 테스트와 문서에 고정된다.
- 배포 전에 자동 검증이 실행된다.
- engine/game 폴더 책임과 실제 코드 위치가 일치한다.
- 기획 결정과 기술 하드닝이 별도 TODO와 review로 추적된다.
- 사용자 허가 없이 hardened engine 파일을 수정하지 않는다.
