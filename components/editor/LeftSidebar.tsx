"use client";

import React, { useState } from "react";
import {
  Type,
  Heading,
  TrendingUp,
  Workflow,
  PenTool,
  Sparkles,
  Layers,
  Square,
  Minus,
  ArrowRight,
  Quote as QuoteIcon,
  Image as ImageIcon,
  Sigma,
  Table as TableIcon,
  CheckSquare,
  ListOrdered,
  ShieldCheck,
  Wand2,
  Scale,
  BrainCircuit,
  Sliders,
  Compass,
} from "lucide-react";
import { DocumentElement, DocumentModel, DesignReasoning } from "@/types/document";
import { SAFE_MARGIN_INCHES, PAGE_WIDTH_INCHES, PAGE_HEIGHT_INCHES } from "@/lib/coordinates";

interface LeftSidebarProps {
  document?: DocumentModel;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onAddElement: (element: DocumentElement) => void;
  onApplyTemplate: (preset: "compound-interest" | "photosynthesis" | "quiz" | "physics" | "executive" | "chemistry") => void;
  onAutoDesign?: (mode: string) => void;
  designReasoning?: DesignReasoning;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  document: doc,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onApplyTemplate,
  onAutoDesign,
  designReasoning,
}) => {
  const [activeTab, setActiveTab] = useState<"dia" | "components" | "outline">("dia");

  const createSmartElement = (type: DocumentElement["type"]) => {
    let width = 4.0;
    let height = 1.6;
    let content: any = "Sample text";
    let metadata: any = { label: type };

    switch (type) {
      case "heading":
        width = 7.4;
        height = 0.85;
        content = {
          title: "New Section Title",
          subtitle: "Clear explanatory subtitle describing core concept",
        };
        metadata = { label: "Heading Block", badge: "SECTION" };
        break;
      case "text":
        width = 3.58;
        height = 1.4;
        content =
          "Detailed explanation or study notes. Content automatically wraps cleanly and respects document boundaries.";
        metadata = { label: "Text Block" };
        break;
      case "formula":
        width = 3.58;
        height = 1.9;
        content = {
          title: "Governing Law / Equation",
          equation: "E = mc^2",
          breakdown: [
            { symbol: "E", label: "Energy (Joules)" },
            { symbol: "m", label: "Relativistic Mass (kg)" },
            { symbol: "c", label: "Speed of Light in Vacuum (m/s)" },
          ],
        };
        metadata = { label: "Formula Card", categoryBadge: "FORMULA" };
        break;
      case "callout":
        width = 3.58;
        height = 1.4;
        content = {
          title: "Critical Principle",
          body: "Always verify units before completing calculations.",
        };
        metadata = { label: "Callout", categoryBadge: "INSIGHT", accentColor: "#6366f1" };
        break;
      case "chart":
        width = 7.4;
        height = 2.2;
        content = {
          title: "Experimental Observations & Rate Progression",
          labels: ["t0", "t1", "t2", "t3", "t4", "t5"],
          series: [
            { name: "Observed", color: "#6366f1", values: [10, 25, 45, 70, 95, 120] },
            { name: "Baseline", color: "#94a3b8", values: [10, 20, 30, 40, 50, 60] },
          ],
        };
        metadata = { label: "Data Chart", categoryBadge: "EMPIRICAL" };
        break;
      case "diagram":
        width = 7.4;
        height = 1.6;
        content = {
          title: "3-Stage Reaction Protocol",
          steps: [
            { number: 1, title: "Tare Balance", subtitle: "Zero out boat", color: "#6366f1" },
            { number: 2, title: "Measure Reagents", subtitle: "Record to 0.01g", color: "#06b6d4" },
            { number: 3, title: "Initiate Stir", subtitle: "Maintain 25°C", color: "#10b981" },
          ],
        };
        metadata = { label: "Process Diagram", categoryBadge: "PROTOCOL" };
        break;
      case "writingLines":
        width = 7.4;
        height = 1.6;
        content = {
          prompt: "Synthesize Findings & Experimental Margin of Error:",
          lineCount: 4,
          spacing: 28,
        };
        metadata = { label: "Synthesis Workspace", categoryBadge: "STUDENT WORKSPACE" };
        break;
      case "table":
        width = 7.4;
        height = 1.8;
        content = {
          title: "Comparative Parameters Matrix",
          headers: ["Parameter", "SI Base Unit", "Typical Magnitude", "Dimensional Form"],
          rows: [
            ["Mass", "kg", "10^-3 to 10^3", "[M]"],
            ["Length", "m", "10^-9 to 10^3", "[L]"],
            ["Time", "s", "10^-6 to 10^4", "[T]"],
          ],
        };
        metadata = { label: "Data Matrix", categoryBadge: "REFERENCE" };
        break;
      case "quote":
        width = 7.4;
        height = 1.1;
        content = {
          quote: "Architecture is the learned game, correct and magnificent, of forms assembled in the light.",
          author: "Le Corbusier",
        };
        metadata = { label: "Featured Quote" };
        break;
      case "checkboxGroup":
        width = 3.58;
        height = 1.5;
        content = {
          title: "Verification Checklist",
          items: [
            { text: "Identified all initial given parameters", checked: true },
            { text: "Derived dimensionally consistent equation", checked: false },
            { text: "Checked answer with correct significant figures", checked: false },
          ],
        };
        metadata = { label: "Checklist" };
        break;
      case "divider":
        width = 7.4;
        height = 0.2;
        content = {};
        metadata = { label: "Section Divider" };
        break;
    }

    const newEl: DocumentElement = {
      id: `el-${Date.now()}`,
      type,
      x: SAFE_MARGIN_INCHES + 0.1,
      y: 2.2,
      width,
      height,
      zIndex: 10,
      content,
      metadata,
      style: {
        backgroundColor: type === "callout" ? "#f8fafc" : "#ffffff",
        borderColor: type === "callout" ? "#818cf8" : "#cbd5e1",
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
      },
    };

    onAddElement(newEl);
  };

  return (
    <aside className="no-print w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] z-20 shrink-0 select-none shadow-xl">
      {/* Studio Tab Switcher */}
      <div className="flex border-b border-slate-800 p-1.5 gap-1 bg-slate-950/60">
        <button
          onClick={() => setActiveTab("dia")}
          className={`flex-1 text-xs py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "dia"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm border border-indigo-400/40"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
          title="Dia Autonomous Designist & Creative Brain"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Dia Brain</span>
        </button>
        <button
          onClick={() => setActiveTab("components")}
          className={`flex-1 text-xs py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "components"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
          title="Architectural Blocks & Elements"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Blocks</span>
        </button>
        <button
          onClick={() => setActiveTab("outline")}
          className={`flex-1 text-xs py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "outline"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
          title="Spatial Document Tree"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Outline</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* TAB 1: DIA DESIGNIST & BRAIN */}
        {activeTab === "dia" && (
          <div className="space-y-4">
            {/* Live Design Telemetry Card */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <BrainCircuit className="w-3.5 h-3.5" /> Dia Telemetry
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 font-semibold">
                  0.45" Safe Margin Locked
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-700/50">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">Visual Balance</div>
                  <div className="text-sm font-extrabold text-white mt-0.5 font-sans flex items-center gap-1">
                    <span>98.4%</span>
                    <span className="text-[9px] text-emerald-400 font-normal">Optimal</span>
                  </div>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono">Math Engine</div>
                  <div className="text-sm font-extrabold text-white mt-0.5 font-sans flex items-center gap-1">
                    <Sigma className="w-3.5 h-3.5 text-indigo-400" />
                    <span>KaTeX</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Autonomous Directives (Dia does whatever looks best) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Wand2 className="w-3 h-3 text-amber-400" /> Autonomous Directives
                </h4>
                <span className="text-[9px] text-slate-500 font-mono">Live AI Engine</span>
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={() => onAutoDesign?.("auto")}
                  className="w-full text-left p-2.5 rounded-xl bg-gradient-to-r from-violet-950/60 to-indigo-950/60 hover:from-violet-900/60 hover:to-indigo-900/60 border border-indigo-700/50 hover:border-indigo-500 text-white transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-200 group-hover:text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Dia Autonomous Redesign
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400">Run</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-snug">
                    Dia analyzes semantic roles, recalculates golden-ratio columns, elevates math & balances vertical rhythm.
                  </p>
                </button>

                <button
                  onClick={() => onAutoDesign?.("chemistry")}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                      <span>🧪</span> STEM Measurement & KaTeX Guide
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Apply</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-snug">
                    Generates elevated KaTeX density formulas, metric progression, and synthesis workspace.
                  </p>
                </button>

                <button
                  onClick={() => onAutoDesign?.("balance")}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-cyan-400" /> Equalize Column Weights
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Balance</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-snug">
                    Eliminates awkward blank column space by packing elements symmetrically.
                  </p>
                </button>

                <button
                  onClick={() => onAutoDesign?.("margins")}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Clamp to 0.45" Bleed
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Verify</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-snug">
                    Guarantees all elements sit strictly within physical print bleed constraints.
                  </p>
                </button>
              </div>
            </div>

            {/* Live Design Decisions Stream */}
            {designReasoning && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                  Dia Designist Reasoning
                </span>
                <div className="text-[11px] text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-500">Archetype: </span>
                    <span className="font-semibold text-white">{designReasoning.documentType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Grid: </span>
                    <span className="font-mono text-slate-300 text-[10px]">{designReasoning.gridSystem}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Typography: </span>
                    <span className="text-slate-300">{designReasoning.typographyPairing}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ARCHITECTURAL BLOCKS */}
        {activeTab === "components" && (
          <div className="space-y-4">
            {/* Math & Formulas */}
            <div>
              <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider mb-2">
                Math & LaTeX Rigor
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => createSmartElement("formula")}
                  className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-left hover:border-indigo-500 hover:bg-slate-800 transition-all group"
                >
                  <Sigma className="w-4 h-4 text-indigo-400 mb-1" />
                  <div className="text-xs font-bold text-slate-100">Hero Formula</div>
                  <div className="text-[10px] text-slate-400">KaTeX card</div>
                </button>
                <button
                  onClick={() => createSmartElement("callout")}
                  className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-left hover:border-indigo-500 hover:bg-slate-800 transition-all group"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 mb-1" />
                  <div className="text-xs font-bold text-slate-100">Key Takeaway</div>
                  <div className="text-[10px] text-slate-400">High-contrast</div>
                </button>
              </div>
            </div>

            {/* Structure & Typography */}
            <div>
              <h4 className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
                Structure & Flow
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => createSmartElement("heading")}
                  className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-left hover:border-cyan-500 hover:bg-slate-800 transition-all group"
                >
                  <Heading className="w-4 h-4 text-cyan-400 mb-1" />
                  <div className="text-xs font-bold text-slate-100">Heading & Badge</div>
                  <div className="text-[10px] text-slate-400">Section title</div>
                </button>
                <button
                  onClick={() => createSmartElement("text")}
                  className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-left hover:border-cyan-500 hover:bg-slate-800 transition-all group"
                >
                  <Type className="w-4 h-4 text-cyan-400 mb-1" />
                  <div className="text-xs font-bold text-slate-100">Text Bento</div>
                  <div className="text-[10px] text-slate-400">Body column</div>
                </button>
                <button
                  onClick={() => createSmartElement("table")}
                  className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-left hover:border-cyan-500 hover:bg-slate-800 transition-all group"
                >
                  <TableIcon className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-xs font-bold text-slate-100">Data Matrix</div>
                  <div className="text-[10px] text-slate-400">Tabular figures</div>
                </button>
                <button
                  onClick={() => createSmartElement("diagram")}
                  className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-left hover:border-cyan-500 hover:bg-slate-800 transition-all group"
                >
                  <Workflow className="w-4 h-4 text-pink-400 mb-1" />
                  <div className="text-xs font-bold text-slate-100">Step Pipeline</div>
                  <div className="text-[10px] text-slate-400">Multi-stage flow</div>
                </button>
              </div>
            </div>

            {/* Practice & Workspace */}
            <div>
              <h4 className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">
                Pedagogy & Synthesis
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => createSmartElement("writingLines")}
                  className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-left hover:border-emerald-500 hover:bg-slate-800 transition-all group"
                >
                  <PenTool className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-xs font-bold text-slate-100">Ruled Pad</div>
                  <div className="text-[10px] text-slate-400">Synthesis lines</div>
                </button>
                <button
                  onClick={() => createSmartElement("checkboxGroup")}
                  className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-left hover:border-emerald-500 hover:bg-slate-800 transition-all group"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="text-xs font-bold text-slate-100">Rubric / Checks</div>
                  <div className="text-[10px] text-slate-400">Verification list</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SPATIAL HIERARCHY & OUTLINE */}
        {activeTab === "outline" && (
          <div className="space-y-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Spatial Reading Order</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-mono">
                  {doc?.elements?.length || 0} Nodes
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <div>Page: <span className="font-mono text-slate-200">8.5" × 11"</span></div>
                <div>Bleed: <span className="font-mono text-emerald-400">0.45" Locked</span></div>
              </div>
            </div>

            {/* Element Outline Items */}
            <div className="space-y-1">
              {(!doc?.elements || doc.elements.length === 0) ? (
                <div className="text-xs text-slate-500 italic p-3 text-center">
                  Canvas is empty
                </div>
              ) : (
                [...doc.elements]
                  .sort((a, b) => {
                    if (Math.abs(a.y - b.y) > 0.4) return a.y - b.y;
                    return a.x - b.x;
                  })
                  .map((el, idx) => {
                    const isSelected = selectedElementId === el.id;
                    let displayTitle: string = el.type;
                    if (el.content?.title) {
                      displayTitle = el.content.title;
                    } else if (el.content?.equation) {
                      displayTitle = `Eq: ${el.content.equation}`;
                    } else if (typeof el.content === "string") {
                      displayTitle = el.content.slice(0, 30);
                    }

                    return (
                      <button
                        key={el.id}
                        onClick={() => onSelectElement?.(el.id)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-start gap-2 border ${
                          isSelected
                            ? "bg-indigo-950/80 border-indigo-500 text-white font-bold shadow-sm"
                            : "bg-slate-800/40 hover:bg-slate-800 border-slate-800 text-slate-300"
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-indigo-400 mt-0.5 shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate leading-tight">{displayTitle}</div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span className="capitalize text-slate-400">{el.type}</span>
                            <span>•</span>
                            <span>{el.x.toFixed(1)}", {el.y.toFixed(1)}"</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
