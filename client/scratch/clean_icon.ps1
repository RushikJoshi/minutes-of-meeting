Add-Type -AssemblyName System.Drawing
$inputPath = "C:\Users\pc\.gemini\antigravity\brain\70f3417a-332a-4ddb-9579-59171bc44277\media__1778312137144.png"
$outputPath = "c:\Users\pc\GitHub\GT_MOM\client\src\assets\logo_icon_final.png"

$img = [System.Drawing.Image]::FromFile($inputPath)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)
$g.Dispose()

# Remove white background
for ($y=0; $y -lt $bmp.Height; $y++) {
    for ($x=0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        # Target white/near-white background
        if ($c.R -gt 240 -and $c.G -gt 240 -and $c.B -gt 240) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        }
    }
}

$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()
write-host "Icon processed successfully."
