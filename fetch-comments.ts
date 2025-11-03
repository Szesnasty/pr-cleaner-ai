#!/usr/bin/env node

/// <reference types="node" />

/* eslint-disable no-console */
/**
 * Script to fetch PR comments from GitHub using GitHub CLI (gh)
 *
 * Features:
 * - Fetches all PR comments (review comments, issue comments)
 * - Groups comments by files and lines
 * - Generates markdown file with comments
 * - Uses GitHub CLI for authentication (no token management needed!)
 */

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface GitHubComment {
  id: number;
  body: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  path?: string;
  line?: number;
  original_line?: number;
  diff_hunk?: string;
  in_reply_to_id?: number;
  html_url: string;
  resolved?: boolean; // Whether the comment is resolved (only for review comments)
}

interface IssueComment {
  id: number;
  body: string;
  user: {
    login: string;
  };
  created_at: string;
  html_url: string;
}

interface GroupedComment {
  file: string;
  line: number | null;
  comments: Array<{
    author: string;
    body: string;
    created_at: string;
    url: string;
    diff_hunk?: string;
    resolved?: boolean;
  }>;
}

interface Config {
  autoFix?: boolean;
  additionalRules?: string[];
}

class PRCommentsFetcher {
  private owner: string;
  private repo: string;
  private prNumber: number;
  private prTitle: string = '';
  private prAuthor: string = '';
  private config: Config = {};

  constructor() {
    // Check if gh CLI is installed and authenticated
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

    const remoteUrl = this.getGitRemoteUrl();
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);

    if (!match || !match[1] || !match[2]) {
      console.error('❌ Cannot parse GitHub repository URL');
      process.exit(1);
      // This will never execute, but TypeScript needs it
      throw new Error('Cannot parse GitHub repository URL');
    }

    this.owner = match[1];
    this.repo = match[2];
    this.prNumber = this.getCurrentPRNumber();
    this.config = this.loadConfig();

