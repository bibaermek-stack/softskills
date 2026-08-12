"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";

/**
 * Placeholder imagery is generated rather than stock-photographed: the project
 * has no photo library yet, and invented "photos" of real classrooms would
 * misrepresent the research. Each tile derives a deterministic abstract
 * composition from its title, so the set looks varied but never reshuffles.
 */
const TONES: Record<string, { from: string; via: string; to: string; ink: string }> = {
  cyan: { from: "#0e7490", via: "#0891b2", to: "#22d3ee", ink: "#ecfeff" },
  indigo: { from: "#3730a3", via: "#4f46e5", to: "#818cf8", ink: "#eef2ff" },
  violet: { from: "#5b21b6", via: "#7c3aed", to: "#a78bfa", ink: "#f5f3ff" },
  blue: { from: "#1e3a8a", via: "#1d4ed8", to: "#60a5fa", ink: "#eff6ff" },
};

/** Small deterministic string hash, so a given title always yields one motif. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function GalleryTile({
  title,
  caption,
  tone = "indigo",
  image,
  fit = "cover",
  className,
  interactive = true,
}: {
  title: string;
  caption?: string;
  tone?: string;
  image?: string;
  fit?: "cover" | "contain";
  className?: string;
  interactive?: boolean;
}) {
  const palette = TONES[tone] ?? TONES.indigo;
  const seed = useMemo(() => hash(title), [title]);
  const motif = seed % 4;
  const id = useMemo(() => `tile-${seed.toString(36)}`, [seed]);

  return (
    <figure
      className={cn(
        "group relative isolate overflow-hidden rounded-2xl bg-ink-950 border border-white/5",
        interactive && "cursor-pointer",
        className,
      )}
    >
      {image ? (
        <div className="absolute inset-0 flex size-full items-center justify-center overflow-hidden bg-ink-950 p-3 pb-12">
          {/* Blurred backdrop image to eliminate harsh empty bars */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full object-cover blur-2xl opacity-45 scale-120"
          />
          {/* Main image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={caption ? `${title} — ${caption}` : title}
            className={cn(
              "relative z-10 transition-transform duration-700 ease-(--ease-out-expo)",
              fit === "contain"
                ? "max-h-full max-w-full object-contain rounded-lg drop-shadow-2xl"
                : "size-full object-cover",
              interactive && "group-hover:scale-105",
            )}
          />
        </div>
      ) : (
        <svg
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
          className={cn(
            "absolute inset-0 size-full transition-transform duration-700 ease-(--ease-out-expo)",
            interactive && "group-hover:scale-110",
          )}
          role="img"
          aria-label={caption ? `${title} — ${caption}` : title}
        >
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="55%" stopColor={palette.via} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="0.7" cy="0.2" r="0.8">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="400" height="300" fill={`url(#${id}-bg)`} />
        <rect width="400" height="300" fill={`url(#${id}-glow)`} />

        <g stroke={palette.ink} fill="none" opacity="0.38">
          {motif === 0 &&
            // Concentric orbits
            Array.from({ length: 6 }, (_, i) => (
              <circle
                key={i}
                cx={110 + (seed % 60)}
                cy={170}
                r={26 + i * 28}
                strokeWidth={i % 2 ? 0.7 : 1.4}
              />
            ))}

          {motif === 1 &&
            // Node network
            Array.from({ length: 9 }, (_, i) => {
              const x = 50 + ((seed >> i) % 7) * 45;
              const y = 60 + ((seed >> (i + 3)) % 5) * 45;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill={palette.ink} stroke="none" opacity="0.7" />
                  <line x1={x} y1={y} x2={200} y2={150} strokeWidth="0.7" />
                </g>
              );
            })}

          {motif === 2 &&
            // Waveform stack
            Array.from({ length: 5 }, (_, i) => (
              <path
                key={i}
                d={`M-10 ${90 + i * 34} Q 80 ${40 + ((seed >> i) % 70)} 190 ${
                  95 + i * 30
                } T 410 ${80 + i * 32}`}
                strokeWidth={i === 2 ? 1.8 : 0.9}
              />
            ))}

          {motif === 3 && (
            // Isometric lattice
            <>
              {Array.from({ length: 10 }, (_, i) => (
                <line key={`a${i}`} x1={-40 + i * 52} y1="320" x2={60 + i * 52} y2="-20" strokeWidth="0.8" />
              ))}
              {Array.from({ length: 10 }, (_, i) => (
                <line key={`b${i}`} x1={-40 + i * 52} y1="-20" x2={60 + i * 52} y2="320" strokeWidth="0.8" />
              ))}
              <circle cx={200} cy={150} r={54 + (seed % 30)} strokeWidth="1.6" />
            </>
          )}
        </g>

        {/* Grain-free vignette keeps the caption readable */}
        <rect width="400" height="300" fill="url(#none)" />
        <rect width="400" height="300" fill="#04060f" opacity="0.18" />
      </svg>
      )}

      {/* Bottom scrim + caption */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/85 via-ink-950/30 to-transparent p-4 pt-10"
        aria-hidden={false}
      >
        <figcaption>
          <div className="text-[0.82rem] leading-tight font-semibold text-white">{title}</div>
          {caption ? (
            <div className="mt-0.5 text-[0.7rem] leading-snug text-white/60">{caption}</div>
          ) : null}
        </figcaption>
      </div>

      {interactive ? (
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/12 transition group-hover:ring-white/30" />
      ) : null}
    </figure>
  );
}
