import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem', marginTop: '1rem' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: '0.75rem' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: '0.75rem' }}>{children}</h3>,
          p: ({ children }) => <p style={{ marginBottom: '0.75rem', lineHeight: '1.6' }}>{children}</p>,
          ul: ({ children }) => <ul style={{ marginLeft: '1.5rem', marginBottom: '0.75rem', listStyleType: 'disc' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ marginLeft: '1.5rem', marginBottom: '0.75rem', listStyleType: 'decimal' }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: '600' }}>{children}</strong>,
          code: ({ inline, children }) => 
            inline ? (
              <code style={{
                backgroundColor: 'rgba(0,0,0,0.1)',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                fontFamily: 'monospace',
                fontSize: '0.875em'
              }}>{children}</code>
            ) : (
              <code style={{ display: 'block', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto' }}>{children}</code>
            ),
          pre: ({ children }) => <pre style={{ marginBottom: '0.75rem', borderRadius: '0.5rem', overflow: 'hidden' }}>{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote style={{
              borderLeft: '4px solid rgba(0,0,0,0.2)',
              paddingLeft: '1rem',
              marginLeft: '0',
              marginBottom: '0.75rem',
              fontStyle: 'italic'
            }}>{children}</blockquote>
          ),
          table: ({ children }) => (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.75rem' }}>{children}</table>
          ),
          th: ({ children }) => (
            <th style={{ border: '1px solid rgba(0,0,0,0.2)', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.05)', textAlign: 'left' }}>{children}</th>
          ),
          td: ({ children }) => (
            <td style={{ border: '1px solid rgba(0,0,0,0.2)', padding: '0.5rem' }}>{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
