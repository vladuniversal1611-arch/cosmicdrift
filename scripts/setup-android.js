/*  Runs after `npm install`.
    - Adds the Android platform (idempotent — skips if android/ exists)
    - Runs `cap sync` so web assets + AdMob plugin land in the native project
    - Patches AndroidManifest.xml to include the AdMob APPLICATION_ID */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_ID_ADMOB = 'ca-app-pub-5816871059908402~5417483753';

function run (cmd) {
  console.log('▸ ' + cmd);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

// 1. Add Android platform if missing
if (!fs.existsSync(path.join(ROOT, 'android'))) {
  try { run('npx cap add android'); }
  catch (e) {
    console.warn('⚠︎  `cap add android` failed. Run it manually once Java+Android SDK are installed.');
    process.exit(0);   // don't fail npm install
  }
}

// 2. Sync web + plugins into native
try { run('npx cap sync'); }
catch (e) { console.warn('⚠︎  `cap sync` failed — run it after fixing the error above.'); }

// 3. Ensure AndroidManifest.xml has the AdMob APPLICATION_ID meta-data
const manifest = path.join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifest)) {
  let xml = fs.readFileSync(manifest, 'utf8');
  if (!xml.includes('com.google.android.gms.ads.APPLICATION_ID')) {
    const meta = `
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="${APP_ID_ADMOB}"/>
`;
    // Insert right before </application>
    xml = xml.replace(/(<\/application>)/, meta + '    $1');
    fs.writeFileSync(manifest, xml);
    console.log('✓ AndroidManifest.xml patched with AdMob APPLICATION_ID');
  } else {
    console.log('✓ AdMob APPLICATION_ID already present in AndroidManifest.xml');
  }

  // Also make sure INTERNET permission is in there (usually is)
  if (!/uses-permission[^>]+INTERNET/.test(xml)) {
    xml = xml.replace(/<manifest([^>]*)>/, '<manifest$1>\n    <uses-permission android:name="android.permission.INTERNET"/>');
    fs.writeFileSync(manifest, xml);
    console.log('✓ INTERNET permission added to AndroidManifest.xml');
  }
}

console.log('\n═══════════════════════════════════════════════════');
console.log('  All set. Next:');
console.log('    npm run android   # open in Android Studio');
console.log('    npm run sync      # rebuild www/ + sync native after edits');
console.log('═══════════════════════════════════════════════════\n');
