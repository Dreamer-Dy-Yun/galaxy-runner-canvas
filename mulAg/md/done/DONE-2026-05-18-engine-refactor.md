# DONE: 2026-05-18 엔진화 1차 골격

## 완료 일시

2026-05-18 12:22:52 KST

## 원본 계획

- `mulAg/md/plan/PLAN-2026-05-18-engine-refactor.md`

## 완료 대상

- `mulAg/md/todo/TODO-ENGINE-001.md`
- `mulAg/md/todo/TODO-ENGINE-002.md`
- `mulAg/md/todo/TODO-ENGINE-003.md`
- `mulAg/md/todo/TODO-ENGINE-004.md`
- `mulAg/md/todo/TODO-ENGINE-005.md`

## 참조 review

- `mulAg/md/review/REVIEW-ENGINE-001.md`
- `mulAg/md/review/REVIEW-ENGINE-002.md`
- `mulAg/md/review/REVIEW-ENGINE-003.md`
- `mulAg/md/review/REVIEW-ENGINE-004.md`
- `mulAg/md/review/REVIEW-ENGINE-005.md`
- `mulAg/md/review/QA-2026-05-18.md`

## 완료 내용

- 엔진/게임 책임 문서화
- `EngineRuntime`, `FrameClock`, `CanvasSurface` 도입
- scene lifecycle과 input action mapping 골격 도입
- `World`, `EntityStore`, `CollisionQuery` 도입
- asset/render/debug helper 골격 도입

## 검증 기록

- `node --check src/**/*.js`: 통과.
- Chrome headless ready 화면 smoke 검증: 통과.
- `pnpm run test:run`, `pnpm run build`: 실행 환경 부재로 미수행.

## 완료 조건의 제한

- `Game`은 아직 완전히 얇아지지 않았다.
- `GalaxyRunnerScene` 별도 파일 분리는 후속 엔진화 2차 작업으로 남아 있다.
- `player.js`, `special-system.js` 일부 raw input 조회는 후속 action mapping 정리 대상이다.
