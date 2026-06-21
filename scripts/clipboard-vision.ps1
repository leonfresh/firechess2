param([string]$Prompt = "")

$tmpDir = [System.IO.Path]::GetTempPath() + [System.Guid]::NewGuid().ToString()
New-Item -ItemType Directory -Path $tmpDir -Force > $null
$imagePath = "$tmpDir\clipboard.png"

# Save clipboard image
Add-Type -AssemblyName System.Windows.Forms
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img -eq $null) { Remove-Item -LiteralPath $tmpDir -Recurse -Force; Write-Host "NO_IMAGE"; exit 1 }
$img.Save($imagePath)
$img.Dispose()

# Analyze with vision
$env:PYTHONIOENCODING = "utf-8"
if ($Prompt -ne "") {
    python -m opencode_vision describe "$imagePath" "$Prompt"
} else {
    python -m opencode_vision analyze "$imagePath"
}

Remove-Item -LiteralPath $tmpDir -Recurse -Force
