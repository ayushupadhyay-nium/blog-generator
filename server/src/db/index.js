import { JSONFilePreset } from 'lowdb/node'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '../../data/db.json')

const defaultData = {
  blogs: [],
  sourceDocuments: [],
  images: [],
  pipelineRuns: []
}

let db

export async function getDb() {
  if (!db) {
    db = await JSONFilePreset(DB_PATH, defaultData)
  }
  return db
}

export async function getBlogs() {
  const db = await getDb()
  return db.data.blogs.map(({ contentJson: _, contentHtml: __, toneReport: ___, ...b }) => b)
}

export async function getBlogById(id) {
  const db = await getDb()
  return db.data.blogs.find(b => b.id === id) ?? null
}

export async function createBlog(blog) {
  const db = await getDb()
  db.data.blogs.push(blog)
  await db.write()
  return blog
}

export async function updateBlog(id, updates) {
  const db = await getDb()
  const idx = db.data.blogs.findIndex(b => b.id === id)
  if (idx === -1) return null
  db.data.blogs[idx] = { ...db.data.blogs[idx], ...updates, updatedAt: Date.now() }
  await db.write()
  return db.data.blogs[idx]
}

export async function deleteBlog(id) {
  const db = await getDb()
  const before = db.data.blogs.length
  db.data.blogs = db.data.blogs.filter(b => b.id !== id)
  db.data.sourceDocuments = db.data.sourceDocuments.filter(d => d.blogId !== id)
  db.data.images = db.data.images.filter(i => i.blogId !== id)
  db.data.pipelineRuns = db.data.pipelineRuns.filter(r => r.blogId !== id)
  await db.write()
  return db.data.blogs.length < before
}

export async function getSourceDocs(blogId) {
  const db = await getDb()
  return db.data.sourceDocuments.filter(d => d.blogId === blogId)
}

export async function addSourceDoc(doc) {
  const db = await getDb()
  db.data.sourceDocuments.push(doc)
  await db.write()
  return doc
}

export async function deleteSourceDoc(id) {
  const db = await getDb()
  db.data.sourceDocuments = db.data.sourceDocuments.filter(d => d.id !== id)
  await db.write()
}

export async function getImages(blogId) {
  const db = await getDb()
  return db.data.images.filter(i => i.blogId === blogId)
}

export async function addImage(image) {
  const db = await getDb()
  db.data.images.push(image)
  await db.write()
  return image
}

export async function logPipelineRun(run) {
  const db = await getDb()
  db.data.pipelineRuns.push(run)
  await db.write()
}

export async function updatePipelineRun(id, updates) {
  const db = await getDb()
  const idx = db.data.pipelineRuns.findIndex(r => r.id === id)
  if (idx !== -1) {
    db.data.pipelineRuns[idx] = { ...db.data.pipelineRuns[idx], ...updates }
    await db.write()
  }
}

export async function getPipelineRun(id) {
  const db = await getDb()
  return db.data.pipelineRuns.find(r => r.id === id) ?? null
}
