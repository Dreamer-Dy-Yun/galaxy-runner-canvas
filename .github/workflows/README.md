# .github/workflows

## 역할

`workflows`는 GitHub Actions 자동화 정의를 보관한다.

## 파일 책임

- `pages.yml`: `main` push 또는 수동 실행 시 정적 사이트 전체를 GitHub Pages artifact로 업로드하고 배포한다.

## 경계

- workflow가 배포 대상 경로나 권한을 바꾸면 README와 배포 검증 결과를 함께 갱신한다.
- secret이나 repo variable 값을 코드에 직접 기록하지 않는다.
