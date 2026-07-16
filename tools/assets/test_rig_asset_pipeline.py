from __future__ import annotations

import json
from pathlib import Path
import sys
import tempfile
import unittest

from PIL import Image, ImageDraw


TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

from rig_asset_cropper import SheetCropError, crop_sheet_cell
from rig_asset_direct import DirectRegistrationError, register_direct_image
from rig_asset_pipeline import AssetPipelineError, RUNTIME_CONTRACT, run_manifest


COLORS = (
    (230, 40, 50, 255),
    (40, 210, 90, 255),
    (40, 100, 230, 255),
    (230, 190, 40, 255),
)


def create_direct_source(path: Path, size: tuple[int, int] = (1024, 1024)) -> None:
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle((64, 64, size[0] - 65, 200), fill=COLORS[0])
    draw.rectangle((64, size[1] - 201, size[0] - 65, size[1] - 65), fill=COLORS[2])
    image.save(path, format="PNG")
    image.close()


def create_sheet_source(path: Path, size: tuple[int, int] = (1024, 1024)) -> None:
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    if size == (1024, 1024):
        draw = ImageDraw.Draw(image)
        for index, color in enumerate(COLORS):
            row, column = divmod(index, 2)
            left = column * 512 + 48
            top = row * 512 + 48
            draw.rectangle((left, top, left + 415, top + 415), fill=color)
    image.save(path, format="PNG")
    image.close()


def assert_runtime_png(test: unittest.TestCase, path: Path) -> None:
    test.assertEqual(path.read_bytes()[:8], b"\x89PNG\r\n\x1a\n")
    with Image.open(path) as image:
        test.assertEqual(image.mode, "RGBA")
        test.assertEqual(image.size, (512, 512))
        alpha = image.getchannel("A")
        test.assertIsNotNone(alpha.getbbox())
        for point in ((0, 0), (511, 0), (0, 511), (511, 511)):
            test.assertEqual(alpha.getpixel(point), 0)


