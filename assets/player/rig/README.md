# Player transition rig assets

## 역할

이 폴더는 기체 변경 애니메이션의 detach/attach 프레임에서만 사용하는 등록 부품을 보관한다. 안정 상태와 애니메이션 완료 상태의 시각 정본은 `assets/player/final-forms/<weapon>/<weapon>_<NN>.PNG`다.

생성 rig part는 완성 기체를 대체하거나 새로운 기체 디자인을 결정하지 않는다. 전환이 끝나면 part pose를 폐기하고 선택된 무기·레벨의 기존 final-form PNG로 settle해야 한다.

## 현재 범위

현재 production 범위는 등록된 기본 기체 4개 part와 Rapid/Energy/Spread/Nova 전환 부품이다.

| 파일 | 생성 경로 | 전환 역할 |
| --- | --- | --- |
| `rapid/core.png` | 단일 이미지 direct 등록 | 전환 중 core pulse/결합 기준 |
| `rapid/pod-left.png` | 2×2 sheet cell crop | 좌측 detach/attach part |
| `rapid/pod-right.png` | 2×2 sheet cell crop | 우측 detach/attach part |
| `rapid/barrel-left.png` | 2×2 sheet cell crop | 좌측 강화 part |
| `rapid/barrel-right.png` | 2×2 sheet cell crop | 우측 강화 part |

`base/fuselage.png`, `wings.png`, `engine.png`, `cockpit.png`는 기존 4×3 등록 atlas를 build-time exact-cell crop으로 이관한 기본 기체 part다. Energy, Spread, Nova는 각각 `core.png`, `nose.png`, `pod-left.png`, `pod-right.png` 전환 부품을 가진다. 이 부품이 없거나 검증에 실패하면 기체 정본을 임의 조립하지 말고 해당 final-form으로 즉시 settle하거나 명시된 crossfade fallback을 사용한다.

## Runtime 등록 계약

- 파일 형식: PNG
- 색상 모드: RGBA
- 캔버스: 512×512
- 원점: 캔버스 중앙
- 배경과 상·하·좌·우 외곽선 전체: 투명
- alpha bounds: 비어 있지 않아야 함
- runtime crop: 금지

모든 파일은 같은 등록 원점에서 합성할 수 있어야 한다. pivot, z-order, part id는 gameplay 값이 아니라 rig catalog의 선언 데이터가 소유한다.

## 생성 소스 흐름

```text
1024×1024 생성 요청
  -> 실제 1254×1254 imagegen 전송물
  -> #ff00ff chroma 제거, RGBA 1254×1254
  -> source normalizer, RGBA 1024×1024
  -> direct registrar 또는 exact 512-cell sheet cropper
  -> 검증된 RGBA 512×512 runtime part
```

- 생성 원본과 중간물: `tools/assets/rig-sources/`
- source 크기 예외 흡수: `tools/assets/rig_asset_source_normalizer.py`
- 단일 part 전체 등록: `tools/assets/rig_asset_direct.py`
- 2×2 생성 sheet와 4×3 legacy atlas의 exact cell 추출: `tools/assets/rig_asset_cropper.py`
- build 위임: `tools/assets/rig_asset_pipeline.py`

Source normalizer, direct registrar, sheet cropper는 서로 다른 책임이다. runtime 코드가 이 도구나 source sheet를 호출해서는 안 된다.

## 금지 경계

- rig part를 안정 상태의 완성 기체로 사용하지 않는다.
- 생성 part를 근거로 기존 Rapid, Energy, Spread, Nova final-form 디자인을 교체하지 않는다.
- level 또는 weapon 상태를 이미지 내용에서 추론하지 않는다.
- 누락 부품을 임의 생성하거나 다른 노선 부품으로 대체하지 않는다.
- 과거 evolution atlas를 runtime 강화 상태의 정본으로 복원하지 않는다.
