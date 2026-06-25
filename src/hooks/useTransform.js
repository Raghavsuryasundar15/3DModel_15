// ─────────────────────────────────────────────────────────────
// hooks/useTransform.js
//
// Manages position / rotation / scale state for the 3D model,
// plus the on-canvas gizmo's mode and visibility.
// Exposes helpers for:
//   - setting individual axes
//   - toggling uniform-scale lock
//   - quick scale presets
//   - resetting to defaults
//   - applying a full transform at once (gizmo drag or JSON restore)
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { DEFAULT_TRANSFORM } from '../constants'

export function useTransform() {
  const [position,     setPosition]     = useState(DEFAULT_TRANSFORM.position)
  const [rotation,     setRotation]     = useState(DEFAULT_TRANSFORM.rotation)
  const [scale,        setScale]        = useState(DEFAULT_TRANSFORM.scale)
  const [uniformScale, setUniformScale] = useState(true)

  // ── On-canvas gizmo state ──
  // gizmoMode:    which TransformControls handle is active
  // gizmoEnabled: whether the gizmo is shown over the model at all
  const [gizmoMode,    setGizmoMode]    = useState('translate') // 'translate' | 'rotate' | 'scale'
  const [gizmoEnabled, setGizmoEnabled] = useState(true)

  /**
   * Update a single axis of position or rotation.
   * @param {Function} setter - setPosition or setRotation
   * @param {0|1|2}    axis   - index (0=X, 1=Y, 2=Z)
   * @param {number}   value
   */
  const setAxis = useCallback((setter) => (axis, value) => {
    setter((prev) => {
      const next = [...prev]
      next[axis]  = value
      return next
    })
  }, [])

  const setPositionAxis = setAxis(setPosition)
  const setRotationAxis = setAxis(setRotation)

  /**
   * Update scale. If uniform-scale lock is on, mirror the
   * changed axis value to all three axes.
   */
  const setScaleAxis = useCallback((axis, value) => {
    if (uniformScale) {
      setScale([value, value, value])
    } else {
      setScale((prev) => {
        const next = [...prev]
        next[axis]  = value
        return next
      })
    }
  }, [uniformScale])

  /** Apply a uniform scale preset to all three axes. */
  const applyScalePreset = useCallback((v) => {
    setScale([v, v, v])
  }, [])

  /** Reset everything to the default transform. */
  const resetTransforms = useCallback(() => {
    setPosition([...DEFAULT_TRANSFORM.position])
    setRotation([...DEFAULT_TRANSFORM.rotation])
    setScale([...DEFAULT_TRANSFORM.scale])
  }, [])

  /**
   * Apply a full transform at once. Used both to:
   *   - restore a record loaded from an imported JSON history file
   *   - sync slider state with the on-canvas gizmo while it's being dragged
   */
  const applyTransform = useCallback(({ position: p, rotation: r, scale: s }) => {
    if (p) setPosition([...p])
    if (r) setRotation([...r])
    if (s) setScale([...s])
  }, [])

  return {
    position, rotation, scale, uniformScale,
    setPositionAxis, setRotationAxis, setScaleAxis,
    setUniformScale, applyScalePreset, resetTransforms, applyTransform,
    gizmoMode, setGizmoMode, gizmoEnabled, setGizmoEnabled,
  }
}
