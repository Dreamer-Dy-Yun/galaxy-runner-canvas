# REVIEW: 게임 기획과 사용자 경험 조사

## 수행 일시

2026-07-15 23:42:54 +09:00

## 참조한 todo

- `mulAg/md/todo/TODO-QA-DESIGN-001.md`
- 참조 plan: `mulAg/md/plan/active/PLAN-2026-07-15-runtime-contract-reinvestigation.md`

## 수행 내용

- `README.md`, `docs/GAMEPLAY_SYSTEMS.md`, `docs/PROJECT_STRUCTURE.md`와 gameplay/system/entity/UI/renderer 코드를 읽어 현재 핵심 루프와 상태 전이를 역추적했다.
- 무기, 방어, 특수기, 적 역할, 보스, 아이템, 점수·거리, Continue 규칙을 문서와 코드 설정 사이에서 대조했다.
- 기술적 실행 여부와 게임 기획 완성도를 분리해 판단했다.
- 코드나 기존 문서는 변경하지 않았고, 이 review만 생성했다.

## 변경 파일

- 없음

## 생성 파일

- `mulAg/md/review/REVIEW-QA-DESIGN-001.md`

## 미변경 파일

- `README.md`
- `docs/**`
- `src/gameplay/**`
- `src/systems/**`
- `src/entities/**`
- `src/ui/**`
- `src/renderers/**`
- `src/main.js`
- `galaxy-runner.html`
- 그 밖의 모든 코드·자산·거버넌스 문서

## 검증 내용

### 1. 기술적 실행 여부와 기획 완성도 분리

| 판단 축 | 결과 | 근거와 한계 |
|---|---|---|
| 현재 배포본 실행 | 실행 가능으로 확인됨 | 상위 Orchestrator가 2026-07-15 실제 배포본에서 ready → running → paused, 거리 79m/614m 증가, HP 변화, 적·투사체 표시, 콘솔 오류·경고 없음을 확인했다. 이 DESIGN 패스는 Browser 세션을 할당받지 못해 독립 재현하지 못했다. |
| game-over/Continue 실제 화면 | 미확인 | `GameSessionSystem`, `GameOverlay`, `Player.continue` 코드와 문서로만 확인했다. |
| 핵심 루프 기획 | 플레이 가능한 프로토타입 수준으로 성립 | 사격·회피 → 처치/점수/특수 게이지 → 아이템/무기 강화 → 중간 보스/보스 → 스테이지 순환이 코드로 연결돼 있다. |
| 제품 수준 UX | 미완성 | 시작 무기 경험, 실패/Continue의 의미, 도움말, 피드백, 접근성 목표가 아직 명확하지 않다. |
| 장기 밸런스 | 판단 보류 | 설정값과 계산 경로는 확인했지만 장시간 플레이·다회차 분포·무기별 생존/처치 데이터가 없다. |

실제 실행 성공은 기획 완성도의 근거 중 하나일 뿐이며, 이 패스에서는 런타임 초기화 순서가 정상적인지 여부를 판단하지 않는다.

### 2. 핵심 상태 전이

| 상태 | 진입/이탈 | 사용자 피드백 | 평가 |
|---|---|---|---|
| ready | 초기 상태, Space로 running | `GALAXY RUNNER`, `Break upward`, `Space` | 즉시 시작은 명확하지만 시작 무기·성장 방식 안내가 없다. `game-overlay.js:14-34`, `game-config.js:7-22` |
| running | 사격·이동·특수기·적/아이템 갱신 | HP/STG/K/DIST/PTS, 특수 게이지, 상태 아이콘 | 주요 전투 정보는 압축되어 있다. `game-loop-system.js:5-52`, `game-hud.js:5-20` |
| paused | P/Esc 토글 | `PAUSED`, 재개 키, 게임 정보 버튼 | 일시정지는 명확하다. 정보 패널은 Canvas 클릭 경로만 제공한다. `game-session-system.js:62-83`, `game-overlay.js:22-38` |
| gameover | HP 0 | 거리·점수·Continue 횟수, Space Continue / R Restart | 두 선택지는 명확하지만 Continue가 무엇을 보존하는지는 화면에서 알 수 없다. `player.js:422-450`, `game-overlay.js:22-34` |
| continue | gameover에서 Space | 진행 상태 보존, 위험 필드 제거, HP/Shield 회복, 2.4초 무적 | 프로토타입 탐색에는 유용하지만 실패 비용을 사실상 제거한다. `game-session-system.js:33-59`, `player.js:458-467` |

