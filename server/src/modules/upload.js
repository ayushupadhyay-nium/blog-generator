import multer from 'multer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOAD_ROOT = join(__dirname, '../../uploads')

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function makeStorage(subdir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = join(UPLOAD_ROOT, subdir, req.params.blogId || '')
      ensureDir(dir)
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
      cb(null, `${Date.now()}_${safe}`)
    }
  })
}

const ALLOWED_DOC_TYPES = [
  'text/plain', 'text/markdown', 'application/octet-stream',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

function docFilter(req, file, cb) {
  const allowed = ALLOWED_DOC_TYPES.includes(file.mimetype) ||
    file.originalname.match(/\.(txt|md|markdown|docx)$/i)
  cb(null, !!allowed)
}

function imageFilter(req, file, cb) {
  cb(null, ALLOWED_IMAGE_TYPES.includes(file.mimetype))
}

export const uploadSources = multer({
  storage: makeStorage('sources'),
  fileFilter: docFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).array('files', 20)

export const uploadProcessDoc = multer({
  storage: makeStorage('process'),
  fileFilter: docFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('file')

export const uploadImage = multer({
  storage: makeStorage('images'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).single('image')

export const UPLOAD_ROOT_PATH = UPLOAD_ROOT
