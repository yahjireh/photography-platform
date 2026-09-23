/**
 * Automated Mobile Release & Admin Dashboard Sync Script
 * 
 * Usage:
 *   node scripts/sync-mobile-release.js --app photographer --version 1.0.1 --notes "Camera permissions & KYC fixes"
 *   node scripts/sync-mobile-release.js --app client --version 1.0.0 --notes "Initial client release"
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require(path.join(__dirname, '..', 'backend', 'node_modules', '@prisma', 'client'));

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  let targetApp = 'photographer';
  let targetVersion = '';
  let releaseNotes = 'Automated live update with performance improvements and bug fixes.';
  let platform = 'Android';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--app' && args[i + 1]) targetApp = args[i + 1];
    if (args[i] === '--version' && args[i + 1]) targetVersion = args[i + 1];
    if (args[i] === '--notes' && args[i + 1]) releaseNotes = args[i + 1];
    if (args[i] === '--platform' && args[i + 1]) platform = args[i + 1];
  }

  const appDir = targetApp === 'client' 
    ? path.join(__dirname, '..', 'apps', 'clickflicks-client')
    : path.join(__dirname, '..', 'apps', 'clickflicks-photographer');

  const appId = targetApp === 'client' ? 'com.clickflicks.app' : 'com.clickflicks.photographer';

  console.log(`\n======================================================`);
  console.log(`🚀 ClickFlicks Automated Live Release`);
  console.log(`App: ${targetApp} (${appId})`);
  console.log(`Platform: ${platform}`);
  console.log(`======================================================\n`);

  // 1. Build Web Assets
  console.log(`📦 [1/4] Building web bundle in ${appDir}...`);
  execSync('npm run build', { cwd: appDir, stdio: 'inherit' });

  // 2. Determine or bump version if not supplied
  const pkgPath = path.join(appDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const versionToDeploy = targetVersion || pkg.version;
  console.log(`\n🏷️ [2/4] Deploying Version: v${versionToDeploy}`);

  // 3. Upload to Capgo Cloud Live Updates (production channel)
  console.log(`\n☁️ [3/4] Uploading live bundle to Capgo Cloud...`);
  try {
    execSync(`npx @capgo/cli bundle upload ${appId} -c production -b ${versionToDeploy} --comment "${releaseNotes}"`, {
      cwd: appDir,
      stdio: 'inherit'
    });
    console.log(`✅ Capgo live bundle uploaded successfully!`);
  } catch (err) {
    console.warn(`⚠️ Capgo upload warning:`, err.message);
  }

  // 4. Register with Admin Dashboard under Mobile App Management
  console.log(`\n📊 [4/4] Syncing version with Admin Dashboard database...`);
  const row = await prisma.system_settings.findUnique({
    where: { key: 'mobile_app_versions' }
  });

  let currentList = [];
  if (row && Array.isArray(row.value)) {
    currentList = row.value;
  }

  const existingIdx = currentList.findIndex(
    v => (v.platform || '').toLowerCase() === platform.toLowerCase() && v.appId === appId
  );

  const versionRecord = {
    id: `${targetApp}_${platform.toLowerCase()}_${Date.now()}`,
    appId,
    appName: targetApp === 'client' ? 'ClickFlicks Client' : 'ClickFlicks Photographer',
    platform: platform === 'iOS' ? 'iOS' : 'Android',
    version: versionToDeploy,
    buildNumber: `${Date.now()}`.slice(-4),
    minRequired: versionToDeploy,
    status: 'live',
    releaseDate: new Date().toISOString().split('T')[0],
    users: 0,
    forceUpdate: false,
    softUpdate: true,
    releaseNotes,
    storeUrl: targetApp === 'client' 
      ? 'https://play.google.com/store/apps/details?id=com.clickflicks.app'
      : 'https://play.google.com/store/apps/details?id=com.clickflicks.photographer'
  };

  if (existingIdx >= 0) {
    currentList[existingIdx] = { ...currentList[existingIdx], ...versionRecord };
  } else {
    currentList.unshift(versionRecord);
  }

  await prisma.system_settings.upsert({
    where: { key: 'mobile_app_versions' },
    update: { value: currentList },
    create: { key: 'mobile_app_versions', value: currentList }
  });

  console.log(`\n🎉 Release v${versionToDeploy} successfully registered in Admin Dashboard!`);
  console.log(`View live at: Photography Admin -> Mobile App Management -> Versions`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
