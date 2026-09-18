"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { DocumentModel, DocumentElement, DocumentMode, PageData } from "@/types/document";
import { ElementRenderer } from "./ElementRenderer";
import { ContextualFloatingToolbar } from "./ContextualFloatingToolbar";
import {
  PAGE_WIDTH_IN,
  PAGE_HEIGHT_IN,
  PAGE_MARGIN_IN,
  DPI,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_MARGIN,
  PAGE_CONTENT_WIDTH,
  PAGE_CONTENT_HEIGHT,
  inchesToPx,
  pxToInches,
  clampPosition,
  clampDimensions,
} from "@/lib/coordinates";
import {
  autoPaginateDocument,
  computePageFlowLayout,
  turnPageIntoVisual,
  turnPageIntoDocumentFlow,
  balancePageLayout,
  estimateElementHeight,
} from "@/lib/layout-engine";
import {
  Sparkles,
  Plus,
  Move,
  LayoutTemplate,
  Maximize2,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Layers,
  FileText,
  Presentation,
  Check,
  Edit3,
  AlignLeft,
  ChevronDown,
  Scissors,
} from "lucide-react";

interface HybridDocumentCanvasProps {
  document: DocumentModel;
  documentMode: DocumentMode;
  activePageIndex: number;
  onSelectPageIndex: (index: number) => void;
  onAddPage: () => void;
  zoom: number;
  onUpdateZoom: (newZoom: number) => void;
  viewMode: "stacked" | "single";
  onToggleViewMode: () => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElementPosition: (id: string, x: number, y: number, pageIndex?: number) => void;
  onUpdateElementDimensions: (
    id: string,
    width: number,
    height: number,
    x?: number,
    y?: number,
    pageIndex?: number
  ) => void;
  onUpdateElementContent: (id: string, newContent: any, pageIndex?: number) => void;
  onUpdateElementStyle: (id: string, styleUpdates: Record<string, any>, pageIndex?: number) => void;
  onDuplicateElement: (id: string, pageIndex?: number) => void;
  onDeleteElement: (id: string, pageIndex?: number) => void;
  onReorderElements?: (fromIndex: number, toIndex: number, pageIndex?: number) => void;
  onAddBlock: (type: any, pageIndex?: number) => void;
  onAiRefineElement: (id: string, actionType: string) => void;
  onApplyDocumentUpdate: (newDoc: DocumentModel) => void;
  showMargins: boolean;
  onToggleMargins?: () => void;
  isBlackAndWhite?: boolean;
  isAiLoading?: boolean;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const HybridDocumentCanvas: React.FC<HybridDocumentCanvasProps> = ({
  document: doc,
  documentMode,
  activePageIndex,
  onSelectPageIndex,
  onAddPage,
  zoom,
  onUpdateZoom,
  viewMode,
  onToggleViewMode,
  selectedElementId,
  onSelectElement,
  onUpdateElementPosition,
  onUpdateElementDimensions,
  onUpdateElementContent,
  onUpdateElementStyle,
  onDuplicateElement,
  onDeleteElement,
  onReorderElements,
  onAddBlock,
  onAiRefineElement,
  onApplyDocumentUpdate,
  showMargins,
  onToggleMargins,
  isBlackAndWhite = false,
  isAiLoading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseInchPos, setMouseInchPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [quickAddMenuPageIdx, setQuickAddMenuPageIdx] = useState<number | null>(null);

  // Normalize pages
  const pages: PageData[] =
    doc.pages && doc.pages.length > 0
      ? doc.pages
      : [
          {
            id: "page-1",
            title: doc.title || "Page 1",
            elements: doc.elements || [],
          },
        ];

  // Dragging state for freeform canvas blocks
  const dragRef = useRef<{
    id: string;
    pageIndex: number;
    startX: number;
    startY: number;
    initialElemX: number;
    initialElemY: number;
    width: number;
    height: number;
  } | null>(null);

  // Resizing state for freeform canvas blocks
  const resizeRef = useRef<{
    id: string;
    pageIndex: number;
    handle: ResizeHandle;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
  } | null>(null);

  // Track mouse coordinates for Rulers in inches
  const handlePageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = (e.clientX - rect.left) / zoom;
    const clientY = (e.clientY - rect.top) / zoom;
    setMouseInchPos({
      x: Math.max(0, Math.min(PAGE_WIDTH_IN, pxToInches(clientX))),
      y: Math.max(0, Math.min(PAGE_HEIGHT_IN, pxToInches(clientY))),
    });
  };

  // Switch element layout mode between Flow (Google Docs flow) and Canvas (Freeform design)
  const handleToggleLayoutMode = (element: DocumentElement, pageIndex: number) => {
    const isCurrentlyCanvas = element.layoutMode === "canvas";
    const updatedPages = [...pages];
    const page = { ...updatedPages[pageIndex] };
    const elemIndex = page.elements.findIndex((el) => el.id === element.id);
    if (elemIndex === -1) return;

    if (isCurrentlyCanvas) {
      // Switch to Flow
      const updatedElem: DocumentElement = {
        ...element,
        layoutMode: "flow",
        x: PAGE_MARGIN_IN,
        width: PAGE_WIDTH_IN - PAGE_MARGIN_IN * 2,
      };
      page.elements = [
        ...page.elements.slice(0, elemIndex),
        updatedElem,
        ...page.elements.slice(elemIndex + 1),
      ];
    } else {
      // Switch to Canvas
      const updatedElem: DocumentElement = {
        ...element,
        layoutMode: "canvas",
        x: element.x || PAGE_MARGIN_IN,
        y: element.y || 2.0,
        width: Math.min(element.width || 4.5, PAGE_WIDTH_IN - PAGE_MARGIN_IN * 2),
        height: Math.max(element.height || 1.8, 1.2),
      };
      page.elements = [
        ...page.elements.slice(0, elemIndex),
        updatedElem,
        ...page.elements.slice(elemIndex + 1),
      ];
    }

    updatedPages[pageIndex] = page;
    onApplyDocumentUpdate({
      ...doc,
      pages: updatedPages,
      elements: updatedPages[0]?.elements || [],
    });
  };

  // Run auto pagination on overflow
  const handleAutoPaginate = () => {
    const paginated = autoPaginateDocument(doc);
    onApplyDocumentUpdate(paginated);
  };

  // Drag handles for canvas elements
  const handleStartDrag = (
    e: React.MouseEvent,
    element: DocumentElement,
    pageIndex: number
  ) => {
    e.stopPropagation();
    onSelectElement(element.id);
    onSelectPageIndex(pageIndex);

    dragRef.current = {
      id: element.id,
      pageIndex,
      startX: e.clientX,
      startY: e.clientY,
      initialElemX: element.x || PAGE_MARGIN_IN,
      initialElemY: element.y || PAGE_MARGIN_IN,
      width: element.width || 3.5,
      height: element.height || 2.0,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const dxPx = (moveEvent.clientX - dragRef.current.startX) / zoom;
      const dyPx = (moveEvent.clientY - dragRef.current.startY) / zoom;
      const dxIn = pxToInches(dxPx);
      const dyIn = pxToInches(dyPx);

      let targetX = dragRef.current.initialElemX + dxIn;
      let targetY = dragRef.current.initialElemY + dyIn;

      // Snap to margin guides (0.65", center 4.25", right 7.85")
      const SNAP_THRESH = 0.08;
      if (Math.abs(targetX - PAGE_MARGIN_IN) < SNAP_THRESH) targetX = PAGE_MARGIN_IN;
      if (Math.abs(targetX + dragRef.current.width - (PAGE_WIDTH_IN - PAGE_MARGIN_IN)) < SNAP_THRESH) {
        targetX = PAGE_WIDTH_IN - PAGE_MARGIN_IN - dragRef.current.width;
      }
      if (Math.abs(targetX + dragRef.current.width / 2 - PAGE_WIDTH_IN / 2) < SNAP_THRESH) {
        targetX = PAGE_WIDTH_IN / 2 - dragRef.current.width / 2;
      }

      const clamped = clampPosition(
        targetX,
        targetY,
        dragRef.current.width,
        dragRef.current.height,
        PAGE_WIDTH_IN,
        PAGE_HEIGHT_IN
      );

      onUpdateElementPosition(
        dragRef.current.id,
        clamped.x,
        clamped.y,
        dragRef.current.pageIndex
      );
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Resize handler for canvas elements
  const handleStartResize = (
    e: React.MouseEvent,
    handle: ResizeHandle,
    element: DocumentElement,
    pageIndex: number
  ) => {
    e.stopPropagation();
    resizeRef.current = {
      id: element.id,
      pageIndex,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initX: element.x || PAGE_MARGIN_IN,
      initY: element.y || PAGE_MARGIN_IN,
      initW: element.width || 3.5,
      initH: element.height || 2.0,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeRef.current) return;
      const dxIn = pxToInches((moveEvent.clientX - resizeRef.current.startX) / zoom);
      const dyIn = pxToInches((moveEvent.clientY - resizeRef.current.startY) / zoom);

      let newW = resizeRef.current.initW;
      let newH = resizeRef.current.initH;
      let newX = resizeRef.current.initX;
      let newY = resizeRef.current.initY;

      if (handle.includes("e")) newW += dxIn;
      if (handle.includes("s")) newH += dyIn;
      if (handle.includes("w")) {
        newW -= dxIn;
        newX += dxIn;
      }
      if (handle.includes("n")) {
        newH -= dyIn;
        newY += dyIn;
      }

      newW = Math.max(1.0, Math.min(PAGE_WIDTH_IN - newX, newW));
      newH = Math.max(0.6, Math.min(PAGE_HEIGHT_IN - newY, newH));

      onUpdateElementDimensions(
        resizeRef.current.id,
        newW,
        newH,
        newX,
        newY,
        resizeRef.current.pageIndex
      );
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Render a single 8.5 x 11 inch page
  const renderPage = (page: PageData, pageIdx: number) => {
    const isActive = pageIdx === activePageIndex;
    const elements = page.elements || [];

    // Separate flow elements vs freeform canvas elements
    const flowElements = elements.filter((el) => el.layoutMode !== "canvas");
    const canvasElements = elements.filter((el) => el.layoutMode === "canvas");

    // Flow layout calculation
    const flowLayout = computePageFlowLayout(page);

    return (
      <div
        key={page.id || `page-${pageIdx}`}
        id={`page-container-${pageIdx}`}
        onClick={() => onSelectPageIndex(pageIdx)}
        className="flex flex-col items-center group/page relative mb-12 last:mb-6"
      >
        {/* Page Top Header Bar */}
        <div className="w-[816px] flex items-center justify-between pb-2 text-[11px] font-mono text-zinc-400 select-none">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">
              {page.title || `Page ${pageIdx + 1}`}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-500">
              8.5 × 11 in (Letter)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const visual = turnPageIntoVisual(page);
                const updated = [...pages];
                updated[pageIdx] = visual;
                onApplyDocumentUpdate({ ...doc, pages: updated });
              }}
              className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-indigo-300 hover:text-indigo-200 text-[10px] font-sans flex items-center gap-1 transition-colors"
              title="Convert this page into a visual bento presentation"
            >
              <LayoutTemplate className="w-3 h-3" />
              <span>Make Visual</span>
            </button>

            <button
              onClick={() => {
                const docFlow = turnPageIntoDocumentFlow(page);
                const updated = [...pages];
                updated[pageIdx] = docFlow;
                onApplyDocumentUpdate({ ...doc, pages: updated });
              }}
              className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-zinc-200 text-[10px] font-sans flex items-center gap-1 transition-colors"
              title="Convert this page into standard document flow"
            >
              <FileText className="w-3 h-3" />
              <span>Make Document</span>
            </button>

            <span className="text-zinc-500 ml-2">
              {pageIdx + 1} of {pages.length}
            </span>
          </div>
        </div>

        {/* The 8.5 x 11 Inch Sheet of Paper */}
        <div
          onMouseMove={handlePageMouseMove}
          className={`relative bg-white text-zinc-900 transition-shadow select-none overflow-hidden ${
            isActive
              ? "shadow-[0_12px_45px_rgba(0,0,0,0.55)] ring-2 ring-indigo-500/50"
              : "shadow-[0_8px_30px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
          }`}
          style={{
            width: `${PAGE_WIDTH}px`, // 816px
            height: `${PAGE_HEIGHT}px`, // 1056px
            backgroundColor: page.background || "#ffffff",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onSelectElement(null);
              setEditingElementId(null);
            }
          }}
        >
          {/* Faint Margin Guidelines (0.65 in from edges) */}
          {showMargins && (
            <div
              className="absolute pointer-events-none border border-dashed border-sky-400/40 z-10"
              style={{
                top: `${PAGE_MARGIN}px`,
                left: `${PAGE_MARGIN}px`,
                right: `${PAGE_MARGIN}px`,
                bottom: `${PAGE_MARGIN}px`,
              }}
            >
              <div className="absolute top-1 left-1 text-[9px] font-mono text-sky-500/60 uppercase">
                0.65" Margin
              </div>
            </div>
          )}

          {/* 1. DOCUMENT FLOW LAYER (Google Docs-style natural stacking) */}
          <div
            className="w-full h-full flex flex-col pointer-events-auto"
            style={{
              paddingTop: `${PAGE_MARGIN}px`,
              paddingBottom: `${PAGE_MARGIN}px`,
              paddingLeft: `${PAGE_MARGIN}px`,
              paddingRight: `${PAGE_MARGIN}px`,
            }}
          >
            {flowElements.map((element, elIdx) => {
              const isSelected = selectedElementId === element.id;
              const isEditing = editingElementId === element.id;

              return (
                <div
                  key={element.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement(element.id);
                    onSelectPageIndex(pageIdx);
                  }}
                  className={`relative group/block rounded-lg transition-all mb-3.5 ${
                    isSelected
                      ? "ring-2 ring-indigo-600 bg-indigo-50/20 p-1"
                      : "hover:ring-1 hover:ring-zinc-300 p-1"
                  }`}
                >
                  {/* Block Hover Action Bar */}
                  <div
                    className={`absolute -top-7 right-1 z-30 flex items-center gap-1 bg-[#161822] text-white px-2 py-1 rounded-md shadow-lg border border-white/10 transition-opacity text-[10px] font-medium ${
                      isSelected ? "opacity-100" : "opacity-0 group-hover/block:opacity-100"
                    }`}
                  >
                    <span className="font-mono text-indigo-300 uppercase text-[9px] pr-1 border-r border-white/10">
                      {element.type}
                    </span>

                    {/* Switch to Canvas Mode button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLayoutMode(element, pageIdx);
                      }}
                      className="px-1.5 py-0.5 rounded hover:bg-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
                      title="Convert to freeform canvas block (drag freely)"
                    >
                      <Move className="w-2.5 h-2.5" />
                      <span>Freeform</span>
                    </button>

                    {/* Inline Edit Text */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingElementId(element.id);
                        if (typeof element.content === "string") {
                          setEditingContent(element.content);
                        } else if (element.content?.title) {
                          setEditingContent(element.content.title);
                        } else if (element.content?.text) {
                          setEditingContent(element.content.text);
                        }
                      }}
                      className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white"
                      title="Edit text inline"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                    </button>

                    {/* Reorder Up/Down */}
                    {elIdx > 0 && onReorderElements && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderElements(elIdx, elIdx - 1, pageIdx);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white"
                        title="Move block up"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                      </button>
                    )}

                    {elIdx < flowElements.length - 1 && onReorderElements && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReorderElements(elIdx, elIdx + 1, pageIdx);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white"
                        title="Move block down"
                      >
                        <ArrowDown className="w-2.5 h-2.5" />
                      </button>
                    )}

                    {/* Duplicate */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateElement(element.id, pageIdx);
                      }}
                      className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white"
                      title="Duplicate block"
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteElement(element.id, pageIdx);
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
                      title="Delete block"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Inline Content Editor or Renderer */}
                  {isEditing ? (
                    <div className="w-full bg-white p-2 border border-indigo-400 rounded shadow-xs">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={3}
                        className="w-full text-xs font-sans text-zinc-900 border-none outline-none resize-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          onClick={() => setEditingElementId(null)}
                          className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (typeof element.content === "string") {
                              onUpdateElementContent(element.id, editingContent, pageIdx);
                            } else if (element.content && typeof element.content === "object") {
                              if ("title" in element.content) {
                                onUpdateElementContent(
                                  element.id,
                                  { ...element.content, title: editingContent },
                                  pageIdx
                                );
                              } else if ("text" in element.content) {
                                onUpdateElementContent(
                                  element.id,
                                  { ...element.content, text: editingContent },
                                  pageIdx
                                );
                              }
                            }
                            setEditingElementId(null);
                          }}
                          className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ElementRenderer
                      element={element}
                      dpi={DPI}
                      isSelected={isSelected}
                      isBlackAndWhite={isBlackAndWhite}
                    />
                  )}
                </div>
              );
            })}

            {/* Quick Add Block Button at bottom of page flow */}
            <div className="mt-2 flex items-center justify-center relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuickAddMenuPageIdx(quickAddMenuPageIdx === pageIdx ? null : pageIdx);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-zinc-300 hover:border-indigo-500 bg-zinc-50 hover:bg-indigo-50/40 text-zinc-500 hover:text-indigo-600 text-xs transition-all select-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert Content Block</span>
              </button>

              {/* Quick Add Dropdown Menu */}
              {quickAddMenuPageIdx === pageIdx && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-10 z-50 w-72 bg-[#161822] text-white border border-white/10 rounded-xl p-3 shadow-2xl animate-in fade-in-50 zoom-in-95"
                >
                  <div className="text-[10px] font-mono uppercase text-zinc-400 mb-2">
                    Document Blocks
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    <button
                      onClick={() => {
                        onAddBlock("heading", pageIdx);
                        setQuickAddMenuPageIdx(null);
                      }}
                      className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                    >
                      <FileText className="w-3 h-3 text-indigo-400" />
                      <span>Heading</span>
                    </button>
                    <button
                      onClick={() => {
                        onAddBlock("text", pageIdx);
                        setQuickAddMenuPageIdx(null);
                      }}
                      className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                    >
                      <AlignLeft className="w-3 h-3 text-zinc-400" />
                      <span>Paragraph</span>
                    </button>
                    <button
                      onClick={() => {
                        onAddBlock("table", pageIdx);
                        setQuickAddMenuPageIdx(null);
                      }}
                      className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                    >
                      <span className="text-[11px] font-mono text-emerald-400">田</span>
                      <span>Table</span>
                    </button>
                    <button
                      onClick={() => {
                        onAddBlock("callout", pageIdx);
                        setQuickAddMenuPageIdx(null);
                      }}
                      className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Callout Box</span>
                    </button>
                  </div>

                  <div className="text-[10px] font-mono uppercase text-zinc-400 mb-2">
                    Visual Blocks
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        onAddBlock("chart", pageIdx);
                        setQuickAddMenuPageIdx(null);
                      }}
                      className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                    >
                      <span className="text-[11px] font-mono text-cyan-400">📊</span>
                      <span>Chart</span>
                    </button>
                    <button
                      onClick={() => {
                        onAddBlock("formula", pageIdx);
                        setQuickAddMenuPageIdx(null);
                      }}
                      className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                    >
                      <span className="text-[11px] font-mono text-purple-400">∑</span>
                      <span>Formula</span>
                    </button>
                    <button
                      onClick={() => {
                        onAddBlock("checkboxGroup", pageIdx);
                        setQuickAddMenuPageIdx(null);
                      }}
                      className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3 text-rose-400" />
                      <span>Checklist</span>
                    </button>
                    <button
                      onClick={() => {
                        onAddBlock("writingLines", pageIdx);
                        setQuickAddMenuPageIdx(null);
                      }}
                      className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                    >
                      <span className="text-[11px] font-mono text-zinc-400">✍️</span>
                      <span>Worksheet</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. FREEFORM CANVAS LAYER (Visual design blocks positioned freely) */}
          {canvasElements.map((element) => {
            const isSelected = selectedElementId === element.id;
            const xPx = inchesToPx(element.x || PAGE_MARGIN_IN);
            const yPx = inchesToPx(element.y || PAGE_MARGIN_IN);
            const wPx = inchesToPx(element.width || 3.5);
            const hPx = inchesToPx(element.height || 2.0);

            return (
              <div
                key={element.id}
                onMouseDown={(e) => handleStartDrag(e, element, pageIdx)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(element.id);
                  onSelectPageIndex(pageIdx);
                }}
                className={`absolute group/canvas rounded-xl transition-shadow cursor-grab active:cursor-grabbing ${
                  isSelected
                    ? "ring-2 ring-indigo-600 shadow-xl z-20"
                    : "hover:ring-1 hover:ring-indigo-400/80 shadow-md z-10"
                }`}
                style={{
                  left: `${xPx}px`,
                  top: `${yPx}px`,
                  width: `${wPx}px`,
                  height: `${hPx}px`,
                }}
              >
                {/* Element Badge & Snap to Flow Button */}
                <div
                  className={`absolute -top-7 left-1 z-30 flex items-center gap-1 bg-[#161822] text-white px-2 py-1 rounded-md shadow-lg border border-white/10 transition-opacity text-[10px] ${
                    isSelected ? "opacity-100" : "opacity-0 group-hover/canvas:opacity-100"
                  }`}
                >
                  <span className="font-mono text-indigo-300 uppercase text-[9px] pr-1 border-r border-white/10">
                    {element.type}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLayoutMode(element, pageIdx);
                    }}
                    className="px-1.5 py-0.5 rounded hover:bg-white/10 text-zinc-300 hover:text-white transition-colors flex items-center gap-1"
                    title="Snap back into document flow"
                  >
                    <FileText className="w-2.5 h-2.5" />
                    <span>Snap to Flow</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateElement(element.id, pageIdx);
                    }}
                    className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white"
                    title="Duplicate element"
                  >
                    <Copy className="w-2.5 h-2.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteElement(element.id, pageIdx);
                    }}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
                    title="Delete element"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Render the inner block */}
                <div className="w-full h-full p-2 overflow-hidden bg-white/95 rounded-xl border border-zinc-200">
                  <ElementRenderer
                    element={element}
                    dpi={DPI}
                    isSelected={isSelected}
                    isBlackAndWhite={isBlackAndWhite}
                  />
                </div>

                {/* Resize Handles (When selected) */}
                {isSelected && (
                  <>
                    {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as ResizeHandle[]).map(
                      (handle) => {
                        let positionClasses = "";
                        switch (handle) {
                          case "nw":
                            positionClasses = "-top-1.5 -left-1.5 cursor-nwse-resize";
                            break;
                          case "n":
                            positionClasses = "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize";
                            break;
                          case "ne":
                            positionClasses = "-top-1.5 -right-1.5 cursor-nesw-resize";
                            break;
                          case "e":
                            positionClasses = "top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize";
                            break;
                          case "se":
                            positionClasses = "-bottom-1.5 -right-1.5 cursor-nwse-resize";
                            break;
                          case "s":
                            positionClasses = "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize";
                            break;
                          case "sw":
                            positionClasses = "-bottom-1.5 -left-1.5 cursor-nesw-resize";
                            break;
                          case "w":
                            positionClasses = "top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize";
                            break;
                        }

                        return (
                          <div
                            key={handle}
                            onMouseDown={(e) => handleStartResize(e, handle, element, pageIdx)}
                            className={`absolute w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs shadow-xs z-30 ${positionClasses}`}
                          />
                        );
                      }
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* 3. OVERFLOW DETECTION BANNER (If content exceeds page boundary) */}
          {flowLayout.isOverflowing && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 bg-amber-500/95 text-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-medium backdrop-blur-md">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Page boundary reached</span>
              <button
                onClick={handleAutoPaginate}
                className="px-2 py-0.5 rounded-full bg-white text-zinc-900 text-[11px] font-semibold hover:bg-zinc-100 transition-colors"
              >
                Auto-Paginate
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#14151b] text-zinc-100 flex flex-col h-full overflow-hidden relative select-none"
    >
      {/* Precision Google Docs-Style Inch Ruler along the Top */}
      <div className="h-6 bg-[#0f1015] border-b border-white/[0.08] flex items-center justify-center text-[10px] font-mono text-zinc-500 shrink-0 px-4 select-none relative overflow-hidden">
        <div
          className="relative h-full flex items-center"
          style={{ width: `${PAGE_WIDTH * zoom}px` }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-zinc-700 flex flex-col justify-between"
              style={{ left: `${(i / 8.5) * 100}%` }}
            >
              <span className="text-[9px] pl-1 font-semibold text-zinc-400">{i}"</span>
              <div className="h-1.5 w-px bg-zinc-600" />
            </div>
          ))}

          {/* 0.65" Margin Marker on Ruler */}
          <div
            className="absolute top-0 bottom-0 border-l border-sky-400 z-10"
            style={{ left: `${(PAGE_MARGIN_IN / PAGE_WIDTH_IN) * 100}%` }}
            title="0.65 inch Left Margin"
          >
            <div className="w-2 h-2 -ml-1 bg-sky-400 rotate-45" />
          </div>

          <div
            className="absolute top-0 bottom-0 border-l border-sky-400 z-10"
            style={{ left: `${((PAGE_WIDTH_IN - PAGE_MARGIN_IN) / PAGE_WIDTH_IN) * 100}%` }}
            title="0.65 inch Right Margin"
          >
            <div className="w-2 h-2 -ml-1 bg-sky-400 rotate-45" />
          </div>

          {/* Active Cursor Tracking Marker on Ruler */}
          <div
            className="absolute top-0 bottom-0 border-l border-indigo-400 z-20 pointer-events-none"
            style={{ left: `${(mouseInchPos.x / PAGE_WIDTH_IN) * 100}%` }}
          />
        </div>
      </div>

      {/* Floating Canvas Quick Controls Bar (Zoom, View Mode, Margins, Paginate) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#161822]/90 border border-white/10 rounded-full px-4 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs text-zinc-300">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateZoom(Math.max(0.4, zoom - 0.1))}
            className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[11px] w-12 text-center text-zinc-200">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => onUpdateZoom(Math.min(1.6, zoom + 0.1))}
            className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Zoom Preset Selector */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateZoom(0.5)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              Math.abs(zoom - 0.5) < 0.05
                ? "bg-indigo-600 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            50%
          </button>
          <button
            onClick={() => onUpdateZoom(0.75)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              Math.abs(zoom - 0.75) < 0.05
                ? "bg-indigo-600 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            75%
          </button>
          <button
            onClick={() => onUpdateZoom(1.0)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              Math.abs(zoom - 1.0) < 0.05
                ? "bg-indigo-600 text-white font-semibold"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            100%
          </button>
          <button
            onClick={() => {
              if (containerRef.current) {
                const availableW = containerRef.current.clientWidth - 80;
                onUpdateZoom(Math.max(0.4, Math.min(1.5, availableW / PAGE_WIDTH)));
              }
            }}
            className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-white/5"
            title="Fit Width"
          >
            Fit Width
          </button>
          <button
            onClick={() => {
              if (containerRef.current) {
                const availableH = containerRef.current.clientHeight - 120;
                onUpdateZoom(Math.max(0.4, Math.min(1.2, availableH / PAGE_HEIGHT)));
              }
            }}
            className="px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-white/5"
            title="Fit Page"
          >
            Fit Page
          </button>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* View Mode Toggle: Stacked vs Single */}
        <button
          onClick={onToggleViewMode}
          className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] font-medium transition-colors flex items-center gap-1.5"
          title={viewMode === "stacked" ? "Switch to single page view" : "Switch to continuous stacked view"}
        >
          <Layers className="w-3 h-3 text-indigo-400" />
          <span>{viewMode === "stacked" ? "Stacked" : "Single Page"}</span>
        </button>

        {/* Margins Toggle */}
        {onToggleMargins && (
          <button
            onClick={onToggleMargins}
            className={`px-2 py-1 rounded-full text-[11px] transition-colors ${
              showMargins ? "text-sky-400 bg-sky-400/10" : "text-zinc-400 hover:text-white"
            }`}
            title="Toggle 0.65 in print margins"
          >
            Margins
          </button>
        )}

        {/* Auto-Paginate Button */}
        <button
          onClick={handleAutoPaginate}
          className="px-2.5 py-1 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white text-[11px] font-medium transition-all shadow-xs flex items-center gap-1"
          title="Recalculate pagination and fix overflows"
        >
          <Scissors className="w-3 h-3" />
          <span>Paginate</span>
        </button>
      </div>

      {/* Main Scrollable Workspace Container */}
      <div
        className="flex-1 overflow-auto p-8 flex flex-col items-center justify-start scrollbar-thin scrollbar-thumb-white/10"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectElement(null);
            setEditingElementId(null);
            setQuickAddMenuPageIdx(null);
          }
        }}
      >
        {/* Scaled Page Container */}
        <div
          className="transition-transform origin-top flex flex-col items-center"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
        >
          {viewMode === "stacked" ? (
            pages.map((page, idx) => renderPage(page, idx))
          ) : (
            renderPage(pages[activePageIndex] || pages[0], activePageIndex)
          )}
        </div>
      </div>
    </div>
  );
};
