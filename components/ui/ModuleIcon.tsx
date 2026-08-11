import type { ModuleId } from "@/lib/content";
import { cn } from "@/lib/cn";

/**
 * Isometric module marks. Drawn rather than imported so each one can inherit
 * its module's accent colour and animate on hover without extra assets.
 */
export function ModuleIcon({
  id,
  accent,
  className,
}: {
  id: ModuleId;
  accent: string;
  className?: string;
}) {
  const gid = `mi-${id}`;

  return (
    <svg viewBox="0 0 64 64" className={cn("size-full", className)} aria-hidden>
      <defs>
        <linearGradient id={`${gid}-face`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id={`${gid}-side`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* shared isometric plinth */}
      <path
        d="M32 46 12 35v6l20 11 20-11v-6L32 46Z"
        fill={`url(#${gid}-side)`}
        opacity="0.5"
      />

      {id === "physics" && (
        <g>
          <ellipse cx="32" cy="27" rx="19" ry="7.5" fill="none" stroke={accent} strokeWidth="2" opacity="0.9" />
          <ellipse
            cx="32"
            cy="27"
            rx="19"
            ry="7.5"
            fill="none"
            stroke={accent}
            strokeWidth="2"
            opacity="0.6"
            transform="rotate(60 32 27)"
          />
          <ellipse
            cx="32"
            cy="27"
            rx="19"
            ry="7.5"
            fill="none"
            stroke={accent}
            strokeWidth="2"
            opacity="0.6"
            transform="rotate(-60 32 27)"
          />
          <circle cx="32" cy="27" r="5" fill={`url(#${gid}-face)`} />
          <circle cx="51" cy="27" r="2.6" fill={accent} />
          <circle cx="22.5" cy="10.5" r="2.6" fill={accent} opacity="0.75" />
        </g>
      )}

      {id === "mathematics" && (
        <g>
          <path d="M32 8 14 18v20l18 10 18-10V18L32 8Z" fill={`url(#${gid}-face)`} opacity="0.16" />
          <path d="M32 8 14 18v20l18 10 18-10V18L32 8Z" fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" />
          <path d="m20 36 6-9 6 6 6-13 6 9" fill="none" stroke={accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="26" cy="27" r="2.2" fill={accent} />
          <circle cx="38" cy="20" r="2.2" fill={accent} />
        </g>
      )}

      {id === "history" && (
        <g>
          <path d="M32 8 14 18v20l18 10 18-10V18L32 8Z" fill={`url(#${gid}-face)`} opacity="0.14" />
          <circle cx="32" cy="28" r="15" fill="none" stroke={accent} strokeWidth="2" />
          <path d="M17 28h30M32 13c4 4.5 6 9.5 6 15s-2 10.5-6 15c-4-4.5-6-9.5-6-15s2-10.5 6-15Z" fill="none" stroke={accent} strokeWidth="1.6" opacity="0.65" />
          <circle cx="32" cy="28" r="3.4" fill={`url(#${gid}-face)`} />
          <path d="M32 28 41 19" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {id === "literature" && (
        <g>
          <path
            d="M32 18c-4.6-3-10.2-3.6-15.4-1.8a1.4 1.4 0 0 0-1 1.4v20c0 .9.9 1.6 1.8 1.4 4.8-1 9.9-.4 14.6 1.9m0-22.9c4.6-3 10.2-3.6 15.4-1.8.6.2 1 .8 1 1.4v20c0 .9-.9 1.6-1.8 1.4-4.8-1-9.9-.4-14.6 1.9m0-22.9v22.9"
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="26" r="1.8" fill={accent} opacity="0.7" />
          <circle cx="40" cy="26" r="1.8" fill={accent} opacity="0.7" />
          <path d="M32 10.5c1.8 1.4 3 2.6 3 4.2" stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        </g>
      )}

      {id === "technology" && (
        <g>
          <rect x="21" y="18" width="22" height="22" rx="3.5" fill={`url(#${gid}-face)`} opacity="0.2" />
          <rect x="21" y="18" width="22" height="22" rx="3.5" fill="none" stroke={accent} strokeWidth="2" />
          <rect x="28" y="25" width="8" height="8" rx="1.6" fill={accent} opacity="0.85" />
          {[24.5, 29, 33.5, 38].map((v) => (
            <g key={v}>
              <path d={`M${v} 18v-5`} stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
              <path d={`M${v} 40v5`} stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
            </g>
          ))}
          {[24.5, 29, 33.5, 38].map((v) => (
            <g key={`h${v}`}>
              <path d={`M21 ${v}h-5`} stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
              <path d={`M43 ${v}h5`} stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
