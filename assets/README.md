# assets

## 역할

`assets`는 런타임에서 직접 읽는 이미지와 SVG만 보관한다. 생성 과정의 원본, 프롬프트 산출물, 미사용 미리보기 이미지는 이 폴더의 책임이 아니다.

## 하위 폴더

- `bosses`: 스테이지 보스의 코어, 장갑 패널, 패턴 glyph SVG.
- `enemies`: 일반 적 atlas와 편대 시각 보조 SVG.
- `items`: 게임 아이템과 HUD에서 재사용하는 아이콘 SVG.
- `player`: 플레이어 final-form 정본, 전환 전용 rig part, 지원 atlas, thruster, special effect atlas.
- `projectiles`: 플레이어/적 투사체 atlas.

## 경계

- 파일명은 코드의 asset manifest 또는 설정값과 직접 연결된다.
- 에셋을 추가하거나 삭제하면 관련 `src/gameplay/*`, renderer, 문서의 경로도 함께 갱신한다.
- production에서 쓰지 않는 source contact sheet나 일회성 생성 스크립트는 보관하지 않는다.
- `player/final-forms`의 기존 Rapid, Energy, Spread, Nova PNG는 안정 상태의 승인된 완성 형태다.
- `player/rig`의 생성 part는 detach/attach 전환 프레임 전용이며 완료 후 해당 final-form으로 settle한다.
- AI 생성 원본과 1254→1024 source 정규화 중간물은 `tools/assets/rig-sources`에 두고, 검증된 512×512 RGBA runtime part만 `player/rig`에 둔다.
