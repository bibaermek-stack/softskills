"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/cn";

export type VRScenarioId = "physics" | "space" | "history" | "robotics";

interface ScenarioConfig {
  id: VRScenarioId;
  title: string;
  category: string;
  tagline: string;
  accent: string;
  icon: string;
  description: string;
  tasks: { id: string; text: string; done: boolean }[];
}

const SCENARIOS: ScenarioConfig[] = [
  {
    id: "physics",
    title: "Оптика VR зертханасы: призмадағы дисперсия",
    category: "Физика & Оптика",
    tagline: "Ақ жарықтың спектрге жіктелуі және лазердің монохроматтығы",
    accent: "#06b6d4",
    icon: "Atom",
    description:
      "Оптикалық үстелдегі ауыр флинт шыны призма (N-SF11): ақ жарық Снеллиус заңы бойынша сынып, спектрге жіктеледі, ал He-Ne лазерінің сәулесі жіктелмейді. Призманы бұрып, экрандағы спектрді өлшеңіз — компьютерде де, Meta Quest шлемінде де.",
    tasks: [
      { id: "t1", text: "Жарық көзін таңдаңыз: ақ жарық пен He-Ne лазерін салыстырыңыз", done: false },
      { id: "t2", text: "Призманы бұрып, ауытқу бұрышының өзгерісін бақылаңыз", done: false },
      { id: "t3", text: "Экрандағы спектрдің енін фотосенсормен өлшеңіз", done: false },
    ],
  },
  {
    id: "space",
    title: "Күн Жүйесі және Ғарыштық Кеңістік VR",
    category: "Астрономия & Гравитация",
    tagline: "Планеталар қозғалысы, текстуралар және орбиталар",
    accent: "#8b5cf6",
    icon: "Globe",
    description:
      "Күннің тәждік жарқылы, Жер, Марс, Юпитер және Сатурнның сақиналарын жоғары деңгейлі 3D текстуралармен 360° бақылаңыз.",
    tasks: [
      { id: "s1", text: "Жер мен Ай жүйесінің айналу орбитасын бақылаңыз", done: false },
      { id: "s2", text: "Сатурн сақиналары мен Юпитер құрылымын зерттеңіз", done: false },
      { id: "s3", text: "Күн жүйесінің орталық гравитациясын талдаңыз", done: false },
    ],
  },
  {
    id: "history",
    title: "Жібек жолы мұрасы: Қожа Ахмет Ясауи кесенесі",
    category: "Тарих & Архитектура",
    tagline: "Кесененің 3D моделі, көгілдір күмбездер және көне жәдігерлер",
    accent: "#f59e0b",
    icon: "Landmark",
    description:
      "Түркістандағы Қожа Ахмет Ясауи кесенесінің 3D моделін (баннаи өрнекті қабырғалар, аяқталмаған портал, көгілдір күмбездер) аралап, Отырар үлгісіндегі құмыра мен күміс дирхамдарды витринада зерттеңіз.",
    tasks: [
      { id: "h1", text: "Кесененің қабырғалы көгілдір күмбезін қараңыз", done: false },
      { id: "h2", text: "Отырар үлгісіндегі құмыраның ою-өрнегін тексеріңіз", done: false },
      { id: "h3", text: "Жібек жолы сауда дирхамдарын зерттеңіз", done: false },
    ],
  },
  {
    id: "robotics",
    title: "Роботтандырылған палеттеу ұяшығы",
    category: "Робототехника & Инженерия",
    tagline: "6 осьтік өнеркәсіптік робот, конвейер және кері кинематика",
    accent: "#10b981",
    icon: "Cpu",
    description:
      "Өнеркәсіптік 6 осьтік робот конвейерден қорапты пневматикалық қармауышпен алып, палеткаға екі қабаттап жинайды. Буын бұрыштары кері кинематикамен есептеледі; оператор панелі (HMI) мен сигнал бағаны ұяшықтың күйін көрсетеді.",
    tasks: [
      { id: "r1", text: "Роботты басып, жинақтау циклін тоқтатыңыз немесе жалғастырыңыз", done: false },
      { id: "r2", text: "Қармауышты басып, калибрлеуді іске қосыңыз", done: false },
      { id: "r3", text: "Конвейердегі қорапты тасымалдау процесін зерттеңіз", done: false },
    ],
  },
];

/**
 * 3D сахналар public/vr/ ішіндегі статикалық бетте жүреді (scene.html +
 * vr-scenes.js, текстуралар, HDR орталар, кесененің 3D моделі). Нұсқа
 * параметрі файлдар жаңарғанда браузер кэшін жаңартады.
 */
const VR_SCENE_VERSION = "20261009";

