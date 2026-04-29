# build-and-deploy.ps1
Set-Location $PSScriptRoot

Write-Host "=== STEP 0: Check Dependencies ===" -ForegroundColor Cyan
if (!(Test-Path "node_modules") -or !(Test-Path "node_modules\.bin\turbo")) {
    Write-Host "Dependencies missing. Running npm install..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "INSTALL ERROR!" -ForegroundColor Red
        exit 1
    }
}
 
Write-Host "=== STEP 1: Build ===" -ForegroundColor Cyan
# Використовуємо npx для надійності
npx turbo run build --concurrency=1
if ($LASTEXITCODE -ne 0) {
    Write-Host "BUILD ERROR!" -ForegroundColor Red
    exit 1
}
 
Write-Host "=== STEP 2: dist_production ===" -ForegroundColor Cyan
if (Test-Path "dist_production") {
    Remove-Item -Recurse -Force "dist_production"
}
New-Item -ItemType Directory -Path "dist_production" | Out-Null
Copy-Item -Recurse -Force "apps\landing\dist\*" "dist_production\"
 
foreach ($portal in @("admin","carrier","agent","driver")) {
    New-Item -ItemType Directory -Path "dist_production\$portal" | Out-Null
    Copy-Item -Recurse -Force "apps\$portal\dist\*" "dist_production\$portal\"
    Write-Host "  $portal - done" -ForegroundColor Green
}
 
Write-Host "=== STEP 3: Deploy ===" -ForegroundColor Cyan
vercel --prod
if ($LASTEXITCODE -ne 0) {
    Write-Host "DEPLOY ERROR!" -ForegroundColor Red
    exit 1
}
 
Write-Host "=== DONE ===" -ForegroundColor Green
