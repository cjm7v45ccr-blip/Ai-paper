"use client";

import React from "react";
import { Sparkles, Loader2, FileText, Presentation } from "lucide-react";
import { DocumentMode } from "@/types/document";

interface GenerationSteppedScreenProps {
  prompt: string;
  mode: DocumentMode;
}

export const GenerationSteppedScreen: React.FC<GenerationSteppedScreenProps> = ({
  prompt,
  mode,
}) => {
  const isPresentation = mode === "presentation";

  return (
    <div className="min-h-screen bg-[#0d0f14] text-zinc-100 flex flex-col items-center justify-center p-6 select-none relative overflow-hidden font-sans">
      {/* Decorative center ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#13151c]/90 border border-white/[0.1] rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center text-center">
        {/* Animated AI Icon */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {isPresentation ? (
              <Presentation className="w-8 h-8" />
            ) : (
              <FileText className="w-8 h-8" />
            )}
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-3 h-3 text-white animate-spin" />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
          Generating {isPresentation ? "Presentation Deck" : "Publication Document"}
        </h2>

        <p className="mt-3 text-xs sm:text-sm text-zinc-300 font-medium px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] line-clamp-3">
          &ldquo;{prompt}&rdquo;
        </p>

        <div className="mt-8 flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Generating content and layouts with real AI model...</span>
        </div>

        {/* Subtle Status Info */}
        <div className="w-full mt-8 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>{isPresentation ? "16:9 Widescreen" : "8.5 × 11 Document"}</span>
          <span>Live AI Stream</span>
        </div>
      </div>
    </div>
  );
};
