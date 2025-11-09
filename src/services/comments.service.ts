/**
 * Comments Service - handles fetching comments from GitHub
 */

import { spawnSync } from 'child_process';
import { GitHubComment, IssueComment, PRMetadata } from '../types';

export class CommentsService {
  private prTitle: string = '';
  private prAuthor: string = '';

  constructor(private metadata: PRMetadata) { }

  async fetchReviewComments(): Promise<GitHubComment[]> {
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
      // Validate required metadata
      if (!this.metadata.owner || !this.metadata.repo || !this.metadata.prNumber) {
        throw new Error(
          `\n❌ Missing required metadata.\n\n` +
          `Please ensure you provide all of the following:\n` +
          `   • owner (e.g., "openai")\n` +
          `   • repo (e.g., "gpt-cli")\n` +
          `   • issue/PR number (e.g., 123)\n\n` +
          `💡 Example:\n` +
          `   gh issue view openai/gpt-cli#123\n`
        );
      }

      // 🛡️ Validate repository format (basic sanitization)
      if (
        !/^[a-zA-Z0-9._-]+$/.test(this.metadata.owner) ||
        !/^[a-zA-Z0-9._-]+$/.test(this.metadata.repo)
      ) {
        throw new Error(
          `\n❌ Invalid repository format.\n\n` +
          `Expected alphanumeric, '.', '_', or '-' only.\n` +
          `Got: "${this.metadata.owner}/${this.metadata.repo}"\n\n` +
          `💡 Example:\n` +
          `   openai/gpt-cli\n`
        );
      }

      // 🧩 Validate issue/PR number
      if (isNaN(Number(this.metadata.prNumber))) {
        throw new Error(
          `\n❌ Invalid issue/PR number format: "${this.metadata.prNumber}".\n\n` +
          `💡 Please use a numeric ID (e.g., 123).\n`
        );
      }


      // Try GraphQL API first to get resolved status
      // Security: Use array arguments with spawnSync to prevent injection
      const result = spawnSync('gh', [
        'api', 'graphql',
        '-f', `query=${graphqlQuery}`,
        '-F', `owner=${this.metadata.owner}`,
        '-F', `repo=${this.metadata.repo}`,
        '-F', `prNumber=${this.metadata.prNumber}`
      ], {
        encoding: 'utf-8'
      });

      // Detailed error handling
      if (result.status !== 0 || result.error) {
        const stderr = result.stderr || '';

        if (stderr.includes('404')) {
          throw new Error(
            `\n❌ Issue/PR #${this.metadata.prNumber} not found.\n\n` +
            `💡 Possible causes:\n` +
            `   • The issue/PR number does not exist in ${this.metadata.owner}/${this.metadata.repo}\n` +
            `   • You may not have permission to access it\n\n` +
            `💡 Solutions:\n` +
            `   - Check if the issue/PR exists: https://github.com/${this.metadata.owner}/${this.metadata.repo}/issues/${this.metadata.prNumber}\n` +
            `   - Ensure you have access or are authenticated properly\n`
          );
        }

        if (stderr.includes('authentication') || stderr.includes('unauthorized')) {
          throw new Error(
            `\n🔒 Authentication error.\n\n` +
            `💡 Please ensure you are logged in with GitHub CLI:\n` +
            `   gh auth login\n`
          );
        }

        if (stderr.includes('network') || stderr.includes('ENOTFOUND')) {
          throw new Error(
            `\n🌐 Network error.\n\n` +
            `💡 Check your internet connection and try again.\n`
          );
        }

        throw new Error(
          `\n⚠️ Failed to fetch issue comments.\n\n` +
          `💡 Details: ${stderr.trim() || result.error?.message || 'Unknown error occurred.'}\n`
        );
      }

      const graphqlData = JSON.parse(result.stdout);


      // Extract PR title and author
      const pullRequest = graphqlData.data?.repository?.pullRequest;
      if (pullRequest) {
        this.prTitle = pullRequest.title || '';
        this.prAuthor = pullRequest.author?.login || '';
        this.metadata.prTitle = this.prTitle;
        this.metadata.prAuthor = this.prAuthor;
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

      // Security: Build endpoint safely (owner/repo already validated)
      const prEndpoint = `/repos/${this.metadata.owner}/${this.metadata.repo}/pulls/${this.metadata.prNumber}`;

      // Try to fetch PR info from REST API as fallback
      try {
        // Security: Use spawnSync with validated endpoint
        const result = spawnSync('gh', ['api', prEndpoint, '--paginate'], {
          encoding: 'utf-8'
        });
        if (result.status === 0) {
          const prInfo = JSON.parse(result.stdout);
          this.prTitle = prInfo.title || '';
          this.prAuthor = prInfo.user?.login || '';
          this.metadata.prTitle = this.prTitle;
          this.metadata.prAuthor = this.prAuthor;
        }
      } catch (e) {
        // If we can't get PR info, that's OK - we'll just not show it
      }

      // Security: Build comments endpoint safely
      const commentsEndpoint = `/repos/${this.metadata.owner}/${this.metadata.repo}/pulls/${this.metadata.prNumber}/comments`;

      const result = spawnSync('gh', ['api', commentsEndpoint, '--paginate'], {
        encoding: 'utf-8'
      });

      if (result.error || result.status !== 0) {
        throw new Error('Failed to fetch comments from REST API');
      }

      const comments = JSON.parse(result.stdout);
      return comments.map((c: any) => ({ ...c, resolved: false }));
    }
  }

