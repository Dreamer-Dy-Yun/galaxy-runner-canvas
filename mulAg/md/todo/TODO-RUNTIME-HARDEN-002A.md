# TODO-RUNTIME-HARDEN-002A: Observer 오류 경계 보정

## 목적

`TODO-RUNTIME-HARDEN-002` 독립 QA에서 발견한 falsy scene 예외와 동일 phase 재구독 경계를 보정한다.

## 참조 plan

`mulAg/md/plan/PLAN-2026-07-15-runtime-hardening.md`

## 발견 근거

- JavaScript는 `null`과 `undefined`도 throw할 수 있으나 현재 frame 실패 판정이 truthiness에 의존한다.
- observer snapshot 뒤 동일 identity를 해제·재등록하면 현재 phase의 오래된 snapshot이 새 구독으로 오인될 수 있다.

## 수정 가능 파일

- `src/engine/runtime/engine-runtime.js`
- `src/engine/runtime/README.md`
- `tests/runtime-observer.test.mjs`
- `mulAg/md/review/REVIEW-RUNTIME-HARDEN-002.md`

## 읽기 전용 파일

- `src/engine/scenes/**`
- `src/engine/game.js`
- `mulAg/md/todo/TODO-RUNTIME-HARDEN-002.md`

## 완료 기준

- [x] `null` 또는 `undefined` scene 예외도 cleanup 뒤 원래 값으로 다시 throw한다.
- [x] observer event가 falsy 오류의 발생 여부를 구분할 수 있다.
- [x] 같은 phase에서 해제 후 재등록한 observer는 그 phase의 오래된 snapshot으로 호출되지 않는다.
- [x] 다음 phase부터 새 구독으로 정상 호출된다.
- [x] 전체 테스트와 build가 통과하고 review에 보정 결과를 기록한다.

## 경계

- diagnostics, gameplay, workflow, package 파일은 수정하지 않는다.
- 커밋과 푸시는 수행하지 않는다.
