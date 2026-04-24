import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { marked } from 'marked'
import useBlogStore from '../store/useBlogStore.js'
import ApiKeyModal, { useApiKeyStatus } from '../components/shared/ApiKeyModal.jsx'
import Toolbar from '../components/Editor/Toolbar.jsx'
import FileDropzone from '../components/shared/FileDropzone.jsx'
import UrlInput from '../components/shared/UrlInput.jsx'
import WritingGuidelinesModal from '../components/shared/WritingGuidelinesModal.jsx'

const DOC_ACCEPT = {
  'text/plain': ['.txt'],
  'text/markdown': ['.md', '.markdown'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

const STATUS = {
  draft:      { label: 'Draft',      cls: 'bg-slate-100 text-slate-500' },
  generating: { label: 'Generating', cls: 'bg-amber-50 text-amber-600' },
  complete:   { label: 'Published',  cls: 'bg-emerald-50 text-emerald-600' },
}

const SAVE_DELAY = 2000

function wordCount(html) {
  if (!html) return 0
  return html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
}

// ── Collapsible section used in SEO panel ──────────────────────────────────
function Collapsible({ title, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          {badge && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{badge}</span>}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-slate-300 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="shrink-0 text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
    >
      {copied ? '✓' : 'Copy'}
    </button>
  )
}

// ── SEO right panel ────────────────────────────────────────────────────────
function SEORightPanel({ seoOutputs, editor, open, onClose }) {
  const applyH1 = (text) => editor?.chain().focus().insertContentAt(0, `<h1>${text}</h1>`).run()

  return (
    <aside className={`shrink-0 border-l border-slate-100 bg-white flex flex-col transition-all duration-200 ${open ? 'w-80' : 'w-0 overflow-hidden border-l-0'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">SEO</span>
          {seoOutputs
            ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">Generated</span>
            : <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full">Runs on Generate</span>
          }
        </div>
        <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!seoOutputs ? (
          /* ── Pre-generation checklist ────────────────────────── */
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              When you click Generate, a full SEO pass runs automatically. Here's exactly what gets produced:
            </p>
            {[
              {
                icon: '📝',
                name: 'Body copy rewrites',
                desc: 'Each paragraph is evaluated against 5 Eikhart criteria — specificity, scannability, tone, keyword density, and clarity. Failing paragraphs get a rewrite.',
                example: '"Our platform helps businesses." → "Cut onboarding time by 40% — no devs needed."',
              },
              {
                icon: '🏷️',
                name: 'H1 + Title tag',
                desc: '3 headline options matched to search intent (informational, commercial, navigational), each within 55–65 characters for SERP display.',
                example: '"How to Write SEO Blog Posts That Rank in 2025"',
              },
              {
                icon: '🔤',
                name: 'H2 rewrites',
                desc: 'Every section heading is rewritten for semantic clarity, primary keyword proximity, and scannability. Original and rewrite shown side-by-side.',
                example: '"Introduction" → "Why Most Blog Posts Never Rank (And How to Fix Yours)"',
              },
              {
                icon: '📋',
                name: 'Meta description',
                desc: '2 variants at 150–160 characters — one leading with the benefit, one leading with the pain point. Both include a clear CTA.',
                example: '"Stop losing traffic to competitors. Learn the exact 5-step framework…"',
              },
              {
                icon: '🔗',
                name: 'URL slug',
                desc: 'A keyword-first slug with no stopwords, plus one alternate. Rationale included.',
                example: '/seo-blog-writing-framework-2025',
              },
              {
                icon: '↔️',
                name: 'Internal link map',
                desc: '3–5 contextual placements with anchor text and suggested target page type. Categorised as topical, navigational, or conversion.',
                example: '"…as covered in our keyword research guide" → [link: /keyword-research]',
              },
              {
                icon: '🖼️',
                name: 'Image recommendations',
                desc: 'Per-section image briefs with SEO-optimised alt text (keyword + context) and file naming convention.',
                example: 'Alt: "seo-blog-checklist-screenshot", File: seo-blog-checklist-2025.webp',
              },
            ].map(item => (
              <div key={item.name} className="rounded-xl border border-slate-100 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-semibold text-slate-800">{item.name}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                <div className="bg-slate-50 rounded-lg px-2.5 py-1.5">
                  <p className="text-[11px] text-slate-400 italic leading-relaxed">{item.example}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Post-generation actual outputs ──────────────────── */
          <div>
            {/* Draft brief */}
            {seoOutputs.draftBrief && (
              <Collapsible title="Draft Brief" defaultOpen>
                <div className="space-y-2 text-xs">
                  <InfoRow label="Keyword" value={seoOutputs.draftBrief.primaryKeyword} />
                  <InfoRow label="Page type" value={seoOutputs.draftBrief.pageType} />
                  <InfoRow label="Reader stage" value={seoOutputs.draftBrief.readerStage} />
                  <InfoRow label="Opening style" value={seoOutputs.draftBrief.openingStyle} />
                </div>
              </Collapsible>
            )}

            {/* H1 options */}
            {seoOutputs.h1Options?.length > 0 && (
              <Collapsible title="H1 Options" badge={`${seoOutputs.h1Options.length} variants`} defaultOpen>
                <div className="space-y-2">
                  {seoOutputs.h1Options.map((opt, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="font-medium text-slate-800 leading-snug">{opt.text}</p>
                        <div className="flex gap-1 shrink-0">
                          <CopyBtn text={opt.text} />
                          <button onClick={() => applyH1(opt.text)} className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded transition-colors">
                            Apply
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-400">{opt.charCount} chars · {opt.why}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>
            )}

            {/* Meta descriptions */}
            {seoOutputs.metaDescriptions?.length > 0 && (
              <Collapsible title="Meta Description" badge={`${seoOutputs.metaDescriptions.length} variants`}>
                <div className="space-y-2">
                  {seoOutputs.metaDescriptions.map((m, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-2.5 text-xs">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-slate-700 leading-relaxed">{m.text}</p>
                        <CopyBtn text={m.text} />
                      </div>
                      <p className={`text-[10px] ${m.charCount > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                        {m.charCount} chars · {m.type}
                      </p>
                    </div>
                  ))}
                </div>
              </Collapsible>
            )}

            {/* URL slug */}
            {seoOutputs.urlSlug && (
              <Collapsible title="URL Slug">
                <div className="rounded-xl border border-slate-100 p-2.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-indigo-700 font-mono text-[11px]">{seoOutputs.urlSlug.recommended}</code>
                    <CopyBtn text={seoOutputs.urlSlug.recommended} />
                  </div>
                  <p className="text-slate-400 leading-relaxed">{seoOutputs.urlSlug.reasoning}</p>
                  {seoOutputs.urlSlug.alt && (
                    <p className="text-slate-400">Alt: <code className="text-slate-600">{seoOutputs.urlSlug.alt}</code></p>
                  )}
                </div>
              </Collapsible>
            )}

            {/* H2 rewrites */}
            {seoOutputs.h2Rewrites?.length > 0 && (
              <Collapsible title="H2 Rewrites" badge={`${seoOutputs.h2Rewrites.length}`}>
                <div className="space-y-3">
                  {seoOutputs.h2Rewrites.map((h, i) => (
                    <div key={i} className="text-xs border-l-2 border-slate-200 pl-3 space-y-0.5">
                      <p className="text-slate-400 line-through text-[11px]">{h.original}</p>
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-slate-800 font-medium">{h.rewritten}</p>
                        <CopyBtn text={h.rewritten} />
                      </div>
                      <p className="text-slate-400 text-[11px]">{h.rationale}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>
            )}

            {/* Body copy rewrites */}
            {seoOutputs.bodyCopyRewrites?.length > 0 && (
              <Collapsible title="Body Copy Rewrites" badge={`${seoOutputs.bodyCopyRewrites.length}`}>
                <div className="space-y-4">
                  {seoOutputs.bodyCopyRewrites.map((r, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <p className="text-slate-400 line-through text-[11px] leading-relaxed">{r.before}</p>
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-slate-800 leading-relaxed">{r.after}</p>
                        <CopyBtn text={r.after} />
                      </div>
                      <p className="text-[10px] text-amber-600">{r.checkFailed} · {r.whatWasAdded}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>
            )}

            {/* Internal links */}
            {seoOutputs.internalLinks?.length > 0 && (
              <Collapsible title="Internal Link Map" badge={`${seoOutputs.internalLinks.length} placements`}>
                <div className="space-y-2">
                  {seoOutputs.internalLinks.map((l, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-2.5 text-xs space-y-1">
                      <p className="text-slate-400 text-[10px]">Near: "{l.nearCopy?.slice(0, 55)}…"</p>
                      <p className="font-medium text-indigo-700">"{l.anchorText}"</p>
                      <p className="text-slate-500">→ {l.targetPage}</p>
                      <span className="inline-block text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{l.linkType}</span>
                    </div>
                  ))}
                </div>
              </Collapsible>
            )}

            {/* Image recommendations */}
            {seoOutputs.imageRecommendations?.length > 0 && (
              <Collapsible title="Image Recommendations" badge={`${seoOutputs.imageRecommendations.length}`}>
                <div className="space-y-2">
                  {seoOutputs.imageRecommendations.map((img, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 p-2.5 text-xs space-y-1.5">
                      <p className="font-medium text-slate-700">{img.section}</p>
                      <p className="text-slate-500 leading-relaxed">{img.brief}</p>
                      <div className="space-y-0.5 text-[11px] text-slate-400">
                        <p><span className="text-slate-600 font-medium">Alt:</span> {img.altTag}</p>
                        <p><span className="text-slate-600 font-medium">File:</span> <code className="font-mono">{img.fileName}</code></p>
                        <p><span className="text-slate-600 font-medium">Size:</span> {img.dimensions} · {img.format}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-400 w-20 shrink-0">{label}</span>
      <span className="text-slate-700">{value}</span>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    activeBlog, selectBlog, updateField, saveBlog,
    sources, processDoc, uploadSources, uploadProcessDoc, uploadUrl, removeSource,
    startGeneration, isGenerating, generationStep,
    strictMode, setStrictMode,
    seoOutputs,
    isSaving, lastSaved,
  } = useBlogStore()

  const { configured, checked, markConfigured } = useApiKeyStatus()
  const [showSettings, setShowSettings] = useState(false)
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(true)
  const [seoOpen, setSeoOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('draft')
  const [uploadingPast, setUploadingPast] = useState(false)
  const [uploadingRef, setUploadingRef] = useState(false)
  const [uploadingProc, setUploadingProc] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => { if (id) selectBlog(id) }, [id])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Underline,
      Placeholder.configure({ placeholder: 'Your generated blog will appear here…' }),
    ],
    editorProps: { attributes: { class: 'tiptap-editor focus:outline-none' } },
    onUpdate: ({ editor }) => {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveBlog({ contentHtml: editor.getHTML(), contentJson: JSON.stringify(editor.getJSON()) })
      }, SAVE_DELAY)
    },
  })

  useEffect(() => {
    if (!editor || !activeBlog) return
    if (activeBlog.contentJson) {
      try {
        const json = typeof activeBlog.contentJson === 'string'
          ? JSON.parse(activeBlog.contentJson) : activeBlog.contentJson
        editor.commands.setContent(json, false)
        return
      } catch { /* fall through */ }
    }
    if (activeBlog.contentHtml) {
      const isMarkdown = !activeBlog.contentHtml.trim().startsWith('<')
      const html = isMarkdown ? marked(activeBlog.contentHtml) : activeBlog.contentHtml
      editor.commands.setContent(html, false)
    }
  }, [activeBlog?.id, activeBlog?.contentHtml, activeBlog?.contentJson, editor])

  const htmlOutput = editor ? editor.getHTML() : ''
  const words = wordCount(htmlOutput)
  const st = STATUS[activeBlog?.status] || STATUS.draft
  const modalOpen = (checked && configured === false) || showSettings
  const pastBlogs = sources.filter(s => s.type === 'past_blog')
  const refBlogs = sources.filter(s => s.type === 'reference')

  async function handlePastBlogs(files) { setUploadingPast(true); await uploadSources(files, 'past_blog'); setUploadingPast(false) }
  async function handleRefBlogs(files) { setUploadingRef(true); await uploadSources(files, 'reference'); setUploadingRef(false) }
  async function handleProcessDoc(files) { if (!files[0]) return; setUploadingProc(true); await uploadProcessDoc(files[0]); setUploadingProc(false) }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-slate-100 flex items-center px-4 gap-3 shrink-0 z-20" style={{ height: 52 }}>
        <button onClick={() => navigate('/')} className="btn-ghost flex items-center gap-1.5 text-xs shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Blogs
        </button>

        <div className="w-px h-5 bg-slate-100 shrink-0" />

        <input
          type="text"
          value={activeBlog?.title || ''}
          onChange={e => updateField('title', e.target.value)}
          onBlur={() => activeBlog && saveBlog({ title: activeBlog.title })}
          placeholder="Untitled Blog"
          className="flex-1 min-w-0 text-sm font-semibold text-slate-900 bg-transparent border-none outline-none placeholder-slate-300"
        />

        {activeBlog && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${st.cls}`}>{st.label}</span>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-300 hidden sm:block">
            {isSaving ? 'Saving…' : lastSaved ? 'Saved' : ''}
          </span>

          {/* SEO panel toggle */}
          <button
            onClick={() => setSeoOpen(o => !o)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
              seoOpen
                ? seoOutputs
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            SEO
            {seoOutputs && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </button>

          <button
            onClick={startGeneration}
            disabled={isGenerating || !activeBlog?.title}
            className="btn-primary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs hidden sm:block">{generationStep?.split(':')[0] || 'Generating'}</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generate
              </>
            )}
          </button>

          <button
            onClick={() => activeBlog && window.open(`/api/blogs/${activeBlog.id}/export?format=raw`, '_blank')}
            disabled={!activeBlog?.contentHtml}
            className="btn-ghost text-xs disabled:opacity-30"
          >
            Export
          </button>

          <button onClick={() => setShowSettings(true)} className="btn-ghost p-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left panel — blog inputs */}
        <aside className={`shrink-0 border-r border-slate-100 bg-white flex flex-col transition-all duration-200 ${leftOpen ? 'w-72' : 'w-0 overflow-hidden border-r-0'}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Blog Settings</span>
            <button onClick={() => setLeftOpen(false)} className="text-slate-300 hover:text-slate-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div>
              <label className="label">Idea / Brief</label>
              <textarea
                value={activeBlog?.idea || ''}
                onChange={e => updateField('idea', e.target.value)}
                onBlur={() => activeBlog && saveBlog({ idea: activeBlog.idea })}
                placeholder="Topic, angle, key points to cover…"
                rows={4}
                className="input resize-none"
              />
            </div>

            <div>
              <label className="label">Past Blogs <span className="normal-case font-normal text-slate-400">— tone</span></label>
              <FileDropzone onDrop={handlePastBlogs} accept={DOC_ACCEPT} label={uploadingPast ? 'Uploading…' : 'Drop files here'} sublabel=".txt, .md, .docx" />
              <UrlInput onAdd={url => uploadUrl(url, 'past_blog')} disabled={isGenerating} />
              {pastBlogs.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {pastBlogs.map(d => <SourceItem key={d.id} doc={d} onRemove={() => removeSource(d.id)} color="indigo" />)}
                </ul>
              )}
            </div>

            <div>
              <label className="label">Reference Blogs <span className="normal-case font-normal text-slate-400">— content</span></label>
              <FileDropzone onDrop={handleRefBlogs} accept={DOC_ACCEPT} label={uploadingRef ? 'Uploading…' : 'Drop files here'} sublabel=".txt, .md, .docx" compact />
              <UrlInput onAdd={url => uploadUrl(url, 'reference')} disabled={isGenerating} />
              {refBlogs.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {refBlogs.map(d => <SourceItem key={d.id} doc={d} onRemove={() => removeSource(d.id)} color="violet" />)}
                </ul>
              )}
            </div>

            <div>
              <label className="label">
                Writing Guidelines
                <span className="normal-case font-normal text-slate-400 ml-1">— how you write</span>
              </label>
              <button
                onClick={() => setGuidelinesOpen(true)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-colors ${
                  processDoc
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {processDoc ? (
                  <>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="truncate">{processDoc.filename}</span>
                    <span className="ml-auto text-emerald-500 shrink-0">Edit</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.28c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Set up guidelines
                    <span className="ml-auto text-slate-300 shrink-0">→</span>
                  </>
                )}
              </button>
              <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none">
                <button
                  role="switch"
                  aria-checked={strictMode}
                  onClick={() => setStrictMode(!strictMode)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${strictMode ? 'bg-indigo-500' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${strictMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-xs text-slate-500">Strict process adherence</span>
              </label>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 shrink-0">
            <button
              onClick={startGeneration}
              disabled={isGenerating || !activeBlog?.title}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {isGenerating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs truncate">{generationStep || 'Generating…'}</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Generate Blog
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Left collapse tab */}
        {!leftOpen && (
          <button
            onClick={() => setLeftOpen(true)}
            className="shrink-0 w-6 flex items-center justify-center bg-white border-r border-slate-100 hover:bg-slate-50 transition-colors group"
          >
            <svg className="w-3 h-3 text-slate-300 group-hover:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}

        {/* Center — editor */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-white shrink-0">
            {['draft', 'preview', 'html'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab === 'draft' ? 'Edit' : tab === 'preview' ? 'Preview' : 'HTML'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'draft' && (
              <div className="h-full flex flex-col">
                <Toolbar editor={editor} />
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-8 py-8">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'preview' && (
              <div className="h-full overflow-y-auto">
                <div className="max-w-3xl mx-auto px-8 py-8">
                  <div className="tiptap-editor prose max-w-none" dangerouslySetInnerHTML={{ __html: htmlOutput }} />
                </div>
              </div>
            )}
            {activeTab === 'html' && (
              <div className="h-full overflow-hidden relative">
                <button
                  onClick={() => navigator.clipboard.writeText(htmlOutput)}
                  className="absolute top-3 right-3 z-10 text-xs px-2 py-1 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Copy
                </button>
                <pre className="h-full overflow-auto bg-slate-950 text-emerald-400 p-6 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                  {htmlOutput || '<!-- No content yet -->'}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right SEO panel — always present, collapsible */}
        {!seoOpen && (
          <button
            onClick={() => setSeoOpen(true)}
            className="shrink-0 w-8 flex flex-col items-center justify-center gap-1.5 bg-white border-l border-slate-100 hover:bg-slate-50 transition-colors group py-4"
          >
            <svg className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span
              className="text-[10px] font-semibold tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              SEO
            </span>
            {seoOutputs && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
        )}
        <SEORightPanel seoOutputs={seoOutputs} editor={editor} open={seoOpen} onClose={() => setSeoOpen(false)} />
      </div>

      {/* Bottom status bar */}
      <div className="bg-white border-t border-slate-100 px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          {words > 0 && <span>{words.toLocaleString()} words</span>}
          {isGenerating && (
            <span className="text-amber-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              {generationStep || 'Generating…'}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-300">
          {isSaving ? 'Saving…' : lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Auto-saves on change'}
        </span>
      </div>

      {modalOpen && <ApiKeyModal onConfigured={() => { markConfigured(); setShowSettings(false) }} />}
      {guidelinesOpen && (
        <WritingGuidelinesModal
          onSave={handleProcessDoc}
          onClose={() => setGuidelinesOpen(false)}
        />
      )}
    </div>
  )
}

function SourceItem({ doc, onRemove, color }) {
  const cls = color === 'violet' ? 'bg-violet-50 text-violet-700' : 'bg-indigo-50 text-indigo-700'
  const name = doc.url ? new URL(doc.url).hostname : doc.filename
  return (
    <li className={`flex items-center justify-between text-xs rounded-lg px-2.5 py-1.5 gap-2 ${cls}`}>
      <span className="flex items-center gap-1.5 truncate min-w-0">
        {doc.url
          ? <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
          : <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
        }
        <span className="truncate">{name}</span>
      </span>
      <button onClick={onRemove} className="shrink-0 opacity-40 hover:opacity-100 transition-opacity">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  )
}
