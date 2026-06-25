// ─────────────────────────────────────────────────────────────
// components/Scene.jsx
//
// Sets up everything that belongs INSIDE the <Canvas>:
//   - Lighting rig (ambient + directional key + rim fill)
//   - Drei <Environment> for HDR image-based lighting (IBL)
//   - Drei <ContactShadows> for a soft floor shadow
//   - Drei <OrbitControls> for mouse orbit / zoom / pan
//   - <TransformGizmo> — the on-canvas move/rotate/scale handles
//   - <Suspense> boundary that shows <Loader> during parse
//   - Conditionally renders <GLTFModel> when a URL is ready
//
// GIZMO WIRING:
//   modelRef    — forwarded out of GLTFModel, points at the
//                 THREE.Group the gizmo attaches to.
//   orbitRef    — the OrbitControls instance. TransformGizmo
//                 disables it while a gizmo handle is being
//                 dragged, so camera-orbit and object-drag don't
//                 fight over the same mouse input.
//   isDraggingRef — shared mutable flag. GLTFModel's slider-driven
//                 useEffect checks this and skips writing to the
//                 group while true, so the gizmo remains the single
//                 source of truth mid-drag.
// ─────────────────────────────────────────────────────────────

import { Suspense, useRef, useState, useEffect }          from 'react'
import { OrbitControls, Environment, ContactShadows }    from '@react-three/drei'
import GLTFModel                                          from './GLTFModel'
import TransformGizmo                                     from './TransformGizmo'
import Loader                                             from './Loader'

/**
 * @param {object}   props
 * @param {string|null} props.modelUrl
 * @param {object}   props.material   { color, metalness, roughness, wireframe }
 * @param {number[]} props.position
 * @param {number[]} props.rotation
 * @param {number[]} props.scale
 * @param {string}   props.gizmoMode     'translate' | 'rotate' | 'scale'
 * @param {boolean}  props.gizmoEnabled
 * @param {Function} props.onGizmoChange  (partial transform) => void — pushes drag values into React state
 */
export default function Scene({
  modelUrl, material, position, rotation, scale,
  gizmoMode, gizmoEnabled, onGizmoChange,
}) {
  // Points at the model's THREE.Group once GLTFModel mounts
  const modelRef = useRef()
  // The OrbitControls instance — toggled off during gizmo drags
  const orbitRef = useRef()
  // Shared flag: true while a gizmo handle is being dragged
  const isDraggingRef = useRef(false)
  // Flips true once GLTFModel's group ref is actually attached —
  // gates the gizmo so it never renders against an empty ref.
  const [modelReady, setModelReady] = useState(false)

  // Reset readiness whenever the URL changes (new upload) so the
  // gizmo disappears until the new model has actually mounted.
  useEffect(() => {
    setModelReady(false)
  }, [modelUrl])

  return (
    <>
      {/* ── Ambient fill — prevents total black shadows ── */}
      <ambientLight intensity={0.35} />

      {/* ── Key light from top-right ── */}
      <directionalLight
        position={[5, 8, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* ── Rim / fill light from opposite side ── */}
      <directionalLight
        position={[-4, 3, -4]}
        intensity={0.5}
        color="#a5b4fc"
      />

      {/* ── HDR environment map for PBR reflections ──
          preset="city" gives chrome-like reflections.
          background={false} is critical: by default Drei renders
          this HDR map as the literal Canvas background, which is
          why the viewport looked dark behind the model. Setting it
          to false keeps the lighting/reflection benefits but lets
          the page's actual white background show through instead.
          Other presets: "sunset", "studio", "warehouse", "forest" ── */}
      <Environment preset="city" background={false} />

      {/* ── Soft contact shadow on the floor plane ── */}
      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.5}
        scale={12}
        blur={2.5}
        far={5}
        resolution={512}
        color="#000000"
      />

      {/* ── Camera controls ──
          enablePan=false keeps users from dragging the model off-screen.
          minDistance / maxDistance prevent clipping inside the mesh.
          ref is captured so the gizmo can disable orbiting mid-drag. ── */}
      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        minDistance={0.5}
        maxDistance={15}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 + 0.1}
        makeDefault
      />

      {/* ── Model — lazy-loaded, shows Loader while parsing ── */}
      <Suspense fallback={<Loader />}>
        {modelUrl && (
          <GLTFModel
            ref={modelRef}
            url={modelUrl}
            color={material.color}
            metalness={material.metalness}
            roughness={material.roughness}
            wireframe={material.wireframe}
            position={position}
            rotation={rotation}
            scale={scale}
            isDraggingRef={isDraggingRef}
            onReady={() => setModelReady(true)}
          />
        )}
      </Suspense>

      {/* ── On-canvas gizmo — only once the model has actually
          mounted and modelRef.current is a real THREE.Group ──
          `scale` is passed explicitly (even though TransformGizmo
          could read it off modelRef.current) so the gizmo's size
          compensation has a real React dependency to react to,
          rather than relying on Scene happening to re-render. ── */}
      {modelUrl && modelReady && gizmoEnabled && (
        <TransformGizmo
          modelRef={modelRef}
          mode={gizmoMode}
          enabled={gizmoEnabled}
          scale={scale}
          isDraggingRef={isDraggingRef}
          onTransformChange={onGizmoChange}
          orbitControlsRef={orbitRef}
        />
      )}
    </>
  )
}
