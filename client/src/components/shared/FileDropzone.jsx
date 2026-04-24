import { useDropzone } from 'react-dropzone'

export default function FileDropzone({ onDrop, accept, multiple = true, label, sublabel, compact = false }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, multiple })

  // Compact: used for process doc — slightly taller to show filename
  if (compact) {
    return (
      <div
        {...getRootProps()}
        className={`border border-dashed rounded-lg px-3 py-2 cursor-pointer text-center text-xs transition-colors
          ${isDragActive ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
      >
        <input {...getInputProps()} />
        <span className={isDragActive ? 'text-indigo-500' : 'text-slate-400'}>
          {isDragActive ? 'Drop here…' : label}
        </span>
      </div>
    )
  }

  // Default: slim single-line attach button
  return (
    <div
      {...getRootProps()}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer transition-colors text-xs
        ${isDragActive
          ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
          : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
    >
      <input {...getInputProps()} />
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
      </svg>
      <span>{isDragActive ? 'Drop files…' : 'Attach files'}</span>
      {sublabel && <span className="text-slate-300">·</span>}
      {sublabel && <span className="text-slate-300">{sublabel}</span>}
    </div>
  )
}
