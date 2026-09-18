"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader2, Wand2 } from "lucide-react";

interface MinimalAiPromptBarProps {
  onSubmitPrompt: (command: string) => void;
  isLoading?: boolean;
}

export const MinimalAiPromptBar: React.FC<MinimalAiPromptBarProps> = ({
  onSubmitPrompt,
  isLoading = false,
}) => {
  const [prompt, setPrompt] = useState("");

  const suggestedCommands = [
    "Make this more concise",
    "Change the layout",
    "Add a comparison section",
    "Use a more professional tone",
    "Remove this section",
    "Make the design more visual",
  ];

  const handleSend = (textToSend?: string) => {
    const finalPrompt = textToSend || prompt;
    if (!finalPrompt.trim() || isLoading) return;
    onSubmitPrompt(finalPrompt.trim());
    if (!textToSend) setPrompt("");
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40 select-none pointer-events-auto">
      <div className="flex flex-col items-center gap-2">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none px-2">
          {suggestedCommands.map((cmd, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSend(cmd)}
              className="px-2.5 py-1 rounded-full bg-[#161822]/90 hover:bg-[#202230] border border-white/[0.08] hover:border-indigo-500/40 text-[11px] font-medium text-zinc-300 hover:text-white whitespace-nowrap shadow-sm backdrop-blur-md transition-all active:scale-[0.98]"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* The Main Pill Input Bar */}
        <div className="w-full bg-[#13151c]/95 border border-white/[0.12] focus-within:border-indigo-500/60 rounded-full shadow-2xl backdrop-blur-xl px-4 py-2 flex items-center gap-3 transition-all ring-1 ring-white/[0.05] focus-within:ring-indigo-500/20">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-400 shrink-0">
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </div>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask PagePilot to edit, rebalance layout, or add content..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none"
          />

          <button
            type="button"
            disabled={!prompt.trim() || isLoading}
            onClick={() => handleSend()}
            className="w-7 h-7 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-25 disabled:pointer-events-none flex items-center justify-center transition-all shadow-xs shrink-0"
            title="Send AI Command"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
