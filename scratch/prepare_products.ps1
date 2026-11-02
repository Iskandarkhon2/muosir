Add-Type -AssemblyName System.Drawing

$srcDir = "c:\Users\User\Desktop\muosir\media\photo\PNG"
$outDir = "c:\Users\User\Desktop\muosir\assets\images\products"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$mapping = @{
    "dairy-cup-400.png" = "DSC04896.png"
    "dairy-cup-250.png" = "DSC04899.png"
    "snap-lid-95.png"   = "DSC04964.png"
    "egg-box-10.png"    = "DSC05020.png"
    "egg-box-15.png"    = "DSC05040.png"
    "cake-round.png"    = "DSC04957.png"
    "correx-tray.png"   = "DSC05091.png"
    "container-500.png" = "DSC05029.png"
    "salad-bowl.png"    = "DSC04912.png"
    "cup-500.png"       = "DSC04874.png"
    "dome-lid.png"      = "DSC04972.png"
    "lunch-box.png"     = "DSC05046.png"
    "cup-red.png"       = "DSC04934.png"
    "cup-black.png"     = "DSC04936.png"
    "box-black.png"     = "DSC04952.png"
}

$targetSize = 800

foreach ($pair in $mapping.GetEnumerator()) {
    $outName = $pair.Key
    $srcName = $pair.Value
    $srcPath = Join-Path $srcDir $srcName
    $outPath = Join-Path $outDir $outName

    if (-not (Test-Path $srcPath)) {
        Write-Warning "Source not found: $srcPath"
        continue
    }

    Write-Output "Processing $outName from $srcName..."
    $srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)

    # 1. Detect bounding box using step sampling for speed
    $minX = $srcBmp.Width; $maxX = 0
    $minY = $srcBmp.Height; $maxY = 0
    $step = 8

    for ($y = 0; $y -lt $srcBmp.Height; $y += $step) {
        for ($x = 0; $x -lt $srcBmp.Width; $x += $step) {
            $px = $srcBmp.GetPixel($x, $y)
            if ($px.A -gt 25) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    # Add margin
    $margin = 40
    $cropX = [Math]::Max(0, $minX - $margin)
    $cropY = [Math]::Max(0, $minY - $margin)
    $cropW = [Math]::Min($srcBmp.Width - $cropX, ($maxX - $minX) + ($margin * 2))
    $cropH = [Math]::Min($srcBmp.Height - $cropY, ($maxY - $minY) + ($margin * 2))

    if ($cropW -le 10 -or $cropH -le 10) {
        $cropX = 0; $cropY = 0
        $cropW = $srcBmp.Width; $cropH = $srcBmp.Height
    }

    # Check orientation (if height is bigger than width by > 1.2 and original image was rotated portrait)
    # Most items in Sony raw were photographed horizontally or vertically
    $cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)

    # 2. Fit into square targetSize x targetSize preserving aspect ratio
    $destBmp = New-Object System.Drawing.Bitmap($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $scale = [Math]::Min(($targetSize * 0.90) / $cropW, ($targetSize * 0.90) / $cropH)
    $destW = [int]($cropW * $scale)
    $destH = [int]($cropH * $scale)
    $destX = [int](($targetSize - $destW) / 2)
    $destY = [int](($targetSize - $destH) / 2)

    $destRect = New-Object System.Drawing.Rectangle($destX, $destY, $destW, $destH)
    $g.DrawImage($srcBmp, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $destBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
    $srcBmp.Dispose()
}

Write-Output "All product images processed into $outDir successfully!"
