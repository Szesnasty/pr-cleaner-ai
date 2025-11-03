/**
 * Grouping Utility - groups comments by file and line
 */

import { GitHubComment, IssueComment, GroupedComment, CommentStatistics } from '../types';

export class GroupingUtil {
  /**
   * Group comments by file and line, calculate statistics
   */
  static groupComments(
    reviewComments: GitHubComment[],
    issueComments: IssueComment[]
  ): {
    grouped: GroupedComment[];
    stats: CommentStatistics;
  } {
    const grouped = new Map<string, GroupedComment>();
    
    // Count statistics (BEFORE filtering - we need to count all comments)
    const resolvedCount = reviewComments.filter((c) => c.resolved === true).length;
    const unresolvedCount = reviewComments.filter((c) => c.resolved !== true).length;
    const totalCount = reviewComments.length;

    // OPTIMIZATION: Group ONLY unresolved review comments (resolved ones are counted but not included)
    // This reduces context size for Cursor and makes output files smaller
    for (const comment of reviewComments) {
      // Skip resolved comments - we only count them for statistics
      if (comment.resolved === true) {
        continue;
      }

      const key = `${comment.path || 'general'}:${comment.line || 0}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          file: comment.path || 'general',
          line: comment.line || null,
          comments: []
        });
      }

      grouped.get(key)!.comments.push({
        author: comment.user.login,
        body: comment.body,
        created_at: comment.created_at,
        url: comment.html_url,
        diff_hunk: comment.diff_hunk,
        resolved: comment.resolved
      });
    }

    // Add issue comments to "general" section
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

  /**
   * Calculate statistics from comments
   */
  static calculateStats(
    reviewComments: GitHubComment[],
    issueComments: IssueComment[]
  ): CommentStatistics {
    const resolvedCount = reviewComments.filter((c) => c.resolved === true).length;
    const unresolvedCount = reviewComments.filter((c) => c.resolved !== true).length;
    const totalCount = reviewComments.length;

    return {
      total: totalCount + issueComments.length,
      resolved: resolvedCount,
      unresolved: unresolvedCount + issueComments.length
    };
  }
}

