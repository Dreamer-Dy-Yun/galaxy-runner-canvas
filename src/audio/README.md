# src/audio

## 역할

`src/audio`는 Galaxy Runner의 선택적 사용자 음향 출력을 담당한다. gameplay 판정과 수치를 변경하지 않고 semantic feedback event를 소리로 표현한다.

## 파일 책임

- `game-audio.js`: feedback 구독, 최초 사용자 gesture 이후의 Web Audio 생성, event별 짧은 합성음, 반복 처치 throttle, mute 상태와 `localStorage`, mute 버튼의 `aria-pressed` 동기화를 담당한다.

## 공개 계약

- `new GameAudio(options)`: AudioContext를 생성하지 않는다.
- `attach({ feedback, gestureTarget, muteButton })`: feedback과 사용자 입력 및 mute 버튼을 연결한다.
- `unlock()`: 사용자 gesture 경로에서 호출하며 mute가 아니면 이때 처음 AudioContext를 만든다.
- `setMuted(value)` / `toggleMuted()` / `isMuted()`: mute 상태와 저장값을 동기화한다.
- `snapshot()`: `{ muted, unlocked, gestureSeen }` 읽기 전용 상태를 반환한다.
- `detach()` / `destroy()`: 구독과 DOM listener를 해제한다. `destroy()`는 생성된 AudioContext도 닫는다.

## 경계

- 이 폴더는 damage, score, drop, special cost, boss phase를 계산하지 않는다.
- Canvas 문구와 aria-live 문구는 `src/ui`가 소유한다.
- 음향 실패는 gameplay 성공으로 바꾸거나 gameplay 실행을 중단시키지 않는다.
- AudioContext는 생성자나 page load에서 만들지 않고 실제 사용자 gesture 이후에만 만든다.
