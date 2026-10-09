param(
	[Parameter(Mandatory)][string]$Source,
	[Parameter(Mandatory)][string]$Destination,
	[Parameter(Mandatory)][int]$Width,
	[Parameter(Mandatory)][int]$Height
)

# Resize generated raster assets without cropping the exercise or share-card content.
Add-Type -AssemblyName System.Drawing
$targetPath = [System.IO.Path]::GetFullPath($Destination)
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($targetPath)) | Out-Null
$inputImage = [System.Drawing.Image]::FromFile($Source)
$bitmap = [System.Drawing.Bitmap]::new($Width, $Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
try {
	$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#fff8f0'))
	$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
	$scale = [Math]::Min($Width / $inputImage.Width, $Height / $inputImage.Height)
	$scaledWidth = [int]($inputImage.Width * $scale)
	$scaledHeight = [int]($inputImage.Height * $scale)
	$graphics.DrawImage($inputImage, [int](($Width - $scaledWidth) / 2), [int](($Height - $scaledHeight) / 2), $scaledWidth, $scaledHeight)
	$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
	$parameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
	$parameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]85)
	try { $bitmap.Save($targetPath, $encoder, $parameters) } finally { $parameters.Dispose() }
} finally {
	$graphics.Dispose()
	$bitmap.Dispose()
	$inputImage.Dispose()
}
