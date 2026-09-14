import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '@/contexts/ThemeContext'

interface MarkdownRendererProps {
  content: string
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
  const { theme } = useTheme()
  const codeTheme = theme === 'dark' ? oneDark : oneLight

  const cleanContent = content
    .replace(/^---\s*\n.*?\n---\s*\n/s, '')
    .replace(/<[^>]*>/g, '')

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      disallowedElements={['script', 'style', 'iframe', 'object', 'embed']}
      unwrapDisallowed={true}
      components={{
        code: ({ className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '')
          const isInline = !match
          return !isInline ? (
            <SyntaxHighlighter
              style={codeTheme}
              language={match[1]}
              PreTag="div"
              className="my-4 overflow-hidden rounded-lg border border-border text-sm [&>div]:!m-0"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code
              className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
              {...props}
            >
              {children}
            </code>
          )
        },
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        p: ({ children }) => (
          <p className="mb-3 leading-relaxed text-foreground/90">
            {children}
          </p>
        ),
        table: ({ children }) => (
          <div className="my-4 overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted/50">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-border">{children}</tbody>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="whitespace-nowrap px-3 py-2 text-sm text-foreground">
            {children}
          </td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-2 border-primary/50 pl-4 italic text-muted-foreground">
            {children}
          </blockquote>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 ml-4 list-disc space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-4 list-decimal space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-sm leading-relaxed text-foreground/90">
            {children}
          </li>
        ),
        h1: ({ children }) => (
          <h1 className="mb-3 mt-4 text-2xl font-semibold tracking-tight text-foreground">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-4 text-lg font-semibold tracking-tight text-foreground">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-3 text-base font-semibold text-foreground">
            {children}
          </h3>
        ),
        hr: () => <hr className="my-4 border-border" />
      }}
    >
      {cleanContent}
    </ReactMarkdown>
  )
}

export default MarkdownRenderer
