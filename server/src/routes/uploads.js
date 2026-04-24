import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { addSourceDoc, addImage, getImages, getSourceDocs, deleteSourceDoc } from '../db/index.js'
import { uploadSources, uploadProcessDoc, uploadImage, UPLOAD_ROOT_PATH } from '../modules/upload.js'
import { extractText } from '../modules/fileParser.js'

const router = Router({ mergeParams: true })

// POST /api/blogs/:blogId/upload/sources
router.post('/sources', (req, res) => {
  uploadSources(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' })

    try {
      const { type = 'past_blog' } = req.body // 'past_blog' | 'reference'
      const docs = await Promise.all(req.files.map(async (file) => {
        const doc = {
          id: uuidv4(),
          blogId: req.params.blogId,
          type,
          filename: file.originalname,
          filepath: file.path,
          extractedText: null,
          createdAt: Date.now()
        }
        return addSourceDoc(doc)
      }))
      res.status(201).json(docs)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
})

// POST /api/blogs/:blogId/upload/process
router.post('/process', (req, res) => {
  uploadProcessDoc(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    try {
      // Remove existing process doc for this blog
      const existing = await getSourceDocs(req.params.blogId)
      const existingProcess = existing.filter(d => d.type === 'process_doc')
      for (const d of existingProcess) await deleteSourceDoc(d.id)

      const doc = {
        id: uuidv4(),
        blogId: req.params.blogId,
        type: 'process_doc',
        filename: req.file.originalname,
        filepath: req.file.path,
        extractedText: null,
        createdAt: Date.now()
      }
      const saved = await addSourceDoc(doc)
      res.status(201).json(saved)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
})

// POST /api/blogs/:blogId/upload/image
router.post('/image', (req, res) => {
  uploadImage(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' })

    try {
      const imageId = uuidv4()
      const image = {
        id: imageId,
        blogId: req.params.blogId,
        filename: req.file.originalname,
        filepath: req.file.path,
        url: `/uploads/images/${req.params.blogId}/${req.file.filename}`,
        createdAt: Date.now()
      }
      const saved = await addImage(image)
      res.status(201).json(saved)
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })
})

// GET /api/blogs/:blogId/upload/sources
router.get('/sources', async (req, res) => {
  try {
    const docs = await getSourceDocs(req.params.blogId)
    res.json(docs.filter(d => d.type !== 'process_doc'))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/blogs/:blogId/upload/process
router.get('/process', async (req, res) => {
  try {
    const docs = await getSourceDocs(req.params.blogId)
    const proc = docs.find(d => d.type === 'process_doc')
    res.json(proc || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/blogs/:blogId/images
router.get('/images', async (req, res) => {
  try {
    const images = await getImages(req.params.blogId)
    res.json(images)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/blogs/:blogId/upload/url
// Fetches a URL, strips HTML, stores as a source doc
router.post('/url', async (req, res) => {
  const { url, type = 'past_blog' } = req.body
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'A valid http/https URL is required' })
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogGenerator/1.0)' },
      signal: AbortSignal.timeout(15000)
    })
    if (!response.ok) {
      return res.status(400).json({ error: `URL returned ${response.status} ${response.statusText}` })
    }

    const html = await response.text()
    const text = stripHtml(html)
    if (text.length < 50) {
      return res.status(400).json({ error: 'Could not extract meaningful text from that URL' })
    }

    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const slug = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)
    const filename = `${hostname}_${slug}.txt`

    const doc = {
      id: uuidv4(),
      blogId: req.params.blogId,
      type,
      filename,
      filepath: null,       // URL-sourced docs have no local file
      url,
      extractedText: text.slice(0, 100000), // store extracted text directly
      createdAt: Date.now()
    }
    const saved = await addSourceDoc(doc)
    res.status(201).json(saved)
  } catch (err) {
    if (err.name === 'TimeoutError') return res.status(400).json({ error: 'Request timed out fetching that URL' })
    res.status(500).json({ error: err.message })
  }
})

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// DELETE /api/blogs/:blogId/upload/source/:docId
router.delete('/source/:docId', async (req, res) => {
  try {
    await deleteSourceDoc(req.params.docId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
