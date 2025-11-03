/**
 * JSON Generator - generates JSON output
 */

import { GroupedComment } from '../types';

export class JSONGenerator {
  /**
   * Generate JSON representation of comments
   */
  static generate(
    groupedComments: GroupedComment[],
    prNumber: number,
    owner: string,
    repo: string
  ): string {
    const data = {
      pr_number: prNumber,
      repository: `${owner}/${repo}`,
      fetched_at: new Date().toISOString(),
      total_comments: groupedComments.reduce((sum, g) => sum + g.comments.length, 0),
      comments: groupedComments
    };

    return JSON.stringify(data, null, 2);
  }
}

