"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  ArrowUp,
  Bot,
  User,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Check,
  Layout,
  Type,
  Palette,
  Wand2,
  FlaskConical,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { QualityCheckIssue, DesignReasoning } from "@/types/document";

interface ChatPanelProps {
  isOpen?: boolean;
  messages: Array<{ sender: "user" | "ai"; text: string }>;
  onSendMessage: (msg: string) => void;
  isAiLoading: boolean;
  onClose: () => void;
  qualityIssues?: QualityCheckIssue[];
  designReasoning?: DesignReasoning;
  onTransformDocument?: (archetype: string) => void;
  onAutoFixMargins?: () => void;
  onAutoFixOverlaps?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen = true,
  messages,
  onSendMessage,
  isAiLoading,
  onClose,
  qualityIssues = [],
  designReasoning,
  onTransformDocument,
  onAutoFixMargins,
  onAutoFixOverlaps,
}) => {
  const [activeTab, setActiveTab] = useState<"chat" | "design" | "check">("chat");
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const errors = qualityIssues.filter((q) => q.severity === "error");
  const warnings = qualityIssues.filter((q) => q.severity === "warning");
  const infos = qualityIssues.filter((q) => q.severity === "info");

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (activeTab === "chat") {
      inputRef.current?.focus();
    }
  }, [activeTab]);

  const handleSend = () => {
    if (!inputValue.trim() || isAiLoading) return;
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
    <div
      className="no-print fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-40 flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-200 select-none overflow-hidden text-zinc-100"
      style={{ maxHeight: "calc(100vh - 180px)", minHeight: "420px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0 bg-zinc-950">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Wand2 className="w-3.5 h-3.5 text-zinc-200" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-100 leading-none">PagePilot AI</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {isAiLoading ? "Optimizing document..." : "Document Co-Pilot"}
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg text-xs font-medium border border-zinc-800">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "chat"
                ? "bg-zinc-800 text-white shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>Messages</span>
            {messages.length > 1 && (
              <span className="px-1.5 bg-zinc-700 text-zinc-200 text-[10px] font-mono rounded-full">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("design")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "design"
                ? "bg-zinc-800 text-white shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layout className="w-3 h-3" />
            <span>Layout Logic</span>
            {designReasoning && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("check")}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "check"
                ? "bg-zinc-800 text-white shadow-xs font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Print Audit</span>
            {qualityIssues.length > 0 && (
              <span className="px-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono rounded-full">
                {qualityIssues.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-zinc-950">
        {activeTab === "chat" ? (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                      m.sender === "ai"
                        ? "bg-zinc-850 border border-zinc-700 text-zinc-200"
                        : "bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    {m.sender === "ai" ? (
                      <Wand2 className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] text-xs leading-relaxed px-3.5 py-2.5 rounded-xl ${
                      m.sender === "user"
                        ? "bg-zinc-800 text-zinc-100 rounded-tr-xs border border-zinc-750"
                        : "bg-zinc-900 text-zinc-200 rounded-tl-xs border border-zinc-800"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="flex gap-2.5 flex-row">
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-zinc-850 border border-zinc-700 flex items-center justify-center text-zinc-200">
                    <Wand2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="shrink-0 px-3 pb-3 pt-2 border-t border-zinc-800 bg-zinc-950">
              <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-zinc-700 transition-all">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isAiLoading}
                  placeholder="Ask PagePilot or specify a layout adjustment..."
                  className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 outline-none resize-none max-h-24 leading-relaxed py-0.5 disabled:opacity-60"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isAiLoading}
                  className="shrink-0 w-7 h-7 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center hover:bg-white disabled:opacity-30 transition-all font-medium"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1.5 text-center font-mono">
                Press Enter to send · Shift+Enter for newline
              </p>
            </div>
          </div>
        ) : activeTab === "design" ? (
          /* AI Design Logic Tab */
          <div className="p-4 space-y-4">
            <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-100">
                  <Layout className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Layout Architecture</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                Select a structural paradigm or let PagePilot balance the grid automatically.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => onTransformDocument?.("chemistry")}
                  className="px-2.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors"
                >
                  <div className="text-xs font-medium text-zinc-100 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Lab Guide</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Bento + LaTeX formula</div>
                </button>
                <button
                  onClick={() => onTransformDocument?.("academic")}
                  className="px-2.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors"
                >
                  <div className="text-xs font-medium text-zinc-100 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Academic Paper</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Dual-column balance</div>
                </button>
                <button
                  onClick={() => onTransformDocument?.("executive")}
                  className="px-2.5 py-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-left transition-colors"
                >
                  <div className="text-xs font-medium text-zinc-100 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Executive Brief</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">Structured summary</div>
                </button>
              </div>
            </div>

            {/* Design Reasoning Breakdown */}
            {designReasoning ? (
              <div className="space-y-3">
                <div className="border border-zinc-800 rounded-xl p-3.5 bg-zinc-900">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                    Document Archetype
                  </div>
                  <div className="text-sm font-semibold text-zinc-100">
                    {designReasoning.documentType}
                  </div>
                </div>

                <div className="border border-zinc-800 rounded-xl p-3.5 bg-zinc-900 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                    <Layout className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Grid & Optical Geometry</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-mono text-[11px] bg-zinc-950 p-2 rounded border border-zinc-800">
                    {designReasoning.gridSystem}
                  </p>
                </div>

                <div className="border border-zinc-800 rounded-xl p-3.5 bg-zinc-900 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                    <Type className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Typography Pairing & Scale</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-mono text-[11px] bg-zinc-950 p-2 rounded border border-zinc-800">
                    {designReasoning.typographyPairing}
                  </p>
                </div>

                <div className="border border-zinc-800 rounded-xl p-3.5 bg-zinc-900 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                    <Palette className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Color Palette</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-mono text-[11px] bg-zinc-950 p-2 rounded border border-zinc-800">
                    {designReasoning.colorPalette}
                  </p>
                </div>

                {designReasoning.semanticComponents?.length > 0 && (
                  <div className="border border-zinc-800 rounded-xl p-3.5 bg-zinc-900 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Synthesized Elements ({designReasoning.semanticComponents.length})</span>
                    </div>
                    <ul className="space-y-1.5">
                      {designReasoning.semanticComponents.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
                <Wand2 className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                <h5 className="text-xs font-medium text-zinc-200">No Design Audit Recorded Yet</h5>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-sm mx-auto">
                  Run auto-layout optimization to analyze content flow, KaTeX equations, and print margins.
                </p>
                <button
                  onClick={() => onTransformDocument?.("auto")}
                  className="mt-3.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-medium rounded-lg transition-colors"
                >
                  Optimize Layout
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Print Audit Tab */
          <div className="p-4 space-y-3">
            {qualityIssues.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                <span className="text-[11px] font-medium text-zinc-200 flex items-center gap-1.5 w-full mb-1">
                  <Wand2 className="w-3 h-3 text-zinc-400" />
                  Remediation Actions:
                </span>
                {onAutoFixMargins && (
                  <button
                    onClick={onAutoFixMargins}
                    className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg border border-zinc-700 transition-colors"
                  >
                    Snap to 0.45" Margins
                  </button>
                )}
                {onAutoFixOverlaps && (
                  <button
                    onClick={onAutoFixOverlaps}
                    className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg border border-zinc-700 transition-colors"
                  >
                    Resolve Overlaps
                  </button>
                )}
                {onSendMessage && (
                  <button
                    onClick={() => { onSendMessage("Fix all layout overflows, collisions, and margins."); setActiveTab("chat"); }}
                    className="text-xs px-2.5 py-1 bg-zinc-100 hover:bg-white text-zinc-900 font-medium rounded-lg transition-colors"
                  >
                    Full Balance
                  </button>
                )}
              </div>
            )}

            {qualityIssues.length === 0 && (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-semibold text-zinc-100">Print Audit Passed</h4>
                <p className="text-xs text-zinc-400 mt-1.5 max-w-xs leading-relaxed">
                  All containers respect the 0.45" print boundary with no overlapping boxes or clipped text.
                </p>
              </div>
            )}

            {errors.length > 0 && (
              <div className="border border-rose-900/60 bg-rose-950/30 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 mb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Errors ({errors.length})</span>
                </div>
                <ul className="space-y-2 text-xs text-rose-200">
                  {errors.map((err, idx) => (
                    <li key={idx} className="bg-zinc-950 p-2 rounded-lg border border-rose-900/50">
                      <div className="font-medium">{err.message}</div>
                      {err.suggestion && <div className="text-[11px] text-zinc-400 mt-0.5">{err.suggestion}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="border border-amber-900/60 bg-amber-950/30 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Warnings ({warnings.length})</span>
                </div>
                <ul className="space-y-2 text-xs text-amber-200">
                  {warnings.map((w, idx) => (
                    <li key={idx} className="bg-zinc-950 p-2 rounded-lg border border-amber-900/50">
                      <div className="font-medium">{w.message}</div>
                      {w.suggestion && <div className="text-[11px] text-zinc-400 mt-0.5">{w.suggestion}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {infos.length > 0 && (
              <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
                  <Info className="w-4 h-4 text-zinc-400" />
                  <span>Suggestions ({infos.length})</span>
                </div>
                <ul className="space-y-2 text-xs text-zinc-300">
                  {infos.map((info, idx) => (
                    <li key={idx} className="bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                      <div className="font-medium">{info.message}</div>
                      {info.suggestion && <div className="text-[11px] text-zinc-400 mt-0.5">{info.suggestion}</div>}
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
