/**
 * Comments Service - handles fetching comments from GitHub
 */

import { spawnSync } from 'child_process';
import { GitHubComment, IssueComment, PRMetadata } from '../types';

export class CommentsService {
  private prTitle: string = '';
  private prAuthor: string = '';

  constructor(private metadata: PRMetadata) {}

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
      // Security: Validate metadata before API calls
      if (!this.metadata.owner || !this.metadata.repo || !this.metadata.prNumber) {
        throw new Error('Invalid metadata: owner, repo, and prNumber are required');
      }
      
      // Security: Validate owner/repo format (basic sanitization)
      if (!/^[a-zA-Z0-9._-]+$/.test(this.metadata.owner) || !/^[a-zA-Z0-9._-]+$/.test(this.metadata.repo)) {
        throw new Error('Invalid owner or repo format');
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
      throw new Error('Invalid metadata: owner, repo, and prNumber are required');
    }
    
    // Security: Build endpoint safely
    const issueCommentsEndpoint = `/repos/${this.metadata.owner}/${this.metadata.repo}/issues/${this.metadata.prNumber}/comments`;
    
    const result = spawnSync('gh', ['api', issueCommentsEndpoint, '--paginate'], {
      encoding: 'utf-8'
    });
    
    if (result.error || result.status !== 0) {
      throw new Error('Failed to fetch issue comments');
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

