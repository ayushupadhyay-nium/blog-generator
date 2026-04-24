import { useState, useEffect, useRef } from 'react'
import { getSettings, saveSettings } from '../../api/index.js'

const FREE_BADGE = { groq: true, ollama: true, openrouter: true }

export default function ApiKeyModal({ onConfigured }) {
  const [providers, setProviders] = useState([])
  const [provider, setProvider] = useState('groq')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [baseURL, setBaseURL] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings().then(s => {
      setProviders(s.providers || [])
      setProvider(s.provider || 'groq')
      setModel(s.model || '')
      setBaseURL(s.baseURL || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const current = providers.find(p => p.id === provider)

  function handleProviderChange(id) {
    setProvider(id)
    setApiKey('')
    setError('')
    setSuccess(false)
    const p = providers.find(x => x.id === id)
    if (p) setModel(p.defaultModel || '')
  }

  async function handleSave() {
    if (current?.requiresKey && !apiKey.trim()) {
      setError('API key is required for this provider')
      return
    }
    setError('')
    setSaving(true)
    try {
      await saveSettings({ provider, apiKey: apiKey.trim(), model: model.trim(), baseURL: baseURL.trim() })
      setSuccess(true)
      setTimeout(() => onConfigured(), 700)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-5">
          <div className="text-2xl mb-2">⚙️</div>
          <h2 className="text-lg font-semibold text-gray-900">LLM Provider Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Choose a provider. Groq is free and fast — recommended to start.</p>
        </div>

        <div className="space-y-4">
          {/* Provider picker */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {providers.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all ${
                    provider === p.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{p.label}</div>
                  {FREE_BADGE[p.id] && (
                    <span className="inline-block mt-0.5 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Free</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          {current?.requiresKey && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                API Key
                {current.keyUrl && (
                  <a href={current.keyUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-500 hover:underline font-normal">
                    Get key ↗
                  </a>
                )}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Paste your API key..."
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                autoFocus
              />
            </div>
          )}

          {/* Ollama notice */}
          {provider === 'ollama' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <strong>Ollama must be running locally.</strong> Install from{' '}
              <a href="https://ollama.ai" target="_blank" rel="noreferrer" className="underline">ollama.ai</a>,
              then run: <code className="bg-amber-100 px-1 rounded">ollama pull llama3.2</code>
            </div>
          )}

          {/* Model (collapsible advanced) */}
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">Advanced (model / base URL)</summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder={current?.defaultModel || 'model name'}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {provider === 'custom' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Base URL</label>
                  <input
                    type="text"
                    value={baseURL}
                    onChange={e => setBaseURL(e.target.value)}
                    placeholder="https://your-api.com/v1"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </details>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">✓ Saved — ready to generate!</p>}

          <button
            onClick={handleSave}
            disabled={saving || success}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : success ? 'Saved!' : 'Save Settings'}
          </button>

          {onConfigured && (
            <button onClick={onConfigured} className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
              Skip for now
            </button>
          )}

          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-xs text-gray-400 mb-2">Have feedback or questions?</p>
            <a
              href="mailto:ayush.upadhyay@nium.com"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Reach out to Ayush Upadhyay
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export function useApiKeyStatus() {
  const [configured, setConfigured] = useState(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    getSettings()
      .then(s => { setConfigured(s.apiKeyConfigured); setChecked(true) })
      .catch(() => { setConfigured(true); setChecked(true) })
  }, [])

  return { configured, checked, markConfigured: () => setConfigured(true) }
}
