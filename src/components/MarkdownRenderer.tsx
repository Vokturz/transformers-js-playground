import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
}

const MarkdownRenderer = ({ content }: MarkdownRendererProps) => {
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
              style={oneLight}
              language={match[1]}
              PreTag="div"
              className="rounded-md my-4 border border-r-2 text-sm"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code
              className="bg-gray-100 px-1 py-0.5 rounded-sm text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          )
        },
        a: ({ children, href }) => (
          <a
            href={href}
            className="text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="bg-white divide-y divide-gray-200">
            {children}
          </tbody>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border border-gray-300">
            {children}
          </td>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 ml-4 mb-4">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-sm text-gray-900">{children}</li>
        ),
        h1: ({ children }) => (
          <h1 className="text-xl font-semibold text-gray-900 mb-3 mt-4">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-gray-900 mb-2 mt-3">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold text-gray-900 mb-2 mt-3">
            {children}
          </h3>
        )
      }}
    >
      {cleanContent}
    </ReactMarkdown>
  )
}

export default MarkdownRenderer
