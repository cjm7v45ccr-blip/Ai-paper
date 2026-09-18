"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { DocumentModel, DocumentElement, DocumentMode, PageData } from "@/types/document";
import { ElementRenderer } from "./ElementRenderer";
import {
  DPI,
  PAGE_WIDTH_INCHES,
  PAGE_HEIGHT_INCHES,
  SAFE_MARGIN_INCHES,
  MIN_ELEMENT_WIDTH,
  MIN_ELEMENT_HEIGHT,
  inchesToPx,
  clampPosition,
  clampDimensions,
  computeSnapAndGuides,
  AlignmentGuide,
} from "@/lib/coordinates";
import {
  RotateCw,
  Lock,
  Copy,
  Trash2,
  AlignCenterHorizontal,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  Maximize,
} from "lucide-react";
import { StudioRuler } from "./StudioRuler";

interface DocumentCanvasProps {
  document: DocumentModel;
  documentMode: DocumentMode;
  activePageIndex: number;
  onSelectPageIndex: (index: number) => void;
  onAddPage: () => void;
  zoom: number;
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
  onUpdateElementRotation?: (id: string, rotation: number, pageIndex?: number) => void;
  onDeleteElement?: (id: string, pageIndex?: number) => void;
  onDuplicateElement?: (id: string, pageIndex?: number) => void;
  isBlackAndWhite: boolean;
  showMargins: boolean;
  onToggleMargins?: () => void;
  isPreviewMode?: boolean;
  isAnimating: boolean;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  document: doc,
  documentMode,
  activePageIndex,
  onSelectPageIndex,
  onAddPage,
  zoom,
  selectedElementId,
  onSelectElement,
  onUpdateElementPosition,
  onUpdateElementDimensions,
  onUpdateElementRotation,
  onDeleteElement,
  onDuplicateElement,
  isBlackAndWhite,
  showMargins,
  onToggleMargins,
  isPreviewMode = false,
  isAnimating,
}) => {
  const isPresentation = documentMode === "presentation";
  const pageWidth = isPresentation ? 13.333 : doc.page?.width || PAGE_WIDTH_INCHES;
  const pageHeight = isPresentation ? 7.5 : doc.page?.height || PAGE_HEIGHT_INCHES;
  const safeMargin = doc.page?.safeMargin ?? (isPresentation ? 0.5 : SAFE_MARGIN_INCHES);

  const canvasWidthPx = inchesToPx(pageWidth);
  const canvasHeightPx = inchesToPx(pageHeight);
  const marginPx = inchesToPx(safeMargin);

  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);
  const [dragTooltip, setDragTooltip] = useState<string | null>(null);

  // Normalize pages
  const pages: PageData[] = doc.pages && doc.pages.length > 0
    ? doc.pages
    : [
        {
          id: "page-1",
          title: "Page 1",
          elements: doc.elements || [],
        },
      ];

  // Drag Reference
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

  // Resize Reference
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
    aspectRatio: number;
    preserveAspect: boolean;
  } | null>(null);

  // Rotate Reference
  const rotateRef = useRef<{
    id: string;
    pageIndex: number;
    centerX: number;
    centerY: number;
    startAngle: number;
    initialRot: number;
  } | null>(null);

  // Keyboard Slide navigation in Presentation Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (isPresentation) {
        if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
          if (activePageIndex < pages.length - 1) {
            onSelectPageIndex(activePageIndex + 1);
          }
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          if (activePageIndex > 0) {
            onSelectPageIndex(activePageIndex - 1);
          }
        }
      }

      if (e.key === "Escape") {
        onSelectElement(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
        const activeElem = pages[activePageIndex]?.elements?.find((el) => el.id === selectedElementId);
        if (activeElem && !activeElem.locked) {
          onDeleteElement?.(selectedElementId, activePageIndex);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPresentation, activePageIndex, pages.length, selectedElementId, onSelectPageIndex, onSelectElement, onDeleteElement]);

  // Global Pointer Events for Drag / Resize / Rotate
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      // 1. DRAG
      if (dragRef.current) {
        const { id, pageIndex, startX, startY, initialElemX, initialElemY, width, height } = dragRef.current;
        const deltaXPx = (e.clientX - startX) / zoom;
        const deltaYPx = (e.clientY - startY) / zoom;

        const targetXInches = initialElemX + deltaXPx / DPI;
        const targetYInches = initialElemY + deltaYPx / DPI;

        const pageElements = pages[pageIndex]?.elements || [];
        const otherElements = pageElements.filter((el) => el.id !== id);

        const snapRes = computeSnapAndGuides(
          { id, x: targetXInches, y: targetYInches, width, height },
          otherElements,
          0.08,
          pageWidth,
          pageHeight,
          safeMargin
        );

        setActiveGuides(snapRes.guides);
        setDragTooltip(`X: ${snapRes.x.toFixed(2)}"  Y: ${snapRes.y.toFixed(2)}"`);
        onUpdateElementPosition(id, snapRes.x, snapRes.y, pageIndex);
        return;
      }

      // 2. RESIZE
      if (resizeRef.current) {
        const { id, pageIndex, handle, startX, startY, initX, initY, initW, initH, aspectRatio, preserveAspect } =
          resizeRef.current;
        const deltaXPx = (e.clientX - startX) / zoom;
        const deltaYPx = (e.clientY - startY) / zoom;
        const deltaXInches = deltaXPx / DPI;
        const deltaYInches = deltaYPx / DPI;

        let newX = initX;
        let newY = initY;
        let newW = initW;
        let newH = initH;

        if (handle.includes("e")) newW = initW + deltaXInches;
        if (handle.includes("s")) newH = initH + deltaYInches;
        if (handle.includes("w")) {
          newW = initW - deltaXInches;
          newX = initX + deltaXInches;
        }
        if (handle.includes("n")) {
          newH = initH - deltaYInches;
          newY = initY + deltaYInches;
        }

        if (preserveAspect || e.shiftKey) {
          if (handle === "se" || handle === "nw") {
            newH = newW / aspectRatio;
          } else if (handle === "ne" || handle === "sw") {
            newH = newW / aspectRatio;
          }
        }

        // Apply Clamping
        newW = Math.max(MIN_ELEMENT_WIDTH, newW);
        newH = Math.max(MIN_ELEMENT_HEIGHT, newH);

        const clampedDims = clampDimensions(newX, newY, newW, newH, pageWidth, pageHeight);
        const clampedPos = clampPosition(newX, newY, clampedDims.width, clampedDims.height, pageWidth, pageHeight);

        setDragTooltip(`W: ${clampedDims.width.toFixed(2)}"  H: ${clampedDims.height.toFixed(2)}"`);
        onUpdateElementDimensions(id, clampedDims.width, clampedDims.height, clampedPos.x, clampedPos.y, pageIndex);
        return;
      }

      // 3. ROTATE
      if (rotateRef.current) {
        const { id, pageIndex, centerX, centerY, startAngle, initialRot } = rotateRef.current;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        let deltaAngle = currentAngle - startAngle;
        let newRot = Math.round((initialRot + deltaAngle) % 360);
        if (newRot < 0) newRot += 360;

        // Snap to 45 degree increments if holding shift
        if (e.shiftKey) {
          newRot = Math.round(newRot / 45) * 45;
        }

        setDragTooltip(`Angle: ${newRot}°`);
        onUpdateElementRotation?.(id, newRot, pageIndex);
      }
    },
    [
      zoom,
      pages,
      pageWidth,
      pageHeight,
      safeMargin,
      onUpdateElementPosition,
      onUpdateElementDimensions,
      onUpdateElementRotation,
    ]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    resizeRef.current = null;
    rotateRef.current = null;
    setActiveGuides([]);
    setDragTooltip(null);
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Start Element Drag
  const startDrag = (e: React.PointerEvent, el: DocumentElement, pageIndex: number) => {
    if (isPreviewMode || el.locked) return;
    e.stopPropagation();
    onSelectElement(el.id);
    onSelectPageIndex(pageIndex);

    dragRef.current = {
      id: el.id,
      pageIndex,
      startX: e.clientX,
      startY: e.clientY,
      initialElemX: el.x,
      initialElemY: el.y,
      width: el.width,
      height: el.height,
    };
  };

  // Start Element Resize
  const startResize = (e: React.PointerEvent, el: DocumentElement, pageIndex: number, handle: ResizeHandle) => {
    if (isPreviewMode || el.locked) return;
    e.stopPropagation();

    resizeRef.current = {
      id: el.id,
      pageIndex,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initX: el.x,
      initY: el.y,
      initW: el.width,
      initH: el.height,
      aspectRatio: el.width / el.height,
      preserveAspect: el.metadata?.preserveAspectRatio ?? false,
    };
  };

  // Render a Single Page Canvas
  const renderPage = (page: PageData, pageIdx: number) => {
    const isPageActive = pageIdx === activePageIndex;
    const pageElements = page.elements || [];

    return (
      <div
        key={page.id || pageIdx}
        onClick={() => {
          onSelectPageIndex(pageIdx);
          onSelectElement(null);
        }}
        className="relative group transition-all duration-200"
        style={{
          width: `${canvasWidthPx}px`,
          height: `${canvasHeightPx}px`,
        }}
      >
        {/* Page Top Indicator in Multi-Page Document Mode */}
        {!isPresentation && pages.length > 1 && (
          <div className="absolute -top-7 left-0 right-0 flex items-center justify-between text-[11px] font-mono text-zinc-400 select-none px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              Page {pageIdx + 1} of {pages.length}
            </span>
            <span className="text-zinc-500">{page.title || "Standard Section"}</span>
          </div>
        )}

        {/* Paper Surface */}
        <div
          id={`pagepilot-canvas-page-${pageIdx}`}
          className={`w-full h-full relative overflow-hidden transition-all select-none ${
            isBlackAndWhite ? "filter grayscale contrast-125" : ""
          }`}
          style={{
            backgroundColor: page.background || doc.page?.background || "#ffffff",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)",
            borderRadius: isPresentation ? "12px" : "4px",
          }}
        >
          {/* Print-Safe Margin Guides (0.45" standard) */}
          {showMargins && !isPreviewMode && (
            <div
              className="absolute pointer-events-none border border-dashed border-indigo-400/40 z-50"
              style={{
                top: `${marginPx}px`,
                left: `${marginPx}px`,
                right: `${marginPx}px`,
                bottom: `${marginPx}px`,
              }}
            >
              <span className="absolute top-1 left-1.5 text-[9px] font-mono text-indigo-400/60 select-none uppercase tracking-wider">
                0.45&quot; Safe Margin
              </span>
            </div>
          )}

          {/* Active Alignment Guide Lines */}
          {isPageActive &&
            activeGuides.map((guide, idx) => {
              const posPx = inchesToPx(guide.position);
              return guide.type === "vertical" ? (
                <div
                  key={`v-${idx}`}
                  className="absolute top-0 bottom-0 border-l border-indigo-500 z-50 pointer-events-none"
                  style={{ left: `${posPx}px` }}
                >
                  {guide.label && (
                    <span className="absolute top-2 left-1 text-[9px] font-mono bg-indigo-600 text-white px-1 py-0.2 rounded shadow-xs">
                      {guide.label}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  key={`h-${idx}`}
                  className="absolute left-0 right-0 border-t border-indigo-500 z-50 pointer-events-none"
                  style={{ top: `${posPx}px` }}
                >
                  {guide.label && (
                    <span className="absolute top-1 left-2 text-[9px] font-mono bg-indigo-600 text-white px-1 py-0.2 rounded shadow-xs">
                      {guide.label}
                    </span>
                  )}
                </div>
              );
            })}

          {/* Elements on this page */}
          {pageElements.map((el) => {
            const isSelected = el.id === selectedElementId && isPageActive;
            const xPx = inchesToPx(el.x);
            const yPx = inchesToPx(el.y);
            const wPx = inchesToPx(el.width);
            const hPx = inchesToPx(el.height);
            const rot = el.rotation || 0;

            return (
              <div
                key={el.id}
                onPointerDown={(e) => startDrag(e, el, pageIdx)}
                className={`absolute cursor-move transition-shadow select-none group ${
                  isSelected ? "z-40" : ""
                } ${el.locked ? "cursor-not-allowed" : ""}`}
                style={{
                  left: `${xPx}px`,
                  top: `${yPx}px`,
                  width: `${wPx}px`,
                  height: `${hPx}px`,
                  transform: rot ? `rotate(${rot}deg)` : undefined,
                  zIndex: el.zIndex || 1,
                }}
              >
                {/* Element Component Renderer */}
                <div className="w-full h-full relative">
                  <ElementRenderer
                    element={el}
                    isBlackAndWhite={isBlackAndWhite}
                    isPresentation={isPresentation}
                  />
                </div>

                {/* Selection Overlay & Handles */}
                {isSelected && !isPreviewMode && (
                  <div className="absolute inset-0 pointer-events-none ring-2 ring-indigo-500/90 rounded-sm">
                    {/* Dimension Badge */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 text-white border border-white/[0.1] px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight shadow-md whitespace-nowrap z-50">
                      {el.width.toFixed(2)}&quot; × {el.height.toFixed(2)}&quot;
                    </div>

                    {/* Quick Floating Action Bar Above Element */}
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-900 text-zinc-300 border border-white/[0.15] p-1 rounded-lg shadow-xl pointer-events-auto z-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateElement?.(el.id, pageIdx);
                        }}
                        className="p-1 rounded hover:bg-white/[0.1] text-zinc-300 hover:text-white"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteElement?.(el.id, pageIdx);
                        }}
                        className="p-1 rounded hover:bg-rose-950/60 text-zinc-300 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* 4 Corner Resize Handles */}
                    {!el.locked && (
                      <>
                        <div
                          onPointerDown={(e) => startResize(e, el, pageIdx, "nw")}
                          className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize pointer-events-auto shadow-xs"
                        />
                        <div
                          onPointerDown={(e) => startResize(e, el, pageIdx, "ne")}
                          className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize pointer-events-auto shadow-xs"
                        />
                        <div
                          onPointerDown={(e) => startResize(e, el, pageIdx, "se")}
                          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize pointer-events-auto shadow-xs"
                        />
                        <div
                          onPointerDown={(e) => startResize(e, el, pageIdx, "sw")}
                          className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize pointer-events-auto shadow-xs"
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#0c0d10] relative overflow-auto flex flex-col items-center justify-start p-6 md:p-12 transition-colors select-none">
      {/* Dynamic Coordinate / Dimension Drag Tooltip */}
      {dragTooltip && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md text-white border border-white/[0.1] px-3 py-1 rounded-full text-xs font-mono shadow-2xl z-50">
          {dragTooltip}
        </div>
      )}

      {/* Main Canvas Workspace Container with Scaled Zoom */}
      <div
        className="flex flex-col items-center gap-14 transition-transform duration-100 ease-out origin-top"
        style={{
          transform: `scale(${zoom})`,
          marginBottom: "100px",
        }}
      >
        {isPresentation ? (
          /* =========================================================================
             PRESENTATION MODE (SINGLE ACTIVE 16:9 SLIDE VIEW WITH BOTTOM SLIDE STRIP)
             ========================================================================= */
          <div className="flex flex-col items-center gap-6">
            {/* Active Slide Canvas */}
            {pages[activePageIndex] && renderPage(pages[activePageIndex], activePageIndex)}

            {/* Presentation Bottom Navigation Strip */}
            <div className="flex items-center gap-3 bg-[#18191e]/90 backdrop-blur-md border border-white/[0.08] px-4 py-2 rounded-2xl shadow-xl">
              <button
                onClick={() => onSelectPageIndex(Math.max(0, activePageIndex - 1))}
                disabled={activePageIndex <= 0}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Slide (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                {pages.map((p, idx) => (
                  <button
                    key={p.id || idx}
                    onClick={() => onSelectPageIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === activePageIndex ? "w-8 bg-indigo-500" : "w-2 bg-zinc-600 hover:bg-zinc-400"
                    }`}
                    title={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <span className="text-xs font-mono text-zinc-400 px-1">
                {activePageIndex + 1} / {pages.length}
              </span>

              <button
                onClick={() => onSelectPageIndex(Math.min(pages.length - 1, activePageIndex + 1))}
                disabled={activePageIndex >= pages.length - 1}
                className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Slide (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-white/[0.1] mx-1" />

              <button
                onClick={onAddPage}
                className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Slide</span>
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             DOCUMENT MODE (VERTICAL MULTI-PAGE STACK)
             ========================================================================= */
          <div className="flex flex-col items-center gap-12">
            {pages.map((page, pageIdx) => (
              <React.Fragment key={page.id || pageIdx}>
                {renderPage(page, pageIdx)}

                {/* "+ Add Page" Divider Button between stacked pages */}
                {pageIdx < pages.length - 1 && (
                  <div className="flex items-center gap-3 w-full justify-center opacity-40 hover:opacity-100 transition-opacity">
                    <div className="h-px bg-white/[0.1] w-32" />
                    <button
                      onClick={onAddPage}
                      className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white bg-[#18191e] px-3 py-1 rounded-full border border-white/[0.08] shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Page</span>
                    </button>
                    <div className="h-px bg-white/[0.1] w-32" />
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Bottom Add Page Action */}
            <div className="pt-2">
              <button
                onClick={onAddPage}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-[#18191e] hover:bg-[#22242b] px-4 py-2 rounded-xl border border-white/[0.08] shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add New Page</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
