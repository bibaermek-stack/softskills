"use client";

import { useMemo } from "react";
import katex from "katex";

interface KatexFormulaProps {
  math: string;
  block?: boolean;
  className?: string;
}

export function KatexFormula({ math, block = false, className = "" }: KatexFormulaProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
      });
    } catch (err) {
      console.error("KaTeX rendering error:", err);
      return `<span class="text-rose-400">${math}</span>`;
    }
  }, [math, block]);

  return (
    <span
      className={`katex-wrapper inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Text renderer that parses both inline `$formula$` and block `$$formula$$` or `\frac{...}{...}` in text!
 */
export function MathText({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;

  // Split text by block or inline LaTeX delimiters
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$.+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const formula = part.slice(2, -2).trim();
          return <KatexFormula key={index} math={formula} block />;
        } else if (part.startsWith("$") && part.endsWith("$")) {
          const formula = part.slice(1, -1).trim();
          return <KatexFormula key={index} math={formula} block={false} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
