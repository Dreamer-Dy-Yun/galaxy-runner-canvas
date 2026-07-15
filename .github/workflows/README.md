# .github/workflows

## 역할

`workflows`는 GitHub Actions 자동화 정의를 보관한다.

## 파일 책임

- `pages.yml`: `main` push 또는 수동 실행 시 Node/pnpm 환경을 고정하고 frozen install → unit/static test → `dist` build → Playwright Chromium smoke → seeded soak를 실행한다. 모든 gate가 성공한 뒤에만 `dist`를 GitHub Pages artifact로 업로드하고 배포한다.

## Pages 실행 순서

1. checkout 후 pnpm 11.8.0과 Node.js 22를 설정한다.
2. `pnpm install --frozen-lockfile`로 lockfile과 일치하는 dependency만 설치한다.
3. `pnpm run test:run`으로 source와 Node contract를 검증한다.
4. `pnpm run build`로 배포 전용 `dist` artifact를 만든다.
5. 공식 Playwright Chromium을 설치하고 `pnpm run test:browser`로 실제 상태 전이와 browser 오류 부재를 검증한다.
6. `pnpm run test:soak`로 bounded entity/frame 상태와 background 입력 복구를 짧게 검증한다.
7. 앞 단계가 모두 성공하면 Pages를 구성하고 `dist`만 업로드·배포한다.

## 경계

- workflow가 배포 대상 경로나 권한을 바꾸면 README와 배포 검증 결과를 함께 갱신한다.
- secret이나 repo variable 값을 코드에 직접 기록하지 않는다.
- 검증 실패 시 configure/upload/deploy 단계는 실행되지 않는다.
