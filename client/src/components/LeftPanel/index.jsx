import { useState } from 'react'
import useBlogStore from '../../store/useBlogStore.js'
import FileDropzone from '../shared/FileDropzone.jsx'
import UrlInput from '../shared/UrlInput.jsx'

const DOC_ACCEPT = { 'text/plain': ['.txt'], 'text/markdown': ['.md', '.markdown'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }

function SourceIcon({ doc }) {
  if (doc.url) return <span title={doc.url}>🔗</span>
  return <span>📄</span>
}

export default function LeftPanel() {
  const {
    activeBlog, updateField, sources, processDoc,
    uploadSources, uploadProcessDoc, uploadUrl, removeSource,
    startGeneration, isGenerating, generationStep,
    strictMode, setStrictMode, saveBlog, isSaving, lastSaved
  } = useBlogStore()

  const [uploadingPast, setUploadingPast] = useState(false)
  const [uploadingRef, setUploadingRef] = useState(false)
  const [uploadingProc, setUploadingProc] = useState(false)

  if (!activeBlog) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm px-6 text-center">
        <div>
          <div className="text-4xl mb-3">✍️</div>
          <p>Select or create a blog to get started</p>
        </div>
      </div>
    )
  }

  async function handlePastBlogs(files) {
    setUploadingPast(true)
    await uploadSources(files, 'past_blog')
    setUploadingPast(false)
  }

  async function handleRefBlogs(files) {
    setUploadingRef(true)
    await uploadSources(files, 'reference')
    setUploadingRef(false)
  }

  async function handleProcessDoc(files) {
    if (!files[0]) return
    setUploadingProc(true)
    await uploadProcessDoc(files[0])
    setUploadingProc(false)
  }

  const pastBlogs = sources.filter(s => s.type === 'past_blog')
  const refBlogs = sources.filter(s => s.type === 'reference')

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Blog Settings</h2>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
          <input
            type="text"
            value={activeBlog.title || ''}
            onChange={e => updateField('title', e.target.value)}
            onBlur={() => saveBlog({ title: activeBlog.title })}
            placeholder="Enter blog title..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Idea / Brief */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Idea / Brief</label>
          <textarea
            value={activeBlog.idea || ''}
            onChange={e => updateField('idea', e.target.value)}
            onBlur={() => saveBlog({ idea: activeBlog.idea })}
            placeholder="Describe the blog topic, angle, key points to cover..."
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Past Blogs */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Past Blogs <span className="text-gray-400 font-normal">(for tone analysis)</span>
          </label>
          <FileDropzone
            onDrop={handlePastBlogs}
            accept={DOC_ACCEPT}
            label={uploadingPast ? 'Uploading...' : 'Drop past blogs here'}
            sublabel=".txt, .md, .docx — multiple files OK"
          />
          <UrlInput
            onAdd={url => uploadUrl(url, 'past_blog')}
            disabled={isGenerating}
          />
          {pastBlogs.length > 0 && (
            <ul className="mt-2 space-y-1">
              {pastBlogs.map(d => (
                <li key={d.id} className="flex items-center justify-between text-xs bg-blue-50 rounded-lg px-3 py-1.5 gap-2">
                  <span className="flex items-center gap-1.5 truncate text-blue-700 min-w-0">
                    <SourceIcon doc={d} />
                    <span className="truncate">{d.url ? new URL(d.url).hostname : d.filename}</span>
                  </span>
                  <button onClick={() => removeSource(d.id)} className="text-gray-400 hover:text-red-500 shrink-0">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Reference Blogs */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Reference Blogs <span className="text-gray-400 font-normal">(external content)</span>
          </label>
          <FileDropzone
            onDrop={handleRefBlogs}
            accept={DOC_ACCEPT}
            label={uploadingRef ? 'Uploading...' : 'Drop reference blogs here'}
            sublabel=".txt, .md, .docx"
            compact
          />
          <UrlInput
            onAdd={url => uploadUrl(url, 'reference')}
            disabled={isGenerating}
          />
          {refBlogs.length > 0 && (
            <ul className="mt-2 space-y-1">
              {refBlogs.map(d => (
                <li key={d.id} className="flex items-center justify-between text-xs bg-purple-50 rounded-lg px-3 py-1.5 gap-2">
                  <span className="flex items-center gap-1.5 truncate text-purple-700 min-w-0">
                    <SourceIcon doc={d} />
                    <span className="truncate">{d.url ? new URL(d.url).hostname : d.filename}</span>
                  </span>
                  <button onClick={() => removeSource(d.id)} className="text-gray-400 hover:text-red-500 shrink-0">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Process Document */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Process Document <span className="text-gray-400 font-normal">(editorial rules)</span>
          </label>
          <FileDropzone
            onDrop={handleProcessDoc}
            accept={DOC_ACCEPT}
            multiple={false}
            label={uploadingProc ? 'Uploading...' : processDoc ? `✓ ${processDoc.filename}` : 'Drop process doc here'}
            sublabel=".txt, .md, .docx — replaces existing"
            compact
          />

          {/* Strict mode toggle */}
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <div
              onClick={() => setStrictMode(!strictMode)}
              className={`relative w-8 h-4 rounded-full transition-colors ${strictMode ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${strictMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs text-gray-500">Strict adherence to process doc</span>
          </label>
        </div>

        {/* SEO info card */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-semibold text-blue-700">🔍 SEO Auto-Optimized</span>
            <span className="text-[10px] bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">7 outputs</span>
          </div>
          <ul className="space-y-1">
            {[
              ['📝', 'Body copy rewrites', 'Eikhart 5-lens pass'],
              ['🏷️', 'H1 + Title tag', '3 options, intent-matched'],
              ['🔤', 'H2 rewrites', 'Semantic clarity + keywords'],
              ['📋', 'Meta description', '150–160 chars with CTA'],
              ['🔗', 'URL slug', 'Keyword-first, no stopwords'],
              ['↔️', 'Internal link map', '3–5 contextual placements'],
              ['🖼️', 'Image recommendations', 'Alt tags + file names'],
            ].map(([icon, name, desc]) => (
              <li key={name} className="flex items-start gap-1.5 text-[11px]">
                <span className="shrink-0 mt-px">{icon}</span>
                <span>
                  <span className="font-medium text-blue-800">{name}</span>
                  <span className="text-blue-500 ml-1">— {desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Generate Button */}
        <div className="pt-1">
          <button
            onClick={startGeneration}
            disabled={isGenerating || !activeBlog.title}
            className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">{generationStep || 'Generating...'}</span>
              </>
            ) : (
              <>✨ Generate Blog</>
            )}
          </button>
        </div>
      </div>

      {/* Save status */}
      <div className="p-3 border-t border-gray-100 text-center">
        <span className="text-xs text-gray-400">
          {isSaving ? 'Saving...' : lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : 'Auto-saves on change'}
        </span>
      </div>
    </div>
  )
}
