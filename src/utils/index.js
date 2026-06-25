// ─────────────────────────────────────────────────────────────
// utils/index.js
// Pure helper functions — no React, no Three.js imports.
// ─────────────────────────────────────────────────────────────

/**
 * Convert degrees to radians.
 * Used when feeding rotation values from the UI (degrees)
 * into Three.js (which expects radians).
 */
export const degToRad = (deg) => (deg * Math.PI) / 180

/**
 * Clamp a number between min and max.
 */
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/**
 * Given a hex colour string (#rrggbb), return true if
 * its perceived luminance is "light" (so we can flip the
 * text colour on the swatch button).
 */
export const isLightColor = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 160
}

/**
 * Truncate a filename to maxLen characters.
 * Keeps the extension visible.
 */
export const truncateFilename = (name, maxLen = 28) => {
  if (name.length <= maxLen) return name
  const ext = name.slice(name.lastIndexOf('.'))
  return name.slice(0, maxLen - ext.length - 1) + '…' + ext
}

/**
 * Format a file-size in bytes into a human-readable string.
 */
export const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