### 3. 핵심 루프와 밸런스 구조

1. 시작 후 약 1.08초에 첫 일반 스폰 조건에 도달한다. 초기 `spawnTimer=0.72`, 간격 `1.8`이다. `game-config.js:7-20`, `game-loop-system.js:19-35`
2. 위험도는 22초마다 1씩 올라가고 최대 18이다. 스폰 간격, 추가 스폰, 측면 적, 열차 편대, 적탄 속도·레벨이 단계적으로 강화된다. `game-config.js:45-76`, `enemy-spawn-system.js:5-70`, `enemy.js:82-123`
3. 첫 중간 보스는 42초, 첫 스테이지 보스는 105초다. 보스는 3개 프로필을 순환한다. `game-config.js:19-20`, `game-config.js:508-536`, `enemy-spawn-system.js:73-93`
4. 처치는 점수와 특수 게이지를 동시에 보상하고, 일반 필드 아이템과 처치 드롭이 성장 선택을 만든다. `enemy-lifecycle-system.js:100-130`, `special-system.js:28-31`
5. Rapid/Energy/Spread/Nova는 이동·히트박스·발사 지연·투사체·특수기 차이가 실제 코드에 반영돼 있다. `weapon-definitions.js:29-105`, `weapon-system.js:47-161`, `special-system.js:123-215`
6. 스나이퍼 조준선, Guardian 실드, 보스 장갑 개방/집중 공격은 위협을 시각적으로 예고한다. `enemy.js:230-275`, `enemy.js:597-627`, `boss-ai.js:46-90`, `boss-ai.js:133-170`

### 4. 강점

- **무기 정체성이 수치와 조작감 양쪽에 존재한다.** Rapid의 속도·작은 히트박스, Energy의 방어/탄 흡수, Spread의 광역 다발 사격과 커지는 선체, Nova의 폭발·지뢰가 서로 다른 플레이 결정을 만든다.
- **난이도가 단순 체력 증가만으로 구성되지 않았다.** 고급 적 역할, 측면 침입, 열차 편대, 탄속/탄레벨, 보스 패턴을 함께 사용한다.
- **위협 예고가 비교적 충실하다.** 스나이퍼 조준선, Guardian 실드, 보스 개방 단계와 패턴 문양은 피해야 할 이유를 화면으로 설명한다.
- **짧은 프로토타입 세션의 복구성이 좋다.** Continue는 획득한 무기·코어·방어·드론을 보존해 여러 시스템을 한 세션에서 실험하기 쉽다.
- **점수와 생존 거리를 분리했다.** 시간 경과와 처치 성과가 한 숫자에 섞이지 않으며 HUD도 `DIST`와 `PTS`로 구분한다.

### 5. 기획 문제와 우선순위

우선순위는 P1(핵심 경험/규칙 결정 필요), P2(사용성·피드백 개선), P3(제품 범위 확정 후 개선)로 구분했다.

#### [P1][설계 결정] 핵심 판매점인 4개 무기 경험이 첫 플레이에서 보장되지 않는다

- `README.md:18`은 4개 무기 함선을 핵심 기능으로 제시한다.
- 그러나 초기화 시 모든 무기 레벨은 0이고, 무기가 없으면 일반 `bolt`를 발사한다. `player.js:49-54`, `weapon-system.js:129-137`
- 특수 게이지는 무기가 없으면 HUD에서 숨겨지고, Ctrl 입력도 효과 없이 종료된다. `game-hud.js:47-49`, `special-system.js:82-99`
- 무기 획득은 가중치 랜덤 아이템/드롭에 의존해 첫 노출 시점과 종류가 보장되지 않는다. `collectible-item.js:26-52`, `game-config.js:77-87`

사용자 영향: 첫 세션이 범용 탄환 슈터처럼 시작되어 프로젝트의 가장 차별적인 무기/함선 정체성을 늦게 경험하거나 전혀 경험하지 못할 수 있다.

수정 방향: 아래 중 하나를 제품 규칙으로 먼저 선택해야 한다.

1. ready 화면에서 시작 무기를 선택한다.
2. 초반에 4종 중 하나를 선택할 수 있는 보장 드롭을 배치한다.
3. 현재 무무기 상태를 의도된 Base Ship 단계로 명명하고, 첫 무기 획득 목표와 예상 시점을 명시한다.

단순 문구 수정만으로는 해결되지 않으며, 시작 경험에 대한 설계 결정이 선행되어야 한다.

