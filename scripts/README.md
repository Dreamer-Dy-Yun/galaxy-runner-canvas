# scripts

## 역할

`scripts`는 classic-script 정적 사이트의 소스 계약을 검증하고 GitHub Pages에 올릴 `dist` artifact를 조립한다. gameplay 규칙이나 asset 내용은 만들거나 변경하지 않는다.

## 파일 책임

- `classic-script-contract.mjs`: `galaxy-runner.html`의 허용 script 목록과 provider-before-consumer 의존성을 소유한다. 누락, 중복, 미등록 경로, consumer 선행, `src/main.js`의 비최종 위치를 오류로 처리한다.
- `verify-static-site.mjs`: 사이트 루트 안의 JavaScript 문법, HTML local script 실재 여부, classic script 순서 계약을 함께 검증한다. source와 `dist` 양쪽에서 같은 검증 함수를 사용한다.
- `build-static-site.mjs`: source 검증 후 배포 허용 파일만 `dist`로 복사하고 완성된 artifact를 다시 검증한다.

## 변경 경계

- HTML에 classic script를 추가·삭제하거나 global 의존 순서를 바꾸면 `classic-script-contract.mjs` manifest도 함께 갱신한다.
- 배포 파일 목록을 바꾸면 `build-static-site.mjs`, 루트 README, Pages workflow의 설명과 실제 경로를 함께 확인한다.
- 검증기는 site root 밖의 경로를 허용하지 않으며 gameplay 값을 보정하거나 runtime 실패를 숨기지 않는다.
