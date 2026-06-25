// ─────────────────────────────────────────────────────────────
// hooks/useModelUrl.js
//
// Manages the entire lifecycle of a blob:// URL that points to
// a user-uploaded .glb file.
//
// THE PIPELINE:
//   File object (from <input>)
//     → URL.createObjectURL(file)   creates a blob:// URL in RAM
//     → passed as prop into <Canvas>
//     → useGLTF(blobUrl) parses the binary with GLTFLoader
//     → scene graph rendered as <primitive>
//
// MEMORY MANAGEMENT:
//   Every blob URL holds a reference to a chunk of RAM.
//   We MUST call URL.revokeObjectURL() to free it when:
//     1. The user uploads a new file (old URL becomes stale)
//     2. The component unmounts (cleanup in useEffect return)
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'

/**
 * @returns {{
 *   modelUrl: string | null,
 *   fileInfo: { name: string, size: number } | null,
 *   handleFile: (file: File) => void,
 *   clearModel: () => void,
 * }}
 */
export function useModelUrl() {
  const [modelUrl, setModelUrl]   = useState(null)
  const [fileInfo, setFileInfo]   = useState(null)
  // Keep a ref to the PREVIOUS blob URL so we can revoke it
  // after the state update has already fired.
  const prevUrlRef                = useRef(null)

  /**
   * Accept a File object, validate it, generate a blob URL,
   * and revoke the previous one if it exists.
   */
  const handleFile = useCallback((file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.glb')) {
      alert('Only .glb files are supported.')
      return
    }

    // ── Step 1: Revoke the old blob URL (free memory) ──────
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      // Also clear Drei's internal cache so the old geometry
      // is garbage-collected and the new file is re-parsed.
      useGLTF.clear(prevUrlRef.current)
    }

    // ── Step 2: Create a new temporary URL ─────────────────
    // This blob:// URL is valid only in the current browser tab.
    // It is NOT a path on disk — it's a handle to an in-memory
    // copy of the file's bytes.
    const blobUrl = URL.createObjectURL(file)
    prevUrlRef.current = blobUrl

    setModelUrl(blobUrl)
    setFileInfo({ name: file.name, size: file.size })
  }, [])

  /**
   * Clear the current model and free its memory.
   */
  const clearModel = useCallback(() => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
      useGLTF.clear(prevUrlRef.current)
      prevUrlRef.current = null
    }
    setModelUrl(null)
    setFileInfo(null)
  }, [])

  // ── Step 3: Cleanup on unmount ──────────────────────────
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current)
      }
    }
  }, [])

  return { modelUrl, fileInfo, handleFile, clearModel }
}
