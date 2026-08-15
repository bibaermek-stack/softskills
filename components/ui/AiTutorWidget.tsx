"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/dashboard/Icon";
import { AiMessageFormattedText } from "@/components/ui/KatexFormula";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  model?: string;
  isError?: boolean;
}

const CATEGORY_PROMPTS = [
  {
    category: "⚡ Физика",
    prompts: [
      "Ом заңы мен оның формуласын түсіндірші?",
      "Архимед күші қалай есептеледі?",
      "Ньютонның 3 заңын өмірлік мысалдармен айтып берші",
    ],
  },
  {
    category: "📐 Математика",
    prompts: [
      "Пифагор теоремасын формуласымен көрсет",
      "Квадрат теңдеудің дискриминантын қалай табамыз?",
      "Туындының физикалық мағынасы деген не?",
    ],
  },
  {
    category: "🧪 Химия",
    prompts: [
      "Су молекуласының түзілу реакциясы мен жылу бөлінуі",
      "Менделеев кестесіндегі периодтық заң қалай жұмыс істейді?",
      "Электролиз процесі деген не?",
    ],
  },
  {
    category: "💻 IT & Код",
    prompts: [
      "Python-да жылдам сұрыптау (QuickSort) қалай жазылады?",
      "Рекурсия мен циклдың айырмашылығы неде?",
      "STEM-де алгоритмдеу не үшін қажет?",
    ],
  },
  {
    category: "🎯 Soft Skills",
    prompts: [
      "Ғылыми жобада командамен жұмыс істеу дағдылары",
      "Есеп шығаруда сыни ойлауды қалай дамытамын?",
    ],
  },
];

const LOCAL_FALLBACK_KB: Record<string, string> = {
  "ом": "Ом заңы: Тізбек бөлігіндегі ток күші кернеуге тура пропорционал, кедергіге кері пропорционал.\n\n\\[ I = \\frac{U}{R} \\]\n\nМұнда: $I$ — ток күші (А), $U$ — кернеу (В), $R$ — кедергі (Ом).",
  "ньютон": "Ньютонның екінші заңы: Денеге әсер етуші қорытқы күш оның массасы мен үдеуінің көбейтіндісіне тең.\n\n\\[ \\vec{F} = m \\cdot \\vec{a} \\]",
  "пифагор": "Пифагор теоремасы: Тік бұрышты үшбұрышта гипотенуза квадраты катеттердің квадраттарының қосындысына тең.\n\n\\[ c^2 = a^2 + b^2 \\]",
  "су": "Судың түзілуі: Екі сутегі молекуласы мен бір оттегі молекуласы қосылып, су түзеді:\n\n\\[ 2H_2 + O_2 \\rightarrow 2H_2O + \\Delta Q \\]",
};

const STORAGE_KEY = "stem_ai_tutor_messages_v2";

