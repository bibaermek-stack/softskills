"use client";

import { motion } from "framer-motion";
import { aiAssistant } from "@/lib/content";
import { Section, SectionHeading, Eyebrow } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/cn";

export function AIAssistant() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section id="ai-assistant" tone="light" className="overflow-hidden">
      <div className="container-x">
        <div className="grid items-start gap-14 lg:grid-cols-2 lg:gap-16">
          {/* ---------- copy ---------- */}
          <div>
            <SectionHeading
              eyebrow={aiAssistant.eyebrow}
              title={aiAssistant.title}
              lead={aiAssistant.lead}
              maxWidth="max-w-none"
            />

            <Reveal from="up" delay={0.16}>
              <blockquote className="mt-8 rounded-2xl border-l-2 border-brand-600 bg-brand-50/60 px-6 py-5">
                <p className="text-[0.92rem] leading-relaxed text-ink-800/85 italic">
                  {aiAssistant.principle}
                </p>
              </blockquote>
            </Reveal>

            <Reveal from="up" delay={0.2}>
              <h3 className="mt-10 text-[0.66rem] font-semibold tracking-[0.12em] text-ink-700/45 uppercase">
                Жүйе не істейді
              </h3>
            </Reveal>

            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {aiAssistant.capabilities.map((c, i) => (
                <Reveal as="li" key={c} from="up" delay={0.22 + i * 0.04}>
                  <span className="flex items-start gap-2.5 rounded-xl bg-paper-50 px-4 py-3 ring-1 ring-ink-700/5">
                    <svg
                      className="mt-0.5 size-4 shrink-0 text-brand-600"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="m3.5 8.5 3 3 6-7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[0.85rem] leading-snug text-ink-800/80">{c}</span>
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>

          {/* ---------- conversation ---------- */}
          <Reveal from="left" delay={0.1}>
            <div className="relative">
              {/* aura */}
              <div
                className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-500/20 via-violet-500/15 to-cyan-400/20 blur-3xl"
                aria-hidden
              />

              <div className="relative overflow-hidden rounded-3xl bg-ink-900 shadow-lift">
                <div
                  className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(80%_60%_at_50%_0%,#000,transparent)]"
                  aria-hidden
                />

                {/* header */}
                <div className="relative flex items-center gap-3 border-b border-white/8 px-6 py-4">
                  <span className="relative grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-400">
                    <svg className="size-4.5 text-white" viewBox="0 0 20 20" fill="none" aria-hidden>
                      <path
                        d="M10 3v3M10 14v3M3 10h3M14 10h3M5.5 5.5 7.6 7.6M12.4 12.4l2.1 2.1M14.5 5.5l-2.1 2.1M7.6 12.4l-2.1 2.1"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                      <circle cx="10" cy="10" r="2.4" fill="currentColor" />
                    </svg>
                    {!reduced && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-cyan-400/40 [animation-duration:2.6s]" />
                    )}
                  </span>
                  <div>
                    <div className="text-[0.86rem] font-semibold text-white">AI оқу ассистенті</div>
                    <div className="flex items-center gap-1.5 text-[0.68rem] text-brand-100/45">
                      <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
                      Бағыттайды · жауап бермейді
                    </div>
                  </div>
                </div>

                {/* messages */}
                <div className="relative space-y-3.5 px-5 py-6 sm:px-6">
                  {aiAssistant.conversation.map((msg, i) => {
                    const isAI = msg.from === "ai";
                    return (
                      <motion.div
                        key={i}
                        className={cn("flex", isAI ? "justify-start" : "justify-end")}
                        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.97 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                        transition={{
                          duration: 0.55,
                          delay: reduced ? 0 : i * 0.22,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 text-[0.84rem] leading-relaxed",
                            isAI
                              ? "rounded-tl-md bg-white/8 text-brand-100/85 ring-1 ring-white/10"
                              : "rounded-tr-md bg-gradient-to-br from-brand-600 to-brand-700 text-white",
                          )}
                        >
                          {msg.text}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* typing indicator */}
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: reduced ? 0 : 1.5, duration: 0.4 }}
                  >
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-white/8 px-4 py-3.5 ring-1 ring-white/10">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="size-1.5 rounded-full bg-cyan-400"
                          animate={reduced ? {} : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                          transition={{
                            duration: 1.3,
                            repeat: Infinity,
                            delay: i * 0.18,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* footer note */}
                <div className="relative border-t border-white/8 px-6 py-4">
                  <p className="text-[0.72rem] leading-relaxed text-brand-100/40">
                    Диалог — көрнекі мысал. Сайт ақпараттық сипатта: аккаунт та, нақты чат сервисі
                    де жоқ.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ *\
   Team collaboration simulator
\* ------------------------------------------------------------------ */
export function Collaboration({
  roles,
  skills,
  scenarios,
}: {
  roles: readonly { role: string; text: string }[];
  skills: readonly string[];
  scenarios: readonly { title: string; text: string }[];
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <Section id="collaboration" tone="muted" className="overflow-hidden">
      <div className="container-x">
        <SectionHeading
          eyebrow="Командалық жобалар симуляторы"
          title={
            <>
              Он рөл, бір жоба, <span className="text-gradient">шынайы қиындық</span>
            </>
          }
          lead="Ортақ виртуалды жобалық кеңістікте әр қатысушыға нақты рөл мен міндет беріледі — содан кейін симулятор нағыз командалар кездесетін мәселелерді ұсынады."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* ---------- role orbit ---------- */}
          <Reveal from="right">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-ink-900 p-4 sm:p-6">
              <div
                className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(70%_70%_at_50%_50%,#000,transparent)]"
                aria-hidden
              />
              <RoleOrbit roles={roles} reduced={reduced} />
            </div>
          </Reveal>

          {/* ---------- roles + skills ---------- */}
          <div>
            <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-ink-700/5 sm:p-8">
              <h3 className="text-[0.66rem] font-semibold tracking-[0.12em] text-ink-700/45 uppercase">
                Симулятордағы рөлдер
              </h3>
              <ul className="mt-5 divide-y divide-ink-700/6">
                {roles.map((r, i) => (
                  <Reveal as="li" key={r.role} from="left" delay={i * 0.03}>
                    <div className="flex gap-4 py-3">
                      <span className="mt-0.5 font-display text-[0.72rem] font-semibold text-brand-600/50 tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="text-[0.88rem] font-semibold text-ink-900">{r.role}</div>
                        <div className="mt-0.5 text-[0.8rem] leading-snug text-ink-700/60">
                          {r.text}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>

            <Reveal from="up" delay={0.12}>
              <div className="mt-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-ink-700/5 sm:p-8">
                <h3 className="text-[0.66rem] font-semibold tracking-[0.12em] text-ink-700/45 uppercase">
                  Симулятор дамытатын дағдылар
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <li
                      key={s}
                      className="rounded-full bg-paper-100 px-3.5 py-2 text-[0.8rem] font-medium text-ink-800/75 transition hover:bg-brand-50 hover:text-brand-700"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ---------- scenarios ---------- */}
        <div className="mt-8">
          <Reveal from="up">
            <Eyebrow>Енгізілетін жағдаяттар</Eyebrow>
          </Reveal>
          <div className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {scenarios.map((s, i) => (
              <Reveal key={s.title} from="up" delay={i * 0.06}>
                <article className="group h-full rounded-2xl bg-white p-5 shadow-soft ring-1 ring-ink-700/5 transition-all duration-500 ease-(--ease-out-expo) hover:-translate-y-1 hover:shadow-lift">
                  <span className="grid size-9 place-items-center rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
                    <svg className="size-4.5" viewBox="0 0 18 18" fill="none" aria-hidden>
                      <path
                        d="M9 2.5 16 15H2L9 2.5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path d="M9 7v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <circle cx="9" cy="12.6" r="0.9" fill="currentColor" />
                    </svg>
                  </span>
                  <h4 className="mt-4 text-[0.92rem] font-semibold text-ink-900">{s.title}</h4>
                  <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-700/65">{s.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/** Roles arranged on a slowly rotating ring around the shared project. */
function RoleOrbit({
  roles,
  reduced,
}: {
  roles: readonly { role: string; text: string }[];
  reduced: boolean;
}) {
  return (
    <div className="relative grid size-full place-items-center">
      <motion.div
        className="relative size-full"
        animate={reduced ? {} : { rotate: 360 }}
        transition={{ duration: 68, repeat: Infinity, ease: "linear" }}
      >
        {roles.map((r, i) => {
          const angle = (i / roles.length) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + Math.cos(angle) * 39;
          const y = 50 + Math.sin(angle) * 39;
          return (
            <motion.div
              key={r.role}
              className="absolute"
              style={{ left: `${x}%`, top: `${y}%`, translateX: "-50%", translateY: "-50%" }}
              animate={reduced ? {} : { rotate: -360 }}
              transition={{ duration: 68, repeat: Infinity, ease: "linear" }}
            >
              <span className="block rounded-full bg-white/8 px-2.5 py-1.5 text-[0.6rem] leading-none font-medium whitespace-nowrap text-brand-100/80 ring-1 ring-white/12 backdrop-blur-sm sm:px-3 sm:text-[0.68rem]">
                {r.role}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* orbit rings */}
      <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="39" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
        <circle cx="50" cy="50" r="26" fill="none" stroke="#ffffff" strokeOpacity="0.06" strokeDasharray="1 3" />
      </svg>

      {/* core */}
      <div className="absolute grid size-24 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-violet-600 text-center shadow-[0_0_60px_-10px_rgba(99,102,241,0.9)] sm:size-28">
        <span className="px-3 text-[0.62rem] leading-tight font-semibold text-white sm:text-[0.68rem]">
          Ортақ
          <br />
          жоба
        </span>
      </div>
    </div>
  );
}
