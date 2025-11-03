/**
 * Config Service - handles configuration loading
 */

import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../types';

export class ConfigService {
  /**
   * Load configuration from .pr-cleaner-ai.config.json
   */
  static load(): Config {
    const configPath = path.join(process.cwd(), '.pr-cleaner-ai.config.json');
    
    if (!fs.existsSync(configPath)) {
      return {};
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const config: Config = JSON.parse(configContent);
      return config;
    } catch (error) {
      console.warn(`⚠️  Failed to load config from ${configPath}: ${(error as Error).message}`);
      console.warn('   Using default configuration.\n');
      return {};
    }
  }

  /**
   * Get the path to the config file
   */
  static getConfigPath(): string {
    return path.join(process.cwd(), '.pr-cleaner-ai.config.json');
  }
}

