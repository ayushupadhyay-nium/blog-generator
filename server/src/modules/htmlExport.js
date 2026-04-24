import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'em', 'u', 's', 'code', 'pre',
  'ul', 'ol', 'li',
  'a', 'img',
  'blockquote', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span'
]

const ALLOWED_ATTRS = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'fetchpriority'],
  '*': ['class', 'id']
}

export function buildHtmlPage(title, bodyHtml, images = []) {
  // Rewrite image src paths to be absolute URLs
  let processedHtml = bodyHtml
  for (const img of images) {
    // Replace any blob or relative path with the server image URL
    processedHtml = processedHtml.replace(
      new RegExp(img.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      img.url
    )
  }

  const clean = sanitizeHtml(processedHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1a1a1a; line-height: 1.7; }
    h1 { font-size: 2.25rem; font-weight: 700; margin-top: 0; }
    h2 { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; }
    h3 { font-size: 1.25rem; font-weight: 600; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    blockquote { border-left: 4px solid #e5e7eb; margin: 1.5rem 0; padding: 0.5rem 1.5rem; color: #6b7280; }
    code { background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
    pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    a { color: #2563eb; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #e5e7eb; padding: 0.5rem 1rem; }
    th { background: #f9fafb; }
  </style>
</head>
<body>
${clean}
</body>
</html>`
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
