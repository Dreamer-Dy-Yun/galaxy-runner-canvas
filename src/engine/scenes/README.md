# src/engine/scenes

## 역할

`src/engine/scenes`는 scene 등록, 전환, lifecycle 호출 순서를 관리한다.

## 파일 책임

- `scene.js`: scene contract의 기본 class.
- `scene-manager.js`: scene map, active scene, `enter/update/draw/exit/frame` forwarding.

## 경계

- scene manager는 scene 내부 gameplay state를 결정하지 않는다.
- scene 전환 실패는 명시적으로 오류를 낸다.
- scene은 raw DOM listener나 RAF lifetime을 직접 소유하지 않는 것을 목표로 한다.
