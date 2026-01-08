#!/usr/bin/env node

/**
 * Version Synchronization Verification Script
 * 
 * This script verifies that all version numbers are synchronized across
 * the project before creating a release.
 * 
 * Usage: node scripts/verify-version-sync.js
 * Exit code: 0 if all versions match, 1 if there are discrepancies
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function readJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
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
    log('\n🔍 Version Synchronization Verification\n', 'cyan');
    log('━'.repeat(50), 'blue');

    const errors = [];
    const warnings = [];
    const versions = {};

    // Change to project root directory
    const projectRoot = path.resolve(__dirname, '..');
    process.chdir(projectRoot);

    // 1. Read version from package.json
    log('\n📦 Checking package.json...', 'blue');
    const packageJson = readJsonFile('package.json');
    if (packageJson && packageJson.version) {
        versions.packageJson = packageJson.version;
        log(`   Version: ${packageJson.version}`, 'green');
    } else {
        errors.push('Could not read version from package.json');
    }

    // 2. Read version from src-tauri/tauri.conf.json
    log('\n🦀 Checking src-tauri/tauri.conf.json...', 'blue');
    const tauriConf = readJsonFile('src-tauri/tauri.conf.json');
    if (tauriConf && tauriConf.version) {
        versions.tauriConf = tauriConf.version;
        log(`   Version: ${tauriConf.version}`, 'green');
    } else {
        errors.push('Could not read version from src-tauri/tauri.conf.json');
    }

    // 3. Check PROJECT_STATUS.md
    log('\n📊 Checking PROJECT_STATUS.md...', 'blue');
    const projectStatus = readTextFile('PROJECT_STATUS.md');
    if (projectStatus) {
        const versionMatch = extractVersionFromMarkdown(
            projectStatus,
            /\*\*Versão Atual\*\*\s*\|\s*`([^`]+)`/
        );
        if (versionMatch) {
            versions.projectStatus = versionMatch;
            log(`   Version: ${versionMatch}`, 'green');
        } else {
            warnings.push('Could not extract version from PROJECT_STATUS.md');
        }
    } else {
        warnings.push('Could not read PROJECT_STATUS.md');
    }

    // 4. Check CHANGELOG.md
    log('\n📝 Checking CHANGELOG.md...', 'blue');
    const changelog = readTextFile('CHANGELOG.md');
    if (changelog) {
        const versionMatch = extractVersionFromMarkdown(
            changelog,
            /##\s*\[([^\]]+)\]\s*-\s*\d{4}-\d{2}-\d{2}/
        );
        if (versionMatch) {
            versions.changelog = versionMatch;
            log(`   Latest entry: ${versionMatch}`, 'green');
        } else {
            warnings.push('Could not extract latest version from CHANGELOG.md');
        }
    } else {
        errors.push('Could not read CHANGELOG.md');
    }

    // 5. Check README.md
    log('\n📖 Checking README.md...', 'blue');
    const readme = readTextFile('README.md');
    if (readme) {
        const versionMatch = extractVersionFromMarkdown(
            readme,
            /###\s*Current Version:\s*([^\s\n]+)/
        );
        if (versionMatch) {
            versions.readme = versionMatch;
            log(`   Version: ${versionMatch}`, 'green');
        } else {
            warnings.push('Could not extract version from README.md');
        }
    } else {
        warnings.push('Could not read README.md');
    }

    // Verification: Check if all versions match
    log('\n' + '━'.repeat(50), 'blue');
    log('\n🔎 Verification Results:\n', 'cyan');

    const uniqueVersions = [...new Set(Object.values(versions))];

    if (uniqueVersions.length === 0) {
        log('❌ FAILED: No versions could be extracted', 'red');
        process.exit(1);
    } else if (uniqueVersions.length === 1) {
        log(`✅ SUCCESS: All versions are synchronized to ${uniqueVersions[0]}`, 'green');

        // Display all checked files
        log('\n📋 Verified files:', 'blue');
        Object.entries(versions).forEach(([file, version]) => {
            log(`   ✓ ${file}: ${version}`, 'green');
        });

        if (warnings.length > 0) {
            log('\n⚠️  Warnings:', 'yellow');
            warnings.forEach(warning => log(`   • ${warning}`, 'yellow'));
        }

        log('\n' + '━'.repeat(50), 'blue');
        process.exit(0);
    } else {
        log('❌ FAILED: Version mismatch detected!', 'red');
        log('\n📋 Version details:', 'yellow');
        Object.entries(versions).forEach(([file, version]) => {
            log(`   ${file}: ${version}`, 'yellow');
        });

        if (errors.length > 0) {
            log('\n❌ Errors:', 'red');
            errors.forEach(error => log(`   • ${error}`, 'red'));
        }

        if (warnings.length > 0) {
            log('\n⚠️  Warnings:', 'yellow');
            warnings.forEach(warning => log(`   • ${warning}`, 'yellow'));
        }

        log('\n💡 Action required: Update all files to use the same version number.', 'yellow');
        log('   Recommended version: ' + versions.packageJson, 'cyan');
        log('\n' + '━'.repeat(50), 'blue');
        process.exit(1);
    }
}

// Run the script
main();
