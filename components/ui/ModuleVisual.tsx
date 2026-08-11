"use client";

import { motion } from "framer-motion";
import type { ModuleId } from "@/lib/content";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * A bespoke visual per subject module. Each one shows what the module actually
 * does — a virtual lab readout, a data model, a chronology, a story graph, a
 * fabrication pipeline — rather than a generic decorative shape.
 */
export function ModuleVisual({ id, accent }: { id: ModuleId; accent: string }) {
  const reduced = usePrefersReducedMotion();
  const props = { accent, reduced };

  switch (id) {
    case "physics":
      return <PhysicsVisual {...props} />;
    case "mathematics":
      return <MathVisual {...props} />;
    case "history":
      return <HistoryVisual {...props} />;
    case "literature":
      return <LiteratureVisual {...props} />;
    case "technology":
      return <TechnologyVisual {...props} />;
  }
}

type V = { accent: string; reduced: boolean };

const shell =
  "relative aspect-16/11 w-full overflow-hidden rounded-2xl bg-ink-950 ring-1 ring-white/10";

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-ink-950 to-transparent px-4 pt-8 pb-3.5">
      <span className="text-[0.68rem] font-medium tracking-wide text-white/55">{children}</span>
    </div>
  );
}

/* ---------------------------- Physics ---------------------------- */
function PhysicsVisual({ accent, reduced }: V) {
  return (
    <div className={shell}>
      <svg viewBox="0 0 400 275" className="absolute inset-0 size-full">
        <rect width="400" height="275" fill="#04060f" />
        <g stroke="#ffffff" strokeOpacity="0.05">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="275" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 40} x2="400" y2={i * 40} />
          ))}
        </g>

        {/* pendulum rig */}
        <line x1="80" y1="34" x2="240" y2="34" stroke={accent} strokeWidth="2.5" opacity="0.8" />
        <motion.g
          style={{ originX: "160px", originY: "34px" }}
          animate={reduced ? {} : { rotate: [-26, 26, -26] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <line x1="160" y1="34" x2="160" y2="150" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.4" />
          <circle cx="160" cy="156" r="13" fill={accent} opacity="0.9" />
          <circle cx="160" cy="156" r="20" fill={accent} opacity="0.16" />
        </motion.g>

        {/* live readout */}
        <g transform="translate(258 52)">
          <rect width="112" height="86" rx="9" fill="#ffffff" fillOpacity="0.05" stroke="#ffffff" strokeOpacity="0.12" />
          <text x="12" y="22" fill="#ffffff" fillOpacity="0.4" fontSize="8" fontFamily="monospace">
            ДАТЧИК · ПЕРИОД
          </text>
          <text x="12" y="46" fill={accent} fontSize="21" fontFamily="monospace" fontWeight="600">
            1.42 s
          </text>
          <motion.rect
            x="12"
            y="58"
            height="4"
            rx="2"
            fill={accent}
            initial={{ width: 22 }}
            animate={reduced ? { width: 62 } : { width: [22, 88, 40, 70, 22] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <text x="12" y="78" fill="#ffffff" fillOpacity="0.3" fontSize="8" fontFamily="monospace">
            ARDUINO · A0
          </text>
        </g>

        {/* trace */}
        <motion.path
          d="M20 232 Q 60 196 100 232 T 180 232 T 260 232 T 340 232"
          fill="none"
          stroke={accent}
          strokeWidth="2"
          strokeOpacity="0.75"
          strokeDasharray="500"
          animate={reduced ? { strokeDashoffset: 0 } : { strokeDashoffset: [500, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
        />
        <line x1="20" y1="256" x2="380" y2="256" stroke="#ffffff" strokeOpacity="0.14" />
      </svg>
      <Caption>Виртуалды зертхана · PhET симуляциясы және Arduino датчигі</Caption>
    </div>
  );
}

/* -------------------------- Mathematics -------------------------- */
function MathVisual({ accent, reduced }: V) {
  const bars = [38, 62, 47, 78, 58, 90, 71];
  return (
    <div className={shell}>
      <svg viewBox="0 0 400 275" className="absolute inset-0 size-full">
        <rect width="400" height="275" fill="#04060f" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="34"
            y1={44 + i * 40}
            x2="378"
            y2={44 + i * 40}
            stroke="#ffffff"
            strokeOpacity="0.07"
          />
        ))}

        {bars.map((h, i) => (
          <motion.rect
            key={i}
            x={50 + i * 46}
            width="24"
            rx="5"
            fill={accent}
            fillOpacity={0.35 + (i % 3) * 0.2}
            initial={{ height: 0, y: 204 }}
            whileInView={{ height: h * 1.75, y: 204 - h * 1.75 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: reduced ? 0 : i * 0.07, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}

        {/* trend line over the bars */}
        <motion.path
          d={bars.map((h, i) => `${i === 0 ? "M" : "L"}${62 + i * 46} ${204 - h * 1.75 - 10}`).join(" ")}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.75"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, delay: 0.4, ease: "easeOut" }}
        />
        {bars.map((h, i) => (
          <circle key={`d${i}`} cx={62 + i * 46} cy={204 - h * 1.75 - 10} r="3" fill="#ffffff" />
        ))}

        <line x1="34" y1="204" x2="378" y2="204" stroke="#ffffff" strokeOpacity="0.2" />
        <text x="34" y="30" fill="#ffffff" fillOpacity="0.4" fontSize="8.5" fontFamily="monospace">
          ҚАЛА БЮДЖЕТІ · 7 КЕЗЕҢДІК БОЛЖАМ
        </text>
      </svg>
      <Caption>Деректерді талдау · Excel және GeoGebra қаржылық моделі</Caption>
    </div>
  );
}

/* ---------------------------- History ---------------------------- */
function HistoryVisual({ accent, reduced }: V) {
  const nodes = [
    { x: 58, label: "VI ғ." },
    { x: 138, label: "XIII ғ." },
    { x: 218, label: "XVIII ғ." },
    { x: 298, label: "XX ғ." },
    { x: 360, label: "Бүгін" },
  ];
  return (
    <div className={shell}>
      <svg viewBox="0 0 400 275" className="absolute inset-0 size-full">
        <rect width="400" height="275" fill="#04060f" />

        {/* stylised route */}
        <motion.path
          d="M30 190 C 90 120, 150 210, 210 140 S 330 100, 380 150"
          fill="none"
          stroke={accent}
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeDasharray="6 7"
          animate={reduced ? {} : { strokeDashoffset: [0, -130] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* contour "map" */}
        <g stroke={accent} strokeOpacity="0.12" fill="none">
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx="150" cy="150" rx={54 + i * 30} ry={30 + i * 17} />
          ))}
        </g>

        {/* timeline */}
        <line x1="34" y1="236" x2="378" y2="236" stroke="#ffffff" strokeOpacity="0.16" />
        {nodes.map((n, i) => (
          <g key={n.label}>
            <motion.circle
              cx={n.x}
              cy="236"
              r="5"
              fill={i === nodes.length - 1 ? accent : "#04060f"}
              stroke={accent}
              strokeWidth="2"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}
            />
            <text
              x={n.x}
              y="256"
              fill="#ffffff"
              fillOpacity="0.42"
              fontSize="8.5"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {n.label}
            </text>
          </g>
        ))}

        <text x="34" y="30" fill="#ffffff" fillOpacity="0.4" fontSize="8.5" fontFamily="monospace">
          ҰЛЫ ЖІБЕК ЖОЛЫ · ЦИФРЛЫҚ БАҒЫТ
        </text>
      </svg>
      <Caption>Интерактивті таймлайн · цифрлық мұрағат және AR туры</Caption>
    </div>
  );
}

/* --------------------------- Literature -------------------------- */
function LiteratureVisual({ accent, reduced }: V) {
  const chars = [
    { x: 200, y: 66, r: 20, label: "Кейіпкер" },
    { x: 92, y: 142, r: 15, label: "Дос" },
    { x: 308, y: 138, r: 16, label: "Қарсылас" },
    { x: 150, y: 210, r: 13, label: "Ұстаз" },
    { x: 272, y: 214, r: 12, label: "Жыршы" },
  ];
  return (
    <div className={shell}>
      <svg viewBox="0 0 400 275" className="absolute inset-0 size-full">
        <rect width="400" height="275" fill="#04060f" />

        {/* relationship edges */}
        <g stroke={accent} strokeOpacity="0.3" strokeWidth="1.5">
          <line x1="200" y1="66" x2="92" y2="142" />
          <line x1="200" y1="66" x2="308" y2="138" />
          <line x1="92" y1="142" x2="150" y2="210" />
          <line x1="308" y1="138" x2="272" y2="214" />
          <motion.line
            x1="92"
            y1="142"
            x2="308"
            y2="138"
            strokeDasharray="5 6"
            strokeOpacity="0.5"
            animate={reduced ? {} : { strokeDashoffset: [0, -110] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          />
        </g>

        {chars.map((c, i) => (
          <motion.g
            key={c.label}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <circle cx={c.x} cy={c.y} r={c.r + 7} fill={accent} fillOpacity="0.08" />
            <circle cx={c.x} cy={c.y} r={c.r} fill={accent} fillOpacity="0.22" stroke={accent} strokeWidth="1.6" />
            {/* Kazakh role names are longer than the node radius, so the label
                sits under the node instead of inside it. */}
            <text
              x={c.x}
              y={c.y + c.r + 17}
              fill="#ffffff"
              fillOpacity="0.8"
              fontSize="9.5"
              textAnchor="middle"
            >
              {c.label}
            </text>
          </motion.g>
        ))}

        <text x="34" y="28" fill="#ffffff" fillOpacity="0.4" fontSize="8.5" fontFamily="monospace">
          КЕЙІПКЕРЛЕР КАРТАСЫ · ҚАҚТЫҒЫС ҚҰРЫЛЫМЫ
        </text>
      </svg>
      <Caption>Цифрлық әңгімелеу · комикс, аудиокітап, шығармашылық жазу</Caption>
    </div>
  );
}

/* --------------------------- Technology -------------------------- */
function TechnologyVisual({ accent, reduced }: V) {
  const steps = ["Tinkercad", "Слайс", "3D басып", "Құрастыру"];
  return (
    <div className={shell}>
      <svg viewBox="0 0 400 275" className="absolute inset-0 size-full">
        <rect width="400" height="275" fill="#04060f" />

        {/* printer gantry */}
        <rect x="118" y="52" width="164" height="118" rx="8" fill="none" stroke="#ffffff" strokeOpacity="0.16" />
        <motion.line
          x1="118"
          x2="282"
          stroke={accent}
          strokeWidth="2.5"
          initial={{ y1: 150, y2: 150 }}
          animate={reduced ? { y1: 120, y2: 120 } : { y1: [150, 78, 150], y2: [150, 78, 150] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.rect
          y="112"
          width="20"
          height="14"
          rx="3"
          fill={accent}
          initial={{ x: 136 }}
          animate={reduced ? { x: 190 } : { x: [136, 244, 160, 244, 136] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* growing print bed object */}
        <motion.rect
          x="164"
          width="72"
          rx="3"
          fill={accent}
          fillOpacity="0.4"
          initial={{ height: 0, y: 166 }}
          whileInView={{ height: 34, y: 132 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />
        <line x1="140" y1="168" x2="260" y2="168" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="2.5" />

        {/* pipeline */}
        {steps.map((s, i) => (
          <g key={s} transform={`translate(${28 + i * 92} 206)`}>
            <motion.rect
              width="76"
              height="28"
              rx="7"
              fill={accent}
              fillOpacity="0.12"
              stroke={accent}
              strokeOpacity="0.4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
            <text x="38" y="18" fill="#ffffff" fillOpacity="0.75" fontSize="9" textAnchor="middle">
              {s}
            </text>
            {i < steps.length - 1 && (
              <path d="M80 14h10" stroke={accent} strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </g>
        ))}

        <text x="34" y="30" fill="#ffffff" fillOpacity="0.4" fontSize="8.5" fontFamily="monospace">
          ЭКО-РОБОТ · ПРОТОТИП ЖОЛЫ
        </text>
      </svg>
      <Caption>Цифрлық өндіріс · Tinkercad, 3D басып шығару, лазерлік кесу, робототехника</Caption>
    </div>
  );
}
