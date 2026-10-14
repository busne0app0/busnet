import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const targets = [
  path.join(rootDir, 'dist_production'),
  path.join(rootDir, 'dist'),
];

const portals = ['admin', 'carrier', 'agent', 'driver'];

console.log('🚀 Preparing production distribution bundles...');

for (const targetDir of targets) {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(targetDir, { recursive: true });

  // 1. Copy Landing (Root of bundle)
  const landingDist = path.join(rootDir, 'apps', 'landing', 'dist');
  if (fs.existsSync(landingDist)) {
    fs.cpSync(landingDist, targetDir, { recursive: true });
    console.log(`  ✓ Landing copied to ${path.basename(targetDir)}/`);
  } else {
    console.warn(`  ⚠️ Landing dist not found at ${landingDist}`);
  }

  // 2. Copy Portals into subdirectories
  for (const portal of portals) {
    const portalDist = path.join(rootDir, 'apps', portal, 'dist');
    const portalTarget = path.join(targetDir, portal);
    if (fs.existsSync(portalDist)) {
      fs.mkdirSync(portalTarget, { recursive: true });
      fs.cpSync(portalDist, portalTarget, { recursive: true });
      console.log(`  ✓ Portal [${portal}] copied to ${path.basename(targetDir)}/${portal}/`);
    } else {
      console.warn(`  ⚠️ Portal [${portal}] dist not found at ${portalDist}`);
    }
  }

  // 3. Copy root vercel.json to target
  const rootVercelJson = path.join(rootDir, 'vercel.json');
  if (fs.existsSync(rootVercelJson)) {
    fs.copyFileSync(rootVercelJson, path.join(targetDir, 'vercel.json'));
    console.log(`  ✓ vercel.json copied to ${path.basename(targetDir)}/`);
  }
}

console.log('✅ Production deployment bundles ready!');
