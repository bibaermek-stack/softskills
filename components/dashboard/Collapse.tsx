"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Ашылып-жабылатын аймақ.
 *
 * Биіктік нақты пиксельмен анимацияланады: мазмұн `ResizeObserver` арқылы
 * өлшеніп отырады, сондықтан ішіндегі элементтер өзгергенде де дұрыс жұмыс
 * істейді.
 *
 * Ашылу-жабылу таза CSS ауысуы арқылы жүреді: аймақтың соңғы күйі анимация
 * аяқталуын күтпей-ақ дұрыс болады, ал `prefers-reduced-motion` кезінде ауысу
 * мүлде қолданылмайды.
 */
export function Collapse({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  /*
    Әр рендерден кейін өлшенеді: мазмұны ауысатын аймақтарда (мысалы, сабақ
    кезеңінің сипаттамасы) биіктік бірден дұрыс мәнге келеді. Тәуелділік тізімі
    әдейі жоқ — жаңа мән ескісімен бірдей болса `setHeight` күйді өзгертпейді,
    сондықтан цикл тумайды.
  */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const next = element.scrollHeight;
    setHeight((current) => (current === next ? current : next));
  });

  // Кейін жүктелетін мазмұн (шрифт, сурет) биіктікті өзгертсе, қайта өлшеу.
  useEffect(() => {
    const element = contentRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      const next = element.scrollHeight;
      setHeight((current) => (current === next ? current : next));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "overflow-hidden transition-[height] duration-300 ease-(--ease-out-expo) motion-reduce:transition-none",
        className,
      )}
      style={{ height: open ? height : 0 }}
      aria-hidden={!open}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
