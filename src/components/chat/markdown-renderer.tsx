import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simple regex-based formatter for:
  // - **bold** or __bold__
  // - * bullet points
  // - Newlines
  
  const parseContent = (text: string) => {
    // Split by lines first
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
      let processedLine = line.trim();
      
      // Handle Bullet Points
      if (processedLine.startsWith('* ') || processedLine.startsWith('- ')) {
        const itemText = processedLine.substring(2);
        return (
          <li key={index} className="ml-4 list-disc mb-1">
            {renderBold(itemText)}
          </li>
        );
      }
      
      // Empty line
      if (processedLine === '') {
        return <div key={index} className="h-2" />;
      }
      
      // Regular paragraph line
      return <p key={index} className="mb-2 last:mb-0">{renderBold(processedLine)}</p>;
    });
  };

  const renderBold = (text: string) => {
    // Match **text** or __text__
    const parts = text.split(/(\*\*.*?\*\*|__.*?__)/g);
    return parts.map((part, i) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
        return <strong key={i} className="font-bold text-primary">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="markdown-content text-sm sm:text-base leading-relaxed">
      {parseContent(content)}
    </div>
  );
}