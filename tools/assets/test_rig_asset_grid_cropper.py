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
from rig_asset_pipeline import AssetPipelineError, RUNTIME_CONTRACT, run_manifest


COLORS = (
    (230, 40, 50, 255),
    (40, 210, 90, 255),
    (40, 100, 230, 255),
    (230, 190, 40, 255),
)


def create_registered_grid(path: Path, *, columns: int, rows: int) -> None:
    image = Image.new("RGBA", (columns * 512, rows * 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    for column, color in enumerate(COLORS):
        left = column * 512 + 48
        draw.rectangle((left, 48, left + 415, 463), fill=color)
    image.save(path, format="PNG")
    image.close()


class ExplicitGridCropperTests(unittest.TestCase):
    def test_extracts_base_row_from_explicit_four_by_three_grid(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "player-registered-parts-v1.png"
            create_registered_grid(source, columns=4, rows=3)

            for column, expected_color in enumerate(COLORS):
                output = root / f"part-{column}.png"
                crop_sheet_cell(
                    source,
                    output,
                    row=0,
                    column=column,
                    columns=4,
                    rows=3,
                )
                with Image.open(output) as image:
                    self.assertEqual(image.size, (512, 512))
                    self.assertEqual(image.mode, "RGBA")
                    self.assertEqual(image.getpixel((256, 256)), expected_color)

    def test_rejects_grid_size_mismatch_invalid_dimensions_and_coordinates(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "grid.png"
            create_registered_grid(source, columns=4, rows=3)

            invalid_calls = (
                {"row": 0, "column": 0, "columns": 2, "rows": 2},
                {"row": 0, "column": 0, "columns": 0, "rows": 3},
                {"row": 3, "column": 0, "columns": 4, "rows": 3},
                {"row": 0, "column": 4, "columns": 4, "rows": 3},
            )
            for index, arguments in enumerate(invalid_calls):
                with self.subTest(index=index):
                    with self.assertRaises(SheetCropError):
                        crop_sheet_cell(source, root / f"bad-{index}.png", **arguments)


class ExplicitGridPipelineTests(unittest.TestCase):
    def test_manifest_passes_explicit_grid_dimensions(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            create_registered_grid(root / "atlas.png", columns=4, rows=3)
            manifest = root / "manifest.json"
            manifest.write_text(
                json.dumps(
                    {
                        "version": 1,
                        "runtime": RUNTIME_CONTRACT,
                        "sources": [
                            {
                                "id": "base-atlas",
                                "mode": "sheet",
                                "input": "atlas.png",
                                "columns": 4,
                                "rows": 3,
                                "cells": [
                                    {
                                        "id": "cockpit",
                                        "row": 0,
                                        "column": 3,
                                        "output": "runtime/cockpit.png",
                                    }
                                ],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            outputs = run_manifest(manifest)

            self.assertEqual(len(outputs), 1)
            with Image.open(outputs[0]) as image:
                self.assertEqual(image.getpixel((256, 256)), COLORS[3])

    def test_manifest_rejects_implicit_inference_and_out_of_range_cell(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            manifest = root / "manifest.json"
            manifest.write_text(
                json.dumps(
                    {
                        "version": 1,
                        "runtime": RUNTIME_CONTRACT,
                        "sources": [
                            {
                                "id": "invalid-grid",
                                "mode": "sheet",
                                "input": "atlas.png",
                                "columns": 4,
                                "rows": 3,
                                "cells": [
                                    {
                                        "id": "outside",
                                        "row": 0,
                                        "column": 4,
                                        "output": "runtime/outside.png",
                                    }
                                ],
                            }
                        ],
                    }
                ),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(AssetPipelineError, "between 0 and 3"):
                run_manifest(manifest)


if __name__ == "__main__":
    unittest.main()
