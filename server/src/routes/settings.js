import { Router } from 'express'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { PROVIDERS } from '../modules/llmClient.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ENV_PATH = join(__dirname, '../../.env')

const router = Router()

function readEnv() {
  try { return readFileSync(ENV_PATH, 'utf-8') } catch { return '' }
}

function writeEnvKey(key, value) {
  let content = readEnv()
  if (content.includes(`${key}=`)) {
    content = content.replace(new RegExp(`^${key}=.*`, 'm'), `${key}=${value}`)
  } else {
    content = content + `\n${key}=${value}`
  }
  writeFileSync(ENV_PATH, content, 'utf-8')
  process.env[key] = value
}

// GET /api/settings
router.get('/', (req, res) => {
  const provider = process.env.LLM_PROVIDER || 'groq'
  const apiKey = process.env.LLM_API_KEY || ''
  const preset = PROVIDERS[provider] || PROVIDERS.groq
  const needsKey = preset.requiresKey

  res.json({
    provider,
    model: process.env.LLM_MODEL || preset.defaultModel,
    baseURL: process.env.LLM_BASE_URL || preset.baseURL,
    apiKeyConfigured: !needsKey || (!!apiKey && apiKey !== 'your_anthropic_api_key_here'),
    providers: Object.entries(PROVIDERS).map(([id, p]) => ({
      id,
      label: p.label,
      defaultModel: p.defaultModel,
      requiresKey: p.requiresKey,
      keyUrl: p.keyUrl
    }))
  })
})

// POST /api/settings
router.post('/', (req, res) => {
  const { provider, apiKey, model, baseURL } = req.body

  if (provider) writeEnvKey('LLM_PROVIDER', provider)
  if (apiKey !== undefined && apiKey !== '') writeEnvKey('LLM_API_KEY', apiKey)
  if (model) writeEnvKey('LLM_MODEL', model)
  if (baseURL !== undefined) writeEnvKey('LLM_BASE_URL', baseURL)

  // Legacy: also handle ANTHROPIC_API_KEY if provider is anthropic
  if (provider === 'anthropic' && apiKey) {
    writeEnvKey('ANTHROPIC_API_KEY', apiKey)
  }

  res.json({ success: true })
})

// POST /api/settings/apikey  (legacy endpoint — kept for backward compat)
router.post('/apikey', (req, res) => {
  const { apiKey } = req.body
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return res.status(400).json({ error: 'Invalid API key — must start with sk-' })
  }
  writeEnvKey('LLM_API_KEY', apiKey)
  res.json({ success: true })
})

export default router
