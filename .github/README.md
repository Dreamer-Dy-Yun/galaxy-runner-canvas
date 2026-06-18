# .github

## 역할

`.github`는 GitHub 저장소 운영 설정을 담는다. 현재는 GitHub Pages 배포 workflow가 핵심 책임이다.

## 하위 폴더

- `workflows`: GitHub Actions workflow 정의.

## 경계

- 이 폴더의 변경은 배포 방식과 권한에 직접 영향을 줄 수 있다.
- 정적 게임 코드 변경과 무관한 workflow 수정은 별도 검증 근거를 남긴다.
