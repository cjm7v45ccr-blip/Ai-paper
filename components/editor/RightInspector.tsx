"use client";

import React, { useState } from "react";
import {
  Sliders,
  Sparkles,
  Layers,
  Palette,
  Type,
  Maximize2,
  Trash2,
  Copy,
  Lock,
  Unlock,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sigma,
  Plus,
  Minus,
  Move,
  CornerDownRight,
  CheckCircle2,
  PanelRightClose,
  PanelRightOpen,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileText,
  Presentation,
  Image as ImageIcon,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
} from "lucide-react";
import { DocumentModel, DocumentElement, DocumentMode } from "@/types/document";
import katex from "katex";

interface RightInspectorProps {
  document: DocumentModel;
  selectedElement: DocumentElement | null;
  onUpdateElement: (id: string, changes: Partial<DocumentElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorderElement: (id: string, zIndex: number) => void;
  onUpdateDocumentPage: (changes: Partial<DocumentModel["page"]>) => void;
  onUpdateDocumentTheme: (changes: Partial<DocumentModel["theme"]>) => void;
  onModeChange: (mode: DocumentMode) => void;
  showMargins: boolean;
  onToggleMargins: () => void;
  isBlackAndWhite: boolean;
  onToggleBW: () => void;
  onTriggerAIModification?: (elementId: string, prompt: string) => void;
  onTransformPage?: (action: "visual" | "flow" | "balance" | "paginate") => void;
  isCollapsed?: boolean;
  onToggleCollapsed?: (collapsed: boolean) => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  document: doc,
  selectedElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElement,
  onUpdateDocumentPage,
  onUpdateDocumentTheme,
  onModeChange,
  showMargins,
  onToggleMargins,
  isBlackAndWhite,
  onToggleBW,
  onTriggerAIModification,
  onTransformPage,
  isCollapsed: controlledCollapsed,
  onToggleCollapsed,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setCollapsed = (val: boolean) => {
    if (onToggleCollapsed) onToggleCollapsed(val);
    else setInternalCollapsed(val);
  };

  if (isCollapsed) {
    return (
      <div className="no-print w-10 bg-[#0e1017] border-l border-white/[0.08] flex flex-col items-center py-3 select-none shrink-0 z-20 transition-all">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Open Properties Inspector"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Safe Math formula renderer helper for inspector live preview
  const renderKaTeXPreview = (latex: string) => {
    try {
      return katex.renderToString(latex, { throwOnError: false, displayMode: true });
    } catch {
      return `<span class="text-rose-400 text-xs">Invalid LaTeX syntax</span>`;
    }
  };

  return (
    <aside className="no-print w-72 bg-[#10121a] text-zinc-300 border-l border-white/[0.08] flex flex-col h-[calc(100vh-3.25rem)] select-none shrink-0 z-20 transition-all shadow-xl">
      {/* Header bar */}
      <div className="p-2.5 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-zinc-200">
            {selectedElement ? "Properties" : "Page Settings"}
          </span>
        </div>

        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors"
          title="Collapse Inspector"
        >
          <PanelRightClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content scroll area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {selectedElement ? (
          /* =========================================================================
             SECTION A: SELECTED ELEMENT INSPECTOR
             ========================================================================= */
          <div className="space-y-4">
            {/* Quick Action Top Bar (Type, Lock, Duplicate, Delete) */}
            <div className="bg-[#18191e] border border-white/[0.07] rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold tracking-wider">
                  {selectedElement.type}
                </span>
                <div className="text-xs font-medium text-zinc-200 truncate max-w-[140px]">
                  {selectedElement.metadata?.label || selectedElement.id}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    onUpdateElement(selectedElement.id, { locked: !selectedElement.locked })
                  }
                  className={`p-1.5 rounded-lg transition-colors ${
                    selectedElement.locked
                      ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.07]"
                  }`}
                  title={selectedElement.locked ? "Unlock element" : "Lock element"}
                >
                  {selectedElement.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => onDuplicateElement(selectedElement.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.07] transition-colors"
                  title="Duplicate element"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onDeleteElement(selectedElement.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Delete element"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Layout Mode Selector (Flow vs Freeform Canvas) */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Layout Behavior
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() =>
                    onUpdateElement(selectedElement.id, {
                      layoutMode: "flow",
                      x: 0.65,
                      width: 7.2,
                    })
                  }
                  className={`px-2.5 py-2 rounded-lg border text-left transition-all ${
                    selectedElement.layoutMode !== "canvas"
                      ? "bg-indigo-950/50 border-indigo-500/80 text-white"
                      : "bg-[#18191e] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <FileText className="w-3 h-3 text-indigo-400" />
                    <span>Doc Flow</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">Stacks in margins</div>
                </button>

                <button
                  onClick={() =>
                    onUpdateElement(selectedElement.id, {
                      layoutMode: "canvas",
                      width: Math.min(selectedElement.width || 4.0, 7.2),
                      height: selectedElement.height || 1.8,
                    })
                  }
                  className={`px-2.5 py-2 rounded-lg border text-left transition-all ${
                    selectedElement.layoutMode === "canvas"
                      ? "bg-indigo-950/50 border-indigo-500/80 text-white"
                      : "bg-[#18191e] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    <Move className="w-3 h-3 text-indigo-400" />
                    <span>Freeform</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">Drag & position</div>
                </button>
              </div>
            </div>

            {/* 1. Geometry & Bounding Box (Inches) */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Position & Size (Inches)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#18191e] border border-white/[0.06] rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-mono">X</span>
                  <input
                    type="number"
                    step="0.05"
                    value={selectedElement.x}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { x: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-transparent text-xs text-right font-mono text-zinc-200 w-16 outline-none"
                  />
                </div>

                <div className="bg-[#18191e] border border-white/[0.06] rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-mono">Y</span>
                  <input
                    type="number"
                    step="0.05"
                    value={selectedElement.y}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { y: parseFloat(e.target.value) || 0 })
                    }
                    className="bg-transparent text-xs text-right font-mono text-zinc-200 w-16 outline-none"
                  />
                </div>

                <div className="bg-[#18191e] border border-white/[0.06] rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-mono">W</span>
                  <input
                    type="number"
                    step="0.05"
                    value={selectedElement.width}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        width: Math.max(0.5, parseFloat(e.target.value) || 0.5),
                      })
                    }
                    className="bg-transparent text-xs text-right font-mono text-zinc-200 w-16 outline-none"
                  />
                </div>

                <div className="bg-[#18191e] border border-white/[0.06] rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-mono">H</span>
                  <input
                    type="number"
                    step="0.05"
                    value={selectedElement.height}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        height: Math.max(0.3, parseFloat(e.target.value) || 0.3),
                      })
                    }
                    className="bg-transparent text-xs text-right font-mono text-zinc-200 w-16 outline-none"
                  />
                </div>
              </div>

              {/* Align & Arrange Tools (Google Slides & Figma Engine) */}
              <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Align on Slide / Page</span>
                  <span className="text-[9px] text-indigo-400">Snap Ready</span>
                </div>
                <div className="grid grid-cols-6 gap-1 bg-[#14151a] p-1 rounded-lg border border-white/[0.06]">
                  <button
                    onClick={() => onUpdateElement(selectedElement.id, { x: 0.65 })}
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Align Left (Margin)"
                  >
                    <AlignStartVertical className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      const pageW = doc.mode === "presentation" ? 13.33 : 8.5;
                      const elemW = selectedElement.width || 4.0;
                      onUpdateElement(selectedElement.id, {
                        x: Math.round(((pageW - elemW) / 2) * 1000) / 1000,
                      });
                    }}
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Center Horizontally"
                  >
                    <AlignHorizontalJustifyCenter className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      const pageW = doc.mode === "presentation" ? 13.33 : 8.5;
                      const elemW = selectedElement.width || 4.0;
                      onUpdateElement(selectedElement.id, {
                        x: Math.round((pageW - 0.65 - elemW) * 1000) / 1000,
                      });
                    }}
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Align Right (Margin)"
                  >
                    <AlignEndVertical className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onUpdateElement(selectedElement.id, { y: 0.65 })}
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Align Top (Margin)"
                  >
                    <AlignStartHorizontal className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      const pageH = doc.mode === "presentation" ? 7.5 : 11.0;
                      const elemH = selectedElement.height || 2.0;
                      onUpdateElement(selectedElement.id, {
                        y: Math.round(((pageH - elemH) / 2) * 1000) / 1000,
                      });
                    }}
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Center Vertically"
                  >
                    <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      const pageH = doc.mode === "presentation" ? 7.5 : 11.0;
                      const elemH = selectedElement.height || 2.0;
                      onUpdateElement(selectedElement.id, {
                        y: Math.round((pageH - 0.65 - elemH) * 1000) / 1000,
                      });
                    }}
                    className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                    title="Align Bottom (Margin)"
                  >
                    <AlignEndHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Specific Element Editors */}
            {/* KaTeX Formula Editor */}
            {selectedElement.type === "formula" && (
              <div className="space-y-2.5 bg-[#18191e] border border-white/[0.07] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Sigma className="w-3.5 h-3.5" />
                  <span>KaTeX LaTeX Equation</span>
                </div>

                <textarea
                  rows={3}
                  value={selectedElement.content?.equation || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: {
                        ...(selectedElement.content || {}),
                        equation: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. A = P(1 + r/n)^{nt}"
                  className="w-full bg-[#111215] border border-white/[0.08] rounded-lg p-2 text-xs font-mono text-zinc-200 outline-none focus:border-emerald-500/50"
                />

                {/* Live Formula Preview Card */}
                <div className="bg-white rounded-lg p-2.5 overflow-x-auto text-zinc-900 border border-zinc-200/50">
                  <div className="text-[9px] font-mono text-zinc-400 uppercase mb-1">Live Math Preview</div>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderKaTeXPreview(selectedElement.content?.equation || ""),
                    }}
                  />
                </div>

                {/* Quick LaTeX Symbols */}
                <div className="flex flex-wrap gap-1">
                  {["\\int", "\\sum", "\\frac{a}{b}", "\\sqrt{x}", "\\partial", "\\alpha", "\\beta", "\\infty", "\\cdot"].map(
                    (sym) => (
                      <button
                        key={sym}
                        onClick={() => {
                          const currentEq = selectedElement.content?.equation || "";
                          onUpdateElement(selectedElement.id, {
                            content: {
                              ...(selectedElement.content || {}),
                              equation: `${currentEq} ${sym}`,
                            },
                          });
                        }}
                        className="px-1.5 py-0.5 rounded bg-[#111215] border border-white/[0.08] text-[10px] font-mono text-zinc-300 hover:text-white hover:bg-white/[0.07]"
                      >
                        {sym}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Heading Content Editor */}
            {selectedElement.type === "heading" && (
              <div className="space-y-2 bg-[#18191e] border border-white/[0.07] rounded-xl p-3">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Heading Content</div>
                <input
                  type="text"
                  value={selectedElement.content?.title || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: { ...(selectedElement.content || {}), title: e.target.value },
                    })
                  }
                  placeholder="Title text"
                  className="w-full bg-[#111215] border border-white/[0.08] rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500/50"
                />
                <input
                  type="text"
                  value={selectedElement.content?.subtitle || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: { ...(selectedElement.content || {}), subtitle: e.target.value },
                    })
                  }
                  placeholder="Subtitle text (optional)"
                  className="w-full bg-[#111215] border border-white/[0.08] rounded-lg p-2 text-xs text-zinc-300 outline-none focus:border-indigo-500/50"
                />
              </div>
            )}

            {/* Callout Box Editor */}
            {selectedElement.type === "callout" && (
              <div className="space-y-2 bg-[#18191e] border border-white/[0.07] rounded-xl p-3">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Callout Insight</div>
                <input
                  type="text"
                  value={selectedElement.content?.title || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: { ...(selectedElement.content || {}), title: e.target.value },
                    })
                  }
                  placeholder="Callout title"
                  className="w-full bg-[#111215] border border-white/[0.08] rounded-lg p-2 text-xs text-white outline-none focus:border-amber-500/50"
                />
                <textarea
                  rows={3}
                  value={selectedElement.content?.body || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: { ...(selectedElement.content || {}), body: e.target.value },
                    })
                  }
                  placeholder="Body takeaway text..."
                  className="w-full bg-[#111215] border border-white/[0.08] rounded-lg p-2 text-xs text-zinc-300 outline-none focus:border-amber-500/50"
                />
              </div>
            )}

            {/* Image Block Editor */}
            {selectedElement.type === "image" && (
              <div className="space-y-2.5 bg-[#18191e] border border-white/[0.07] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image & Visual Properties</span>
                </div>

                {/* Tag Badge */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Image Tag / Category</div>
                  <input
                    type="text"
                    value={selectedElement.content?.tag || "IMAGE"}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...(selectedElement.content || {}), tag: e.target.value.toUpperCase() },
                      })
                    }
                    placeholder="e.g. ARCHITECTURE, CHART, DIAGRAM"
                    className="w-full bg-[#111215] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300 outline-none focus:border-sky-500/50"
                  />
                </div>

                {/* Caption */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Caption / Description</div>
                  <input
                    type="text"
                    value={selectedElement.content?.caption || ""}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        content: { ...(selectedElement.content || {}), caption: e.target.value },
                      })
                    }
                    placeholder="Caption text displayed beneath image"
                    className="w-full bg-[#111215] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-sky-500/50"
                  />
                </div>

                {/* Object fit toggle */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-400">Fit Mode</span>
                  <div className="flex items-center gap-1">
                    {(["contain", "cover"] as const).map((fit) => (
                      <button
                        key={fit}
                        type="button"
                        onClick={() =>
                          onUpdateElement(selectedElement.id, {
                            style: { ...selectedElement.style, objectFit: fit },
                          })
                        }
                        className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase transition-colors ${
                          (selectedElement.style?.objectFit || "contain") === fit
                            ? "bg-indigo-600 text-white"
                            : "bg-[#111215] text-zinc-400 hover:text-white"
                        }`}
                      >
                        {fit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Card Appearance & Colors */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Style & Appearance
              </div>
              <div className="bg-[#18191e] border border-white/[0.06] rounded-xl p-3 space-y-2.5">
                {/* Background color */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Background</span>
                  <div className="flex items-center gap-1.5">
                    {["#ffffff", "#fafafa", "#f4f4f5", "#f0fdf4", "#eff6ff"].map((c) => (
                      <button
                        key={c}
                        onClick={() =>
                          onUpdateElement(selectedElement.id, {
                            style: { ...selectedElement.style, backgroundColor: c },
                          })
                        }
                        className={`w-5 h-5 rounded-md border transition-transform ${
                          selectedElement.style?.backgroundColor === c
                            ? "border-indigo-500 scale-110 shadow-xs"
                            : "border-zinc-600"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-zinc-400">Corner Radius</span>
                  <div className="flex items-center gap-1">
                    {[0, 4, 8, 12, 16].map((r) => (
                      <button
                        key={r}
                        onClick={() =>
                          onUpdateElement(selectedElement.id, {
                            style: { ...selectedElement.style, borderRadius: r },
                          })
                        }
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          (selectedElement.style?.borderRadius || 8) === r
                            ? "bg-zinc-700 text-white"
                            : "bg-[#111215] text-zinc-400 hover:text-white"
                        }`}
                      >
                        {r}px
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Layer Z-Index Reorder */}
            <div className="flex items-center justify-between bg-[#18191e] border border-white/[0.06] rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Layers className="w-3.5 h-3.5" />
                <span>Layer Level</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    onReorderElement(
                      selectedElement.id,
                      Math.max(1, (selectedElement.zIndex || 1) - 1)
                    )
                  }
                  className="p-1 rounded bg-[#111215] hover:bg-white/[0.07] text-zinc-400 hover:text-white"
                  title="Send Backward"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-mono text-zinc-200">
                  {selectedElement.zIndex || 1}
                </span>
                <button
                  onClick={() =>
                    onReorderElement(selectedElement.id, (selectedElement.zIndex || 1) + 1)
                  }
                  className="p-1 rounded bg-[#111215] hover:bg-white/[0.07] text-zinc-400 hover:text-white"
                  title="Bring Forward"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* AI Smart Polish for Element */}
            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Refine Selected Block</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Convert to KaTeX equation..."
                  className="flex-1 bg-[#111215] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-zinc-200 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && aiPrompt.trim()) {
                      onTriggerAIModification?.(selectedElement.id, aiPrompt);
                      setAiPrompt("");
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (aiPrompt.trim()) {
                      onTriggerAIModification?.(selectedElement.id, aiPrompt);
                      setAiPrompt("");
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                >
                  Apply
                </button>
              </div>

              {/* Contextual Quick Chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[
                  "Convert to comparison table",
                  "Turn numbers into chart",
                  "Create summary callout box",
                  "Make easier to understand",
                  "Reduce wordiness, keep detail",
                  "Format with LaTeX math",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => onTriggerAIModification?.(selectedElement.id, chip)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             SECTION B: GLOBAL DOCUMENT & PAGE SETTINGS (NO ELEMENT SELECTED)
             ========================================================================= */
          <div className="space-y-4">
            {/* AI Page & Document Intelligence Actions */}
            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Layout Intelligence</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                One-click transformations for current page and document structure.
              </p>

              <div className="grid grid-cols-1 gap-1.5 pt-1">
                <button
                  onClick={() => onTransformPage?.("visual")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-600/20 text-zinc-300 hover:text-indigo-200 border border-white/[0.05] text-xs flex items-center justify-between transition-colors"
                >
                  <span>Turn into visual presentation</span>
                  <span className="text-[10px] font-mono text-zinc-500">Visual</span>
                </button>
                <button
                  onClick={() => onTransformPage?.("flow")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-600/20 text-zinc-300 hover:text-indigo-200 border border-white/[0.05] text-xs flex items-center justify-between transition-colors"
                >
                  <span>Make normal document flow</span>
                  <span className="text-[10px] font-mono text-zinc-500">Flow</span>
                </button>
                <button
                  onClick={() => onTransformPage?.("balance")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-600/20 text-zinc-300 hover:text-indigo-200 border border-white/[0.05] text-xs flex items-center justify-between transition-colors"
                >
                  <span>Reduce empty space & balance</span>
                  <span className="text-[10px] font-mono text-zinc-500">Balance</span>
                </button>
                <button
                  onClick={() => onTransformPage?.("paginate")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-indigo-600/20 text-zinc-300 hover:text-indigo-200 border border-white/[0.05] text-xs flex items-center justify-between transition-colors"
                >
                  <span>Fix page breaks & overflow</span>
                  <span className="text-[10px] font-mono text-zinc-500">Letter 11"</span>
                </button>
              </div>
            </div>
            {/* 1. Document Mode */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Document Mode
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onModeChange("document")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    doc.mode === "document"
                      ? "bg-indigo-950/40 border-indigo-500/60 text-white shadow-2xs"
                      : "bg-[#18191e] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-400 mb-1" />
                  <div className="font-semibold text-xs text-white">Document</div>
                  <div className="text-[10px] text-zinc-400">Vertical stack</div>
                </button>

                <button
                  onClick={() => onModeChange("presentation")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    doc.mode === "presentation"
                      ? "bg-indigo-950/40 border-indigo-500/60 text-white shadow-2xs"
                      : "bg-[#18191e] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Presentation className="w-4 h-4 text-indigo-400 mb-1" />
                  <div className="font-semibold text-xs text-white">Presentation</div>
                  <div className="text-[10px] text-zinc-400">16:9 Slides</div>
                </button>
              </div>
            </div>

            {/* 2. Paper Canvas Standards & Margins */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Paper Standard & Dimensions
              </div>
              <div className="bg-[#18191e] border border-white/[0.06] rounded-xl p-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Page Standard</span>
                  <span className="font-mono text-zinc-200">
                    {doc.mode === "presentation"
                      ? "16:9 Slide (13.33 × 7.5'')"
                      : `${doc.page?.size?.toUpperCase() || "LETTER"} (${doc.page?.width || 8.5} × ${doc.page?.height || 11}'')`}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                  <span className="text-zinc-400">Print Safe Margin</span>
                  <span className="font-mono text-emerald-400">
                    {doc.page?.safeMargin || 0.45}&quot; (Compliant)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                  <span className="text-zinc-400">Margin Guides</span>
                  <button
                    onClick={onToggleMargins}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      showMargins
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {showMargins ? "Visible" : "Hidden"}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                  <span className="text-zinc-400">B&W Print Preview</span>
                  <button
                    onClick={onToggleBW}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      isBlackAndWhite
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {isBlackAndWhite ? "Active (B&W)" : "Standard"}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Typography & Themes */}
            <div className="space-y-2">
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                Typography & Palette
              </div>
              <div className="bg-[#18191e] border border-white/[0.06] rounded-xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Heading Font</span>
                  <span className="font-medium text-zinc-200 font-sans">Inter / Modern Display</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Body Font</span>
                  <span className="font-medium text-zinc-200 font-sans">Inter / Clean System</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Primary Ink</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-700" />
                    <span className="font-mono text-[11px] text-zinc-300">#09090b</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
