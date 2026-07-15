# TODO-P2-CAPACITY-001: 입력 복구와 runtime capacity 증거

## 목적

탭 전환 후 입력 상태를 복구하고 bounded runtime 구현을 deterministic test와 browser soak로 검증한다.

## 참조 plan

`mulAg/md/plan/PLAN-2026-07-16-p1-p2-hardening.md`

## 작업 범위

- blur/visibility 입력 reset과 listener lifecycle
- read-only status의 run/entity/profiler/feedback 관측 필드
- FrameClock/profiler/entity cleanup capacity 테스트
- 짧은 seeded browser soak와 Pages gate

## 선행 조건

- P2 feedback/accessibility 구현 완료

## 수정 가능 파일

- `src/engine/input.js`
- `src/engine/input/README.md`
- `src/main.js`
- `package.json`
- `.github/workflows/pages.yml`
- `tests/browser-smoke.mjs`
- `tests/README.md`
- `src/README.md`
- `.github/workflows/README.md`

## 생성 가능 파일

- `tests/runtime-capacity.test.mjs`
- `tests/browser-soak.mjs`
- `mulAg/md/review/REVIEW-P2-CAPACITY-001.md`

## 읽기 전용 파일

- `src/engine/runtime/**`
- `src/engine/debug/**`
- `src/engine/world/**`
- `src/systems/**`
- `galaxy-runner.html`

## 수정 금지 파일

- `.git/**`
- `assets/**`
- 위 목록에 없는 production 파일

## 작업 단계

- [x] 1. blur/hidden reset과 destroy 대칭을 구현한다.
- [x] 2. status capacity snapshot을 확장한다.
- [x] 3. Node capacity와 browser soak를 작성한다.
- [x] 4. package/workflow gate를 갱신한다.
- [x] 5. targeted/전체 검증과 review를 기록한다.

## 완료 기준

- blur/hidden 뒤 down/pressed/released 입력 상태가 남지 않는다.
- status는 mutable gameplay 객체를 노출하지 않는다.
- soak에서 browser 오류, 비유한 값, 명백한 entity 폭증이 없다.
- 절대 FPS 환경 차이를 배포 실패로 오판하지 않는다.
