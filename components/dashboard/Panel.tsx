import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

/**
 * Схемадағы әр аймақты атайтын түрлі-түсті жолақ.
 * Түпнұсқада бұл — көк фонды, ортаға тураланған, бас әріппен жазылған тақырып.
 */
export function ZoneBanner({
  title,
  number,
  className,
}: {
  title: string;
  number?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "dash-banner flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-center",
        className,
      )}
    >
      {number ? (
        <span className="rounded-md bg-white/20 px-2 py-0.5 font-display text-[0.7rem] font-bold tracking-wide">
          {number}
        </span>
      ) : null}
      <h2 className="font-display text-[0.78rem] leading-tight font-bold tracking-[0.1em] text-white uppercase sm:text-[0.85rem]">
        {title}
      </h2>
    </div>
  );
}

/** Сол және оң жақ бағаналардың жеңіл тақырыбы. */
export function RailHeading({
  title,
  number,
}: {
  title: string;
  number?: string;
}) {
  return (
    <div className="dash-card flex items-center justify-center gap-2 rounded-xl px-3 py-2.5">
      {number ? (
        <span className="rounded-md bg-brand-600/12 px-1.5 py-0.5 font-display text-[0.68rem] font-bold text-brand-700 dark:bg-brand-400/20 dark:text-brand-200">
          {number}
        </span>
      ) : null}
      <h2 className="font-display text-[0.72rem] leading-tight font-bold tracking-[0.09em] text-ink-800 uppercase dark:text-paper-100">
        {title}
      </h2>
    </div>
  );
}

/** Панельдегі кез келген блоктың негізгі контейнері. */
export function Panel({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("dash-card rounded-2xl", className)}>
      {children}
    </section>
  );
}

/** Түсті дөңгелек иконка алаңы — карточкалардың бірыңғай белгісі. */
export function IconBadge({
  name,
  accent,
  size = "md",
  className,
}: {
  name: IconName;
  accent: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = { sm: "size-8 rounded-lg", md: "size-10 rounded-xl", lg: "size-12 rounded-2xl" }[size];
  const glyph = { sm: "size-4", md: "size-5", lg: "size-6" }[size];

  return (
    <span
      className={cn("grid shrink-0 place-items-center", box, className)}
      style={{
        backgroundColor: `color-mix(in srgb, ${accent} 14%, transparent)`,
        color: accent,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 26%, transparent)`,
      }}
    >
      <Icon name={name} className={glyph} strokeWidth={1.75} />
    </span>
  );
}

/** Құрал, дағды және тег сияқты қысқа белгілер. */
export function Chip({
  children,
  accent,
  className,
}: {
  children: ReactNode;
  accent?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] leading-none font-medium",
        !accent && "bg-ink-700/6 text-ink-700 dark:bg-white/10 dark:text-paper-200",
        className,
      )}
      style={
        accent
          ? {
              backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
              color: accent,
            }
          : undefined
      }
    >
      {children}
    </span>
  );
}

/** Тізім элементі — схемадағы «✓» белгісі бар жолдар. */
export function CheckRow({
  children,
  accent = "#4f46e5",
}: {
  children: ReactNode;
  accent?: string;
}) {
  return (
    <li className="flex items-start gap-2 text-[0.82rem] leading-snug text-ink-700 dark:text-paper-200">
      <span className="mt-0.5 shrink-0" style={{ color: accent }}>
        <Icon name="Check" className="size-3.5" strokeWidth={2.6} />
      </span>
      <span>{children}</span>
    </li>
  );
}
