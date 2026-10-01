$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$manifest = Get-Content -LiteralPath (Join-Path $projectRoot 'manifest.json') -Raw -Encoding utf8 | ConvertFrom-Json
$zipPath = Join-Path $projectRoot "release\mam-edge-store-$($manifest.version).zip"
$files = @('manifest.json','background.js','state.js','i18n.js','popup.html','popup.css','popup.js','reminder.js','icons/icon16.png','icons/icon32.png','icons/icon48.png','icons/icon128.png','_locales/en/messages.json','_locales/vi/messages.json')
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stream = [System.IO.File]::Open($zipPath,[System.IO.FileMode]::Create)
$archive = [System.IO.Compression.ZipArchive]::new($stream,[System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($file in $files) {
    $source = Join-Path $projectRoot $file
    if (-not (Test-Path -LiteralPath $source)) { throw "Missing package asset: $file" }
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$source,$file,[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $archive.Dispose(); $stream.Dispose() }
$check = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
try {
  if ($check.Entries.Count -ne $files.Count) { throw 'Unexpected ZIP entries' }
  foreach ($file in $files) {
    $entry = $check.GetEntry($file)
    if ($null -eq $entry) { throw "Missing entry: $file" }
    $entryStream = $entry.Open()
    $hash = [System.Security.Cryptography.SHA256]::Create()
    try { $actual = [BitConverter]::ToString($hash.ComputeHash($entryStream)).Replace('-','') }
    finally { $hash.Dispose(); $entryStream.Dispose() }
    if ($actual -ne (Get-FileHash -LiteralPath (Join-Path $projectRoot $file) -Algorithm SHA256).Hash) { throw "ZIP content differs: $file" }
  }
  Write-Output "Verified $($check.Entries.Count) files; manifest.json is at ZIP root."
} finally { $check.Dispose() }
Get-Item -LiteralPath $zipPath | Select-Object FullName,Length
