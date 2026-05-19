# PLAN-2026-05-19-weapon-armor-redesign

## 목적

- 무기를 단순한 색/탄속 차이가 아니라 서로 다른 문제를 푸는 선택지로 만든다.
- 전체 무기 데미지를 올리고, 적에게 flat armor를 부여해 약한 다단히트와 강한 단발 공격의 상성을 만든다.
- Energy는 보이는 구체가 곧 방어막처럼 느껴지게 데미지/흡수 공통 판정을 키운다.
- Rapid 일반공격은 얇은 pulse laser로 바꾸되, 특수공격의 지속 대형 beam과 차별화한다.

## 핵심 규칙

### Layered armor

피해 공식은 3단 방어 모델을 기준으로 둔다.

```txt
rawDamage
-> outer flat reduction
-> percent reduction
-> inner flat reduction
-> finalDamage
```

- 적은 같은 모델을 쓰되 outer flat은 0으로 둔다.
- 플레이어는 기체/무기 특성에 따라 outer flat, percent, inner flat을 모두 가진다.
- Rapid처럼 작은 피해를 빠르게 넣는 무기는 inner flat이 높은 적에게 약하다.
- Nova처럼 한 방 피해가 큰 무기는 armor 높은 적에게 강하다.
- 체력이 낮고 inner flat이 높은 적은 약한 다단히트에 내성이 있지만 강한 단발에는 취약하다.

## 무기 정체성

### Rapid

- 일반공격: 얇은 pulse laser
- 특수공격: 넓고 지속되는 overdrive beam
- 강점: 저방어 적, 빠른 명중, 안정적인 DPS
- 약점: high armor 적

### Energy

- 일반공격: 전진 방어막 구체
- 특수공격: 느리고 큰 energy core, 흡수 후 방출
- 데미지 판정과 흡수 판정은 동일하게 유지한다.
- 공통 hit radius를 키워 보이는 이펙트와 판정 감각을 맞춘다.

### Spread

- 일반공격: 좌우 부채꼴 공간 장악
- 특수공격: 대량 탄막
- 강점: 저방어 다수 처리
- 약점: high armor 단일 대상

### Nova

- 일반공격: 고데미지 저속 폭발탄
- 특수공격: 설치형 nova mine
- 강점: high armor 적, 폭발/광역 제압
- 약점: 느린 탄속과 명중 난이도

## 구현 분리

- Worker A
  - `src/gameplay/game-config.js`
  - `src/entities/enemy.js`
  - 전체 데미지 scale, enemy armor, damage reduction 공식, Energy hitRadius 확대
- Worker B
  - `src/gameplay/weapon-catalog.js`
  - `src/systems/weapon-system.js`
  - `src/entities/projectile.js`
  - Rapid pulse laser 일반공격, Energy/Nova 레벨 체감 강화
- Main
  - 문서 정합화
  - 충돌/중복 조정
  - 최종 배포 판단

## todo 분해

- `mulAg/md/todo/TODO-WEAPON-ARMOR-001.md`
  - Worker A 참조 todo
  - flat armor, damage contract, Energy 공통 판정 확대
- `mulAg/md/todo/TODO-WEAPON-ARMOR-002.md`
  - Worker B 참조 todo
  - Rapid pulse laser, Energy/Nova 레벨 체감 강화

Orchestrator는 Sub-Agent 호출 시 위 todo 파일 중 하나를 직접 명시해야 한다.

## 1차 완료 기준

- Energy 일반/특수 탄의 데미지와 흡수 판정이 현재보다 명확히 커진다.
- Rapid 일반공격이 레이저처럼 보이되 특수 beam보다 좁고 짧다.
- 적 role별 armor가 적용되어 Rapid/Spread와 Nova/Energy의 상성이 생긴다.
- 문서에 피해 공식과 무기 정체성이 기록된다.

## 2차 후보

- Nova 폭발 후 잔류장
- Nova 고레벨 2차 충격파
- Spread 고레벨 중앙 보조탄 또는 후속 파편
- Rapid 누적 armor shred
- 실제 frame profiler 기반 밸런스/성능 비교
