/**
 * Coordinate math, boundary clamping, and alignment guide system for PagePilot.
 * Strict US Letter 8.5 x 11 inches specification (Portrait) with 0.65 in margins.
 */

export const PAGE_WIDTH_IN = 8.5;
export const PAGE_HEIGHT_IN = 11;
export const PAGE_MARGIN_IN = 0.65;
export const DPI = 96; // 96 CSS pixels per inch

export const PAGE_WIDTH = PAGE_WIDTH_IN * DPI; // 816px
export const PAGE_HEIGHT = PAGE_HEIGHT_IN * DPI; // 1056px
export const PAGE_MARGIN = PAGE_MARGIN_IN * DPI; // 62.4px
export const PAGE_CONTENT_WIDTH = (PAGE_WIDTH_IN - PAGE_MARGIN_IN * 2) * DPI; // 691.2px
export const PAGE_CONTENT_HEIGHT = (PAGE_HEIGHT_IN - PAGE_MARGIN_IN * 2) * DPI; // 931.2px

// Backward compatibility aliases
export const PAGE_WIDTH_INCHES = PAGE_WIDTH_IN;
export const PAGE_HEIGHT_INCHES = PAGE_HEIGHT_IN;
export const SAFE_MARGIN_INCHES = PAGE_MARGIN_IN;
export const MIN_ELEMENT_WIDTH = 0.5; // in inches
export const MIN_ELEMENT_HEIGHT = 0.3; // in inches
export const DEFAULT_SNAP_GRID = 0.05; // 0.05" increments (~4.8px)

export function inchesToPx(inches: number, dpi = DPI): number {
  return inches * dpi;
}

export function pxToInches(px: number, dpi = DPI): number {
  return px / dpi;
}

export function clamp(val: number, min: number, max: number): number {
  if (min > max) return min;
  return Math.max(min, Math.min(max, val));
}

export function snapToGrid(val: number, step = DEFAULT_SNAP_GRID): number {
  return Math.round(val / step) * step;
}

/**
 * Clamps an element's position so it remains strictly inside the page.
 */
export function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  pageWidth = PAGE_WIDTH_INCHES,
  pageHeight = PAGE_HEIGHT_INCHES
): { x: number; y: number } {
  // Ensure width and height don't exceed page
  const effectiveW = Math.min(width, pageWidth);
  const effectiveH = Math.min(height, pageHeight);

  const clampedX = clamp(x, 0, Math.max(0, pageWidth - effectiveW));
  const clampedY = clamp(y, 0, Math.max(0, pageHeight - effectiveH));

  return {
    x: Math.round(clampedX * 1000) / 1000,
    y: Math.round(clampedY * 1000) / 1000,
  };
}

/**
 * Clamps an element's dimensions so it cannot be smaller than minimums
 * or extend past the page boundaries from its current position.
 */
export function clampDimensions(
  x: number,
  y: number,
  width: number,
  height: number,
  pageWidth = PAGE_WIDTH_INCHES,
  pageHeight = PAGE_HEIGHT_INCHES,
  minW = MIN_ELEMENT_WIDTH,
  minH = MIN_ELEMENT_HEIGHT
): { width: number; height: number } {
  const maxWidth = Math.max(minW, pageWidth - Math.max(0, x));
  const maxHeight = Math.max(minH, pageHeight - Math.max(0, y));

  const clampedW = clamp(width, minW, maxWidth);
  const clampedH = clamp(height, minH, maxHeight);

  return {
    width: Math.round(clampedW * 1000) / 1000,
    height: Math.round(clampedH * 1000) / 1000,
  };
}

/**
 * Completely clamps an element's bounding box (x, y, width, height)
 * inside the 8.5 x 11 inch page.
 */
export function clampElementBounds<T extends { x: number; y: number; width: number; height: number }>(
  el: T,
  pageWidth = PAGE_WIDTH_INCHES,
  pageHeight = PAGE_HEIGHT_INCHES
): T {
  const safeW = clamp(el.width, MIN_ELEMENT_WIDTH, pageWidth);
  const safeH = clamp(el.height, MIN_ELEMENT_HEIGHT, pageHeight);
  const safePos = clampPosition(el.x, el.y, safeW, safeH, pageWidth, pageHeight);

  return {
    ...el,
    x: safePos.x,
    y: safePos.y,
    width: safeW,
    height: safeH,
  };
}

export interface AlignmentGuide {
  type: "vertical" | "horizontal";
  position: number; // inches
  label?: string;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: AlignmentGuide[];
}

/**
 * Detects snap targets and returns adjusted coordinates and active visual guides.
 */
