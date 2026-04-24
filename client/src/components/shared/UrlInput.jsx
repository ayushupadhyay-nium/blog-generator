import { useState } from 'react'

export default function UrlInput({ onAdd, disabled }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd() {
    const trimmed = url.trim()
    if (!trimmed) return
    if (!trimmed.startsWith('http')) {
      setError('Must start with http:// or https://')
      return
    }
    setError('')
    setLoading(true)
    try {
      await onAdd(trimmed)
      setUrl('')
    } catch (err) {
      setError(err.message || 'Failed to fetch URL')
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        <input
          type="url"
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          onKeyDown={handleKey}
          placeholder="https://example.com/blog-post"
          disabled={disabled || loading}
          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleAdd}
          disabled={disabled || loading || !url.trim()}
          className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
        >
          {loading ? '…' : 'Add'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