export function AiTutorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("⚡ Физика");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Сәлем! Мен **DeepSeek V4 Flash** негізіндегі ресми STEM AI көмекшісімін. 🔬\n\nФизика, математика, химия, бағдарламалау (Python) немесе ғылыми жобалар бойынша кез келген сұрағыңызды қойыңыз. Формулаларды, есептерді және тәжірибелерді қазақ тілінде нақты түсіндіріп беремін!",
      timestamp: "Қазір",
      model: "DeepSeek V4 Flash",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to local storage
  const saveMessages = useCallback((msgs: Message[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    } catch {
      // ignore
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleClearHistory = () => {
    const welcomeMsg: Message = {
      id: "welcome-" + Date.now(),
      sender: "ai",
      text: "Сәлем! Сұхбат тарихы тазартылды. Жаңа STEM сұрағыңызды қойыңыз! 🚀",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      model: "DeepSeek V4 Flash",
    };
    setMessages([welcomeMsg]);
    saveMessages([welcomeMsg]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (userText: string) => {
    const query = userText.trim();
    if (!query || isTyping) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMsg: Message = {
      id: "u-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const aiMsgId = "ai-" + (Date.now() + 1);
    const initialAiMsg: Message = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      model: "DeepSeek V4 Flash",
    };

    const updatedMessages = [...messages, userMsg, initialAiMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    // Build context messages for API
    const historyPayload = [...messages, userMsg]
      .filter((m) => !m.isError)
      .slice(-8)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) continue;

          if (trimmed === "data: [DONE]") {
            break;
          }

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              if (delta) {
                accumulatedText += delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId ? { ...m, text: accumulatedText } : m
                  )
                );
              }
            } catch {
              // chunk could be partial or non-json
            }
          }
        }
      }

      if (!accumulatedText.trim()) {
        // Fallback if empty
        accumulatedText = "Жауап табылмады. Қайта қойып көріңіз.";
      }

      const finalMsgs = updatedMessages.map((m) =>
        m.id === aiMsgId ? { ...m, text: accumulatedText } : m
      );
      setMessages(finalMsgs);
      saveMessages(finalMsgs);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.warn("AI generation error, checking local fallback:", err);

      // Local fallback for key concepts if offline
      let fallbackText =
        "Кешіріңіз, желілік байланыс немесе API сұранысында ақау болды. ";
      for (const [key, val] of Object.entries(LOCAL_FALLBACK_KB)) {
        if (query.toLowerCase().includes(key)) {
          fallbackText =
            val + "\n\n*(Жергілікті STEM дерекқорынан алынды)*";
          break;
        }
      }

      const finalMsgs = updatedMessages.map((m) =>
        m.id === aiMsgId
          ? {
              ...m,
              text: fallbackText,
              isError: !fallbackText.includes("Жергілікті"),
            }
          : m
      );
      setMessages(finalMsgs);
      saveMessages(finalMsgs);
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const activePrompts =
    CATEGORY_PROMPTS.find((c) => c.category === activeCategory)?.prompts ||
    CATEGORY_PROMPTS[0].prompts;

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-linear-to-r from-cyan-500 via-indigo-600 to-purple-600 px-5 py-3.5 text-white shadow-2xl transition hover:scale-105 active:scale-95 cursor-pointer border border-cyan-300/30"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="DeepSeek AI STEM көмекшісін ашу"
      >
        <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex size-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
        </span>
        <Icon name="Sparkles" className="size-5 text-amber-300 animate-pulse" />
        <div className="flex flex-col items-start text-left">
          <span className="text-xs font-bold tracking-wide">STEM AI Көмекші</span>
          <span className="text-[0.62rem] text-cyan-200 font-medium">DeepSeek V4 Flash</span>
        </div>
      </motion.button>

      {/* Chat Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950/95 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl transition-all duration-300 ${
              isExpanded
                ? "h-[85vh] w-[95vw] max-w-[48rem]"
                : "h-[36rem] w-[92vw] max-w-[26rem] sm:w-[28rem]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-linear-to-r from-slate-950 via-indigo-950/80 to-slate-950 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative grid size-10 place-items-center rounded-2xl bg-linear-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-lg border border-white/20">
                  <Icon name="Bot" className="size-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">STEM AI Көмекші</h3>
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[0.62rem] font-bold text-cyan-300 border border-cyan-500/30">
                      DeepSeek V4 Flash
                    </span>
                  </div>
                  <p className="text-[0.68rem] text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Белсенді • Жылдам формулалар мен STEM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? "Кішірейту" : "Үлкейту"}
                  className="grid size-8 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <Icon name={isExpanded ? "Minimize" : "Maximize"} className="size-4" />
                </button>
                <button
                  onClick={handleClearHistory}
                  title="Тарихты тазалау"
                  className="grid size-8 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-rose-300 transition cursor-pointer"
                >
                  <Icon name="RotateCcw" className="size-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Жабу"
                  className="grid size-8 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <Icon name="X" className="size-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="dash-scroll flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`relative max-w-[90%] rounded-2xl px-4 py-3 shadow-md transition ${
                      msg.sender === "user"
                        ? "bg-linear-to-br from-indigo-600 to-indigo-700 text-white rounded-br-xs font-medium text-xs sm:text-sm"
                        : "bg-slate-900/90 text-slate-100 border border-white/10 rounded-bl-xs shadow-slate-950/50"
                    } ${msg.isError ? "border-rose-500/50 bg-rose-950/30" : ""}`}
                  >
                    {msg.sender === "ai" ? (
                      <div>
                        {msg.text ? (
                          <AiMessageFormattedText content={msg.text} />
                        ) : (
                          <div className="flex items-center gap-2 py-1 text-xs text-cyan-300">
                            <Icon name="Loader" className="size-4 animate-spin text-cyan-400" />
                            <span>DeepSeek V4 жауабы жазылуда...</span>
                          </div>
                        )}

                        {/* Message Action Bar for AI */}
                        {msg.text && (
                          <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-1.5 text-[0.65rem] text-slate-400">
                            <span className="text-cyan-400/80 font-mono text-[0.6rem]">
                              {msg.model || "DeepSeek V4 Flash"}
                            </span>
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="flex items-center gap-1 hover:text-white transition text-[0.65rem] cursor-pointer"
                              title="Көшіріп алу"
                            >
                              <Icon
                                name={copiedId === msg.id ? "Check" : "Copy"}
                                className={`size-3 ${copiedId === msg.id ? "text-emerald-400" : ""}`}
                              />
                              <span>{copiedId === msg.id ? "Көшірілді!" : "Көшіру"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                  <span className="mt-1 px-1 text-[0.62rem] text-slate-500">{msg.timestamp}</span>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Category selection and preset prompts */}
            <div className="border-t border-white/10 bg-slate-950/80 p-3 space-y-2">
              {/* Category tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[0.68rem] scrollbar-none">
                {CATEGORY_PROMPTS.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setActiveCategory(cat.category)}
                    className={`shrink-0 rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                      activeCategory === cat.category
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40"
                        : "bg-white/5 text-slate-400 hover:text-white border border-transparent"
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>

              {/* Prompts pills */}
              <div className="dash-scroll flex gap-1.5 overflow-x-auto pb-1">
                {activePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    disabled={isTyping}
                    className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[0.7rem] text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-200 transition disabled:opacity-40 cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="mt-1 flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="STEM сұрағыңызды немесе есепті жазыңыз..."
                    className="w-full rounded-2xl border border-white/15 bg-slate-900 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="grid size-10 shrink-0 place-items-center rounded-2xl bg-linear-to-r from-cyan-500 to-indigo-600 font-bold text-white shadow-lg transition hover:opacity-90 active:scale-95 disabled:opacity-40 cursor-pointer"
                  title="Жіберу"
                >
                  {isTyping ? (
                    <Icon name="Loader" className="size-4 animate-spin" />
                  ) : (
                    <Icon name="Send" className="size-4" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
