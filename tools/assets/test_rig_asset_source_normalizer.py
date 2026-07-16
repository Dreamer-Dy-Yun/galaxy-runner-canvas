from __future__ import annotations

from pathlib import Path
import sys
import tempfile
import unittest

from PIL import Image, ImageDraw


TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

from rig_asset_source_normalizer import (
    SourceNormalizationError,
    normalize_generated_source,
)


def create_source(path: Path, size: tuple[int, int]) -> None:
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    margin = max(32, size[0] // 20)
    band = max(80, size[1] // 8)
    draw.rectangle(
        (margin, margin, size[0] - margin - 1, margin + band),
        fill=(235, 60, 70, 255),
    )
    draw.rectangle(
        (
            margin,
            size[1] - margin - band - 1,
            size[0] - margin - 1,
            size[1] - margin - 1,
        ),
        fill=(40, 110, 235, 255),
    )
    image.save(path, format="PNG")
    image.close()


class SourceNormalizerTests(unittest.TestCase):
    def test_normalizes_actual_1254_delivery_without_cropping_content(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "imagegen-1254.png"
            output = root / "canonical" / "source.png"
            create_source(source, (1254, 1254))

            result = normalize_generated_source(source, output)

            self.assertEqual(result, output.resolve())
            self.assertEqual(output.read_bytes()[:8], b"\x89PNG\r\n\x1a\n")
            with Image.open(output) as image:
                self.assertEqual(image.mode, "RGBA")
                self.assertEqual(image.size, (1024, 1024))
                bounds = image.getchannel("A").getbbox()
                self.assertIsNotNone(bounds)
                assert bounds is not None
                self.assertLess(bounds[1], 100)
                self.assertGreater(bounds[3], 924)
                self.assertEqual(image.getpixel((0, 0))[3], 0)
                self.assertEqual(image.getpixel((1023, 1023))[3], 0)

    def test_keeps_canonical_1024_source_at_source_resolution(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "source.png"
            output = root / "output.png"
            create_source(source, (1024, 1024))

            normalize_generated_source(source, output)

            with Image.open(output) as image:
                self.assertEqual(image.size, (1024, 1024))
                self.assertNotEqual(image.size, (512, 512))

    def test_rejects_non_rgba_non_square_empty_and_opaque_corner_sources(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            invalid_sources: list[Path] = []

            rgb = root / "rgb.png"
            image = Image.new("RGB", (1254, 1254), (255, 0, 0))
            image.save(rgb, format="PNG")
            image.close()
            invalid_sources.append(rgb)

            rectangle = root / "rectangle.png"
            create_source(rectangle, (1254, 1024))
            invalid_sources.append(rectangle)

            empty = root / "empty.png"
            image = Image.new("RGBA", (1254, 1254), (0, 0, 0, 0))
            image.save(empty, format="PNG")
            image.close()
            invalid_sources.append(empty)

            opaque_corner = root / "opaque-corner.png"
            create_source(opaque_corner, (1254, 1254))
            with Image.open(opaque_corner) as opened:
                changed = opened.copy()
            changed.putpixel((0, 0), (255, 255, 255, 255))
            changed.save(opaque_corner, format="PNG")
            changed.close()
            invalid_sources.append(opaque_corner)

            for source in invalid_sources:
                with self.subTest(source=source.name):
                    with self.assertRaises(SourceNormalizationError):
                        normalize_generated_source(source, root / f"out-{source.name}")


if __name__ == "__main__":
    unittest.main()
