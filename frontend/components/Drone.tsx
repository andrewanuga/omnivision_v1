"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { scroll, ss } from "@/lib/progress";

const dark = { color: "#16171b", metalness: 0.9, roughness: 0.3 } as const;

function Rotor({ x, dir }: { x: number; dir: number }) {
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (blades.current) blades.current.rotation.y += dt * 38 * dir; });
  return (
    <group position={[x, 0, 0]}>
      <mesh><cylinderGeometry args={[0.13, 0.16, 0.2, 24]} /><meshStandardMaterial {...dark} /></mesh>
      <group ref={blades} position={[0, 0.13, 0]}>
        {[0, Math.PI / 2].map((r) => (
          <mesh key={r} rotation-y={r}>
            <boxGeometry args={[1.25, 0.012, 0.09]} />
            <meshStandardMaterial color="#c9ced8" metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 0.13, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.64, 40]} />
        <meshBasicMaterial color="#9fb4cc" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function Drone({ beam }: { beam: boolean }) {
  const group = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Group>(null);

  useFrame(({ clock, pointer }) => {
    const g = group.current;
    if (!g) return;
    const p = scroll.s;
    const top = ss(0.4, 0.8, p);
    g.rotation.y = THREE.MathUtils.lerp(0.2, 1.1, ss(0, 0.8, p)) + pointer.x * 0.15;
    g.rotation.x = THREE.MathUtils.lerp(0.14, 0, top) - pointer.y * 0.05;
    g.rotation.z = Math.sin(clock.elapsedTime * 0.9) * 0.025;
    g.position.y = 1.5 + Math.sin(clock.elapsedTime * 1.3) * 0.06;
    if (scan.current) {
      scan.current.scale.setScalar(THREE.MathUtils.lerp(scan.current.scale.x, beam ? 1 : 0.001, 0.08));
    }
  });

  return (
    <group ref={group} scale={1.25}>
      {/* body */}
      <mesh scale={[1.25, 0.4, 0.85]}>
        <sphereGeometry args={[0.55, 48, 32]} />
        <meshPhysicalMaterial color="#0b0c0f" metalness={0.9} roughness={0.25} clearcoat={1} envMapIntensity={1.5} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, 0.02, 0]}>
        <torusGeometry args={[0.66, 0.014, 12, 80]} />
        <meshBasicMaterial color="#e6f0ff" toneMapped={false} />
      </mesh>
      {/* arms + rotors */}
      {[45, 135, 225, 315].map((deg, i) => (
        <group key={deg} rotation-y={(deg * Math.PI) / 180}>
          <mesh position={[0.65, 0, 0]}><boxGeometry args={[1.1, 0.05, 0.11]} /><meshStandardMaterial {...dark} /></mesh>
          <Rotor x={1.2} dir={i % 2 ? 1 : -1} />
        </group>
      ))}
      {/* camera gimbal */}
      <group position={[0.18, -0.26, 0]}>
        <mesh><sphereGeometry args={[0.2, 32, 24]} /><meshStandardMaterial color="#101114" metalness={0.8} roughness={0.35} /></mesh>
        <mesh position={[0.13, -0.06, 0]}><sphereGeometry args={[0.1, 24, 16]} /><meshBasicMaterial color="#7cc4ff" toneMapped={false} /></mesh>
      </group>
      {/* scan beam */}
      <group ref={scan} position={[0.18, -0.4, 0]}>
        <mesh position={[0, -0.55, 0]}>
          <coneGeometry args={[0.95, 1.1, 48, 1, true]} />
          <meshBasicMaterial color="#8fd0ff" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -1.12, 0]} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.85, 0.95, 64]} />
          <meshBasicMaterial color="#bfe3ff" transparent opacity={0.6} toneMapped={false} />
        </mesh>
        <pointLight color="#8fd0ff" intensity={5} distance={4} position={[0, -0.9, 0]} />
      </group>
    </group>
  );
}
