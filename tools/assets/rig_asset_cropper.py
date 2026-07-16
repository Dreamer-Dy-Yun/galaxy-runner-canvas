"""Extract one exact build-time cell from an explicit 512-cell PNG grid.

This module deliberately does not resize images, remove chroma keys, select
runtime assets, or interpret gameplay manifests. A caller must provide an
explicit row and column.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import tempfile

from PIL import Image


PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
CELL_SIZE = 512
DEFAULT_COLUMNS = 2
DEFAULT_ROWS = 2


class SheetCropError(ValueError):
    """Raised when a sheet or selected cell violates the asset contract."""


def _has_png_signature(path: Path) -> bool:
    try:
        with path.open("rb") as source:
            return source.read(len(PNG_SIGNATURE)) == PNG_SIGNATURE
    except OSError:
        return False


def _validate_grid_size(value: int, name: str) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise SheetCropError(f"{name} must be a positive integer, got {value!r}")


def _validate_sheet(
    image: Image.Image,
    source_path: Path,
    *,
    columns: int,
    rows: int,
) -> None:
    if not _has_png_signature(source_path) or image.format != "PNG":
        raise SheetCropError(f"sheet is not a PNG file: {source_path}")
    if image.mode != "RGBA":
        raise SheetCropError(
            f"sheet must use RGBA color mode, got {image.mode}: {source_path}"
        )
    expected_size = (columns * CELL_SIZE, rows * CELL_SIZE)
    if image.size != expected_size:
        raise SheetCropError(
            f"sheet must be exactly {expected_size[0]}x{expected_size[1]} for "
            f"columns={columns}, rows={rows}; got {image.width}x{image.height}: "
            f"{source_path}"
        )


def _validate_coordinate(value: int, name: str, limit: int) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value < limit:
        raise SheetCropError(
            f"{name} must be an integer from 0 through {limit - 1}, got {value!r}"
        )


def _validate_runtime_cell(image: Image.Image, label: str) -> None:
    if image.mode != "RGBA" or image.size != (CELL_SIZE, CELL_SIZE):
        raise SheetCropError(f"cell must be 512x512 RGBA: {label}")
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise SheetCropError(f"cell alpha bounds are empty: {label}")
    left, top, right, bottom = bounds
    if left == 0 or top == 0 or right == CELL_SIZE or bottom == CELL_SIZE:
        raise SheetCropError(
            f"cell outer edges must be fully transparent, alpha bounds are "
            f"{bounds}: {label}"
        )


def _validate_saved_output(path: Path) -> None:
    if not _has_png_signature(path):
        raise SheetCropError(f"runtime output has no PNG signature: {path}")
    with Image.open(path) as image:
        _validate_runtime_cell(image, str(path))


def crop_sheet_cell(
    source_path: str | Path,
    output_path: str | Path,
    *,
    row: int,
    column: int,
    columns: int = DEFAULT_COLUMNS,
    rows: int = DEFAULT_ROWS,
) -> Path:
    """Crop one explicit 512 x 512 cell without resizing or semantic inference."""

    _validate_grid_size(columns, "columns")
    _validate_grid_size(rows, "rows")
    _validate_coordinate(row, "row", rows)
    _validate_coordinate(column, "column", columns)
    source = Path(source_path).resolve()
    output = Path(output_path).resolve()
    if source == output:
        raise SheetCropError("sheet source and output paths must be different")

    try:
        with Image.open(source) as sheet:
            _validate_sheet(sheet, source, columns=columns, rows=rows)
            left = column * CELL_SIZE
            top = row * CELL_SIZE
            cell = sheet.crop((left, top, left + CELL_SIZE, top + CELL_SIZE))
    except SheetCropError:
        raise
    except (OSError, ValueError) as error:
        raise SheetCropError(f"cannot read sheet {source}: {error}") from error

    _validate_runtime_cell(
        cell,
        f"{source} row={row} column={column} columns={columns} rows={rows}",
    )
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
        cell.save(temporary_path, format="PNG", optimize=True)
        _validate_saved_output(temporary_path)
        os.replace(temporary_path, output)
        temporary_path = None
    except SheetCropError:
        raise
    except OSError as error:
        raise SheetCropError(f"cannot write runtime output {output}: {error}") from error
    finally:
        cell.close()
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)

    _validate_saved_output(output)
    return output


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Crop one explicit 512x512 cell from an exact RGBA grid."
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--row", type=int, required=True)
    parser.add_argument("--column", type=int, required=True)
    parser.add_argument("--columns", type=int, default=DEFAULT_COLUMNS)
    parser.add_argument("--rows", type=int, default=DEFAULT_ROWS)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    output = crop_sheet_cell(
        args.source,
        args.output,
        row=args.row,
        column=args.column,
        columns=args.columns,
        rows=args.rows,
    )
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
