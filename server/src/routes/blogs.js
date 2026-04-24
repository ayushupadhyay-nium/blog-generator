import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import {
  getBlogs, getBlogById, createBlog, updateBlog, deleteBlog
} from '../db/index.js'
import { buildHtmlPage } from '../modules/htmlExport.js'
import { getImages } from '../db/index.js'

const router = Router()

// GET /api/blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await getBlogs()
    res.json(blogs.sort((a, b) => b.updatedAt - a.updatedAt))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/blogs
router.post('/', async (req, res) => {
  try {
    const { title = 'Untitled Blog', idea = '' } = req.body
    const blog = {
      id: uuidv4(),
      title,
      idea,
      status: 'draft',
      contentJson: null,
      contentHtml: null,
      seoOutputs: null,
      toneReport: null,
      strictMode: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    const created = await createBlog(blog)
    res.status(201).json(created)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/blogs/:id
router.get('/:id', async (req, res) => {
  try {
    const blog = await getBlogById(req.params.id)
    if (!blog) return res.status(404).json({ error: 'Blog not found' })
    res.json(blog)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/blogs/:id
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['title', 'idea', 'contentJson', 'contentHtml', 'status', 'strictMode']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }
    const updated = await updateBlog(req.params.id, updates)
    if (!updated) return res.status(404).json({ error: 'Blog not found' })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/blogs/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteBlog(req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Blog not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/blogs/:id/export
router.get('/:id/export', async (req, res) => {
  try {
    const blog = await getBlogById(req.params.id)
    if (!blog) return res.status(404).json({ error: 'Blog not found' })

    const images = await getImages(req.params.id)
    const html = buildHtmlPage(blog.title, blog.contentHtml || '', images)

    if (req.query.format === 'raw') {
      res.setHeader('Content-Type', 'text/html')
      res.setHeader('Content-Disposition', `attachment; filename="${blog.title.replace(/[^a-z0-9]/gi, '_')}.html"`)
      return res.send(html)
    }

    res.json({ html })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
