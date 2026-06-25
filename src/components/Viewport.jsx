// ─────────────────────────────────────────────────────────────
// components/Viewport.jsx
//
// The left 60% of the layout.
// Wraps React Three Fiber's <Canvas> and adds:
//   - Faint light-gray grid background texture
//   - Empty-state prompt when no model is loaded
//   - Live transform HUD in the top-left corner
//   - Filename badge at the bottom
//
// Styling: flat white background, black text only — no gradients,
// no glow, no blur, no colour accents.
// ─────────────────────────────────────────────────────────────

import { Canvas }  from '@react-three/fiber'
import * as THREE  from 'three'
import Scene       from './Scene'

/**
 * @param {object}      props
 * @param {string|null} props.modelUrl
 * @param {string|null} props.fileName
 * @param {object}      props.material
 * @param {number[]}    props.position
 * @param {number[]}    props.rotation
 * @param {number[]}    props.scale
 * @param {string}      props.gizmoMode      'translate' | 'rotate' | 'scale'
 * @param {boolean}     props.gizmoEnabled
 * @param {Function}    props.onGizmoChange  (partial transform) => void
 */
export default function Viewport({
  modelUrl, fileName, material, position, rotation, scale,
  gizmoMode, gizmoEnabled, onGizmoChange,
}) {
  return (
    <div className="relative flex-[6] h-full bg-white overflow-hidden">

      {/* ── Faint dot-grid background — light gray, no colour ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Empty-state ── */}
      {!modelUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none gap-5">
          <div className="w-28 h-28 rounded-3xl border border-black/10 flex items-center justify-center bg-white">
            <svg className="w-12 h-12 text-black/20" fill="none" stroke="currentColor" strokeWidth={0.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-black text-sm tracking-widest uppercase">No model loaded</p>
            <p className="text-black/50 text-xs mt-1">Upload a .glb file from the panel →</p>
          </div>
        </div>
      )}

      {/* ── Transform HUD ── */}
      {modelUrl && (
        <div className="absolute top-4 left-4 z-20 bg-white
          border border-black/15 rounded-xl px-4 py-3 space-y-1 pointer-events-none select-none">
          {[
            { label: 'P', values: position, unit: ''  },
            { label: 'R', values: rotation, unit: '°' },
            { label: 'S', values: scale,    unit: ''  },
          ].map(({ label, values, unit }) => (
            <div key={label} className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono font-bold w-3 text-black">{label}</span>
              <span className="text-[10px] font-mono text-black tabular-nums">
                {values.map((v) => v.toFixed(2)).join('  ')}
                {unit && <span className="text-black/60">{unit}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filename badge ── */}
      {fileName && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20
          px-4 py-2 rounded-full bg-white
          border border-black/15 text-xs text-black font-mono
          flex items-center gap-2 pointer-events-none select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
          {fileName}
        </div>
      )}

      {/* ── Active gizmo mode badge ── */}
      {modelUrl && gizmoEnabled && (
        <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black
          text-white text-[10px] font-mono uppercase tracking-widest
          pointer-events-none select-none">
          {gizmoMode} gizmo
        </div>
      )}

      {/* ── Corner tips ── */}
      <div className="absolute bottom-4 right-4 z-10 text-[10px] text-black/40
        pointer-events-none select-none text-right space-y-0.5">
        <p>Drag handle — {gizmoEnabled ? gizmoMode : 'transform'}</p>
        <p>Drag empty space — orbit</p>
        <p>Scroll — zoom</p>
      </div>

      {/* ── React Three Fiber Canvas ──
          gl settings: ACESFilmic tone mapping gives the model
          a cinematic look; antialias smooths edges.
          The clear colour is set to opaque white in onCreated —
          combined with Environment's background={false}, this is
          what actually fixes the "dark background" issue: without
          it, the Environment's HDR skybox was the only thing
          rendered behind the model. ── */}
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 4], fov: 45 }}
        gl={{
          antialias:           true,
          toneMapping:         THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace:    'srgb',
        }}
        onCreated={({ gl }) => gl.setClearColor('#ffffff', 1)}
        className="relative z-10"
        style={{ width: '100%', height: '100%' }}
      >
        <Scene
          modelUrl={modelUrl}
          material={material}
          position={position}
          rotation={rotation}
          scale={scale}
          gizmoMode={gizmoMode}
          gizmoEnabled={gizmoEnabled}
          onGizmoChange={onGizmoChange}
        />
      </Canvas>
    </div>
  )
}
