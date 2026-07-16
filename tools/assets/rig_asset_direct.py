"""Register one complete transparent rig-part image on a runtime canvas.

This module deliberately does not know about sheets, cells, chroma keys, game
manifests, or animation semantics. It preserves the complete square source and
only resizes it to the registered 512 x 512 canvas.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import tempfile

from PIL import Image


PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
RUNTIME_SIZE = (512, 512)


class DirectRegistrationError(ValueError):
    """Raised when a direct source cannot satisfy the runtime asset contract."""


def _has_png_signature(path: Path) -> bool:
    try:
        with path.open("rb") as source:
            return source.read(len(PNG_SIGNATURE)) == PNG_SIGNATURE
    except OSError:
        return False


def _validate_source(image: Image.Image, source_path: Path) -> None:
    if not _has_png_signature(source_path) or image.format != "PNG":
        raise DirectRegistrationError(f"source is not a PNG file: {source_path}")
    if image.mode != "RGBA":
        raise DirectRegistrationError(
            f"source must use RGBA color mode, got {image.mode}: {source_path}"
        )
    if image.width != image.height:
        raise DirectRegistrationError(
            f"direct source must be square, got {image.width}x{image.height}: "
            f"{source_path}"
        )
    if image.getchannel("A").getbbox() is None:
        raise DirectRegistrationError(f"source alpha bounds are empty: {source_path}")


def _validate_runtime_image(image: Image.Image, label: str) -> None:
    if image.mode != "RGBA":
        raise DirectRegistrationError(
            f"runtime image must use RGBA color mode, got {image.mode}: {label}"
        )
    if image.size != RUNTIME_SIZE:
        raise DirectRegistrationError(
            f"runtime image must be 512x512, got {image.width}x{image.height}: {label}"
        )
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise DirectRegistrationError(f"runtime alpha bounds are empty: {label}")
    left, top, right, bottom = bounds
    if left == 0 or top == 0 or right == RUNTIME_SIZE[0] or bottom == RUNTIME_SIZE[1]:
        raise DirectRegistrationError(
            f"runtime image outer edges must be fully transparent, alpha bounds "
            f"are {bounds}: {label}"
        )


def _validate_saved_output(path: Path) -> None:
    if not _has_png_signature(path):
        raise DirectRegistrationError(f"runtime output has no PNG signature: {path}")
    with Image.open(path) as image:
        _validate_runtime_image(image, str(path))


def register_direct_image(
    source_path: str | Path,
    output_path: str | Path,
) -> Path:
    """Resize a complete square RGBA PNG to one registered runtime canvas.

    No crop or cell selection is performed. The returned path is absolute.
    """

    source = Path(source_path).resolve()
    output = Path(output_path).resolve()
    if source == output:
        raise DirectRegistrationError("source and output paths must be different")

    try:
        with Image.open(source) as opened:
            _validate_source(opened, source)
            registered = opened.copy()
    except DirectRegistrationError:
        raise
    except (OSError, ValueError) as error:
        raise DirectRegistrationError(f"cannot read direct source {source}: {error}") from error

    if registered.size != RUNTIME_SIZE:
        registered = registered.resize(RUNTIME_SIZE, Image.Resampling.LANCZOS)
    _validate_runtime_image(registered, str(source))

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
        registered.save(temporary_path, format="PNG", optimize=True)
        _validate_saved_output(temporary_path)
        os.replace(temporary_path, output)
        temporary_path = None
    except DirectRegistrationError:
        raise
    except OSError as error:
        raise DirectRegistrationError(f"cannot write runtime output {output}: {error}") from error
    finally:
        registered.close()
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)

    _validate_saved_output(output)
    return output


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Register a complete square RGBA PNG as a 512x512 rig part."
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    output = register_direct_image(args.source, args.output)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
