# REVIEW: TODO-004 성능 하드닝

## 수행 일시

2026-05-18 12:22:52 KST

## 참조한 todo

- `mulAg/md/todo/TODO-004.md`

## 수행 내용

- projectile collision context를 재사용해 매 프레임 임시 배열 생성을 줄였다.
- boss 존재 여부를 반복 스캔 대신 `bossCount` 기반으로 조회하도록 정리했다.
- 일부 entity 제거 경로를 `splice` 대신 unordered remove와 compact 방식으로 바꿨다.
- player drone slot 계산에서 매 프레임 배열 생성을 줄이고 캐시를 재사용하도록 했다.
- collectible item bounce padding과 HUD 방어력 계산의 반복 계산을 줄였다.

## 변경 파일

- `src/engine/game.js`
- `src/entities/player.js`
- `src/entities/collectible-item.js`
- `src/entities/nova-explosion.js`
- `src/ui/game-hud.js`
- `mulAg/md/todo/TODO-004.md`

## 생성 파일

- `mulAg/md/review/REVIEW-004.md`

## 미변경 파일

- `mulAg/md/done/*`

## 검증 내용

- `src/**/*.js` 대상 `node --check` 통합 검증 통과.
- Chrome headless smoke 검증에서 ready 화면 렌더링 확인.
- `pnpm run test:run`, `pnpm run build`는 현재 `pnpm`과 `package.json` 부재로 실행하지 못했다.

## 남은 이슈

- `src/engine/game.js`, `src/entities/player.js`에는 엔진화/visual cleanup 관련 변경도 섞여 있어 커밋 단위 분리가 필요하다.
- 성능 수치 계측은 아직 수행하지 않았다.

## QA 확인 요청 사항

- 실제 장시간 플레이에서 entity count와 FPS를 debug overlay로 확인하는 후속 QA가 필요하다.
