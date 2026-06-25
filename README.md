# 3D Product Configurator

A high-performance, interactive 3D product configurator built with **React**, **Tailwind CSS**, and **React Three Fiber**. Upload your own `.glb` file, then move/rotate/scale it either with an on-canvas gizmo or the slider panel — every model's transform is logged to a separate, exportable JSON file.

## Features

- 🎯 **Local file upload** — drag-and-drop or click-to-browse `.glb` files, no server required
- 🧠 **Memory-safe pipeline** — blob URLs are created and revoked correctly, no leaks
- 🕹️ **On-canvas gizmo** — draggable move/rotate/scale handles directly on the uploaded model, synced live with the slider panel (Drei's `<TransformControls>`)
- ⌨️ **Keyboard shortcuts** — W / E / R switch the gizmo between Move / Rotate / Scale, matching common DCC-tool conventions
- 🎨 **Live material editing** — color presets, custom color picker, metalness/roughness sliders, wireframe toggle
- 📐 **Full transform controls** — Position X/Y/Z, Rotation X/Y/Z (degrees), Scale X/Y/Z with uniform-lock
- 💾 **JSON transform history** — every uploaded model's position/rotation/scale/material is logged and can be exported to a standalone `.json` file, then re-imported later to restore state
- 💡 **Realistic lighting** — HDR environment map (`city` preset), soft contact shadows, three-point lighting rig
- 🖱️ **Bounded orbit camera** — can't clip inside the model, can't zoom out to infinity, and auto-disables while the gizmo is being dragged
- ⏳ **Loading feedback** — live percentage while the GLTF binary is parsed
- ⚪ **Flat white / black UI** — no gradients, glow, or dark panels

## Project structure

```
3d-configurator/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx                   # React entry point
    ├── App.jsx                    # Root component — wires hooks to UI, gizmo↔slider bridge
    ├── index.css                  # Tailwind imports + custom slider styling
    ├── constants/
    │   └── index.js               # Color presets, defaults, scale presets
    ├── utils/
    │   ├── index.js               # degToRad, clamp, isLightColor, formatBytes...
    │   └── transformRecord.js     # JSON record schema + download/parse helpers
    ├── hooks/
    │   ├── useModelUrl.js         # blob URL create/revoke lifecycle
    │   ├── useTransform.js        # position/rotation/scale + gizmo mode/enabled state
    │   ├── useMaterial.js         # color/metalness/roughness/wireframe state
    │   └── useTransformHistory.js # per-model JSON log: track / export / import
    └── components/
        ├── Viewport.jsx           # Canvas wrapper, HUD overlay, gizmo-mode badge, empty state
        ├── Scene.jsx               # Lights, Environment, ContactShadows, OrbitControls, gizmo wiring
        ├── GLTFModel.jsx           # useGLTF loader + material/transform patching, forwards group ref
        ├── TransformGizmo.jsx      # Wraps Drei <TransformControls>, syncs drag → React state
        ├── Loader.jsx              # Suspense fallback with progress %
        ├── Dashboard.jsx           # Right-side scrollable panel container
        ├── UploadZone.jsx          # Drag-and-drop / click-to-browse file input
        ├── TransformPanel.jsx      # Gizmo mode/on-off toggle + Position/Rotation/Scale sliders
        ├── MaterialPanel.jsx       # Color/Metalness/Roughness/Wireframe UI
        ├── HistoryPanel.jsx        # Export/Import JSON, logged-models list
        └── ui.jsx                  # Shared primitives: SliderRow, Vec3Control, etc.
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open the printed local URL (usually http://localhost:5173)
```

## Build for production

```bash
npm run build
npm run preview   # serve the production build locally
```

## How the local-file-to-WebGL pipeline works

1. **File intercept** — `UploadZone` validates the file extension and hands the raw `File` object to `useModelUrl().handleFile`.
2. **Blob URL creation** — `URL.createObjectURL(file)` generates a temporary `blob://...` URL that points directly at the file's bytes in browser memory. No network request, no server upload.
3. **GLTF parsing** — that blob URL is passed into `useGLTF(url)` (Drei), which internally drives Three.js's `GLTFLoader`. Because `GLTFModel` is wrapped in `<Suspense>`, React shows `<Loader>` (with live progress %) until parsing completes.
4. **Centering** — Drei's `<Center>` computes the bounding box of the loaded scene and re-pivots it to world origin, so models with off-center pivots (common from Blender exports) still display correctly.
5. **Material patch** — a `useEffect` in `GLTFModel` calls `scene.traverse()` on every render where color/metalness/roughness/wireframe changes, walking every mesh and updating its `MeshStandardMaterial`, then sets `needsUpdate = true` to push changes to the GPU.
6. **Transform patch** — position/rotation/scale are applied imperatively to a wrapping `<group ref>` via `groupRef.current.position.set(...)` etc., converting rotation degrees to radians with `THREE.MathUtils.degToRad`.
7. **Memory cleanup** — `useModelUrl` keeps a ref to the previous blob URL. On every new upload (and on unmount), it calls `URL.revokeObjectURL(prevUrl)` plus `useGLTF.clear(prevUrl)` to free both the browser's memory and Drei's internal GLTF cache.

## How the on-canvas gizmo works

Once a `.glb` is uploaded, an interactive gizmo appears directly on the model in the viewport — draggable arrows for **Move**, rings for **Rotate**, boxes for **Scale**.

1. **Forwarding the model's group** — `GLTFModel` is wrapped in `forwardRef`. It exposes its inner `<group ref={groupRef}>` (the same object that carries position/rotation/scale) up to `Scene` via `useImperativeHandle`, and calls an `onReady` callback once that ref is actually attached.
2. **Attaching the gizmo** — `Scene` waits for that `onReady` signal (refs alone don't trigger re-renders, so this flag is what tells `Scene` it's safe to mount `<TransformGizmo>`), then passes the group ref into `TransformGizmo`, which renders Drei's `<TransformControls object={modelGroup} mode={gizmoMode} />`.
3. **Avoiding orbit-camera conflicts** — `TransformGizmo` listens for the gizmo's `mouseDown` / `mouseUp` events. On `mouseDown` it disables `OrbitControls` (via a ref) so dragging a handle doesn't also spin the camera; on `mouseUp` it re-enables orbiting.
4. **Live sync back to React** — while dragging, the gizmo's `objectChange` event fires continuously. `TransformGizmo` reads the live `position` / `rotation` / `scale` straight off the Three.js object, converts rotation radians back to degrees, and calls `onTransformChange(...)`, which in `App.jsx` feeds into the same `transform.applyTransform()` bulk setter used to restore JSON records. This means the slider panel, the on-canvas HUD, and the JSON transform-history log all update live as you drag — no separate code path.
5. **Preventing the slider effect from fighting the drag** — a shared `isDraggingRef` flag (created in `Scene`, passed down to both `GLTFModel` and `TransformGizmo`) is set `true` on `mouseDown` and `false` on `mouseUp`. `GLTFModel`'s slider-driven `useEffect` checks this flag and skips writing to the group while it's `true`, so Three.js (via the gizmo) remains the single source of truth during an active drag.
6. **Mode switching** — the Transform panel has Move / Rotate / Scale buttons (and an on/off toggle for the gizmo itself), or you can press **W / E / R** anywhere outside a text input.

## How the JSON transform history works

Every model you upload gets its own record, keyed by filename:

```json
{
  "version": 1,
  "exportedAt": "2026-06-17T10:22:31.000Z",
  "models": [
    {
      "fileName": "chair.glb",
      "fileSize": 482931,
      "firstLoadedAt": "2026-06-17T10:20:01.000Z",
      "lastModifiedAt": "2026-06-17T10:21:48.000Z",
      "position": [0, 0.5, 0],
      "rotation": [0, 45, 0],
      "scale": [1, 1, 1],
      "material": { "color": "#e8eaf0", "metalness": 0.6, "roughness": 0.3, "wireframe": false }
    }
  ]
}
```

- **Live tracking** — as you drag any Position / Rotation / Scale / Material slider, *or* drag the on-canvas gizmo, `useTransformHistory.updateActive()` patches that model's record in memory and refreshes `lastModifiedAt`.
- **Export** — the "Transform history" panel's **Export .json** button calls `downloadJson()`, which serialises every tracked record and triggers a real browser file download (a separate `.json` file, not embedded in the app's own state).
- **Import** — **Import .json** reads a previously exported file back in via `FileReader.readAsText`, parses it, and merges its records into the in-memory log.
- **Restore on re-upload** — if you re-upload a `.glb` whose filename matches an existing record (from this session or an imported file), the app automatically restores that model's saved position, rotation, scale, and material instead of resetting to defaults.
- **Per-model controls** — each entry in the history list shows its last-known P/R/S values and can be removed individually; the whole log can also be cleared at once.

## Customization

- Add more color presets in `src/constants/index.js` → `COLOR_PRESETS`
- Change the environment HDRI in `src/components/Scene.jsx` → `<Environment preset="..." />` (`city`, `sunset`, `studio`, `warehouse`, `forest`, `dawn`, `night`)
- Adjust transform bounds (min/max sliders) in `src/components/TransformPanel.jsx`
- Change the exported filename by passing a custom name to `history.exportHistory('my-file.json')`
- Adjust gizmo handle size or snapping in `src/components/TransformGizmo.jsx` → `size` / `rotationSnap` / `translationSnap` props on `<TransformControls>`
- Adjust the white/black theme in `tailwind.config.js` → `theme.extend.colors.surface` / `accent`

## Requirements

- Node.js 18+
- A modern browser with WebGL2 support
