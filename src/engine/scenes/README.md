# src/engine/scenes

## 역할

`src/engine/scenes`는 scene 등록, 전환, lifecycle 호출 순서를 관리한다.

## 파일 책임

- `scene.js`: `enter/exit/pause/resume/update/draw/afterFrame` lifecycle 기본 class.
- `scene-manager.js`: scene map, active scene 전환과 `update/draw/afterFrame` forwarding.

## 실행 계약

- `EngineRuntime`이 frame phase를 소유하며 `Scene`과 `SceneManager`에는 `frame()` 우회 경로가 없다.
- `SceneManager.update(dt, frameState)`는 active scene이 paused가 아닐 때만 update를 전달한다.
- `SceneManager.draw(dt, frameState)`는 pause와 무관하게 active scene을 그린다.
- `SceneManager.afterFrame(dt, frameState)`는 active scene에 frame 종료 처리를 전달한다.
- 입력의 pressed/released 같은 transient state는 gameplay scene의 `afterFrame`에서 정리한다.
- update/draw 오류가 발생해도 `EngineRuntime`은 `afterFrame`을 시도한 뒤 최초 scene 오류를 호출자에게 다시 던진다.

## 경계

- scene manager는 scene 내부 gameplay state를 결정하지 않는다.
- scene 전환 실패는 명시적으로 오류를 낸다.
- scene은 raw DOM listener나 RAF lifetime을 직접 소유하지 않는 것을 목표로 한다.
- scene lifecycle은 observer 등록이나 debug 표시를 직접 수행하지 않는다.