#### [P1][설계 결정] Continue가 실패 비용과 점수 의미를 약화한다

- Continue는 횟수 제한이나 비용 없이 점수, 처치, 시간, 위험도, 강화 상태를 모두 보존한다. `docs/GAMEPLAY_SYSTEMS.md:271-279`, `game-session-system.js:43-51`
- 위험 필드는 제거되고 HP/Shield는 최대치로 복구되며 2.4초 무적을 받는다. `game-session-system.js:49-59`, `player.js:458-467`
- HUD와 game-over 화면에 Continue 횟수는 남지만 점수 패널티나 별도 기록 구분은 없다. `game-hud.js:11-16`, `game-overlay.js:22-34`

사용자 영향: 실패 후 즉시 같은 성장 상태로 복귀하므로 생존 도전의 긴장과 점수 비교 가능성이 낮아진다. 반대로 시스템 체험용 샌드박스라면 장점이다.

수정 방향: 먼저 게임의 세션 목적을 `점수 도전형` 또는 `무제한 성장 체험형`으로 확정한다. 점수 도전형이면 Continue 제한/비용/점수 구간 분리를 설계하고, 체험형이면 game-over 문구에서 “진행 보존 Continue”임을 명시해 오해를 줄인다.

#### [P1][계약 정합성] 방어 문서와 실제 최소 피해 규칙이 다르다

- 문서는 “들어온 피해가 방어 이하이면 최종 HP 피해 0”이라고 설명한다. `docs/GAMEPLAY_SYSTEMS.md:31`
- 실제 계산은 outer flat에서 완전히 0이 된 경우를 제외하면, percent와 inner flat 계산 후 최소 1 피해를 강제한다. `player.js:504-509`
- HUD의 `D` 값은 outer+inner만 합산하고 percent 감소는 별도로 설명하지 않는다. `player.js:490-514`, `game-hud.js:97-117`

사용자 영향: 같은 방어 수치를 보고도 예상과 다른 피해를 받아 방어 빌드 신뢰도가 떨어질 수 있다.

수정 방향: “최소 1 피해”와 “방어 이하 완전 무효” 중 의도한 규칙을 먼저 확정하고, 코드·`GAMEPLAY_SYSTEMS.md`·게임 정보·HUD 표기를 한 계약으로 맞춘다. 규칙 확정 전에는 수치만 임의 조정하지 않는다.

#### [P2][작은 수정] 특수기 실패·잠금 상태와 성장 결과 피드백이 부족하다

- 무기 없음, 게이지 부족, Nova 지뢰 한도 도달 시 특수기 호출은 `false`로 끝나며 별도 화면 피드백이 없다. `special-system.js:82-99`, `special-system.js:188-214`
- 특수 게이지는 무기가 없을 때 숨겨지지만 내부적으로는 계속 충전된다. `game-hud.js:47-66`, `special-system.js:9-25`
- 정보 패널의 Energy/Nova 태그는 실제 보호막 코어·지뢰 동작을 충분히 설명하지 않고, 아이템 표는 Rapid 아이콘 하나를 범용 “무기”로 사용한다. `game-info.js:122-157`
- repair가 최대 HP에서 점수로 바뀌는 규칙, 무기 재획득/코어 전환, 아이템 morph 규칙도 화면 도움말에 드러나지 않는다. `player.js:310-367`, `collectible-item.js:68-75`

사용자 영향: Ctrl이 왜 작동하지 않는지, 아이템을 먹고 무엇이 바뀌었는지 학습하기 어렵다.

수정 방향: HUD 잠금/준비 상태, 짧은 실패 사유 pulse, 획득 결과 toast, 게임 정보 문구를 현재 계약에 맞춘다. 기존 화면 리듬을 유지하는 UI 단위 수정으로 분리할 수 있다.

#### [P2][접근성 결정 + 작은 수정] 조작·언어·Canvas 정보 접근 경로가 제한적이다

- HTML은 `lang="en"`이지만 pause 정보 패널은 한국어이고 ready/game-over/HUD는 영어 중심이다. `galaxy-runner.html:2`, `game-overlay.js:14-34`, `game-info.js:149-168`
- Canvas에 대체 텍스트나 접근 가능한 상태 설명이 없고, 정보 버튼은 Canvas 좌표 클릭으로만 처리된다. `galaxy-runner.html:60-62`, `game-session-system.js:75-83`
- 조작은 키보드의 WASD/방향키, Space, Ctrl, P/Esc, R에 한정되어 있고 터치/포인터 플레이 경로는 제시되지 않는다. `README.md:28-34`, `game-config.js:107-127`

