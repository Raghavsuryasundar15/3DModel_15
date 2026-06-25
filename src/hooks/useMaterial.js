// ─────────────────────────────────────────────────────────────
// hooks/useMaterial.js
//
// Tracks the colour, metalness, roughness, and wireframe toggle
// that get applied to the uploaded model's materials.
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { DEFAULT_MATERIAL } from '../constants'

export function useMaterial() {
  const [color,     setColor]     = useState(DEFAULT_MATERIAL.color)
  const [metalness, setMetalness] = useState(DEFAULT_MATERIAL.metalness)
  const [roughness, setRoughness] = useState(DEFAULT_MATERIAL.roughness)
  const [wireframe, setWireframe] = useState(DEFAULT_MATERIAL.wireframe)

  const resetMaterial = useCallback(() => {
    setColor(DEFAULT_MATERIAL.color)
    setMetalness(DEFAULT_MATERIAL.metalness)
    setRoughness(DEFAULT_MATERIAL.roughness)
    setWireframe(DEFAULT_MATERIAL.wireframe)
  }, [])

  /**
   * Apply a full material object at once — used to restore a
   * record loaded from an imported JSON history file.
   */
  const applyMaterial = useCallback((m) => {
    if (!m) return
    if (m.color !== undefined)     setColor(m.color)
    if (m.metalness !== undefined) setMetalness(m.metalness)
    if (m.roughness !== undefined) setRoughness(m.roughness)
    if (m.wireframe !== undefined) setWireframe(m.wireframe)
  }, [])

  return {
    color, setColor,
    metalness, setMetalness,
    roughness, setRoughness,
    wireframe, setWireframe,
    resetMaterial, applyMaterial,
  }
}
