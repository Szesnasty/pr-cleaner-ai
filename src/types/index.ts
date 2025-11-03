/**
 * Type definitions for pr-cleaner-ai
 */

export interface GitHubComment {
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

export interface IssueComment {
  id: number;
  body: string;
  user: {
    login: string;
  };
  created_at: string;
  html_url: string;
}

export interface GroupedComment {
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

export interface Config {
  autoFix?: boolean;
  additionalRules?: string[];
}

export interface PRMetadata {
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
}

export interface CommentStatistics {
  total: number;
  resolved: number;
  unresolved: number;
}

