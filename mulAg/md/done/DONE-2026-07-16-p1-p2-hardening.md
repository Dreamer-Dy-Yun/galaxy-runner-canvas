# DONE: P1 제품 계약과 P2 사용자 경험 하드닝

## 완료 일시

2026-07-16

## 완료 범위

- `mulAg/md/plan/PLAN-2026-07-16-p1-p2-hardening.md`의 Phase 1~5
- ready 화면의 Rapid/Energy/Spread/Nova 시작 무기 선택과 Restart 선택 보존
- 진행·강화를 보존하는 무제한 Continue의 Assist 표시 계약
- shield 선흡수, outer flat → percent → inner flat, flat cap 10.5, 양수 HP 피해 최소 1 계약
- semantic feedback와 Canvas toast, aria-live, lazy Web Audio, 영속 mute 분리
- 한국어 문서 언어, focusable Canvas, fallback, `I` 정보, `X/Ctrl` 특수기
- blur/hidden 입력 reset, read-only status, browser smoke와 seeded short soak
- classic script provider 순서, 폴더/파일 책임 문서, Pages 배포 gate 동기화

## 독립 QA에서 교정한 항목

- pause 정보 panel과 하단 DOM control의 12px 겹침을 해소했다.
- blur 직후 같은 frame의 `KeyX` 재입력이 특수기 latch에 누락되는 경계를 `resetVersion()`으로 교정하고 Node/Chromium 회귀 테스트를 추가했다.
- 방어 HUD의 단일 문자열이 다음 status icon을 침범하던 문제를 armor/flat과 percent 두 줄 표시로 교정했다.
- 최종 독립 판정: `mulAg/md/review/REVIEW-P1-P2-QA-001.md` PASS, 94/100.

## QA 결과

- `corepack pnpm run test:run`: 51/51 PASS
- static verification: JavaScript 88개, HTML 2개, classic script 참조/순서 52개 PASS
- `corepack pnpm run build`: 158 files, 13,630,641 bytes
- local browser smoke: debug off/on, loadout·feedback·pause/info·Restart·접근성·mute·blur 재입력 PASS
- seeded browser soak: 12초 PASS, finite status/frame와 entity bound 확인
- `git diff --check`: PASS
- 신규 JavaScript/MJS는 모두 300라인 이하이다.
- 기존 대형 파일은 순증하지 않았다: `player.js` 824→777, `game-config.js` 1,056→1,045, `enemy.js` 742 유지.

## 배포 결과

- implementation commit: `5b95c0c27192722c82159ae3967022c4302f05de`
- GitHub Actions run: `29433283218`, success
- workflow gate: frozen install → test → build → Chromium smoke → seeded soak → Pages deploy 전부 success
- live Pages: `https://dreamer-dy-yun.github.io/galaxy-runner-canvas/galaxy-runner.html?v=5b95c0c`
- live 확인: 4종 loadout, Energy 선택 보존, compact defense HUD, 한국어/ARIA, mute 상태 복원, console warning/error 0건
- 이 lifecycle 문서 마감 커밋도 같은 Pages gate를 통과한 뒤 최종 SHA와 run을 인계한다.

## 별도 후속

- P3 종료 조건·장기 메타·밸런스 전면 조정은 이번 범위 밖이다.
- touch/mobile 조작, Firefox/Safari matrix, 장시간 memory/performance 인증은 별도 제품/QA 과제다.
- `src/entities/player.js`, `src/gameplay/game-config.js`, `src/entities/enemy.js`의 기존 300라인 초과 책임 분리는 별도 하드닝 작업으로 유지한다.
- Actions가 일부 v4 action의 Node.js 20 deprecation annotation을 표시했지만 이번 run은 Node.js 24 강제 실행으로 성공했다. action major 갱신은 별도 workflow 유지보수 항목이다.
