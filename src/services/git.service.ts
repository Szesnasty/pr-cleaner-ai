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
    // Security: Basic URL validation
    if (!remoteUrl || typeof remoteUrl !== 'string') {
      console.error('❌ Invalid remote URL');
      process.exit(1);
      throw new Error('Invalid remote URL');
    }

    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);

    if (!match || !match[1] || !match[2]) {
      console.error('❌ Cannot parse GitHub repository URL');
      process.exit(1);
      // This will never execute, but TypeScript needs it
      throw new Error('Cannot parse GitHub repository URL');
    }

    const owner = match[1].trim();
    const repo = match[2].trim();

    // Security: Validate parsed owner/repo format
    if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) {
      console.error('❌ Invalid owner or repo format in URL');
      process.exit(1);
      throw new Error('Invalid owner or repo format');
    }

    return { 
      owner, 
      repo 
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

