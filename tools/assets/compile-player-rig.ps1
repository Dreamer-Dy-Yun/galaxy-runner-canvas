param(
  [string]$Root = "D:\PROJ\galaxy-runner-canvas"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function New-TransparentBitmap($width, $height) {
  $bmp = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  try { $gfx.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0)) }
  finally { $gfx.Dispose() }
  return $bmp
}

function Find-AlphaBounds($image, $rect, $threshold) {
  $minX = $rect.Right
  $minY = $rect.Bottom
  $maxX = $rect.Left - 1
  $maxY = $rect.Top - 1

  for ($y = $rect.Top; $y -lt $rect.Bottom; $y++) {
    for ($x = $rect.Left; $x -lt $rect.Right; $x++) {
      if ($image.GetPixel($x, $y).A -le $threshold) { continue }
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }

  if ($maxX -lt $minX -or $maxY -lt $minY) { return $null }
  return [System.Drawing.Rectangle]::FromLTRB($minX, $minY, $maxX + 1, $maxY + 1)
}

function Draw-RegisteredCell($graphics, $source, $sourceCols, $sourceRows, $cellSize, $col, $row, $target, $threshold = 20) {
  $sourceCellWidth = [int][Math]::Floor($source.Width / $sourceCols)
  $sourceCellHeight = [int][Math]::Floor($source.Height / $sourceRows)
  $sourceRect = [System.Drawing.Rectangle]::new($col * $sourceCellWidth, $row * $sourceCellHeight, $sourceCellWidth, $sourceCellHeight)
  $bounds = Find-AlphaBounds $source $sourceRect $threshold
  if ($null -eq $bounds) { return }

  $destX = [int][Math]::Round($target.x - $target.w / 2 + $col * $cellSize)
  $destY = [int][Math]::Round($target.y - $target.h / 2 + $row * $cellSize)
  $destRect = [System.Drawing.Rectangle]::new($destX, $destY, [int][Math]::Round($target.w), [int][Math]::Round($target.h))
  $graphics.DrawImage($source, $destRect, $bounds, [System.Drawing.GraphicsUnit]::Pixel)
}

function Compile-RegisteredAtlas($inputPath, $outputPath, $sourceCols, $sourceRows, $targetMap) {
  $cellSize = 512
  $source = [System.Drawing.Bitmap]::new($inputPath)
  $output = New-TransparentBitmap ($cellSize * $sourceCols) ($cellSize * $sourceRows)
  $graphics = [System.Drawing.Graphics]::FromImage($output)
  try {
    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    foreach ($entry in $targetMap) {
      Draw-RegisteredCell $graphics $source $sourceCols $sourceRows $cellSize $entry.col $entry.row $entry.target $entry.threshold
    }
    $output.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $output.Dispose()
    $source.Dispose()
  }
}

$playerTargets = @(
  @{ col = 0; row = 0; threshold = 35; target = @{ x = 256; y = 236; w = 104; h = 330 } },
  @{ col = 1; row = 0; threshold = 35; target = @{ x = 256; y = 292; w = 355; h = 220 } },
  @{ col = 2; row = 0; threshold = 35; target = @{ x = 256; y = 360; w = 150; h = 130 } },
  @{ col = 3; row = 0; threshold = 35; target = @{ x = 256; y = 205; w = 54; h = 132 } },

  @{ col = 0; row = 1; threshold = 35; target = @{ x = 256; y = 232; w = 120; h = 260 } },
  @{ col = 1; row = 1; threshold = 35; target = @{ x = 256; y = 260; w = 200; h = 250 } },
  @{ col = 2; row = 1; threshold = 35; target = @{ x = 256; y = 292; w = 350; h = 230 } },
  @{ col = 3; row = 1; threshold = 35; target = @{ x = 256; y = 310; w = 170; h = 220 } },

  @{ col = 0; row = 2; threshold = 35; target = @{ x = 256; y = 260; w = 320; h = 345 } },
  @{ col = 1; row = 2; threshold = 35; target = @{ x = 256; y = 256; w = 380; h = 340 } },
  @{ col = 2; row = 2; threshold = 35; target = @{ x = 236; y = 280; w = 150; h = 310 } },
  @{ col = 3; row = 2; threshold = 35; target = @{ x = 276; y = 280; w = 150; h = 310 } }
)

$thrusterTargets = @()
for ($row = 0; $row -lt 3; $row++) {
  for ($col = 0; $col -lt 4; $col++) {
    if ($row -eq 0) { $target = @{ x = 256; y = 418; w = 112; h = 92 }; $threshold = 120 }
    elseif ($row -eq 1) { $target = @{ x = 256; y = 452; w = 118; h = 160 }; $threshold = 110 }
    else { $target = @{ x = 256; y = 402; w = 96; h = 58 }; $threshold = 135 }
    $thrusterTargets += @{ col = $col; row = $row; threshold = $threshold; target = $target }
  }
}

$playerInput = Join-Path $Root "assets\player\source\player-parts-ai-v1.png"
$playerOutput = Join-Path $Root "assets\player\player-registered-parts-v1.png"
$thrusterInput = Join-Path $Root "assets\player\source\thruster-flames-ai-v1.png"
$thrusterOutput = Join-Path $Root "assets\player\thruster-registered-v1.png"

Compile-RegisteredAtlas $playerInput $playerOutput 4 3 $playerTargets
Compile-RegisteredAtlas $thrusterInput $thrusterOutput 4 3 $thrusterTargets
