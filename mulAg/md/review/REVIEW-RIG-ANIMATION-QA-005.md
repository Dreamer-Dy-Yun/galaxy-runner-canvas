# REVIEW: 공통 Rig 애니메이션과 opening 통합 독립 QA

## 수행 일시

2026-07-16 12:27:38 +09:00

## 참조 plan / todo

- `mulAg/md/plan/active/PLAN-2026-07-16-opening-player-animation-redesign.md`
- `mulAg/md/todo/TODO-RIG-ANIMATION-QA-005.md`
- 구현 review 4개

## 최종 판정

**PASS — 기능 구현과 로컬 배포 gate를 통과했다. commit/push/workflow/live 증거는 아직 없다.**

## 독립 QA 범위

- 구현에 참여하지 않은 QA agent가 현재 `codex/rig-animation-engine` working tree를 read-only로 재검토했다.
- opening event flow, final-form 불변성, asset boundary, engine 범용성, adapter lifecycle, script order, line count, 문서, browser/soak를 확인했다.
- QA가 발견한 target fallback, Rapid edge alpha, pause 전달, base bank profile, engine-owned pose interpolation, stale current docs를 root가 교정한 뒤 전체 gate를 재실행했다.

## Acceptance 결과

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 기본 기체 오프닝 | PASS | Space 후 1초 baseLaunch, 선택 전 enemy/ordinary item gate |
| 4종 route choice | PASS | 고정 4개, 하나 선택 후 나머지 제거, drop/morph route lock |
| final-form 보존 | PASS | `assets/player/final-forms` diff 없음, 4×10 stable snapshot은 final PNG 한 장 |
| 좌우 bank | PASS | engine-owned enter/reverse/pause/return, non-uniform scale/skew 없음 |
| 강화 transition | PASS | progression `rigChange`, transient detach/attach, target final-form settle |
| fallback | PASS | 누락 자산/strategy 오류는 degraded/error를 남기고 target settle |
| 자산 계약 | PASS | rig PNG 21개, 512×512 RGBA, non-empty alpha, 네 외곽선 alpha 0 |
| 책임 경계 | PASS | adapter에 timer/diff/easing/fallback 없음, engine game token 0 |
| 문서/라인 | PASS | current loadout stale ref 0, 신규 주요 파일 300라인 이하 |

## 검증 내용

- 독립 `pnpm run test:run`: 75/75 PASS. 이후 upgrade lifecycle 회귀 test를 추가한 root 최종 gate는 76/76 PASS.
- Python unittest discovery: 16/16 PASS.
- root 최종 `pnpm run build`: 190 files, 15,582,588 bytes.
- `pnpm run test:browser`: PASS.
- `pnpm run test:soak`: 12초 PASS, root 최종 실행 high-water 33/final 11.
- `git diff --check`: PASS.
- U+FFFD 없음, classic provider 순서와 native `AnimationTimeline` 충돌 회귀 PASS.
- headless 1920×900 확인에서 기본 기체와 4개 route icon이 동시에 표시됐다.

## 비차단 기존 경고

- browser warning 1건: `[Gameplay Contract] Unknown weapon kind "bonus".` 기존 fixture/startup warning이며 error는 아니다.
- 12초 soak는 배포 gate이지 장시간 memory 인증은 아니다.
- 실제 Pages workflow와 live URL은 push 후 별도 증명해야 한다.

## 최종 verdict

- 기능 계약: PASS
- 로컬 배포 준비: PASS
- MulAg 구현 QA: PASS
- 실제 배포 완료: 아직 아님
