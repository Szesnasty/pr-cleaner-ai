#!/usr/bin/env node

/* eslint-disable no-console */
/**
 * Postinstall hook for pr-cleaner-ai
 * 
 * - Shows welcome message
 * - Reminds user to run `npx pr-cleaner-ai init` for first-time setup
 * - Does NOT modify any files automatically (user must run init explicitly)
 * - Security: No network calls, path validation, respects PR_CLEANER_AI_SKIP_POSTINSTALL
 */

function main() {
  // Skip if explicitly requested (security: allows users to skip postinstall)
  if (process.env.PR_CLEANER_AI_SKIP_POSTINSTALL === '1') {
    return;
  }

  // Skip in CI environments
  if (process.env.CI) {
    return;
  }

  const fs = require('fs');
  const path = require('path');
  
  // Security: Validate project root path to prevent directory traversal
  const projectRoot = process.cwd();
  if (!projectRoot || typeof projectRoot !== 'string') {
    console.warn('⚠️  Invalid project root, skipping postinstall');
    return;
  }

  // Security: Use path.resolve() to normalize and validate paths
  const resolvedRoot = path.resolve(projectRoot);
  const currentDir = path.resolve(process.cwd());
  // Security: Ensure resolved path matches current directory (prevent directory traversal)
  if (resolvedRoot !== currentDir && !resolvedRoot.startsWith(currentDir + path.sep)) {
    console.warn('⚠️  Path validation failed, skipping postinstall');
    return;
  }

  // Security: Only read files, never write in postinstall
  // User must explicitly run `npx pr-cleaner-ai init` to create files
  const rulesFile = path.resolve(resolvedRoot, '.cursor', 'rules', 'pr-cleaner-ai.mdc');
  
  // Security: Validate rulesFile is within project root
  if (!rulesFile.startsWith(resolvedRoot)) {
    console.warn('⚠️  Path validation failed for rules file, skipping check');
    return;
  }

  const hasRulesFile = fs.existsSync(rulesFile);
  
  console.log('\n🎉 pr-cleaner-ai installed successfully!\n');
  
  if (hasRulesFile) {
    console.log('✅ Cursor rules file detected (already initialized)');
    console.log('   If you want to update it, run: \x1b[1mnpx pr-cleaner-ai init\x1b[0m\n');
  } else {
    console.log('📝 Next step: Initialize the package');
    console.log('   Run: \x1b[1mnpx pr-cleaner-ai init\x1b[0m');
    console.log('');
    console.log('This will:');
    console.log('  • Copy .cursor/rules/pr-cleaner-ai.mdc from npm package');
    console.log('  • Add .pr-cleaner-ai-output/ and .cursor/rules/pr-cleaner-ai.mdc to .gitignore');
    console.log('  • Optionally add scripts to package.json');
    console.log('');
  }
  
  console.log('After init, you can use:');
  console.log('  • In Cursor: \x1b[36mfix PR 2146\x1b[0m (or "PR 2146")');
  console.log('  • In terminal: \x1b[36mnpx pr-cleaner-ai fetch --pr=2146\x1b[0m');
  console.log('');
  console.log('💡 Requirement: GitHub CLI must be installed and authenticated');
  console.log('   Install: \x1b[36mbrew install gh\x1b[0m (macOS) or https://cli.github.com/');
  console.log('   Authenticate: \x1b[36mgh auth login\x1b[0m');
  console.log('');
  console.log('📚 Documentation: https://github.com/Szesnasty/pr-cleaner-ai#readme\n');
}

if (require.main === module) {
  main();
}

module.exports = { main };
