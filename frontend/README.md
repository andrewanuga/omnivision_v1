# Omnivision: 3D scroll landing page
Next.js 14 (App Router) + TypeScript + Tailwind + react-three-fiber.

    npm install
    npm run dev   # http://localhost:3000

The drone is procedural (components/Drone.tsx). To use a real model, put a .glb in /public and load it
with `useGLTF` from @react-three/drei, keeping the yaw/bob logic in `useFrame`.
Copy lives in components/Overlay.tsx. All figures are prototype targets from the PRD, not measured results.
