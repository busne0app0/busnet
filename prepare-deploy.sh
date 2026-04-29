#!/bin/bash
# Deployment Preparation Script for Vercel (Linux)
set -e

echo "Starting Production Build Preparation..."

# 1. Run the Turbo build (already run by Vercel command usually, but just in case)
# npm run build

# 2. Prepare the production directory
rm -rf dist_production
mkdir -p dist_production

# 3. Copy Landing (Root)
echo "Copying Landing to root..."
cp -r apps/landing/dist/* dist_production/

# 4. Copy Portals
echo "Copying admin..."
mkdir -p dist_production/admin
cp -r apps/admin/dist/* dist_production/admin/

echo "Copying carrier..."
mkdir -p dist_production/carrier
cp -r apps/carrier/dist/* dist_production/carrier/

echo "Copying agent..."
mkdir -p dist_production/agent
cp -r apps/agent/dist/* dist_production/agent/

echo "Copying driver..."
mkdir -p dist_production/driver
cp -r apps/driver/dist/* dist_production/driver/

echo "Preparation complete!"
