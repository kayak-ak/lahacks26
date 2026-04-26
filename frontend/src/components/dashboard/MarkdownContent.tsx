import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

type MarkdownContentProps = {
  content: string;
  invert?: boolean;
};

export function MarkdownContent({ content, invert = false }: MarkdownContentProps) {
  return (
    <div className={cn(
      'prose prose-sm max-w-none',
      invert ? 'prose-invert' : 'prose-slate',
      'chat-markdown'
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="m-0 mb-2 last:mb-0 leading-relaxed">{children}</p>,
          h1: ({ children }) => <h1 className="m-0 mb-2 mt-3 first:mt-0 text-base font-bold">{children}</h1>,
          h2: ({ children }) => <h2 className="m-0 mb-2 mt-3 first:mt-0 text-sm font-bold">{children}</h2>,
          h3: ({ children }) => <h3 className="m-0 mb-1.5 mt-2 first:mt-0 text-sm font-semibold">{children}</h3>,
          ul: ({ children }) => <ul className="m-0 mb-2 ml-4 list-disc last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="m-0 mb-2 ml-4 list-decimal last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="m-0 pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="m-0 mb-2 pl-3 border-l-2 last:mb-0">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="rounded px-1 py-0.5 text-xs font-mono bg-black/10" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={cn(className, 'text-xs font-mono')} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="m-0 mb-2 rounded-lg bg-black/10 p-3 overflow-x-auto last:mb-0 text-xs">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="underline">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em>{children}</em>,
          hr: () => <hr className="my-2 border-0 border-t" />,
          table: ({ children }) => (
            <div className="mb-2 overflow-x-auto last:mb-0">
              <table className="text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border px-2 py-1 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border px-2 py-1">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}