    console.log(`\n📋 Fetching comments for PR #${this.prNumber}`);
    console.log(`📦 Repository: ${this.owner}/${this.repo}`);
  }

  private getGitRemoteUrl(): string {
    try {
      return execSync('git config --get remote.origin.url', { encoding: 'utf-8' }).trim();
    } catch (error) {
      console.error('❌ Cannot get repository URL');
      process.exit(1);
      // This will never execute, but TypeScript needs it
      throw new Error('Cannot get repository URL');
    }
  }

  private getCurrentPRNumber(): number {
    const prArg = process.argv.find((arg) => arg.startsWith('--pr='));

    if (prArg) {
      return parseInt(prArg.split('=')[1], 10);
    }

    // Auto-detect PR from current branch
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
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

  private loadConfig(): Config {
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

  private ghApi(endpoint: string): any {
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
        console.log(`   1. PR #${this.prNumber} does not exist in repository ${this.owner}/${this.repo}`);
        console.log('   2. Repository is private and you have no access');
        console.log('\n💡 Solutions:');
        console.log(
          `   - Check if PR exists: https://github.com/${this.owner}/${this.repo}/pull/${this.prNumber}`
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

  private async fetchReviewComments(): Promise<GitHubComment[]> {
    console.log('💬 Fetching review comments...');
    
    // Use GraphQL API via gh CLI to get resolved status and PR info
    const graphqlQuery = `
      query($owner: String!, $repo: String!, $prNumber: Int!) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $prNumber) {
            title
            author {
              login
            }
            reviewThreads(first: 100) {
              nodes {
                isResolved
                comments(first: 100) {
                  nodes {
                    id
                    body
                    author {
                      login
                    }
                    createdAt
                    updatedAt
                    path
                    line
                    originalLine
                    diffHunk
                    replyTo {
                      id
                    }
                    url
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      // Try GraphQL API first to get resolved status
      // Use spawnSync to avoid command injection
      const result = spawnSync('gh', [
        'api', 'graphql',
        '-f', `query=${graphqlQuery}`,
        '-F', `owner=${this.owner}`,
        '-F', `repo=${this.repo}`,
        '-F', `prNumber=${this.prNumber}`
      ], {
        encoding: 'utf-8'
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        console.log('⚠️ GraphQL API error, falling back to REST API...');
        throw new Error('GraphQL error');
      }
      
      const graphqlData: any = JSON.parse(result.stdout);
      
      if (graphqlData.errors) {
        console.log('⚠️ GraphQL API error, falling back to REST API...');
        throw new Error('GraphQL error');
      }

      // Extract PR title and author
      const pullRequest = graphqlData.data?.repository?.pullRequest;
      if (pullRequest) {
        this.prTitle = pullRequest.title || '';
        this.prAuthor = pullRequest.author?.login || '';
      }

      const threads = pullRequest?.reviewThreads?.nodes || [];
      const comments: GitHubComment[] = [];

      for (const thread of threads) {
        const isResolved = thread.isResolved;
        for (const comment of thread.comments.nodes) {
          // Extract numeric ID from URL
          const urlMatch = comment.url.match(/discussion_r(\d+)/);
          const numericId = urlMatch ? parseInt(urlMatch[1], 10) : 0;

          comments.push({
            id: numericId || Date.now() + Math.random(),
            body: comment.body,
            user: { login: comment.author?.login || 'unknown' },
            created_at: comment.createdAt,
            updated_at: comment.updatedAt,
            path: comment.path,
            line: comment.line,
            original_line: comment.originalLine,
            diff_hunk: comment.diffHunk,
            in_reply_to_id: comment.replyTo ? (comment.replyTo.url?.match(/discussion_r(\d+)/)?.[1] ? parseInt(comment.replyTo.url.match(/discussion_r(\d+)/)![1], 10) : undefined) : undefined,
            html_url: comment.url,
            resolved: isResolved
          });
        }
      }

      if (comments.length > 0) {
        return comments;
      }

      throw new Error('No comments found in GraphQL response');
    } catch (error) {
      // Fallback to REST API (without resolved status)
      console.log('⚠️ Using REST API (resolved status will be unavailable)...');
      
      // Try to fetch PR info from REST API as fallback
      try {
        const prInfo = this.ghApi(`/repos/${this.owner}/${this.repo}/pulls/${this.prNumber}`);
        this.prTitle = prInfo.title || '';
        this.prAuthor = prInfo.user?.login || '';
      } catch (e) {
        // If we can't get PR info, that's OK - we'll just not show it
      }
      
      const comments = this.ghApi(`/repos/${this.owner}/${this.repo}/pulls/${this.prNumber}/comments`);
      return comments.map((c: any) => ({ ...c, resolved: false }));
    }
  }

  private async fetchIssueComments(): Promise<IssueComment[]> {
    console.log('💬 Fetching issue comments...');
    return this.ghApi(`/repos/${this.owner}/${this.repo}/issues/${this.prNumber}/comments`);
  }

  private groupComments(reviewComments: GitHubComment[], issueComments: IssueComment[]): {
    grouped: GroupedComment[];
    stats: { total: number; resolved: number; unresolved: number };
  } {
    const grouped = new Map<string, GroupedComment>();
    
    // Count statistics
    const resolvedCount = reviewComments.filter((c) => c.resolved === true).length;
    const unresolvedCount = reviewComments.filter((c) => c.resolved !== true).length;
    const totalCount = reviewComments.length;

    // Group ALL review comments (both resolved and unresolved)
    for (const comment of reviewComments) {
      const key = `${comment.path || 'general'}:${comment.line || 0}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          file: comment.path || 'general',
          line: comment.line || comment.original_line || null,
          comments: []
        });
      }

      grouped.get(key)!.comments.push({
        author: comment.user.login,
        body: comment.body,
        created_at: comment.created_at,
        url: comment.html_url,
        diff_hunk: comment.diff_hunk,
        resolved: comment.resolved === true
      });
    }

    // Add issue comments (general PR comments) - these are never resolved
    if (issueComments.length > 0) {
      const generalKey = 'general:0';
      if (!grouped.has(generalKey)) {
        grouped.set(generalKey, {
          file: 'general',
          line: null,
          comments: []
        });
      }

      for (const comment of issueComments) {
        grouped.get(generalKey)!.comments.push({
          author: comment.user.login,
          body: comment.body,
          created_at: comment.created_at,
          url: comment.html_url,
          resolved: false // Issue comments are never resolved
        });
      }
    }

    return {
      grouped: Array.from(grouped.values()),
      stats: {
        total: totalCount + issueComments.length,
        resolved: resolvedCount,
        unresolved: unresolvedCount + issueComments.length
      }
    };
  }

  private generateMarkdown(groupedComments: GroupedComment[], stats: { total: number; resolved: number; unresolved: number }): string {
    const prUrl = `https://github.com/${this.owner}/${this.repo}/pull/${this.prNumber}`;
    const fileComments = groupedComments.filter((g) => g.file !== 'general');
    const percentage = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
    
    // Calculate progress bar
    const progressBarLength = 20;
    const filledLength = Math.round((stats.resolved / stats.total) * progressBarLength);
    const emptyLength = progressBarLength - filledLength;
    const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

    let markdown = `# PR #${this.prNumber} - Comments Status\n\n`;
    
    // PR Title and Author (if available)
    if (this.prTitle) {
      markdown += `## 📌 ${this.prTitle}\n\n`;
    }
    if (this.prAuthor) {
      markdown += `**Author:** @${this.prAuthor}\n\n`;
    }
    
    markdown += `**PR Link:** [${this.owner}/${this.repo}#${this.prNumber}](${prUrl})\n\n`;
    markdown += `**Fetched at:** ${new Date().toLocaleString('en-US')}\n\n`;
    
    // Statistics section
    markdown += `## 📊 Comments Statistics\n\n`;
    markdown += `| Status | Count |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| ✅ **Resolved** | ${stats.resolved} |\n`;
    markdown += `| ⏳ **Unresolved** | ${stats.unresolved} |\n`;
    markdown += `| 📋 **Total** | ${stats.total} |\n\n`;
    markdown += `**Progress:** ${stats.resolved}/${stats.total} (${percentage}%)  \n`;
    markdown += `\`${progressBar}\` ${percentage}%\n\n`;
    markdown += `---\n\n`;
    
    // Important note for Cursor AI
    markdown += `> ⚠️  **IMPORTANT FOR CURSOR AI:** Work only with **UNRESOLVED** comments (marked with ⏳). Resolved comments (✅) are shown for reference only.\n\n`;
    markdown += `---\n\n`;

    // QUICK START PROMPT - for quick use
    markdown += `## 🚀 QUICK START PROMPT\n\n`;
    markdown += `> **Copy and paste into Cursor:**\n\n`;
    markdown += `\`\`\`\n`;
    markdown += `Read this entire file and help me resolve all ${stats.unresolved} unresolved comments from this PR.\n`;
    markdown += `For each UNRESOLVED comment (marked with ⏳):\n`;
    markdown += `1. Open the specified file\n`;
    markdown += `2. Find the appropriate line/section\n`;
    markdown += `3. Propose and implement a specific change\n`;
    markdown += `4. Explain what you did and why\n\n`;
    markdown += `⚠️  IMPORTANT: Only work with UNRESOLVED comments (⏳). Ignore resolved comments (✅) - they are shown for reference only.\n\n`;
    markdown += `Start with the first unresolved comment and go through all of them sequentially.\n`;
    markdown += `\`\`\`\n\n`;
    markdown += `---\n\n`;

    // AI INSTRUCTIONS SECTION
    markdown += `## 🤖 AI INSTRUCTIONS (Cursor)\n\n`;
    markdown += `> **Start here!** This is an automatically generated file with comments from a Pull Request.\n`;
    markdown += `> Your task is to help me resolve all **UNRESOLVED** comments below (marked with ⏳).\n\n`;

    markdown += `### 📋 Task:\n\n`;
    markdown += `1. **Analyze all ${stats.unresolved} UNRESOLVED comments** below (marked with ⏳)\n`;
    markdown += `2. **Ignore RESOLVED comments** (marked with ✅) - they are shown for reference only\n`;
    markdown += `3. **For each UNRESOLVED comment:**\n`;
    markdown += `   - Open the appropriate file in the project\n`;
    markdown += `   - Find the specified line/section of code\n`;
    markdown += `   - Propose a specific change that addresses the comment\n`;
    markdown += `   - Use the file editing tool\n`;
    markdown += `3. **After each change** mark it in the checklist at the end of the document\n`;
    markdown += `4. **Priority:** Start with code comments (section "📝 Code Comments")\n\n`;

    markdown += `### 🎯 Response format:\n\n`;
    markdown += `For each comment, explain:\n`;
    markdown += `- **What you found** in the code\n`;
    markdown += `- **What change you propose**\n`;
    markdown += `- **Why** this solves the comment\n\n`;

    markdown += `### ⚠️ Important rules:\n\n`;
    markdown += `- Read comments carefully and understand the reviewer's intent\n`;
    markdown += `- If something is unclear - ask me before making changes\n`;
    markdown += `- Maintain existing code style and project conventions\n`;
    markdown += `- After each change, explain what you did\n\n`;

    markdown += `### 🚀 Ready? Start with the first comment!\n\n`;
    markdown += `---\n\n`;

    // General comments first
    const generalComments = groupedComments.filter((g) => g.file === 'general');
    if (generalComments.length > 0) {
      markdown += `## 💬 General PR comments\n\n`;

      for (const group of generalComments) {
        for (const comment of group.comments) {
          // Issue comments are always unresolved (resolved field is false)
          const statusIcon = comment.resolved ? '✅ **RESOLVED**' : '⏳ **UNRESOLVED**';
          markdown += `${statusIcon}  \n`;
          markdown += `### 👤 ${comment.author}\n\n`;
          markdown += `**Date:** ${new Date(comment.created_at).toLocaleString('en-US')}\n\n`;
          markdown += `${comment.body}\n\n`;
          markdown += `[🔗 Comment link](${comment.url})\n\n`;
          markdown += `---\n\n`;
        }
      }
    }

    // File-related comments
    if (fileComments.length > 0) {
      markdown += `## 📝 Code comments\n\n`;

      // Group by files
      const byFile = new Map<string, GroupedComment[]>();
      for (const group of fileComments) {
        if (!byFile.has(group.file)) {
          byFile.set(group.file, []);
        }
        byFile.get(group.file)!.push(group);
      }

      // Sort files alphabetically
      const sortedFiles = Array.from(byFile.keys()).sort();

      for (const file of sortedFiles) {
        markdown += `### 📄 \`${file}\`\n\n`;

        const groups = byFile.get(file)!;
        // Sort by line
        groups.sort((a, b) => (a.line || 0) - (b.line || 0));

        for (const group of groups) {
          if (group.line) {
            markdown += `#### Line ${group.line}\n\n`;
          }

          for (const comment of group.comments) {
            // Add status icon
            const statusIcon = comment.resolved ? '✅ **RESOLVED**' : '⏳ **UNRESOLVED**';
            
            if (comment.diff_hunk) {
              markdown += `**Code context:**\n\`\`\`diff\n${comment.diff_hunk}\n\`\`\`\n\n`;
            }

            markdown += `${statusIcon}  \n`;
            markdown += `**${comment.author}** (${new Date(comment.created_at).toLocaleString('en-US')}):\n\n`;
            markdown += `${comment.body}\n\n`;
            markdown += `[🔗 Link](${comment.url})\n\n`;
            markdown += `---\n\n`;
          }
        }
      }
    }

    // Add TODO section for Cursor - only unresolved comments
    markdown += `## ✅ Checklist (Unresolved Comments Only)\n\n`;
    markdown += `<!-- Use this in Cursor to track progress - only unresolved comments are listed -->\n\n`;

    for (const group of fileComments) {
      for (const comment of group.comments) {
        // Only include unresolved comments in checklist
        if (!comment.resolved) {
          const lineInfo = group.line ? ` (line ${group.line})` : '';
          markdown += `- [ ] ⏳ \`${group.file}\`${lineInfo} - @${comment.author}\n`;
        }
      }
    }
    
    // Show resolved comments separately (for reference)
    const resolvedCommentsInFiles = fileComments.flatMap(g => 
      g.comments.filter(c => c.resolved).map(c => ({ group: g, comment: c }))
    );
    
    if (resolvedCommentsInFiles.length > 0) {
      markdown += `\n---\n\n`;
      markdown += `## ✅ Resolved Comments (Reference Only)\n\n`;
      markdown += `<!-- These comments are already resolved - no action needed -->\n\n`;
      
      for (const { group, comment } of resolvedCommentsInFiles) {
        const lineInfo = group.line ? ` (line ${group.line})` : '';
        markdown += `- [x] ✅ \`${group.file}\`${lineInfo} - @${comment.author}\n`;
      }
    }

    // Add additional rules information if configured
    if (this.config.additionalRules && this.config.additionalRules.length > 0) {
      markdown += `\n---\n\n`;
      markdown += `## 📚 Additional Team Rules\n\n`;
      markdown += `When resolving PR comments, please also consider these additional rule files:\n\n`;
      
      for (const rulePath of this.config.additionalRules) {
        const fullPath = path.isAbsolute(rulePath) 
          ? rulePath 
          : path.join(process.cwd(), rulePath);
        
        if (fs.existsSync(fullPath)) {
          markdown += `- \`${rulePath}\` (Cursor will read this automatically)\n`;
        } else {
          markdown += `- ⚠️ \`${rulePath}\` (file not found - please check the path)\n`;
        }
      }
      
      markdown += `\n**Note:** Cursor will automatically read these rule files when resolving comments. Make sure to reference them for coding standards, testing requirements, or security guidelines.\n`;
    }

    return markdown;
  }

  private generateJSON(groupedComments: GroupedComment[]): string {
    const data = {
      pr_number: this.prNumber,
      repository: `${this.owner}/${this.repo}`,
      fetched_at: new Date().toISOString(),
      total_comments: groupedComments.reduce((sum, g) => sum + g.comments.length, 0),
      comments: groupedComments
    };

    return JSON.stringify(data, null, 2);
  }

  public async fetchAndSave(): Promise<void> {
    try {
      console.log('\n🔄 Fetching FRESH data from GitHub (no cache)...');
      console.log(`⏰ Timestamp: ${new Date().toLocaleString('en-US')}\n`);
      
      // Log additional rules from user's config
      if (this.config.additionalRules && this.config.additionalRules.length > 0) {
        console.log('📚 Loading additional rules from your config:');
        for (const rulePath of this.config.additionalRules) {
          const fullPath = path.isAbsolute(rulePath) 
            ? rulePath 
            : path.join(process.cwd(), rulePath);
          
          if (fs.existsSync(fullPath)) {
            console.log(`   ✅ ${rulePath} (found)`);
          } else {
            console.log(`   ⚠️  ${rulePath} (not found - will show warning in output)`);
          }
        }
        console.log('');
      }
      
      const [reviewComments, issueComments] = await Promise.all([
        this.fetchReviewComments(),
        this.fetchIssueComments()
      ]);

      console.log(`\n✅ Fetched ${reviewComments.length} review comments`);
      console.log(`✅ Fetched ${issueComments.length} issue comments`);

      // Group all comments and get statistics
      const { grouped, stats } = this.groupComments(reviewComments, issueComments);
      const groupedComments = grouped;

      if (stats.unresolved === 0) {
        console.log('\n📭 No unresolved comments in this PR!');
        if (stats.resolved > 0) {
          console.log(`   ✅ All ${stats.resolved} comment(s) are already resolved!`);
        }
        console.log(`\n🔗 Check PR: https://github.com/${this.owner}/${this.repo}/pull/${this.prNumber}\n`);
        return;
      }

      // Show statistics
      const percentage = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;
      
      // Calculate progress bar for console
      const progressBarLength = 20;
      const filledLength = Math.round((stats.resolved / stats.total) * progressBarLength);
      const emptyLength = progressBarLength - filledLength;
      const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
      
      console.log(`\n📊 Comments Statistics:`);
      console.log(`   ✅ Resolved: ${stats.resolved}`);
      console.log(`   ⏳ Unresolved: ${stats.unresolved}`);
      console.log(`   📋 Total: ${stats.total}`);
      console.log(`   📈 Progress: ${stats.resolved}/${stats.total} (${percentage}%)`);
      console.log(`   ${progressBar} ${percentage}%`);

      // Check various possible output locations (for compatibility)
      const possibleOutputDirs = [
        path.join(process.cwd(), '.pr-cleaner-ai-output'), // For npm package (hidden folder)
        path.join(process.cwd(), 'pr-cleaner-ai-output') // For npm package (visible folder)
      ];

      // Choose first existing folder, or create new one
      let outputDir: string | null = null;
      for (const dir of possibleOutputDirs) {
        if (fs.existsSync(dir)) {
          outputDir = dir;
          break;
        }
      }

      // If none exists, use .pr-cleaner-ai-output (best for npm package)
      if (!outputDir) {
        outputDir = path.join(process.cwd(), '.pr-cleaner-ai-output');
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Check if .gitignore has the output directory (optional warning)
      try {
        const gitignorePath = path.join(process.cwd(), '.gitignore');
        if (fs.existsSync(gitignorePath)) {
          const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
          const outputDirName = path.basename(outputDir);
          const isGitignored = gitignoreContent.includes(outputDirName) || 
                              gitignoreContent.includes('.pr-cleaner-ai-output');
          
          if (!isGitignored) {
            console.log('\n⚠️  Note: Output files may appear in Git. To ignore them, run:');
            console.log('   npx pr-cleaner-ai init\n');
          }
        }
      } catch {
        // Ignore errors - this is just a helpful warning
      }

      // Save markdown
      const markdownPath = path.join(outputDir, `pr-${this.prNumber}-comments.md`);
      
      // Check if file exists and notify about overwrite
      const markdownExists = fs.existsSync(markdownPath);
      if (markdownExists) {
        console.log(`\n🔄 Overwriting existing file with fresh data...`);
      }
      
      const markdown = this.generateMarkdown(groupedComments, stats);
      fs.writeFileSync(markdownPath, markdown, 'utf-8');
      console.log(`\n📝 ${markdownExists ? 'Updated' : 'Saved'} markdown: ${markdownPath}`);

      // Save JSON
      const jsonPath = path.join(outputDir, `pr-${this.prNumber}-comments.json`);
      const json = this.generateJSON(groupedComments);
      fs.writeFileSync(jsonPath, json, 'utf-8');
      console.log(`📝 ${markdownExists ? 'Updated' : 'Saved'} JSON: ${jsonPath}`);

      console.log('\n✨ Done! You can now open the files in Cursor.\n');
      console.log(
        '💡 Suggestion: Open the markdown file in Cursor and use the prompt from "QUICK START PROMPT" section.'
      );
    } catch (error) {
      console.error('\n❌ Error while fetching comments:', error);
      console.log('\n📚 Need help? See documentation:');
      console.log('   - README.md');
      console.log('   - Check requirements: pr-cleaner-ai check\n');
      process.exit(1);
    }
  }
}

// Run script
const fetcher = new PRCommentsFetcher();
fetcher.fetchAndSave();
