Add-Type -AssemblyName System.Drawing

$srcDir = "c:\Users\User\Desktop\muosir\media\photo\PNG"
$outDir = "c:\Users\User\Desktop\muosir\scratch\thumbs"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$files = Get-ChildItem -Path $srcDir -Filter "*.png"

foreach ($file in $files) {
    $outPath = Join-Path $outDir $file.Name
    if (-not (Test-Path $outPath)) {
        $bmp = [System.Drawing.Bitmap]::FromFile($file.FullName)
        
        # Calculate new size with max width 400
        $newWidth = 400
        $newHeight = [int]($bmp.Height * ($newWidth / $bmp.Width))
        
        $thumb = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
        $g = [System.Drawing.Graphics]::FromImage($thumb)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.DrawImage($bmp, 0, 0, $newWidth, $newHeight)
        $g.Dispose()
        
        $thumb.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $thumb.Dispose()
        $bmp.Dispose()
    }
}

Write-Output "Thumbnails generated successfully."
