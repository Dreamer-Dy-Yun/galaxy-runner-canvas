# PLAN-2026-05-19-enemy-pattern-variety

## 목적

- 일반 적과 보스의 공격 패턴을 늘려 반복감을 줄인다.
- 기존 적 렌더링과 projectile 시스템을 유지하되, 새 SVG 오버레이로 패턴 판독성을 높인다.
- 기차처럼 연결된 적 formation을 추가해 화면 흐름에 변화를 준다.

## 적용 내용

- 일반 shooter 적은 role별 사격 패턴을 사용한다.
- Striker, Raider, Splitter는 작은 2-way aimed spread를 사용한다.
- Tank, Guardian은 더 느리고 넓은 3-way aimed spread를 사용한다.
- 일정 시간 이후 scout/fighter train formation이 확률적으로 등장한다.
- Train formation은 연결 장치와 command-node SVG를 오버레이로 그려 하나의 convoy처럼 보이게 한다.
- 보스는 focus 중 기존 spread, curtain, radial ring, lance, summon을 섞어 사용한다.
- 보스는 curtain, ring, lance, summon 패턴을 코어 안의 SVG glyph로 표시한다.

## 완료 기준

- 일반 적의 탄 패턴이 role별로 구분된다.
- train formation이 기존 단일 스폰을 대체해 등장할 수 있다.
- 보스는 같은 focus phase 안에서도 매번 같은 공격만 반복하지 않는다.
- 새 SVG 에셋은 기존 atlas와 core 렌더링 위에 오버레이되어 렌더링 경계를 크게 흔들지 않는다.

## 후속 후보

- 전용 train enemy sprite 생성
- 보스 stage별 전용 core/armor 이미지 추가
- Spiral, delayed mine, lane warning 같은 고급 패턴 추가
