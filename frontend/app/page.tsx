"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import Overlay from "@/components/Overlay";
import Sections from "@/components/Sections";
import { clamp01, scroll } from "@/lib/progress";

const Scene = dynamic(() => import("@/components/Scene"), { ssr: false });

export default function Page() {
  const [p, setP] = useState(0);
  const [beam, setScanBeam] = useState(true);
  const [active, setActive] = useState(true);
  const intro = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      // Progress is measured over the 3D intro only, so the scene transition is unchanged
      // no matter how much content follows it.
      const el = intro.current;
      const max = el ? el.offsetHeight - window.innerHeight : 0;
      scroll.p = max > 0 ? clamp01(window.scrollY / max) : 0;
      const visible = el ? window.scrollY < el.offsetHeight : true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setP(scroll.p);
        setActive(visible);
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main className="relative">
      <Nav beam={beam} onToggle={() => setScanBeam((t) => !t)} />
      <section ref={intro} className="relative h-[500vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="absolute inset-0 z-0"><Scene beam={beam} active={active} /></div>
          <Overlay p={p} />
        </div>
      </section>
      <Sections />
    </main>
  );
}
