// ─────────────────────────────────────────────────────────────
// components/UploadZone.jsx
//
// Provides two ways to load a .glb file:
//   1. Click-to-browse (hidden <input type="file">)
//   2. Drag-and-drop
//
// Calls props.onFile(File) — the parent's handleFile() then
// creates the blob URL and stores it in state.
//
// Styling: white background, black text/borders only.
// ─────────────────────────────────────────────────────────────

import { useRef, useState, useCallback } from 'react'
import { truncateFilename, formatBytes }  from '../utils'

/**
 * @param {object}   props
 * @param {Function} props.onFile   called with a File object
 * @param {object}   props.fileInfo { name, size } | null
 * @param {Function} props.onClear  called when user removes the model
 */
export default function UploadZone({ onFile, fileInfo, onClear }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  // Validate and pass the file up
  const handleFile = useCallback((file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.glb')) {
      alert('Please upload a .glb file.')
      return
    }
    onFile(file)
  }, [onFile])

  // ── Drag-and-drop handlers ──────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = ()  => setDragging(false)
  const onDrop      = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }, [handleFile])

  return (
    <div className="flex flex-col gap-3">
      {/* ── Drop target ── */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-6
          flex flex-col items-center justify-center gap-2.5
          transition-all duration-200 bg-white
          ${dragging
            ? 'border-black bg-black/[0.03]'
            : 'border-black/20 hover:border-black/40'
          }
        `}
      >
        {/* Upload icon */}
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center border
          transition-colors duration-200
          ${dragging ? 'bg-black border-black' : 'bg-white border-black/15'}
        `}>
          <svg className={`w-5 h-5 transition-colors ${dragging ? 'text-white' : 'text-black'}`}
            fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <p className="text-black text-sm font-medium text-center relative z-10">
          Drop your <span className="font-semibold">.glb</span> file here
        </p>
        <p className="text-black/50 text-xs relative z-10">or click to browse your files</p>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept=".glb"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {/* ── Loaded file badge ── */}
      {fileInfo && (
        <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2.5 border border-black/15">
          {/* File icon */}
          <div className="w-8 h-8 rounded-md bg-white border border-black/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-black text-xs font-medium truncate">
              {truncateFilename(fileInfo.name)}
            </p>
            <p className="text-black/50 text-[10px] font-mono mt-0.5">
              {formatBytes(fileInfo.size)}
            </p>
          </div>
          {/* Status dot */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-black" />
            <span className="text-black text-[10px]">loaded</span>
          </div>
          {/* Remove button */}
          <button
            onClick={(e) => { e.stopPropagation(); onClear() }}
            className="ml-1 text-black/50 hover:text-black transition-colors"
            title="Remove model"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
