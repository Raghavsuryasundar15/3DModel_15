// ─────────────────────────────────────────────────────────────
// components/TransformGizmo.jsx
//
// Wraps Drei's <TransformControls> — the actual on-canvas gizmo
// with draggable arrows (translate), rings (rotate), and boxes
// (scale) — and attaches it to the uploaded model's group.
//
// RESPONSIBILITIES:
//   1. Attach to the model's THREE.Group via `object={modelRef}`.
//   2. Switch handle type based on `mode` ('translate' | 'rotate' | 'scale').
//   3. While dragging, disable OrbitControls so the two don't
//      fight over mouse input — re-enable on release.
//   4. On every change during a drag, read the live transform off
//      the object and push it into React state so the slider panel
//      stays in sync with the gizmo in real time.
//   5. Force every gizmo handle to render IN FRONT of the model,
//      regardless of which part of the mesh is closer to the
//      camera — see "ALWAYS-ON-TOP RENDERING" below.
//
// This component renders nothing itself if there's no model yet —
// TransformControls needs a valid object to attach to.
//
// ALWAYS-ON-TOP RENDERING:
//   TransformControls builds its own internal THREE.Group full of
//   arrow/ring/box meshes — one per axis, per mode. By default each
//   of those meshes is depth-tested against everything else in the
//   scene, including the uploaded model. That means if a handle's
//   3D position happens to be behind, inside, or overlapping the
//   mesh from the camera's point of view, the model visually
//   occludes the gizmo, even though you'd expect to always be able
//   to see and grab the handles.
//
//   The fix: walk every mesh inside the gizmo's internal group and
//   set `material.depthTest = false` (skip the depth comparison
//   entirely — always draw it) plus `renderOrder` higher than the
//   model's, so the gizmo is guaranteed to draw after — and
//   therefore on top of — the model in the same frame.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import { useThree }          from '@react-three/fiber'
import { TransformControls } from '@react-three/drei'
import * as THREE             from 'three'

/**
 * @param {object} props
 * @param {object} props.modelRef       ref to the THREE.Group returned by GLTFModel
 * @param {string} props.mode           'translate' | 'rotate' | 'scale'
 * @param {boolean} props.enabled       whether the gizmo is visible/active
 * @param {number[]} props.scale        the model's current [sx, sy, sz] — used to keep the
 *                                       gizmo's on-screen size constant regardless of model scale
 * @param {{ current: boolean }} props.isDraggingRef  shared flag — true while dragging
 * @param {Function} props.onTransformChange  (partial: { position?, rotation?, scale? }) => void
 * @param {object} props.orbitControlsRef     ref to the OrbitControls instance (to toggle .enabled)
 */
