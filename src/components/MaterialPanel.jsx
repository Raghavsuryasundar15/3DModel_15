// ─────────────────────────────────────────────────────────────
// components/MaterialPanel.jsx
//
// UI panel for material properties:
//   - 12-colour preset grid + custom colour picker
//   - Metalness slider (0 = plastic, 1 = metal)
//   - Roughness slider (0 = mirror, 1 = matte)
//   - Solid / Wireframe / Flat view mode toggle
// ─────────────────────────────────────────────────────────────

import { CollapsibleSection, SliderRow, SectionDivider, ResetButton } from './ui'
import { COLOR_PRESETS } from '../constants'
import { isLightColor }  from '../utils'

// Brush icon
const MaterialIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
)

const VIEW_MODES = [
  { key: false, label: 'Solid' },
  { key: true,  label: 'Wire'  },
]

/**
 * @param {object}   props
 * @param {string}   props.color
 * @param {number}   props.metalness
 * @param {number}   props.roughness
 * @param {boolean}  props.wireframe
 * @param {Function} props.setColor
 * @param {Function} props.setMetalness
 * @param {Function} props.setRoughness
 * @param {Function} props.setWireframe
 * @param {Function} props.resetMaterial
 */
export default function MaterialPanel({
  color, metalness, roughness, wireframe,
  setColor, setMetalness, setRoughness, setWireframe,
  resetMaterial,
}) {
  return (
    <CollapsibleSection
      icon={<MaterialIcon />}
      label="Material"
      headerRight={<ResetButton onClick={resetMaterial} />}
    >
      {/* ── Colour ──────────────────────────────────── */}
      <div>
        <SectionDivider label="Base colour" />

        {/* 12-colour swatch grid */}
        <div className="grid grid-cols-6 gap-1.5 mt-2.5">
          {COLOR_PRESETS.map((p) => {
            const active = color.toLowerCase() === p.hex.toLowerCase()
            return (
              <button
                key={p.hex}
                title={p.label}
                onClick={() => setColor(p.hex)}
                className={`
                  h-8 rounded-lg border-2 transition-all duration-150 text-[9px] font-medium
                  ${active
                    ? 'border-black scale-110'
                    : 'border-black/15 hover:border-black/40 hover:scale-105'
                  }
                `}
                style={{
                  backgroundColor: p.hex,
                  color: isLightColor(p.hex) ? '#000000' : '#ffffff',
                }}
              >
                {active && (
                  <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>

        {/* Custom colour picker */}
        <div className="flex items-center gap-3 mt-3 bg-white rounded-lg px-3 py-2.5
          border border-black/15">
          <label className="text-black text-xs flex-shrink-0">Custom</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0 flex-shrink-0"
          />
          <span className="font-mono text-xs text-black ml-auto">{color.toUpperCase()}</span>
        </div>
      </div>

      {/* ── PBR sliders ─────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <SectionDivider label="PBR properties" />
        <SliderRow
          label="Metalness"
          value={metalness}
          min={0} max={1} step={0.01}
          onChange={setMetalness}
        />
        <SliderRow
          label="Roughness"
          value={roughness}
          min={0} max={1} step={0.01}
          onChange={setRoughness}
        />
        {/* Visual hint */}
        <div className="flex justify-between text-[9px] text-black/50 font-mono -mt-2">
          <span>← plastic · metal →</span>
          <span>← mirror · matte →</span>
        </div>
      </div>

      {/* ── View mode ───────────────────────────────── */}
      <div>
        <SectionDivider label="View mode" />
        <div className="flex gap-2 mt-2.5">
          {VIEW_MODES.map(({ key, label }) => (
            <button
              key={label}
              onClick={() => setWireframe(key)}
              className={`
                flex-1 py-2 rounded-lg text-xs font-medium border transition-all duration-150
                ${wireframe === key
                  ? 'border-black bg-black text-white'
                  : 'border-black/20 text-black hover:border-black/40'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </CollapsibleSection>
  )
}
