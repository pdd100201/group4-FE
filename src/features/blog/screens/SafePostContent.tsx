import { createElement, useMemo, type ReactNode } from 'react'

const allowed = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr', 'a'])
const blocked = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'form', 'input', 'button', 'textarea', 'template', 'link', 'meta'])

// Build React nodes from a small presentation allowlist. Never inject source HTML or event/style attributes.
export function SafePostContent({ content }: { content: string }) {
  const nodes = useMemo(() => {
    const template = document.createElement('template')
    template.innerHTML = content
    const containsMarkup = Boolean(template.content.querySelector('*'))
    if (!containsMarkup) {
      const plainText = (template.content.textContent ?? '').trim()
      if (!plainText) return []
      return plainText.split(/\n\s*\n/).filter(Boolean).map((paragraph, paragraphIndex) => {
        const lines = paragraph.split(/\r?\n/)
        const children = lines.flatMap((line, lineIndex) => lineIndex === 0
          ? [line]
          : [createElement('br', { key: `break-${lineIndex}` }), line])
        return createElement('p', { key: `paragraph-${paragraphIndex}` }, children)
      })
    }
    const render = (node: Node, key: string, depth: number): ReactNode => {
      if (depth > 50) return null
      if (node.nodeType === Node.TEXT_NODE) return node.textContent
      if (!(node instanceof HTMLElement)) return null
      const tag = node.tagName.toLowerCase()
      if (blocked.has(tag)) return null
      const children = Array.from(node.childNodes).map((child, i) => render(child, `${key}-${i}`, depth + 1))
      if (!allowed.has(tag)) return createElement('span', { key }, children)
      if (tag === 'a') {
        const href = node.getAttribute('href') || ''
        try {
          const url = new URL(href, window.location.origin)
          if (url.protocol === 'https:' || url.protocol === 'http:') return createElement('a', { key, href: url.href, rel: 'noopener noreferrer' }, children)
        } catch { /* Invalid links are displayed as text. */ }
        return createElement('span', { key }, children)
      }
      return createElement(tag, { key }, tag === 'br' || tag === 'hr' ? undefined : children)
    }
    return Array.from(template.content.childNodes).map((node, i) => render(node, String(i), 0))
  }, [content])
  return <div className="blog-content">{nodes}</div>
}
