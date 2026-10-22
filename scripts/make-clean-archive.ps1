# ============================================================
# BUSNET UA — Створення чистого архіву для аналітика
# Виключає node_modules, .turbo, .vercel та інші важкі папки
# ============================================================

$archiveName = "BUSNET_UA_clean_$(Get-Date -Format 'yyyyMMdd_HHmm').zip"
$desktopPath = [Environment]::GetFolderPath("Desktop")
$destination = Join-Path $desktopPath $archiveName

Write-Host "⏳ Створення чистого архіву для аналітика..." -ForegroundColor Cyan

$tempFolder = Join-Path $env:TEMP "busnet_clean_export"
if (Test-Path $tempFolder) { Remove-Item $tempFolder -Recurse -Force }
New-Item -ItemType Directory -Path $tempFolder | Out-Null

# Копіюємо всі файли коду без важких папок та картинок
$excludeDirs = @('node_modules', '.turbo', '.vercel', 'dist', 'dist_production', '.git', '.gemini', '.cache', 'ai-image-demo', 'ai-text-demo')
$excludeExtensions = @('.png', '.ico', '.jpg', '.jpeg', '.mp4', '.webp', '.svg')

Get-ChildItem -Path . -Recurse -File | Where-Object {
    $path = $_.FullName
    $ext = $_.Extension.ToLower()
    $inExcludedDir = $false
    foreach ($d in $excludeDirs) {
        if ($path -match [regex]::Escape("\$d\")) { $inExcludedDir = $true; break }
    }
    -not $inExcludedDir -and ($excludeExtensions -notcontains $ext)
} | ForEach-Object {
    $relative = Resolve-Path -Path $_.FullName -Relative
    $targetPath = Join-Path $tempFolder $relative
    $targetDir = Split-Path -Path $targetPath -Parent
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    Copy-Item -Path $_.FullName -Destination $targetPath -Force
}

# Стискаємо в ZIP
if (Test-Path $destination) { Remove-Item $destination -Force }
Compress-Archive -Path "$tempFolder\*" -DestinationPath $destination -CompressionLevel Optimal

# Прибираємо тимчасову папку
Remove-Item $tempFolder -Recurse -Force

$zipSize = [math]::Round(((Get-Item $destination).Length / 1MB), 2)
Write-Host "✅ Супер-легкий архів (лише код): $zipSize МБ" -ForegroundColor Green
Write-Host "👉 $destination" -ForegroundColor Yellow
