"use client";

import React from "react";
import { FastForward, Sparkles } from "lucide-react";

interface GenerationAnimationProps {
  isAnimating: boolean;
  onSkip: () => void;
}

export const GenerationAnimation: React.FC<GenerationAnimationProps> = ({
  isAnimating,
  onSkip,
}) => {
  if (!isAnimating) return null;

  return (
    <div className="no-print fixed top-16 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2 select-none">
      <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/90 text-white text-xs font-medium rounded-full shadow-lg backdrop-blur border border-slate-800">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
        <span>Synthesizing publication layout...</span>
        <button
          onClick={onSkip}
          className="ml-2 pl-2 border-l border-slate-700 flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          title="Skip synthesis animation"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Skip</span>
        </button>
      </div>
    </div>
  );
};