"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, ArrowUp, Paperclip, ChevronUp, Check, Wand2 } from "lucide-react";

interface FloatingChatBarProps {
  onSendMessage: (prompt: string) => void;
  isLoading: boolean;
  onOpenExpandedPanel: () => void;
  isExpanded?: boolean;
}

const QUICK_COMMANDS = [
  "Fix the layout",
  "Make it look great",
  "Add a chart",
  "Make hand-copy friendly",
  "Check margins",
  "What can you do?",
];

export const FloatingChatBar: React.FC<FloatingChatBarProps> = ({
  onSendMessage,
  isLoading,
  onOpenExpandedPanel,
  isExpanded = false,
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

  const handleQuickChip = (chip: string) => {
    if (isLoading) return;
    onSendMessage(chip);
  };

  return (
    <div className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40 flex flex-col items-center">
      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto max-w-full py-0.5 px-1 scrollbar-none">
        {QUICK_COMMANDS.map((cmd, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickChip(cmd)}
            disabled={isLoading}
            className="shrink-0 text-[11px] font-medium bg-white/95 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200/90 hover:border-indigo-300 px-2.5 py-1 rounded-full shadow-xs backdrop-blur transition-all flex items-center gap-1 disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>{cmd}</span>
          </button>
        ))}
      </div>

      {/* Pill Command Bar */}
      <div className="w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-2 transition-all hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Gemini AI Status Indicator */}
          <div
            className="pl-2 text-indigo-600 flex items-center cursor-pointer"
            onClick={onOpenExpandedPanel}
            title="Gemini 2.5 Director"
          >
            <div className={`p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 ${isLoading ? "animate-pulse" : ""}`}>
              <Wand2 className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-500" : "text-indigo-600"}`} />
            </div>
          </div>

          {/* Text Input with Enter / Shift+Enter Support */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask PagePilot anything — 'Make this a physics worksheet', 'Add a formula', 'What can you do?'..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none px-2 py-1.5 resize-none max-h-24 leading-snug"
          />

          {/* Quick Drawer Expand Button */}
          <button
            type="button"
            onClick={onOpenExpandedPanel}
            title={isExpanded ? "Minimize AI History & Audits" : "Expand AI Co-Pilot & Page Check"}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ChevronUp className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180 text-indigo-600" : ""}`} />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-xs shrink-0"
            title="Send Instruction (Enter)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};