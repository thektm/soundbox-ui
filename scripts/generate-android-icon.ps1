$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot "public\logo.png"
$resRoot = Join-Path $projectRoot "android\app\src\main\res"

if (-not (Test-Path $sourcePath)) {
  throw "Missing public/logo.png at: $sourcePath"
}
if (-not (Test-Path $resRoot)) {
  throw "Android project not found at: $resRoot. Run 'npx cap add android' first."
}

Add-Type -AssemblyName System.Drawing

# Add 10% breathing room on every edge relative to the previous logo bounds.
# Scaling the previous content box to 80% leaves 10% on each side while
# preserving the existing legacy/adaptive safe-zone choices.
$logoPaddingScale = 0.80

$source = [System.Drawing.Image]::FromFile($sourcePath)
try {
  function Write-LauncherBitmap {
    param(
      [Parameter(Mandatory=$true)][string]$Path,
      [Parameter(Mandatory=$true)][int]$Size,
      [Parameter(Mandatory=$true)][double]$ContentScale,
      [Parameter(Mandatory=$true)][bool]$OpaqueBackground
    )

    $dir = Split-Path -Parent $Path
    New-Item -ItemType Directory -Force -Path $dir | Out-Null

    $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        if ($OpaqueBackground) {
          $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#060707"))
        } else {
          $graphics.Clear([System.Drawing.Color]::Transparent)
        }

        $maxSide = [double]$Size * $ContentScale
        $ratio = [Math]::Min($maxSide / $source.Width, $maxSide / $source.Height)
        $drawWidth = [Math]::Max(1, [int][Math]::Round($source.Width * $ratio))
        $drawHeight = [Math]::Max(1, [int][Math]::Round($source.Height * $ratio))
        $x = [int][Math]::Round(($Size - $drawWidth) / 2.0)
        $y = [int][Math]::Round(($Size - $drawHeight) / 2.0)

        $dest = [System.Drawing.Rectangle]::new($x, $y, $drawWidth, $drawHeight)
        $graphics.DrawImage($source, $dest, 0, 0, $source.Width, $source.Height, [System.Drawing.GraphicsUnit]::Pixel)
      }
      finally {
        $graphics.Dispose()
      }

      $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
      $bitmap.Dispose()
    }
  }

  # Legacy launcher icons. Android applies the device launcher mask where needed.
  $legacy = @{
    "mdpi" = 48
    "hdpi" = 72
    "xhdpi" = 96
    "xxhdpi" = 144
    "xxxhdpi" = 192
  }

  foreach ($density in $legacy.Keys) {
    $dir = Join-Path $resRoot "mipmap-$density"
    Write-LauncherBitmap -Path (Join-Path $dir "ic_launcher.png") -Size $legacy[$density] -ContentScale (0.86 * $logoPaddingScale) -OpaqueBackground $true
    Write-LauncherBitmap -Path (Join-Path $dir "ic_launcher_round.png") -Size $legacy[$density] -ContentScale (0.86 * $logoPaddingScale) -OpaqueBackground $true
  }

  # Adaptive foregrounds use Android's 108dp canvas. Keep the actual logo well
  # inside the adaptive-icon safe zone so circular/squircle launchers never crop it.
  $adaptive = @{
    "mdpi" = 108
    "hdpi" = 162
    "xhdpi" = 216
    "xxhdpi" = 324
    "xxxhdpi" = 432
  }

  foreach ($density in $adaptive.Keys) {
    $dir = Join-Path $resRoot "mipmap-$density"
    Write-LauncherBitmap -Path (Join-Path $dir "ic_launcher_foreground.png") -Size $adaptive[$density] -ContentScale (0.62 * $logoPaddingScale) -OpaqueBackground $false
  }

  $anyDpi = Join-Path $resRoot "mipmap-anydpi-v26"
  New-Item -ItemType Directory -Force -Path $anyDpi | Out-Null

  $adaptiveXml = @'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/sedabox_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
'@
  Set-Content -Path (Join-Path $anyDpi "ic_launcher.xml") -Value $adaptiveXml.TrimStart() -Encoding UTF8
  Set-Content -Path (Join-Path $anyDpi "ic_launcher_round.xml") -Value $adaptiveXml.TrimStart() -Encoding UTF8

  $valuesDir = Join-Path $resRoot "values"
  New-Item -ItemType Directory -Force -Path $valuesDir | Out-Null
  $colorsXml = @'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="sedabox_launcher_background">#060707</color>
</resources>
'@
  Set-Content -Path (Join-Path $valuesDir "sedabox_launcher_colors.xml") -Value $colorsXml.TrimStart() -Encoding UTF8

  Write-Host "Android launcher icons generated from public/logo.png" -ForegroundColor Green
  Write-Host "Source: $($source.Width)x$($source.Height) -> android/app/src/main/res/mipmap-*" -ForegroundColor DarkGray
}
finally {
  $source.Dispose()
}
