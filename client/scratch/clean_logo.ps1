Add-Type -AssemblyName System.Drawing
$inputPath = "c:\Users\pc\GitHub\GT_MOM\client\src\assets\logo.jpeg"
$outputPath = "c:\Users\pc\GitHub\GT_MOM\client\src\assets\logo_final.png"

$img = [System.Drawing.Image]::FromFile($inputPath)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)
$g.Dispose()

# Aggressive background removal:
# Identify anything that is NOT part of the blue/navy logo
for ($y=0; $y -lt $bmp.Height; $y++) {
    for ($x=0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        
        # Checkerboard colors are usually shades of grey (R=G=B)
        $isGrey = ([Math]::Abs($c.R - $c.G) -lt 15) -and ([Math]::Abs($c.G - $c.B) -lt 15)
        
        # If it's a bright pixel (white/grey)
        if ($c.R -gt 150 -and $c.G -gt 150 -and $c.B -gt 150 -and $isGrey) {
             $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        }
    }
}

$bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$img.Dispose()
write-host "Aggressive cleaning finished."
