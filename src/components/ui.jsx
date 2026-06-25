// ─────────────────────────────────────────────────────────────
// components/ui.jsx
//
// Small, reusable UI primitives shared across the dashboard.
// Each is a pure presentational component — no state, no hooks.
//
// Styling rule for this app: white backgrounds only, black text
// only. No gradients, no glow, no translucency, no colour accents.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
// SliderRow — a single labelled range slider + numeric input
// ─────────────────────────────────────────────────────────────
/**
 * @param {object}   props
 * @param {string}   props.label
 * @param {number}   props.value
 * @param {number}   props.min
 * @param {number}   props.max
 * @param {number}   [props.step=0.01]
 * @param {Function} props.onChange
 * @param {string}   [props.unit='']
 */
export function SliderRow({ label, value, min, max, step = 0.01, onChange, unit = '' }) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-black font-medium">{label}</span>
        <span className="text-black font-mono tabular-nums">
          {typeof value === 'number' ? value.toFixed(step < 0.1 ? 2 : 0) : value}{unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-0.5"
          style={{
            background: `linear-gradient(to right, #000000 0%, #000000 ${pct}%, #e5e5e5 ${pct}%, #e5e5e5 100%)`
          }}
        />
        <input
          type="number"
          min={min} max={max} step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-14 text-right text-xs font-mono bg-white border border-black/20
            rounded px-1.5 py-0.5 text-black focus:outline-none focus:border-black
            transition-colors"
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Vec3NumberControl — three plain number-entry fields for a vec3
// property (used for Position / Rotation, where the requirement
// is typed-number entry rather than a drag slider).
//
// Local text state is kept per-field so the user can freely type
// intermediate values like "-", "12.", or an empty string while
// editing, without each keystroke being clobbered by parseFloat.
// The value commits to React state on blur or Enter; an invalid
// or empty entry reverts back to the last valid number.
// ─────────────────────────────────────────────────────────────
/**
 * @param {object}   props
 * @param {number[]} props.values    [x, y, z]
 * @param {number}   [props.min]
 * @param {number}   [props.max]
 * @param {number}   [props.step=0.1]
 * @param {Function} props.onChange  (axisIndex: 0|1|2, value: number) => void
 * @param {string}   [props.unit='']
 */
export function Vec3NumberControl({ values, min, max, step = 0.1, onChange, unit = '' }) {
  const axes = ['X', 'Y', 'Z']

  // Draft text per axis — lets the user type freely (e.g. "-", "12.")
  // before the value commits to React state on blur/Enter.
  const [drafts, setDrafts] = useState(() => values.map((v) => String(v)))

  // Tracks which axis (if any) the user currently has focused, so the
  // sync effect below never overwrites text mid-edit.
  const [editingAxis, setEditingAxis] = useState(null)

  // If the committed value changes from OUTSIDE this component
  // (gizmo drag, reset, JSON restore, preset button), refresh the
  // draft text to match — skipping whichever axis is actively focused.
  useEffect(() => {
    setDrafts((prev) =>
      values.map((v, i) => (i === editingAxis ? prev[i] : String(v)))
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values])

  const clampVal = (v) => {
    if (typeof min === 'number') v = Math.max(min, v)
    if (typeof max === 'number') v = Math.min(max, v)
    return v
  }

  const commit = (axis, rawText) => {
    const parsed = parseFloat(rawText)
    const finalValue = Number.isFinite(parsed) ? clampVal(parsed) : values[axis]
    onChange(axis, finalValue)
    setDrafts((prev) => {
      const next = [...prev]
      next[axis] = String(finalValue)
      return next
    })
    setEditingAxis(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {axes.map((axis, i) => (
        <div key={axis} className="flex items-center gap-2">
          {/* Axis label — plain black text */}
          <span className="text-[11px] font-mono font-bold w-3.5 flex-shrink-0 text-center text-black">
            {axis}
          </span>

          {/* Typed-number field — commits on blur or Enter */}
          <input
            type="number"
            min={min} max={max} step={step}
            value={drafts[i]}
            onFocus={() => setEditingAxis(i)}
            onChange={(e) => {
              const text = e.target.value
              setDrafts((prev) => {
                const next = [...prev]
                next[i] = text
                return next
              })
            }}
            onBlur={(e) => commit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commit(i, e.target.value)
                e.target.blur()
              }
              if (e.key === 'Escape') {
                setDrafts((prev) => {
                  const next = [...prev]
                  next[i] = String(values[i])
                  return next
                })
                setEditingAxis(null)
                e.target.blur()
              }
            }}
            className="flex-1 text-sm font-mono bg-white border border-black/20
              rounded px-2.5 py-1.5 text-black focus:outline-none focus:border-black
              transition-colors"
          />
          {unit && (
            <span className="text-[10px] text-black/60 w-3 flex-shrink-0">{unit}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Vec3Control — three sliders for a vec3 property
// (currently used for Scale). Axis labels are plain text
// (X / Y / Z) — no colour coding, per the white/black-only rule.
// ─────────────────────────────────────────────────────────────
/**
 * @param {object}   props
 * @param {number[]} props.values    [x, y, z]
 * @param {number}   props.min
 * @param {number}   props.max
 * @param {number}   props.step
 * @param {Function} props.onChange  (axisIndex: 0|1|2, value: number) => void
 * @param {string}   [props.unit='']
 */
export function Vec3Control({ values, min, max, step, onChange, unit = '' }) {
  const axes = ['X', 'Y', 'Z']

  return (
    <div className="flex flex-col gap-2.5">
      {axes.map((axis, i) => {
        const pct = ((values[i] - min) / (max - min)) * 100

        return (
          <div key={axis} className="flex items-center gap-2">
            {/* Axis label — plain black text */}
            <span className="text-[11px] font-mono font-bold w-3.5 flex-shrink-0 text-center text-black">
              {axis}
            </span>

            {/* Range slider — flat black fill, light gray track */}
            <input
              type="range"
              min={min} max={max} step={step}
              value={values[i]}
              onChange={(e) => onChange(i, parseFloat(e.target.value))}
              className="flex-1 h-0.5"
              style={{
                background: `linear-gradient(to right, #000000 0%, #000000 ${pct}%, #e5e5e5 ${pct}%, #e5e5e5 100%)`
              }}
            />

            {/* Precise number input */}
            <input
              type="number"
              min={min} max={max} step={step}
              value={values[i]}
              onChange={(e) => onChange(i, parseFloat(e.target.value) || 0)}
              className="w-16 text-right text-[11px] font-mono bg-white border border-black/20
                rounded px-1.5 py-0.5 text-black focus:outline-none focus:border-black
                transition-colors"
            />
            {unit && (
              <span className="text-[10px] text-black/60 w-2 flex-shrink-0">{unit}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// CollapsibleSection — panel with animated expand/collapse
// ─────────────────────────────────────────────────────────────
/**
 * @param {object}       props
 * @param {ReactNode}    props.icon
 * @param {string}       props.label
 * @param {string}       [props.badge]      small tag beside the label
 * @param {boolean}      [props.defaultOpen=true]
 * @param {ReactNode}    props.children
 * @param {ReactNode}    [props.headerRight]  content pinned to the right of the header
 */
export function CollapsibleSection({
  icon, label, badge, defaultOpen = true, children, headerRight
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-black/15 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3
          bg-white hover:bg-black/[0.03] transition-colors text-left"
      >
        <span className="text-black flex-shrink-0">{icon}</span>
        <span className="text-xs font-semibold text-black uppercase tracking-widest flex-1">
          {label}
        </span>
        {badge && (
          <span className="text-[9px] bg-black/10 text-black px-1.5 py-0.5 rounded font-mono">
            {badge}
          </span>
        )}
        {headerRight}
        <svg
          className={`w-3.5 h-3.5 text-black transition-transform duration-200 flex-shrink-0
            ${open ? '' : '-rotate-90'}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Body */}
      {open && (
        <div className="px-4 py-4 bg-white border-t border-black/10 flex flex-col gap-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SectionDivider — thin labelled separator inside a panel
// ─────────────────────────────────────────────────────────────
export function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-[10px] font-semibold text-black uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 border-t border-black/15" />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// ResetButton — small "reset" pill
// ─────────────────────────────────────────────────────────────
export function ResetButton({ onClick, label = 'reset' }) {
  return (
    <button
      onClick={onClick}
      className="text-[10px] font-mono text-black hover:opacity-60
        transition-opacity underline underline-offset-2"
    >
      {label}
    </button>
  )
}
