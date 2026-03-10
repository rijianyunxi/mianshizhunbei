import { Link } from 'react-router-dom'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { MessageMarkdown } from '../components/MessageMarkdown'

const sample = [
  '# Markdown Sample',
  '',
  'Direct import vs lazy import.',
  '',
  '- Item 1',
  '- Item 2',
  '',
  '```ts',
  'function hello(name: string) {',
  "  return 'Hello ' + name",
  '}',
  '```',
  '',
].join('\n')

export default function BundleTestPage() {
  return (
    <div className="bundle-test">
      <header className="bundle-test-header">
        <div>
          <h1>Bundle Test</h1>
          <p>Compare direct import and lazy import.</p>
        </div>
        <Link className="bundle-test-link" to="/">
          Back to Chat
        </Link>
      </header>

      <div className="bundle-test-grid">
        <section className="bundle-test-card">
          <h2>Direct Import</h2>
          <MarkdownRenderer markdown={sample} />
        </section>
        <section className="bundle-test-card">
          <h2>Lazy Import</h2>
          <MessageMarkdown content={sample} />
        </section>
      </div>
    </div>
  )
}
