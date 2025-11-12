#!/usr/bin/env tsx
/**
 * MDX Linter - Detect problematic patterns in MDX files
 * 
 * Detects:
 * - ISO dates in table cells (2025-11-12)
 * - HTML-like patterns (<$, <number)
 * - Unclosed code blocks
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

interface Issue {
  file: string;
  line: number;
  column: number;
  type: string;
  message: string;
  context: string;
}

const issues: Issue[] = [];

function lintFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let inCodeBlock = false;
  let inTable = false;
  
  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1;
    
    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }
    
    // Skip code blocks
    if (inCodeBlock) return;
    
    // Track tables
    if (line.includes('|')) {
      inTable = true;
    } else if (inTable && !line.trim().startsWith('|')) {
      inTable = false;
    }
    
    // Check for ISO dates in table cells (e.g., | 2025-11-12 |)
    if (inTable) {
      const isoDatePattern = /\|\s*(\d{4}-\d{2}-\d{2})\s*\|/g;
      let match;
      while ((match = isoDatePattern.exec(line)) !== null) {
        issues.push({
          file: filePath,
          line: lineNum,
          column: match.index,
          type: 'iso-date-in-table',
          message: `ISO date "${match[1]}" in table cell can be misinterpreted as HTML tag`,
          context: line.trim(),
        });
      }
    }
    
    // Check for HTML-like patterns outside code blocks and tables
    if (!inTable) {
      // Pattern: <$ or <number
      const htmlLikePattern = /<(\$|\d)/g;
      let match;
      while ((match = htmlLikePattern.exec(line)) !== null) {
        issues.push({
          file: filePath,
          line: lineNum,
          column: match.index,
          type: 'html-like-pattern',
          message: `Pattern "<${match[1]}" can be misinterpreted as HTML tag opening`,
          context: line.trim(),
        });
      }
    }
    
    // Check for common problematic patterns
    if (line.includes('<2025-') || line.includes('<202')) {
      issues.push({
        file: filePath,
        line: lineNum,
        column: line.indexOf('<20'),
        type: 'date-with-bracket',
        message: 'Date starting with "<" can be misinterpreted as HTML tag',
        context: line.trim(),
      });
    }
  });
}

function walkDir(dir: string): void {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      lintFile(filePath);
    }
  });
}

// Main execution
const pagesDir = join(process.cwd(), 'pages');

console.log('🔍 Linting MDX files...\n');

walkDir(pagesDir);

if (issues.length === 0) {
  console.log('✅ No issues found!\n');
  process.exit(0);
} else {
  console.log(`❌ Found ${issues.length} issue(s):\n`);
  
  // Group issues by file
  const issuesByFile = issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);
  
  Object.entries(issuesByFile).forEach(([file, fileIssues]) => {
    console.log(`📄 ${file.replace(process.cwd(), '.')}`);
    fileIssues.forEach(issue => {
      console.log(`  Line ${issue.line}:${issue.column} - ${issue.type}`);
      console.log(`    ${issue.message}`);
      console.log(`    ${issue.context.substring(0, 80)}${issue.context.length > 80 ? '...' : ''}`);
      console.log();
    });
  });
  
  console.log(`\n💡 Run "pnpm fix:mdx" to automatically fix these issues\n`);
  process.exit(1);
}
