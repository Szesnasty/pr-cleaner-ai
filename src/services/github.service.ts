/**
 * GitHub Service - handles GitHub API interactions
 */

import { execSync, spawnSync } from 'child_process';
import { GitService } from './git.service';

export class GitHubService {
  /**
   * Check if GitHub CLI is installed and authenticated
   */
  static checkAuth(): void {
    try {
      execSync('gh auth status', { encoding: 'utf-8', stdio: 'pipe' });
    } catch (error) {
      console.error('\n❌ GitHub CLI is not installed or not authenticated!');
      console.log('\n💡 Please install and authenticate:');
      console.log('   1. Install: https://cli.github.com/');
      console.log('   2. Authenticate: gh auth login');
      console.log('   3. Run check: pr-cleaner-ai check\n');
      process.exit(1);
    }
  }

  /**
   * Call GitHub API using gh CLI
   */
  static callApi(endpoint: string, owner: string, repo: string, prNumber: number): any {
    try {
      // Use spawnSync to avoid command injection
      const result = spawnSync('gh', ['api', endpoint, '--paginate'], {
        encoding: 'utf-8'
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        const error: any = new Error(result.stderr || 'gh api command failed');
        error.message = result.stderr;
        throw error;
      }

      return JSON.parse(result.stdout);
    } catch (error: any) {
      console.error(`\n❌ Error calling GitHub API: ${endpoint}`);
      
      if (error.message?.includes('404')) {
        console.log('\n🔍 Possible causes:');
        console.log(`   1. PR #${prNumber} does not exist in repository ${owner}/${repo}`);
        console.log('   2. Repository is private and you have no access');
        console.log('\n💡 Solutions:');
        console.log(
          `   - Check if PR exists: https://github.com/${owner}/${repo}/pull/${prNumber}`
        );
        console.log('   - Make sure you have access to the repository');
        console.log('   - Try: gh auth refresh\n');
      } else if (error.message?.includes('401')) {
        console.error('\n❌ Unauthorized');
        console.log('\n💡 Your authentication may have expired');
        console.log('   Try: gh auth login\n');
      } else if (error.message?.includes('403')) {
        console.error('\n❌ Forbidden');
        console.log('\n💡 You may not have sufficient permissions');
        console.log('   Try: gh auth refresh -s repo\n');
      }
      
      throw error;
    }
  }

  /**
   * Get current PR number from branch or command line argument
   */
  static getCurrentPRNumber(): number {
    const prArg = process.argv.find((arg) => arg.startsWith('--pr='));

    if (prArg) {
      return parseInt(prArg.split('=')[1], 10);
    }

    // Auto-detect PR from current branch
    try {
      const currentBranch = GitService.getCurrentBranch();
      console.log(`\n🌿 Current branch: ${currentBranch}`);
      console.log('🔍 Looking for PR associated with this branch...');

      // Try to find PR for current branch using gh CLI
      // Use spawnSync to avoid command injection
      const result = spawnSync('gh', [
        'pr', 'list',
        '--state', 'all',
        '--head', currentBranch,
        '--json', 'number',
        '--jq', '.[0].number'
      ], {
        encoding: 'utf-8'
      });

      if (result.error) {
        throw result.error;
      }

      const output = result.stdout.trim();

      if (!output || output === 'null') {
        console.error(`\n❌ No PR found for branch: ${currentBranch}`);
        console.log('\n💡 Options:');
        console.log('   1. Create a PR for this branch first');
        console.log('   2. Or specify PR number manually:');
        console.log('      pr-cleaner-ai fetch --pr=123');
        process.exit(1);
      }

      const prNumber = parseInt(output, 10);
      console.log(`✅ Found PR #${prNumber} for branch "${currentBranch}"`);
      return prNumber;
    } catch (error) {
      console.error('\n❌ Cannot fetch PR number automatically.');
      console.log('\n💡 Make sure:');
      console.log('   1. You are on a branch with an associated PR');
      console.log('   2. GitHub CLI is authenticated (gh auth status)');
      console.log('\n   Or provide PR number directly:');
      console.log('   pr-cleaner-ai fetch --pr=123');
      console.log('\n🔍 Check all requirements:');
      console.log('   pr-cleaner-ai check');
      process.exit(1);
    }
  }
}

