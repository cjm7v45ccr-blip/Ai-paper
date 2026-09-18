"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  FileText,
  Presentation,
} from "lucide-react";
import { PageData, DocumentMode } from "@/types/document";

interface MinimalLeftRailProps {
  pages: PageData[];
  activePageIndex: number;
  onSelectPageIndex: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onReorderPages: (fromIndex: number, toIndex: number) => void;
  documentMode: DocumentMode;
}

export const MinimalLeftRail: React.FC<MinimalLeftRailProps> = ({
  pages,
  activePageIndex,
  onSelectPageIndex,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onReorderPages,
  documentMode,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const isPresentation = documentMode === "presentation";

  if (isCollapsed) {
    return (
      <div className="w-10 border-r border-white/[0.08] bg-[#0d0f14]/90 flex flex-col items-center py-3 select-none z-20 shrink-0">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Expand navigation panel"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        <div className="mt-4 flex flex-col items-center gap-2">
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPageIndex(idx)}
              className={`w-6 h-6 rounded-md text-[10px] font-mono flex items-center justify-center transition-colors ${
                idx === activePageIndex
                  ? "bg-indigo-600 text-white font-bold shadow-xs"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05]"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside className="w-56 sm:w-64 border-r border-white/[0.08] bg-[#0d0f14]/80 backdrop-blur-md flex flex-col select-none z-20 shrink-0">
      {/* Header */}
      <div className="h-10 px-3 border-b border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium">
          {isPresentation ? (
            <Presentation className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{isPresentation ? "Slides" : "Sections"} ({pages.length})</span>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Collapse panel"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Pages / Slides List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {pages.map((page, idx) => {
          const isActive = idx === activePageIndex;

          // Find an exemplary heading or title for the thumbnail
          const headingElem = page.elements?.find((el) => el.type === "heading");
          const displayTitle =
            page.title ||
            (headingElem?.content?.title
              ? typeof headingElem.content.title === "string"
                ? headingElem.content.title
                : "Slide Content"
              : `${isPresentation ? "Slide" : "Section"} ${idx + 1}`);

          return (
            <div
              key={page.id || `page-${idx}`}
              draggable
              onDragStart={() => setDraggedIndex(idx)}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={() => {
                if (draggedIndex !== null && draggedIndex !== idx) {
                  onReorderPages(draggedIndex, idx);
                  setDraggedIndex(null);
                }
              }}
              onClick={() => onSelectPageIndex(idx)}
              className={`group relative rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                isActive
                  ? "bg-[#181a24] border-indigo-500/70 shadow-sm ring-1 ring-indigo-500/30"
                  : "bg-[#12141c] border-white/[0.06] hover:border-white/[0.14] hover:bg-[#161822]"
              }`}
            >
              {/* Top Row: Index and Title */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-md text-[10px] font-mono flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-indigo-600 text-white font-bold"
                      : "bg-white/[0.06] text-zinc-400"
                  }`}
                >
                  {idx + 1}
                </div>

                <span
                  className={`text-xs font-medium truncate flex-1 ${
                    isActive ? "text-white" : "text-zinc-300 group-hover:text-zinc-100"
                  }`}
                >
                  {displayTitle}
                </span>

                <GripVertical className="w-3.5 h-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing shrink-0" />
              </div>

              {/* Elements Count Snippet */}
              <div className="mt-1.5 text-[10px] text-zinc-500 flex items-center justify-between">
                <span>{page.elements?.length || 0} blocks</span>

                {/* Card Action Buttons (Hover) */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderPages(idx, idx - 1);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                      title="Move up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  )}

                  {idx < pages.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderPages(idx, idx + 1);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                      title="Move down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(idx);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  {pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(idx);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Page / Slide Button */}
      <div className="p-2.5 border-t border-white/[0.06]">
        <button
          onClick={onAddPage}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white border border-white/[0.06] transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isPresentation ? "New Slide" : "New Section"}</span>
        </button>
      </div>
    </aside>
  );
};
