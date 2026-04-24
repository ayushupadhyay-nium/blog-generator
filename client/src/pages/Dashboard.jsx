import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useBlogStore from '../store/useBlogStore.js'
import ApiKeyModal, { useApiKeyStatus } from '../components/shared/ApiKeyModal.jsx'

const STATUS = {
  draft:      { label: 'Draft',      cls: 'bg-slate-100 text-slate-500' },
  generating: { label: 'Generating', cls: 'bg-amber-50 text-amber-600' },
  complete:   { label: 'Published',  cls: 'bg-emerald-50 text-emerald-600' },
}

function timeAgo(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function wordCount(html) {
  if (!html) return 0
  return html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { blogs, loadBlogs, newBlog, deleteBlog } = useBlogStore()
  const { configured, checked, markConfigured } = useApiKeyStatus()
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => { loadBlogs() }, [])

  async function handleNew() {
    const blog = await newBlog()
    if (blog) navigate(`/blog/${blog.id}`)
  }

  async function handleOpen(id) {
    navigate(`/blog/${id}`)
  }

  const modalOpen = (checked && configured === false) || showSettings

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">B</span>
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">BlogCraft</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="btn-ghost flex items-center gap-1.5 text-xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <button onClick={handleNew} className="btn-primary flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Blog
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {blogs.length === 0 ? (
          <EmptyState onNew={handleNew} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Your Blogs</h1>
                <p className="text-sm text-slate-400 mt-0.5">{blogs.length} blog{blogs.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {blogs.map(blog => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  onOpen={() => handleOpen(blog.id)}
                  onDelete={() => { if (confirm('Delete this blog?')) deleteBlog(blog.id) }}
                />
              ))}
              {/* New blog card */}
              <button
                onClick={handleNew}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-left hover:border-indigo-300 hover:bg-indigo-50/40 transition-all group min-h-[160px] flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-slate-400 group-hover:text-indigo-500 transition-colors">New Blog</span>
              </button>
            </div>
          </>
        )}
      </main>

      {modalOpen && <ApiKeyModal onConfigured={() => { markConfigured(); setShowSettings(false) }} />}
    </div>
  )
}

function BlogCard({ blog, onOpen, onDelete }) {
  const st = STATUS[blog.status] || STATUS.draft
  const words = wordCount(blog.contentHtml)

  return (
    <div
      onClick={onOpen}
      className="card p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group relative min-h-[160px] flex flex-col"
    >
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="absolute top-3 right-3 w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-300 hover:text-red-400 flex items-center justify-center transition-all text-xs"
      >✕</button>

      <div className="flex-1">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1.5 pr-6">
          {blog.title || 'Untitled Blog'}
        </h3>
        {blog.idea && (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{blog.idea}</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
        <div className="flex items-center gap-2.5 text-[11px] text-slate-300">
          {words > 0 && <span>{words.toLocaleString()} words</span>}
          <span>{timeAgo(blog.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onNew }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5">
        <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">No blogs yet</h2>
      <p className="text-sm text-slate-400 mb-7 max-w-xs">Create your first blog post and let AI help you write it with your tone and style.</p>
      <button onClick={onNew} className="btn-primary">Create your first blog</button>
    </div>
  )
}
