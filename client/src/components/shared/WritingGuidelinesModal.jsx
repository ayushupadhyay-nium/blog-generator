import { useState } from 'react'

// ── Option chip ────────────────────────────────────────────────────────────
function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        selected
          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
      }`}
    >
      {label}
    </button>
  )
}

// ── Tag input (for forbidden words) ───────────────────────────────────────
function TagInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState('')

  function add() {
    const word = input.trim()
    if (word && !tags.includes(word)) onChange([...tags, word])
    setInput('')
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2.5 border border-slate-200 rounded-xl min-h-[40px] focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white">
      {tags.map(t => (
        <span key={t} className="flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md">
          {t}
          <button onClick={() => onChange(tags.filter(x => x !== t))} className="text-slate-400 hover:text-red-400 ml-0.5">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
        onBlur={add}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-xs outline-none bg-transparent placeholder-slate-300"
      />
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ step, title, description, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
          {step}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="ml-9">{children}</div>
    </div>
  )
}

// ── Build the guidelines text from form state ──────────────────────────────
function buildGuidelines(form) {
  const lines = ['# Writing Guidelines\n']

  // Voice
  lines.push('## Voice & Tone')
  const toneMap = {
    conversational: 'Write like a knowledgeable friend — warm, direct, never stiff.',
    professional:   'Maintain a professional tone: authoritative but accessible.',
    technical:      'Technical precision first. Define jargon on first use.',
    storytelling:   'Lead with narrative. Every point should feel like part of a story.',
  }
  if (form.tone) lines.push(`- ${toneMap[form.tone]}`)

  const formalMap = {
    casual:      'Use contractions freely (it\'s, you\'re, we\'ve). Feels like conversation.',
    semiformal:  'Use contractions where natural. Avoid overly casual slang.',
    formal:      'No contractions. Measured, precise language throughout.',
  }
  if (form.formality) lines.push(`- ${formalMap[form.formality]}`)

  const audienceMap = {
    beginner:      'Assume no prior knowledge. Explain every concept on first mention.',
    intermediate:  'Assume familiarity with basics. Skip 101-level explanations.',
    expert:        'Write peer-to-peer. Skip fundamentals, go deep on nuance.',
  }
  if (form.audience) lines.push(`- ${audienceMap[form.audience]}`)

  if (form.avoidWords.length > 0) {
    lines.push(`- Banned words/phrases: ${form.avoidWords.map(w => `"${w}"`).join(', ')}. Find a sharper alternative.`)
  }
  lines.push('')

  // Structure
  lines.push('## Article Structure')
  const openingMap = {
    stat:    'Open with a surprising or counterintuitive statistic. Source it.',
    question:'Open with a direct question the reader is already asking themselves.',
    claim:   'Open with a bold, specific claim. Justify it within the first paragraph.',
    story:   'Open with a 2–3 sentence micro-story or scene. Ground it in specifics.',
  }
  if (form.opening) lines.push(`- Opening hook: ${openingMap[form.opening]}`)

  if (form.h2Frequency) {
    lines.push(`- Place an H2 every ${form.h2Frequency} words to help scanners navigate.`)
  }

  const closingMap = {
    action:   'End with one concrete action the reader can take immediately.',
    summary:  'End with a 3-bullet TL;DR recap, then a single CTA.',
    question: 'End with an open question that invites the reader to think further.',
  }
  if (form.closing) lines.push(`- Closing: ${closingMap[form.closing]}`)
  lines.push('')

  // Sentences
  lines.push('## Sentences & Paragraphs')
  if (form.sentenceLength) {
    lines.push(`- Max sentence length: ${form.sentenceLength} words. If longer, split it.`)
  }
  if (form.paragraphSentences) {
    lines.push(`- Max ${form.paragraphSentences} sentences per paragraph. Short paragraphs aid scanning.`)
  }

  const voiceMap = {
    active:  'Active voice only. "The team shipped the fix" not "The fix was shipped by the team".',
    mixed:   'Prefer active voice. Passive is acceptable when the subject is unknown or irrelevant.',
  }
  if (form.voice) lines.push(`- ${voiceMap[form.voice]}`)
  lines.push('')

  // Formatting
  lines.push('## Formatting')
  const bulletMap = {
    always:    'Use bullet points for any list of 3+ items.',
    sometimes: 'Use bullets for genuine lists. Avoid fragmenting flowing prose into bullets.',
    never:     'Avoid bullet points. Write in full connected paragraphs.',
  }
  if (form.bullets) lines.push(`- ${bulletMap[form.bullets]}`)

  const boldMap = {
    keyphrases: 'Bold the single most important phrase per section — never full sentences.',
    sparingly:  'Use bold sparingly, only for critical warnings or key terms.',
    none:       'No bold. Let sentence structure carry emphasis.',
  }
  if (form.bold) lines.push(`- ${boldMap[form.bold]}`)

  const exclamationMap = {
    one:  'Maximum one exclamation mark per article. Earn it.',
    none: 'No exclamation marks. Confidence comes from specificity, not punctuation.',
  }
  if (form.exclamation) lines.push(`- ${exclamationMap[form.exclamation]}`)
  lines.push('')

  // SEO
  lines.push('## SEO')
  if (form.keywordPlacement) {
    lines.push(`- Place the primary keyword naturally within the first ${form.keywordPlacement} words.`)
  }
  const densityMap = {
    natural:  'Keyword density: natural. If it sounds forced, rephrase.',
    moderate: 'Keyword density: moderate. Aim for 1–2% — use synonyms and variants.',
  }
  if (form.keywordDensity) lines.push(`- ${densityMap[form.keywordDensity]}`)

  return lines.join('\n')
}

// ── Modal ──────────────────────────────────────────────────────────────────
const DEFAULTS = {
  tone: '', formality: '', audience: '', avoidWords: [],
  opening: '', h2Frequency: '300', closing: '',
  sentenceLength: '20', paragraphSentences: '3', voice: '',
  bullets: '', bold: '', exclamation: '',
  keywordPlacement: '100', keywordDensity: '',
}

export default function WritingGuidelinesModal({ onSave, onClose }) {
  const [form, setForm] = useState(DEFAULTS)
  const [tab, setTab] = useState('guided') // 'guided' | 'raw'
  const [rawText, setRawText] = useState('')
  const [preview, setPreview] = useState(false)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function toggle(key, val) { set(key, form[key] === val ? '' : val) }

  const generated = buildGuidelines(form)

  function handleSave() {
    const text = tab === 'raw' ? rawText.trim() : generated
    if (!text) return
    const file = new File([text], 'guidelines.txt', { type: 'text/plain' })
    onSave([file])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Writing Guidelines</h2>
            <p className="text-xs text-slate-400 mt-0.5">Tell the AI how you write — it'll follow your style every time.</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Guided / Raw tabs */}
            <div className="flex gap-0.5 p-0.5 bg-slate-100 rounded-lg">
              {['guided', 'raw'].map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    tab === t ? 'bg-white text-slate-700 shadow-sm font-medium' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t === 'guided' ? 'Guided' : 'Raw text'}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition-colors p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'guided' && !preview && (
            <div className="p-6 space-y-8">
              {/* 1. Voice & Tone */}
              <Section step="1" title="Voice & Tone" description="How should this blog sound to a reader?">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Writing personality</p>
                    <div className="flex flex-wrap gap-2">
                      {[['conversational', 'Conversational'], ['professional', 'Professional'], ['technical', 'Technical'], ['storytelling', 'Storytelling']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.tone === v} onClick={() => toggle('tone', v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Formality level</p>
                    <div className="flex flex-wrap gap-2">
                      {[['casual', 'Casual'], ['semiformal', 'Semi-formal'], ['formal', 'Formal']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.formality === v} onClick={() => toggle('formality', v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Reader's expertise level</p>
                    <div className="flex flex-wrap gap-2">
                      {[['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['expert', 'Expert']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.audience === v} onClick={() => toggle('audience', v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Words / phrases to never use</p>
                    <TagInput
                      tags={form.avoidWords}
                      onChange={v => set('avoidWords', v)}
                      placeholder='Type a word and press Enter — e.g. "leverage", "synergy"'
                    />
                  </div>
                </div>
              </Section>

              <div className="border-t border-slate-100" />

              {/* 2. Article structure */}
              <Section step="2" title="Article Structure" description="How should each article be framed?">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Opening hook style</p>
                    <div className="flex flex-wrap gap-2">
                      {[['stat', 'Surprising stat'], ['question', 'Direct question'], ['claim', 'Bold claim'], ['story', 'Micro-story']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.opening === v} onClick={() => toggle('opening', v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">H2 section frequency</p>
                    <div className="flex flex-wrap gap-2">
                      {[['200', 'Every 200 words'], ['300', 'Every 300 words'], ['400', 'Every 400 words'], ['500', 'Every 500 words']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.h2Frequency === v} onClick={() => toggle('h2Frequency', v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Article closing</p>
                    <div className="flex flex-wrap gap-2">
                      {[['action', 'Action step'], ['summary', 'TL;DR + CTA'], ['question', 'Open question']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.closing === v} onClick={() => toggle('closing', v)} />
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              <div className="border-t border-slate-100" />

              {/* 3. Sentences */}
              <Section step="3" title="Sentences & Paragraphs" description="Rhythm and length constraints.">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Max words per sentence</p>
                    <div className="flex flex-wrap gap-2">
                      {[['15', '15 words'], ['20', '20 words'], ['25', '25 words'], ['30', '30 words']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.sentenceLength === v} onClick={() => toggle('sentenceLength', v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Max sentences per paragraph</p>
                    <div className="flex flex-wrap gap-2">
                      {[['2', '2 sentences'], ['3', '3 sentences'], ['4', '4 sentences'], ['5', '5 sentences']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.paragraphSentences === v} onClick={() => toggle('paragraphSentences', v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Voice preference</p>
                    <div className="flex flex-wrap gap-2">
                      {[['active', 'Active voice only'], ['mixed', 'Active preferred, passive OK']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.voice === v} onClick={() => toggle('voice', v)} />
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              <div className="border-t border-slate-100" />

              {/* 4. Formatting */}
              <Section step="4" title="Formatting" description="Visual style and emphasis rules.">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Bullet points</p>
                    <div className="flex flex-wrap gap-2">
                      {[['always', 'Use freely'], ['sometimes', 'Use sparingly'], ['never', 'Avoid']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.bullets === v} onClick={() => toggle('bullets', v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Bold text usage</p>
                    <div className="flex flex-wrap gap-2">
                      {[['keyphrases', 'Key phrases only'], ['sparingly', 'Sparingly'], ['none', 'None']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.bold === v} onClick={() => toggle('bold', v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Exclamation marks</p>
                    <div className="flex flex-wrap gap-2">
                      {[['one', 'Max 1 per article'], ['none', 'Never']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.exclamation === v} onClick={() => toggle('exclamation', v)} />
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              <div className="border-t border-slate-100" />

              {/* 5. SEO */}
              <Section step="5" title="SEO Preferences" description="How to handle keywords in the draft.">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Keyword placement</p>
                    <div className="flex flex-wrap gap-2">
                      {[['80', 'Within first 80 words'], ['100', 'Within first 100 words'], ['150', 'Within first 150 words']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.keywordPlacement === v} onClick={() => toggle('keywordPlacement', v)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1.5 uppercase tracking-wide font-medium">Keyword density</p>
                    <div className="flex flex-wrap gap-2">
                      {[['natural', 'Natural — never forced'], ['moderate', 'Moderate — 1–2% with variants']].map(([v, l]) => (
                        <Chip key={v} label={l} selected={form.keywordDensity === v} onClick={() => toggle('keywordDensity', v)} />
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {tab === 'guided' && preview && (
            <div className="p-6">
              <p className="text-xs text-slate-400 mb-3">This is the guidelines document that will be sent to the AI.</p>
              <pre className="text-xs font-mono text-slate-700 bg-slate-50 rounded-xl p-4 leading-relaxed whitespace-pre-wrap border border-slate-100">
                {generated}
              </pre>
            </div>
          )}

          {tab === 'raw' && (
            <div className="p-6 space-y-3">
              <p className="text-xs text-slate-400">
                Paste or type your own guidelines in any format. The AI will read this document directly.
              </p>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={`# Writing Guidelines\n\n## Voice\n- Write like a knowledgeable friend…\n\n## Structure\n- Open with a surprising stat…`}
                rows={18}
                className="input resize-none text-xs font-mono leading-relaxed"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div>
            {tab === 'guided' && (
              <button
                onClick={() => setPreview(p => !p)}
                className="text-xs text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={preview ? 'M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25' : 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z'} />
                </svg>
                {preview ? 'Back to edit' : 'Preview document'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
            <button
              onClick={handleSave}
              disabled={tab === 'raw' ? !rawText.trim() : false}
              className="btn-primary disabled:opacity-40"
            >
              Save Guidelines
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
