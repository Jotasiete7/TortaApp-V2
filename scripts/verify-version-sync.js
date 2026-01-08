#!/usr/bin/env node

const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    log(`❌ Error reading ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    log(`❌ Error reading ${filePath}: ${error.message}`, 'red');
    return null;
  }
}

function extractVersionFromMarkdown(content, pattern) {
  const match = content.match(pattern);
  return match ? match[1] : null;
}

function main() {
  log('\n🔍 Version Sync Verification\n', 'blue');
  
  const errors = [];
  const warnings = [];
  
  log('📦 Checking package.json...', 'blue');
  const packageJson = readJsonFile('package.json');
  if (!packageJson) errors.push('Failed to read package.json');
  const packageVersion = packageJson?.version;
  log(`   Version: ${packageVersion}`, 'green');
  
  log('\n🦀 Checking src-tauri/tauri.conf.json...', 'blue');
  const tauriConf = readJsonFile('src-tauri/tauri.conf.json');
  if (!tauriConf) errors.push('Failed to read src-tauri/tauri.conf.json');
  const tauriVersion = tauriConf?.version;
  log(`   Version: ${tauriVersion}`, 'green');
  
  log('\n📊 Checking PROJECT_STATUS.md...', 'blue');
  const projectStatus = readTextFile('PROJECT_STATUS.md');
  if (!projectStatus) {
    warnings.push('PROJECT_STATUS.md not found');
  } else {
    const statusVersion = extractVersionFromMarkdown(projectStatus, /\*\*Versão Atual\*\*\s*\|\s*`([^`]+)`/);
    log(`   Version: ${statusVersion}`, 'green');
    if (statusVersion !== packageVersion) {
      errors.push(`PROJECT_STATUS.md version (${statusVersion}) doesn't match package.json (${packageVersion})`);
    }
  }
  
  log('\n📖 Checking README.md...', 'blue');
  const readme = readTextFile('README.md');
  if (!readme) {
    warnings.push('README.md not found');
  } else {
    const readmeVersion = extractVersionFromMarkdown(readme, /Current Version:\s*([0-9.]+(?:-[a-z0-9.]+)?)/i);
    log(`   Version: ${readmeVersion}`, 'green');
    if (readmeVersion !== packageVersion) {
      errors.push(`README.md version (${readmeVersion}) doesn't match package.json (${packageVersion})`);
    }
  }
  
  log('\n📝 Checking CHANGELOG.md...', 'blue');
  const changelog = readTextFile('CHANGELOG.md');
  if (!changelog) {
    warnings.push('CHANGELOG.md not found');
  } else {
    const hasEntry = changelog.includes(`## [${packageVersion}]`);
    if (hasEntry) {
      log(`   ✅ Has entry for version ${packageVersion}`, 'green');
    } else {
      errors.push(`CHANGELOG.md missing entry for version ${packageVersion}`);
    }
  }
  
  log('\n🔄 Cross-checking versions...', 'blue');
  if (packageVersion !== tauriVersion) {
    errors.push(`Version mismatch: package.json (${packageVersion}) vs tauri.conf.json (${tauriVersion})`);
  } else {
    log(`   ✅ package.json and tauri.conf.json are synchronized`, 'green');
  }
  
  log('\n' + '='.repeat(50), 'blue');
  
  if (warnings.length > 0) {
    log('\n⚠️  Warnings:', 'yellow');
    warnings.forEach(warning => log(`   - ${warning}`, 'yellow'));
  }
  
  if (errors.length > 0) {
    log('\n❌ Errors found:', 'red');
    errors.forEach(error => log(`   - ${error}`, 'red'));
    log('\n🚫 Version sync check FAILED!', 'red');
    log('   Please fix the errors above before creating a release.\n', 'red');
    process.exit(1);
  } else {
    log('\n✅ All versions are synchronized!', 'green');
    log(`   Current version: ${packageVersion}\n`, 'green');
    process.exit(0);
  }
}

main();
