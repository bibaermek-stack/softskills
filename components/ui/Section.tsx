import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

/* ------------------------------------------------------------------ *\
   Section shell
\* ------------------------------------------------------------------ */
export function Section({
  id,
  children,
  className,
  tone = "light",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "light" | "muted" | "dark";
}) {
  return (
    <section
      id={id}
      className={cn(
        // overflow-x-clip (not hidden) contains two things that would otherwise
        // push the page sideways — oversized decorative blur blobs, and the
        // horizontal offset scroll-reveals hold before they animate in — while
        // still allowing sticky positioning inside a section.
        "relative isolate scroll-mt-20 overflow-x-clip py-(--spacing-section)",
        tone === "light" && "bg-paper text-ink-900",
        tone === "muted" && "bg-paper-50 text-ink-900",
        tone === "dark" && "bg-ink-900 text-white",
        className,
      )}
    >
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ *\
   Eyebrow label
\* ------------------------------------------------------------------ */
export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.18em] uppercase",
        tone === "light"
          ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
          : "glass-dark text-brand-200",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          tone === "light" ? "bg-brand-500" : "bg-cyan-400",
        )}
        aria-hidden
      />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ *\
   Section heading block
\* ------------------------------------------------------------------ */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "light",
  align = "left",
  className,
  maxWidth = "max-w-3xl",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
  maxWidth?: string;
}) {
  return (
    <div
      className={cn(
        maxWidth,
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Reveal from="up">
          <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}

      <Reveal from="up" delay={0.06} blur>
        <h2
          className={cn(
            "mt-5 text-display-sm leading-[1.06] sm:text-display",
            tone === "dark" ? "text-white" : "text-ink-900",
          )}
        >
          {title}
        </h2>
      </Reveal>

      {lead ? (
        <Reveal from="up" delay={0.12}>
          <p
            className={cn(
              "mt-5 text-base leading-relaxed sm:text-lg",
              tone === "dark" ? "text-brand-100/70" : "text-ink-700/70",
            )}
          >
            {lead}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
