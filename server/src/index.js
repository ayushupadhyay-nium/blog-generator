import { config } from 'dotenv'
config({ override: true }) // override: true ensures .env always wins over shell env
import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync, existsSync } from 'fs'
import blogRoutes from './routes/blogs.js'
import generateRoutes from './routes/generate.js'
import uploadRoutes from './routes/uploads.js'
import settingsRoutes from './routes/settings.js'
import { getDb } from './db/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// Ensure data and upload directories exist
const dirs = [
  join(__dirname, '../data'),
  join(__dirname, '../uploads/sources'),
  join(__dirname, '../uploads/process'),
  join(__dirname, '../uploads/images')
]
dirs.forEach(d => { if (!existsSync(d)) mkdirSync(d, { recursive: true }) })

const app = express()

app.use(cors({ origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'] }))
app.use(express.json({ limit: '10mb' }))

// Serve uploaded images statically
app.use('/uploads', express.static(join(__dirname, '../uploads')))

// Routes
app.use('/api/blogs', blogRoutes)
app.use('/api/generate', generateRoutes)
app.use('/api/blogs/:blogId/upload', uploadRoutes)
app.use('/api/blogs/:blogId/images', (req, res, next) => {
  req.url = '/images'
  uploadRoutes(req, res, next)
})

app.use('/api/settings', settingsRoutes)

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: Date.now() }))

// Initialize DB then start
getDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Blog Generator API running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Failed to initialize DB:', err)
  process.exit(1)
})
