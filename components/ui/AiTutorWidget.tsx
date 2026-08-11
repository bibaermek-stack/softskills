"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/dashboard/Icon";
import { KatexFormula } from "@/components/ui/KatexFormula";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  latex?: string;
}

const PRESET_QUESTIONS = [
  "⚡ Ом заңын түсіндірші?",
  "🍎 Ньютонның 2-заңы деген не?",
  "🧪 Су молекуласының түзілу реакциясы",
  "📐 Пифагор теоремасы қолданылуы",
  "💻 Заманауи STEM деген не?",
];

const KNOWLEDGE_BASE: Record<string, { text: string; latex?: string }> = {
  "Ом заңы": {
    text: "Ом заңы — электр тізбегіндегі кернеу (U), ток күші (I) мен кедергі (R) арасындағы байланысты көрсетеді. Ток күші кернеуге тура пропорционал, ал кедергіге кері пропорционал.",
    latex: "I = \\frac{U}{R} \\quad \\Rightarrow \\quad U = I \\cdot R",
  },
  "Ньютон": {
    text: "Ньютонның екінші заңы: Денеге әсер етуші қорытқы күш оның массасы мен үдеуінің көбейтіндісіне тең. Күш артқан сайын үдеу артады.",
    latex: "\\vec{F} = m \\cdot \\vec{a}",
  },
  "Су": {
    text: "Су молекуласы (H₂O) — екі сутегі атомы мен бір оттегі атомының ковалентті байланысынан тұрады. Реакция барысында жылу бөлінеді.",
    latex: "2H_2 + O_2 \\rightarrow 2H_2O + E",
  },
  "Пифагор": {
    text: "Пифагор теоремасы: Тік бұрышты үшбұрыштың гипотенузасының квадраты катеттерінің квадраттарының қосындысына тең.",
    latex: "c^2 = a^2 + b^2",
  },
  "STEM": {
    text: "STEM (Science, Technology, Engineering, Math) — жаратылыстану ғылымдары, технология, инженерия мен математиканы біріктіретін заманауи оқыту әдістемесі.",
  },
};

export function AiTutorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Сәлем! Мен дайын STEM білім базасымен жұмыс істейтін демо көмекшімін. Физика, химия, математика немесе бағдарламалау бойынша сұрағыңыз бар ма?",
      timestamp: "Қазір",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let aiResponseText = "Керемет сұрақ! STEM қағидасы бойынша бұл құбылыс математикалық және физикалық модельдеуге негізделген. 🔬";
      let matchedLatex: string | undefined;

      for (const [key, val] of Object.entries(KNOWLEDGE_BASE)) {
        if (userText.toLowerCase().includes(key.toLowerCase())) {
          aiResponseText = val.text;
          matchedLatex = val.latex;
          break;
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiResponseText,
        latex: matchedLatex,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-linear-to-r from-cyan-500 via-indigo-600 to-purple-600 px-5 py-3.5 text-white shadow-2xl transition hover:scale-105 active:scale-95 cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="STEM демо көмекшісін ашу"
      >
        <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75"></span>
          <span className="relative inline-flex size-3 rounded-full bg-cyan-200"></span>
        </span>
        <Icon name="Sparkles" className="size-5" />
        <span className="text-sm font-semibold tracking-wide">STEM көмекші · демо</span>
      </motion.button>

      {/* Chat Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 flex h-[34rem] w-[90vw] max-w-[24rem] flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl sm:w-[26rem]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-linear-to-r from-slate-950 via-indigo-950 to-slate-950 p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xl bg-linear-to-tr from-cyan-500 to-indigo-500 text-white shadow-md">
                  <Icon name="Bot" className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">STEM оқу көмекшісі</h3>
                  <p className="text-[0.72rem] text-cyan-300">Демо режим • дайын білім базасы</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <Icon name="X" className="size-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="dash-scroll flex-1 space-y-3.5 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-800/90 text-slate-100 border border-white/10 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.text}

                    {msg.latex && (
                      <div className="mt-2.5 rounded-xl bg-slate-950/80 p-2.5 text-center text-cyan-300 border border-cyan-500/30 overflow-x-auto shadow-inner">
                        <KatexFormula math={msg.latex} block />
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-[0.65rem] text-slate-500">{msg.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                  <Icon name="Loader" className="size-3.5 animate-spin" />
                  <span>Жауап дайындалуда...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="border-t border-white/10 bg-slate-950/60 p-2.5">
              <div className="dash-scroll flex gap-1.5 overflow-x-auto pb-1">
                {PRESET_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q.replace(/^[^\s]+\s/, ""))}
                    className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.68rem] text-slate-300 hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-200 transition cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="mt-2 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Сұрағыңызды жазыңыз..."
                  className="flex-1 rounded-xl border border-white/15 bg-slate-800/80 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="grid size-8 place-items-center rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-40 transition cursor-pointer"
                >
                  <Icon name="Send" className="size-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