  async fetchIssueComments(): Promise<IssueComment[]> {
    console.log('💬 Fetching issue comments...');

    // Security: Validate metadata
    if (!this.metadata.owner || !this.metadata.repo || !this.metadata.prNumber) {
      throw new Error(
        `\n❌ Missing required metadata.\n\n` +
        `Please ensure you provide all of the following:\n` +
        `   • owner (e.g., "openai")\n` +
        `   • repo (e.g., "gpt-cli")\n` +
        `   • issue/PR number (e.g., 123)\n\n` +
        `💡 Example:\n` +
        `   gh issue view openai/gpt-cli#123\n`
      );
    }

    // 🛡️ Validate repository format (basic sanitization)
    if (
      !/^[a-zA-Z0-9._-]+$/.test(this.metadata.owner) ||
      !/^[a-zA-Z0-9._-]+$/.test(this.metadata.repo)
    ) {
      throw new Error(
        `\n❌ Invalid repository format.\n\n` +
        `Expected alphanumeric, '.', '_', or '-' only.\n` +
        `Got: "${this.metadata.owner}/${this.metadata.repo}"\n\n` +
        `💡 Example:\n` +
        `   openai/gpt-cli\n`
      );
    }

    // 🧩 Validate issue/PR number
    if (isNaN(Number(this.metadata.prNumber))) {
      throw new Error(
        `\n❌ Invalid issue/PR number format: "${this.metadata.prNumber}".\n\n` +
        `💡 Please use a numeric ID (e.g., 123).\n`
      );
    }


    // Security: Build endpoint safely
    const issueCommentsEndpoint = `/repos/${this.metadata.owner}/${this.metadata.repo}/issues/${this.metadata.prNumber}/comments`;

    const result = spawnSync('gh', ['api', issueCommentsEndpoint, '--paginate'], {
      encoding: 'utf-8'
    });

    // Detailed error handling
    if (result.status !== 0 || result.error) {
      const stderr = result.stderr || '';

      if (stderr.includes('404')) {
        throw new Error(
          `\n❌ Issue/PR #${this.metadata.prNumber} not found.\n\n` +
          `💡 Possible causes:\n` +
          `   • The issue/PR number does not exist in ${this.metadata.owner}/${this.metadata.repo}\n` +
          `   • You may not have permission to access it\n\n` +
          `💡 Solutions:\n` +
          `   - Check if the issue/PR exists: https://github.com/${this.metadata.owner}/${this.metadata.repo}/issues/${this.metadata.prNumber}\n` +
          `   - Ensure you have access or are authenticated properly\n`
        );
      }

      if (stderr.includes('authentication') || stderr.includes('unauthorized')) {
        throw new Error(
          `\n🔒 Authentication error.\n\n` +
          `💡 Please ensure you are logged in with GitHub CLI:\n` +
          `   gh auth login\n`
        );
      }

      if (stderr.includes('network') || stderr.includes('ENOTFOUND')) {
        throw new Error(
          `\n🌐 Network error.\n\n` +
          `💡 Check your internet connection and try again.\n`
        );
      }

      throw new Error(
        `\n⚠️ Failed to fetch issue comments.\n\n` +
        `💡 Details: ${stderr.trim() || result.error?.message || 'Unknown error occurred.'}\n`
      );
    }


    return JSON.parse(result.stdout);
  }

  async fetchAllComments(): Promise<{
    reviewComments: GitHubComment[];
    issueComments: IssueComment[];
  }> {
    const [reviewComments, issueComments] = await Promise.all([
      this.fetchReviewComments(),
      this.fetchIssueComments()
    ]);
    return { reviewComments, issueComments };
  }

  getPRMetadata(): PRMetadata {
    return this.metadata;
  }
}

