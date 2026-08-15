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
      return katex.renderToString(math.trim(), {
        displayMode: block,
        throwOnError: false,
      });
    } catch (err) {
      console.error("KaTeX rendering error:", err);
      return `<span class="text-rose-400 font-mono">${math}</span>`;
    }
  }, [math, block]);

  return (
    <span
      className={`katex-wrapper ${block ? "my-2 block overflow-x-auto text-center py-1" : "inline-block px-1"} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Text renderer that parses both inline ($...$, \(...\)) and block ($$...$$, \[...\]) LaTeX formulas.
 */
export function MathText({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;

  // Regex that captures:
  // 1) $$...$$
  // 2) \[...\]
  // 3) \(...\)
  // 4) $...$ (ignoring isolated dollar signs like $5 or $$)
  const regex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)[^$\n]+?(?<!\s)\$)/g;
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith("$$") && part.endsWith("$$")) {
          return <KatexFormula key={index} math={part.slice(2, -2)} block />;
        }
        if (part.startsWith("\\[") && part.endsWith("\\]")) {
          return <KatexFormula key={index} math={part.slice(2, -2)} block />;
        }
        if (part.startsWith("\\(") && part.endsWith("\\)")) {
          return <KatexFormula key={index} math={part.slice(2, -2)} block={false} />;
        }
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          return <KatexFormula key={index} math={part.slice(1, -1)} block={false} />;
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

/**
 * Renders structured AI message content with Markdown-like bold, code blocks, lists, and LaTeX formulas.
 */
export function AiMessageFormattedText({ content }: { content: string }) {
  if (!content) return null;

  // Split by code blocks first
  const codeBlockRegex = /(```[\s\S]*?```)/g;
  const blocks = content.split(codeBlockRegex);

  return (
    <div className="space-y-2 text-xs sm:text-[0.82rem] leading-relaxed text-slate-100 break-words">
      {blocks.map((block, bIdx) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          const lines = block.slice(3, -3).trim().split("\n");
          const lang = lines[0]?.match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : "";
          const code = (lang ? lines.slice(1) : lines).join("\n");

          return (
            <div key={bIdx} className="my-2 overflow-hidden rounded-xl border border-white/15 bg-slate-950 font-mono text-[0.75rem]">
              {lang && (
                <div className="border-b border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-cyan-400">
                  {lang}
                </div>
              )}
              <pre className="overflow-x-auto p-3 text-cyan-200">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Paragraphs & lines
        const paragraphs = block.split(/\n\n+/);
        return (
          <div key={bIdx} className="space-y-2">
            {paragraphs.map((p, pIdx) => {
              const lines = p.split("\n");

              return (
                <div key={pIdx} className="space-y-1">
                  {lines.map((line, lIdx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;

                    // Bullet lists
                    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                      return (
                        <div key={lIdx} className="flex items-start gap-2 pl-2">
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-400" />
                          <div className="flex-1">
                            <FormattedInlineText text={trimmed.slice(2)} />
                          </div>
                        </div>
                      );
                    }

                    // Numbered lists
                    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
                    if (numMatch) {
                      return (
                        <div key={lIdx} className="flex items-start gap-2 pl-2">
                          <span className="font-bold text-cyan-300 shrink-0">{numMatch[1]}.</span>
                          <div className="flex-1">
                            <FormattedInlineText text={numMatch[2]} />
                          </div>
                        </div>
                      );
                    }

                    // Headings
                    if (trimmed.startsWith("### ")) {
                      return (
                        <h4 key={lIdx} className="pt-1 font-bold text-cyan-300 text-sm">
                          <FormattedInlineText text={trimmed.slice(4)} />
                        </h4>
                      );
                    }
                    if (trimmed.startsWith("## ")) {
                      return (
                        <h3 key={lIdx} className="pt-1 font-extrabold text-white text-[0.95rem]">
                          <FormattedInlineText text={trimmed.slice(3)} />
                        </h3>
                      );
                    }

                    // Normal line
                    return (
                      <p key={lIdx}>
                        <FormattedInlineText text={line} />
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Handles bold **text** and inline LaTeX
 */
function FormattedInlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          const boldContent = part.slice(2, -2);
          return (
            <strong key={index} className="font-bold text-white">
              <MathText text={boldContent} />
            </strong>
          );
        }
        return <MathText key={index} text={part} />;
      })}
    </>
  );
}
