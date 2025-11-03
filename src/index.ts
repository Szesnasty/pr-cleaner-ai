#!/usr/bin/env node

/// <reference types="node" />

/* eslint-disable no-console */
/**
 * pr-cleaner-ai - Fetch and resolve GitHub Pull Request comments
 * 
 * Entry point for the CLI tool
 */

import { FetchCommand } from './commands/fetch.command';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const command = process.argv[2];

  // Handle 'init' command - delegate to scripts/init.js
  if (command === 'init') {
    // Try multiple possible paths (for npm package vs local development)
    const possiblePaths = [
      path.join(__dirname, '../scripts/init.js'), // From dist/ in npm package
      path.join(process.cwd(), 'node_modules', 'pr-cleaner-ai', 'scripts', 'init.js'), // From node_modules
      path.join(__dirname, '../../scripts/init.js') // Alternative path
    ];

    let initScriptPath: string | null = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        initScriptPath = possiblePath;
        break;
      }
    }

    if (!initScriptPath) {
      console.error('❌ Error: init script not found');
      console.error('   Tried paths:', possiblePaths.join(', '));
      process.exit(1);
    }

    // Execute init.js directly using require
    try {
      const initModule = require(initScriptPath);
      // Call main() if exported, otherwise the module should execute on require
      if (typeof initModule.main === 'function') {
        initModule.main();
      }
    } catch (error: any) {
      console.error('❌ Error running init:', error.message);
      process.exit(1);
    }
    return;
  }

  // Handle 'check' command - basic environment check
  if (command === 'check') {
    console.log('\n🔍 Checking pr-cleaner-ai environment...\n');
    
    // Check GitHub CLI
    try {
      const { execSync } = require('child_process');
      execSync('gh auth status', { encoding: 'utf-8', stdio: 'pipe' });
      console.log('✅ GitHub CLI is authenticated');
    } catch {
      console.log('❌ GitHub CLI is not installed or not authenticated');
      console.log('   Run: gh auth login\n');
    }

    // Check Cursor rules
    const cursorRulesPath = path.join(process.cwd(), '.cursor/rules/pr-cleaner-ai.mdc');
    if (fs.existsSync(cursorRulesPath)) {
      console.log('✅ Cursor rules file found: .cursor/rules/pr-cleaner-ai.mdc');
    } else {
      console.log('⚠️  Cursor rules file not found');
      console.log('   Run: npx pr-cleaner-ai init\n');
    }

    // Check config
    const configPath = path.join(process.cwd(), '.pr-cleaner-ai.config.json');
    if (fs.existsSync(configPath)) {
      console.log('✅ Config file found: .pr-cleaner-ai.config.json');
    } else {
      console.log('ℹ️  No config file (using defaults)');
    }

    console.log('');
    return;
  }

  // Default: 'fetch' command (or no command specified)
  // If command is undefined or 'fetch', run FetchCommand
  if (!command || command === 'fetch') {
    const fetchCommand = new FetchCommand();
    await fetchCommand.execute();
    return;
  }

  // Unknown command
  console.error(`❌ Unknown command: ${command}`);
  console.log('\n📚 Available commands:');
  console.log('   init     - Initialize pr-cleaner-ai in this project');
  console.log('   fetch    - Fetch PR comments (default)');
  console.log('   check    - Check environment setup');
  console.log('\n💡 Examples:');
  console.log('   npx pr-cleaner-ai init');
  console.log('   npx pr-cleaner-ai fetch --pr=123');
  console.log('   npx pr-cleaner-ai check\n');
  process.exit(1);
}

// Run
main();

