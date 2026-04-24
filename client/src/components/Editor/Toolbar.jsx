import { useRef } from 'react'
import useBlogStore from '../../store/useBlogStore.js'

const Btn = ({ onClick, active, title, children, disabled }) => (
  <button
    onMouseDown={e => { e.preventDefault(); onClick() }}
    disabled={disabled}
    title={title}
    className={`px-2 py-1 rounded text-sm transition-colors ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} disabled:opacity-30`}
  >
    {children}
  </button>
)

const Sep = () => <div className="w-px h-5 bg-gray-200 mx-1" />

export default function Toolbar({ editor }) {
  const uploadImage = useBlogStore(s => s.uploadImage)
  const fileRef = useRef()

  if (!editor) return null

  async function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const image = await uploadImage(file)
    if (image) editor.chain().focus().setImage({ src: image.url, alt: image.filename }).run()
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50 flex-wrap">
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="H1">H1</Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="H2">H2</Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="H3">H3</Btn>
      <Sep />
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></Btn>
      <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">`</Btn>
      <Sep />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">• —</Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">1.</Btn>
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">"</Btn>
      <Sep />
      <Btn onClick={() => {
        const url = window.prompt('Enter URL:')
        if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
      }} active={editor.isActive('link')} title="Link">🔗</Btn>
      <Btn onClick={() => {
        fileRef.current?.click()
      }} title="Upload image">🖼</Btn>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <Sep />
      <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}>↩</Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}>↪</Btn>
    </div>
  )
}
