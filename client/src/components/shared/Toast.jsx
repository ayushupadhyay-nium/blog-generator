import { useEffect } from 'react'

export default function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-sm border rounded-xl px-4 py-3 shadow-lg flex items-start gap-3 ${colors[type]}`}>
      <span className="flex-1 text-sm">{message}</span>
      <button onClick={onClose} className="text-current opacity-50 hover:opacity-100 shrink-0">✕</button>
    </div>
  )
}
