Add-Type -AssemblyName System.Drawing

function Create-Icon ($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Draw dark teal background circle
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 53, 60)) # Teal #12353C
    $g.FillEllipse($brush, 0, 0, $size - 1, $size - 1)
    
    # Draw white clock outer ring
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, ($size * 0.08))
    $margin = $size * 0.15
    $g.DrawEllipse($pen, $margin, $margin, $size - 2*$margin, $size - 2*$margin)
    
    # Draw checkmark
    $checkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 20, 220, 160), ($size * 0.1)) # Bright teal checkmark
    $x1 = $size * 0.35
    $y1 = $size * 0.5
    $x2 = $size * 0.5
    $y2 = $size * 0.65
    $x3 = $size * 0.7
    $y3 = $size * 0.35
    $g.DrawLine($checkPen, $x1, $y1, $x2, $y2)
    $g.DrawLine($checkPen, $x2, $y2, $x3, $y3)
    
    # Save image
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Successfully created $path"
}

$dir = "d:\CodeBasics\focusboard\icons"
if (-not (Test-Path $dir)) { 
    New-Item -ItemType Directory -Path $dir -Force | Out-Null 
}

Create-Icon 16 "$dir\icon16.png"
Create-Icon 48 "$dir\icon48.png"
Create-Icon 128 "$dir\icon128.png"