사용자 영향: 키보드 사용이 어렵거나 화면 낭독기를 사용하는 사용자는 상태와 도움말에 접근하기 어렵고, 모바일 GitHub Pages 방문자는 사실상 플레이할 수 없다.

수정 방향: 작은 수정으로 언어 기준, Canvas `aria-label`/fallback 설명, Game Info 키보드 경로, Ctrl 대체 키를 정리한다. 터치 조작과 모바일 지원 여부는 제품 범위 결정 후 별도 TODO로 분리한다.

#### [P2][피드백 설계] 전투 피드백이 시각 효과에만 의존한다

- 조사 범위의 HTML과 gameplay/system/entity/UI/renderer 코드에는 사운드 재생 경로가 없다.
- 시각적으로는 burst, 실드 충격, Guardian flash, 스나이퍼 조준선, 보스 경고가 있어 기본 판독성은 좋다.

사용자 영향: 피격, 처치, 아이템 획득, 특수기 준비/발동, 보스 phase 전환을 화면을 계속 응시해야만 인지할 수 있고 타격감도 제한된다.

수정 방향: 음소거 가능한 최소 SFX 세트(피격/처치/획득/특수기/보스 경고)를 별도 설계한다. 프로토타입 범위를 유지한다면 P2 후순위로 둘 수 있다.

#### [P3][제품 범위 결정] 장기 목표와 종료 조건이 없다

- 3개 보스 스테이지는 다시 1로 순환하고 위험도는 최대 18에서 정지한다. `docs/GAMEPLAY_SYSTEMS.md:77-80`, `game-config.js:45-48`, `enemy-spawn-system.js:90-93`
- README가 이 프로젝트를 playable prototype으로 정의하므로 현재 endless 구조 자체를 결함으로 보지는 않는다. `README.md:8-14`

수정 방향: 프로토타입이면 현 상태를 명시한다. 제품 확장을 원하면 3스테이지 클리어, endless score attack, 주간 시드 등 최종 목표를 먼저 선택한 뒤 보상과 난이도 후반부를 설계한다.

### 6. 제안 우선순위

1. **결정 게이트:** 세션 목적(점수 도전/체험형), 시작 무기 경험, 방어 최소 피해 규칙, 모바일·접근성 지원 범위를 확정한다.
2. **작은 UX 정합화:** ready/game-over 문구, 잠긴 특수기 피드백, 게임 정보 카드, 언어와 Canvas 접근성 기본값을 수정한다.
3. **핵심 루프 보완:** 결정된 시작 무기 흐름과 Continue 규칙을 책임 단위 TODO로 구현한다.
4. **피드백 보강:** 획득/피격/특수기/보스 전환의 시각·음향 신호를 추가한다.
5. **밸런스 검증:** 무기별 다회차 플레이로 첫 무기 획득 시점, 첫 사망 시점, 중간 보스/보스 도달률, 특수기 사용률, Continue 사용률을 기록한 뒤 수치를 조정한다.

## 남은 이슈

- TODO의 읽기 전용 목록에 있는 `src/config.js`는 현재 트리에 존재하지 않았다. 실제 gameplay 설정은 문서가 지목한 `src/gameplay/game-config.js`에서 확인했다.
- 이 패스는 game-over → Continue와 pause 정보 패널을 실제 배포 화면에서 직접 조작하지 못했다.
- 랜덤 드롭과 난이도 곡선의 공정성은 정적 설정만으로 확정할 수 없다.
- 런타임 초기화 순서, debug 모듈 결합성, 테스트 신뢰도는 각각 RUNTIME/EVIDENCE 패스의 판단 범위다.

## QA 확인 요청 사항

- 실제 배포본에서 game-over → Space Continue → R Restart를 각각 확인하고, 점수·강화·필드 초기화가 문서와 일치하는지 검증한다.
- pause 정보 패널을 열어 작은 화면에서도 카드/아이템 문구가 읽히는지 확인한다.
- 최소 4개 무기별로 첫 보스까지 플레이해 처치 속도, 피격 빈도, 특수기 사용 가능 횟수, 아이템 획득 분포를 기록한다.
- 방어 규칙의 의도(최소 1 피해 또는 완전 방어)를 Product/기획 책임자가 확정한다.
- 시작 무기와 Continue 방향 결정 전에는 관련 밸런스 수치 수정 TODO를 만들지 않는다.
