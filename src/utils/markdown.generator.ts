/**
 * Markdown Generator - generates markdown output
 */

import * as fs from 'fs';
import * as path from 'path';
import { GroupedComment, CommentStatistics, Config } from '../types';

export class MarkdownGenerator {
  constructor(
    private prNumber: number,
    private owner: string,
    private repo: string,
    private prTitle: string,
    private prAuthor: string,
    private config: Config
  ) {}

  generate(groupedComments: GroupedComment[], stats: CommentStatistics): string {
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
}

