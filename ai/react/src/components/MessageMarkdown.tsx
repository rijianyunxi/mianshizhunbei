import rehypeHighlight from 'rehype-highlight'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type MessageMarkdownProps = {
  content: string
  streaming?: boolean
}

function normalizeStreamingMarkdown(content: string): string {
  let normalized = content

  const fenceMatches = content.match(/```/g)
  const fenceCount = fenceMatches ? fenceMatches.length : 0

  if (fenceCount % 2 !== 0) {
    normalized = `${normalized}\n\`\`\``
  }

  return normalized
}

export function MessageMarkdown(props: MessageMarkdownProps) {
  const markdown = props.streaming ? normalizeStreamingMarkdown(props.content) : props.content

  return (
    <div className="message-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node, children, ...anchorProps }) => {
            void node
            return (
              <a {...anchorProps} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
