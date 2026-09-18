"use client";

import React, { useRef, useState, useEffect } from "react";
import { DocumentElement } from "@/types/document";
import { AlertCircle, Sparkles, CheckSquare, Square, Quote, HelpCircle, FileText, Sigma } from "lucide-react";
import { MathRenderer, MarkdownWithMath, parseInlineFormatting } from "@/lib/math-markdown-engine";

interface ElementRendererProps {
  element: DocumentElement;
  dpi: number;
  isSelected: boolean;
  isBlackAndWhite?: boolean;
  isPreview?: boolean;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  dpi,
  isSelected,
  isBlackAndWhite = false,
  isPreview = false,
}) => {
  const { type, content, style = {} } = element;
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const bwStyleFilter = isBlackAndWhite ? "grayscale(100%) contrast(115%)" : "none";

  // Real-time Text Overflow Detection
  useEffect(() => {
    if (containerRef.current) {
      const el = containerRef.current;
      const isOverflowing = el.scrollHeight > el.clientHeight + 4 || el.scrollWidth > el.clientWidth + 4;
      setHasOverflow(isOverflowing);
    }
  }, [content, style, element.width, element.height]);

  const renderContent = () => {
    switch (type) {
      case "heading": {
        const title = typeof content === "object" ? content?.title : "Document Heading";
        const subtitle = typeof content === "object" ? content?.subtitle : undefined;
        return (
          <div className="w-full h-full flex flex-col justify-center px-1">
            <h1
              className="font-extrabold tracking-tight break-words"
              style={{
                fontSize: `${style.fontSize || 24}px`,
                fontWeight: style.fontWeight || 800,
                color: style.color || "#0f172a",
                textAlign: style.textAlign || "left",
                fontFamily: style.fontFamily || "Inter, sans-serif",
                lineHeight: style.lineHeight || 1.2,
              }}
            >
              {parseInlineFormatting(title || "Document Heading")}
            </h1>
            {subtitle && (
              <p
                className="mt-1 text-slate-500 font-normal break-words"
                style={{
                  fontSize: `${Math.max(12, Math.round((style.fontSize || 24) * 0.48))}px`,
                  textAlign: style.textAlign || "left",
                  fontFamily: style.fontFamily || "Inter, sans-serif",
                  lineHeight: 1.35,
                }}
              >
                {parseInlineFormatting(subtitle)}
              </p>
            )}
          </div>
        );
      }

      case "formula": {
        const equation = content?.equation || "A = P\\left(1 + \\frac{r}{n}\\right)^{nt}";
        const breakdown: Array<{ symbol: string; label: string }> = content?.breakdown || [];
        const formulaTitle = content?.title;
        return (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden p-1">
            {formulaTitle && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 shrink-0 pb-1">
                <Sigma className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">{formulaTitle}</span>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center p-2 bg-gradient-to-b from-slate-50 to-white rounded-lg border border-slate-200 shadow-2xs select-text overflow-x-auto min-h-0">
              <MathRenderer latex={equation} displayMode={true} className="text-base md:text-lg text-slate-900 font-serif" />
            </div>
            {breakdown.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 mt-2 shrink-0">
                {breakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-slate-700 bg-white/90 px-2 py-1 rounded border border-slate-200/90 shadow-2xs overflow-hidden">
                    <span className="shrink-0 px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded font-serif text-[11px] leading-none flex items-center justify-center min-w-[20px]">
                      <MathRenderer latex={item.symbol} displayMode={false} />
                    </span>
                    <span className="truncate text-[11px] font-medium text-slate-600">{parseInlineFormatting(item.label)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case "callout": {
        const title = content?.title || "Key Takeaway";
        const body = content?.body || "Important note or concept takeaway.";
        return (
          <div className="w-full h-full flex flex-col justify-center overflow-hidden">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-indigo-950 mb-1 shrink-0">
              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block shrink-0" />
              <span className="font-bold tracking-tight truncate">{parseInlineFormatting(title)}</span>
            </div>
            <div className="text-[12px] leading-snug text-indigo-950/90 overflow-hidden line-clamp-5">
              <MarkdownWithMath content={body} />
            </div>
          </div>
        );
      }

      case "chart": {
        const title = content?.title || "10-Year Growth Comparison";
        const series = content?.series || [
          { name: "Growth", color: "#4f46e5", values: [100, 200, 350, 500, 750, 1000] },
        ];
        const labels = content?.labels || ["0", "2", "4", "6", "8", "10"];

        // Dynamic min/max calculation
        let allVals: number[] = [];
        series.forEach((s: any) => {
          if (Array.isArray(s.values)) allVals.push(...s.values);
        });
        const minVal = allVals.length > 0 ? Math.min(...allVals) * 0.9 : 0;
        const maxVal = allVals.length > 0 ? Math.max(...allVals) * 1.05 : 1000;
        const range = maxVal - minVal || 1;

        return (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 tracking-tight shrink-0 pb-1 border-b border-slate-100">
              <span className="truncate">{title}</span>
              <div className="flex items-center gap-3 text-[10px]">
                {series.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color || "#4f46e5" }} />
                    <span className="text-slate-500 font-medium truncate max-w-[90px]">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SVG Chart */}
            <div className="flex-1 w-full relative mt-1 min-h-0">
              <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeDasharray="4 4" strokeWidth="1" />

                {series.map((s: any, sIdx: number) => {
                  const vals: number[] = s.values || [];
                  const points = vals
                    .map((v, i) => {
                      const x = (i / (vals.length - 1 || 1)) * 480 + 10;
                      const y = 145 - ((v - minVal) / range) * 130;
                      return `${x},${y}`;
                    })
                    .join(" ");

                  return (
                    <g key={sIdx}>
                      <polyline
                        fill="none"
                        stroke={s.color || "#4f46e5"}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />
                      {vals.map((v, i) => {
                        const cx = (i / (vals.length - 1 || 1)) * 480 + 10;
                        const cy = 145 - ((v - minVal) / range) * 130;
                        return (
                          <circle
                            key={i}
                            cx={cx}
                            cy={cy}
                            r="3.5"
                            fill="#ffffff"
                            stroke={s.color || "#4f46e5"}
                            strokeWidth="2"
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Chart X Labels */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 shrink-0">
              {labels.map((l: string, i: number) => (
                <span key={i} className="truncate text-center flex-1">{l}</span>
              ))}
            </div>
          </div>
        );
      }

      case "diagram": {
        const title = content?.title || "Concept Diagram";
        const nodes: Array<{ step: string; title: string; desc: string }> = content?.nodes || [
          { step: "01", title: "Step 1", desc: "First action" },
          { step: "02", title: "Step 2", desc: "Second action" },
          { step: "03", title: "Step 3", desc: "Third action" },
        ];
        return (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden">
            <div className="text-xs font-bold text-amber-900 shrink-0 pb-1 border-b border-amber-200/50">
              {title}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1.5 flex-1 items-stretch">
              {nodes.map((node, idx) => (
                <div
                  key={idx}
                  className="bg-amber-50/90 border border-amber-200/90 rounded-md p-2 text-center flex flex-col justify-between shadow-xs overflow-hidden"
                >
                  <div className="text-[10px] font-mono font-bold text-amber-600">
                    {node.step}
                  </div>
                  <div className="text-xs font-bold text-slate-800 my-0.5 truncate">
                    {node.title}
                  </div>
                  <div className="text-[10px] text-slate-600 leading-tight break-words line-clamp-2">
                    {node.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "writingLines": {
        const title = content?.title || "Hand-Copy Area";
        const promptText = content?.promptText;
        const lineCount = Math.max(3, content?.lineCount || 6);

        return (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden">
            <div className="shrink-0">
              <div className="text-xs font-bold text-slate-800">
                {title}
              </div>
              {promptText && (
                <p className="text-[11px] text-slate-500 whitespace-pre-line mt-0.5 leading-snug">
                  {promptText}
                </p>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-evenly mt-2 min-h-0">
              {Array.from({ length: lineCount }).map((_, i) => (
                <div
                  key={i}
                  className="w-full border-b border-dashed border-slate-300 h-full max-h-7"
                />
              ))}
            </div>
          </div>
        );
      }

      case "drawingArea": {
        const title = content?.title || "Visual Scratchpad";
        const watermark = content?.promptWatermark || "Draw or sketch here...";
        return (
          <div className="w-full h-full flex flex-col justify-between p-2 overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:12px_12px]">
            <div className="text-xs font-bold text-slate-700 shrink-0">
              {title}
            </div>
            <div className="text-[11px] text-slate-400 font-sans italic text-center my-auto pointer-events-none select-none">
              {watermark}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono text-right shrink-0">
              Hand-Draw Frame
            </div>
          </div>
        );
      }

      case "table": {
        const headers: string[] = content?.headers || ["Item", "Description", "Value"];
        const rows: string[][] = content?.rows || [
          ["Row 1", "Sample description", "100"],
          ["Row 2", "Another description", "250"],
        ];
        return (
          <div className="w-full h-full flex flex-col overflow-hidden text-xs">
            {content?.title && (
              <div className="font-bold text-slate-800 mb-1 shrink-0">{parseInlineFormatting(content.title)}</div>
            )}
            <table className="w-full border-collapse border border-slate-200 text-left flex-1">
              <thead>
                <tr className="bg-slate-100">
                  {headers.map((h, i) => (
                    <th key={i} className="border border-slate-200 px-2 py-1 font-semibold text-slate-700 text-[11px]">
                      {parseInlineFormatting(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="border border-slate-200 px-2 py-1 text-slate-600 text-[11px] truncate">
                        {parseInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case "quote": {
        const quote = content?.quote || "The most powerful force in the universe is compound interest.";
        const author = content?.author || "Albert Einstein";
        return (
          <div className="w-full h-full flex flex-col justify-center border-l-4 border-indigo-500 pl-3 py-1 overflow-hidden">
            <p className="text-xs italic text-slate-700 break-words leading-relaxed font-serif">
              "{parseInlineFormatting(quote)}"
            </p>
            {author && (
              <div className="text-[10px] font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                — {parseInlineFormatting(author)}
              </div>
            )}
          </div>
        );
      }

      case "checkboxGroup": {
        const title = content?.title || "Verification Checklist";
        const items: Array<{ text: string; checked?: boolean }> = content?.items || [
          { text: "Understand formula terms", checked: true },
          { text: "Calculate Year 10 figure", checked: false },
        ];
        return (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden text-xs">
            {title && <div className="font-bold text-slate-800 mb-1.5 shrink-0">{parseInlineFormatting(title)}</div>}
            <div className="flex-1 flex flex-col justify-evenly space-y-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-700">
                  {item.checked ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="text-[11px] truncate">{parseInlineFormatting(item.text)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "divider": {
        return (
          <div className="w-full h-full flex items-center justify-center">
            <hr className="w-full border-t border-slate-300" />
          </div>
        );
      }

      case "image":
      case "illustration":
      case "imagePlaceholder": {
        const url = content?.url;
        const caption = content?.caption || "Illustration";
        return (
          <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden bg-slate-50 rounded border border-dashed border-slate-300 p-2">
            {url ? (
              <img
                src={url}
                alt={caption}
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400 text-center">
                <FileText className="w-6 h-6 mb-1 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">{caption}</span>
                <span className="text-[10px] text-slate-400">Aspect-Ratio Preserved</span>
              </div>
            )}
          </div>
        );
      }

      case "richText":
      case "text":
      default: {
        const textContent = typeof content === "string" ? content : content?.text || "Sample text element.";
        return (
          <div
            className="w-full h-full overflow-hidden leading-relaxed"
            style={{
              fontSize: `${style.fontSize || 13}px`,
              color: style.color || "#334155",
              textAlign: style.textAlign || "left",
              lineHeight: style.lineHeight || 1.5,
              fontFamily: style.fontFamily || "Inter, sans-serif",
            }}
          >
            <MarkdownWithMath content={textContent} />
          </div>
        );
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ filter: bwStyleFilter }}
    >
      {renderContent()}

      {/* Overflow Warning Badge in Edit Mode */}
      {!isPreview && hasOverflow && (
        <div
          title="Content exceeds element boundary! Text or elements may clip."
          className="no-print absolute top-1 right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-md flex items-center justify-center z-50 pointer-events-auto cursor-help"
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
};