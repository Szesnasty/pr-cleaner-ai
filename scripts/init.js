#!/usr/bin/env node

/* eslint-disable no-console, @typescript-eslint/no-require-imports */
/**
 * Initialization script for pr-cleaner-ai
 *
 * Run with: npx pr-cleaner-ai init
 *
 * This script:
 * 1. Copies .cursor/rules/pr-cleaner-ai.mdc
 * 2. Adds .pr-cleaner-ai-output/ and .cursor/rules/pr-cleaner-ai.mdc to .gitignore
 * 3. Optionally adds scripts to package.json
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

/**
 * Adds scripts to package.json
 */
function addScriptsToPackageJson() {
  const packageJsonPath = path.join(projectRoot, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.warn('⚠️  package.json does not exist - skipping script addition');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  let added = false;

  if (!packageJson.scripts['pr-cleaner-ai']) {
    packageJson.scripts['pr-cleaner-ai'] = 'pr-cleaner-ai fetch';
    added = true;
  }

  if (!packageJson.scripts['pr-cleaner-ai:check']) {
    packageJson.scripts['pr-cleaner-ai:check'] = 'pr-cleaner-ai check';
    added = true;
  }

  if (added) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('✅ Scripts added to package.json');
  }
}

/**
 * Ensures .pr-cleaner-ai-output/ and .cursor/rules/pr-cleaner-ai.mdc are in .gitignore
 */
function ensureGitignore() {
  try {
    // Check if we're in a git repo
    execSync('git rev-parse --git-dir', { encoding: 'utf-8', cwd: projectRoot, stdio: 'pipe' });

    const gitignorePath = path.join(projectRoot, '.gitignore');
    let gitignoreContent = '';
    
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    }

    // Add .pr-cleaner-ai-output/ to .gitignore
    const outputDir = '.pr-cleaner-ai-output/';
    const hasOutputDir = gitignoreContent.split('\n').some(line => {
      const trimmed = line.trim();
      return trimmed === outputDir || trimmed === '.pr-cleaner-ai-output' || trimmed === '/.pr-cleaner-ai-output/';
    });

    if (!hasOutputDir) {
      if (gitignoreContent && !gitignoreContent.endsWith('\n')) {
        gitignoreContent += '\n';
      }
      gitignoreContent += `\n# pr-cleaner-ai - output directory\n`;
      gitignoreContent += `${outputDir}\n`;
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log(`✅ Added ${outputDir} to .gitignore`);
    }
    
    // Re-read gitignore content after potential update
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    
    // Add .cursor/rules/pr-cleaner-ai.mdc to .gitignore (auto-generated file)
    const cursorRulesFile = '.cursor/rules/pr-cleaner-ai.mdc';
    const hasCursorRules = gitignoreContent.split('\n').some(line => {
      const trimmed = line.trim();
      return trimmed === cursorRulesFile || 
             trimmed === '.cursor/rules/pr-cleaner-ai.mdc' ||
             trimmed === '.cursor/rules/*' ||
             trimmed === '.cursor/*';
    });

    if (!hasCursorRules) {
      if (gitignoreContent && !gitignoreContent.endsWith('\n')) {
        gitignoreContent += '\n';
      }
      gitignoreContent += `\n# pr-cleaner-ai - Cursor rules file (auto-generated, don't commit)\n`;
      gitignoreContent += `${cursorRulesFile}\n`;
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log(`✅ Added ${cursorRulesFile} to .gitignore`);
    }
    
    // Re-read gitignore content after potential update
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    
    // Add .pr-cleaner-ai.config.json to .gitignore (user-specific config file)
    const configFile = '.pr-cleaner-ai.config.json';
    const hasConfigFile = gitignoreContent.split('\n').some(line => {
      const trimmed = line.trim();
      return trimmed === configFile || 
             trimmed === '.pr-cleaner-ai.config.json';
    });

    if (!hasConfigFile) {
      if (gitignoreContent && !gitignoreContent.endsWith('\n')) {
        gitignoreContent += '\n';
      }
      gitignoreContent += `\n# pr-cleaner-ai - User configuration (user-specific)\n`;
      gitignoreContent += `${configFile}\n`;
      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log(`✅ Added ${configFile} to .gitignore`);
    }
  } catch {
    // Not a git repo - that's OK
  }
}

/**
 * Configures Cursor rules (copies from npm package to .cursor/rules/)
 */