export function computeSnapAndGuides(
  target: { id: string; x: number; y: number; width: number; height: number },
  otherElements: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  thresholdInches = 0.08,
  pageWidth = PAGE_WIDTH_INCHES,
  pageHeight = PAGE_HEIGHT_INCHES,
  safeMargin = SAFE_MARGIN_INCHES
): SnapResult {
  let snapX = target.x;
  let snapY = target.y;
  const activeGuides: AlignmentGuide[] = [];

  const targetRight = target.x + target.width;
  const targetCenterX = target.x + target.width / 2;
  const targetBottom = target.y + target.height;
  const targetCenterY = target.y + target.height / 2;

  // Key page alignment lines (in inches)
  const verticalTargets: Array<{ pos: number; label: string }> = [
    { pos: safeMargin, label: "Left Margin" },
    { pos: pageWidth / 2, label: "Center" },
    { pos: pageWidth - safeMargin, label: "Right Margin" },
  ];

  const horizontalTargets: Array<{ pos: number; label: string }> = [
    { pos: safeMargin, label: "Top Margin" },
    { pos: pageHeight / 2, label: "Middle" },
    { pos: pageHeight - safeMargin, label: "Bottom Margin" },
  ];

  // Add peer element edges and centers
  for (const other of otherElements) {
    if (other.id === target.id) continue;
    verticalTargets.push(
      { pos: other.x, label: "Align Left" },
      { pos: other.x + other.width / 2, label: "Align Center" },
      { pos: other.x + other.width, label: "Align Right" }
    );
    horizontalTargets.push(
      { pos: other.y, label: "Align Top" },
      { pos: other.y + other.height / 2, label: "Align Middle" },
      { pos: other.y + other.height, label: "Align Bottom" }
    );
  }

  // Check vertical snaps (X-axis)
  let bestDeltaX = thresholdInches + 1;
  let bestGuideX: AlignmentGuide | null = null;
  let bestSnapX = snapX;

  for (const vt of verticalTargets) {
    // Snap target's left edge
    if (Math.abs(target.x - vt.pos) < bestDeltaX) {
      bestDeltaX = Math.abs(target.x - vt.pos);
      bestSnapX = vt.pos;
      bestGuideX = { type: "vertical", position: vt.pos, label: vt.label };
    }
    // Snap target's center
    if (Math.abs(targetCenterX - vt.pos) < bestDeltaX) {
      bestDeltaX = Math.abs(targetCenterX - vt.pos);
      bestSnapX = vt.pos - target.width / 2;
      bestGuideX = { type: "vertical", position: vt.pos, label: vt.label };
    }
    // Snap target's right edge
    if (Math.abs(targetRight - vt.pos) < bestDeltaX) {
      bestDeltaX = Math.abs(targetRight - vt.pos);
      bestSnapX = vt.pos - target.width;
      bestGuideX = { type: "vertical", position: vt.pos, label: vt.label };
    }
  }

  if (bestDeltaX <= thresholdInches && bestGuideX) {
    snapX = bestSnapX;
    activeGuides.push(bestGuideX);
  } else {
    // Standard grid snap
    snapX = snapToGrid(snapX);
  }

  // Check horizontal snaps (Y-axis)
  let bestDeltaY = thresholdInches + 1;
  let bestGuideY: AlignmentGuide | null = null;
  let bestSnapY = snapY;

  for (const ht of horizontalTargets) {
    // Snap target's top edge
    if (Math.abs(target.y - ht.pos) < bestDeltaY) {
      bestDeltaY = Math.abs(target.y - ht.pos);
      bestSnapY = ht.pos;
      bestGuideY = { type: "horizontal", position: ht.pos, label: ht.label };
    }
    // Snap target's center
    if (Math.abs(targetCenterY - ht.pos) < bestDeltaY) {
      bestDeltaY = Math.abs(targetCenterY - ht.pos);
      bestSnapY = ht.pos - target.height / 2;
      bestGuideY = { type: "horizontal", position: ht.pos, label: ht.label };
    }
    // Snap target's bottom edge
    if (Math.abs(targetBottom - ht.pos) < bestDeltaY) {
      bestDeltaY = Math.abs(targetBottom - ht.pos);
      bestSnapY = ht.pos - target.height;
      bestGuideY = { type: "horizontal", position: ht.pos, label: ht.label };
    }
  }

  if (bestDeltaY <= thresholdInches && bestGuideY) {
    snapY = bestSnapY;
    activeGuides.push(bestGuideY);
  } else {
    // Standard grid snap
    snapY = snapToGrid(snapY);
  }

  // Clamp strictly within page bounds
  const clamped = clampPosition(snapX, snapY, target.width, target.height, pageWidth, pageHeight);

  return {
    x: clamped.x,
    y: clamped.y,
    guides: activeGuides,
  };
}
