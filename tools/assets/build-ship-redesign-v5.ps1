$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$sourceDir = Join-Path $root "assets\player\source\ship_redesign_v5"
$rawDir = Join-Path $sourceDir "raw"
$alphaDir = Join-Path $sourceDir "alpha"
New-Item -ItemType Directory -Force -Path $alphaDir | Out-Null

$reference = Join-Path $sourceDir "reference_rapid_spread_final_sheet.png"
$baseOutput = Join-Path $root "assets\player\player-base-ship-v5.png"
$atlasOutput = Join-Path $root "assets\player\player-weapon-part-states-v5.png"
$previewOutput = Join-Path $root "assets\player\preview\player-ship-redesign-v5-preview.png"

function Remove-ChromaToBitmap($path) {
  $src = [System.Drawing.Bitmap]::FromFile($path)
  $dst = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
      $c = $src.GetPixel($x, $y)
      $greenDistance = [Math]::Abs($c.R) + [Math]::Abs($c.G - 255) + [Math]::Abs($c.B)
      $greenDominance = $c.G - [Math]::Max($c.R, $c.B)
      if ($greenDistance -lt 105 -or ($c.G -gt 145 -and $greenDominance -gt 42)) {
        $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
      else {
        $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
      }
    }
  }
  $src.Dispose()
  return $dst
}

function Get-AlphaBounds($bitmap) {
  $minX = $bitmap.Width; $minY = $bitmap.Height; $maxX = -1; $maxY = -1
  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      if ($bitmap.GetPixel($x, $y).A -gt 8) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -lt 0) { return $null }
  return @{ X=$minX; Y=$minY; W=($maxX - $minX + 1); H=($maxY - $minY + 1) }
}

function Crop-Bitmap($bitmap, $rect) {
  $dst = New-Object System.Drawing.Bitmap $rect.W, $rect.H, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  try {
    $srcRect = New-Object System.Drawing.Rectangle $rect.X, $rect.Y, $rect.W, $rect.H
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $rect.W, $rect.H
    $g.DrawImage($bitmap, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  }
  finally { $g.Dispose() }
  return $dst
}

function Register-FullShip($source, $target) {
  $bounds = Get-AlphaBounds $source
  if ($null -eq $bounds) { throw "No visible pixels in source ship." }
  $dst = New-Object System.Drawing.Bitmap 512, 512, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($dst)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  try {
    $scale = [Math]::Min($target.W / $bounds.W, $target.H / $bounds.H)
    $drawW = [Math]::Round($bounds.W * $scale)
    $drawH = [Math]::Round($bounds.H * $scale)
    $drawX = [Math]::Round($target.X + ($target.W - $drawW) / 2)
    $drawY = [Math]::Round($target.Y + ($target.H - $drawH) / 2)
    $srcRect = New-Object System.Drawing.Rectangle $bounds.X, $bounds.Y, $bounds.W, $bounds.H
    $dstRect = New-Object System.Drawing.Rectangle $drawX, $drawY, $drawW, $drawH
    $g.DrawImage($source, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  }
  finally { $g.Dispose() }
  return $dst
}

function Mask-Region($source, $regions) {
  $dst = New-Object System.Drawing.Bitmap 512, 512, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt 512; $y++) {
    for ($x = 0; $x -lt 512; $x++) {
      $inside = $false
      foreach ($r in $regions) {
        if ($x -ge $r.X -and $x -lt ($r.X + $r.W) -and $y -ge $r.Y -and $y -lt ($r.Y + $r.H)) { $inside = $true; break }
      }
      if ($inside) { $dst.SetPixel($x, $y, $source.GetPixel($x, $y)) }
      else { $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0)) }
    }
  }
  return $dst
}

function Rect($x, $y, $w, $h) { return @{ X=$x; Y=$y; W=$w; H=$h } }

