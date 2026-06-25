// ─────────────────────────────────────────────────────────────
// App.jsx
//
// Root component. Owns no business logic itself — composes the
// custom hooks (model URL, transform, material, transform-history)
// and wires their state into <Viewport> and <Dashboard>.
//
// Split-screen layout:
//   - Viewport  (flex-[6]  → 60%) — full-bleed 3D canvas
//   - Dashboard (flex-[4]  → 40%) — scrollable config panel
//
// ON-CANVAS GIZMO:
//   Once a model is uploaded, an interactive gizmo (Drei's
//   <TransformControls>) appears directly on the model in the
//   viewport — draggable arrows for move, rings for rotate, boxes
//   for scale. Dragging it calls handleGizmoChange(), which feeds
//   the live values into the SAME transform state the sliders use
//   (via transform.applyTransform), so the gizmo and the slider
//   panel are always in sync no matter which one the user touches.
//
// TRANSFORM HISTORY:
//   Every model that gets uploaded is logged into a separate
//   in-memory record (see hooks/useTransformHistory.js), keyed by
//   filename. As the user drags position/rotation/scale/material —
//   whether via sliders or the on-canvas gizmo — that model's
//   record is patched live. The full log can be exported to a
//   standalone .json file at any time, and a previously exported
//   file can be re-imported to restore state.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react'
import { useModelUrl }          from './hooks/useModelUrl'
import { useTransform }         from './hooks/useTransform'
import { useMaterial }          from './hooks/useMaterial'
import { useTransformHistory }  from './hooks/useTransformHistory'

import Viewport      from './components/Viewport'
import Dashboard      from './components/Dashboard'

export default function App() {
  // ── Model file → blob URL lifecycle ──
  const { modelUrl, fileInfo, handleFile, clearModel } = useModelUrl()

  // ── Transform state (position / rotation / scale) ──
  const transform = useTransform()

  // ── Material state (color / metalness / roughness / wireframe) ──
  const {
    color, setColor,
    metalness, setMetalness,
    roughness, setRoughness,
    wireframe, setWireframe,
    resetMaterial, applyMaterial,
  } = useMaterial()

  const material = { color, metalness, roughness, wireframe }
  const matActions = { setColor, setMetalness, setRoughness, setWireframe, resetMaterial, applyMaterial }

  // ── Transform history log (separate JSON-serialisable record per model) ──
  const history = useTransformHistory()

  // Skip the very first history patch that fires right after a new
  // upload resets transforms — that reset is already captured by
  // startTracking(), so re-patching it again would just be noise.
  const justStartedRef = useRef(false)

  // ── Keyboard shortcuts for gizmo mode (W/E/R, matching common
  //    DCC-tool conventions) — only active once a model is loaded,
  //    and ignored while typing in an input/number field. ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modelUrl) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'w' || e.key === 'W') transform.setGizmoMode('translate')
      if (e.key === 'e' || e.key === 'E') transform.setGizmoMode('rotate')
      if (e.key === 'r' || e.key === 'R') transform.setGizmoMode('scale')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl])

  // ── Gizmo → React state bridge ──
  // TransformGizmo calls this continuously while a handle is being
  // dragged in the viewport. It reuses applyTransform() (the same
  // bulk setter used to restore a saved JSON record) so the slider
  // panel — and, downstream, the transform-history log — stays in
  // sync with whatever the user just dragged on the model.
  const handleGizmoChange = useCallback((partial) => {
    transform.applyTransform(partial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When the model is cleared, also reset transforms/material
  // so a fresh upload always starts from a clean slate.
  const handleClear = () => {
    clearModel()
    transform.resetTransforms()
    resetMaterial()
    history.stopTracking()
  }

  const handleNewFile = (file) => {
    handleFile(file)

    // If this filename was logged before (in this session, or via
    // an imported .json history file), restore its saved transform
    // and material instead of resetting to defaults.
    const existing = history.getRecord(file.name)
    if (existing) {
      transform.applyTransform(existing)
      matActions.applyMaterial(existing.material)
      history.startTracking(file.name, file.size, existing, existing.material)
    } else {
      transform.resetTransforms()
      resetMaterial()
      history.startTracking(
        file.name, file.size,
        { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        { color: '#e8eaf0', metalness: 0.6, roughness: 0.3, wireframe: false }
      )
    }
    // Swallow the transform/material useEffect that fires right after
    // this — it would otherwise immediately re-patch the record with
    // values read from stale closures.
    justStartedRef.current = true
  }

  // Live-patch the active model's record whenever transform or
  // material values change (but not on the very first render
  // right after startTracking already wrote the same values).
  useEffect(() => {
    if (justStartedRef.current) {
      justStartedRef.current = false
      return
    }
    if (!fileInfo) return
    history.updateActive({
      position: transform.position,
      rotation: transform.rotation,
      scale: transform.scale,
      material,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transform.position, transform.rotation, transform.scale, material])

  return (
    <div className="flex h-screen w-screen bg-white text-black overflow-hidden font-sans">
      <Viewport
        modelUrl={modelUrl}
        fileName={fileInfo?.name}
        material={material}
        position={transform.position}
        rotation={transform.rotation}
        scale={transform.scale}
        gizmoMode={transform.gizmoMode}
        gizmoEnabled={transform.gizmoEnabled}
        onGizmoChange={handleGizmoChange}
      />

      <Dashboard
        modelUrl={modelUrl}
        fileInfo={fileInfo}
        handleFile={handleNewFile}
        clearModel={handleClear}
        material={material}
        matActions={matActions}
        transform={transform}
        history={history}
        activeFileName={fileInfo?.name ?? null}
      />
    </div>
  )
}
