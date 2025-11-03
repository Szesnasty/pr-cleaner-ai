/**
 * Fetch Command - main command for fetching PR comments
 */

import { GitService } from '../services/git.service';
import { GitHubService } from '../services/github.service';
import { ConfigService } from '../services/config.service';
import { CommentsService } from '../services/comments.service';
import { GroupingUtil } from '../utils/grouping.util';
import { MarkdownGenerator } from '../utils/markdown.generator';
import { JSONGenerator } from '../utils/json.generator';
import { OutputUtil } from '../utils/output.util';
import { PRMetadata } from '../types';

export class FetchCommand {
  async execute(): Promise<void> {
    try {
      // Check authentication
      GitHubService.checkAuth();

      // Get repository information
      const remoteUrl = GitService.getRemoteUrl();
      const { owner, repo } = GitService.parseGitHubUrl(remoteUrl);

      // Get PR number
      const prNumber = GitHubService.getCurrentPRNumber();

      // Load config
      const config = ConfigService.load();

      console.log(`\n📋 Fetching comments for PR #${prNumber}`);
      console.log(`📦 Repository: ${owner}/${repo}`);

      console.log('\n🔄 Fetching FRESH data from GitHub (no cache)...');
      console.log(`⏰ Timestamp: ${new Date().toLocaleString('en-US')}\n`);
      
      // Log additional rules from user's config
      OutputUtil.logAdditionalRules(config);
      
      // Create metadata object
      const metadata: PRMetadata = {
        owner,
        repo,
        prNumber,
        prTitle: '',
        prAuthor: ''
      };

      // Fetch comments
      const commentsService = new CommentsService(metadata);
      const { reviewComments, issueComments } = await commentsService.fetchAllComments();

      console.log(`\n✅ Fetched ${reviewComments.length} review comments`);
      console.log(`✅ Fetched ${issueComments.length} issue comments`);

      // Group all comments and get statistics
      const { grouped, stats } = GroupingUtil.groupComments(reviewComments, issueComments);
      const groupedComments = grouped;

      // Check if no unresolved comments
      if (stats.unresolved === 0) {
        OutputUtil.handleNoUnresolvedComments(stats, owner, repo, prNumber);
        return;
      }

      // Show statistics
      OutputUtil.showStatistics(stats);

      // Ensure output directory exists
      const outputDir = OutputUtil.ensureOutputDir();

      // Get updated metadata with PR title and author
      const updatedMetadata = commentsService.getPRMetadata();

      // Generate markdown
      const markdownGenerator = new MarkdownGenerator(
        prNumber,
        owner,
        repo,
        updatedMetadata.prTitle,
        updatedMetadata.prAuthor,
        config
      );
      const markdown = markdownGenerator.generate(groupedComments, stats);

      // Generate JSON
      const json = JSONGenerator.generate(groupedComments, prNumber, owner, repo);

      // Save files
      OutputUtil.saveMarkdown(outputDir, prNumber, markdown);
      const markdownExists = true; // Already checked in saveMarkdown
      OutputUtil.saveJSON(outputDir, prNumber, json, markdownExists);

      // Show completion message
      OutputUtil.showCompletionMessage();
    } catch (error) {
      console.error('\n❌ Error while fetching comments:', error);
      console.log('\n📚 Need help? See documentation:');
      console.log('   - README.md');
      console.log('   - Check requirements: pr-cleaner-ai check\n');
      process.exit(1);
    }
  }
}

