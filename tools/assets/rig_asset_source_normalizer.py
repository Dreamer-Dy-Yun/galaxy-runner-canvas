"""Normalize an image-generation delivery to one canonical source canvas.

This build-time module preserves the complete square RGBA source while resizing
it to 1024 x 1024. It does not register a 512 x 512 runtime part, crop cells,
remove chroma keys, or interpret a pipeline manifest.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import tempfile

from PIL import Image


PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
CANONICAL_SOURCE_SIZE = (1024, 1024)


class SourceNormalizationError(ValueError):
    """Raised when a generated source cannot satisfy the source contract."""


def _has_png_signature(path: Path) -> bool:
    try:
        with path.open("rb") as source:
            return source.read(len(PNG_SIGNATURE)) == PNG_SIGNATURE
    except OSError:
        return False


def _validate_square_rgba_source(image: Image.Image, source_path: Path) -> None:
    if not _has_png_signature(source_path) or image.format != "PNG":
        raise SourceNormalizationError(f"source is not a PNG file: {source_path}")
    if image.mode != "RGBA":
        raise SourceNormalizationError(
            f"source must use RGBA color mode, got {image.mode}: {source_path}"
        )
    if image.width != image.height:
        raise SourceNormalizationError(
            f"source must be square, got {image.width}x{image.height}: {source_path}"
        )
    alpha = image.getchannel("A")
    if alpha.getbbox() is None:
        raise SourceNormalizationError(f"source alpha bounds are empty: {source_path}")
    last = image.width - 1
    for point in ((0, 0), (last, 0), (0, last), (last, last)):
        if alpha.getpixel(point) != 0:
            raise SourceNormalizationError(
                f"source corner must be transparent at {point}: {source_path}"
            )


def _validate_canonical_image(image: Image.Image, label: str) -> None:
    if image.mode != "RGBA" or image.size != CANONICAL_SOURCE_SIZE:
        raise SourceNormalizationError(
            f"canonical source must be 1024x1024 RGBA: {label}"
        )
    alpha = image.getchannel("A")
    if alpha.getbbox() is None:
        raise SourceNormalizationError(f"canonical alpha bounds are empty: {label}")
    for point in ((0, 0), (1023, 0), (0, 1023), (1023, 1023)):
        if alpha.getpixel(point) != 0:
            raise SourceNormalizationError(
                f"canonical corner must be transparent at {point}: {label}"
            )


def _validate_saved_output(path: Path) -> None:
    if not _has_png_signature(path):
        raise SourceNormalizationError(
            f"canonical output has no PNG signature: {path}"
        )
    with Image.open(path) as image:
        _validate_canonical_image(image, str(path))


def normalize_generated_source(
    source_path: str | Path,
    output_path: str | Path,
) -> Path:
    """Preserve a complete square RGBA source on a 1024 x 1024 canvas."""

    source = Path(source_path).resolve()
    output = Path(output_path).resolve()
    if source == output:
        raise SourceNormalizationError("source and output paths must be different")

    try:
        with Image.open(source) as opened:
            _validate_square_rgba_source(opened, source)
            canonical = opened.copy()
    except SourceNormalizationError:
        raise
    except (OSError, ValueError) as error:
        raise SourceNormalizationError(
            f"cannot read generated source {source}: {error}"
        ) from error

    if canonical.size != CANONICAL_SOURCE_SIZE:
        canonical = canonical.resize(CANONICAL_SOURCE_SIZE, Image.Resampling.LANCZOS)
    _validate_canonical_image(canonical, str(source))

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            dir=output.parent,
            prefix=f".{output.stem}-",
            suffix=".png",
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
        canonical.save(temporary_path, format="PNG", optimize=True)
        _validate_saved_output(temporary_path)
        os.replace(temporary_path, output)
        temporary_path = None
    except SourceNormalizationError:
        raise
    except OSError as error:
        raise SourceNormalizationError(
            f"cannot write canonical source {output}: {error}"
        ) from error
    finally:
        canonical.close()
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)

    _validate_saved_output(output)
    return output


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Normalize a complete square RGBA source to 1024x1024."
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    output = normalize_generated_source(args.source, args.output)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
