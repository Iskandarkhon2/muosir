Add-Type -AssemblyName System.Drawing

$thumbDir = "c:\Users\User\Desktop\muosir\scratch\thumbs"
$files = Get-ChildItem -Path $thumbDir -Filter "*.png"

$results = @()

foreach ($file in $files) {
    $bmp = [System.Drawing.Bitmap]::FromFile($file.FullName)
    $minX = $bmp.Width; $maxX = 0
    $minY = $bmp.Height; $maxY = 0
    $nonEmpty = 0
    $rSum = 0; $gSum = 0; $bSum = 0

    for ($y = 0; $y -lt $bmp.Height; $y += 2) {
        for ($x = 0; $x -lt $bmp.Width; $x += 2) {
            $px = $bmp.GetPixel($x, $y)
            if ($px.A -gt 30) {
                $nonEmpty++
                $rSum += $px.R
                $gSum += $px.G
                $bSum += $px.B
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    $avgR = if ($nonEmpty -gt 0) { [int]($rSum / $nonEmpty) } else { 0 }
    $avgG = if ($nonEmpty -gt 0) { [int]($gSum / $nonEmpty) } else { 0 }
    $avgB = if ($nonEmpty -gt 0) { [int]($bSum / $nonEmpty) } else { 0 }

    $w = if ($maxX -ge $minX) { $maxX - $minX + 1 } else { 0 }
    $h = if ($maxY -ge $minY) { $maxY - $minY + 1 } else { 0 }
    $ratio = if ($h -gt 0) { [math]::Round($w / $h, 2) } else { 0 }

    $bmp.Dispose()

    $results += [PSCustomObject]@{
        Name = $file.Name
        Width = $w
        Height = $h
        Ratio = $ratio
        AvgRGB = "($avgR,$avgG,$avgB)"
        Pixels = $nonEmpty
    }
}

$results | Format-Table -AutoSize | Out-String | Write-Output
