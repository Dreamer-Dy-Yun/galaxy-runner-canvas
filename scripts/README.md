# scripts

## 역할

`scripts`는 classic-script 정적 사이트의 source 계약을 검사하고 GitHub Pages에 올릴 결정적 `dist` artifact를 조립한다.

## 파일 책임

- `verify-static-site.mjs`: JavaScript 문법과 HTML의 local script 참조를 검사한다. 검사 root 밖으로 나가는 참조와 누락된 script를 실패로 드러낸다.
- `build-static-site.mjs`: source 검증 후 배포 허용 파일만 `dist`에 복사하고, 완성된 artifact를 다시 검증해 파일 수와 크기를 보고한다.

## 경계

- gameplay 코드나 asset 내용을 생성·변환하지 않는다.
- build 출력은 항상 repository의 고정 `dist` 경로에만 만들며 source 파일을 수정하지 않는다.
- 배포 파일 목록이 바뀌면 build script, root README, Pages workflow를 함께 갱신한다.
