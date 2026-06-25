// ─────────────────────────────────────────────────────────────
// components/GLTFModel.jsx
//
// THE CORE 3D COMPONENT.
// This must live INSIDE <Canvas> so it has access to the
// WebGL rendering context.
//
// WHAT IT DOES:
//   1. Calls useGLTF(url) — Drei's hook wraps Three.js
//      GLTFLoader, which fetches + parses the binary.
//      Because the URL is a blob://, no network request is made;
//      the browser reads straight from RAM.
//
//   2. Traverses scene.traverse() to find every mesh and
//      patch its material with the values coming from React UI.
//
//   3. Wraps the scene in a <group ref> that carries the
//      position / rotation / scale set by the transform panel
//      AND that the on-canvas gizmo (<TransformControls>) grabs
//      onto directly.
//
//   4. Wraps everything in <Center> so the model sits at
//      world origin regardless of where its pivot was in Blender.
//
// GIZMO / SLIDER SYNC:
//   While the gizmo is being dragged, Three.js is mutating
//   groupRef.current's position/rotation/scale directly every
//   frame. If the slider-driven useEffect below also tried to
//   write to the same object on every render, it would fight
//   the drag and snap the model back. The `isDraggingRef` flag
//   (passed down from Scene/Viewport) tells this effect to skip
//   writing while a drag is in progress — the gizmo is the single
//   source of truth during that window, and its onChange callback
//   is what keeps the React slider state in sync instead.
// ─────────────────────────────────────────────────────────────

import { forwardRef, useRef, useEffect, useImperativeHandle } from 'react'
import { useGLTF, Center }   from '@react-three/drei'
import { degToRad }          from '../utils'

/**
 * @param {object} props
 * @param {string}   props.url        blob:// URL from URL.createObjectURL()
 * @param {string}   props.color      hex colour string
 * @param {number}   props.metalness  0–1
 * @param {number}   props.roughness  0–1
 * @param {boolean}  props.wireframe
 * @param {number[]} props.position   [x, y, z] in world units
 * @param {number[]} props.rotation   [rx, ry, rz] in DEGREES
 * @param {number[]} props.scale      [sx, sy, sz] multipliers
 * @param {{ current: boolean }} props.isDraggingRef  true while the gizmo is mid-drag
 * @param {Function} props.onReady  called once the group ref is attached and ready for the gizmo
 * @param {object} ref  forwarded — exposes the THREE.Group the gizmo should attach to
 */
const GLTFModel = forwardRef(function GLTFModel({
  url,
  color, metalness, roughness, wireframe,
  position, rotation, scale,
  isDraggingRef,
  onReady,
}, ref) {
  // ── useGLTF ────────────────────────────────────────────────
  // Returns { scene, nodes, materials, animations }.
  // `scene` is the root THREE.Group of the parsed GLTF.
  // Drei caches by URL, so re-renders don't re-parse the binary.
  const { scene } = useGLTF(url)

  // Ref to the outer <group> that carries transforms.
  // This is the SAME object the gizmo attaches to — forwarded
  // up to the parent via useImperativeHandle so <TransformControls>
  // can grab it.
  const groupRef = useRef()
  useImperativeHandle(ref, () => groupRef.current, [])

  // Tell the parent (Scene) once the group actually exists, so it
  // knows it's safe to render <TransformGizmo object={modelRef.current} />.
  // Refs don't trigger re-renders on their own, so without this signal
  // Scene would render the gizmo one frame too early with an empty ref.
  useEffect(() => {
    if (groupRef.current) onReady?.()
  }, [scene]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Material patch ─────────────────────────────────────────
  // Runs whenever any material property changes.
  // scene.traverse walks the entire scene graph depth-first.
  useEffect(() => {
    if (!scene) return

    scene.traverse((child) => {
      if (!child.isMesh) return

      // A mesh can have a single material OR an array of materials
      const mats = Array.isArray(child.material)
        ? child.material
        : [child.material]

      mats.forEach((mat) => {
        if (!mat) return

        // Only patch PBR-capable materials
        if (
          mat.isMeshStandardMaterial ||
          mat.isMeshPhysicalMaterial
        ) {
          mat.color.set(color)
          mat.metalness  = metalness
          mat.roughness  = roughness
          mat.wireframe  = wireframe
          // Tell Three.js to re-upload this material to the GPU
          mat.needsUpdate = true
        } else if (mat.isMeshBasicMaterial) {
          // Basic materials don't have PBR props, but can be coloured
          mat.color.set(color)
          mat.wireframe  = wireframe
          mat.needsUpdate = true
        }
      })

      // Ensure shadow casting / receiving for every mesh
      child.castShadow    = true
      child.receiveShadow = true
    })
  }, [scene, color, metalness, roughness, wireframe])

  // ── Transform patch (slider → 3D) ──────────────────────────
  // Applied imperatively via the group ref so we don't trigger
  // a re-render just to move the model.
  //
  // Guarded by isDraggingRef: while the gizmo is being dragged,
  // Three.js owns the transform every frame, so we skip writing
  // here to avoid fighting the drag. Once the drag ends, the
  // gizmo's onChange has already pushed the final values into
  // React state, so this effect re-runs with matching numbers
  // and is a no-op in practice.
  useEffect(() => {
    if (!groupRef.current) return
    if (isDraggingRef?.current) return

    const [px, py, pz] = position
    const [rx, ry, rz] = rotation
    const [sx, sy, sz] = scale

    groupRef.current.position.set(px, py, pz)
    groupRef.current.rotation.set(
      degToRad(rx),
      degToRad(ry),
      degToRad(rz)
    )
    groupRef.current.scale.set(sx, sy, sz)
  }, [position, rotation, scale, isDraggingRef])

  // <Center> computes the bounding box of its children and
  // re-pivots them to world origin — works regardless of where
  // the original GLTF pivot was set.
  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  )
})

export default GLTFModel
