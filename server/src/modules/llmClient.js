import OpenAI from 'openai'

// Provider presets — baseURL + default model
export const PROVIDERS = {
  groq: {
    label: 'Groq (Free)',
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresKey: true,
    keyUrl: 'https://console.groq.com'
  },
  openai: {
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    requiresKey: true,
    keyUrl: 'https://platform.openai.com/api-keys'
  },
  openrouter: {
    label: 'OpenRouter (Free credits)',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    requiresKey: true,
    keyUrl: 'https://openrouter.ai/keys'
  },
  ollama: {
    label: 'Ollama (Local, Free)',
    baseURL: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    requiresKey: false,
    keyUrl: null
  },
  anthropic: {
    label: 'Anthropic Claude',
    baseURL: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-6',
    requiresKey: true,
    keyUrl: 'https://console.anthropic.com'
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    baseURL: '',
    defaultModel: '',
    requiresKey: false,
    keyUrl: null
  }
}

function getConfig() {
  return {
    provider: process.env.LLM_PROVIDER || 'groq',
    apiKey: process.env.LLM_API_KEY || '',
    baseURL: process.env.LLM_BASE_URL || '',
    model: process.env.LLM_MODEL || ''
  }
}

function buildClient() {
  const { provider, apiKey, baseURL } = getConfig()
  const preset = PROVIDERS[provider] || PROVIDERS.groq

  const resolvedBaseURL = baseURL || preset.baseURL
  const resolvedKey = apiKey || (preset.requiresKey ? undefined : 'ollama')

  // Anthropic's OpenAI-compatible endpoint needs a different base URL
  const finalBaseURL = provider === 'anthropic'
    ? 'https://api.anthropic.com/v1'
    : resolvedBaseURL

  return new OpenAI({
    apiKey: resolvedKey || 'no-key',
    baseURL: finalBaseURL,
    defaultHeaders: provider === 'openrouter' ? {
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Blog Generator'
    } : undefined
  })
}

export function getModel() {
  const { provider, model } = getConfig()
  const preset = PROVIDERS[provider] || PROVIDERS.groq
  return model || preset.defaultModel
}

export async function callLLM(systemPrompt, userPrompt, maxTokens = 4096) {
  const client = buildClient()
  const model = getModel()

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  })

  return response.choices[0].message.content
}