function Find-BoundsInRegion($bitmap, $region) {
  $minX = $bitmap.Width; $minY = $bitmap.Height; $maxX = -1; $maxY = -1
  $startX = [Math]::Max(0, $region.X)
  $endX = [Math]::Min($bitmap.Width - 1, $region.X + $region.W - 1)
  $startY = [Math]::Max(0, $region.Y)
  $endY = [Math]::Min($bitmap.Height - 1, $region.Y + $region.H - 1)

  for ($y = $startY; $y -le $endY; $y++) {
    for ($x = $startX; $x -le $endX; $x++) {
      if ($bitmap.GetPixel($x, $y).A -gt 8) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt 0) { return $null }
  return @{ X=$minX; Y=$minY; W=($maxX - $minX + 1); H=($maxY - $minY + 1) }
}

function Expand-Rect($rect, $pad, $maxW, $maxH) {
  $x = [Math]::Max(0, $rect.X - $pad)
  $y = [Math]::Max(0, $rect.Y - $pad)
  $right = [Math]::Min($maxW, $rect.X + $rect.W + $pad)
  $bottom = [Math]::Min($maxH, $rect.Y + $rect.H + $pad)
  return @{ X=$x; Y=$y; W=($right - $x); H=($bottom - $y) }
}

function Find-XIntervalsInRegion($bitmap, $region) {
  $occupied = @()
  $startX = [Math]::Max(0, $region.X)
  $endX = [Math]::Min($bitmap.Width - 1, $region.X + $region.W - 1)
  $startY = [Math]::Max(0, $region.Y)
  $endY = [Math]::Min($bitmap.Height - 1, $region.Y + $region.H - 1)

  for ($x = $startX; $x -le $endX; $x++) {
    $count = 0
    for ($y = $startY; $y -le $endY; $y++) {
      if ($bitmap.GetPixel($x, $y).A -gt 8) { $count++ }
    }
    if ($count -gt 3) { $occupied += $x }
  }

  $intervals = @()
  if ($occupied.Count -eq 0) { return $intervals }

  $gapTolerance = 28
  $currentStart = $occupied[0]
  $previous = $occupied[0]
  for ($i = 1; $i -lt $occupied.Count; $i++) {
    $x = $occupied[$i]
    if (($x - $previous) -gt $gapTolerance) {
      if (($previous - $currentStart) -gt 35) {
        $intervals += @{ X=$currentStart; W=($previous - $currentStart + 1) }
      }
      $currentStart = $x
    }
    $previous = $x
  }

  if (($previous - $currentStart) -gt 35) {
    $intervals += @{ X=$currentStart; W=($previous - $currentStart + 1) }
  }

  return $intervals
}

function Crop-ReferenceFirstShipInRow($bitmap, $region, $pad) {
  $intervals = Find-XIntervalsInRegion $bitmap $region
  if ($intervals.Count -eq 0) { throw "No reference ship x-intervals in requested row." }

  $first = $intervals[0]
  $isolatedRegion = @{ X=$first.X; Y=$region.Y; W=$first.W; H=$region.H }
  $bounds = Find-BoundsInRegion $bitmap $isolatedRegion
  if ($null -eq $bounds) { throw "No reference ship pixels in first interval." }
  $expanded = Expand-Rect $bounds $pad $bitmap.Width $bitmap.Height
  return Crop-Bitmap $bitmap $expanded
}


function Is-InRegions($x, $y, $regions) {
  foreach ($r in $regions) {
    if ($x -ge $r.X -and $x -lt ($r.X + $r.W) -and $y -ge $r.Y -and $y -lt ($r.Y + $r.H)) {
      return $true
    }
  }
  return $false
}

function Mask-Remaining($source, $coveredRegions) {
  $dst = New-Object System.Drawing.Bitmap 512, 512, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt 512; $y++) {
    for ($x = 0; $x -lt 512; $x++) {
      $pixel = $source.GetPixel($x, $y)
      if ($pixel.A -gt 8 -and -not (Is-InRegions $x $y $coveredRegions)) {
        $dst.SetPixel($x, $y, $pixel)
      }
      else {
        $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
    }
  }
  return $dst
}

function Derive-Layers($source, $kind) {
  # Columns:
  # 0 core/cockpit, 1 body, 2 intermediate wing, 3 final wing,
  # 4 engine, 5 weapon module, 6 integration/remainder, 7 full final overlay.
  # Column 7 is the uncut full final form used at max level.`r`n  # The integration layer is the remaining final-form pixels not already covered by
  # the major slots. This keeps the level-10 stack visually closed without using
  # many tiny decorative layers.

  if ($kind -eq "rapid") {
    $core = @((Rect 205 58 102 215))
    $body = @((Rect 164 150 184 280))
    $wingStage = @((Rect 70 170 160 250), (Rect 282 170 160 250))
    $wingFinal = @((Rect 18 42 225 400), (Rect 269 42 225 400))
    $engine = @((Rect 175 300 162 180))
    $weapon = @((Rect 220 35 72 260))
  }
  elseif ($kind -eq "spread") {
    $core = @((Rect 188 48 136 290))
    $body = @((Rect 145 145 222 300))
    $wingStage = @((Rect 54 160 175 270), (Rect 283 160 175 270))
    $wingFinal = @((Rect 0 82 245 380), (Rect 267 82 245 380))
    $engine = @((Rect 165 330 182 150))
    $weapon = @((Rect 0 190 205 255), (Rect 307 190 205 255))
  }
  elseif ($kind -eq "energy") {
    $core = @((Rect 178 58 156 285))
    $body = @((Rect 130 130 252 320))
    $wingStage = @((Rect 55 170 170 270), (Rect 287 170 170 270))
    $wingFinal = $wingStage
    $engine = @((Rect 165 325 182 155))
    $weapon = @((Rect 122 120 268 295))
  }
  else {
    $core = @((Rect 178 58 156 285))
    $body = @((Rect 132 135 248 315))
    $wingStage = @((Rect 62 145 175 290), (Rect 275 145 175 290))
    $wingFinal = $wingStage
    $engine = @((Rect 165 325 182 155))
    $weapon = @((Rect 122 120 268 295))
  }

  $covered = @()
  $covered += $core
  $covered += $body
  $covered += $wingFinal
  $covered += $engine
  $covered += $weapon

  return ,@(
    (Mask-Region $source $core),
    (Mask-Region $source $body),
    (Mask-Region $source $wingStage),
    (Mask-Region $source $wingFinal),
    (Mask-Region $source $engine),
    (Mask-Region $source $weapon),
    (Mask-Remaining $source $covered),
    (Mask-Region $source @((Rect 0 0 512 512)))
  )
}

if (-not (Test-Path -LiteralPath $reference)) { throw "Missing reference sheet: $reference" }
$refAlpha = Remove-ChromaToBitmap $reference
# The fixed Rapid/Spread targets are the left ships in the reference sheet.
# Do not crop by grid columns: their wings extend past a simple quarter-cell boundary.
# Instead, search a generous left-side region in each row and crop the full visible ship bounds.
$rapidCrop = Crop-ReferenceFirstShipInRow $refAlpha @{ X=0; Y=0; W=$refAlpha.Width; H=[Math]::Floor($refAlpha.Height / 2) } 36
$spreadCrop = Crop-ReferenceFirstShipInRow $refAlpha @{ X=0; Y=[Math]::Floor($refAlpha.Height / 2); W=$refAlpha.Width; H=[Math]::Ceiling($refAlpha.Height / 2) } 36
$rapid = Register-FullShip $rapidCrop @{ X=28; Y=34; W=456; H=430 }
$spread = Register-FullShip $spreadCrop @{ X=14; Y=38; W=484; H=430 }
$rapid.Save((Join-Path $alphaDir "rapid_final_v5.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$spread.Save((Join-Path $alphaDir "spread_final_v5.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$refAlpha.Dispose(); $rapidCrop.Dispose(); $spreadCrop.Dispose()

$baseRaw = Join-Path $rawDir "player_base_ship_v5.png"
$energyRaw = Join-Path $rawDir "energy_final_v5.png"
$novaRaw = Join-Path $rawDir "nova_final_v5.png"
if (-not (Test-Path -LiteralPath $baseRaw)) { throw "Missing $baseRaw" }
if (-not (Test-Path -LiteralPath $energyRaw)) { throw "Missing $energyRaw" }
if (-not (Test-Path -LiteralPath $novaRaw)) { throw "Missing $novaRaw" }

$baseSource = Remove-ChromaToBitmap $baseRaw
$energySource = Remove-ChromaToBitmap $energyRaw
$novaSource = Remove-ChromaToBitmap $novaRaw
$base = Register-FullShip $baseSource @{ X=80; Y=58; W=352; H=410 }
$energy = Register-FullShip $energySource @{ X=58; Y=54; W=396; H=420 }
$nova = Register-FullShip $novaSource @{ X=66; Y=58; W=380; H=410 }
$base.Save($baseOutput, [System.Drawing.Imaging.ImageFormat]::Png)
$base.Save((Join-Path $alphaDir "player_base_ship_v5.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$energy.Save((Join-Path $alphaDir "energy_final_v5.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$nova.Save((Join-Path $alphaDir "nova_final_v5.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$baseSource.Dispose(); $energySource.Dispose(); $novaSource.Dispose()

$weaponShips = @($rapid, $energy, $spread, $nova)
$atlas = New-Object System.Drawing.Bitmap 5120, 2048, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($atlas)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
try {
  for ($row = 0; $row -lt 4; $row++) {
    $layers = Derive-Layers $weaponShips[$row] (@("rapid", "energy", "spread", "nova")[$row])
    for ($col = 0; $col -lt $layers.Count; $col++) {
      $g.DrawImage($layers[$col], $col * 512, $row * 512, 512, 512)
      $layers[$col].Dispose()
    }
  }
  $atlas.Save($atlasOutput, [System.Drawing.Imaging.ImageFormat]::Png)
}
finally { $g.Dispose(); $atlas.Dispose() }

$preview = New-Object System.Drawing.Bitmap 1600, 720, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$pg = [System.Drawing.Graphics]::FromImage($preview)
$pg.Clear([System.Drawing.Color]::FromArgb(255, 4, 9, 20))
$pg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$pg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 235, 245, 255))
$font = New-Object System.Drawing.Font 'Segoe UI', 20, ([System.Drawing.FontStyle]::Bold)
$labels = @('Base', 'Rapid assembled', 'Energy assembled', 'Spread assembled', 'Nova assembled')
$pg.DrawString($labels[0], $font, $textBrush, 24, 18)
$pg.DrawImage($base, 24, 86, 288, 288)
for ($row = 0; $row -lt 4; $row++) {
  $x = 24 + ($row + 1) * 312
  $pg.DrawString($labels[$row + 1], $font, $textBrush, $x, 18)
  $pg.DrawImage($base, $x, 86, 288, 288)
  $layers = Derive-Layers $weaponShips[$row] (@("rapid", "energy", "spread", "nova")[$row])
  # Preview level 10 exactly as runtime will show it: the uncut full-final overlay.
  $pg.DrawImage($layers[7], $x, 86, 288, 288)
  for ($col = 0; $col -lt $layers.Count; $col++) {
    $layers[$col].Dispose()
  }
}
$textBrush.Dispose(); $font.Dispose(); $pg.Dispose()
$preview.Save($previewOutput, [System.Drawing.Imaging.ImageFormat]::Png)
$preview.Dispose()

foreach ($ship in $weaponShips) { $ship.Dispose() }
$base.Dispose(); $energy.Dispose(); $nova.Dispose()

Write-Host "Wrote $baseOutput"
Write-Host "Wrote $atlasOutput"
Write-Host "Wrote $previewOutput"