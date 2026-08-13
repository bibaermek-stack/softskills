"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../Icon";

interface QrCodeDisplayProps {
  roomCode: string;
  joinUrl?: string;
  size?: number;
}

export function QrCodeDisplay({ roomCode, joinUrl, size = 200 }: QrCodeDisplayProps) {
  const [svgString, setSvgString] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const getBaseUrl = () => {
    if (joinUrl) return joinUrl;
    if (typeof window !== "undefined" && window.location.origin && window.location.origin !== "null") {
      return `${window.location.origin}/play?code=${roomCode}`;
    }
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
    if (envUrl) {
      const prefix = envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
      return `${prefix}/play?code=${roomCode}`;
    }
    return `/play?code=${roomCode}`;
  };

  const fullUrl = getBaseUrl();

  useEffect(() => {
    let isMounted = true;
    QRCode.toString(
      fullUrl,
      {
        type: "svg",
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      },
      (err, svg) => {
        if (!err && svg && isMounted) {
          setSvgString(svg);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [fullUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR Code Container */}
      <div className="relative rounded-2xl border border-ink-700/10 bg-white p-4 shadow-md transition hover:shadow-lg dark:border-white/15 dark:bg-slate-900">
        {svgString ? (
          <div
            className="rounded-xl overflow-hidden bg-white p-2"
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400 dark:bg-slate-800"
            style={{ width: size, height: size }}
          >
            QR Жүктелуде...
          </div>
        )}

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={() => setIsFullScreen(true)}
          title="Үлкейту (Проектор режимі)"
          className="absolute right-2 top-2 rounded-lg border border-slate-200 bg-white/90 p-1.5 text-slate-700 shadow-sm transition hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200"
        >
          <Icon name="Maximize2" className="size-4" />
        </button>
      </div>

      {/* Room Code Badge */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[0.72rem] font-medium text-slate-500 dark:text-slate-400">
          Бөлме коды арқылы кіру:
        </span>
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-2xl font-black tracking-widest text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
          <span>{roomCode.slice(0, 3)}</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span>{roomCode.slice(3)}</span>
        </div>
      </div>

      {/* Copy Link Button */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.78rem] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <Icon name={copied ? "Check" : "Copy"} className="size-3.5 text-blue-500" />
        {copied ? "Сілтеме көшірілді!" : "Сілтемені көшіру"}
      </button>

      {/* Fullscreen Modal for Classroom Projectors */}
      <AnimatePresence>
        {isFullScreen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 p-6 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="absolute right-6 top-6 flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              <Icon name="X" className="size-5" />
              Жабу (Esc)
            </button>

            <div className="flex flex-col items-center gap-6 text-center">
              <h2 className="text-3xl font-bold text-white">Командалық Ойынға қосылыңыз</h2>
              <p className="max-w-md text-slate-300">
                Камера арқылы QR-кодты сканерлеңіз немесе тікелей веб-сайтқа кіріңіз:
              </p>

              <div className="rounded-3xl border-4 border-blue-500/40 bg-white p-6 shadow-2xl">
                {svgString && (
                  <div
                    className="overflow-hidden"
                    style={{ width: 340, height: 340 }}
                    dangerouslySetInnerHTML={{ __html: svgString }}
                  />
                )}
              </div>

              <div className="rounded-2xl bg-blue-600/20 border border-blue-500/30 px-8 py-4 text-center">
                <span className="block text-xs uppercase tracking-widest text-blue-300">
                  Бөлме коды
                </span>
                <span className="text-5xl font-black tracking-widest text-white">{roomCode}</span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
