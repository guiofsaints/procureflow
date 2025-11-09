/**
 * MarkdownText Component
 *
 * Lightweight markdown renderer for agent messages.
 * Supports: **bold**, *italic*, `code`, lists, and line breaks.
 */

'use client';

import React from 'react';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export function MarkdownText({ content, className = '' }: MarkdownTextProps) {
  // Parse a single line for inline markdown (bold, italic, code)
  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remainingText = text;
    let key = 0;

    // Process bold (**text**)
    const boldRegex = /\*\*(.+?)\*\*/;
    while (boldRegex.test(remainingText)) {
      const match = boldRegex.exec(remainingText);
      if (match) {
        const beforeMatch = remainingText.substring(0, match.index);
        if (beforeMatch) {
          parts.push(
            <React.Fragment key={`text-${key++}`}>{beforeMatch}</React.Fragment>
          );
        }
        parts.push(<strong key={`bold-${key++}`}>{match[1]}</strong>);
        remainingText = remainingText.substring(match.index + match[0].length);
      }
    }

    // Process italic (*text*) - but not **
    const italicRegex = /(?<!\*)\*([^*]+?)\*(?!\*)/;
    let currentText = remainingText;
    remainingText = '';
    const tempParts: React.ReactNode[] = [];

    while (italicRegex.test(currentText)) {
      const match = italicRegex.exec(currentText);
      if (match) {
        const beforeMatch = currentText.substring(0, match.index);
        if (beforeMatch) {
          tempParts.push(
            <React.Fragment key={`text-${key++}`}>{beforeMatch}</React.Fragment>
          );
        }
        tempParts.push(<em key={`italic-${key++}`}>{match[1]}</em>);
        currentText = currentText.substring(match.index + match[0].length);
      }
    }

    if (tempParts.length > 0) {
      parts.push(...tempParts);
      if (currentText) {
        parts.push(
          <React.Fragment key={`text-${key++}`}>{currentText}</React.Fragment>
        );
      }
    } else {
      // No italic found, add remaining text
      if (remainingText) {
        parts.push(
          <React.Fragment key={`text-${key++}`}>{remainingText}</React.Fragment>
        );
      }
    }

    // Process code (`text`)
    const codeRegex = /`(.+?)`/;
    const finalParts: React.ReactNode[] = [];
    parts.forEach((part, index) => {
      if (typeof part === 'string') {
        let textRemaining = part;
        while (codeRegex.test(textRemaining)) {
          const match = codeRegex.exec(textRemaining);
          if (match) {
            const beforeMatch = textRemaining.substring(0, match.index);
            if (beforeMatch) {
              finalParts.push(
                <React.Fragment key={`text-${index}-${key++}`}>
                  {beforeMatch}
                </React.Fragment>
              );
            }
            finalParts.push(
              <code
                key={`code-${index}-${key++}`}
                className='rounded bg-muted-foreground/10 px-1 py-0.5 text-xs font-mono'
              >
                {match[1]}
              </code>
            );
            textRemaining = textRemaining.substring(
              match.index + match[0].length
            );
          }
        }
        if (textRemaining) {
          finalParts.push(
            <React.Fragment key={`text-${index}-${key++}`}>
              {textRemaining}
            </React.Fragment>
          );
        }
      } else {
        finalParts.push(part);
      }
    });

    return finalParts.length > 0 ? finalParts : [text];
  };

  // Split by line breaks and process each line
  const lines = content.split('\n');

  return (
    <div className={className}>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        // Check if line is a bullet point
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
          const listContent = trimmedLine.substring(2);
          return (
            <div key={`line-${index}`} className='flex gap-2 my-1'>
              <span>•</span>
              <span>{parseInlineMarkdown(listContent)}</span>
            </div>
          );
        }

        // Check if line is numbered list
        const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          return (
            <div key={`line-${index}`} className='flex gap-2 my-1'>
              <span>{numberedMatch[1]}.</span>
              <span>{parseInlineMarkdown(numberedMatch[2])}</span>
            </div>
          );
        }

        // Regular line
        return (
          <React.Fragment key={`line-${index}`}>
            {parseInlineMarkdown(line)}
            {index < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
