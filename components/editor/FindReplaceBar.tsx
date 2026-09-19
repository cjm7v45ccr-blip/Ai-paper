"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Replace, ChevronUp, ChevronDown, X, Check } from "lucide-react";

interface FindReplaceBarProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (searchTerm: string, matchCase: boolean) => void;
  onReplace: (searchTerm: string, replaceTerm: string, matchCase: boolean) => void;
  onReplaceAll: (searchTerm: string, replaceTerm: string, matchCase: boolean) => void;
  totalMatches: number;
  currentMatchIndex: number;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  isOpen,
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
  totalMatches,
  currentMatchIndex,
  onNextMatch,
  onPrevMatch,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [showReplace, setShowReplace] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    onFind(searchTerm, matchCase);
  }, [searchTerm, matchCase, onFind]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 right-6 z-40 bg-[#12141c]/95 backdrop-blur-md border border-white/[0.12] rounded-2xl shadow-2xl p-3 w-84 text-xs text-zinc-200 animate-in fade-in-50 slide-in-from-top-2 duration-150 select-none">
      {/* Search Row */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative flex items-center bg-black/40 border border-white/[0.1] rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500">
          <Search className="w-3.5 h-3.5 text-zinc-400 mr-1.5 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) onPrevMatch();
                else onNextMatch();
              }
              if (e.key === "Escape") onClose();
            }}
            placeholder="Find in document (Cmd+F)..."
            className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none"
          />
          {searchTerm && (
            <span className="text-[10px] text-zinc-400 px-1 font-mono shrink-0">
              {totalMatches > 0 ? `${currentMatchIndex + 1}/${totalMatches}` : "0/0"}
            </span>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={onPrevMatch}
            disabled={totalMatches === 0}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-zinc-300 disabled:opacity-30 disabled:pointer-events-none"
            title="Previous Match (Shift+Enter)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={onNextMatch}
            disabled={totalMatches === 0}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-zinc-300 disabled:opacity-30 disabled:pointer-events-none"
            title="Next Match (Enter)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white ml-0.5"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Replace Toggle & Match Case row */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.06] text-[11px] text-zinc-400">
        <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-zinc-200">
          <input
            type="checkbox"
            checked={matchCase}
            onChange={(e) => setMatchCase(e.target.checked)}
            className="rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-0 w-3 h-3"
          />
          <span>Match case</span>
        </label>

        <button
          onClick={() => setShowReplace(!showReplace)}
          className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1"
        >
          <Replace className="w-3 h-3" />
          <span>{showReplace ? "Hide Replace" : "Replace Mode"}</span>
        </button>
      </div>

      {/* Replace Section */}
      {showReplace && (
        <div className="mt-2 space-y-2 animate-in fade-in-50 duration-150">
          <div className="flex items-center bg-black/40 border border-white/[0.1] rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500">
            <Replace className="w-3.5 h-3.5 text-zinc-400 mr-1.5 shrink-0" />
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Replace with..."
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => onReplace(searchTerm, replaceTerm, matchCase)}
              disabled={!searchTerm.trim() || totalMatches === 0}
              className="px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-medium transition-colors"
            >
              Replace
            </button>
            <button
              onClick={() => onReplaceAll(searchTerm, replaceTerm, matchCase)}
              disabled={!searchTerm.trim() || totalMatches === 0}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-medium transition-colors"
            >
              Replace All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
