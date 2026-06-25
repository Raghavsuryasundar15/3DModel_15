// ─────────────────────────────────────────────────────────────
// hooks/useTransformHistory.js
//
// Keeps a JSON-serialisable log of every model that has been
// loaded into the app this session, along with the position,
// rotation, scale, and material it was last set to.
//
// Records are keyed by filename. Re-uploading a file with the
// same name updates its existing record's lastModifiedAt rather
// than creating a duplicate, so the log stays one-entry-per-model.
//
// This hook only manages the IN-MEMORY log. Persisting it to an
// actual separate .json file on disk happens via downloadJson()
// in utils/transformRecord.js, triggered from the UI.
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react'
import {
  createRecord, updateRecord, buildExportDoc, downloadJson, parseImportDoc,
} from '../utils/transformRecord'

export function useTransformHistory() {
  // records: { [fileName]: record }
  // Using an object keyed by filename makes "update this model's
  // entry" an O(1) lookup instead of scanning an array every time.
  const [records, setRecords] = useState({})

  // Track which file is currently active so live slider changes
  // know which record to patch.
  const activeFileRef = useRef(null)

  /**
   * Called once when a new model finishes loading.
   * Creates (or revives) the record for this filename.
   */
  const startTracking = useCallback((fileName, fileSize, transform, material) => {
    activeFileRef.current = fileName
    setRecords((prev) => {
      // If this filename was already logged earlier in the session,
      // keep its firstLoadedAt but refresh the live transform values
      // to whatever the panel resets to on a fresh upload.
      const existing = prev[fileName]
      const record = existing
        ? updateRecord(existing, { fileSize, ...transform, material })
        : createRecord({ fileName, fileSize, ...transform, material })

      return { ...prev, [fileName]: record }
    })
  }, [])

  /**
   * Called whenever position/rotation/scale/material changes for
   * the currently active model. Cheap — just patches one record.
   */
  const updateActive = useCallback((patch) => {
    const fileName = activeFileRef.current
    if (!fileName) return
    setRecords((prev) => {
      const existing = prev[fileName]
      if (!existing) return prev
      return { ...prev, [fileName]: updateRecord(existing, patch) }
    })
  }, [])

  /** Stop tracking (e.g. when the model is cleared from the viewport). */
  const stopTracking = useCallback(() => {
    activeFileRef.current = null
  }, [])

  /** Remove a single record from the log entirely. */
  const removeRecord = useCallback((fileName) => {
    setRecords((prev) => {
      const next = { ...prev }
      delete next[fileName]
      return next
    })
  }, [])

  /** Clear the whole history log. */
  const clearHistory = useCallback(() => setRecords({}), [])

  /** Download the full log as a standalone .json file. */
  const exportHistory = useCallback((filename = 'model-transforms.json') => {
    const list = Object.values(records)
    downloadJson(buildExportDoc(list), filename)
  }, [records])

  /**
   * Load a previously exported .json file (a File object from an
   * <input type="file">) and merge its records into the log.
   * Returns a Promise that resolves with the parsed doc.
   */
  const importHistory = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const doc = parseImportDoc(reader.result)
          setRecords((prev) => {
            const next = { ...prev }
            doc.models.forEach((m) => { next[m.fileName] = m })
            return next
          })
          resolve(doc)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }, [])

  /** Look up a stored record by filename — used to restore a transform on re-upload. */
  const getRecord = useCallback((fileName) => records[fileName] ?? null, [records])

  return {
    records,                 // { [fileName]: record }
    recordList: Object.values(records),
    startTracking,
    updateActive,
    stopTracking,
    removeRecord,
    clearHistory,
    exportHistory,
    importHistory,
    getRecord,
  }
}
