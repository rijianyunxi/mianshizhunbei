import { Suspense, lazy } from 'react'

const MarkdownRenderer = lazy(() => import('./MarkdownRenderer'))

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
      <Suspense fallback={<pre className="message-plain">{markdown}</pre>}>
        <MarkdownRenderer markdown={markdown} />
      </Suspense>
    </div>
  )
}
