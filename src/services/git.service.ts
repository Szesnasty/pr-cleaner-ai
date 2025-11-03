/**
 * Git Service - handles git operations
 */

import { execSync, spawnSync } from 'child_process';

export class GitService {
  /**
   * Get the remote URL of the current git repository
   */
  static getRemoteUrl(): string {
    try {
      return execSync('git config --get remote.origin.url', { 
        encoding: 'utf-8' 
      }).trim();
    } catch (error) {
      console.error('❌ Cannot get repository URL');
      process.exit(1);
      // This will never execute, but TypeScript needs it
      throw new Error('Cannot get repository URL');
    }
  }

  /**
   * Parse GitHub URL to extract owner and repo
   */
  static parseGitHubUrl(remoteUrl: string): { owner: string; repo: string } {
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);

    if (!match || !match[1] || !match[2]) {
      console.error('❌ Cannot parse GitHub repository URL');
      process.exit(1);
      // This will never execute, but TypeScript needs it
      throw new Error('Cannot parse GitHub repository URL');
    }

    return { 
      owner: match[1], 
      repo: match[2] 
    };
  }

  /**
   * Get the current git branch name
   */
  static getCurrentBranch(): string {
    try {
      const result = spawnSync('git', ['branch', '--show-current'], {
        encoding: 'utf-8'
      });

      if (result.error) {
        throw result.error;
      }

      const branch = result.stdout.trim();
      if (!branch) {
        console.error('❌ Not on a git branch');
        console.log('\n💡 Make sure you are on a branch with an associated PR');
        process.exit(1);
      }

      return branch;
    } catch (error) {
      console.error('❌ Cannot get current branch');
      process.exit(1);
      throw new Error('Cannot get current branch');
    }
  }
}

