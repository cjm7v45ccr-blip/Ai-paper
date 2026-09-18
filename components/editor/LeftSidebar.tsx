"use client";

import React, { useState } from "react";
import {
  Type,
  Heading,
  TrendingUp,
  Workflow,
  PenTool,
  LayoutTemplate,
  Table as TableIcon,
  CheckSquare,
  Sparkles,
  Layers,
  Square,
  Minus,
  ArrowRight,
  Quote as QuoteIcon,
  Image as ImageIcon,
  HelpCircle,
  FileCode,
  Sigma,
  ChevronDown,
  ListOrdered,
  ShieldCheck,
} from "lucide-react";
import { DocumentElement, DocumentModel } from "@/types/document";
import { SAFE_MARGIN_INCHES, PAGE_WIDTH_INCHES, PAGE_HEIGHT_INCHES } from "@/lib/coordinates";

interface LeftSidebarProps {
  document?: DocumentModel;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onAddElement: (element: DocumentElement) => void;
  onApplyTemplate: (preset: "compound-interest" | "photosynthesis" | "quiz" | "physics" | "executive" | "chemistry") => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  document: doc,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onApplyTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<"outline" | "components" | "templates">("outline");

  const createSmartElement = (type: DocumentElement["type"]) => {
    // Standard safe defaults
    let width = 4.0;
    let height = 1.6;
    let content: any = "Sample text";
    let metadata: any = { label: type };

    switch (type) {
      case "heading":
        width = 7.4;
        height = 0.8;
        content = {
          title: "New Section Title",
          subtitle: "Clear explanatory subtitle describing core concept",
        };
        metadata = { label: "Heading Block" };
        break;
      case "text":
        width = 3.6;
        height = 1.4;
        content =
          "Detailed explanation or study notes. Content automatically wraps cleanly and respects document boundaries.";
        metadata = { label: "Text Block" };
        break;
      case "formula":
        width = 4.2;
        height = 1.6;
        content = {
          equation: "F = ma",
          breakdown: [
            { symbol: "F", label: "Force (Newtons)" },
            { symbol: "m", label: "Mass (kg)" },
            { symbol: "a", label: "Acceleration (m/s²)" },
          ],
        };
        metadata = { label: "Physics Formula Card" };
        break;
      case "callout":
        width = 3.2;
        height = 1.5;
        content = {
          title: "Key Takeaway",
          body: "Always verify units before computing multi-step formulas.",
        };
        metadata = { label: "Key Insight Callout" };
        break;
      case "chart":
        width = 7.4;
        height = 2.2;
        content = {
          title: "Linear vs Quadratic Trend ($100 base)",
          labels: ["T0", "T2", "T4", "T6", "T8", "T10"],
          series: [
            { name: "Linear", color: "#64748b", values: [100, 200, 300, 400, 500, 600] },
            { name: "Exponential", color: "#4f46e5", values: [100, 144, 256, 400, 625, 900] },
          ],
        };
        metadata = { label: "Trend Line Chart" };
        break;
      case "diagram":
        width = 7.4;
        height = 1.6;
        content = {
          title: "Sequential Discovery Process",
          nodes: [
            { step: "01", title: "Hypothesis", desc: "Formulate observable premise" },
            { step: "02", title: "Experiment", desc: "Run controlled trials" },
            { step: "03", title: "Synthesis", desc: "Consolidate model equations" },
          ],
        };
        metadata = { label: "3-Step Discovery Diagram" };
        break;
      case "writingLines":
        width = 4.4;
        height = 3.0;
        content = {
          title: "Student Calculation Box",
          promptText: "Step 1: Write initial equation\nStep 2: Substitute values:",
          lineCount: 6,
        };
        metadata = { label: "Hand-Copy Ruled Practice" };
        break;
      case "drawingArea":
        width = 3.0;
        height = 3.0;
        content = {
          title: "Student Freehand Scratchpad",
          promptWatermark: "Sketch diagram or calculate scratch work...",
        };
        metadata = { label: "Scratchpad Canvas" };
        break;
      case "table":
        width = 7.4;
        height = 1.8;
        content = {
          title: "Sample Matrix",
          headers: ["Variable", "Description", "Standard Unit"],
          rows: [
            ["Velocity (v)", "Rate of change of displacement", "m/s"],
            ["Energy (E)", "Capacity to perform physical work", "Joules (J)"],
            ["Power (P)", "Rate of energy expenditure", "Watts (W)"],
          ],
        };
        metadata = { label: "Comparison Table" };
        break;
      case "quote":
        width = 5.0;
        height = 1.2;
        content = {
          quote: "Simplicity is the prerequisite for reliability.",
          author: "Edsger W. Dijkstra",
        };
        metadata = { label: "Featured Quote" };
        break;
      case "checkboxGroup":
        width = 3.6;
        height = 1.5;
        content = {
          title: "Problem Completion Checklist",
          items: [
            { text: "Identified all known variables", checked: true },
            { text: "Derived working formula", checked: false },
            { text: "Checked answer with correct units", checked: false },
          ],
        };
        metadata = { label: "Checklist" };
        break;
      case "imagePlaceholder":
        width = 3.2;
        height = 2.0;
        content = {
          caption: "Chloroplast Structure",
        };
        metadata = { label: "Image Placeholder" };
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
        backgroundColor: type === "callout" ? "#eef2ff" : "#ffffff",
        borderColor: type === "callout" ? "#818cf8" : "#cbd5e1",
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
      },
    };

