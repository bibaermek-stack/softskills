"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { creativeValues, multimediaResources, onlineTools } from "@/lib/dashboard";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { Icon, type IconName } from "./Icon";
import { IconBadge, RailHeading } from "./Panel";

/** Оң жақ бағанадағы бір ресурс карточкасы — өз бетіне сілтейді. */
function ResourceCard({
  id,
  title,
  icon,
  accent,
  index,
}: {
  id: string;
  title: string;
  icon: IconName;
  accent: string;
  index: number;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.5, delay: reduced ? 0 : index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduced ? undefined : { x: -3 }}
    >
      <Link
        href={`/dashboard/resources/${id}`}
        className="dash-card group flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-shadow duration-300 hover:shadow-lift"
      >
        <IconBadge
          name={icon}
          accent={accent}
          className="transition-transform duration-300 group-hover:scale-110"
        />
        <span className="min-w-0 flex-1 text-[0.76rem] leading-snug font-medium text-ink-800 dark:text-paper-100">
          {title}
        </span>
        <span className="shrink-0 text-ink-600/40 transition-transform duration-300 group-hover:translate-x-0.5 dark:text-paper-300">
          <Icon name="ChevronRight" className="size-4" strokeWidth={2.2} />
        </span>
      </Link>
    </motion.div>
  );
}

/**
 * Оң жақ бағана — «2.6 Мультимедиялық ресурстар», «2.9 Онлайн құралдар және
 * модульдер» және «Креативті тәрбие және құндылықтар».
 * Схемадағы реті мен топтастыруы сол күйінде; әр ресурс жеке бетте ашылады.
 */
export function ResourceRail() {
  const reduced = usePrefersReducedMotion();

  return (
    <div id="dash-resources" className="flex flex-col gap-3">
      <RailHeading number="2.6" title="Мультимедиялық ресурстар" />
      <div className="flex flex-col gap-2">
        {multimediaResources.map((resource, i) => (
          <ResourceCard
            key={resource.id}
            id={resource.id}
            title={resource.title}
            icon={resource.icon}
            accent={resource.accent}
            index={i}
          />
        ))}
      </div>

      <RailHeading number="2.9" title="Онлайн құралдар және модульдер" />
      <div className="flex flex-col gap-2">
        {onlineTools.map((tool, i) => (
          <ResourceCard
            key={tool.id}
            id={tool.id}
            title={tool.title}
            icon={tool.icon}
            accent={tool.accent}
            index={i}
          />
        ))}
      </div>

      <RailHeading title="Креативті тәрбие және құндылықтар" />
      <div className="dash-card rounded-2xl p-3">
        <ul className="space-y-2">
          {creativeValues.map((value, i) => (
            <motion.li
              key={value.title}
              className="group flex items-start gap-2"
              initial={reduced ? false : { opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.45, delay: reduced ? 0 : i * 0.04 }}
            >
              <span className="mt-0.5 shrink-0 text-violet-600 transition-transform duration-300 group-hover:scale-115 dark:text-violet-400">
                <Icon name={value.icon} className="size-3.5" strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.76rem] leading-snug font-semibold text-ink-900 dark:text-white">
                  {value.title}
                </span>
                <span className="block text-[0.68rem] leading-snug text-ink-700/75 dark:text-paper-300">
                  {value.text}
                </span>
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
