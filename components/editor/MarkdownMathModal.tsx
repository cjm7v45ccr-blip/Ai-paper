"use client";

import React, { useState } from "react";
import { X, Sparkles, Sigma, Check, Copy, ArrowRight, BookOpen, FileText } from "lucide-react";
import { SAMPLE_MARKDOWN_MATH_PRESETS, convertMarkdownToDocument } from "@/lib/markdown-to-document";
import { MarkdownWithMath } from "@/lib/math-markdown-engine";
import { DocumentModel } from "@/types/document";

interface MarkdownMathModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDocument: (doc: DocumentModel) => void;
}

export const MarkdownMathModal: React.FC<MarkdownMathModalProps> = ({
  isOpen,
  onClose,
  onApplyDocument,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("calculus");
  const [markdownInput, setMarkdownInput] = useState<string>(
    SAMPLE_MARKDOWN_MATH_PRESETS[0].markdown
  );
  const [docTitle, setDocTitle] = useState<string>(SAMPLE_MARKDOWN_MATH_PRESETS[0].title);
  const [activeTab, setActiveTab] = useState<"edit" | "preview" | "split">("split");

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    const preset = SAMPLE_MARKDOWN_MATH_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(preset.id);
      setMarkdownInput(preset.markdown);
      setDocTitle(preset.title);
    }
  };

  const handleConvert = () => {
    const convertedDoc = convertMarkdownToDocument(markdownInput, docTitle);
    onApplyDocument(convertedDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sigma className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Markdown to Math Engine</h2>
                <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                  KaTeX + Markdown
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transform markdown text and LaTeX math ($inline$ and $$display$$) into a professional 8.5×11 document.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex border border-slate-200 rounded-md p-0.5 bg-white text-xs font-medium text-slate-600">
              <button
                onClick={() => setActiveTab("edit")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === "edit" ? "bg-indigo-50 text-indigo-700 font-semibold" : "hover:text-slate-900"
                }`}
              >
                Markdown Editor
              </button>
              <button
                onClick={() => setActiveTab("split")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === "split" ? "bg-indigo-50 text-indigo-700 font-semibold" : "hover:text-slate-900"
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === "preview" ? "bg-indigo-50 text-indigo-700 font-semibold" : "hover:text-slate-900"
                }`}
              >
                Live Math Preview
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preset Selector Bar */}
        <div className="px-6 py-2.5 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between gap-4 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700">Sample Curricula Presets:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {SAMPLE_MARKDOWN_MATH_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-all ${
                  selectedPresetId === p.id
                    ? "bg-indigo-600 text-white shadow-xs font-semibold"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                {p.category}
              </button>
            ))}
          </div>
        </div>

        {/* Editor & Preview Split Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Raw Markdown Input */}
          {(activeTab === "edit" || activeTab === "split") && (
            <div className={`flex flex-col border-r border-slate-200 bg-white ${activeTab === "split" ? "w-1/2" : "w-full"}`}>
              <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Markdown & LaTeX Code
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {markdownInput.split("\n").length} lines
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col overflow-hidden">
                <div className="mb-2">
                  <label className="text-[11px] font-semibold text-slate-600">Document Title</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full text-xs font-semibold p-1.5 mt-0.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Document Title"
                  />
                </div>
                <label className="text-[11px] font-semibold text-slate-600 mb-1 flex justify-between">
                  <span>Body Markdown</span>
                  <span className="text-[10px] text-slate-400">Supports #, ##, **, *, $, $$...$$</span>
                </label>
                <textarea
                  value={markdownInput}
                  onChange={(e) => setMarkdownInput(e.target.value)}
                  placeholder="Paste or write markdown here..."
                  className="w-full flex-1 p-3 font-mono text-xs text-slate-800 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none resize-none leading-relaxed overflow-y-auto"
                />
              </div>
            </div>
          )}

          {/* Right: KaTeX Live Rendered Preview */}
          {(activeTab === "preview" || activeTab === "split") && (
            <div className={`flex flex-col bg-slate-50/60 ${activeTab === "split" ? "w-1/2" : "w-full"}`}>
              <div className="px-4 py-2 border-b border-slate-200 bg-slate-100/70 flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sigma className="w-3.5 h-3.5 text-indigo-600" />
                  Rendered Math & Layout Preview
                </span>
                <span className="text-[10px] font-normal text-slate-400">Live KaTeX Output</span>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs select-text">
                  <MarkdownWithMath content={markdownInput} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Engine automatically arranges elements within <strong className="text-slate-700">0.45" print safe margins</strong> on an 8.5×11 canvas.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConvert}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Convert & Build 8.5×11 Document</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
