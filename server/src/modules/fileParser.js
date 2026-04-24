import mammoth from 'mammoth'
import { marked } from 'marked'
import { readFile } from 'fs/promises'
import { extname } from 'path'

// Accepts a doc object (with optional pre-extracted text for URL sources)
// or a filepath + filename pair
export async function extractTextFromDoc(doc) {
  if (doc.extractedText) return doc.extractedText
  if (!doc.filepath) return ''
  return extractText(doc.filepath, doc.filename)
}

export async function extractText(filepath, filename) {
  const ext = extname(filename).toLowerCase()

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filepath })
    return result.value.trim()
  }

  const raw = await readFile(filepath, 'utf-8')

  if (ext === '.md' || ext === '.markdown') {
    const html = await marked(raw)
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  return raw.trim()
}

export function chunkText(text, maxChars = 8000) {
  if (text.length <= maxChars) return [text]
  const chunks = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxChars))
    i += maxChars
  }
  return chunks
}

export function truncateToTokenBudget(texts, maxChars = 60000) {
  const results = []
  let total = 0
  for (const t of texts) {
    if (total + t.length > maxChars) {
      const remaining = maxChars - total
      if (remaining > 200) results.push(t.slice(0, remaining) + '\n[truncated]')
      break
    }
    results.push(t)
    total += t.length
  }
  return results
}
