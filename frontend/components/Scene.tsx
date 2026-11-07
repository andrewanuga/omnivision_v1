"use client";

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshReflectorMaterial, Sparkles } from "@react-three/drei";
import Drone from "./Drone";
import { scroll, ss } from "@/lib/progress";

/** Damps scroll progress and moves the camera from a low side angle to a top-down view. */
function Rig() {
  useFrame(({ camera, pointer }, dt) => {
    scroll.s = THREE.MathUtils.damp(scroll.s, scroll.p, 3, dt);
    const t = ss(0.38, 0.8, scroll.s);
    camera.position.set(
      pointer.x * 0.4,
      THREE.MathUtils.lerp(1.8, 11, t) + pointer.y * 0.2,
      THREE.MathUtils.lerp(7.5, 0.05, t)
    );
    camera.lookAt(0, THREE.MathUtils.lerp(1.3, 1.5, t), 0);
  });
  return null;
}

function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[60, 60]} />
      <MeshReflectorMaterial
        blur={[400, 100]} resolution={512} mixBlur={1} mixStrength={40} roughness={1}
        depthScale={1.2} minDepthThreshold={0.4} maxDepthThreshold={1.4}
        color="#0c0c0e" metalness={0.6} mirror={0.5}
      />
    </mesh>
  );
}

export default function Scene({ beam, active = true }: { beam: boolean; active?: boolean }) {
  return (
    <Canvas frameloop={active ? "always" : "never"} dpr={[1, 2]} camera={{ fov: 35, position: [0, 1.3, 7.5] }} gl={{ antialias: true }}>
      <color attach="background" args={["#050506"]} />
      <fog attach="fog" args={["#050506", 10, 26]} />
      <Rig />
      <Drone beam={beam} />
      <Floor />
      <Sparkles count={140} scale={[16, 2.5, 10]} position={[0, 1.2, 0]} size={2.2} speed={0.25} opacity={0.7} color="#cfd8e6" />
      <spotLight position={[0, 9, 2]} angle={0.5} penumbra={1} intensity={90} color="#ffffff" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={2} position={[-6, 1.5, 2]} rotation-y={Math.PI / 2} scale={[8, 2, 1]} />
        <Lightformer form="rect" intensity={2} position={[6, 1.5, -2]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>
    </Canvas>
  );
}
