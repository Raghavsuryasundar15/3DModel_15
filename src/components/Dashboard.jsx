// ─────────────────────────────────────────────────────────────
// components/Dashboard.jsx
//
// The right 40% of the layout.
// Scrollable configuration sidebar containing:
//   - App header
//   - UploadZone
//   - TransformPanel  (visible after upload)
//   - MaterialPanel   (visible after upload)
//   - HistoryPanel    (always visible — export/import JSON log)
//   - Tips footer
// ─────────────────────────────────────────────────────────────

import UploadZone     from './UploadZone'
import TransformPanel from './TransformPanel'
import MaterialPanel  from './MaterialPanel'
import HistoryPanel   from './HistoryPanel'

/**
 * @param {object}   props
 * @param {object}   props.modelUrl
 * @param {object}   props.fileInfo
 * @param {Function} props.handleFile
 * @param {Function} props.clearModel
 * @param {object}   props.material
 * @param {object}   props.matActions  { setColor, setMetalness, setRoughness, setWireframe, resetMaterial }
 * @param {object}   props.transform   { position, rotation, scale, uniformScale, ... }
 * @param {object}   props.history     return value of useTransformHistory()
 * @param {string|null} props.activeFileName
 */
export default function Dashboard({
  modelUrl, fileInfo, handleFile, clearModel,
  material, matActions,
  transform,
  history, activeFileName,
}) {
  const {
    position, rotation, scale, uniformScale,
    setPositionAxis, setRotationAxis, setScaleAxis,
    setUniformScale, applyScalePreset, resetTransforms,
    gizmoMode, setGizmoMode, gizmoEnabled, setGizmoEnabled,
  } = transform

  return (
    <div className="
      flex-[4] h-full flex flex-col
      border-l border-black/10
      bg-white
      overflow-y-auto
    ">
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 border-b border-black/10 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-black" />
          <span className="text-[10px] text-black tracking-[0.25em] uppercase font-medium">
            3D Configurator
          </span>
        </div>
        <h1 className="text-xl font-semibold text-black tracking-tight">Model Studio</h1>
        <p className="text-black/50 text-xs mt-1 leading-relaxed">
          Upload a .glb file — configure transforms &amp; materials in real time.
        </p>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col gap-4 px-5 py-5 flex-1">

        {/* Upload zone — always visible */}
        <section>
          <SectionLabel icon="↑" text="Model file" />
          <UploadZone
            onFile={handleFile}
            fileInfo={fileInfo}
            onClear={clearModel}
          />
        </section>

        {/* Controls — only after a model is loaded */}
        {modelUrl && (
          <>
            <TransformPanel
              position={position}
              rotation={rotation}
              scale={scale}
              uniformScale={uniformScale}
              setPositionAxis={setPositionAxis}
              setRotationAxis={setRotationAxis}
              setScaleAxis={setScaleAxis}
              setUniformScale={setUniformScale}
              applyScalePreset={applyScalePreset}
              resetTransforms={resetTransforms}
              gizmoMode={gizmoMode}
              setGizmoMode={setGizmoMode}
              gizmoEnabled={gizmoEnabled}
              setGizmoEnabled={setGizmoEnabled}
            />

            <MaterialPanel
              color={material.color}
              metalness={material.metalness}
              roughness={material.roughness}
              wireframe={material.wireframe}
              setColor={matActions.setColor}
              setMetalness={matActions.setMetalness}
              setRoughness={matActions.setRoughness}
              setWireframe={matActions.setWireframe}
              resetMaterial={matActions.resetMaterial}
            />
          </>
        )}

        {/* Transform history — always visible so the exported log
            stays accessible even after a model is cleared */}
        <HistoryPanel
          recordList={history.recordList}
          activeFileName={activeFileName}
          onExport={history.exportHistory}
          onImport={history.importHistory}
          onRemove={history.removeRecord}
          onClear={history.clearHistory}
        />

        {/* Footer tips */}
        <div className="mt-auto rounded-xl bg-white border border-black/10 p-4">
          <p className="text-black text-xs font-medium mb-2">Tips</p>
          <ul className="space-y-1 text-[11px] text-black/50">
            <li>• Type exact values in the number boxes for precision</li>
            <li>• Lock Uniform scale to resize without distortion</li>
            <li>• High metalness + low roughness → mirror finish</li>
            <li>• Rotation in degrees — converted to radians internally</li>
            <li>• Supports any Blender / Sketchfab .glb export</li>
            <li>• Export the Transform history panel to save a .json of every model's position, rotation &amp; scale</li>
            <li>• Press W / E / R to switch the gizmo to Move / Rotate / Scale</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Small utility component — keeps Dashboard JSX clean
function SectionLabel({ icon, text }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-black text-xs">{icon}</span>
      <span className="text-[10px] font-semibold text-black uppercase tracking-widest">{text}</span>
    </div>
  )
}