    onAddElement(newEl);
  };

  return (
    <aside className="no-print w-64 bg-white border-r border-slate-200 flex flex-col h-[calc(100vh-3.5rem)] z-20 shrink-0 select-none">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 p-1.5 gap-1 bg-slate-50">
        <button
          onClick={() => setActiveTab("outline")}
          className={`flex-1 text-xs py-1.5 font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
            activeTab === "outline"
              ? "bg-white text-indigo-700 shadow-2xs border border-slate-200 font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
          title="Document Outline & Structure"
        >
          <ListOrdered className="w-3 h-3" />
          <span>Outline</span>
        </button>
        <button
          onClick={() => setActiveTab("components")}
          className={`flex-1 text-xs py-1.5 font-medium rounded-md transition-all ${
            activeTab === "components"
              ? "bg-white text-indigo-700 shadow-2xs border border-slate-200 font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Insert
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex-1 text-xs py-1.5 font-medium rounded-md transition-all ${
            activeTab === "templates"
              ? "bg-white text-indigo-700 shadow-2xs border border-slate-200 font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Archetypes
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {activeTab === "outline" ? (
          /* Google Docs Authentic Outline Tab */
          <div className="space-y-3">
            {/* Document Metrics Strip */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>Document Structure</span>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                  {doc?.elements?.length || 0} Elements
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <div>Page: <span className="font-semibold text-slate-700">8.5" × 11"</span></div>
                <div>Bleed: <span className="font-semibold text-emerald-700">0.45" safe</span></div>
              </div>
            </div>

            {/* Element Outline Items */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Reading Order Sections
              </span>
              {(!doc?.elements || doc.elements.length === 0) ? (
                <div className="text-xs text-slate-400 italic p-3 text-center">
                  Document canvas is empty
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
                      displayTitle = el.content.slice(0, 32);
                    }

                    return (
                      <button
                        key={el.id}
                        onClick={() => onSelectElement?.(el.id)}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-all flex items-start gap-2 border ${
                          isSelected
                            ? "bg-indigo-50/80 border-indigo-300 text-indigo-950 font-semibold shadow-2xs"
                            : "hover:bg-slate-50 border-transparent hover:border-slate-200 text-slate-700"
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate leading-tight">{displayTitle}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span className="capitalize">{el.type}</span>
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
        ) : activeTab === "components" ? (
          <>
            {/* Typography */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Typography
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => createSmartElement("heading")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <Heading className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Heading</div>
                  <div className="text-[10px] text-slate-400">Header & sub</div>
                </button>
                <button
                  onClick={() => createSmartElement("text")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <Type className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Text Block</div>
                  <div className="text-[10px] text-slate-400">Auto-wrap body</div>
                </button>
              </div>
            </div>

            {/* Visual Artifacts */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Visual Artifacts
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => createSmartElement("chart")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <TrendingUp className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Line Chart</div>
                  <div className="text-[10px] text-slate-400">Trend curves</div>
                </button>
                <button
                  onClick={() => createSmartElement("diagram")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <Workflow className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Diagram</div>
                  <div className="text-[10px] text-slate-400">3-Step cycle</div>
                </button>
              </div>
            </div>

            {/* STEM & Formula */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Math & Insights
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => createSmartElement("formula")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <Sigma className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Formula Card</div>
                  <div className="text-[10px] text-slate-400">Equation terms</div>
                </button>
                <button
                  onClick={() => createSmartElement("callout")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Callout</div>
                  <div className="text-[10px] text-slate-400">Key takeaway</div>
                </button>
              </div>
            </div>

            {/* Pedagogy & Practice */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Classroom Tools
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => createSmartElement("writingLines")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <PenTool className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Hand-Copy</div>
                  <div className="text-[10px] text-slate-400">Ruled practice</div>
                </button>
                <button
                  onClick={() => createSmartElement("drawingArea")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <LayoutTemplate className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Scratchpad</div>
                  <div className="text-[10px] text-slate-400">Dotted frame</div>
                </button>
              </div>
            </div>

            {/* Layout & Structure */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Structure
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => createSmartElement("table")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <TableIcon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Data Table</div>
                  <div className="text-[10px] text-slate-400">Columns & rows</div>
                </button>
                <button
                  onClick={() => createSmartElement("checkboxGroup")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <CheckSquare className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Checklist</div>
                  <div className="text-[10px] text-slate-400">Task items</div>
                </button>
                <button
                  onClick={() => createSmartElement("quote")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <QuoteIcon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Quote</div>
                  <div className="text-[10px] text-slate-400">Featured citation</div>
                </button>
                <button
                  onClick={() => createSmartElement("imagePlaceholder")}
                  className="p-2 border border-slate-200 rounded-lg text-left hover:border-indigo-400 hover:bg-indigo-50/40 transition-all group"
                >
                  <ImageIcon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 mb-1" />
                  <div className="text-xs font-medium text-slate-700">Image Box</div>
                  <div className="text-[10px] text-slate-400">Ratio locked</div>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Templates Section */
          <div className="space-y-2.5">
            <button
              onClick={() => onApplyTemplate("chemistry")}
              className="w-full p-3 border-2 border-emerald-500/80 bg-emerald-50/40 rounded-xl text-left hover:border-emerald-600 hover:bg-emerald-50 transition-all shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="text-sm">🧪</span> Chemistry Measurement Guide
                </div>
                <span className="text-[9px] font-bold uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                  AI Standard
                </span>
              </div>
              <div className="text-[11px] text-emerald-800/90 leading-snug">
                Dual-column bento grid, elevated D = m/V KaTeX card, conversion mnemonic, and units matrix.
              </div>
            </button>

            <button
              onClick={() => onApplyTemplate("compound-interest")}
              className="w-full p-3 border border-slate-200 rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50/30 transition-all"
            >
              <div className="text-xs font-bold text-slate-800">Compound Interest Guide</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                Formula, 10-yr chart, key takeaway, and ruled hand-copy box.
              </div>
            </button>

            <button
              onClick={() => onApplyTemplate("photosynthesis")}
              className="w-full p-3 border border-slate-200 rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50/30 transition-all"
            >
              <div className="text-xs font-bold text-slate-800">Photosynthesis Biology One-Pager</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                Chemical equation, reaction cycle diagram, and synthesis notes.
              </div>
            </button>

            <button
              onClick={() => onApplyTemplate("physics")}
              className="w-full p-3 border border-slate-200 rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50/30 transition-all"
            >
              <div className="text-xs font-bold text-slate-800">Physics Motion & Kinetics Sheet</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                Kinematic equations, trajectory chart, and scratch work grid.
              </div>
            </button>

            <button
              onClick={() => onApplyTemplate("quiz")}
              className="w-full p-3 border border-slate-200 rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50/30 transition-all"
            >
              <div className="text-xs font-bold text-slate-800">Diagnostic Practice Exam</div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                Multi-question rubric with verification checklist and score box.
              </div>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};