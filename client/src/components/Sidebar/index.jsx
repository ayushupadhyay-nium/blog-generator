import { useEffect } from 'react'
import useBlogStore from '../../store/useBlogStore.js'

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString()
}

const statusColor = {
  draft: 'bg-gray-200 text-gray-600',
  generating: 'bg-yellow-100 text-yellow-700',
  complete: 'bg-green-100 text-green-700'
}

export default function Sidebar({ onSettingsClick }) {
  const { blogs, activeBlogId, loadBlogs, newBlog, selectBlog, deleteBlog } = useBlogStore()

  useEffect(() => { loadBlogs() }, [])

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Blog Generator</h1>
          <button
            onClick={newBlog}
            className="w-7 h-7 rounded-lg bg-blue-600 text-white text-lg font-light flex items-center justify-center hover:bg-blue-700 transition-colors"
            title="New blog"
          >
            +
          </button>
        </div>
      </div>

      {/* Blog list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {blogs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-400 text-sm">No blogs yet</p>
            <button onClick={newBlog} className="mt-3 text-blue-600 text-sm hover:underline">Create your first blog</button>
          </div>
        ) : (
          <ul className="p-2 space-y-0.5">
            {blogs.map(blog => (
              <li key={blog.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => selectBlog(blog.id)}
                  onKeyDown={e => e.key === 'Enter' && selectBlog(blog.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors group relative cursor-pointer ${activeBlogId === blog.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium truncate block leading-snug">
                      {blog.title || 'Untitled Blog'}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); if (confirm('Delete this blog?')) deleteBlog(blog.id) }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all shrink-0 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor[blog.status] || statusColor.draft}`}>
                      {blog.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDate(blog.updatedAt)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer — settings */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          title="API key settings"
        >
          <span>⚙️</span>
          <span>API Key</span>
        </button>
      </div>
    </div>
  )
}