export function VRSimulator() {
  const [currentScenarioId, setCurrentScenarioId] = useState<VRScenarioId>("physics");
  const [tasks, setTasks] = useState(SCENARIOS[0].tasks);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentScenario = SCENARIOS.find((s) => s.id === currentScenarioId) ?? SCENARIOS[0];

  // Update tasks when scenario changes
  useEffect(() => {
    setTasks(currentScenario.tasks);
    setActiveInfo(null);
  }, [currentScenario]);

  // Listen to messages from A-Frame iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === "VR_INTERACTION") {
        setActiveInfo(event.data.info);
      }
      if (event.data.type === "TASK_PROGRESS") {
        const taskId = event.data.taskId;
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, done: true } : t))
        );
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const triggerEnterVR = () => {
    iframeRef.current?.contentWindow?.postMessage({ type: "TRIGGER_ENTER_VR" }, "*");
  };

  return (
    <section className="relative flex flex-col overflow-hidden rounded-3xl border border-brand-500/20 bg-slate-950 p-4 text-white shadow-lift sm:p-6 lg:p-7">
      {/* Жоғарғы бақылау тақырыбы */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider text-white shadow-soft"
              style={{ backgroundColor: currentScenario.accent }}
            >
              <Icon name="Scan" className="size-3.5" />
              Three.js & A-Frame WebXR • Meta Quest 🥽
            </span>
            <span className="text-[0.75rem] font-medium text-slate-400">
              High-Fidelity 3D Виртуалды Тренажер
            </span>
          </div>

          <h2 className="mt-2 font-display text-xl font-bold sm:text-2xl">
            {currentScenario.title}
          </h2>
          <p className="mt-1 max-w-2xl text-[0.82rem] text-slate-300">
            {currentScenario.description}
          </p>
        </div>

        {/* Құрылғы режимдері & Басқару түймелері */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={triggerEnterVR}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-[0.82rem] font-bold text-white shadow-lift transition hover:scale-[1.02] active:scale-[0.98]"
            title="Meta Quest Link немесе SteamVR арқылы қосылған шлемде VR іске қосу"
          >
            <Icon name="Scan" className="size-4" />
            <span>🥽 VR Шлемді іске қосу (Quest Link)</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-[0.78rem] font-semibold text-white transition hover:bg-white/20"
            title="Толық экран режимі"
          >
            <Icon name="Expand" className="size-4" />
            <span>{isFullscreen ? "Шығу" : "Толық экран"}</span>
          </button>
        </div>
      </div>

      {/* Сценарийлерді таңдау жолағы */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SCENARIOS.map((sc) => {
          const isActive = sc.id === currentScenarioId;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => setCurrentScenarioId(sc.id)}
              className={cn(
                "flex flex-col items-start rounded-2xl p-3 text-left transition-all duration-300",
                isActive
                  ? "bg-white text-slate-950 shadow-lift ring-2 ring-brand-400"
                  : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
              )}
            >
              <span
                className="text-[0.66rem] font-bold tracking-wide uppercase"
                style={{ color: isActive ? sc.accent : "#94a3b8" }}
              >
                {sc.category}
              </span>
              <span className="mt-1 font-display text-[0.82rem] font-bold leading-tight">
                {sc.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Негізгі 3D A-Frame Canvas & Интерактивті Аймақ */}
      <div
        ref={containerRef}
        className="relative mt-4 h-[580px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-inner"
      >
        <iframe
          ref={iframeRef}
          key={currentScenarioId}
          title={currentScenario.title}
          src={`/vr/scene.html?s=${currentScenarioId}&v=${VR_SCENE_VERSION}`}
          className="size-full border-0"
          allow="accelerometer; autoplay; camera; gyroscope; vr; xr-spatial-tracking; fullscreen"
        />

        {/* Төменгі интерактивті бақылау тақтасы */}
        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex flex-wrap items-end justify-between gap-3">
          {/* Таңдалған 3D нысанның сипаттамасы */}
          {activeInfo && (
            <div className="pointer-events-auto max-w-md rounded-xl border border-cyan-500/40 bg-slate-900/90 p-3.5 shadow-2xl backdrop-blur-md">
              <p className="text-[0.68rem] font-bold text-cyan-400 uppercase">3D Нысанның дерегі:</p>
              <p className="mt-0.5 text-[0.8rem] font-semibold text-white">{activeInfo}</p>
            </div>
          )}

          {/* Meta Quest нұсқаулық баннері */}
          <div className="pointer-events-auto ml-auto rounded-xl border border-white/15 bg-slate-900/90 px-3.5 py-2 text-[0.72rem] font-medium text-slate-300 backdrop-blur-md">
            🥽 <span className="font-bold text-white">Meta Quest:</span> Браузерден ашып, «Enter VR» немесе батырманы басыңыз
          </div>
        </div>
      </div>

      {/* Интерактивті Зертханалық Тапсырмалар / Миссиялар */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[0.88rem] font-bold uppercase tracking-wider text-white">
            Интерактивті Зертханалық Тапсырмалар ({tasks.filter((t) => t.done).length}/{tasks.length})
          </h3>
          <span className="text-[0.74rem] text-slate-400">
            3D кеңістікте әрекет орындау арқылы белгіленеді
          </span>
        </div>

        <div className="mt-3.5 grid gap-2.5 sm:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-2.5 rounded-xl border p-3 transition-all",
                task.done
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300"
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                  task.done ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400"
                )}
              >
                {task.done ? "✓" : "○"}
              </span>
              <span className="text-[0.78rem] leading-snug">{task.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
