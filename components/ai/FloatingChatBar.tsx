"use client";

import React, { useState, useRef } from "react";
import { ArrowUp, Sparkles, ChevronUp, Layers, HelpCircle } from "lucide-react";
import { DocumentMode } from "@/types/document";

interface FloatingChatBarProps {
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
  onOpenExpandedPanel: () => void;
  isExpanded?: boolean;
  selectedElementLabel?: string | null;
  documentMode?: DocumentMode;
  activePageIndex?: number;
}

const QUICK_COMMANDS = [
  "Verify 0.45'' safe margins",
  "Refine typography hierarchy",
  "Add comparison breakdown",
  "Balance card spacing",
  "Format KaTeX equations",
];

export const FloatingChatBar: React.FC<FloatingChatBarProps> = ({
  onSendMessage,
  isLoading,
  onOpenExpandedPanel,
  isExpanded = false,
  selectedElementLabel,
  documentMode = "document",
  activePageIndex = 0,
}) => {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSendMessage(prompt.trim());
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="no-print fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40 flex flex-col items-center select-none">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto max-w-full py-0.5 px-1 scrollbar-none">
        {QUICK_COMMANDS.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (!isLoading) onSendMessage(cmd);
            }}
            disabled={isLoading}
            className="shrink-0 text-[11px] font-medium bg-[#16171d]/90 hover:bg-[#20222a] text-zinc-300 hover:text-white border border-white/[0.08] hover:border-white/[0.15] px-2.5 py-1 rounded-full shadow-md backdrop-blur-md transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>{cmd}</span>
          </button>
        ))}
      </div>

      {/* Floating AI Input Bar */}
      <div className="w-full bg-[#14151b]/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl p-2 transition-all hover:border-white/[0.18] focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/30">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Context Tag / AI Sparkle */}
          <div
            onClick={onOpenExpandedPanel}
            className="pl-2 flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-white transition-colors"
            title="Open Layout & Quality Copilot"
          >
            <div className="p-1.5 rounded-lg bg-zinc-800/80 border border-white/[0.08] text-indigo-400">
              <Sparkles className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
            </div>
            {selectedElementLabel && (
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.07] text-zinc-300 truncate max-w-[120px]">
                {selectedElementLabel}
              </span>
            )}
          </div>

          {/* Prompt Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              selectedElementLabel
                ? `Ask PagePilot to edit ${selectedElementLabel}...`
                : "Ask PagePilot to create, edit, or improve this document..."
            }
            className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none px-2 py-1.5 resize-none max-h-24 leading-snug"
          />

          {/* Quality Audit Drawer Expand Toggle */}
          <button
            type="button"
            onClick={onOpenExpandedPanel}
            title={isExpanded ? "Close Copilot Drawer" : "Open Layout & Quality Audit Drawer"}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.07] transition-colors"
          >
            <ChevronUp className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-indigo-400" : ""}`} />
          </button>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:opacity-40 text-white transition-all shadow-md shrink-0"
            title="Send Instruction"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
