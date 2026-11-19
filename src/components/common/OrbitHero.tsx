import { useEffect, useState, type CSSProperties } from "react";
import { moduleClusters, type ModuleKey } from "../../data/moduleClusters";

/** Vòng lặp khép kín: Seed → Lumen → Atlas → Orion → Pulse → Haven → Seed, Nexus ở tâm. */
const ORDER: ModuleKey[] = ["seed", "lumen", "atlas", "orion", "pulse", "haven"];

const GLYPH: Record<ModuleKey, string> = {
  seed: "M12 20v-8M12 13c0-4 3-6 7-6 0 4-3 6-7 6zM12 15c0-3-2-5-6-5 0 3 2 5 6 5z",
  lumen: "M12 3a6 6 0 0 0-3.2 11V17h6.4v-3A6 6 0 0 0 12 3zM9.5 20.5h5",
  atlas: "M3.5 12h17M12 3.5c3.2 3.4 3.2 13.6 0 17M12 3.5c-3.2 3.4-3.2 13.6 0 17M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z",
  orion: "M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z",
  pulse: "M3 12h4l2.2-6 4 12 2.2-6H21",
  haven: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  nexus: "M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6z",
};

const CX = 300, CY = 310, R = 205, NODE = 33;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export default function OrbitHero({ isAdmin = false }: { isAdmin?: boolean }) {
  const [active, setActive] = useState<ModuleKey>("seed");
  const reduced = useReducedMotion();
  const byKey = (k: ModuleKey) => moduleClusters.find((m) => m.key === k)!;
  const pts = ORDER.map((k, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return { k, a, x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
  });
  const idx = ORDER.indexOf(active);
  const cur = byKey(active);
  const canOpen = active !== "nexus" || isAdmin;
  const hue = { "--hue": `var(--m-${active})` } as CSSProperties;

  function Node({ k, x, y, r, lx, ly }: { k: ModuleKey; x: number; y: number; r: number; lx: number; ly: number }) {
    const m = byKey(k);
    const on = active === k;
    return (
      <g
        className={`cla-orbit__node${on ? " is-on" : ""}`}
        style={{ "--c": `var(--m-${k})` } as CSSProperties}
        tabIndex={0}
        role="button"
        aria-pressed={on}
        aria-label={`${m.name}: ${m.tagline}`}
        onMouseEnter={() => setActive(k)}
        onFocus={() => setActive(k)}
        onClick={() => setActive(k)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setActive(k))}
      >
        <circle className="halo" cx={x} cy={y} r={r + 16} />
        <circle className="disc" cx={x} cy={y} r={r} />
        <g transform={`translate(${x - 14} ${y - 14}) scale(1.17)`}>
          <path className="glyph" d={GLYPH[k]} />
        </g>
        <text x={lx} y={ly}>{m.name.split(" ")[0]}</text>
      </g>
    );
  }

  return (
    <section className="cla-orbit" aria-labelledby="cla-orbit-title" style={hue}>
      <div className="cla-orbit__copy">
        <h2 id="cla-orbit-title">Một vòng lặp, mọi quyết định có bằng chứng</h2>
        <p>Chạm vào một module để xem nó nhận gì và trả lại gì cho cả vòng.</p>
        <div className="cla-orbit__info" aria-live="polite">
          <h3>{cur.name}</h3>
          <strong>{cur.tagline}</strong>
          <p>{cur.description}</p>
          {canOpen ? (
            <a className="cla-orbit__open" href={cur.href}>Mở {cur.name}</a>
          ) : (
            <span className="cla-orbit__note">Chỉ quản trị viên mở được Nexus.</span>
          )}
        </div>
      </div>

      <svg className="cla-orbit__svg" viewBox="0 0 600 620" role="group" aria-label="Vòng lặp 7 module của CLA">
        <circle className="cla-orbit__outer" cx={CX} cy={CY} r={R + 64} />
        {pts.map((p, i) => {
          const q = pts[(i + 1) % 6];
          const lit = idx >= 0 && (i === idx || (i + 1) % 6 === idx);
          return <path key={p.k} className={`seg${lit ? " on" : ""}`} d={`M${p.x} ${p.y}A${R} ${R} 0 0 1 ${q.x} ${q.y}`} />;
        })}
        {pts.map((p) => (
          <line key={p.k} className={`spoke${active === "nexus" || active === p.k ? " on" : ""}`} x1={CX} y1={CY} x2={p.x} y2={p.y} />
        ))}
        <path id="cla-orbit-loop" fill="none" d={`M${CX + R} ${CY}A${R} ${R} 0 1 1 ${CX - R} ${CY}A${R} ${R} 0 1 1 ${CX + R} ${CY}`} />
        <circle className="packet" r="4" cx={reduced ? CX + R : undefined} cy={reduced ? CY : undefined}>
          {!reduced && (
            <animateMotion dur="16s" repeatCount="indefinite" rotate="auto">
              <mpath href="#cla-orbit-loop" />
            </animateMotion>
          )}
        </circle>
        {pts.map((p) => (
          <Node key={p.k} k={p.k} x={p.x} y={p.y} r={NODE} lx={p.x + Math.cos(p.a) * 58} ly={p.y + Math.sin(p.a) * 58 + 5} />
        ))}
        <circle className="core-ring" cx={CX} cy={CY} r="46" />
        <circle className="core-ring is-inner" cx={CX} cy={CY} r="31" />
        <Node k="nexus" x={CX} y={CY} r={22} lx={CX} ly={CY + 68} />
      </svg>
    </section>
  );
}
