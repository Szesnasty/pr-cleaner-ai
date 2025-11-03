#!/usr/bin/env node

/// <reference types="node" />

/* eslint-disable no-console */
/**
 * pr-cleaner-ai - Fetch and resolve GitHub Pull Request comments
 * 
 * Entry point for the CLI tool
 */

import { FetchCommand } from './commands/fetch.command';

async function main() {
  const fetchCommand = new FetchCommand();
  await fetchCommand.execute();
}

// Run
main();

