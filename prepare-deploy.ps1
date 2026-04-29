# Firebase Deployment Preparation Script
Write-Host "Starting Production Build..."

# 1. Run the Turbo build
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# 2. Prepare the production directory
if (Test-Path dist_production) { 
    Remove-Item -Recurse -Force dist_production 
}
New-Item -ItemType Directory -Path dist_production

# 3. Copy Landing (Root)
Write-Host "Copying Landing to root..."
Copy-Item -Path apps/landing/dist/* -Destination dist_production -Recurse

# 4. Copy Portals
Write-Host "Copying admin..."
New-Item -ItemType Directory -Path "dist_production/admin"
Copy-Item -Path "apps/admin/dist/*" -Destination "dist_production/admin" -Recurse

Write-Host "Copying carrier..."
New-Item -ItemType Directory -Path "dist_production/carrier"
Copy-Item -Path "apps/carrier/dist/*" -Destination "dist_production/carrier" -Recurse

Write-Host "Copying agent..."
New-Item -ItemType Directory -Path "dist_production/agent"
Copy-Item -Path "apps/agent/dist/*" -Destination "dist_production/agent" -Recurse

Write-Host "Copying driver..."
New-Item -ItemType Directory -Path "dist_production/driver"
Copy-Item -Path "apps/driver/dist/*" -Destination "dist_production/driver" -Recurse

Write-Host "Preparation complete! Run: npm run deploy:full (deploys to Vercel)"
