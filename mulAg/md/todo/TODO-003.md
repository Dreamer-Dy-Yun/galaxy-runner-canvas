# TODO-003: 특수능력/무기 행동 책임 정합화

## 목적

- 특수 스킬 호출, 탄환 생성, 데미지 스케일 산출의 규칙을 단일 책임으로 정리한다.
- 무기별 특수 행동이 현재 문서와 충돌하지 않도록 정합성을 맞춘다.

## 상태 추적 (2026-05-18)

- 진행 상태: 대기
- 증빙: 해당 TODO에 대한 review 아직 미작성
- 선행 조건: TODO-002 및 TODO-004와 의존 경계 재확인 후 실행

## 작업 범위

- 특수 스킬 사용 조건, 쿨다운/코스트, 데미지 스케일 경로 점검.
- 무기별 기본공격/특수공격 경로의 책임 분리.
- 사용자 피드백(파티클/버스트/오버드라이브) 품질 점검.

## 수정 가능 파일

- `src/entities/player.js`
- `src/systems/special-system.js`
- `src/systems/weapon-system.js`
- `src/entities/projectile.js`
- `src/entities/burst-particle.js`

## 읽기 전용 파일

- `mulAg/md/plan/PLAN-2026-05-18-game-improvement.md`
- `src/gameplay/weapon-catalog.js`
- `src/gameplay/game-config.js`
- `src/systems/drone-system.js`

## 수정 금지 파일

- `mulAg/md/done/*`
- `mulAg/md/review/*`

## 입력

- 입력 파일:
  - [Plan 문서](D:/PROJ/galaxy-runner-canvas/mulAg/md/plan/PLAN-2026-05-18-game-improvement.md)
- 입력 데이터 구조:
  - `SPECIAL_CONFIG`, `WeaponCatalog`, `WeaponSystem`, `SpecialSystem`
- 참조해야 할 함수/클래스:
  - `SpecialSystem.tryUse`, `SpecialSystem.fireRapid`, `SpecialSystem.fireEnergy`, `SpecialSystem.fireSpread`, `SpecialSystem.dropNovaMine`
  - `WeaponSystem.applyCoreDamage`, `WeaponSystem.currentFireDelay`
- 변경하지 말아야 할 인터페이스:
  - 플레이 조작 키 매핑(`Control`, `Space`)과 기존 스킬 카테고리 이름

## 출력

- 생성/수정 파일:
  - `src/systems/special-system.js`
  - `src/entities/player.js`
  - `src/systems/weapon-system.js`
  - `src/entities/projectile.js`
  - `src/entities/burst-particle.js`
- 반환 형식:
  - 스킬 사용/데미지 계산 흐름 다이어그램(간단 텍스트) + 변경 파일 목록
- 외부에서 참조할 함수/클래스:
  - `SpecialSystem`, `WeaponSystem`, `Projectile`
- 유지해야 할 호환성:
  - 현재 특수 스킬 이름/키 입력 동작 유지

## 작업 단계

- [ ] 특수 스킬 코스트/쿨타임/레벨 스케일 규칙을 `SPECIAL_CONFIG` 기준으로 일원화
- [ ] 특수/일반 탄환 생성 경로에서 중복 계산 제거
- [ ] 오버드라이브 상태에서 meter 처리 일관성 검증
- [ ] 발사/효과 파티클/반응(폭발/버스트) 동작 일관성 정리
- [ ] TODO 산출물에 성능/행동 리스크를 함께 기록

## 완료 기준

- 특수 스킬 동작이 문서 기준(레벨, 코스트, 범위)과 일치한다.
- 무기별 기본/특수 공격 경로에서 데미지 계산 중복이 축소된다.
- 오버드라이브/특수 사용 직후 상태가 명확히 복구되는지 검증된다.

## 주의사항

- `SpecialSystem`의 공개 동작 시그니처 변경은 금지한다.
- 신규 확장은 `특성 추가`보다 기존 규칙 정합 강화 우선으로 진행한다.
