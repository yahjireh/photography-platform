/**
 * Automated Mobile Release & Admin Dashboard Sync Script
 * 
 * Usage:
 *   node scripts/sync-mobile-release.js --app client --version 1.3.0 --notes "Explore crash fix"
 *   node scripts/sync-mobile-release.js --app photographer --version 1.3.0 --notes "Performance updates"
 *   node scripts/sync-mobile-release.js --app both --version 1.3.0 --notes "Universal update"
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure environment variables from backend/.env are loaded for Prisma & OtaKit
try {
  require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv')).config({
    path: path.join(__dirname, '..', 'backend', '.env')
  });
} catch {
  // Ignore if dotenv cannot be loaded
}

const { PrismaClient } = require(path.join(__dirname, '..', 'backend', 'node_modules', '@prisma', 'client'));

const prisma = new PrismaClient();

async function deploySingleApp(targetApp, targetVersion, releaseNotes, platform) {
  const appDir = targetApp === 'client' 
    ? path.join(__dirname, '..', 'apps', 'clickflicks-client')
    : path.join(__dirname, '..', 'apps', 'clickflicks-photographer');

  const appId = targetApp === 'client' ? 'com.clickflicks.app' : 'com.clickflicks.photographer';

  console.log(`\n======================================================`);
  console.log(`🚀 ClickFlicks Automated Live Release`);
  console.log(`App: ${targetApp} (${appId})`);
  console.log(`Platform: ${platform}`);
  console.log(`======================================================\n`);

  // 1. Build Web Assets & Copy to native Capacitor containers (iOS & Android)
  console.log(`📦 [1/4] Building web bundle in ${appDir}...`);
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execSync(`${npmCmd} run build`, { cwd: appDir, stdio: 'inherit' });

  // Native Capacitor container sync (copies dist to ios/App/App/public and android/app/src/main/assets/public)
  try {
    console.log(`📱 [1.5/4] Copying web bundle to native iOS & Android containers...`);
    execSync(`${npxCmd} cap copy`, { cwd: appDir, stdio: 'inherit' });
    console.log(`✅ Native iOS and Android containers synchronized.`);
  } catch (capErr) {
    console.warn(`⚠️ Capacitor copy notice:`, capErr.message);
  }

  // 2. Determine or bump version if not supplied
  const pkgPath = path.join(appDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const versionToDeploy = targetVersion || pkg.version;
  console.log(`\n🏷️ [2/4] Deploying Version: v${versionToDeploy}`);

  // 3. Upload to OtaKit Live Updates (production channel)
  console.log(`\n☁️ [3/4] Uploading live bundle to OtaKit...`);
  try {
    const otakitAppId = targetApp === 'client' 
      ? (process.env.OTAKIT_CLIENT_APP_ID || process.env.OTAKIT_APP_ID || '5e735704-6a85-4f05-b0b4-6ac3bb86a0d9')
      : (process.env.OTAKIT_PHOTOGRAPHER_APP_ID || process.env.OTAKIT_APP_ID || 'b327c98d-ba9e-4e78-a6f6-4b88e1f043bb');

    const appIdFlag = otakitAppId ? `--app-id ${otakitAppId}` : '';

    execSync(`${npxCmd} @otakit/cli upload dist --release production ${appIdFlag} --version ${versionToDeploy}`, {
      cwd: appDir,
      stdio: 'inherit',
      env: { 
        ...process.env, 
        OTAKIT_TOKEN: process.env.OTAKIT_TOKEN || 'otakit_sk_91qLH_CQN3J1Pg-ImNqTHhYCOM52py-Io0JZpOiipN8',
        OTAKIT_VERSION: versionToDeploy 
      }
    });
    console.log(`✅ OtaKit live bundle uploaded and released successfully!`);
  } catch (err) {
    console.warn(`⚠️ OtaKit upload notice:`, err.message);
  }

  // 4. Register with Admin Dashboard under Mobile App Management for both Android and iOS
  console.log(`\n📊 [4/4] Syncing version with Admin Dashboard database...`);
  try {
    const row = await prisma.system_settings.findUnique({
      where: { key: 'mobile_app_versions' }
    });

    let currentList = [];
    if (row && Array.isArray(row.value)) {
      currentList = row.value;
    }

    const targetPlatforms = (platform.toLowerCase() === 'all' || platform.toLowerCase() === 'both')
      ? ['Android', 'iOS']
      : [platform === 'iOS' ? 'iOS' : 'Android'];

    for (const plat of targetPlatforms) {
      const existingIdx = currentList.findIndex(
        v => (v.platform || '').toLowerCase() === plat.toLowerCase() && v.appId === appId
      );

      const isClient = targetApp === 'client';
      const storeUrl = plat === 'iOS'
        ? (isClient ? 'https://apps.apple.com/app/clickflicks/id6470000000' : 'https://apps.apple.com/app/clickflicks-photographer/id6470000001')
        : (isClient ? 'https://play.google.com/store/apps/details?id=com.clickflicks.app' : 'https://play.google.com/store/apps/details?id=com.clickflicks.photographer');

      const versionRecord = {
        id: `${targetApp}_${plat.toLowerCase()}_${Date.now()}`,
        appId,
        appName: isClient ? 'ClickFlicks Client' : 'ClickFlicks Photographer',
        platform: plat,
        version: versionToDeploy,
        buildNumber: `${Date.now()}`.slice(-4),
        minRequired: versionToDeploy,
        status: 'live',
        releaseDate: new Date().toISOString().split('T')[0],
        users: 0,
        forceUpdate: false,
        softUpdate: false,
        releaseNotes,
        storeUrl
      };

      if (existingIdx >= 0) {
        currentList[existingIdx] = { ...currentList[existingIdx], ...versionRecord };
      } else {
        currentList.unshift(versionRecord);
      }
    }

    await prisma.system_settings.upsert({
      where: { key: 'mobile_app_versions' },
      update: { value: currentList },
      create: { key: 'mobile_app_versions', value: currentList }
    });

    console.log(`\n🎉 Release v${versionToDeploy} successfully registered for [${targetPlatforms.join(', ')}] in Admin Dashboard!`);
    console.log(`View live at: Photography Admin -> Mobile App Management -> Versions`);
  } catch (err) {
    console.warn(`⚠️ Warning: Could not sync version to database:`, err.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let targetApp = 'client';
  let targetVersion = '';
  let releaseNotes = 'Automated live update with performance improvements, brand logo, and Ghana compliance.';
  let platform = 'both';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--app' && args[i + 1]) targetApp = args[i + 1].toLowerCase();
    if (args[i] === '--version' && args[i + 1]) targetVersion = args[i + 1];
    if (args[i] === '--notes' && args[i + 1]) releaseNotes = args[i + 1];
    if (args[i] === '--platform' && args[i + 1]) platform = args[i + 1];
  }

  if (targetApp === 'all' || targetApp === 'both') {
    await deploySingleApp('client', targetVersion, releaseNotes, platform);
    await deploySingleApp('photographer', targetVersion, releaseNotes, platform);
  } else {
    await deploySingleApp(targetApp, targetVersion, releaseNotes, platform);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