export default function TransformGizmo({
  modelRef, mode, enabled, scale, isDraggingRef, onTransformChange, orbitControlsRef,
}) {
  const gizmoRef = useRef()
  const { invalidate } = useThree()

  // Walks the gizmo's internal meshes and forces them to always
  // render on top of the model — see "ALWAYS-ON-TOP RENDERING"
  // above for why this is necessary. Extracted so it can be called
  // both when the mode changes AND defensively on drag-start, in
  // case TransformControls rebuilds its internal mesh group at a
  // point in time this effect didn't catch.
  const forceGizmoOnTop = () => {
    const controls = gizmoRef.current
    if (!controls) return
    controls.traverse((child) => {
      if (!child.isMesh && !child.isLine) return
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach((mat) => {
        if (!mat) return
        mat.depthTest  = false
        mat.depthWrite = false
        mat.needsUpdate = true
      })
      child.renderOrder = 999
    })
  }

  // Re-apply whenever the gizmo (re)attaches or its mode changes —
  // mode changes swap in a different internal mesh group (e.g.
  // translate arrows vs rotate rings), so the newly-created meshes
  // need the same treatment applied again.
  useEffect(() => {
    forceGizmoOnTop()
  }, [mode, enabled])

  // Re-attach / detach the gizmo whenever the target object or
  // mode changes. Drei's TransformControls handles re-render
  // internally via the `object` and `mode` props, but we still
  // need imperative event wiring for drag start/end.
  useEffect(() => {
    const controls = gizmoRef.current
    if (!controls) return

    // ── Drag start: disable orbit so the camera doesn't spin
    //     while the user is trying to move the gizmo handle.
    //     Also re-applies the always-on-top patch as a safety net,
    //     in case TransformControls rebuilt its internal meshes
    //     (e.g. right after a mode switch) after the effect above
    //     already ran. ──
    const handleDragStart = () => {
      isDraggingRef.current = true
      if (orbitControlsRef?.current) orbitControlsRef.current.enabled = false
      forceGizmoOnTop()
    }

    // ── Live update: fires continuously while dragging.
    //     Read the object's current transform and push it up
    //     into React state so the slider panel reflects the
    //     gizmo's movement in real time. ──
    const handleChange = () => {
      const obj = controls.object
      if (!obj) return

      onTransformChange({
        position: [obj.position.x, obj.position.y, obj.position.z],
        rotation: [
          THREE.MathUtils.radToDeg(obj.rotation.x),
          THREE.MathUtils.radToDeg(obj.rotation.y),
          THREE.MathUtils.radToDeg(obj.rotation.z),
        ],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z],
      })
      invalidate()
    }

    // ── Drag end: re-enable orbit ──
    const handleDragEnd = () => {
      isDraggingRef.current = false
      if (orbitControlsRef?.current) orbitControlsRef.current.enabled = true
    }

    controls.addEventListener('mouseDown', handleDragStart)
    controls.addEventListener('objectChange', handleChange)
    controls.addEventListener('mouseUp', handleDragEnd)

    return () => {
      controls.removeEventListener('mouseDown', handleDragStart)
      controls.removeEventListener('objectChange', handleChange)
      controls.removeEventListener('mouseUp', handleDragEnd)
    }
  }, [onTransformChange, isDraggingRef, orbitControlsRef, invalidate])

  // ── Size compensation ────────────────────────────────────
  // TransformControls renders its handles at `size` relative to
  // the attached object's OWN scale — it's parented under the
  // target internally, so the gizmo visually shrinks or grows
  // along with whatever scale the model is currently set to.
  //
  // At the model's default scale (1,1,1), size={0.85} looks right.
  // But once the model is scaled down — e.g. a huge imported GLB
  // that needs scale=[0.01,0.01,0.01] just to fit the viewport —
  // the gizmo shrinks to 1% of that too, collapsing to a handful
  // of pixels. It isn't gone, it's just too small to see or grab.
  //
  // The fix: divide the requested size by the model's current
  // average scale, so the on-screen handle size stays roughly
  // constant no matter how the model is scaled. `scale` comes in
  // as an explicit prop (rather than read off modelRef.current)
  // so this recalculates on every real scale change.
  const BASE_GIZMO_SIZE = 0.85
  // Clamp the compensation itself so pathological scales (e.g. a
  // model accidentally set to scale=0.0001) can't blow the gizmo
  // up to an unusable, screen-filling size.
  const MIN_COMPENSATED_SIZE = 0.3
  const MAX_COMPENSATED_SIZE = 6
  const getCompensatedSize = () => {
    if (!scale) return BASE_GIZMO_SIZE
    const avgScale = (scale[0] + scale[1] + scale[2]) / 3
    // Guard against zero/negative/NaN scale (would otherwise divide
    // by zero or flip the gizmo inside-out).
    if (!avgScale || avgScale <= 0) return BASE_GIZMO_SIZE
    const compensated = BASE_GIZMO_SIZE / avgScale
    return Math.min(MAX_COMPENSATED_SIZE, Math.max(MIN_COMPENSATED_SIZE, compensated))
  }

  // Defensive guard — Scene only renders this once modelRef.current
  // is confirmed attached, but double-check in case of fast unmounts.
  if (!modelRef?.current) return null

  return (
    <TransformControls
      ref={gizmoRef}
      object={modelRef.current}
      mode={mode}
      enabled={enabled}
      visible={enabled}
      size={getCompensatedSize()}
      // Convert degree-based rotation snap into a sensible radian step;
      // translation/scale snapping stays off for free-form dragging.
      rotationSnap={null}
      translationSnap={null}
    />
  )
}
