// ─────────────────────────────────────────────────────────────
// constants/index.js
// Central store for every magic value in the app.
// Keeping them here makes future changes (e.g. tweaking the
// default roughness or adding a preset colour) a one-liner.
// ─────────────────────────────────────────────────────────────

// Colour swatches shown in the Material panel
export const COLOR_PRESETS = [
  { label: 'Chrome',  hex: '#e8eaf0' },
  { label: 'Onyx',   hex: '#1a1a2e' },
  { label: 'Crimson',hex: '#dc2626' },
  { label: 'Cobalt', hex: '#3b82f6' },
  { label: 'Amber',  hex: '#f59e0b' },
  { label: 'Emerald',hex: '#10b981' },
  { label: 'Rose',   hex: '#f43f5e' },
  { label: 'Violet', hex: '#8b5cf6' },
  { label: 'Gold',   hex: '#fbbf24' },
  { label: 'Slate',  hex: '#64748b' },
  { label: 'Coral',  hex: '#fb923c' },
  { label: 'White',  hex: '#ffffff' },
]

// Default values for the material panel
export const DEFAULT_MATERIAL = {
  color:     '#e8eaf0',
  metalness: 0.6,
  roughness: 0.3,
  wireframe: false,
}

// Default values for the transform panel
export const DEFAULT_TRANSFORM = {
  position: [0, 0, 0],   // world units
  rotation: [0, 0, 0],   // degrees (converted to radians before use)
  scale:    [1, 1, 1],   // uniform multiplier per axis
}

// Quick-scale presets
export const SCALE_PRESETS = [0.25, 0.5, 1, 1.5, 2, 3]
