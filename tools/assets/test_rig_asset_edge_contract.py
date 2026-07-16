"""Regression tests for fully transparent runtime outer-edge validation."""

from __future__ import annotations

from pathlib import Path
import tempfile
import unittest

from PIL import Image, ImageDraw

from rig_asset_cropper import SheetCropError, crop_sheet_cell
from rig_asset_direct import DirectRegistrationError, register_direct_image


def edge_touching_image(size: tuple[int, int]) -> Image.Image:
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle((200, 0, 312, 240), fill=(255, 255, 255, 255))
    return image


class RuntimeEdgeContractTests(unittest.TestCase):
    def test_direct_registration_rejects_non_corner_edge_alpha(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "direct.png"
            output = root / "runtime.png"
            edge_touching_image((512, 512)).save(source, format="PNG")

            with self.assertRaisesRegex(DirectRegistrationError, "outer edges"):
                register_direct_image(source, output)
            self.assertFalse(output.exists())

    def test_sheet_crop_rejects_non_corner_edge_alpha(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "sheet.png"
            output = root / "cell.png"
            sheet = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
            cell = edge_touching_image((512, 512))
            sheet.alpha_composite(cell, (0, 0))
            sheet.save(source, format="PNG")
            cell.close()
            sheet.close()

            with self.assertRaisesRegex(SheetCropError, "outer edges"):
                crop_sheet_cell(source, output, row=0, column=0)
            self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
