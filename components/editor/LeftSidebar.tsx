"use client";

import React, { useState } from "react";
import {
  FileText,
  Presentation,
  ListOrdered,
  Plus,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  Sigma,
  Table as TableIcon,
  CheckSquare,
  PenTool,
  BarChart3,
  Lightbulb,
  Workflow,
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Hash,
  LayoutTemplate,
  FileSpreadsheet,
  MoveUp,
  MoveDown,
} from "lucide-react";
import { DocumentModel, DocumentElement, DocumentMode, PageData } from "@/types/document";

interface LeftSidebarProps {
  document: DocumentModel;
  documentMode: DocumentMode;
  activePageIndex: number;
  onSelectPageIndex: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  selectedElementId?: string | null;
  onSelectElement: (id: string | null) => void;
  onAddElement: (element: DocumentElement) => void;
  onApplyPreset: (presetKey: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  document: doc,
  documentMode,
  activePageIndex,
  onSelectPageIndex,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onApplyPreset,
}) => {
  const [activeTab, setActiveTab] = useState<"pages" | "outline" | "insert" | "templates">("pages");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const pages: PageData[] = doc.pages && doc.pages.length > 0
    ? doc.pages
    : [
        {
          id: "page-1",
          title: "Page 1",
          elements: doc.elements || [],
        },
      ];

  const currentElements = pages[activePageIndex]?.elements || doc.elements || [];

  // Create Element Generator Helper
  const handleInsert = (type: DocumentElement["type"]) => {
    const newId = `el-${type}-${Date.now()}`;
    const isPresentation = documentMode === "presentation";
    const defaultW = isPresentation ? 5.5 : 7.4;
    const defaultH = isPresentation ? 1.8 : 1.4;

    let newElement: DocumentElement;

    switch (type) {
      case "heading":
        newElement = {
          id: newId,
          type: "heading",
          x: isPresentation ? 0.8 : 0.55,
          y: isPresentation ? 1.0 : 0.55,
          width: isPresentation ? 11.7 : 7.4,
          height: 0.85,
          zIndex: currentElements.length + 1,
          content: {
            title: isPresentation ? "Slide Title & Key Focus" : "Section Title",
            subtitle: "Concise explanatory subtitle summarizing key insight",
          },
          style: {
            fontSize: isPresentation ? 28 : 22,
            fontWeight: 700,
            color: "#09090b",
          },
          metadata: { label: "Heading Block", badge: isPresentation ? "KEY POINT" : "SECTION" },
        };
        break;

      case "formula":
        newElement = {
          id: newId,
          type: "formula",
          x: isPresentation ? 0.8 : 0.55,
          y: isPresentation ? 2.2 : 1.5,
          width: isPresentation ? 5.6 : 7.4,
          height: 1.6,
          zIndex: currentElements.length + 1,
          content: {
            title: "Mathematical Law / Formula",
            equation: "f(x) = \\int_{-\\infty}^{\\infty} \\hat{f}(\\xi)\\,e^{2\\pi i \\xi x}\\,d\\xi",
            breakdown: [
              { symbol: "f(x)", label: "Spatial function" },
              { symbol: "\\hat{f}", label: "Fourier transform" },
              { symbol: "\\xi", label: "Frequency component" },
            ],
          },
          style: {
            backgroundColor: "#fafafa",
            borderColor: "#e4e4e7",
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
          },
          metadata: { label: "Formula Card" },
        };
        break;

      case "callout":
        newElement = {
          id: newId,
          type: "callout",
          x: isPresentation ? 6.8 : 0.55,
          y: isPresentation ? 2.2 : 1.5,
          width: isPresentation ? 5.7 : 7.4,
          height: 1.6,
          zIndex: currentElements.length + 1,
          content: {
            title: "Core Concept & Takeaway",
            body: "Strategic takeaway emphasizing verified analytical results and architectural principles.",
          },
          style: {
            backgroundColor: "#f4f4f5",
            borderColor: "#d4d4d8",
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
          },
          metadata: { label: "Callout Box", accentColor: "#4f46e5", categoryBadge: "INSIGHT" },
        };
        break;

      case "chart":
        newElement = {
          id: newId,
          type: "chart",
          x: isPresentation ? 0.8 : 0.55,
          y: isPresentation ? 2.2 : 3.2,
          width: isPresentation ? 11.7 : 7.4,
          height: isPresentation ? 4.2 : 2.2,
          zIndex: currentElements.length + 1,
          content: {
            title: "Comparative Performance Trajectory",
            labels: ["M1", "M2", "M3", "M4", "M5", "M6"],
            series: [
              { name: "Optimal Target", color: "#4f46e5", values: [100, 240, 480, 850, 1400, 2200] },
              { name: "Baseline", color: "#71717a", values: [100, 180, 290, 410, 560, 750] },
            ],
          },
          style: {
            backgroundColor: "#ffffff",
            borderColor: "#e4e4e7",
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
          },
        };
        break;

      case "diagram":
        newElement = {
          id: newId,
          type: "diagram",
          x: isPresentation ? 0.8 : 0.55,
          y: isPresentation ? 2.2 : 5.5,
          width: isPresentation ? 11.7 : 7.4,
          height: 1.6,
          zIndex: currentElements.length + 1,
          content: {
            title: "Three-Stage Workflow Pipeline",
            nodes: [
              { step: "01", title: "Intake & Parsing", desc: "Structured data ingestion" },
              { step: "02", title: "Synthesis & KaTeX", desc: "Deterministic layout engine" },
              { step: "03", title: "Export & Delivery", desc: "Vector PDF & slides" },
            ],
          },
          style: {
            backgroundColor: "#fafafa",
            borderColor: "#e4e4e7",
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
          },
        };
        break;

      case "table":
        newElement = {
          id: newId,
          type: "table",
          x: 0.55,
          y: 2.0,
          width: isPresentation ? 11.7 : 7.4,
          height: 1.8,
          zIndex: currentElements.length + 1,
          content: {
            title: "Key Metrics Matrix",
            headers: ["Category", "Metric", "Target", "Status"],
            rows: [
              ["Latency", "Render Cycle", "< 16ms", "Passed"],
              ["Precision", "Print Bleed", "0.45''", "Verified"],
              ["Throughput", "Document Gen", "10x", "Active"],
            ],
          },
          style: {
            backgroundColor: "#ffffff",
            borderColor: "#e4e4e7",
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
          },
        };
        break;

      case "checkboxGroup":
        newElement = {
          id: newId,
          type: "checkboxGroup",
          x: 0.55,
          y: 2.0,
          width: isPresentation ? 11.7 : 7.4,
          height: 1.6,
          zIndex: currentElements.length + 1,
          content: {
            title: "Verification Action Items",
            items: [
              { text: "Confirm document structural hierarchy.", checked: true },
              { text: "Validate formula breakdown symbols.", checked: true },
              { text: "Inspect responsive 16:9 layout boundaries.", checked: false },
            ],
          },
          style: {
            backgroundColor: "#ffffff",
            borderColor: "#e4e4e7",
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
          },
        };
        break;

      case "writingLines":
        newElement = {
          id: newId,
          type: "writingLines",
          x: 0.55,
          y: 2.0,
          width: 7.4,
          height: 2.5,
          zIndex: currentElements.length + 1,
          content: {
            title: "Student Notes & Problem Solutions",
            promptText: "Step 1: Write down given parameters\nStep 2: Show intermediate calculation steps:",
            lineCount: 6,
          },
          style: {
            backgroundColor: "#ffffff",
            borderColor: "#e4e4e7",
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
          },
        };
        break;

      case "drawingArea":
        newElement = {
          id: newId,
          type: "drawingArea",
          x: 0.55,
          y: 2.0,
          width: 7.4,
          height: 2.5,
          zIndex: currentElements.length + 1,
          content: {
            title: "Workspace Sketchpad Canvas",
            promptWatermark: "Draft calculations or sketch curves here...",
          },
          style: {
            backgroundColor: "#fafafa",
            borderColor: "#e4e4e7",
            borderStyle: "dashed",
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
          },
        };
        break;

      default:
        newElement = {
          id: newId,
          type: "text",
          x: 0.55,
          y: 2.0,
          width: defaultW,
          height: defaultH,
          zIndex: currentElements.length + 1,
          content: "Rich text paragraph block. Supports **bold typography**, *italics*, and KaTeX equations like $E=mc^2$.",
          style: { fontSize: 13, color: "#27272a", lineHeight: 1.5 },
        };
    }

    onAddElement(newElement);
    onSelectElement(newId);
  };

  // Find all headings and sections for Outline tab
  const outlineItems = currentElements.filter(
    (el) => el.type === "heading" || el.type === "callout" || el.type === "formula" || el.type === "chart"
  );

  if (isCollapsed) {
    return (
      <div className="no-print w-11 bg-[#111215] border-r border-white/[0.07] flex flex-col items-center py-3 select-none shrink-0 z-20 transition-all">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors"
          title="Expand Navigation Panel"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="h-px w-6 bg-white/[0.07] my-3" />

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab("pages");
            }}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === "pages" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Pages / Slides"
          >
            {documentMode === "presentation" ? <Presentation className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab("insert");
            }}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === "insert" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Insert Components"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsCollapsed(false);
              setActiveTab("outline");
            }}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === "outline" ? "bg-white/[0.1] text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
            title="Document Outline"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="no-print w-64 bg-[#111215] text-zinc-300 border-r border-white/[0.07] flex flex-col h-[calc(100vh-3.25rem)] select-none shrink-0 z-20 transition-all">
      {/* Tab Navigation Header */}
      <div className="p-2 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#18191e] p-0.5 rounded-lg text-xs w-full mr-1">
          <button
            onClick={() => setActiveTab("pages")}
            className={`flex-1 py-1 px-1.5 rounded-md font-medium text-[11px] text-center transition-all ${
              activeTab === "pages" ? "bg-zinc-800 text-white shadow-2xs" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {documentMode === "presentation" ? "Slides" : "Pages"}
          </button>
          <button
            onClick={() => setActiveTab("outline")}
            className={`flex-1 py-1 px-1.5 rounded-md font-medium text-[11px] text-center transition-all ${
              activeTab === "outline" ? "bg-zinc-800 text-white shadow-2xs" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Outline
          </button>
          <button
            onClick={() => setActiveTab("insert")}
            className={`flex-1 py-1 px-1.5 rounded-md font-medium text-[11px] text-center transition-all ${
              activeTab === "insert" ? "bg-zinc-800 text-white shadow-2xs" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Insert
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex-1 py-1 px-1.5 rounded-md font-medium text-[11px] text-center transition-all ${
              activeTab === "templates" ? "bg-zinc-800 text-white shadow-2xs" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Themes
          </button>
        </div>

        {/* Collapse Sidebar Button */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {/* TAB 1: PAGES / SLIDES */}
        {activeTab === "pages" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                {documentMode === "presentation" ? `Slides (${pages.length})` : `Pages (${pages.length})`}
              </span>
              <button
                onClick={onAddPage}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-1.5 py-0.5 rounded hover:bg-white/[0.05] transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* List of Pages / Slides */}
            <div className="space-y-2">
              {pages.map((page, idx) => {
                const isSelected = idx === activePageIndex;
                return (
                  <div
                    key={page.id || idx}
                    onClick={() => onSelectPageIndex(idx)}
                    className={`group relative rounded-xl border p-2 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#1c1e24] border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30"
                        : "bg-[#14161a] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#181a1f]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-mono text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium text-zinc-200 truncate max-w-[130px]">
                          {page.title || (documentMode === "presentation" ? `Slide ${idx + 1}` : `Page ${idx + 1}`)}
                        </span>
                      </div>

                      {/* Action Menu for Slide/Page */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMovePage(idx, idx - 1);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.1]"
                            title="Move Up"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                        )}
                        {idx < pages.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMovePage(idx, idx + 1);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.1]"
                            title="Move Down"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicatePage(idx);
                          }}
                          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.1]"
                          title="Duplicate"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {pages.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePage(idx);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Miniature Page Thumbnail Preview */}
                    <div
                      className={`w-full rounded-md bg-white border border-zinc-200/20 overflow-hidden relative ${
                        documentMode === "presentation" ? "aspect-16/9" : "aspect-[8.5/11]"
                      }`}
                    >
                      <div className="w-full h-full p-1.5 flex flex-col gap-1 pointer-events-none opacity-80 scale-95 origin-top">
                        {page.elements?.slice(0, 4).map((el, elIdx) => (
                          <div
                            key={elIdx}
                            className={`rounded-xs ${
                              el.type === "heading"
                                ? "h-2 w-3/4 bg-zinc-800"
                                : el.type === "formula"
                                ? "h-3.5 w-full bg-zinc-200 border border-zinc-300"
                                : el.type === "chart"
                                ? "h-4 w-full bg-indigo-50 border border-indigo-200"
                                : "h-2 w-full bg-zinc-100"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: OUTLINE */}
        {activeTab === "outline" && (
          <div className="space-y-2">
            <div className="px-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Document Outline
            </div>

            {outlineItems.length === 0 ? (
              <p className="text-xs text-zinc-500 italic px-1">No structural sections yet.</p>
            ) : (
              <div className="space-y-1">
                {outlineItems.map((el) => {
                  const isSelected = el.id === selectedElementId;
                  const label =
                    el.content?.title || (typeof el.content === "string" ? el.content.slice(0, 30) : el.type);

                  return (
                    <button
                      key={el.id}
                      onClick={() => onSelectElement(el.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                        isSelected
                          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                          : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      {el.type === "heading" && <Hash className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                      {el.type === "formula" && <Sigma className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      {el.type === "callout" && <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {el.type === "chart" && <BarChart3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      <span className="truncate font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INSERT COMPONENTS */}
        {activeTab === "insert" && (
          <div className="space-y-3">
            {/* Category: Typography & Titles */}
            <div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 px-1">
                Typography
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleInsert("heading")}
                  className="p-2 rounded-lg bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-zinc-200 group-hover:text-white text-xs font-medium">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Heading</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Section header</span>
                </button>

                <button
                  onClick={() => handleInsert("text")}
                  className="p-2 rounded-lg bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-zinc-200 group-hover:text-white text-xs font-medium">
                    <PenTool className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Paragraph</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Markdown notes</span>
                </button>
              </div>
            </div>

            {/* Category: KaTeX Formulas & Math */}
            <div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 px-1">
                Math & Formulas
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleInsert("formula")}
                  className="p-2 rounded-lg bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-zinc-200 group-hover:text-white text-xs font-medium">
                    <Sigma className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Formula</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">LaTeX + KaTeX</span>
                </button>

                <button
                  onClick={() => handleInsert("callout")}
                  className="p-2 rounded-lg bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-zinc-200 group-hover:text-white text-xs font-medium">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Callout</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Key takeaway</span>
                </button>
              </div>
            </div>

            {/* Category: Data & Visuals */}
            <div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 px-1">
                Visuals & Data
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleInsert("chart")}
                  className="p-2 rounded-lg bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-zinc-200 group-hover:text-white text-xs font-medium">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Chart</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Data trajectory</span>
                </button>

                <button
                  onClick={() => handleInsert("diagram")}
                  className="p-2 rounded-lg bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-zinc-200 group-hover:text-white text-xs font-medium">
                    <Workflow className="w-3.5 h-3.5 text-purple-400" />
                    <span>Diagram</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Process steps</span>
                </button>

                <button
                  onClick={() => handleInsert("table")}
                  className="p-2 rounded-lg bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-zinc-200 group-hover:text-white text-xs font-medium">
                    <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Table</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Matrix rows</span>
                </button>

                <button
                  onClick={() => handleInsert("checkboxGroup")}
                  className="p-2 rounded-lg bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-zinc-200 group-hover:text-white text-xs font-medium">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Checklist</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Action list</span>
                </button>
              </div>
            </div>

            {/* Category: Educational & Ruled Lines */}
            <div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 px-1">
                Worksheet Elements
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleInsert("writingLines")}
                  className="p-2 rounded-lg bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-zinc-200 group-hover:text-white text-xs font-medium">
                    <PenTool className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Ruled Lines</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Hand-writing</span>
                </button>

                <button
                  onClick={() => handleInsert("drawingArea")}
                  className="p-2 rounded-lg bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] text-left transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-zinc-200 group-hover:text-white text-xs font-medium">
                    <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
                    <span>Scratchpad</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Freeform canvas</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TEMPLATES */}
        {activeTab === "templates" && (
          <div className="space-y-2">
            <div className="px-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Curated Templates
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => onApplyPreset("compound-interest")}
                className="w-full text-left p-2.5 rounded-xl bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] transition-all"
              >
                <div className="font-semibold text-xs text-white">Financial Research Report</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  US Letter document with KaTeX formulas, compounding charts, and sensitivity tables.
                </div>
                <span className="inline-block mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  Document Mode
                </span>
              </button>

              <button
                onClick={() => onApplyPreset("presentation-deck")}
                className="w-full text-left p-2.5 rounded-xl bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] transition-all"
              >
                <div className="font-semibold text-xs text-white">16:9 Strategic Pitch Deck</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  3-slide presentation deck with high-impact value cards, benchmarks, and roadmap.
                </div>
                <span className="inline-block mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                  Presentation Mode
                </span>
              </button>

              <button
                onClick={() => onApplyPreset("worksheet-calculus")}
                className="w-full text-left p-2.5 rounded-xl bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] transition-all"
              >
                <div className="font-semibold text-xs text-white">Physics Kinetics Worksheet</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Problem set with kinematic formulas, derivation steps, and freeform scratchpad.
                </div>
                <span className="inline-block mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                  Worksheet Mode
                </span>
              </button>

              <button
                onClick={() => onApplyPreset("executive-memo")}
                className="w-full text-left p-2.5 rounded-xl bg-[#18191e] border border-white/[0.06] hover:border-white/[0.15] hover:bg-[#202228] transition-all"
              >
                <div className="font-semibold text-xs text-white">Executive Strategic Memo</div>
                <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                  Dense one-pager memo with ARR expansion trajectory, milestones, and checklists.
                </div>
                <span className="inline-block mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  One-Pager Mode
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
