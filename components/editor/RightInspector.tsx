"use client";

import React, { useState } from "react";
import { DocumentElement, DocumentModel } from "@/types/document";
import {
  Trash2,
  Lock,
  Unlock,
  Copy,
  Sparkles,
  Layers,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Maximize,
  Minimize,
  Sliders,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Check,
  Sigma,
  Plus,
  X,
  Bold,
  Italic,
  Code,
  List,
  BookOpen,
} from "lucide-react";
import {
  MathRenderer,
  MarkdownWithMath,
  MATH_PRESETS,
  GOOGLE_DOCS_MATH_PALETTE,
} from "@/lib/math-markdown-engine";
import {
  clampPosition,
  clampDimensions,
  PAGE_WIDTH_INCHES,
  PAGE_HEIGHT_INCHES,
  SAFE_MARGIN_INCHES,
} from "@/lib/coordinates";

interface RightInspectorProps {
  selectedElement: DocumentElement | null;
  documentModel: DocumentModel;
  onUpdateElement: (id: string, changes: Partial<DocumentElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorderElement: (id: string, newZIndex: number) => void;
  onUpdatePageSettings: (settings: Partial<DocumentModel["page"]>) => void;
  onUpdateTheme: (theme: Partial<DocumentModel["theme"]>) => void;
  onAIQuickEdit: (id: string, instruction: string) => void;
  isAiLoading: boolean;
  isBlackAndWhite: boolean;
  onToggleBW: () => void;
  showMargins: boolean;
  onToggleMargins: () => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  selectedElement,
  documentModel,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElement,
  onUpdatePageSettings,
  onUpdateTheme,
  onAIQuickEdit,
  isAiLoading,
  isBlackAndWhite,
  onToggleBW,
  showMargins,
  onToggleMargins,
}) => {
  const [quickPrompt, setQuickPrompt] = useState("");

  // When NO ELEMENT IS SELECTED: Show Document & Page Settings
  if (!selectedElement) {
    const totalElements = documentModel.elements.length;
    const pageWidth = documentModel.page?.width ?? PAGE_WIDTH_INCHES;
    const pageHeight = documentModel.page?.height ?? PAGE_HEIGHT_INCHES;
    const safeMargin = documentModel.page?.safeMargin ?? SAFE_MARGIN_INCHES;

    return (
      <aside className="no-print w-72 bg-white border-l border-slate-200 flex flex-col h-[calc(100vh-3.5rem)] z-20 shrink-0 select-none">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Document Setup
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Standard US Letter publication metrics.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Page Dimensions */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Dimensions & Margins
            </h4>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Page Standard</span>
                <span className="font-mono font-semibold text-slate-700">8.5" × 11.0" (Letter)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Print Safe Margin</span>
                <span className="font-mono font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  {safeMargin}"
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Printable Canvas</span>
                <span className="font-mono font-semibold text-slate-700">
                  {(pageWidth - 2 * safeMargin).toFixed(2)}" × {(pageHeight - 2 * safeMargin).toFixed(2)}"
                </span>
              </div>
            </div>
          </div>

          {/* Background Color */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Page Paper Tint
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={documentModel.page?.background || "#ffffff"}
                onChange={(e) => onUpdatePageSettings({ background: e.target.value })}
                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
              />
              <span className="text-xs font-mono text-slate-700">
                {documentModel.page?.background || "#ffffff"}
              </span>
            </div>
          </div>

          {/* Theme Presets */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Typography & Themes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  onUpdateTheme({
                    name: "Modern Indigo",
                    primaryColor: "#0f172a",
                    accentColor: "#4f46e5",
                  })
                }
                className="p-2 text-left border border-slate-200 rounded-lg hover:border-indigo-500 transition-all"
              >
                <div className="text-xs font-semibold text-slate-800">Indigo Modern</div>
                <div className="flex gap-1 mt-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#0f172a]" />
                  <div className="w-3 h-3 rounded-full bg-[#4f46e5]" />
                </div>
              </button>
              <button
                onClick={() =>
                  onUpdateTheme({
                    name: "Emerald Academic",
                    primaryColor: "#064e3b",
                    accentColor: "#059669",
                  })
                }
                className="p-2 text-left border border-slate-200 rounded-lg hover:border-emerald-500 transition-all"
              >
                <div className="text-xs font-semibold text-slate-800">Academic</div>
                <div className="flex gap-1 mt-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#064e3b]" />
                  <div className="w-3 h-3 rounded-full bg-[#059669]" />
                </div>
              </button>
            </div>
          </div>

          {/* Print Safe Mode & Margins Guide */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Print Optimization
            </h4>
            <div className="space-y-2">
              <button
                onClick={onToggleBW}
                className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium flex items-center justify-between transition-all ${
                  isBlackAndWhite
                    ? "bg-slate-900 text-white border-slate-900"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Classroom B&W Mode</span>
                {isBlackAndWhite && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                onClick={onToggleMargins}
                className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium flex items-center justify-between transition-all ${
                  showMargins
                    ? "bg-sky-50 text-sky-800 border-sky-300"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Show 0.45" Safe Margins</span>
                {showMargins && <Check className="w-3.5 h-3.5 text-sky-600" />}
              </button>
            </div>
          </div>

          {/* Document Statistics */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Elements on Page:</span>
              <span className="font-mono font-semibold text-slate-600">{totalElements}</span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // When an ELEMENT IS SELECTED
  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim() || isAiLoading) return;
    onAIQuickEdit(selectedElement.id, quickPrompt);
    setQuickPrompt("");
  };

  const handlePositionChange = (key: "x" | "y", val: number) => {
    const newX = key === "x" ? val : selectedElement.x;
    const newY = key === "y" ? val : selectedElement.y;
    const clamped = clampPosition(newX, newY, selectedElement.width, selectedElement.height);
    onUpdateElement(selectedElement.id, { x: clamped.x, y: clamped.y });
  };

  const handleDimensionChange = (key: "width" | "height", val: number) => {
    const newW = key === "width" ? val : selectedElement.width;
    const newH = key === "height" ? val : selectedElement.height;
    const clampedDims = clampDimensions(selectedElement.x, selectedElement.y, newW, newH);
    onUpdateElement(selectedElement.id, {
      width: clampedDims.width,
      height: clampedDims.height,
    });
  };

  return (
    <aside className="no-print w-72 bg-white border-l border-slate-200 flex flex-col h-[calc(100vh-3.5rem)] z-20 shrink-0 select-none">
      {/* Header: Element Type & Primary Actions */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
            {selectedElement.type}
          </span>
          <h3 className="text-xs font-bold text-slate-800 mt-1 truncate max-w-[140px]">
            {selectedElement.metadata?.label || selectedElement.id}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {/* Lock / Unlock */}
          <button
            onClick={() =>
              onUpdateElement(selectedElement.id, { locked: !selectedElement.locked })
            }
            title={selectedElement.locked ? "Unlock element" : "Lock position"}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
          >
            {selectedElement.locked ? (
              <Lock className="w-4 h-4 text-amber-500" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
          </button>

          {/* Duplicate */}
          <button
            onClick={() => onDuplicateElement(selectedElement.id)}
            title="Duplicate element (Cmd+D)"
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            title="Delete element (Delete/Backspace)"
            className="p-1.5 text-rose-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Gemini Micro-Edit for Selected Element */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-950 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Gemini Micro-Edit
          </div>
          <form onSubmit={handlePromptSubmit}>
            <input
              type="text"
              placeholder="e.g., Make 20% wider, or increase font size"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              disabled={isAiLoading || selectedElement.locked}
              className="w-full text-xs p-2 bg-white border border-indigo-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
            />
            <div className="flex gap-1 mt-1.5">
              <button
                type="button"
                onClick={() => setQuickPrompt("Fit text cleanly and fix overflow")}
                className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded hover:bg-indigo-50"
              >
                Fit cleanly
              </button>
              <button
                type="button"
                onClick={() => setQuickPrompt("Align to center safe margin")}
                className="text-[10px] bg-white border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded hover:bg-indigo-50"
              >
                Center
              </button>
            </div>
            <button
              type="submit"
              disabled={!quickPrompt.trim() || isAiLoading || selectedElement.locked}
              className="w-full mt-2 text-xs font-semibold bg-indigo-600 text-white py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xs"
            >
              {isAiLoading ? "Processing..." : "Apply AI Edit"}
            </button>
          </form>
        </div>

        {/* Content & Equation Editor */}
        <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
          {selectedElement.type === "formula" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-800 font-bold text-xs">
                  <Sigma className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Equation Editor (LaTeX)</span>
                </div>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-mono font-semibold">
                  KaTeX
                </span>
              </div>

              {/* Preset Selector */}
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Standard Formula Presets</label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const preset = MATH_PRESETS.find((p) => p.id === e.target.value);
                    if (preset) {
                      onUpdateElement(selectedElement.id, {
                        content: {
                          title: preset.title,
                          equation: preset.equation,
                          breakdown: preset.breakdown,
                        },
                        metadata: {
                          ...selectedElement.metadata,
                          label: preset.title,
                        },
                      });
                      e.target.value = "";
                    }
                  }}
                  className="w-full text-xs p-1.5 mt-0.5 bg-white border border-slate-200 rounded text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="" disabled>
                    Insert standard formula...
                  </option>
                  {MATH_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      [{preset.category}] {preset.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Equation Title */}
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Equation Title / Label</label>
                <input
                  type="text"
                  placeholder="e.g., Quadratic Formula"
                  value={selectedElement.content?.title || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: {
                        ...selectedElement.content,
                        title: e.target.value,
                      },
                    })
                  }
                  className="w-full text-xs p-1.5 mt-0.5 bg-white border border-slate-200 rounded font-medium"
                />
              </div>

              {/* LaTeX Equation Code */}
              <div>
                <label className="text-[10px] text-slate-500 font-medium flex justify-between">
                  <span>LaTeX Source</span>
                  <span className="text-[9px] text-slate-400">Supports \frac, \sqrt, \int...</span>
                </label>
                <textarea
                  rows={3}
                  value={selectedElement.content?.equation || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: {
                        ...selectedElement.content,
                        equation: e.target.value,
                      },
                    })
                  }
                  className="w-full text-xs p-2 mt-0.5 bg-white border border-slate-200 rounded font-mono text-indigo-950 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed"
                  placeholder="e.g. x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
                />
              </div>

              {/* Quick Math Symbols Inserter */}
              <div>
                <label className="text-[10px] text-slate-500 font-medium mb-1 block">Quick Symbols</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: "a/b", latex: "\\frac{a}{b}" },
                    { label: "√x", latex: "\\sqrt{x}" },
                    { label: "x²", latex: "x^{2}" },
                    { label: "xᵢ", latex: "x_{i}" },
                    { label: "∫", latex: "\\int_{a}^{b} f(x)\\,dx" },
                    { label: "∑", latex: "\\sum_{i=1}^{n}" },
                    { label: "±", latex: "\\pm" },
                    { label: "≈", latex: "\\approx" },
                    { label: "≠", latex: "\\neq" },
                    { label: "≤", latex: "\\le" },
                    { label: "≥", latex: "\\ge" },
                    { label: "∞", latex: "\\infty" },
                    { label: "π", latex: "\\pi" },
                    { label: "θ", latex: "\\theta" },
                    { label: "Δ", latex: "\\Delta" },
                  ].map((sym, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const currentEq = selectedElement.content?.equation || "";
                        onUpdateElement(selectedElement.id, {
                          content: {
                            ...selectedElement.content,
                            equation: currentEq ? `${currentEq} ${sym.latex}` : sym.latex,
                          },
                        });
                      }}
                      className="text-[10px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 font-serif transition-colors"
                      title={sym.latex}
                    >
                      {sym.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live KaTeX Rendered Preview */}
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-1">Live Math Preview</label>
                <div className="p-2.5 bg-white rounded border border-slate-200 min-h-[50px] flex items-center justify-center overflow-x-auto shadow-2xs">
                  <MathRenderer
                    latex={selectedElement.content?.equation || "x = \\dots"}
                    displayMode={true}
                    className="text-slate-900"
                  />
                </div>
              </div>

              {/* Variable Breakdown */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                    Variable Definitions
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentBreakdown = selectedElement.content?.breakdown || [];
                      onUpdateElement(selectedElement.id, {
                        content: {
                          ...selectedElement.content,
                          breakdown: [
                            ...currentBreakdown,
                            { symbol: "x", label: "Variable definition" },
                          ],
                        },
                      });
                    }}
                    className="text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Add Term
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(selectedElement.content?.breakdown || []).map((item: any, bIdx: number) => (
                    <div key={bIdx} className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200">
                      <input
                        type="text"
                        value={item.symbol}
                        onChange={(e) => {
                          const newBreakdown = [...selectedElement.content.breakdown];
                          newBreakdown[bIdx] = { ...item, symbol: e.target.value };
                          onUpdateElement(selectedElement.id, {
                            content: { ...selectedElement.content, breakdown: newBreakdown },
                          });
                        }}
                        placeholder="Sym"
                        className="w-14 text-xs p-1 bg-indigo-50/50 border border-indigo-200 rounded font-serif text-center"
                      />
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const newBreakdown = [...selectedElement.content.breakdown];
                          newBreakdown[bIdx] = { ...item, label: e.target.value };
                          onUpdateElement(selectedElement.id, {
                            content: { ...selectedElement.content, breakdown: newBreakdown },
                          });
                        }}
                        placeholder="Definition"
                        className="flex-1 text-xs p-1 bg-white border border-slate-200 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newBreakdown = selectedElement.content.breakdown.filter(
                            (_: any, i: number) => i !== bIdx
                          );
                          onUpdateElement(selectedElement.id, {
                            content: { ...selectedElement.content, breakdown: newBreakdown },
                          });
                        }}
                        className="text-slate-400 hover:text-red-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {["text", "richText"].includes(selectedElement.type) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Content (Markdown & Math)</span>
                <span className="text-[10px] text-slate-500">LaTeX $math$ supported</span>
              </div>

              {/* Formatting Helper Bar */}
              <div className="flex gap-1 flex-wrap pb-1 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    const text = typeof selectedElement.content === "string" ? selectedElement.content : selectedElement.content?.text || "";
                    const updated = text ? `${text} **bold text**` : "**bold text**";
                    onUpdateElement(selectedElement.id, { content: typeof selectedElement.content === "string" ? updated : { ...selectedElement.content, text: updated } });
                  }}
                  className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 hover:bg-indigo-50"
                  title="Insert bold text"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = typeof selectedElement.content === "string" ? selectedElement.content : selectedElement.content?.text || "";
                    const updated = text ? `${text} *italic text*` : "*italic text*";
                    onUpdateElement(selectedElement.id, { content: typeof selectedElement.content === "string" ? updated : { ...selectedElement.content, text: updated } });
                  }}
                  className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] italic text-slate-700 hover:bg-indigo-50"
                  title="Insert italic text"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = typeof selectedElement.content === "string" ? selectedElement.content : selectedElement.content?.text || "";
                    const updated = text ? `${text} $E = mc^2$` : "$E = mc^2$";
                    onUpdateElement(selectedElement.id, { content: typeof selectedElement.content === "string" ? updated : { ...selectedElement.content, text: updated } });
                  }}
                  className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100 font-serif"
                  title="Insert inline math $...$"
                >
                  $x$
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = typeof selectedElement.content === "string" ? selectedElement.content : selectedElement.content?.text || "";
                    const updated = text ? `${text}\n$$\\int_0^1 x^2 dx = \\frac{1}{3}$$\n` : "$$\\int_0^1 x^2 dx = \\frac{1}{3}$$\n";
                    onUpdateElement(selectedElement.id, { content: typeof selectedElement.content === "string" ? updated : { ...selectedElement.content, text: updated } });
                  }}
                  className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100 font-serif"
                  title="Insert display math $$...$$"
                >
                  $$ Block Math $$
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = typeof selectedElement.content === "string" ? selectedElement.content : selectedElement.content?.text || "";
                    const updated = text ? `${text}\n- List item 1\n- List item 2` : "- List item 1\n- List item 2";
                    onUpdateElement(selectedElement.id, { content: typeof selectedElement.content === "string" ? updated : { ...selectedElement.content, text: updated } });
                  }}
                  className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-700 hover:bg-indigo-50"
                  title="Insert list"
                >
                  • List
                </button>
              </div>

              <textarea
                rows={5}
                value={typeof selectedElement.content === "string" ? selectedElement.content : selectedElement.content?.text || ""}
                onChange={(e) => {
                  if (typeof selectedElement.content === "string") {
                    onUpdateElement(selectedElement.id, { content: e.target.value });
                  } else {
                    onUpdateElement(selectedElement.id, {
                      content: { ...selectedElement.content, text: e.target.value },
                    });
                  }
                }}
                placeholder="Enter markdown or text. Use $x$ for inline math and $$x$$ for block math."
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded font-sans text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed"
              />

              {/* Rendered Preview */}
              <div>
                <label className="text-[10px] text-slate-500 font-medium block mb-0.5">Rendered Preview</label>
                <div className="p-2 bg-white rounded border border-slate-200 text-xs max-h-28 overflow-y-auto">
                  <MarkdownWithMath
                    content={
                      typeof selectedElement.content === "string"
                        ? selectedElement.content
                        : selectedElement.content?.text || "(No content)"
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {selectedElement.type === "heading" && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800">Heading & Subtitle</span>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Title ($math$ supported)</label>
                <input
                  type="text"
                  value={typeof selectedElement.content === "object" ? selectedElement.content?.title || "" : selectedElement.content}
                  onChange={(e) => {
                    const currentObj = typeof selectedElement.content === "object" ? selectedElement.content : {};
                    onUpdateElement(selectedElement.id, {
                      content: { ...currentObj, title: e.target.value },
                    });
                  }}
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Subtitle</label>
                <input
                  type="text"
                  value={typeof selectedElement.content === "object" ? selectedElement.content?.subtitle || "" : ""}
                  onChange={(e) => {
                    const currentObj = typeof selectedElement.content === "object" ? selectedElement.content : {};
                    onUpdateElement(selectedElement.id, {
                      content: { ...currentObj, subtitle: e.target.value },
                    });
                  }}
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded text-slate-600"
                />
              </div>
            </div>
          )}

          {selectedElement.type === "callout" && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800">Callout Content</span>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Callout Title</label>
                <input
                  type="text"
                  value={selectedElement.content?.title || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: { ...selectedElement.content, title: e.target.value },
                    })
                  }
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Body ($math$ and markdown supported)</label>
                <textarea
                  rows={3}
                  value={selectedElement.content?.body || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: { ...selectedElement.content, body: e.target.value },
                    })
                  }
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                />
              </div>
            </div>
          )}

          {selectedElement.type === "quote" && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800">Quote Block</span>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Quote Text</label>
                <textarea
                  rows={3}
                  value={selectedElement.content?.quote || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: { ...selectedElement.content, quote: e.target.value },
                    })
                  }
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded italic font-serif"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Attribution / Author</label>
                <input
                  type="text"
                  value={selectedElement.content?.author || ""}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      content: { ...selectedElement.content, author: e.target.value },
                    })
                  }
                  className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded"
                />
              </div>
            </div>
          )}

          {!["formula", "text", "richText", "heading", "callout", "quote"].includes(selectedElement.type) && (
            <div className="text-xs text-slate-500 py-1 text-center">
              Element: <span className="font-semibold text-slate-700">{selectedElement.type}</span>
            </div>
          )}
        </div>

        {/* Geometry Settings (Inches & Rotation) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Geometry (Inches)
            </h4>
            {/* Aspect Ratio Lock */}
            <button
              onClick={() =>
                onUpdateElement(selectedElement.id, {
                  metadata: {
                    ...(selectedElement.metadata || {}),
                    preserveAspectRatio: !selectedElement.metadata?.preserveAspectRatio,
                  },
                })
              }
              title="Toggle Aspect-Ratio Lock"
              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                selectedElement.metadata?.preserveAspectRatio
                  ? "bg-indigo-50 text-indigo-700 border-indigo-300 font-semibold"
                  : "text-slate-500 border-slate-200"
              }`}
            >
              Ratio: {selectedElement.metadata?.preserveAspectRatio ? "Locked" : "Free"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-500 font-medium">X (in)</label>
              <input
                type="number"
                step="0.05"
                disabled={selectedElement.locked}
                value={selectedElement.x}
                onChange={(e) => handlePositionChange("x", parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Y (in)</label>
              <input
                type="number"
                step="0.05"
                disabled={selectedElement.locked}
                value={selectedElement.y}
                onChange={(e) => handlePositionChange("y", parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Width (in)</label>
              <input
                type="number"
                step="0.05"
                disabled={selectedElement.locked}
                value={selectedElement.width}
                onChange={(e) => handleDimensionChange("width", parseFloat(e.target.value) || 0.5)}
                className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Height (in)</label>
              <input
                type="number"
                step="0.05"
                disabled={selectedElement.locked}
                value={selectedElement.height}
                onChange={(e) => handleDimensionChange("height", parseFloat(e.target.value) || 0.3)}
                className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono disabled:bg-slate-100"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-slate-500 font-medium">Rotation (°)</label>
              <input
                type="number"
                step="5"
                min="-180"
                max="360"
                disabled={selectedElement.locked}
                value={selectedElement.rotation || 0}
                onChange={(e) =>
                  onUpdateElement(selectedElement.id, {
                    rotation: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Typography Settings (if text-bearing element) */}
        {["heading", "text", "richText", "callout", "quote"].includes(selectedElement.type) && (
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Typography
            </h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Font Size (pt)</label>
                  <input
                    type="number"
                    min="8"
                    max="72"
                    value={selectedElement.style?.fontSize || 14}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        style: {
                          ...selectedElement.style,
                          fontSize: parseInt(e.target.value) || 12,
                        },
                      })
                    }
                    className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-medium">Weight</label>
                  <select
                    value={selectedElement.style?.fontWeight || 400}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        style: {
                          ...selectedElement.style,
                          fontWeight: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full text-xs p-1.5 border border-slate-200 rounded"
                  >
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semibold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">Extrabold (800)</option>
                  </select>
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Alignment</label>
                <div className="flex border border-slate-200 rounded-md overflow-hidden mt-0.5">
                  {(["left", "center", "right", "justify"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() =>
                        onUpdateElement(selectedElement.id, {
                          style: { ...selectedElement.style, textAlign: align },
                        })
                      }
                      className={`flex-1 py-1 flex items-center justify-center transition-colors ${
                        (selectedElement.style?.textAlign || "left") === align
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                      {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                      {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                      {align === "justify" && <AlignJustify className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Font Color</label>
                <div className="flex gap-2 items-center mt-1">
                  <input
                    type="color"
                    value={selectedElement.style?.color || "#0f172a"}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, {
                        style: { ...selectedElement.style, color: e.target.value },
                      })
                    }
                    className="w-7 h-7 p-0 border border-slate-200 rounded cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-600">
                    {selectedElement.style?.color || "#0f172a"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Styling: Fill, Border, Radius, Opacity */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Appearance
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-500 font-medium">Background Fill</label>
              <div className="flex gap-2 items-center mt-1">
                <input
                  type="color"
                  value={selectedElement.style?.backgroundColor || "#ffffff"}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      style: { ...selectedElement.style, backgroundColor: e.target.value },
                    })
                  }
                  className="w-7 h-7 p-0 border border-slate-200 rounded cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-600">
                  {selectedElement.style?.backgroundColor || "transparent"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Border Width</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  value={selectedElement.style?.borderWidth ?? 1}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      style: {
                        ...selectedElement.style,
                        borderWidth: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium">Corner Radius</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={selectedElement.style?.borderRadius || 0}
                  onChange={(e) =>
                    onUpdateElement(selectedElement.id, {
                      style: {
                        ...selectedElement.style,
                        borderRadius: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Layer Order (Z-Index) */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Layer Order
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onReorderElement(selectedElement.id, (selectedElement.zIndex || 1) + 1)}
              className="p-1.5 border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"
              title="Bring Forward"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              Forward
            </button>
            <button
              onClick={() =>
                onReorderElement(
                  selectedElement.id,
                  Math.max(1, (selectedElement.zIndex || 1) - 1)
                )
              }
              className="p-1.5 border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"
              title="Send Backward"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              Backward
            </button>
            <button
              onClick={() => onReorderElement(selectedElement.id, 99)}
              className="p-1.5 border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"
              title="Bring to Front"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" />
              To Front
            </button>
            <button
              onClick={() => onReorderElement(selectedElement.id, 1)}
              className="p-1.5 border border-slate-200 rounded text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"
              title="Send to Back"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              To Back
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};