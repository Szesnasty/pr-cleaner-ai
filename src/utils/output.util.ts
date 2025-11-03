/**
 * Output Utility - handles file output operations
 */

import * as fs from 'fs';
import * as path from 'path';
import { Config, CommentStatistics } from '../types';

export class OutputUtil {
  /**
   * Log additional rules from config
   */
  static logAdditionalRules(config: Config): void {
    if (config.additionalRules && config.additionalRules.length > 0) {
      console.log('📚 Loading additional rules from your config:');
      for (const rulePath of config.additionalRules) {
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
  }

  /**
   * Show statistics in console
   */
  static showStatistics(stats: CommentStatistics): void {
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
  }

  /**
   * Ensure output directory exists and return its path
   */
  static ensureOutputDir(): string {
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

    return outputDir;
  }

  /**
   * Save markdown file
   */
  static saveMarkdown(outputDir: string, prNumber: number, markdown: string): void {
    const markdownPath = path.join(outputDir, `pr-${prNumber}-comments.md`);
    
    // Check if file exists and notify about overwrite
    const markdownExists = fs.existsSync(markdownPath);
    if (markdownExists) {
      console.log(`\n🔄 Overwriting existing file with fresh data...`);
    }
    
    fs.writeFileSync(markdownPath, markdown, 'utf-8');
    console.log(`\n📝 ${markdownExists ? 'Updated' : 'Saved'} markdown: ${markdownPath}`);
  }

  /**
   * Save JSON file
   */
  static saveJSON(outputDir: string, prNumber: number, json: string, markdownExists: boolean): void {
    const jsonPath = path.join(outputDir, `pr-${prNumber}-comments.json`);
    fs.writeFileSync(jsonPath, json, 'utf-8');
    console.log(`📝 ${markdownExists ? 'Updated' : 'Saved'} JSON: ${jsonPath}`);
  }

  /**
   * Show completion message
   */
  static showCompletionMessage(): void {
    console.log('\n✨ Done! You can now open the files in Cursor.\n');
    console.log(
      '💡 Suggestion: Open the markdown file in Cursor and use the prompt from "QUICK START PROMPT" section.'
    );
  }

  /**
   * Handle no unresolved comments case
   */
  static handleNoUnresolvedComments(stats: CommentStatistics, owner: string, repo: string, prNumber: number): void {
    console.log('\n📭 No unresolved comments in this PR!');
    if (stats.resolved > 0) {
      console.log(`   ✅ All ${stats.resolved} comment(s) are already resolved!`);
    }
    console.log(`\n🔗 Check PR: https://github.com/${owner}/${repo}/pull/${prNumber}\n`);
  }
}

