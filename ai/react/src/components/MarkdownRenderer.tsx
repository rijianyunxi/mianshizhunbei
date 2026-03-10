import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

type MarkdownRendererProps = {
  markdown: string
}

export default function MarkdownRenderer(props: MarkdownRendererProps) {
  return (
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
      {props.markdown}
    </ReactMarkdown>
  )
}
