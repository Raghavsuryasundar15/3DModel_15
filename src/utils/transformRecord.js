// ─────────────────────────────────────────────────────────────
// utils/transformRecord.js
//
// Defines the shape of a single "model record" — the JSON-
// serialisable snapshot of one uploaded model's transform and
// material state — plus helpers to build, validate, and
// download/parse the history file.
//
// FILE FORMAT (separate .json, downloaded by the browser):
// {
//   "version": 1,
//   "exportedAt": "2026-06-17T10:22:31.000Z",
//   "models": [
//     {
//       "fileName": "chair.glb",
//       "fileSize": 482931,
//       "firstLoadedAt": "2026-06-17T10:20:01.000Z",
//       "lastModifiedAt": "2026-06-17T10:21:48.000Z",
//       "position": [0, 0.5, 0],
//       "rotation": [0, 45, 0],
//       "scale": [1, 1, 1],
//       "material": { "color": "#e8eaf0", "metalness": 0.6, "roughness": 0.3, "wireframe": false }
//     }
//   ]
// }
// ─────────────────────────────────────────────────────────────

const SCHEMA_VERSION = 1

/**
 * Build a fresh record for a newly uploaded model.
 */
export function createRecord({ fileName, fileSize, position, rotation, scale, material }) {
  const now = new Date().toISOString()
  return {
    fileName,
    fileSize,
    firstLoadedAt: now,
    lastModifiedAt: now,
    position: [...position],
    rotation: [...rotation],
    scale: [...scale],
    material: { ...material },
  }
}

/**
 * Return a new record with updated transform/material fields
 * and a refreshed lastModifiedAt timestamp.
 */
export function updateRecord(record, patch) {
  return {
    ...record,
    ...patch,
    lastModifiedAt: new Date().toISOString(),
  }
}

/**
 * Wrap an array of records into the full exportable document.
 */
export function buildExportDoc(records) {
  return {
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    models: records,
  }
}

/**
 * Trigger a browser download of the given object as a .json file.
 * Uses the same Blob + URL.createObjectURL pattern as the model
 * upload pipeline, but for writing data OUT instead of reading it in.
 */
export function downloadJson(data, filename = 'model-transforms.json') {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Free the blob URL once the download has been handed to the browser
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Parse + lightly validate an uploaded JSON file's text content.
 * Throws if the shape is unrecognised.
 */
export function parseImportDoc(text) {
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.models)) {
    throw new Error('Invalid transform history file — missing "models" array.')
  }
  return data
}
