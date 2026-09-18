"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { DocumentModel, DocumentElement } from "@/types/document";
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
import { RotateCw, Lock } from "lucide-react";
import { GoogleDocsRuler } from "./GoogleDocsRuler";

interface DocumentCanvasProps {
  document: DocumentModel;
  zoom: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElementPosition: (id: string, x: number, y: number) => void;
  onUpdateElementDimensions: (
    id: string,
    width: number,
    height: number,
    x?: number,
    y?: number
  ) => void;
  onUpdateElementRotation?: (id: string, rotation: number) => void;
  onDeleteElement?: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  isBlackAndWhite: boolean;
  showMargins: boolean;
  onToggleMargins?: () => void;
  isPreviewMode?: boolean;
  isAnimating: boolean;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  document: doc,
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
  const pageWidth = doc.page?.width || PAGE_WIDTH_INCHES;
  const pageHeight = doc.page?.height || PAGE_HEIGHT_INCHES;
  const safeMargin = doc.page?.safeMargin ?? SAFE_MARGIN_INCHES;

  const canvasWidthPx = inchesToPx(pageWidth); // 816px
  const canvasHeightPx = inchesToPx(pageHeight); // 1056px
  const marginPx = inchesToPx(safeMargin); // 43.2px

  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);
  const [dragTooltip, setDragTooltip] = useState<string | null>(null);

  // Interaction References
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    initialElemX: number;
    initialElemY: number;
    width: number;
    height: number;
  } | null>(null);

  const resizeRef = useRef<{
    id: string;
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

  const rotateRef = useRef<{
    id: string;
    centerX: number;
    centerY: number;
    initRotation: number;
  } | null>(null);

  // Drag Initiation
  const handleMouseDownElement = (e: React.MouseEvent, element: DocumentElement) => {
    if (isPreviewMode) return;
    e.stopPropagation();

    onSelectElement(element.id);

    if (element.locked) return;

    dragRef.current = {
      id: element.id,
      startX: e.clientX,
      startY: e.clientY,
      initialElemX: element.x,
      initialElemY: element.y,
      width: element.width,
      height: element.height,
    };
  };

  // Resize Initiation
  const handleMouseDownResize = (
    e: React.MouseEvent,
    element: DocumentElement,
    handle: ResizeHandle
  ) => {
    if (isPreviewMode || element.locked) return;
    e.stopPropagation();

    const isVisual =
      ["chart", "diagram", "image", "illustration", "formula"].includes(element.type) ||
      element.metadata?.preserveAspectRatio === true;

    resizeRef.current = {
      id: element.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initX: element.x,
      initY: element.y,
      initW: element.width,
      initH: element.height,
      aspectRatio: element.width / Math.max(0.1, element.height),
      preserveAspect: isVisual || e.shiftKey,
    };
  };

  // Rotate Initiation
  const handleMouseDownRotate = (
    e: React.MouseEvent,
    element: DocumentElement,
    elemLeftPx: number,
    elemTopPx: number,
    elemWidthPx: number,
    elemHeightPx: number
  ) => {
    if (isPreviewMode || element.locked) return;
    e.stopPropagation();

    // Compute element center on screen
    const canvasEl = document.getElementById("authoring-page-canvas");
    if (!canvasEl) return;
    const canvasRect = canvasEl.getBoundingClientRect();
    const centerX = canvasRect.left + (elemLeftPx + elemWidthPx / 2) * zoom;
    const centerY = canvasRect.top + (elemTopPx + elemHeightPx / 2) * zoom;

    rotateRef.current = {
      id: element.id,
      centerX,
      centerY,
      initRotation: element.rotation || 0,
    };
  };

  // Global Mouse Move & Up Listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 1. DRAG
      if (dragRef.current) {
        const { id, startX, startY, initialElemX, initialElemY, width, height } = dragRef.current;
        const deltaX = (e.clientX - startX) / (DPI * zoom);
        const deltaY = (e.clientY - startY) / (DPI * zoom);

        const rawTarget = {
          id,
          x: initialElemX + deltaX,
          y: initialElemY + deltaY,
          width,
          height,
        };

        const otherElements = doc.elements.filter((el) => el.id !== id);
        const snap = computeSnapAndGuides(
          rawTarget,
          otherElements,
          0.08,
          pageWidth,
          pageHeight,
          safeMargin
        );

        setActiveGuides(snap.guides);
        setDragTooltip(`X: ${snap.x.toFixed(2)}"  Y: ${snap.y.toFixed(2)}"`);
        onUpdateElementPosition(id, snap.x, snap.y);
        return;
      }

      // 2. RESIZE
      if (resizeRef.current) {
        const {
          id,
          handle,
          startX,
          startY,
          initX,
          initY,
          initW,
          initH,
          aspectRatio,
          preserveAspect,
        } = resizeRef.current;

        const deltaX = (e.clientX - startX) / (DPI * zoom);
        const deltaY = (e.clientY - startY) / (DPI * zoom);

        let newX = initX;
        let newY = initY;
        let newW = initW;
        let newH = initH;

        const shouldPreserve = preserveAspect || e.shiftKey;

        // X adjustments
        if (handle.includes("e")) {
          newW = Math.max(MIN_ELEMENT_WIDTH, initW + deltaX);
        } else if (handle.includes("w")) {
          const maxDelta = initW - MIN_ELEMENT_WIDTH;
          const allowedDelta = Math.min(deltaX, maxDelta);
          newX = Math.max(0, initX + allowedDelta);
          newW = initW - (newX - initX);
        }

        // Y adjustments
        if (handle.includes("s")) {
          newH = Math.max(MIN_ELEMENT_HEIGHT, initH + deltaY);
        } else if (handle.includes("n")) {
          const maxDelta = initH - MIN_ELEMENT_HEIGHT;
          const allowedDelta = Math.min(deltaY, maxDelta);
          newY = Math.max(0, initY + allowedDelta);
          newH = initH - (newY - initY);
        }

        // Proportional lock
        if (shouldPreserve && aspectRatio > 0) {
          if (["e", "w"].includes(handle)) {
            newH = newW / aspectRatio;
          } else if (["n", "s"].includes(handle)) {
            newW = newH * aspectRatio;
          } else {
            // Corner handles: pick dominant dimension
            const scale = Math.max(newW / initW, newH / initH);
            newW = initW * scale;
            newH = initH * scale;

            if (handle.includes("w")) {
              newX = initX + (initW - newW);
            }
            if (handle.includes("n")) {
              newY = initY + (initH - newH);
            }
          }
        }

        // Clamp to physical page
        const clampedDims = clampDimensions(newX, newY, newW, newH, pageWidth, pageHeight);
        const clampedPos = clampPosition(
          newX,
          newY,
          clampedDims.width,
          clampedDims.height,
          pageWidth,
          pageHeight
        );

        setDragTooltip(
          `W: ${clampedDims.width.toFixed(2)}"  H: ${clampedDims.height.toFixed(2)}"`
        );
        onUpdateElementDimensions(
          id,
          clampedDims.width,
          clampedDims.height,
          clampedPos.x,
          clampedPos.y
        );
        return;
      }

      // 3. ROTATE
      if (rotateRef.current) {
        const { id, centerX, centerY } = rotateRef.current;
        const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let deg = Math.round((rad * 180) / Math.PI + 90);
        if (deg < 0) deg += 360;

        // Snap to clean 45° angles
        const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
        for (const snap of snapAngles) {
          if (Math.abs(deg - snap) <= 6) {
            deg = snap === 360 ? 0 : snap;
            break;
          }
        }

        setDragTooltip(`${deg}°`);
        if (onUpdateElementRotation) {
          onUpdateElementRotation(id, deg);
        }
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
      rotateRef.current = null;
      setActiveGuides([]);
      setDragTooltip(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    zoom,
    doc.elements,
    pageWidth,
    pageHeight,
    safeMargin,
    onUpdateElementPosition,
    onUpdateElementDimensions,
    onUpdateElementRotation,
  ]);

  // Keyboard Shortcuts (Delete, Duplicate, Nudge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;

      // Ignore if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const selectedEl = doc.elements.find((el) => el.id === selectedElementId);
      if (!selectedEl) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (!selectedEl.locked && onDeleteElement) {
          onDeleteElement(selectedElementId);
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (onDuplicateElement) {
          onDuplicateElement(selectedElementId);
        }
      } else if (e.key === "Escape") {
        onSelectElement(null);
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (selectedEl.locked) return;

        const step = e.shiftKey ? 0.01 : 0.05;
        let nextX = selectedEl.x;
        let nextY = selectedEl.y;

        if (e.key === "ArrowLeft") nextX -= step;
        if (e.key === "ArrowRight") nextX += step;
        if (e.key === "ArrowUp") nextY -= step;
        if (e.key === "ArrowDown") nextY += step;

        const clamped = clampPosition(
          nextX,
          nextY,
          selectedEl.width,
          selectedEl.height,
          pageWidth,
          pageHeight
        );
        onUpdateElementPosition(selectedElementId, clamped.x, clamped.y);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedElementId,
    doc.elements,
    pageWidth,
    pageHeight,
    onDeleteElement,
    onDuplicateElement,
    onSelectElement,
    onUpdateElementPosition,
  ]);

  return (
    <div
      className="relative flex flex-col items-center justify-start min-h-full py-8 px-8 pb-36 select-none"
      onClick={() => onSelectElement(null)}
    >
      {/* Visual Dimension & Position Live Tooltip */}
      {dragTooltip && (
        <div className="no-print fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs font-mono px-3 py-1.5 rounded-full shadow-lg z-50 pointer-events-none backdrop-blur animate-in fade-in duration-100">
          {dragTooltip}
        </div>
      )}

      {/* Google Docs Authentic Horizontal Ruler */}
      {!isPreviewMode && (
        <GoogleDocsRuler
          pageWidthInches={pageWidth}
          safeMarginInches={safeMargin}
          zoom={zoom}
          showMargins={showMargins}
          onToggleMargins={onToggleMargins}
        />
      )}

      {/* Page Canvas Container with Strict Aspect Ratio & Shadow */}
      <div
        id="authoring-page-canvas"
        className={`print-only-page relative bg-white transition-all duration-200 ${
          isAnimating ? "animating-construction" : ""
        }`}
        style={{
          width: `${canvasWidthPx}px`,
          height: `${canvasHeightPx}px`,
          transform: `scale(${zoom})`,
          transformOrigin: "center top",
          boxShadow: isPreviewMode
            ? "0 4px 20px -2px rgba(0, 0, 0, 0.08)"
            : "0 16px 48px -8px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.04)",
          backgroundColor: doc.page?.background || "#ffffff",
          overflow: "visible",
        }}
      >
        {/* Safe Margin Guide Line & Badge */}
        {!isPreviewMode && showMargins && (
          <div
            className="print-safe-guide absolute pointer-events-none border border-dashed border-sky-400/60 z-30 transition-opacity"
            style={{
              top: `${marginPx}px`,
              left: `${marginPx}px`,
              right: `${marginPx}px`,
              bottom: `${marginPx}px`,
            }}
          >
            <span className="absolute -top-3 left-2 bg-sky-50 text-sky-700 text-[9px] font-mono px-1.5 py-0.5 rounded border border-sky-300 font-semibold shadow-xs">
              0.45" Safe Margin
            </span>
          </div>
        )}

        {/* Dynamic Alignment Guide Lines */}
        {!isPreviewMode &&
          activeGuides.map((guide, idx) => {
            const posPx = inchesToPx(guide.position);
            if (guide.type === "vertical") {
              return (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 pointer-events-none z-50 flex flex-col items-center"
                  style={{ left: `${posPx}px` }}
                >
                  <div className="w-[1px] h-full bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.6)]" />
                  {guide.label && (
                    <span className="absolute top-1 bg-indigo-600 text-white text-[9px] font-mono px-1 rounded shadow-sm whitespace-nowrap">
                      {guide.label}
                    </span>
                  )}
                </div>
              );
            } else {
              return (
                <div
                  key={idx}
                  className="absolute left-0 right-0 pointer-events-none z-50 flex items-center justify-center"
                  style={{ top: `${posPx}px` }}
                >
                  <div className="h-[1px] w-full bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.6)]" />
                  {guide.label && (
                    <span className="absolute left-1 bg-indigo-600 text-white text-[9px] font-mono px-1 rounded shadow-sm whitespace-nowrap">
                      {guide.label}
                    </span>
                  )}
                </div>
              );
            }
          })}

        {/* Laser Sweep Beam during AI Generation */}
        {isAnimating && (
          <div className="qc-beam-active absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent pointer-events-none z-50 shadow-[0_0_16px_rgba(99,102,241,0.9)]" />
        )}

        {/* Document Elements */}
        {doc.elements.map((el) => {
          if (el.visible === false) return null;

          const isSelected = !isPreviewMode && selectedElementId === el.id;
          const leftPx = inchesToPx(el.x);
          const topPx = inchesToPx(el.y);
          const widthPx = inchesToPx(el.width);
          const heightPx = inchesToPx(el.height);
          const rotationDeg = el.rotation || 0;

          // Check if element breaches safe margins for a subtle indicator
          const isBreachingMargin =
            el.x < safeMargin - 0.01 ||
            el.y < safeMargin - 0.01 ||
            el.x + el.width > pageWidth - safeMargin + 0.01 ||
            el.y + el.height > pageHeight - safeMargin + 0.01;

          return (
            <div
              key={el.id}
              id={`el-${el.id}`}
              onMouseDown={(e) => handleMouseDownElement(e, el)}
              className={`absolute transition-shadow duration-100 ${
                isPreviewMode
                  ? "cursor-default"
                  : el.locked
                  ? "cursor-not-allowed"
                  : "cursor-move"
              } ${
                isSelected
                  ? "ring-2 ring-indigo-600 ring-offset-1 z-40"
                  : !isPreviewMode
                  ? "hover:ring-1 hover:ring-indigo-300"
                  : ""
              }`}
              style={{
                left: `${leftPx}px`,
                top: `${topPx}px`,
                width: `${widthPx}px`,
                height: `${heightPx}px`,
                transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
                transformOrigin: "center center",
                zIndex: isSelected ? 45 : el.zIndex || 1,
                backgroundColor: el.style?.backgroundColor || "transparent",
                borderColor: el.style?.borderColor || "transparent",
                borderWidth: el.style?.borderWidth ? `${el.style.borderWidth}px` : "0px",
                borderStyle: el.style?.borderStyle || "none",
                borderRadius: el.style?.borderRadius ? `${el.style.borderRadius}px` : "0px",
                padding: el.style?.padding ? `${el.style.padding}px` : "0px",
                opacity: el.style?.opacity !== undefined ? el.style.opacity : 1,
                boxShadow: el.style?.boxShadow || undefined,
              }}
            >
              <ElementRenderer
                element={el}
                dpi={DPI}
                isSelected={isSelected}
                isBlackAndWhite={isBlackAndWhite}
                isPreview={isPreviewMode}
              />

              {/* Locked Indicator Badge */}
              {!isPreviewMode && el.locked && (
                <div
                  className="no-print absolute -top-2.5 -right-2.5 bg-amber-500 text-white p-1 rounded-full shadow-sm z-50"
                  title="Element locked. Unlock in right inspector to edit."
                >
                  <Lock className="w-3 h-3" />
                </div>
              )}

              {/* Safe Margin Warning Badge when outside 0.45" */}
              {!isPreviewMode && !isSelected && isBreachingMargin && showMargins && (
                <div
                  className="no-print absolute -top-2 -left-2 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-white shadow-xs z-30"
                  title="Element extends outside the 0.45 inch safe print margin"
                />
              )}

              {/* Selection Transform Controls (8-direction Resizing + Rotation Pin) */}
              {isSelected && !el.locked && (
                <>
                  {/* Rotation Handle with stem */}
                  <div
                    className="no-print absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-50"
                    onMouseDown={(e) =>
                      handleMouseDownRotate(e, el, leftPx, topPx, widthPx, heightPx)
                    }
                    title="Drag to rotate (Snaps to 0°, 45°, 90°, 180°)"
                  >
                    <div className="w-5 h-5 bg-white border-2 border-indigo-600 rounded-full flex items-center justify-center text-indigo-600 shadow-md hover:scale-110 transition-transform">
                      <RotateCw className="w-2.5 h-2.5" />
                    </div>
                    <div className="w-[1.5px] h-2 bg-indigo-600" />
                  </div>

                  {/* Corner Handles */}
                  <div
                    className="no-print absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize hover:scale-125 transition-transform z-50 shadow-xs"
                    onMouseDown={(e) => handleMouseDownResize(e, el, "nw")}
                  />
                  <div
                    className="no-print absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize hover:scale-125 transition-transform z-50 shadow-xs"
                    onMouseDown={(e) => handleMouseDownResize(e, el, "ne")}
                  />
                  <div
                    className="no-print absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize hover:scale-125 transition-transform z-50 shadow-xs"
                    onMouseDown={(e) => handleMouseDownResize(e, el, "sw")}
                  />
                  <div
                    className="no-print absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize hover:scale-125 transition-transform z-50 shadow-xs"
                    onMouseDown={(e) => handleMouseDownResize(e, el, "se")}
                  />

                  {/* Edge Handles */}
                  <div
                    className="no-print absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-white border-2 border-indigo-600 rounded-xs cursor-ns-resize hover:scale-110 transition-transform z-50 shadow-xs"
                    onMouseDown={(e) => handleMouseDownResize(e, el, "n")}
                  />
                  <div
                    className="no-print absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-2 bg-white border-2 border-indigo-600 rounded-xs cursor-ns-resize hover:scale-110 transition-transform z-50 shadow-xs"
                    onMouseDown={(e) => handleMouseDownResize(e, el, "s")}
                  />
                  <div
                    className="no-print absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ew-resize hover:scale-110 transition-transform z-50 shadow-xs"
                    onMouseDown={(e) => handleMouseDownResize(e, el, "w")}
                  />
                  <div
                    className="no-print absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ew-resize hover:scale-110 transition-transform z-50 shadow-xs"
                    onMouseDown={(e) => handleMouseDownResize(e, el, "e")}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};