# REVIEW-P2-CAPACITY-001: 입력 복구와 capacity 증거

## 수행 일시

2026-07-16

## 참조

- `mulAg/md/todo/TODO-P2-CAPACITY-001.md`
- `mulAg/md/plan/PLAN-2026-07-16-p1-p2-hardening.md`

## 구현 결과

- `InputController`는 injected key/visibility target을 사용하며 blur와 hidden visibility에서 down/transient state를 reset한다.
- reset마다 증가하는 `resetVersion()`을 특수기 latch와 동기화해 blur 직후 같은 frame의 재입력도 보존한다.
- `destroy()`는 key, blur, visibility listener를 대칭적으로 제거한다.
- `GalaxyRunnerStatus()`는 loadout/Assist, feedback, input, entity counts, frame p95/max, audio mute를 immutable snapshot으로 제공한다.
- browser용 artifact server와 오류 수집을 helper로 분리해 smoke와 soak가 같은 경계를 사용한다.
- seeded browser soak는 12초 동안 자동 발사·이동·필요 시 Continue를 수행하고 finite status, entity safety bound, profiler와 blur 복구를 검사한다.
- Pages workflow는 soak 성공 뒤에만 artifact를 업로드한다.

## 검증

- Node capacity: FrameClock 10초 gap을 0.04초로 clamp, profiler sample/spike bound, EntityStore 500회 churn PASS
- session/input: repeat, transient, reset version, blur, hidden visibility, destroy listener lifecycle PASS
- browser smoke: blur 뒤 `moveLeft=false`, 같은 frame의 `KeyX` 재입력, page/console/network error 0건 PASS
- seeded browser soak: 12,000ms PASS, latest entity high-water 24, final 24, Assist 0, browser failure 0건
- 절대 FPS는 환경 차이가 커서 합격 기준에 사용하지 않았고 hang 수준 1,000ms만 방어했다.

## 판정

P2 input recovery와 short-soak capacity 계약 PASS. 더 긴 세션의 밸런스·분포 측정은 별도 P3/밸런스 과제다.
