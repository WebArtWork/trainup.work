param(
	[Parameter(Mandatory)][string]$Folder,
	[Parameter(Mandatory)][string]$Destination,
	[int]$Skip = 0,
	[int]$Count = 18
)

# Read-only contact sheets for checking the exported assets, never app assets.
Add-Type -AssemblyName System.Drawing
$files = @(Get-ChildItem -LiteralPath $Folder -Filter *.jpg | Sort-Object Name | Select-Object -Skip $Skip -First $Count)
$rows = [int][Math]::Ceiling($files.Count / 3)
$bitmap = [System.Drawing.Bitmap]::new(1440, $rows * 330)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$font = [System.Drawing.Font]::new('Arial', 13)
try {
	$graphics.Clear([System.Drawing.Color]::White)
	$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
	for ($i = 0; $i -lt $files.Count; $i++) {
		$x = ($i % 3) * 480
		$y = [Math]::Floor($i / 3) * 330
		$picture = [System.Drawing.Image]::FromFile($files[$i].FullName)
		try { $graphics.DrawImage($picture, [int]$x, [int]$y, 480, 300) } finally { $picture.Dispose() }
		$graphics.DrawString($files[$i].BaseName, $font, [System.Drawing.Brushes]::Black, [single]($x + 6), [single]($y + 303))
	}
	$bitmap.Save([System.IO.Path]::GetFullPath($Destination), [System.Drawing.Imaging.ImageFormat]::Jpeg)
} finally {
	$font.Dispose()
	$graphics.Dispose()
	$bitmap.Dispose()
}
