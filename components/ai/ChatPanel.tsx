"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Wand2,
  CheckCircle2,
  ArrowUp,
  Bot,
  User,
  Layout,
  Layers,
  Palette,
  Type,
  Check,
} from "lucide-react";
import { QualityCheckIssue, DesignReasoning } from "@/types/document";

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  qualityIssues: QualityCheckIssue[];
  designReasoning?: DesignReasoning;
  isAiLoading?: boolean;
  onAutoFixMargins?: () => void;
  onAutoFixOverlaps?: () => void;
  onSendMessage?: (prompt: string) => void;
  onTransformDocument?: (archetype: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  qualityIssues,
  designReasoning,
  isAiLoading = false,
  onAutoFixMargins,
  onAutoFixOverlaps,
  onSendMessage,
  onTransformDocument,
}) => {
  const [activeTab, setActiveTab] = useState<"chat" | "design" | "check">("chat");
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab, isAiLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const errors = qualityIssues.filter((i) => i.severity === "error");
  const warnings = qualityIssues.filter((i) => i.severity === "warning");
  const infos = qualityIssues.filter((i) => i.severity === "info");

  const handleSend = () => {
    if (!inputValue.trim() || isAiLoading || !onSendMessage) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="no-print fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-40 flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-200 select-none overflow-hidden"
      style={{ maxHeight: "calc(100vh - 180px)", minHeight: "420px" }}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 leading-none">PagePilot AI</h4>
            <p className="text-[10px] text-indigo-500 font-medium mt-0.5">
              {isAiLoading ? "Thinking..." : "Powered by Gemini"}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "chat"
                ? "bg-white text-indigo-700 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>Chat</span>
            {messages.length > 1 && (
              <span className="px-1.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("design")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "design"
                ? "bg-white text-indigo-700 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>AI Design Logic</span>
            {designReasoning && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("check")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "check"
                ? "bg-white text-indigo-700 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Page Check</span>
            {qualityIssues.length > 0 && (
              <span className="px-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                {qualityIssues.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "chat" ? (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                    m.sender === "ai"
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                      : "bg-slate-700"
                  }`}>
                    {m.sender === "ai"
                      ? <Sparkles className="w-3.5 h-3.5" />
                      : <User className="w-3.5 h-3.5" />
                    }
                  </div>
                  {/* Bubble */}
                  <div
                    className={`max-w-[78%] text-xs leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                      m.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm shadow-sm font-medium"
                        : "bg-slate-50 text-slate-800 rounded-tl-sm border border-slate-200/60"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isAiLoading && (
                <div className="flex gap-2 flex-row">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="shrink-0 px-3 pb-3 pt-2 border-t border-slate-100 bg-white">
              <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isAiLoading}
                  placeholder="Ask PagePilot anything, or describe changes you want..."
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none resize-none max-h-24 leading-relaxed py-0.5 disabled:opacity-60"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isAiLoading}
                  className="shrink-0 w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-sm"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        ) : activeTab === "design" ? (
          /* AI Design Logic & Architectural Reasoning Tab */
          <div className="p-4 space-y-4">
            {/* Archetype Quick Action Banner */}
            <div className="p-3.5 bg-gradient-to-br from-indigo-50/90 via-violet-50/50 to-white border border-indigo-100 rounded-xl shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>AI Design Architect Engine</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                PagePilot reasons holistically through document semantics, KaTeX math formulas, optical balance, and print boundaries.
              </p>

              {/* Archetype One-Click Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => onTransformDocument?.("chemistry")}
                  className="px-2.5 py-2 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-left transition-all shadow-2xs group"
                >
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <span>🧪</span> Chem Lab Guide
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Bento + LaTeX $D=m/V$</div>
                </button>
                <button
                  onClick={() => onTransformDocument?.("academic")}
                  className="px-2.5 py-2 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all shadow-2xs group"
                >
                  <div className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                    <span>🏛️</span> Academic Paper
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Dual-column balance</div>
                </button>
                <button
                  onClick={() => onTransformDocument?.("executive")}
                  className="px-2.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-left transition-all shadow-2xs group"
                >
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>💼</span> Executive Brief
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Structured summaries</div>
                </button>
              </div>
            </div>

            {/* Design Reasoning Breakdown */}
            {designReasoning ? (
              <div className="space-y-3">
                {/* 1. Document Identity Card */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Document Archetype
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {designReasoning.documentType}
                  </div>
                </div>

                {/* 2. Grid & Geometry Card */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Layout className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Grid & Optical Geometry</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                    {designReasoning.gridSystem}
                  </p>
                </div>

                {/* 3. Typography & Modular Scale Card */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Type className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Typography Pairing & Scale</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                    {designReasoning.typographyPairing}
                  </p>
                </div>

                {/* 4. Color Palette & Harmony Card */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Color Palette & Contrast</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-100">
                    {designReasoning.colorPalette}
                  </p>
                </div>

                {/* 5. Semantic Decisions List */}
                <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/40 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Semantic Synthesized Decisions ({designReasoning.semanticComponents.length})</span>
                  </div>
                  <ul className="space-y-1.5">
                    {designReasoning.semanticComponents.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-emerald-950 bg-white/90 p-2 rounded-lg border border-emerald-100">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 6. Print Margin Safety */}
                <div className="border border-sky-200 rounded-xl p-3 bg-sky-50/60 flex items-center justify-between text-xs text-sky-950">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span className="font-semibold">{designReasoning.printSafety}</span>
                  </div>
                  <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                    VERIFIED
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <h5 className="text-xs font-bold text-slate-800">No Design Reasoning Generated Yet</h5>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Click below to let PagePilot's AI Layout Architect analyze this document's text and math, balance the grid, and provide complete design reasoning.
                </p>
                <button
                  onClick={() => onTransformDocument?.("auto")}
                  className="mt-3.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                >
                  Auto-Design Layout Now
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Page Check Tab */
          <div className="p-4 space-y-3">
            {/* Quick Auto-Repair Actions */}
            {qualityIssues.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <span className="text-[11px] font-semibold text-indigo-900 flex items-center gap-1 w-full mb-1">
                  <Wand2 className="w-3 h-3 text-indigo-600" />
                  Instant Layout Fix Actions:
                </span>
                {onAutoFixMargins && (
                  <button
                    onClick={onAutoFixMargins}
                    className="text-xs px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 font-medium rounded-lg border border-indigo-200 transition-all shadow-sm"
                  >
                    Snap to Safe Margins
                  </button>
                )}
                {onAutoFixOverlaps && (
                  <button
                    onClick={onAutoFixOverlaps}
                    className="text-xs px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 font-medium rounded-lg border border-indigo-200 transition-all shadow-sm"
                  >
                    Resolve Collisions
                  </button>
                )}
                {onSendMessage && (
                  <button
                    onClick={() => { onSendMessage("Fix all layout overflows, collisions, and margins."); setActiveTab("chat"); }}
                    className="text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all shadow-sm"
                  >
                    AI Full Page Rebalance
                  </button>
                )}
              </div>
            )}

            {/* Zero Issues State */}
            {qualityIssues.length === 0 && (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Page Audit Passed ✓</h4>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                  All elements conform to the 0.45" print safe margins with no overlapping containers or clipping.
                </p>
              </div>
            )}

            {errors.length > 0 && (
              <div className="border border-rose-200 bg-rose-50/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 mb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Errors ({errors.length})</span>
                </div>
                <ul className="space-y-2 text-xs text-rose-950">
                  {errors.map((err, idx) => (
                    <li key={idx} className="bg-white/80 p-2 rounded-lg border border-rose-200">
                      <div className="font-semibold">{err.message}</div>
                      {err.suggestion && <div className="text-[11px] text-rose-700 mt-0.5">💡 {err.suggestion}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="border border-amber-200 bg-amber-50/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Warnings ({warnings.length})</span>
                </div>
                <ul className="space-y-2 text-xs text-amber-950">
                  {warnings.map((w, idx) => (
                    <li key={idx} className="bg-white/80 p-2 rounded-lg border border-amber-200">
                      <div className="font-semibold">{w.message}</div>
                      {w.suggestion && <div className="text-[11px] text-amber-700 mt-0.5">💡 {w.suggestion}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {infos.length > 0 && (
              <div className="border border-sky-200 bg-sky-50/80 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 mb-2">
                  <Info className="w-4 h-4 text-sky-600" />
                  <span>Suggestions ({infos.length})</span>
                </div>
                <ul className="space-y-2 text-xs text-sky-950">
                  {infos.map((info, idx) => (
                    <li key={idx} className="bg-white/80 p-2 rounded-lg border border-sky-200">
                      <div className="font-semibold">{info.message}</div>
                      {info.suggestion && <div className="text-[11px] text-sky-700 mt-0.5">💡 {info.suggestion}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
