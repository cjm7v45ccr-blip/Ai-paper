"use client";

import React, { useRef, useState, useEffect } from "react";
import { DocumentElement } from "@/types/document";
import {
  AlertCircle,
  CheckSquare,
  Square,
  FileText,
  Sigma,
  Check,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  Layers,
  Columns3,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { MathRenderer, MarkdownWithMath, parseInlineFormatting } from "@/lib/math-markdown-engine";

interface ElementRendererProps {
  element: DocumentElement;
  dpi?: number;
  isSelected?: boolean;
  isBlackAndWhite?: boolean;
  isPreview?: boolean;
  isPresentation?: boolean;
  onUpdateContent?: (newContent: any, newMetadata?: any) => void;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  dpi = 96,
  isSelected = false,
  isBlackAndWhite = false,
  isPreview = false,
  isPresentation = false,
  onUpdateContent,
}) => {
  const { type, content, style = {} } = element;
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
        const badge = element.metadata?.badge;
        const standard = element.metadata?.standard;

        return (
          <div className="w-full h-full flex flex-col justify-center px-1">
            {(badge || standard) && (
              <div className="flex items-center gap-2 mb-1 shrink-0">
                {badge && (
                  <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-300 uppercase">
                    {badge}
                  </span>
                )}
                {standard && (
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {standard}
                  </span>
                )}
              </div>
            )}
            <h1
              className="font-bold tracking-tight break-words"
              style={{
                fontSize: `${style.fontSize || 24}px`,
                fontWeight: style.fontWeight || 800,
                color: style.color || "#09090b",
                textAlign: style.textAlign || "left",
                fontFamily: style.fontFamily || "Inter, sans-serif",
                lineHeight: style.lineHeight || 1.2,
              }}
            >
              {parseInlineFormatting(title || "Document Heading")}
            </h1>
            {subtitle && (
              <p
                className="mt-1 text-zinc-500 font-normal break-words"
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
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 shrink-0 pb-1 border-b border-zinc-200">
                <div className="flex items-center gap-1.5 truncate">
                  <Sigma className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                  <span className="truncate">{formulaTitle}</span>
                </div>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                  LaTeX
                </span>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center p-2.5 bg-zinc-50/80 rounded-lg border border-zinc-200 shadow-2xs select-text overflow-x-auto min-h-0 my-1">
              <MathRenderer latex={equation} displayMode={true} className="text-base md:text-lg text-zinc-900 font-serif" />
            </div>
            {breakdown.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 shrink-0">
                {breakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-zinc-800 bg-white px-2 py-1 rounded border border-zinc-200 shadow-2xs overflow-hidden">
                    <span className="shrink-0 px-1.5 py-0.5 bg-zinc-100 border border-zinc-300 text-zinc-900 rounded font-serif text-[11px] leading-none flex items-center justify-center min-w-[22px]">
                      <MathRenderer latex={item.symbol} displayMode={false} />
                    </span>
                    <span className="truncate text-[11px] font-medium text-zinc-600">{parseInlineFormatting(item.label)}</span>
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
        const categoryBadge = element.metadata?.categoryBadge;
        const accentColor = element.metadata?.accentColor || "#0f172a";

        return (
          <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-1.5 mb-1 shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                <span className="font-semibold tracking-tight text-xs truncate" style={{ color: style.color || "#09090b" }}>
                  {parseInlineFormatting(title)}
                </span>
              </div>
              {categoryBadge && (
                <span className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase border border-zinc-200 shrink-0">
                  {categoryBadge}
                </span>
              )}
            </div>
            <div className="text-[11.5px] leading-relaxed overflow-hidden flex-1 select-text" style={{ color: style.color || "#3f3f46" }}>
              <MarkdownWithMath content={body} />
            </div>
          </div>
        );
      }

      case "chart": {
        const title = content?.title || "Growth Comparison";
        const series = content?.series || [
          { name: "Primary", color: "#18181b", values: [100, 200, 350, 500, 750, 1000] },
        ];
        const labels = content?.labels || ["0", "2", "4", "6", "8", "10"];

        let allVals: number[] = [];
        series.forEach((s: any) => {
          if (Array.isArray(s.values)) allVals.push(...s.values);
        });
        const minVal = allVals.length > 0 ? Math.min(...allVals) * 0.9 : 0;
        const maxVal = allVals.length > 0 ? Math.max(...allVals) * 1.05 : 1000;
        const range = maxVal - minVal || 1;

        return (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 tracking-tight shrink-0 pb-1 border-b border-zinc-200">
              <span className="truncate">{title}</span>
              <div className="flex items-center gap-3 text-[10px]">
                {series.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color || "#18181b" }} />
                    <span className="text-zinc-600 font-medium truncate max-w-[90px]">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SVG Chart */}
            <div className="flex-1 w-full relative mt-1 min-h-0">
              <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="500" y2="20" stroke="#e4e4e7" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="#e4e4e7" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#e4e4e7" strokeDasharray="3 3" strokeWidth="1" />

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
                        stroke={s.color || "#18181b"}
                        strokeWidth="2.2"
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
                            r="3"
                            fill="#ffffff"
                            stroke={s.color || "#18181b"}
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
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-200 shrink-0">
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
            <div className="text-xs font-semibold text-zinc-900 shrink-0 pb-1 border-b border-zinc-200">
              {title}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-1.5 flex-1 items-stretch">
              {nodes.map((node, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-50 border border-zinc-200 rounded-md p-2 text-center flex flex-col justify-between shadow-2xs overflow-hidden"
                >
                  <div className="text-[10px] font-mono font-semibold text-zinc-500">
                    {node.step}
                  </div>
                  <div className="text-xs font-semibold text-zinc-900 my-0.5 truncate">
                    {node.title}
                  </div>
                  <div className="text-[10px] text-zinc-600 leading-tight break-words line-clamp-2">
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
              <div className="text-xs font-semibold text-zinc-900">
                {title}
              </div>
              {promptText && (
                <p className="text-[11px] text-zinc-500 whitespace-pre-line mt-0.5 leading-snug">
                  {promptText}
                </p>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-evenly mt-2 min-h-0">
              {Array.from({ length: lineCount }).map((_, i) => (
                <div
                  key={i}
                  className="w-full border-b border-dashed border-zinc-300 h-full max-h-7"
                />
              ))}
            </div>
          </div>
        );
      }

      case "drawingArea": {
        const title = content?.title || "Workspace Canvas";
        const watermark = content?.promptWatermark || "Sketch or calculate here...";
        return (
          <div className="w-full h-full flex flex-col justify-between p-2 overflow-hidden bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:12px_12px]">
            <div className="text-xs font-semibold text-zinc-800 shrink-0">
              {title}
            </div>
            <div className="text-[11px] text-zinc-400 font-sans italic text-center my-auto pointer-events-none select-none">
              {watermark}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-mono text-right shrink-0">
              Drawing Area
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
              <div className="font-semibold text-zinc-900 mb-1 shrink-0">{parseInlineFormatting(content.title)}</div>
            )}
            <table className="w-full border-collapse border border-zinc-200 text-left flex-1">
              <thead>
                <tr className="bg-zinc-100/80">
                  {headers.map((h, i) => (
                    <th key={i} className="border border-zinc-200 px-2 py-1 font-semibold text-zinc-800 text-[11px]">
                      {parseInlineFormatting(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="border border-zinc-200 px-2 py-1 text-zinc-700 text-[11px] truncate">
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
        const quote = content?.quote || "The greatest value of a picture is when it forces us to notice what we never expected to see.";
        const author = content?.author || "John Tukey";
        return (
          <div className="w-full h-full flex flex-col justify-center border-l-2 border-zinc-900 pl-3 py-1 overflow-hidden">
            <p className="text-xs italic text-zinc-800 break-words leading-relaxed font-serif">
              "{parseInlineFormatting(quote)}"
            </p>
            {author && (
              <div className="text-[10px] font-medium text-zinc-500 mt-1 uppercase tracking-wide">
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
          { text: "Calculate final figure", checked: false },
        ];
        return (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden text-xs">
            {title && <div className="font-semibold text-zinc-900 mb-1.5 shrink-0">{parseInlineFormatting(title)}</div>}
            <div className="flex-1 flex flex-col justify-evenly space-y-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-zinc-800">
                  {item.checked ? (
                    <div className="w-3.5 h-3.5 rounded bg-zinc-900 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded border border-zinc-300 shrink-0 bg-white" />
                  )}
                  <span className="text-[11px] truncate">{parseInlineFormatting(item.text)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "card": {
        const title = content?.title || "Feature Overview";
        const cards: Array<{
          badge?: string;
          title: string;
          description: string;
          highlight?: boolean;
        }> = content?.cards || [
          { badge: "01", title: "Smart Architecture", description: "Modular semantic blocks engineered for print and presentation.", highlight: true },
          { badge: "02", title: "Sub-Millimeter Snap", description: "Precision guidelines, dot grids, and collision prevention.", highlight: false },
          { badge: "03", title: "Apple Typography", description: "Curated mathematical ratios and high-contrast styling.", highlight: false },
        ];

        return (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden p-1">
            {title && (
              <div
                className="font-bold tracking-tight mb-2 shrink-0"
                style={{
                  fontSize: `${style.fontSize || 16}px`,
                  color: style.color || "#09090b",
                  fontFamily: style.fontFamily || "inherit",
                }}
              >
                {parseInlineFormatting(title)}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 items-stretch min-h-0">
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between overflow-hidden shadow-2xs ${
                    card.highlight
                      ? "bg-indigo-50/70 border-indigo-200 text-indigo-950"
                      : "bg-white border-zinc-200 text-zinc-900"
                  }`}
                >
                  <div>
                    {card.badge && (
                      <span className="inline-block text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 uppercase mb-1.5">
                        {card.badge}
                      </span>
                    )}
                    <h4 className="text-xs font-bold tracking-tight line-clamp-1 mb-1">
                      {parseInlineFormatting(card.title)}
                    </h4>
                    <p className="text-[11px] text-zinc-600 leading-snug break-words line-clamp-3">
                      {parseInlineFormatting(card.description)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "metric": {
        const title = content?.title || "Key Performance Metric";
        const metrics: Array<{
          value: string;
          label: string;
          change?: string;
          isPositive?: boolean;
        }> = content?.metrics || [
          { value: "98.4%", label: "Accuracy Ratio", change: "+4.2%", isPositive: true },
          { value: "$2.4M", label: "Annual Run Rate", change: "+38%", isPositive: true },
          { value: "<12ms", label: "Render Latency", change: "-65%", isPositive: true },
        ];

        return (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden p-1">
            {title && (
              <div className="text-xs font-semibold text-zinc-900 mb-1.5 shrink-0">
                {parseInlineFormatting(title)}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 items-stretch min-h-0">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-zinc-200 rounded-lg p-2.5 flex flex-col justify-between shadow-2xs overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-zinc-500 font-medium truncate uppercase tracking-wider">
                      {m.label}
                    </span>
                    {m.change && (
                      <span
                        className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded flex items-center gap-0.5 ${
                          m.isPositive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {m.isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        {m.change}
                      </span>
                    )}
                  </div>
                  <div
                    className="text-xl font-black tracking-tight text-zinc-900 mt-1"
                    style={{ fontFamily: style.fontFamily || "Inter, sans-serif" }}
                  >
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "timeline": {
        const title = content?.title || "Strategic Roadmap";
        const events: Array<{
          phase: string;
          title: string;
          status?: "completed" | "in-progress" | "planned";
          desc?: string;
        }> = content?.events || [
          { phase: "Q1", title: "Foundation", status: "completed", desc: "Core spatial grid & engine" },
          { phase: "Q2", title: "AI Generation", status: "completed", desc: "Gamma-style smart remixing" },
          { phase: "Q3", title: "Workspace Integration", status: "in-progress", desc: "Google Docs & Slides fidelity" },
        ];

        return (
          <div className="w-full h-full flex flex-col justify-between overflow-hidden p-1">
            <div className="text-xs font-semibold text-zinc-900 shrink-0 pb-1 border-b border-zinc-200 mb-1">
              {parseInlineFormatting(title)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 items-stretch min-h-0">
              {events.map((ev, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-zinc-200 rounded-lg p-2.5 flex flex-col justify-between shadow-2xs relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                      {ev.phase}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        ev.status === "completed"
                          ? "bg-emerald-500"
                          : ev.status === "in-progress"
                          ? "bg-indigo-500 animate-pulse"
                          : "bg-zinc-300"
                      }`}
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-900 truncate mb-0.5">
                      {parseInlineFormatting(ev.title)}
                    </h5>
                    {ev.desc && (
                      <p className="text-[10px] text-zinc-500 leading-snug line-clamp-2">
                        {parseInlineFormatting(ev.desc)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "divider": {
        return (
          <div className="w-full h-full flex items-center justify-center">
            <hr className="w-full border-t border-zinc-300" />
          </div>
        );
      }

      case "image":
      case "illustration":
      case "imagePlaceholder": {
        const url = content?.url;
        const svgCode = content?.svg;
        const caption = content?.caption || "Image";
        const tag = content?.tag || element.metadata?.badge || "IMAGE";

        if (svgCode) {
          return (
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden p-1"
              dangerouslySetInnerHTML={{ __html: svgCode }}
            />
          );
        }

        const handleFileSelect = (file: File) => {
          if (!file || !file.type.startsWith("image/")) return;
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            if (dataUrl && onUpdateContent) {
              const fileNameClean = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
              onUpdateContent(
                {
                  ...content,
                  url: dataUrl,
                  caption: fileNameClean,
                  tag: "UPLOADED",
                },
                {
                  ...element.metadata,
                  semanticName: file.name,
                  altText: fileNameClean,
                  description: `Uploaded image: ${fileNameClean}`,
                }
              );
            }
          };
          reader.readAsDataURL(file);
        };

        return (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
              const files = e.dataTransfer.files;
              if (files && files.length > 0) {
                handleFileSelect(files[0]);
              }
            }}
            className={`w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-lg border relative group/img transition-all ${
              isDragOver
                ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400"
                : "bg-zinc-100/90 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {url ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                <img
                  src={url}
                  alt={caption}
                  className="w-full h-full object-cover rounded-md pointer-events-none"
                />
                {/* Image Tag Badge */}
                {tag && (
                  <div className="absolute top-1.5 left-2 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs pointer-events-none">
                    {tag}
                  </div>
                )}
                {/* Replace Image Overlay Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute top-1.5 right-2 bg-black/75 hover:bg-black backdrop-blur-xs text-white text-[10px] font-medium px-2 py-1 rounded shadow-md opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Replace</span>
                </button>
                {/* Image Caption */}
                {caption && (
                  <div className="absolute bottom-1.5 left-2 right-2 bg-black/65 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md text-center truncate pointer-events-none">
                    {caption}
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center text-zinc-400 text-center p-3 cursor-pointer w-full h-full hover:bg-zinc-200/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-2xs mb-1.5 border border-zinc-200 text-indigo-600">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-zinc-700">{caption}</span>
                <span className="text-[10px] font-mono text-zinc-500 mt-0.5">Click or drop image to upload</span>
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
              fontWeight: style.fontWeight || "normal",
              fontStyle: style.fontStyle || "normal",
              textDecoration: style.textDecoration || "none",
              color: style.color || "#27272a",
              textAlign: style.textAlign || "left",
              lineHeight: style.lineHeight || 1.5,
              fontFamily: style.fontFamily || "Inter, sans-serif",
              letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
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
          title="Content exceeds boundary. Container may clip when printed."
          className="no-print absolute top-1 right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-md flex items-center justify-center z-50 pointer-events-auto cursor-help"
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
};
