// ─────────────────────────────────────────────────────────────
// components/HistoryPanel.jsx
//
// Shows every model that has been loaded this session, with its
// last-known position/rotation/scale, and lets the user:
//   - Export the full log to a standalone .json file
//   - Import a previously exported .json file
//   - Remove a single entry from the log
//   - Clear the whole log
//
// Styling: white background, black text only (matches app theme).
// ─────────────────────────────────────────────────────────────

import { useRef } from 'react'
import { CollapsibleSection, SectionDivider, ResetButton } from './ui'
import { truncateFilename } from '../utils'

// Document/history icon
const HistoryIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 6v6l4 2M21 12a9 9 0 11-9-9 9 9 0 019 9z" />
  </svg>
)

/**
 * @param {object}   props
 * @param {object[]} props.recordList      array of transform records
 * @param {string|null} props.activeFileName  filename currently loaded in the viewport
 * @param {Function} props.onExport
 * @param {Function} props.onImport        (File) => Promise
 * @param {Function} props.onRemove        (fileName) => void
 * @param {Function} props.onClear
 */
export default function HistoryPanel({
  recordList, activeFileName,
  onExport, onImport, onRemove, onClear,
}) {
  const fileInputRef = useRef(null)

  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await onImport(file)
    } catch (err) {
      alert(`Could not import file: ${err.message}`)
    } finally {
      // Reset so the same file can be re-selected later if needed
      e.target.value = ''
    }
  }

  return (
    <CollapsibleSection
      icon={<HistoryIcon />}
      label="Transform history"
      badge={`${recordList.length}`}
      defaultOpen={false}
      headerRight={recordList.length > 0 ? <ResetButton onClick={onClear} label="clear" /> : null}
    >
      {/* ── Export / Import buttons ── */}
      <div>
        <SectionDivider label="JSON file" />
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={() => onExport()}
            disabled={recordList.length === 0}
            className="flex-1 py-2 rounded-lg text-xs font-medium border border-black/20
              text-black hover:border-black/40 transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-black/20
              flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Export .json
          </button>
          <button
            onClick={handleImportClick}
            className="flex-1 py-2 rounded-lg text-xs font-medium border border-black/20
              text-black hover:border-black/40 transition-colors
              flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 13.5l3 3 3-3m-3-9v12M21 16.5v2.25A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V16.5" />
            </svg>
            Import .json
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
        <p className="text-[10px] text-black/50 mt-1.5 font-mono">
          Position, rotation, scale &amp; material are saved per model
        </p>
      </div>

      {/* ── Logged models list ── */}
      <div>
        <SectionDivider label={`Logged models (${recordList.length})`} />
        {recordList.length === 0 ? (
          <p className="text-[11px] text-black/40 mt-2.5">
            No models tracked yet — upload a .glb to begin logging.
          </p>
        ) : (
          <div className="flex flex-col gap-2 mt-2.5">
            {recordList.map((r) => (
              <RecordRow
                key={r.fileName}
                record={r}
                isActive={r.fileName === activeFileName}
                onRemove={() => onRemove(r.fileName)}
              />
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

// ─────────────────────────────────────────────────────────────
// RecordRow — single entry in the history list
// ─────────────────────────────────────────────────────────────
function RecordRow({ record, isActive, onRemove }) {
  const { fileName, position, rotation, scale, lastModifiedAt } = record

  return (
    <div className={`
      rounded-lg border px-3 py-2.5
      ${isActive ? 'border-black bg-black/[0.02]' : 'border-black/10 bg-white'}
    `}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />}
          <p className="text-black text-xs font-medium truncate">
            {truncateFilename(fileName, 22)}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="text-black/40 hover:text-black transition-colors flex-shrink-0"
          title="Remove from history"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-mono text-black/60">
        <span>P {position.map((v) => v.toFixed(1)).join(',')}</span>
        <span>R {rotation.map((v) => v.toFixed(0)).join(',')}°</span>
        <span>S {scale.map((v) => v.toFixed(1)).join(',')}</span>
      </div>

      <p className="text-[9px] text-black/35 mt-1.5 font-mono">
        Updated {new Date(lastModifiedAt).toLocaleTimeString()}
      </p>
    </div>
  )
}
