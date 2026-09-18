"use client";

import React, { useState, useRef, useEffect } from "react";
import { DocumentModel, DocumentElement, DocumentMode, PageData } from "@/types/document";
import { ElementRenderer } from "./ElementRenderer";
import { ContextualFloatingToolbar } from "./ContextualFloatingToolbar";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Plus,
  Edit3,
  Check,
  Sparkles,
} from "lucide-react";
import { MathRenderer } from "@/lib/math-markdown-engine";

interface AdaptiveContentCanvasProps {
  document: DocumentModel;
  documentMode: DocumentMode;
  activePageIndex: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElementContent: (id: string, newContent: any) => void;
  onUpdateElementStyle: (id: string, styleUpdates: Record<string, any>) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onReorderElements: (fromIndex: number, toIndex: number) => void;
  onAddBlock: (type: "text" | "callout" | "formula" | "table" | "chart" | "checkboxGroup") => void;
  onAiRefineElement: (id: string, actionType: string) => void;
  isAiLoading?: boolean;
}

export const AdaptiveContentCanvas: React.FC<AdaptiveContentCanvasProps> = ({
  document: doc,
  documentMode,
  activePageIndex,
  selectedElementId,
  onSelectElement,
  onUpdateElementContent,
  onUpdateElementStyle,
  onDuplicateElement,
  onDeleteElement,
  onReorderElements,
  onAddBlock,
  onAiRefineElement,
  isAiLoading = false,
}) => {
  const isPresentation = documentMode === "presentation";
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  // Active page
  const pages: PageData[] =
    doc.pages && doc.pages.length > 0
      ? doc.pages
      : [
          {
            id: "page-1",
            title: "Untitled Page",
            elements: doc.elements || [],
          },
        ];

  const currentPage = pages[activePageIndex] || pages[0];
  const elements = currentPage?.elements || [];

  // Group elements into Header (heading/title) and Body cards for responsive bento-grid layout
  const headerElement = elements.find((el) => el.type === "heading");
  const bodyElements = elements.filter((el) => el.type !== "heading");

  // Selected element lookup
  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Dynamic grid column class based on body element count to prevent empty gaps
  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count === 3) return "grid-cols-1 md:grid-cols-3";
    if (count === 4) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-2";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
  };

  return (
    <div
      onClick={(e) => {
        // Deselect if clicking on the background canvas
        if (e.target === e.currentTarget) {
          onSelectElement(null);
          setEditingElementId(null);
        }
      }}
      className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 flex flex-col items-center justify-start min-h-0 relative select-none scrollbar-thin scrollbar-thumb-white/10"
    >
      {/* Contextual Toolbar (Floats above when element selected) */}
      {selectedElement && (
        <div className="sticky top-2 z-40 mb-4 pointer-events-auto">
          <ContextualFloatingToolbar
            selectedElement={selectedElement}
            onUpdateElementStyle={(styleUpdates) =>
              onUpdateElementStyle(selectedElement.id, styleUpdates)
            }
            onDuplicate={() => onDuplicateElement(selectedElement.id)}
            onDelete={() => {
              onDeleteElement(selectedElement.id);
              onSelectElement(null);
            }}
            onAiRefine={(actionType) => onAiRefineElement(selectedElement.id, actionType)}
            isAiLoading={isAiLoading}
          />
        </div>
      )}

      {/* The Central Document / Presentation Page Container */}
      <div
        className={`w-full bg-[#11131a] border border-white/[0.1] rounded-3xl shadow-2xl transition-all relative overflow-hidden flex flex-col ${
          isPresentation
            ? "max-w-5xl aspect-[16/9] min-h-[520px] p-6 sm:p-10"
            : "max-w-4xl min-h-[820px] p-8 sm:p-12"
        }`}
      >
        {/* Subtle Decorative Ambient Gradient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/[0.04] rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Section (Title & Subtitle) */}
        {headerElement ? (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectElement(headerElement.id);
            }}
            className={`group relative rounded-2xl p-4 transition-all mb-6 ${
              selectedElementId === headerElement.id
                ? "ring-2 ring-indigo-500/80 bg-white/[0.03]"
                : "hover:bg-white/[0.02]"
            }`}
          >
            {/* Header Badge */}
            {headerElement.metadata?.badge && (
              <span className="inline-block text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                {headerElement.metadata.badge}
              </span>
            )}

            {/* Direct Inline Title Editor */}
            {editingElementId === `${headerElement.id}-title` ? (
              <input
                type="text"
                autoFocus
                defaultValue={headerElement.content?.title || ""}
                onBlur={(e) => {
                  setEditingElementId(null);
                  onUpdateElementContent(headerElement.id, {
                    ...headerElement.content,
                    title: e.target.value,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingElementId(null);
                    onUpdateElementContent(headerElement.id, {
                      ...headerElement.content,
                      title: (e.target as HTMLInputElement).value,
                    });
                  }
                }}
                className="w-full text-2xl sm:text-3xl font-bold text-white bg-zinc-800/80 border border-indigo-500/50 rounded-lg px-2 py-1 outline-none"
              />
            ) : (
              <h1
                onClick={() => setEditingElementId(`${headerElement.id}-title`)}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-white cursor-text hover:text-indigo-200 transition-colors"
                title="Click to edit title"
              >
                {headerElement.content?.title || "Untitled Heading"}
              </h1>
            )}

            {/* Direct Inline Subtitle Editor */}
            {editingElementId === `${headerElement.id}-subtitle` ? (
              <input
                type="text"
                autoFocus
                defaultValue={headerElement.content?.subtitle || ""}
                onBlur={(e) => {
                  setEditingElementId(null);
                  onUpdateElementContent(headerElement.id, {
                    ...headerElement.content,
                    subtitle: e.target.value,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingElementId(null);
                    onUpdateElementContent(headerElement.id, {
                      ...headerElement.content,
                      subtitle: (e.target as HTMLInputElement).value,
                    });
                  }
                }}
                className="w-full text-sm sm:text-base text-zinc-300 bg-zinc-800/80 border border-indigo-500/50 rounded-lg px-2 py-1 outline-none mt-2"
              />
            ) : (
              <p
                onClick={() => setEditingElementId(`${headerElement.id}-subtitle`)}
                className="mt-1.5 text-sm sm:text-base text-zinc-400 cursor-text hover:text-zinc-200 transition-colors"
                title="Click to edit subtitle"
              >
                {headerElement.content?.subtitle || "Click to add a brief introductory description..."}
              </p>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <button
              onClick={() => onAddBlock("text")}
              className="text-xs text-zinc-500 hover:text-indigo-400 flex items-center gap-1 py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Title</span>
            </button>
          </div>
        )}

        {/* 2. Body Content Grid (Intelligent adaptive bento layout) */}
        <div className={`grid ${getGridClass(bodyElements.length)} gap-4 flex-1 items-stretch`}>
          {bodyElements.map((elem, idx) => {
            const isSelected = selectedElementId === elem.id;

            return (
              <div
                key={elem.id}
                draggable
                onDragStart={() => setDraggedIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedIdx !== null && draggedIdx !== idx) {
                    // Offset by 1 if header exists
                    const offset = headerElement ? 1 : 0;
                    onReorderElements(draggedIdx + offset, idx + offset);
                    setDraggedIdx(null);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(elem.id);
                }}
                className={`group relative rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between border ${
                  isSelected
                    ? "bg-[#181a24] border-indigo-500/80 shadow-lg ring-1 ring-indigo-500/40"
                    : "bg-[#14161f] border-white/[0.08] hover:border-white/[0.18] hover:bg-[#181a24]"
                }`}
              >
                {/* Top Action Hover Bar on Card */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-[#161822]/90 border border-white/[0.1] rounded-lg p-0.5 shadow-md">
                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const offset = headerElement ? 1 : 0;
                        onReorderElements(idx + offset, idx + offset - 1);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-white"
                      title="Move card left/up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                  )}

                  {idx < bodyElements.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const offset = headerElement ? 1 : 0;
                        onReorderElements(idx + offset, idx + offset + 1);
                      }}
                      className="p-1 rounded text-zinc-400 hover:text-white"
                      title="Move card right/down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateElement(elem.id);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-white"
                    title="Duplicate card"
                  >
                    <Copy className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement(elem.id);
                      if (selectedElementId === elem.id) onSelectElement(null);
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                    title="Delete card (reflows cleanly)"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Card Content Display & Direct Inline Editing */}
                <div className="flex-1 w-full flex flex-col justify-center">
                  {elem.type === "formula" ? (
                    <div className="space-y-2">
                      {elem.content?.title && (
                        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
                          {elem.content.title}
                        </div>
                      )}
                      <div className="py-2 px-3 bg-zinc-900/60 rounded-xl border border-white/[0.06] overflow-x-auto text-center flex items-center justify-center">
                        <MathRenderer
                          latex={elem.content?.equation || "E = mc^2"}
                          displayMode={true}
                        />
                      </div>
                      {elem.content?.breakdown && (
                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-zinc-400">
                          {elem.content.breakdown.map((item: any, bIdx: number) => (
                            <div key={bIdx} className="flex items-center gap-1.5 truncate">
                              <span className="font-mono text-indigo-400 font-semibold">
                                {item.symbol}:
                              </span>
                              <span className="truncate">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : elem.type === "callout" || elem.type === "quote" ? (
                    <div className="space-y-2">
                      {elem.content?.title && (
                        <div className="text-xs font-semibold text-indigo-300">
                          {elem.content.title}
                        </div>
                      )}
                      {editingElementId === `${elem.id}-text` ? (
                        <textarea
                          autoFocus
                          defaultValue={elem.content?.text || ""}
                          onBlur={(e) => {
                            setEditingElementId(null);
                            onUpdateElementContent(elem.id, {
                              ...elem.content,
                              text: e.target.value,
                            });
                          }}
                          className="w-full text-xs sm:text-sm text-zinc-200 bg-zinc-800 border border-indigo-500/50 rounded-lg p-2 outline-none resize-none"
                          rows={3}
                        />
                      ) : (
                        <p
                          onClick={() => setEditingElementId(`${elem.id}-text`)}
                          className="text-xs sm:text-sm text-zinc-300 leading-relaxed cursor-text hover:text-white"
                        >
                          {elem.content?.text || "Click to edit callout text..."}
                        </p>
                      )}
                    </div>
                  ) : elem.type === "checkboxGroup" ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-zinc-300">
                        {elem.content?.title || "Checklist"}
                      </div>
                      <div className="space-y-1.5">
                        {elem.content?.items?.map((item: any, iIdx: number) => (
                          <div
                            key={iIdx}
                            onClick={() => {
                              const updatedItems = [...elem.content.items];
                              updatedItems[iIdx] = {
                                ...updatedItems[iIdx],
                                checked: !updatedItems[iIdx].checked,
                              };
                              onUpdateElementContent(elem.id, {
                                ...elem.content,
                                items: updatedItems,
                              });
                            }}
                            className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:text-white"
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                item.checked
                                  ? "bg-indigo-600 border-indigo-500 text-white"
                                  : "border-zinc-600 bg-zinc-800"
                              }`}
                            >
                              {item.checked && <Check className="w-3 h-3" />}
                            </div>
                            <span className={item.checked ? "line-through text-zinc-500" : ""}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : elem.type === "table" ? (
                    <div className="space-y-1.5">
                      {elem.content?.title && (
                        <div className="text-xs font-semibold text-zinc-300">
                          {elem.content.title}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] text-zinc-300 border-collapse">
                          {elem.content?.headers && (
                            <thead>
                              <tr className="border-b border-white/[0.1] text-zinc-400">
                                {elem.content.headers.map((h: string, hIdx: number) => (
                                  <th key={hIdx} className="py-1 px-2 font-medium">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                          )}
                          <tbody>
                            {elem.content?.rows?.slice(0, 4).map((row: string[], rIdx: number) => (
                              <tr key={rIdx} className="border-b border-white/[0.04]">
                                {row.map((cell: string, cIdx: number) => (
                                  <td key={cIdx} className="py-1 px-2 text-zinc-200">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    // General Text / Card block
                    <div className="space-y-1.5">
                      {elem.content?.title && (
                        <div className="text-xs font-semibold text-indigo-300">
                          {elem.content.title}
                        </div>
                      )}
                      {editingElementId === `${elem.id}-text` ? (
                        <textarea
                          autoFocus
                          defaultValue={
                            typeof elem.content === "string"
                              ? elem.content
                              : elem.content?.text || ""
                          }
                          onBlur={(e) => {
                            setEditingElementId(null);
                            onUpdateElementContent(
                              elem.id,
                              typeof elem.content === "string"
                                ? e.target.value
                                : { ...elem.content, text: e.target.value }
                            );
                          }}
                          className="w-full text-xs sm:text-sm text-zinc-200 bg-zinc-800 border border-indigo-500/50 rounded-lg p-2 outline-none resize-none"
                          rows={3}
                        />
                      ) : (
                        <p
                          onClick={() => setEditingElementId(`${elem.id}-text`)}
                          className="text-xs sm:text-sm text-zinc-300 leading-relaxed cursor-text hover:text-white"
                        >
                          {typeof elem.content === "string"
                            ? elem.content
                            : elem.content?.text || "Click to edit text..."}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Type Badge at Bottom */}
                <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span className="uppercase">{elem.type}</span>
                  <span className="text-[10px] text-zinc-600">Drag to reorder</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Bottom Inline Card Adder Bar */}
        <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-center gap-2 text-xs">
          <span className="text-zinc-500 text-[11px]">Add content block:</span>
          <button
            onClick={() => onAddBlock("text")}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          >
            + Text
          </button>
          <button
            onClick={() => onAddBlock("callout")}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          >
            + Callout
          </button>
          <button
            onClick={() => onAddBlock("formula")}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          >
            + Math Formula
          </button>
          <button
            onClick={() => onAddBlock("table")}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          >
            + Table
          </button>
          <button
            onClick={() => onAddBlock("checkboxGroup")}
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
          >
            + Checklist
          </button>
        </div>
      </div>
    </div>
  );
};
