#!/usr/bin/env tsx
/**
 * MDX Fixer - Automatically fix problematic patterns in MDX files
 * 
 * Fixes:
 * - ISO dates in table cells (2025-11-12 → Nov 12, 2025)
 * - HTML-like patterns (<$50 → Under $50, <2s → less than 2s)
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

interface Fix {
  file: string;
  changes: number;
}

const fixes: Fix[] = [];

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${parseInt(day)}, ${year}`;
}

function fixFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let inCodeBlock = false;
  let inTable = false;
  let changes = 0;
  
  const fixedLines = lines.map((line, lineIndex) => {
    let fixedLine = line;
    
    // Track code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    
    // Skip code blocks
    if (inCodeBlock) return line;
    
    // Track tables
    if (line.includes('|')) {
      inTable = true;
    } else if (inTable && !line.trim().startsWith('|')) {
      inTable = false;
    }
    
    // Fix ISO dates in table cells
    if (inTable) {
      const isoDatePattern = /(\|\s*)(\d{4}-\d{2}-\d{2})(\s*\|)/g;
      const newLine = fixedLine.replace(isoDatePattern, (match, prefix, date, suffix) => {
        changes++;
        return `${prefix}${formatDate(date)}${suffix}`;
      });
      if (newLine !== fixedLine) {
        fixedLine = newLine;
      }
    }
    
    // Fix HTML-like patterns outside tables
    if (!inTable) {
      // Fix <$X patterns
      const dollarPattern = /<\$(\d+)/g;
      fixedLine = fixedLine.replace(dollarPattern, (match, amount) => {
        changes++;
        return `Under $${amount}`;
      });
      
      // Fix <Xs patterns (time)
      const timePattern = /<(\d+)s/g;
      fixedLine = fixedLine.replace(timePattern, (match, num) => {
        changes++;
        return `less than ${num}s`;
      });
      
      // Fix <X% patterns
      const percentPattern = /<(\d+)%/g;
      fixedLine = fixedLine.replace(percentPattern, (match, num) => {
        changes++;
        return `under ${num}%`;
      });
      
      // Fix <X (generic numbers)
      const numberPattern = /([^\w])<(\d+)([^\d-])/g;
      fixedLine = fixedLine.replace(numberPattern, (match, before, num, after) => {
        changes++;
        return `${before}less than ${num}${after}`;
      });
    }
    
    return fixedLine;
  });
  
  if (changes > 0) {
    writeFileSync(filePath, fixedLines.join('\n'), 'utf-8');
    fixes.push({ file: filePath, changes });
  }
}

function walkDir(dir: string): void {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath);
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      fixFile(filePath);
    }
  });
}

// Main execution
const contentDir = join(process.cwd(), 'content');

console.log('🔧 Fixing MDX files...\n');

walkDir(contentDir);

if (fixes.length === 0) {
  console.log('✅ No changes needed!\n');
} else {
  console.log(`✅ Fixed ${fixes.length} file(s):\n`);
  
  fixes.forEach(fix => {
    console.log(`  📄 ${fix.file.replace(process.cwd(), '.')}`);
    console.log(`     ${fix.changes} change(s)\n`);
  });
  
  const totalChanges = fixes.reduce((sum, fix) => sum + fix.changes, 0);
  console.log(`\n✨ Total: ${totalChanges} change(s) applied\n`);
}
