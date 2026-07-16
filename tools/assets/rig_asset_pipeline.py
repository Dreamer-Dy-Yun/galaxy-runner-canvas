"""Build-time orchestration for direct and sheet-based rig asset sources."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from rig_asset_cropper import SheetCropError, crop_sheet_cell
from rig_asset_direct import DirectRegistrationError, register_direct_image


RUNTIME_CONTRACT = {
    "format": "PNG",
    "colorMode": "RGBA",
    "width": 512,
    "height": 512,
    "origin": "center",
    "background": "transparent",
    "runtimeCrop": False,
}
TOP_LEVEL_KEYS = {"version", "runtime", "sources"}
DIRECT_KEYS = {"id", "mode", "input", "output"}
SHEET_KEYS = {"id", "mode", "input", "columns", "rows", "cells"}
CELL_KEYS = {"id", "row", "column", "output"}


class AssetPipelineError(ValueError):
    """Raised when a source manifest or delegated build step is invalid."""


def _expect_object(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise AssetPipelineError(f"{label} must be an object")
    return value


def _expect_nonempty_string(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise AssetPipelineError(f"{label} must be a non-empty string")
    return value


def _reject_unknown_keys(value: dict[str, Any], allowed: set[str], label: str) -> None:
    unknown = sorted(set(value) - allowed)
    if unknown:
        raise AssetPipelineError(f"{label} has unsupported keys: {', '.join(unknown)}")


def _resolve_manifest_path(root: Path, value: Any, label: str) -> Path:
    raw = Path(_expect_nonempty_string(value, label))
    if raw.is_absolute():
        raise AssetPipelineError(f"{label} must be relative to the manifest directory")
    return (root / raw).resolve()


def _validate_manifest(data: Any, root: Path) -> list[dict[str, Any]]:
    manifest = _expect_object(data, "manifest")
    _reject_unknown_keys(manifest, TOP_LEVEL_KEYS, "manifest")
    if manifest.get("version") != 1:
        raise AssetPipelineError("manifest.version must be 1")
    if manifest.get("runtime") != RUNTIME_CONTRACT:
        raise AssetPipelineError(
            "manifest.runtime must exactly match the documented 512x512 RGBA contract"
        )

    sources = manifest.get("sources")
    if not isinstance(sources, list) or not sources:
        raise AssetPipelineError("manifest.sources must be a non-empty array")

    normalized: list[dict[str, Any]] = []
    source_ids: set[str] = set()
    output_paths: set[Path] = set()
    for index, raw_source in enumerate(sources):
        source = _expect_object(raw_source, f"sources[{index}]")
        source_id = _expect_nonempty_string(source.get("id"), f"sources[{index}].id")
        if source_id in source_ids:
            raise AssetPipelineError(f"duplicate source id: {source_id}")
        source_ids.add(source_id)

        mode = source.get("mode")
        if mode == "direct":
            _reject_unknown_keys(source, DIRECT_KEYS, f"source {source_id}")
            output = _resolve_manifest_path(root, source.get("output"), f"{source_id}.output")
            if output in output_paths:
                raise AssetPipelineError(f"duplicate output path: {output}")
            output_paths.add(output)
            normalized.append(
                {
                    "id": source_id,
                    "mode": mode,
                    "input": _resolve_manifest_path(
                        root, source.get("input"), f"{source_id}.input"
                    ),
                    "output": output,
                }
            )
            continue

        if mode == "sheet":
            _reject_unknown_keys(source, SHEET_KEYS, f"source {source_id}")
            columns = source.get("columns", 2)
            rows = source.get("rows", 2)
            if isinstance(columns, bool) or not isinstance(columns, int) or columns < 1:
                raise AssetPipelineError(f"{source_id}.columns must be a positive integer")
            if isinstance(rows, bool) or not isinstance(rows, int) or rows < 1:
                raise AssetPipelineError(f"{source_id}.rows must be a positive integer")
            cells = source.get("cells")
            if not isinstance(cells, list) or not cells:
                raise AssetPipelineError(f"{source_id}.cells must be a non-empty array")
            cell_ids: set[str] = set()
            normalized_cells: list[dict[str, Any]] = []
            for cell_index, raw_cell in enumerate(cells):
                cell = _expect_object(raw_cell, f"{source_id}.cells[{cell_index}]")
                _reject_unknown_keys(
                    cell, CELL_KEYS, f"{source_id}.cells[{cell_index}]"
                )
                cell_id = _expect_nonempty_string(
                    cell.get("id"), f"{source_id}.cells[{cell_index}].id"
                )
                if cell_id in cell_ids:
                    raise AssetPipelineError(f"duplicate cell id in {source_id}: {cell_id}")
                cell_ids.add(cell_id)
                row = cell.get("row")
                column = cell.get("column")
                if (
                    isinstance(row, bool)
                    or not isinstance(row, int)
                    or not 0 <= row < rows
                ):
                    raise AssetPipelineError(
                        f"{source_id}/{cell_id}.row must be between 0 and {rows - 1}"
                    )
                if (
                    isinstance(column, bool)
                    or not isinstance(column, int)
                    or not 0 <= column < columns
                ):
                    raise AssetPipelineError(
                        f"{source_id}/{cell_id}.column must be between 0 and "
                        f"{columns - 1}"
                    )
                output = _resolve_manifest_path(
                    root, cell.get("output"), f"{source_id}/{cell_id}.output"
                )
                if output in output_paths:
                    raise AssetPipelineError(f"duplicate output path: {output}")
                output_paths.add(output)
                normalized_cells.append(
                    {"id": cell_id, "row": row, "column": column, "output": output}
                )
            normalized.append(
                {
                    "id": source_id,
                    "mode": mode,
                    "input": _resolve_manifest_path(
                        root, source.get("input"), f"{source_id}.input"
                    ),
                    "columns": columns,
                    "rows": rows,
                    "cells": normalized_cells,
                }
            )
            continue

        raise AssetPipelineError(
            f"source {source_id} mode must be 'direct' or 'sheet', got {mode!r}"
        )
    return normalized


def run_manifest(manifest_path: str | Path) -> tuple[Path, ...]:
    """Validate a source manifest and delegate each build operation."""

    manifest = Path(manifest_path).resolve()
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise AssetPipelineError(f"cannot read manifest {manifest}: {error}") from error

    sources = _validate_manifest(data, manifest.parent)
    outputs: list[Path] = []
    for source in sources:
        source_id = source["id"]
        try:
            if source["mode"] == "direct":
                outputs.append(register_direct_image(source["input"], source["output"]))
                continue
            for cell in source["cells"]:
                try:
                    outputs.append(
                        crop_sheet_cell(
                            source["input"],
                            cell["output"],
                            row=cell["row"],
                            column=cell["column"],
                            columns=source["columns"],
                            rows=source["rows"],
                        )
                    )
                except SheetCropError as error:
                    raise AssetPipelineError(
                        f"source {source_id}, cell {cell['id']} failed: {error}"
                    ) from error
        except DirectRegistrationError as error:
            raise AssetPipelineError(f"source {source_id} failed: {error}") from error
    return tuple(outputs)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build validated rig assets from a direct-or-sheet source manifest."
    )
    parser.add_argument("manifest", type=Path)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    for output in run_manifest(args.manifest):
        print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
