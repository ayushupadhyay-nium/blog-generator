import { useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { marked } from 'marked'
import useBlogStore from '../../store/useBlogStore.js'
import Toolbar from './Toolbar.jsx'
import SEOPanel from '../SEOPanel/index.jsx'

const SAVE_DELAY = 2000

export default function Editor() {
  const {
    activeBlog, activeTab, setActiveTab,
    saveBlog, isGenerating, seoOutputs, showSeoPanel
  } = useBlogStore()

  const saveTimer = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Underline,
      Placeholder.configure({ placeholder: 'Your generated blog will appear here. Start editing...' })
    ],
    editorProps: {
      attributes: { class: 'tiptap-editor focus:outline-none' }
    },
    onUpdate: ({ editor }) => {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveBlog({
          contentHtml: editor.getHTML(),
          contentJson: JSON.stringify(editor.getJSON())
        })
      }, SAVE_DELAY)
    }
  })

  // Load content when blog changes or generation completes
  useEffect(() => {
    if (!editor || !activeBlog) return
    const currentHtml = editor.getHTML()

    // Load from contentJson if available, else parse markdown contentHtml
    if (activeBlog.contentJson) {
      try {
        const json = typeof activeBlog.contentJson === 'string'
          ? JSON.parse(activeBlog.contentJson)
          : activeBlog.contentJson
        editor.commands.setContent(json, false)
        return
      } catch { /* fall through to HTML */ }
    }

    if (activeBlog.contentHtml && activeBlog.contentHtml !== currentHtml) {
      // If it looks like markdown (not HTML), convert it first
      const isMarkdown = !activeBlog.contentHtml.trim().startsWith('<')
      const html = isMarkdown ? marked(activeBlog.contentHtml) : activeBlog.contentHtml
      editor.commands.setContent(html, false)
    }
  }, [activeBlog?.id, activeBlog?.contentHtml, activeBlog?.contentJson, editor])

  const handleExport = useCallback(async () => {
    if (!activeBlog) return
    window.open(`/api/blogs/${activeBlog.id}/export?format=raw`, '_blank')
  }, [activeBlog])

  const htmlOutput = editor ? editor.getHTML() : ''

  const tabs = ['draft', 'preview', 'html']
  const tabLabels = { draft: '✏️ Draft', preview: '👁 Preview', html: '</> HTML' }

  if (!activeBlog) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg font-medium">No blog selected</p>
          <p className="text-sm mt-1">Create or select a blog from the sidebar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white shrink-0">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${activeTab === tab ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <span className="text-xs text-blue-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Generating...
            </span>
          )}
          {seoOutputs && (
            <button
              onClick={() => setShowSeoPanel(!showSeoPanel)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                showSeoPanel
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600'
              }`}
            >
              🔍 SEO
              <span className={`w-1.5 h-1.5 rounded-full ${showSeoPanel ? 'bg-green-500' : 'bg-gray-300'}`} />
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={!activeBlog.contentHtml}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            Export HTML ↓
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Main editor area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === 'draft' && (
            <>
              <Toolbar editor={editor} />
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <EditorContent editor={editor} />
              </div>
            </>
          )}

          {activeTab === 'preview' && (
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div
                className="tiptap-editor prose max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlOutput }}
              />
            </div>
          )}

          {activeTab === 'html' && (
            <div className="flex-1 overflow-y-auto">
              <div className="relative h-full">
                <button
                  onClick={() => navigator.clipboard.writeText(htmlOutput)}
                  className="absolute top-3 right-3 z-10 text-xs px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Copy
                </button>
                <pre className="h-full overflow-auto bg-gray-950 text-green-400 p-6 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                  {htmlOutput || '<!-- No content yet -->'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* SEO Panel */}
        {showSeoPanel && seoOutputs && (
          <SEOPanel seoOutputs={seoOutputs} editor={editor} />
        )}
      </div>
    </div>
  )
}