class DirectRegistrationTests(unittest.TestCase):
    def test_registers_complete_square_source_without_crop(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "direct.png"
            output = root / "runtime" / "core.png"
            create_direct_source(source)

            result = register_direct_image(source, output)

            self.assertEqual(result, output.resolve())
            assert_runtime_png(self, output)
            with Image.open(output) as image:
                self.assertGreater(image.getpixel((256, 64))[3], 0)
                self.assertGreater(image.getpixel((256, 448))[3], 0)

    def test_rejects_non_rgba_non_square_empty_and_opaque_corner_sources(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            invalid_sources: list[Path] = []

            rgb = root / "rgb.png"
            Image.new("RGB", (1024, 1024), (255, 0, 0)).save(rgb, format="PNG")
            invalid_sources.append(rgb)

            rectangle = root / "rectangle.png"
            create_direct_source(rectangle, (1024, 768))
            invalid_sources.append(rectangle)

            empty = root / "empty.png"
            Image.new("RGBA", (1024, 1024), (0, 0, 0, 0)).save(empty, format="PNG")
            invalid_sources.append(empty)

            opaque_corner = root / "opaque-corner.png"
            create_direct_source(opaque_corner)
            with Image.open(opaque_corner) as image:
                changed = image.copy()
            changed.putpixel((0, 0), (255, 255, 255, 255))
            changed.save(opaque_corner, format="PNG")
            changed.close()
            invalid_sources.append(opaque_corner)

            for source in invalid_sources:
                with self.subTest(source=source.name):
                    with self.assertRaises(DirectRegistrationError):
                        register_direct_image(source, root / f"out-{source.name}")


class SheetCropTests(unittest.TestCase):
    def test_crops_each_explicit_cell_without_resize(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "sheet.png"
            create_sheet_source(source)

            for index, expected_color in enumerate(COLORS):
                row, column = divmod(index, 2)
                output = root / "runtime" / f"cell-{row}-{column}.png"
                result = crop_sheet_cell(
                    source,
                    output,
                    row=row,
                    column=column,
                )
                self.assertEqual(result, output.resolve())
                assert_runtime_png(self, output)
                with Image.open(output) as image:
                    self.assertEqual(image.getpixel((256, 256)), expected_color)

    def test_rejects_wrong_sheet_size_mode_coordinate_and_empty_cell(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            wrong_size = root / "wrong-size.png"
            create_sheet_source(wrong_size, (512, 512))
            with self.assertRaises(SheetCropError):
                crop_sheet_cell(wrong_size, root / "a.png", row=0, column=0)

            rgb = root / "rgb.png"
            Image.new("RGB", (1024, 1024), (255, 0, 0)).save(rgb, format="PNG")
            with self.assertRaises(SheetCropError):
                crop_sheet_cell(rgb, root / "b.png", row=0, column=0)

            valid = root / "valid.png"
            create_sheet_source(valid)
            with self.assertRaises(SheetCropError):
                crop_sheet_cell(valid, root / "c.png", row=2, column=0)

            empty_cell = root / "empty-cell.png"
            image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
            ImageDraw.Draw(image).rectangle((48, 48, 463, 463), fill=COLORS[0])
            image.save(empty_cell, format="PNG")
            image.close()
            with self.assertRaises(SheetCropError):
                crop_sheet_cell(empty_cell, root / "d.png", row=1, column=1)


class PipelineTests(unittest.TestCase):
    def _write_manifest(self, path: Path, sources: list[dict[str, object]]) -> None:
        path.write_text(
            json.dumps(
                {"version": 1, "runtime": RUNTIME_CONTRACT, "sources": sources},
                indent=2,
            ),
            encoding="utf-8",
        )

    def test_dispatches_direct_and_sheet_sources(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            create_direct_source(root / "direct.png")
            create_sheet_source(root / "sheet.png")
            manifest = root / "manifest.json"
            self._write_manifest(
                manifest,
                [
                    {
                        "id": "core",
                        "mode": "direct",
                        "input": "direct.png",
                        "output": "runtime/core.png",
                    },
                    {
                        "id": "pods",
                        "mode": "sheet",
                        "input": "sheet.png",
                        "cells": [
                            {
                                "id": "left",
                                "row": 0,
                                "column": 0,
                                "output": "runtime/left.png",
                            },
                            {
                                "id": "right",
                                "row": 0,
                                "column": 1,
                                "output": "runtime/right.png",
                            },
                        ],
                    },
                ],
            )

            outputs = run_manifest(manifest)

            self.assertEqual(len(outputs), 3)
            for output in outputs:
                assert_runtime_png(self, output)

    def test_rejects_semantic_keys_unknown_modes_and_duplicate_outputs(self) -> None:
        cases = (
            [
                {
                    "id": "semantic",
                    "mode": "direct",
                    "input": "direct.png",
                    "output": "runtime/core.png",
                    "weaponKind": "rapid",
                }
            ],
            [
                {
                    "id": "unknown",
                    "mode": "atlas",
                    "input": "direct.png",
                    "output": "runtime/core.png",
                }
            ],
            [
                {
                    "id": "first",
                    "mode": "direct",
                    "input": "direct.png",
                    "output": "runtime/core.png",
                },
                {
                    "id": "second",
                    "mode": "direct",
                    "input": "direct.png",
                    "output": "runtime/core.png",
                },
            ],
        )
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            create_direct_source(root / "direct.png")
            for index, sources in enumerate(cases):
                manifest = root / f"invalid-{index}.json"
                self._write_manifest(manifest, sources)
                with self.subTest(index=index):
                    with self.assertRaises(AssetPipelineError):
                        run_manifest(manifest)

    def test_reports_source_and_cell_identifiers_on_build_failure(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            sheet = root / "sheet.png"
            image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
            ImageDraw.Draw(image).rectangle((48, 48, 463, 463), fill=COLORS[0])
            image.save(sheet, format="PNG")
            image.close()
            manifest = root / "manifest.json"
            self._write_manifest(
                manifest,
                [
                    {
                        "id": "rapid-sheet",
                        "mode": "sheet",
                        "input": "sheet.png",
                        "cells": [
                            {
                                "id": "missing-part",
                                "row": 1,
                                "column": 1,
                                "output": "runtime/missing.png",
                            }
                        ],
                    }
                ],
            )

            with self.assertRaisesRegex(
                AssetPipelineError, "rapid-sheet, cell missing-part"
            ):
                run_manifest(manifest)


if __name__ == "__main__":
    unittest.main()
