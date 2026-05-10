param(
  [string]$Root = "D:\PROJ\galaxy-runner-canvas"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Runtime

function Clear-AtlasFringe($path, $columns, $rows, $edgeMargin, $alphaThreshold) {
  $source = [System.Drawing.Bitmap]::new($path)
  $bitmap = $null

  try {
    $bitmap = [System.Drawing.Bitmap]::new($source.Width, $source.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
      $graphics.DrawImage($source, 0, 0, $source.Width, $source.Height)
    } finally {
      $graphics.Dispose()
    }
  } finally {
    $source.Dispose()
  }

  $rect = [System.Drawing.Rectangle]::new(0, 0, $bitmap.Width, $bitmap.Height)
  $data = $bitmap.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bytes = [byte[]]::new([Math]::Abs($data.Stride) * $bitmap.Height)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)

  $cellWidth = [int]($bitmap.Width / $columns)
  $cellHeight = [int]($bitmap.Height / $rows)
  $cleared = 0

  for ($y = 0; $y -lt $bitmap.Height; $y += 1) {
    $localY = $y % $cellHeight
    $insideCellEdgeY = $localY -lt $edgeMargin -or $localY -ge ($cellHeight - $edgeMargin)

    for ($x = 0; $x -lt $bitmap.Width; $x += 1) {
      $localX = $x % $cellWidth
      $insideCellEdgeX = $localX -lt $edgeMargin -or $localX -ge ($cellWidth - $edgeMargin)
      $offset = $y * $data.Stride + $x * 4
      $alpha = $bytes[$offset + 3]

      if ($alpha -eq 0) { continue }
      if ($insideCellEdgeX -or $insideCellEdgeY -or $alpha -le $alphaThreshold) {
        $bytes[$offset] = 0
        $bytes[$offset + 1] = 0
        $bytes[$offset + 2] = 0
        $bytes[$offset + 3] = 0
        $cleared += 1
      }
    }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  $bitmap.UnlockBits($data)
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()

  return $cleared
}

$targets = @(
  @{ Path = Join-Path $Root "assets\enemies\enemy-ships-v1.png"; Columns = 3; Rows = 2; EdgeMargin = 8; AlphaThreshold = 30 },
  @{ Path = Join-Path $Root "assets\projectiles\projectiles-v1.png"; Columns = 4; Rows = 2; EdgeMargin = 8; AlphaThreshold = 24 }
)

foreach ($target in $targets) {
  $cleared = Clear-AtlasFringe $target.Path $target.Columns $target.Rows $target.EdgeMargin $target.AlphaThreshold
  Write-Output "$($target.Path): cleared $cleared fringe pixels"
}
