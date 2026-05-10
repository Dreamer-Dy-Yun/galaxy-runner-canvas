param(
  [string]$Root = "D:\PROJ\galaxy-runner-canvas"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function Set-Quality($graphics) {
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
}

function New-Color($hex, [int]$alpha = 255) {
  $base = [System.Drawing.ColorTranslator]::FromHtml($hex)
  return [System.Drawing.Color]::FromArgb($alpha, $base.R, $base.G, $base.B)
}

function Fill-Path($graphics, $points, $hex, $alpha) {
  $poly = @()
  foreach ($point in $points) {
    $poly += [System.Drawing.PointF]::new([float]$point[0], [float]$point[1])
  }
  $brush = [System.Drawing.SolidBrush]::new((New-Color $hex $alpha))
  try { $graphics.FillPolygon($brush, $poly) } finally { $brush.Dispose() }
}

function Stroke-Line($graphics, $x1, $y1, $x2, $y2, $hex, $alpha, $width) {
  $pen = [System.Drawing.Pen]::new((New-Color $hex $alpha), [float]$width)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  try { $graphics.DrawLine($pen, [float]$x1, [float]$y1, [float]$x2, [float]$y2) }
  finally { $pen.Dispose() }
}

$path = Join-Path $Root "assets\projectiles\projectiles-v1.png"
$tmpPath = Join-Path $Root "assets\projectiles\projectiles-v1.tmp.png"
$bitmap = [System.Drawing.Bitmap]::new($path)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
  Set-Quality $graphics
  $cellW = [int]($bitmap.Width / 4)
  $cellH = [int]($bitmap.Height / 2)
  $x0 = $cellW
  $y0 = 0
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $clear = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  try { $graphics.FillRectangle($clear, $x0, $y0, $cellW, $cellH) } finally { $clear.Dispose() }

  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $cx = $x0 + $cellW / 2
  $top = $y0 + 62
  $bottom = $y0 + $cellH - 64
  $cxp34 = $cx + 34
  $cxm34 = $cx - 34
  $cxp24 = $cx + 24
  $cxm24 = $cx - 24
  $cxp20 = $cx + 20
  $cxm20 = $cx - 20
  $cxp15 = $cx + 15
  $cxm15 = $cx - 15
  $cxp9 = $cx + 9
  $cxm9 = $cx - 9
  $cxp7 = $cx + 7
  $cxm7 = $cx - 7
  $top20 = $top + 20
  $top50 = $top + 50
  $top78 = $top + 78
  $top92 = $top + 92
  $top118 = $top + 118
  $bottom20 = $bottom - 20
  $bottom34 = $bottom - 34
  $bottom48 = $bottom - 48
  $bottom62 = $bottom - 62
  $bottom84 = $bottom - 84

  Fill-Path $graphics @(
    @($cx, $top),
    @($cxp34, $top78),
    @($cxp24, $bottom34),
    @($cx, $bottom),
    @($cxm24, $bottom34),
    @($cxm34, $top78)
  ) "#ffcc00" 230

  Fill-Path $graphics @(
    @($cx, $top20),
    @($cxp20, $top92),
    @($cxp15, $bottom62),
    @($cx, $bottom20),
    @($cxm15, $bottom62),
    @($cxm20, $top92)
  ) "#fff066" 255

  Fill-Path $graphics @(
    @($cx, $top50),
    @($cxp9, $top118),
    @($cxp7, $bottom84),
    @($cx, $bottom48),
    @($cxm7, $bottom84),
    @($cxm9, $top118)
  ) "#ffffff" 245

  Stroke-Line $graphics ($cx - 42) ($top + 130) ($cx - 16) ($top + 106) "#ffd200" 210 8
  Stroke-Line $graphics ($cx + 42) ($top + 130) ($cx + 16) ($top + 106) "#ffd200" 210 8
  Stroke-Line $graphics ($cx - 48) ($bottom - 106) ($cx - 20) ($bottom - 72) "#ffb000" 185 7
  Stroke-Line $graphics ($cx + 48) ($bottom - 106) ($cx + 20) ($bottom - 72) "#ffb000" 185 7
  Stroke-Line $graphics $cx ($top + 42) $cx ($bottom - 38) "#fff7a8" 180 5

  $bitmap.Save($tmpPath, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $graphics.Dispose()
  $bitmap.Dispose()
}

Move-Item -LiteralPath $tmpPath -Destination $path -Force
