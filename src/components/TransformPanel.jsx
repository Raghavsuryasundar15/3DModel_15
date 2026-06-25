// ─────────────────────────────────────────────────────────────
// components/TransformPanel.jsx
//
// UI panel for Position / Rotation / Scale.
// Position and Rotation use Vec3NumberControl — plain typed-number
// fields (no drag slider); the value commits on blur or Enter.
// Scale keeps the drag-slider Vec3Control, plus a "Uniform lock"
// toggle and quick presets.
// ─────────────────────────────────────────────────────────────

import { CollapsibleSection, Vec3Control, Vec3NumberControl, SectionDivider, ResetButton } from './ui'
import { SCALE_PRESETS } from '../constants'

// Transform icon (arrows)
const TransformIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
)

// Gizmo mode icons — translate (move arrows), rotate (orbit ring), scale (corner box)
const MoveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 3v18M3 12h18M5 8l-2 4 2 4M19 8l2 4-2 4M8 5l4-2 4 2M8 19l4 2 4-2" />
  </svg>
)
const RotateIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.5 9.4a4.5 4.5 0 10-1.3 7.5M19 5v4h-4M5 19l3-3" />
    <circle cx="12" cy="12" r="8.5" strokeDasharray="2 2" opacity="0.4" />
  </svg>
)
const ScaleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M4 4h7M4 4v7M4 4l6 6M20 20h-7M20 20v-7M20 20l-6-6" />
    <rect x="9" y="9" width="6" height="6" rx="0.5" />
  </svg>
)

const GIZMO_MODES = [
  { key: 'translate', label: 'Move',   Icon: MoveIcon   },
  { key: 'rotate',    label: 'Rotate', Icon: RotateIcon },
  { key: 'scale',     label: 'Scale',  Icon: ScaleIcon  },
]

/**
 * @param {object}   props
 * @param {number[]} props.position
 * @param {number[]} props.rotation
 * @param {number[]} props.scale
 * @param {boolean}  props.uniformScale
 * @param {Function} props.setPositionAxis  (axisIdx, value) => void
 * @param {Function} props.setRotationAxis  (axisIdx, value) => void
 * @param {Function} props.setScaleAxis     (axisIdx, value) => void
 * @param {Function} props.setUniformScale  (bool) => void
 * @param {Function} props.applyScalePreset (value) => void
 * @param {Function} props.resetTransforms
 * @param {string}   props.gizmoMode        'translate' | 'rotate' | 'scale'
 * @param {Function} props.setGizmoMode
 * @param {boolean}  props.gizmoEnabled
 * @param {Function} props.setGizmoEnabled
 */
export default function TransformPanel({
  position, rotation, scale, uniformScale,
  setPositionAxis, setRotationAxis, setScaleAxis,
  setUniformScale, applyScalePreset, resetTransforms,
  gizmoMode, setGizmoMode, gizmoEnabled, setGizmoEnabled,
}) {
  return (
    <CollapsibleSection
      icon={<TransformIcon />}
      label="Transforms"
      headerRight={<ResetButton onClick={resetTransforms} />}
    >
      {/* ── On-canvas gizmo controls ─────────────────── */}
      <div>
        <div className="flex items-center justify-between">
          <SectionDivider label="Gizmo" />
          {/* Gizmo on/off toggle */}
          <button
            onClick={() => setGizmoEnabled(!gizmoEnabled)}
            className={`
              ml-3 flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border
              transition-all duration-150 flex-shrink-0
              ${gizmoEnabled
                ? 'border-black bg-black text-white'
                : 'border-black/20 text-black hover:border-black/40'
              }
            `}
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {gizmoEnabled ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
            {gizmoEnabled ? 'On' : 'Off'}
          </button>
        </div>

        {/* Mode selector — only meaningful while the gizmo is on */}
        <div className={`flex gap-2 mt-2.5 transition-opacity ${gizmoEnabled ? '' : 'opacity-30 pointer-events-none'}`}>
          {GIZMO_MODES.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setGizmoMode(key)}
              disabled={!gizmoEnabled}
              className={`
                flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium
                border transition-all duration-150
                ${gizmoMode === key
                  ? 'border-black bg-black text-white'
                  : 'border-black/20 text-black hover:border-black/40'
                }
              `}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-black/50 mt-1.5 font-mono">
          Drag the handles directly on the model in the viewport
        </p>
      </div>
      {/* ── Position ─────────────────────────────────── */}
      <div>
        <SectionDivider label="Position" />
        <div className="mt-2.5">
          <Vec3NumberControl
            values={position}
            min={-10}
            max={10}
            step={0.1}
            onChange={setPositionAxis}
          />
        </div>
        <p className="text-[10px] text-black/50 mt-1.5 font-mono">
          Type a value and press Enter or click away to apply
        </p>
      </div>

      {/* ── Rotation ─────────────────────────────────── */}
      <div>
        <SectionDivider label="Rotation (°)" />
        <div className="mt-2.5">
          <Vec3NumberControl
            values={rotation}
            min={-180}
            max={180}
            step={1}
            onChange={setRotationAxis}
            unit="°"
          />
        </div>
        <p className="text-[10px] text-black/50 mt-1.5 font-mono">
          Type a value and press Enter or click away to apply · converted to radians internally
        </p>
      </div>

      {/* ── Scale ────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between">
          <SectionDivider label="Scale" />
          {/* Uniform-lock toggle */}
          <button
            onClick={() => setUniformScale(!uniformScale)}
            className={`
              ml-3 flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md border
              transition-all duration-150 flex-shrink-0
              ${uniformScale
                ? 'border-black bg-black text-white'
                : 'border-black/20 text-black hover:border-black/40'
              }
            `}
          >
            {/* Lock icon */}
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d={uniformScale
                  ? 'M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'
                  : 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'
                }
              />
            </svg>
            {uniformScale ? 'Uniform' : 'Free'}
          </button>
        </div>

        {/* Quick scale presets */}
        <div className="flex gap-1.5 mt-2.5 mb-3">
          {SCALE_PRESETS.map((v) => {
            const active = scale.every((s) => Math.abs(s - v) < 0.001)
            return (
              <button
                key={v}
                onClick={() => applyScalePreset(v)}
                className={`
                  flex-1 py-1 rounded text-[10px] font-mono border transition-all duration-150
                  ${active
                    ? 'border-black bg-black text-white'
                    : 'border-black/20 text-black hover:border-black/40'
                  }
                `}
              >
                ×{v}
              </button>
            )
          })}
        </div>

        <Vec3Control
          values={scale}
          min={0.01}
          max={5}
          step={0.01}
          onChange={setScaleAxis}
        />
      </div>
    </CollapsibleSection>
  )
}
