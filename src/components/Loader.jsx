// ─────────────────────────────────────────────────────────────
// components/Loader.jsx
//
// Shown inside the Canvas via Drei's <Html> while useGLTF is
// still parsing the binary.  useProgress() gives us the live
// percentage from the Three.js LoadingManager.
// ─────────────────────────────────────────────────────────────

import { Html, useProgress } from '@react-three/drei'

export default function Loader() {
  const { progress } = useProgress()

  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 select-none pointer-events-none">
        {/* Spinning ring */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-black/15" />
          <div className="absolute inset-0 rounded-full border-2 border-t-black animate-spin" />
        </div>

        {/* Percentage */}
        <span className="text-black text-sm font-mono tracking-widest">
          {Math.round(progress)}%
        </span>

        <span className="text-black/50 text-xs tracking-wide">
          Parsing geometry…
        </span>
      </div>
    </Html>
  )
}
