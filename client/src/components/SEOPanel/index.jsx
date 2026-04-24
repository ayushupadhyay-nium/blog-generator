import { useState } from 'react'
import useBlogStore from '../../store/useBlogStore.js'

const Section = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{title}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors shrink-0"
    >
      {copied ? '✓' : 'Copy'}
    </button>
  )
}

export default function SEOPanel({ seoOutputs, editor }) {
  const setShowSeoPanel = useBlogStore(s => s.setShowSeoPanel)

  const applyH1 = (text) => {
    if (!editor) return
    editor.chain().focus().insertContentAt(0, `<h1>${text}</h1>`).run()
  }

  return (
    <div className="w-80 shrink-0 border-l border-gray-100 bg-white overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <h3 className="text-sm font-semibold text-gray-800">🔍 SEO Outputs</h3>
        <button onClick={() => setShowSeoPanel(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
      </div>

      {/* Draft Brief */}
      {seoOutputs.draftBrief && (
        <Section title="Draft Brief" defaultOpen>
          <div className="space-y-1.5 text-xs">
            <Row label="Keyword" value={seoOutputs.draftBrief.primaryKeyword} />
            <Row label="Page Type" value={seoOutputs.draftBrief.pageType} />
            <Row label="Reader" value={seoOutputs.draftBrief.readerStage} />
            <Row label="Opening" value={seoOutputs.draftBrief.openingStyle} />
          </div>
        </Section>
      )}

      {/* H1 Options */}
      {seoOutputs.h1Options?.length > 0 && (
        <Section title="H1 Options">
          <div className="space-y-2">
            {seoOutputs.h1Options.map((opt, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2.5 text-xs">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-gray-800">{opt.text}</span>
                  <div className="flex gap-1 shrink-0">
                    <CopyBtn text={opt.text} />
                    <button onClick={() => applyH1(opt.text)} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded">Use</button>
                  </div>
                </div>
                <span className="text-gray-400">{opt.charCount} chars · {opt.why}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Meta Descriptions */}
      {seoOutputs.metaDescriptions?.length > 0 && (
        <Section title="Meta Descriptions">
          <div className="space-y-2">
            {seoOutputs.metaDescriptions.map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2.5 text-xs">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-gray-800">{m.text}</span>
                  <CopyBtn text={m.text} />
                </div>
                <span className={`${m.charCount > 160 ? 'text-red-500' : 'text-gray-400'}`}>{m.charCount} chars ({m.type})</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* URL Slug */}
      {seoOutputs.urlSlug && (
        <Section title="URL Slug">
          <div className="bg-gray-50 rounded-lg p-2.5 text-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <code className="text-blue-700 font-mono">{seoOutputs.urlSlug.recommended}</code>
              <CopyBtn text={seoOutputs.urlSlug.recommended} />
            </div>
            <p className="text-gray-400">{seoOutputs.urlSlug.reasoning}</p>
            {seoOutputs.urlSlug.alt && <p className="text-gray-400 mt-1">Alt: <code className="text-gray-600">{seoOutputs.urlSlug.alt}</code></p>}
          </div>
        </Section>
      )}

      {/* H2 Rewrites */}
      {seoOutputs.h2Rewrites?.length > 0 && (
        <Section title="H2 Rewrites">
          <div className="space-y-2">
            {seoOutputs.h2Rewrites.map((h, i) => (
              <div key={i} className="text-xs border-l-2 border-blue-200 pl-2.5 py-1">
                <p className="text-gray-400 line-through text-[11px]">{h.original}</p>
                <div className="flex items-start justify-between gap-1 mt-0.5">
                  <p className="text-gray-800 font-medium">{h.rewritten}</p>
                  <CopyBtn text={h.rewritten} />
                </div>
                <p className="text-gray-400 text-[11px] mt-0.5">{h.rationale}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Body Copy Rewrites */}
      {seoOutputs.bodyCopyRewrites?.length > 0 && (
        <Section title="Body Rewrites">
          <div className="space-y-3">
            {seoOutputs.bodyCopyRewrites.map((r, i) => (
              <div key={i} className="text-xs">
                <p className="text-gray-400 line-through text-[11px] mb-0.5">{r.before}</p>
                <div className="flex items-start justify-between gap-1">
                  <p className="text-gray-800">{r.after}</p>
                  <CopyBtn text={r.after} />
                </div>
                <p className="text-orange-500 text-[11px] mt-0.5">{r.checkFailed} · {r.whatWasAdded}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Internal Links */}
      {seoOutputs.internalLinks?.length > 0 && (
        <Section title="Internal Links">
          <div className="space-y-2">
            {seoOutputs.internalLinks.map((l, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2.5 text-xs">
                <p className="text-gray-400 text-[11px] mb-1">Near: "{l.nearCopy?.slice(0, 60)}..."</p>
                <p className="font-medium text-blue-700">"{l.anchorText}"</p>
                <p className="text-gray-500 mt-0.5">→ {l.targetPage}</p>
                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded mt-1 inline-block">{l.linkType}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Image Recommendations */}
      {seoOutputs.imageRecommendations?.length > 0 && (
        <Section title="Image Recommendations">
          <div className="space-y-2">
            {seoOutputs.imageRecommendations.map((img, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2.5 text-xs">
                <p className="font-medium text-gray-800 mb-1">{img.section}</p>
                <p className="text-gray-500">{img.brief}</p>
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-gray-400"><span className="text-gray-600">Alt:</span> {img.altTag}</p>
                  <p className="text-gray-400"><span className="text-gray-600">File:</span> <code>{img.fileName}</code></p>
                  <p className="text-gray-400"><span className="text-gray-600">Size:</span> {img.dimensions} · {img.format}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

const Row = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-gray-400 w-16 shrink-0">{label}</span>
    <span className="text-gray-800">{value}</span>
  </div>
)