function setupCursorRules() {
  const cursorRulesDir = path.join(projectRoot, '.cursor', 'rules');
  const targetFile = path.join(cursorRulesDir, 'pr-cleaner-ai.mdc');

  // Find source file in npm package (node_modules)
  const possibleSourcePaths = [
    path.join(projectRoot, 'node_modules', 'pr-cleaner-ai', 'config', 'pr-cleaner-ai.mdc'),
    path.join(__dirname, '../config/pr-cleaner-ai.mdc'),
    path.join(__dirname, '../../config/pr-cleaner-ai.mdc')
  ];

  let sourcePath = null;
  for (const possiblePath of possibleSourcePaths) {
    if (fs.existsSync(possiblePath)) {
      sourcePath = possiblePath;
      break;
    }
  }

  if (!sourcePath) {
    console.warn('⚠️  Could not find pr-cleaner-ai rules file in node_modules');
    console.warn('   Make sure pr-cleaner-ai package is installed: npm install pr-cleaner-ai');
    return;
  }

  try {
    // Create .cursor/rules folder if it doesn't exist
    if (!fs.existsSync(cursorRulesDir)) {
      fs.mkdirSync(cursorRulesDir, { recursive: true });
      console.log('✅ Created .cursor/rules folder');
    }

    // Copy file from npm package
    fs.copyFileSync(sourcePath, targetFile);
    console.log('✅ Copied Cursor rules: .cursor/rules/pr-cleaner-ai.mdc');
    console.log('   (Rules match your installed package version)');
    console.log('   You can now use: fix PR <NUMBER> (or "PR <NUMBER>")');
  } catch (error) {
    console.warn(`⚠️  Failed to configure Cursor rules: ${error.message}`);
  }
}

/**
 * Checks if GitHub CLI is authenticated
 */
function checkGitHubCLI() {
  try {
    execSync('gh auth status', { encoding: 'utf-8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Main initialization function
 */
function main() {
  console.log('\n🚀 Initializing pr-cleaner-ai...\n');

  try {
    // 1. Copy Cursor rules
    setupCursorRules();

    // 2. Ensure .pr-cleaner-ai-output/ and .cursor/rules/pr-cleaner-ai.mdc are in .gitignore
    ensureGitignore();

    // 3. Ask about adding scripts to package.json
    console.log('\n📝 Optional: Add scripts to package.json?');
    console.log('   This will add:');
    console.log('   - "pr-cleaner-ai": "pr-cleaner-ai fetch"');
    console.log('   - "pr-cleaner-ai:check": "pr-cleaner-ai check"');
    console.log('');
    console.log('   You can add them manually later if you prefer.');
    console.log('   To add now, run: npx pr-cleaner-ai init --with-scripts\n');
    
    // Check if --with-scripts flag is present
    if (process.argv.includes('--with-scripts')) {
      addScriptsToPackageJson();
    }

    // 4. Check GitHub CLI authentication
    const isAuthenticated = checkGitHubCLI();

    console.log('\n✅ Initialization complete!\n');

    if (!isAuthenticated) {
      console.log('⚠️  GitHub CLI is not installed or not authenticated\n');
      console.log('📝 Required steps to use pr-cleaner-ai:\n');
      console.log('1️⃣  Install GitHub CLI (gh):');
      console.log('   macOS:     brew install gh');
      console.log('   Windows:   winget install --id GitHub.cli');
      console.log('   Linux:     https://cli.github.com/\n');
      console.log('2️⃣  Authenticate with GitHub:');
      console.log('   gh auth login\n');
      console.log('3️⃣  Use the tool:');
      console.log('   In Cursor: fix PR 123');
      console.log('   In terminal: npx pr-cleaner-ai fetch --pr=123\n');
    } else {
      console.log('✅ GitHub CLI is authenticated - ready to use!\n');
      console.log('📝 How to use:\n');
      console.log('   In Cursor:  fix PR 123  (or just "PR 123")');
      console.log('   In terminal: npx pr-cleaner-ai fetch --pr=123\n');
    }

    console.log('💡 Optional: Create .pr-cleaner-ai.config.json to customize:');
    console.log('   { "autoFix": true }  - auto-apply fixes without asking\n');
  } catch (error) {
    console.error('⚠️  Error during initialization:', error.message);
    console.error('   Some features may be unavailable.\n');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { 
  main
};
