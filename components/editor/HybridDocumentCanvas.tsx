"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { DocumentModel, DocumentElement, DocumentMode, PageData, PageLayoutType } from "@/types/document";
import { ElementRenderer } from "./ElementRenderer";
import {
  PAGE_WIDTH_IN,
  PAGE_HEIGHT_IN,
  PAGE_MARGIN_IN,
  DPI,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_MARGIN,
  inchesToPx,
  pxToInches,
  clampPosition,
  clampDimensions,
  AlignmentGuide,
  computeSnapAndGuides,
  computeResizeSnapAndGuides,
} from "@/lib/coordinates";
import {
  autoPaginateDocument,
  computePageFlowLayout,
  turnPageIntoVisual,
  turnPageIntoDocumentFlow,
} from "@/lib/layout-engine";
import {
  Plus,
  Move,
  LayoutTemplate,
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
  Scissors,
  Table as TableIcon,
  Sparkles,
  BarChart3,
  Sigma,
  CheckSquare,
  PenLine,
  Image as ImageIcon,
  Grid,
  Ruler,
  Magnet,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Sliders,
  Mic,
  MessageSquare,
  GraduationCap,
  FileSpreadsheet,
  BookOpen,
  ChevronUp,
  Bookmark,
} from "lucide-react";
import {
  GoogleWorkspaceTopRuler,
  GoogleWorkspaceVerticalRuler,
} from "./GoogleWorkspaceRuler";

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
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const [quickAddMenuPageIdx, setQuickAddMenuPageIdx] = useState<number | null>(null);

  // Google Slides & Google Docs Engineering States
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  const [gridStep, setGridStep] = useState(0.125); // 1/8 inch
  const [snapToGuidesEnabled, setSnapToGuidesEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [isSnapMenuOpen, setIsSnapMenuOpen] = useState(false);
  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);
  const [dragHUD, setDragHUD] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    snapLabel?: string;
  } | null>(null);
  const [cursorPosIn, setCursorPosIn] = useState<{ xIn: number; yIn: number } | null>(null);

  const isPresentation = documentMode === "presentation";

  // Widescreen dimensions (16:9 ratio) vs Standard 8.5x11
  const activePageWidthIn = isPresentation ? 13.33 : PAGE_WIDTH_IN;
  const activePageHeightIn = isPresentation ? 7.5 : PAGE_HEIGHT_IN;
  const activePageWidthPx = inchesToPx(activePageWidthIn);
  const activePageHeightPx = inchesToPx(activePageHeightIn);

  // Normalize pages
  const pages: PageData[] =
    doc.pages && doc.pages.length > 0
      ? doc.pages
      : [
          {
            id: "page-1",
            title: doc.title || "Slide 1",
            elements: doc.elements || [],
          },
        ];

  // Currently active selected element object
  const currentElements = pages[activePageIndex]?.elements || pages[0]?.elements || [];
  const selectedElement = currentElements.find((el) => el.id === selectedElementId) || null;

  // Selected element bounding box in inches for rulers
  const selectedElementBounds = selectedElement
    ? {
        x: selectedElement.x || PAGE_MARGIN_IN,
        y: selectedElement.y || PAGE_MARGIN_IN,
        width: selectedElement.width || 4.0,
        height: selectedElement.height || 2.0,
      }
    : null;

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

  // Resizing state for freeform or flow blocks
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

  // Global Image Paste Handler on Canvas
  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                const newImgElement: DocumentElement = {
                  id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  type: "image",
                  layoutMode: "flow",
                  x: PAGE_MARGIN_IN,
                  y: 1.0,
                  width: isPresentation ? 6.0 : 5.0,
                  height: isPresentation ? 3.5 : 3.0,
                  zIndex: 1,
                  content: {
                    url: dataUrl,
                    caption: file.name ? file.name.replace(/\.[^/.]+$/, "") : "Pasted Visual",
                    tag: "IMAGE",
                  },
                  style: {
                    backgroundColor: "#f4f4f5",
                    borderRadius: 12,
                  },
                };
                const updatedPages = [...pages];
                const currentPage = updatedPages[activePageIndex] || updatedPages[0];
                const updatedElements = [...(currentPage.elements || []), newImgElement];
                updatedPages[activePageIndex] = {
                  ...currentPage,
                  elements: updatedElements,
                };
                onApplyDocumentUpdate({
                  ...doc,
                  pages: updatedPages,
                  elements: updatedPages[0]?.elements || [],
                });
                onSelectElement(newImgElement.id);
              }
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    },
    [activePageIndex, doc, isPresentation, onApplyDocumentUpdate, onSelectElement, pages]
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  // Keyboard Nudge & Alignment Navigation (Google Slides / Docs style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently editing text in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea" || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (!selectedElementId || !selectedElement) return;

      const pageIdx = activePageIndex;
      const currentX = selectedElement.x || PAGE_MARGIN_IN;
      const currentY = selectedElement.y || PAGE_MARGIN_IN;
      const currentW = selectedElement.width || 4.0;
      const currentH = selectedElement.height || 2.0;

      // Nudge step: 0.02" standard (~2px), Shift: 0.125" (1/8 inch snap)
      const step = e.shiftKey ? gridStep : 0.02;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const newX = Math.max(0, currentX - step);
        onUpdateElementPosition(selectedElementId, Math.round(newX * 1000) / 1000, currentY, pageIdx);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const newX = Math.min(activePageWidthIn - currentW, currentX + step);
        onUpdateElementPosition(selectedElementId, Math.round(newX * 1000) / 1000, currentY, pageIdx);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const newY = Math.max(0, currentY - step);
        onUpdateElementPosition(selectedElementId, currentX, Math.round(newY * 1000) / 1000, pageIdx);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const newY = Math.min(activePageHeightIn - currentH, currentY + step);
        onUpdateElementPosition(selectedElementId, currentX, Math.round(newY * 1000) / 1000, pageIdx);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (!editingElementId) {
          e.preventDefault();
          onDeleteElement(selectedElementId, pageIdx);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activePageIndex,
    activePageHeightIn,
    activePageWidthIn,
    editingElementId,
    gridStep,
    onDeleteElement,
    onUpdateElementPosition,
    selectedElement,
    selectedElementId,
  ]);

  // Switch element layout mode between Flow (stacked) and Canvas (Freeform)
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
        width: activePageWidthIn - PAGE_MARGIN_IN * 2,
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
        y: element.y || 1.8,
        width: Math.min(element.width || 4.5, activePageWidthIn - PAGE_MARGIN_IN * 2),
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

  // Helper to update element content & metadata directly
  const handleElementContentUpdate = (
    elemId: string,
    pageIndex: number,
    newContent: any,
    newMetadata?: any
  ) => {
    const updatedPages = [...pages];
    const page = updatedPages[pageIndex] || updatedPages[0];
    if (!page || !page.elements) return;

    const elemIndex = page.elements.findIndex((e) => e.id === elemId);
    if (elemIndex === -1) return;

    const currentElem = page.elements[elemIndex];
    const updatedElem: DocumentElement = {
      ...currentElem,
      content: newContent,
      metadata: newMetadata ? { ...currentElem.metadata, ...newMetadata } : currentElem.metadata,
    };

    page.elements = [
      ...page.elements.slice(0, elemIndex),
      updatedElem,
      ...page.elements.slice(elemIndex + 1),
    ];

    updatedPages[pageIndex] = page;
    onApplyDocumentUpdate({
      ...doc,
      pages: updatedPages,
      elements: updatedPages[0]?.elements || [],
    });
  };

  // Google Slides Alignment Helpers
  const handleAlignElement = (type: "left" | "center-h" | "right" | "top" | "center-v" | "bottom") => {
    if (!selectedElementId || !selectedElement) return;
    const w = selectedElement.width || 4.0;
    const h = selectedElement.height || 2.0;
    let x = selectedElement.x || PAGE_MARGIN_IN;
    let y = selectedElement.y || PAGE_MARGIN_IN;

    switch (type) {
      case "left":
        x = PAGE_MARGIN_IN;
        break;
      case "center-h":
        x = (activePageWidthIn - w) / 2;
        break;
      case "right":
        x = activePageWidthIn - PAGE_MARGIN_IN - w;
        break;
      case "top":
        y = PAGE_MARGIN_IN;
        break;
      case "center-v":
        y = (activePageHeightIn - h) / 2;
        break;
      case "bottom":
        y = activePageHeightIn - PAGE_MARGIN_IN - h;
        break;
    }

    onUpdateElementPosition(selectedElementId, Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000, activePageIndex);
  };

  // Run auto pagination on overflow
  const handleAutoPaginate = () => {
    const paginated = autoPaginateDocument(doc);
    onApplyDocumentUpdate(paginated);
  };

  // Drag handler for freeform canvas elements with Magnetic Snap & Smart Guidelines
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

    const targetPage = pages[pageIndex] || pages[0];
    const otherElements = (targetPage.elements || []).filter((el) => el.id !== element.id && el.layoutMode === "canvas").map((el) => ({
      id: el.id,
      x: el.x || PAGE_MARGIN_IN,
      y: el.y || PAGE_MARGIN_IN,
      width: el.width || 3.5,
      height: el.height || 2.0,
    }));

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current) return;
      const dxPx = (moveEvent.clientX - dragRef.current.startX) / zoom;
      const dyPx = (moveEvent.clientY - dragRef.current.startY) / zoom;
      const dxIn = pxToInches(dxPx);
      const dyIn = pxToInches(dyPx);

      const rawTargetX = dragRef.current.initialElemX + dxIn;
      const rawTargetY = dragRef.current.initialElemY + dyIn;

      // Smart Snap Calculation (Google Slides style)
      const snapResult = computeSnapAndGuides(
        {
          id: dragRef.current.id,
          x: rawTargetX,
          y: rawTargetY,
          width: dragRef.current.width,
          height: dragRef.current.height,
        },
        otherElements,
        {
          snapToGrid: snapToGridEnabled,
          gridStep,
          snapToGuides: snapToGuidesEnabled,
          thresholdInches: 0.10,
          pageWidth: activePageWidthIn,
          pageHeight: activePageHeightIn,
          safeMargin: PAGE_MARGIN_IN,
          isAltPressed: moveEvent.altKey, // Alt key bypasses snap
        }
      );

      setActiveGuides(snapResult.guides);
      setDragHUD({
        x: snapResult.x,
        y: snapResult.y,
        width: dragRef.current.width,
        height: dragRef.current.height,
        snapLabel: snapResult.guides[0]?.label,
      });

      onUpdateElementPosition(
        dragRef.current.id,
        snapResult.x,
        snapResult.y,
        dragRef.current.pageIndex
      );
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setActiveGuides([]);
      setDragHUD(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Resize handler with 8-point magnetic snapping
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
      initW: element.width || 4.0,
      initH: element.height || 2.0,
    };

    const targetPage = pages[pageIndex] || pages[0];
    const otherElements = (targetPage.elements || []).filter((el) => el.id !== element.id && el.layoutMode === "canvas").map((el) => ({
      id: el.id,
      x: el.x || PAGE_MARGIN_IN,
      y: el.y || PAGE_MARGIN_IN,
      width: el.width || 3.5,
      height: el.height || 2.0,
    }));

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

      // Compute smart resize snap
      const snapRes = computeResizeSnapAndGuides(
        {
          id: resizeRef.current.id,
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        },
        handle,
        otherElements,
        {
          snapToGrid: snapToGridEnabled,
          gridStep,
          snapToGuides: snapToGuidesEnabled,
          thresholdInches: 0.10,
          pageWidth: activePageWidthIn,
          pageHeight: activePageHeightIn,
          safeMargin: PAGE_MARGIN_IN,
          isAltPressed: moveEvent.altKey,
        }
      );

      setActiveGuides(snapRes.guides);
      setDragHUD({
        x: snapRes.x,
        y: snapRes.y,
        width: snapRes.width,
        height: snapRes.height,
        snapLabel: snapRes.guides[0]?.label,
      });

      onUpdateElementDimensions(
        resizeRef.current.id,
        snapRes.width,
        snapRes.height,
        snapRes.x,
        snapRes.y,
        resizeRef.current.pageIndex
      );
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
      setActiveGuides([]);
      setDragHUD(null);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Render a single Page / Slide Sheet
  const renderPage = (page: PageData, pageIdx: number) => {
    const isActive = pageIdx === activePageIndex;
    const elements = page.elements || [];

    const isPage16x9 = documentMode === "presentation" || page.layoutType === "presentation";
    const pageWidthIn = isPage16x9 ? 13.33 : PAGE_WIDTH_IN;
    const pageHeightIn = isPage16x9 ? 7.5 : PAGE_HEIGHT_IN;
    const pageWidthPx = inchesToPx(pageWidthIn);
    const pageHeightPx = inchesToPx(pageHeightIn);

    const flowElements = elements.filter((el) => el.layoutMode !== "canvas");
    const canvasElements = elements.filter((el) => el.layoutMode === "canvas");
    const flowLayout = computePageFlowLayout(page);

    const currentLayoutType: PageLayoutType =
      page.layoutType ||
      (documentMode === "presentation" ? "presentation" : canvasElements.length > flowElements.length ? "visual" : "flow");

    return (
      <div
        key={page.id || `page-${pageIdx}`}
        id={`page-container-${pageIdx}`}
        onClick={() => onSelectPageIndex(pageIdx)}
        className="flex flex-col items-center group/page relative mb-12 last:mb-6"
      >
        {/* Page Top Header Bar - Minimal & Clean */}
        <div
          className="flex items-center justify-between pb-2 text-[11px] font-mono text-zinc-400 select-none"
          style={{ width: `${pageWidthPx}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">
              {page.title || (isPage16x9 ? `Slide ${pageIdx + 1}` : `Page ${pageIdx + 1}`)}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-indigo-400 font-sans text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 capitalize">
              {currentLayoutType} Layout
            </span>
            <span className="text-zinc-500 text-[10px]">
              {isPage16x9 ? "16:9 Widescreen" : "8.5 × 11 in"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 opacity-60 group-hover/page:opacity-100 transition-opacity">
            {/* Page Layout Mode Switcher */}
            <select
              value={currentLayoutType}
              onChange={(e) => {
                const targetLayout = e.target.value as PageLayoutType;
                const updated = [...pages];
                if (targetLayout === "visual") {
                  updated[pageIdx] = turnPageIntoVisual(page);
                } else if (targetLayout === "flow") {
                  updated[pageIdx] = turnPageIntoDocumentFlow(page);
                } else {
                  updated[pageIdx] = { ...page, layoutType: targetLayout };
                }
                onApplyDocumentUpdate({ ...doc, pages: updated });
              }}
              className="bg-[#141620] text-zinc-300 border border-white/[0.1] rounded px-2 py-0.5 text-[10px] font-sans outline-none hover:border-indigo-500 transition-colors"
            >
              <option value="flow">Document Flow</option>
              <option value="visual">Visual Grid</option>
              <option value="canvas">Freeform Canvas</option>
              <option value="presentation">16:9 Slide</option>
              <option value="worksheet">Worksheet</option>
              <option value="table">Data Matrix</option>
              <option value="report">Executive Report</option>
            </select>

            <span className="text-zinc-500 ml-1.5 text-[10px]">
              {pageIdx + 1}/{pages.length}
            </span>
          </div>
        </div>

        {/* Google Workspace Precision Horizontal Top Ruler (When enabled on active page) */}
        {showRulers && isActive && (
          <GoogleWorkspaceTopRuler
            pageWidthInches={pageWidthIn}
            safeMarginInches={PAGE_MARGIN_IN}
            zoom={1.0}
            selectedElementBounds={selectedElementBounds}
            cursorXIn={cursorPosIn?.xIn}
            onToggleMargins={onToggleMargins}
          />
        )}

        {/* Page Sheet Container with Relative Coordinates */}
        <div className="relative flex items-start justify-center">
          {/* Google Workspace Precision Vertical Left Ruler */}
          {showRulers && isActive && (
            <GoogleWorkspaceVerticalRuler
              pageHeightInches={pageHeightIn}
              safeMarginInches={PAGE_MARGIN_IN}
              zoom={1.0}
              selectedElementBounds={selectedElementBounds}
              cursorYIn={cursorPosIn?.yIn}
            />
          )}

          {/* The Page Sheet Canvas */}
          <div
            id={`studio-page-sheet-${pageIdx}`}
            className={`relative bg-white text-zinc-900 transition-shadow select-none overflow-hidden rounded-md ${
              isActive
                ? "shadow-[0_16px_50px_rgba(0,0,0,0.6)] ring-1 ring-indigo-500/60"
                : "shadow-[0_8px_30px_rgba(0,0,0,0.4)] ring-1 ring-white/10"
            }`}
            style={{
              width: `${pageWidthPx}px`,
              height: `${pageHeightPx}px`,
              backgroundColor: page.background || "#ffffff",
            }}
            onMouseMove={(e) => {
              if (isActive) {
                const rect = e.currentTarget.getBoundingClientRect();
                const xPx = (e.clientX - rect.left) / zoom;
                const yPx = (e.clientY - rect.top) / zoom;
                setCursorPosIn({
                  xIn: Math.round(pxToInches(xPx) * 100) / 100,
                  yIn: Math.round(pxToInches(yPx) * 100) / 100,
                });
              }
            }}
            onMouseLeave={() => setCursorPosIn(null)}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onSelectElement(null);
                setEditingElementId(null);
                setQuickAddMenuPageIdx(null);
              }
            }}
          >
            {/* 1. Google Slides / Docs Precision Dot Grid Overlay */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none z-5 opacity-40"
                style={{
                  backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
                  backgroundSize: `${inchesToPx(gridStep)}px ${inchesToPx(gridStep)}px`,
                }}
              />
            )}

            {/* 2. Margin Guidelines */}
            {showMargins && (
              <div
                className="absolute pointer-events-none border border-dashed border-indigo-400/30 z-10"
                style={{
                  top: `${PAGE_MARGIN}px`,
                  left: `${PAGE_MARGIN}px`,
                  right: `${PAGE_MARGIN}px`,
                  bottom: `${PAGE_MARGIN}px`,
                }}
              />
            )}

            {/* 3. Magnetic Smart Alignment Guidelines Overlay (During Drag / Resize) */}
            {isActive &&
              activeGuides.map((guide, gIdx) => {
                const isVertical = guide.type === "vertical";
                const posPx = inchesToPx(guide.position);
                const isCenter = guide.guideType === "center";
                const isMargin = guide.guideType === "margin";

                return (
                  <div
                    key={`guide-${gIdx}-${guide.type}-${guide.position}`}
                    className="absolute pointer-events-none z-40"
                    style={
                      isVertical
                        ? {
                            left: `${posPx}px`,
                            top: 0,
                            bottom: 0,
                            width: "1px",
                          }
                        : {
                            top: `${posPx}px`,
                            left: 0,
                            right: 0,
                            height: "1px",
                          }
                    }
                  >
                    {/* Glowing Guide Line */}
                    <div
                      className={`w-full h-full ${
                        isCenter
                          ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]"
                          : isMargin
                          ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.9)]"
                          : "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.9)]"
                      }`}
                    />
                    {/* Alignment Badge Indicator */}
                    <div
                      className={`absolute px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shadow-xl uppercase tracking-wider backdrop-blur-md pointer-events-none whitespace-nowrap ${
                        isCenter
                          ? "bg-cyan-600/95 ring-1 ring-cyan-300"
                          : isMargin
                          ? "bg-indigo-600/95 ring-1 ring-indigo-300"
                          : "bg-pink-600/95 ring-1 ring-pink-300"
                      } ${
                        isVertical
                          ? "-top-5 left-1/2 -translate-x-1/2"
                          : "-left-1 top-1/2 -translate-y-1/2"
                      }`}
                    >
                      {guide.label || `${guide.position.toFixed(2)}"`}
                    </div>
                  </div>
                );
              })}

            {/* 4. DOCUMENT FLOW LAYER */}
            <div
              className="w-full h-full flex flex-col pointer-events-auto overflow-y-auto"
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
                    className={`relative group/block rounded-xl transition-all mb-3 ${
                      isSelected
                        ? "ring-2 ring-indigo-600 bg-indigo-50/10 p-1"
                        : "hover:ring-1 hover:ring-zinc-300 p-1"
                    }`}
                    style={{
                      width: element.width ? `${inchesToPx(element.width)}px` : "100%",
                      maxWidth: "100%",
                      height: element.height ? `${inchesToPx(element.height)}px` : "auto",
                      minHeight: element.height ? `${inchesToPx(element.height)}px` : undefined,
                    }}
                  >
                    {/* Block Hover Action Bar */}
                    <div
                      className={`absolute -top-7 right-1 z-30 flex items-center gap-1 bg-[#14161f] text-white px-2 py-1 rounded-md shadow-lg border border-white/10 transition-opacity text-[10px] font-medium ${
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
                        className="p-1 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300"
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
                      <div className="w-full h-full relative">
                        <ElementRenderer
                          element={element}
                          dpi={DPI}
                          isSelected={isSelected}
                          isBlackAndWhite={isBlackAndWhite}
                          isPresentation={isPresentation}
                          onUpdateContent={(newContent, newMetadata) =>
                            handleElementContentUpdate(element.id, pageIdx, newContent, newMetadata)
                          }
                        />
                        {/* Flow Mode Resize Handle on Bottom Right */}
                        {isSelected && (
                          <div
                            onMouseDown={(e) => handleStartResize(e, "se", element, pageIdx)}
                            className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs shadow-xs cursor-nwse-resize z-30"
                            title="Drag to resize block"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Quick Add Block Button */}
              <div className="mt-3 flex items-center justify-center relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickAddMenuPageIdx(quickAddMenuPageIdx === pageIdx ? null : pageIdx);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-zinc-300 hover:border-indigo-500 bg-zinc-50 hover:bg-indigo-50/40 text-zinc-600 hover:text-indigo-600 text-xs transition-all select-none"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insert Content Block</span>
                </button>

                {/* Quick Add Dropdown Menu */}
                {quickAddMenuPageIdx === pageIdx && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-10 z-50 w-72 bg-[#14161f] text-white border border-white/10 rounded-xl p-3 shadow-2xl animate-in fade-in-50 zoom-in-95"
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
                        <TableIcon className="w-3 h-3 text-emerald-400" />
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
                          onAddBlock("image", pageIdx);
                          setQuickAddMenuPageIdx(null);
                        }}
                        className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-3 h-3 text-sky-400" />
                        <span>Image</span>
                      </button>
                      <button
                        onClick={() => {
                          onAddBlock("chart", pageIdx);
                          setQuickAddMenuPageIdx(null);
                        }}
                        className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                      >
                        <BarChart3 className="w-3 h-3 text-cyan-400" />
                        <span>Chart</span>
                      </button>
                      <button
                        onClick={() => {
                          onAddBlock("formula", pageIdx);
                          setQuickAddMenuPageIdx(null);
                        }}
                        className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                      >
                        <Sigma className="w-3 h-3 text-purple-400" />
                        <span>Formula</span>
                      </button>
                      <button
                        onClick={() => {
                          onAddBlock("checkboxGroup", pageIdx);
                          setQuickAddMenuPageIdx(null);
                        }}
                        className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-left text-xs flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-3 h-3 text-rose-400" />
                        <span>Checklist</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. FREEFORM CANVAS LAYER (Google Slides & Figma Engine) */}
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
                  {/* Real-time Measurement HUD Floating Pill (During Drag / Resize) */}
                  {isSelected && dragHUD && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-[#0d0f17]/95 border border-indigo-500/50 text-white px-2.5 py-1 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-[10px] font-mono whitespace-nowrap">
                      <span className="text-cyan-300">X: {dragHUD.x.toFixed(2)}"</span>
                      <span className="text-cyan-300">Y: {dragHUD.y.toFixed(2)}"</span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-indigo-300">W: {dragHUD.width.toFixed(2)}"</span>
                      <span className="text-indigo-300">H: {dragHUD.height.toFixed(2)}"</span>
                      {dragHUD.snapLabel && (
                        <span className="text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded font-semibold text-[9px]">
                          {dragHUD.snapLabel}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Element Action Bar & Alignment Tools (Google Slides toolbar) */}
                  <div
                    className={`absolute -top-7 left-1 z-30 flex items-center gap-1 bg-[#14161f] text-white px-2 py-1 rounded-md shadow-lg border border-white/10 transition-opacity text-[10px] ${
                      isSelected ? "opacity-100" : "opacity-0 group-hover/canvas:opacity-100"
                    }`}
                  >
                    <span className="font-mono text-indigo-300 uppercase text-[9px] pr-1 border-r border-white/10">
                      {element.type}
                    </span>

                    {/* Quick Align to Center */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAlignElement("center-h");
                      }}
                      className="p-1 rounded hover:bg-white/10 text-zinc-300 hover:text-white"
                      title="Center horizontally on slide"
                    >
                      <AlignCenter className="w-2.5 h-2.5" />
                    </button>

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
                      className="p-1 rounded hover:bg-rose-500/20 text-rose-400 hover:text-rose-300"
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
                      isPresentation={isPresentation}
                      onUpdateContent={(newContent, newMetadata) =>
                        handleElementContentUpdate(element.id, pageIdx, newContent, newMetadata)
                      }
                    />
                  </div>

                  {/* 8-Point Resize Handles (When selected) */}
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
                              className={`absolute w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-xs shadow-xs z-30 ${positionClasses}`}
                            />
                          );
                        }
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Running Document Header (Google Docs style) */}
            {page.headerText && (
              <div
                className="absolute top-2 left-8 right-8 text-[10px] text-zinc-400 font-mono border-b border-zinc-200/60 pb-1 flex items-center justify-between pointer-events-none"
              >
                <span>{page.headerText}</span>
                <span>{doc.title || ""}</span>
              </div>
            )}

            {/* Running Document Footer & Page Number */}
            <div
              className="absolute bottom-2 left-8 right-8 text-[10px] text-zinc-400 font-mono border-t border-zinc-200/60 pt-1 flex items-center justify-between pointer-events-none"
            >
              <span>{page.footerText || "Confidential & Proprietary"}</span>
              <span>Page {page.pageNumber || pageIdx + 1} of {pages.length}</span>
            </div>

            {/* OVERFLOW DETECTION BANNER */}
            {flowLayout.isOverflowing && !isPresentation && (
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

        {/* Google Slides / PowerPoint Speaker Notes Drawer */}
        {(isPage16x9 || page.speakerNotes) && (
          <div
            className="mt-2.5 rounded-xl bg-[#12141d] border border-white/[0.08] p-3 text-left transition-all"
            style={{ width: `${pageWidthPx}px` }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-medium">
                <Mic className="w-3.5 h-3.5" />
                <span>Speaker Notes & Key Talking Points</span>
              </div>
              <span className="text-[10px] text-zinc-500">
                Visible during presentation mode
              </span>
            </div>
            <textarea
              rows={2}
              value={page.speakerNotes || ""}
              onChange={(e) => {
                const updated = [...pages];
                updated[pageIdx] = { ...page, speakerNotes: e.target.value };
                onApplyDocumentUpdate({ ...doc, pages: updated });
              }}
              placeholder="Click to add speaker notes or key talking points for this slide/page..."
              className="w-full bg-black/40 text-xs text-zinc-200 placeholder:text-zinc-500 rounded-lg p-2 outline-none border border-white/[0.06] focus:border-indigo-500/50 resize-none font-sans leading-relaxed"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#0e1017] text-zinc-100 flex flex-col h-full overflow-hidden relative select-none"
    >
      {/* Floating Canvas Controls Bar (Docked at Bottom Center - Google Workspace Toolbar) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#14161f]/95 border border-white/10 rounded-full px-4 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs text-zinc-300">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateZoom(Math.max(0.4, zoom - 0.1))}
            className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[11px] w-12 text-center text-zinc-200">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => onUpdateZoom(Math.min(1.6, zoom + 0.1))}
            className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Snap & Guidelines Menu Popover (Google Slides / Figma style) */}
        <div className="relative">
          <button
            onClick={() => setIsSnapMenuOpen(!isSnapMenuOpen)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
              snapToGridEnabled || snapToGuidesEnabled
                ? "bg-indigo-600/25 text-indigo-300 border border-indigo-500/40"
                : "bg-white/5 hover:bg-white/10 text-zinc-400"
            }`}
            title="Snap to Grid and Alignment Settings"
          >
            <Magnet className="w-3 h-3 text-indigo-400" />
            <span>Snap</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {isSnapMenuOpen && (
            <div
              className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 bg-[#14161f] border border-white/15 rounded-xl p-3 shadow-2xl z-50 text-xs text-left animate-in fade-in-50 zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                <span className="font-semibold text-white">Snap & Guidelines</span>
                <span className="text-[10px] text-indigo-400 font-mono">Google Slides Eng</span>
              </div>

              {/* Snap to Guides Toggle */}
              <label className="flex items-center justify-between py-1.5 cursor-pointer group">
                <span className="text-zinc-300 group-hover:text-white">Smart Alignment Guides</span>
                <input
                  type="checkbox"
                  checked={snapToGuidesEnabled}
                  onChange={(e) => setSnapToGuidesEnabled(e.target.checked)}
                  className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
              </label>

              {/* Snap to Grid Toggle */}
              <label className="flex items-center justify-between py-1.5 cursor-pointer group">
                <span className="text-zinc-300 group-hover:text-white">Snap to Grid</span>
                <input
                  type="checkbox"
                  checked={snapToGridEnabled}
                  onChange={(e) => setSnapToGridEnabled(e.target.checked)}
                  className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
              </label>

              {/* Grid Step Selector */}
              {snapToGridEnabled && (
                <div className="flex items-center justify-between py-1.5 pl-3 border-l-2 border-indigo-500/40 my-1">
                  <span className="text-zinc-400 text-[11px]">Grid Step</span>
                  <div className="flex items-center gap-1">
                    {[
                      { step: 0.125, label: "1/8\"" },
                      { step: 0.25, label: "1/4\"" },
                      { step: 0.5, label: "1/2\"" },
                    ].map((item) => (
                      <button
                        key={item.step}
                        onClick={() => setGridStep(item.step)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          gridStep === item.step
                            ? "bg-indigo-600 text-white font-bold"
                            : "bg-white/5 hover:bg-white/10 text-zinc-400"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Grid Mesh Toggle */}
              <label className="flex items-center justify-between py-1.5 cursor-pointer group border-t border-white/10 mt-1 pt-2">
                <span className="text-zinc-300 group-hover:text-white">Show Dot Grid</span>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
              </label>

              {/* Show Rulers Toggle */}
              <label className="flex items-center justify-between py-1.5 cursor-pointer group">
                <span className="text-zinc-300 group-hover:text-white">Show Dual Rulers</span>
                <input
                  type="checkbox"
                  checked={showRulers}
                  onChange={(e) => setShowRulers(e.target.checked)}
                  className="rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                />
              </label>

              <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-zinc-400 leading-tight">
                Tip: Hold <span className="text-white font-mono">Alt</span> while dragging to temporarily bypass all snap magnetic guides.
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle: Stacked vs Single */}
        <button
          onClick={onToggleViewMode}
          className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[11px] font-medium transition-colors flex items-center gap-1.5"
          title={viewMode === "stacked" ? "Switch to single view" : "Switch to continuous stacked view"}
        >
          <Layers className="w-3 h-3 text-indigo-400" />
          <span>{viewMode === "stacked" ? "Stacked" : "Single"}</span>
        </button>

        {/* Grid Toggle Quick Button */}
        <button
          onClick={() => setShowGrid((prev) => !prev)}
          className={`p-1.5 rounded-full transition-colors ${
            showGrid ? "text-indigo-300 bg-indigo-500/20" : "text-zinc-400 hover:text-white"
          }`}
          title="Toggle Grid Overlay"
        >
          <Grid className="w-3.5 h-3.5" />
        </button>

        {/* Rulers Toggle Quick Button */}
        <button
          onClick={() => setShowRulers((prev) => !prev)}
          className={`p-1.5 rounded-full transition-colors ${
            showRulers ? "text-indigo-300 bg-indigo-500/20" : "text-zinc-400 hover:text-white"
          }`}
          title="Toggle Rulers"
        >
          <Ruler className="w-3.5 h-3.5" />
        </button>

        {/* Margins Toggle */}
        {onToggleMargins && (
          <button
            onClick={onToggleMargins}
            className={`px-2 py-1 rounded-full text-[11px] transition-colors ${
              showMargins ? "text-indigo-400 bg-indigo-400/15" : "text-zinc-400 hover:text-white"
            }`}
            title="Toggle print margins"
          >
            Margins
          </button>
        )}

        {/* Auto-Paginate Button */}
        {!isPresentation && (
          <button
            onClick={handleAutoPaginate}
            className="px-2.5 py-1 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-all shadow-xs flex items-center gap-1"
            title="Recalculate pagination"
          >
            <Scissors className="w-3 h-3" />
            <span>Paginate</span>
          </button>
        )}
      </div>

      {/* Main Scrollable Workspace Container */}
      <div
        className="flex-1 overflow-auto p-6 sm:p-10 flex flex-col items-center justify-start scrollbar-thin scrollbar-thumb-white/10"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectElement(null);
            setEditingElementId(null);
            setQuickAddMenuPageIdx(null);
            setIsSnapMenuOpen(false);
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

