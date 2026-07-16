# Rig asset build tools

이 폴더는 AI 생성 원본 또는 사람이 만든 원본을 게임에서 바로 읽는 rig part PNG로 **빌드할 때만** 사용한다. 게임 런타임은 이 폴더의 Python 모듈, source sheet, manifest를 참조하거나 이미지를 잘라서는 안 된다.

## 출력 계약

모든 최종 출력은 아래 조건을 만족해야 한다.

| 항목 | 값 |
| --- | --- |
| 파일 형식 | PNG signature가 있는 PNG |
| 색상 모드 | RGBA |
| 등록 캔버스 | 512×512 |
| 원점 | 캔버스 중앙 |
| 배경 | 투명 |
| 외곽선 | 상·하·좌·우 전체 alpha 0 |
| 실체 | 비어 있지 않은 alpha bounds |
| 런타임 crop | 금지 |

입력 이미지의 `#ff00ff` chroma 제거는 설치된 imagegen 도구의 `remove_chroma_key.py`가 담당한다. 이 폴더의 direct registrar와 sheet cropper는 chroma를 제거하거나 RGB 입력을 RGBA로 암묵 변환하지 않는다. 따라서 manifest에 연결하는 파일은 chroma 제거가 끝난 RGBA PNG여야 한다.

## 파일 책임

| 파일/폴더 | 책임 | 하지 않는 일 |
| --- | --- | --- |
| `rig_asset_source_normalizer.py` | imagegen 전송물 전체를 canonical 1024×1024 source로 정규화 | runtime 512 등록, cell crop, chroma 제거, manifest 처리 |
| `rig_asset_direct.py` | 중앙에 배치된 단일 정사각 RGBA PNG 전체를 512×512로 정규화 | cell 선택, 부분 crop, 여러 part 분리, chroma 제거 |
| `rig_asset_cropper.py` | 명시한 columns×rows RGBA grid에서 row/column의 512×512 cell 추출 | resize, grid 크기 자동 추론, gameplay/asset catalog 해석, chroma 제거 |
| `rig_asset_pipeline.py` | source manifest 검증과 `mode: direct | sheet` 위임 | direct/crop 알고리즘, gameplay 의미 추론 |
| `test_rig_asset_source_normalizer.py` | 생성 전송물 크기 예외와 canonical source 계약 검증 | runtime asset 생성 |
| `test_rig_asset_pipeline.py` | direct/crop 책임과 최종 출력 계약의 독립 검증 | production asset 생성 |
| `rig-sources/` | AI 생성 원본과 chroma 제거 중간물 및 build manifest 보관 | 게임 런타임 제공 |
| `../../assets/player/rig/` | 검증을 통과한 최종 512×512 runtime PNG 보관 | source sheet와 중간물 보관 |

## 생성 소스 준비

프롬프트에서 1024×1024를 요청해도 imagegen이 1254×1254 같은 다른 정사각 크기로 전송할 수 있다. 이 예외는 direct registrar나 sheet cropper가 아니라 source normalizer에서 흡수한다.

처리 순서는 다음과 같다.

1. `#ff00ff` 배경으로 이미지를 생성한다.
2. 설치된 `remove_chroma_key.py`로 배경을 제거해 RGBA PNG를 만든다.
3. `rig_asset_source_normalizer.py`로 전체 이미지를 보존해 정확한 1024×1024 source로 만든다.
4. canonical source를 direct registrar 또는 sheet cropper에 전달한다.

```powershell
python tools/assets/rig_asset_source_normalizer.py `
  tools/assets/rig-sources/rapid-core.transparent.delivery.png `
  tools/assets/rig-sources/rapid-core.transparent.png
```

normalizer는 정사각 RGBA 입력만 받으며 투명 코너와 non-empty alpha bounds를 검증한다. 출력은 source 보관용 1024×1024 PNG이며 `assets/player/rig/`에 직접 저장하지 않는다. source manifest의 `mode`에도 포함되지 않는다.

## Runtime 입력 크기

### Direct image registration

- 생성 요청 기본 크기: 1024×1024, 전송 크기가 다르면 source normalizer로 먼저 canonical화
- 입력: 단일 part 전체가 중앙에 있고 외곽선이 투명한 canonical 1024×1024 RGBA PNG
- 처리: 이미지 전체를 보존한 채 512×512로 resize
- 출력: 512×512 RGBA PNG 한 장
- 금지: 관심 영역 crop, cell 선택, 복수 part 분해

```powershell
python tools/assets/rig_asset_direct.py `
  tools/assets/rig-sources/rapid-core.transparent.png `
  assets/player/rig/rapid/core.png
```

### Sheet cell cropping

- 생성 요청 크기: 1024×1024, 전송 크기가 다르면 source normalizer로 먼저 canonical화
- 기본 cropper 입력: 2×2, 정확히 1024×1024
- 일반 grid 입력: 명시한 `columns * 512` × `rows * 512`와 정확히 일치해야 함
- `columns`, `rows` 기본값: 각각 2. 크기를 이미지 내용에서 자동 추론하지 않음
- 입력: 각 cell의 part가 해당 cell 경계를 넘지 않고 네 외곽선 전체가 투명한 RGBA PNG
- 처리: manifest의 `row`, `column`만 사용한 exact crop
- 출력: cell마다 512×512 RGBA PNG 한 장
- 금지: resize, 내용 기반 자동 crop, gameplay 종류 추론

```powershell
python tools/assets/rig_asset_cropper.py `
  tools/assets/rig-sources/rapid-upgrade-sheet.transparent.png `
  assets/player/rig/rapid/pod-left.png `
  --row 0 --column 0
```

기존 4×3 등록 atlas처럼 이미 512 cell grid인 source는 source normalizer를 거치지 않고 명시적 grid 크기로 추출한다.

```powershell
python tools/assets/rig_asset_cropper.py `
  assets/player/player-registered-parts-v1.png `
  assets/player/rig/base/cockpit.png `
  --columns 4 --rows 3 --row 0 --column 3
```

## Manifest pipeline

[`rig-sources/manifest.example.json`](rig-sources/manifest.example.json)은 build-time source 계약 예시다. 모든 경로는 manifest 파일이 있는 폴더를 기준으로 한 상대 경로다. 지원하는 key 외에 `weaponKind`, `level` 같은 gameplay 의미를 넣으면 검증에 실패한다.

```powershell
python tools/assets/rig_asset_pipeline.py `
  tools/assets/rig-sources/manifest.json
```

pipeline은 먼저 manifest 전체의 id, mode, 좌표, 중복 output을 검증한 뒤 각 전용 모듈에 위임한다. source나 cell 검증이 실패하면 해당 source id와 cell id를 포함한 오류로 중단하며 자동 보정하지 않는다.

## 테스트

```powershell
python -m unittest tools/assets/test_rig_asset_pipeline.py -v
python -m unittest tools/assets/test_rig_asset_source_normalizer.py -v
python -m unittest tools/assets/test_rig_asset_edge_contract.py -v
```

테스트는 생성 전송물의 canonical 1024 변환, direct 전체 이미지 보존, direct/crop 책임 분리, 기본 2×2와 명시적 4×3 exact grid crop, PNG/RGBA/크기/투명 외곽선/alpha bounds, manifest의 비즈니스 의미 차단, 실패 id 노출을 검증한다.
