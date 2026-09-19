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
  position: number; // in inches
  label?: string;
  guideType: "center" | "margin" | "peer" | "grid" | "spacing";
  matchType?: "edge" | "center" | "margin" | "spacing";
}

export interface SnapOptions {
  snapToGrid?: boolean;
  gridStep?: number; // default 0.125" (1/8 inch)
  snapToGuides?: boolean;
  thresholdInches?: number; // default 0.10"
  pageWidth?: number;
  pageHeight?: number;
  safeMargin?: number;
  isAltPressed?: boolean; // When true, snaps are completely disabled (Google Slides precision override)
}

export interface SnapResult {
  x: number;
  y: number;
  guides: AlignmentGuide[];
  snappedX: boolean;
  snappedY: boolean;
}

/**
 * Detects snap targets and returns adjusted coordinates and active visual guides.
 */
export function computeSnapAndGuides(
  target: { id: string; x: number; y: number; width: number; height: number },
  otherElements: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  options: SnapOptions = {}
): SnapResult {
  const {
    snapToGrid: enableGrid = true,
    gridStep = 0.125,
    snapToGuides: enableGuides = true,
    thresholdInches = 0.10,
    pageWidth = PAGE_WIDTH_INCHES,
    pageHeight = PAGE_HEIGHT_INCHES,
    safeMargin = SAFE_MARGIN_INCHES,
    isAltPressed = false,
  } = options;

  let snapX = target.x;
  let snapY = target.y;
  const activeGuides: AlignmentGuide[] = [];
  let snappedX = false;
  let snappedY = false;

  // If Alt/Option is held, bypass all snapping for free precision movement
  if (isAltPressed) {
    const clamped = clampPosition(target.x, target.y, target.width, target.height, pageWidth, pageHeight);
    return {
      x: clamped.x,
      y: clamped.y,
      guides: [],
      snappedX: false,
      snappedY: false,
    };
  }

  const targetRight = target.x + target.width;
  const targetCenterX = target.x + target.width / 2;
  const targetBottom = target.y + target.height;
  const targetCenterY = target.y + target.height / 2;

  if (enableGuides) {
    // 1. Vertical guide targets (X-axis snap)
    const verticalTargets: Array<{ pos: number; label: string; guideType: "center" | "margin" | "peer"; matchType: "edge" | "center" | "margin" }> = [
      { pos: safeMargin, label: "Left Margin", guideType: "margin", matchType: "margin" },
      { pos: pageWidth / 2, label: "Center Axis", guideType: "center", matchType: "center" },
      { pos: pageWidth - safeMargin, label: "Right Margin", guideType: "margin", matchType: "margin" },
    ];

    // 2. Horizontal guide targets (Y-axis snap)
    const horizontalTargets: Array<{ pos: number; label: string; guideType: "center" | "margin" | "peer"; matchType: "edge" | "center" | "margin" }> = [
      { pos: safeMargin, label: "Top Margin", guideType: "margin", matchType: "margin" },
      { pos: pageHeight / 2, label: "Middle Axis", guideType: "center", matchType: "center" },
      { pos: pageHeight - safeMargin, label: "Bottom Margin", guideType: "margin", matchType: "margin" },
    ];

    // Add peer element edges and centers
    for (const other of otherElements) {
      if (other.id === target.id) continue;
      verticalTargets.push(
        { pos: other.x, label: "Align Left", guideType: "peer", matchType: "edge" },
        { pos: other.x + other.width / 2, label: "Align Center", guideType: "peer", matchType: "center" },
        { pos: other.x + other.width, label: "Align Right", guideType: "peer", matchType: "edge" }
      );
      horizontalTargets.push(
        { pos: other.y, label: "Align Top", guideType: "peer", matchType: "edge" },
        { pos: other.y + other.height / 2, label: "Align Middle", guideType: "peer", matchType: "center" },
        { pos: other.y + other.height, label: "Align Bottom", guideType: "peer", matchType: "edge" }
      );
    }

    // Check vertical snaps (X-axis)
    let bestDeltaX = thresholdInches + 0.001;
    let bestGuideX: AlignmentGuide | null = null;
    let bestSnapX = snapX;

    for (const vt of verticalTargets) {
      // Snap target's left edge
      if (Math.abs(target.x - vt.pos) < bestDeltaX) {
        bestDeltaX = Math.abs(target.x - vt.pos);
        bestSnapX = vt.pos;
        bestGuideX = { type: "vertical", position: vt.pos, label: vt.label, guideType: vt.guideType, matchType: vt.matchType };
      }
      // Snap target's center
      if (Math.abs(targetCenterX - vt.pos) < bestDeltaX) {
        bestDeltaX = Math.abs(targetCenterX - vt.pos);
        bestSnapX = vt.pos - target.width / 2;
        bestGuideX = { type: "vertical", position: vt.pos, label: vt.label, guideType: vt.guideType, matchType: vt.matchType };
      }
      // Snap target's right edge
      if (Math.abs(targetRight - vt.pos) < bestDeltaX) {
        bestDeltaX = Math.abs(targetRight - vt.pos);
        bestSnapX = vt.pos - target.width;
        bestGuideX = { type: "vertical", position: vt.pos, label: vt.label, guideType: vt.guideType, matchType: vt.matchType };
      }
    }

    if (bestDeltaX <= thresholdInches && bestGuideX) {
      snapX = bestSnapX;
      activeGuides.push(bestGuideX);
      snappedX = true;
    }

    // Check horizontal snaps (Y-axis)
    let bestDeltaY = thresholdInches + 0.001;
    let bestGuideY: AlignmentGuide | null = null;
    let bestSnapY = snapY;

    for (const ht of horizontalTargets) {
      // Snap target's top edge
      if (Math.abs(target.y - ht.pos) < bestDeltaY) {
        bestDeltaY = Math.abs(target.y - ht.pos);
        bestSnapY = ht.pos;
        bestGuideY = { type: "horizontal", position: ht.pos, label: ht.label, guideType: ht.guideType, matchType: ht.matchType };
      }
      // Snap target's center
      if (Math.abs(targetCenterY - ht.pos) < bestDeltaY) {
        bestDeltaY = Math.abs(targetCenterY - ht.pos);
        bestSnapY = ht.pos - target.height / 2;
        bestGuideY = { type: "horizontal", position: ht.pos, label: ht.label, guideType: ht.guideType, matchType: ht.matchType };
      }
      // Snap target's bottom edge
      if (Math.abs(targetBottom - ht.pos) < bestDeltaY) {
        bestDeltaY = Math.abs(targetBottom - ht.pos);
        bestSnapY = ht.pos - target.height;
        bestGuideY = { type: "horizontal", position: ht.pos, label: ht.label, guideType: ht.guideType, matchType: ht.matchType };
      }
    }

    if (bestDeltaY <= thresholdInches && bestGuideY) {
      snapY = bestSnapY;
      activeGuides.push(bestGuideY);
      snappedY = true;
    }
  }

  // If no guide snap on X and grid is enabled, apply grid snap
  if (!snappedX && enableGrid) {
    snapX = snapToGrid(snapX, gridStep);
  }

  // If no guide snap on Y and grid is enabled, apply grid snap
  if (!snappedY && enableGrid) {
    snapY = snapToGrid(snapY, gridStep);
  }

  // Clamp strictly within page bounds
  const clamped = clampPosition(snapX, snapY, target.width, target.height, pageWidth, pageHeight);

  return {
    x: clamped.x,
    y: clamped.y,
    guides: activeGuides,
    snappedX,
    snappedY,
  };
}

/**
 * Resize snapping for 8-point handles with smart guide alignment
 */
export function computeResizeSnapAndGuides(
  target: { id: string; x: number; y: number; width: number; height: number },
  handle: string,
  otherElements: Array<{ id: string; x: number; y: number; width: number; height: number }>,
  options: SnapOptions = {}
): {
  x: number;
  y: number;
  width: number;
  height: number;
  guides: AlignmentGuide[];
} {
  const {
    snapToGrid: enableGrid = true,
    gridStep = 0.125,
    snapToGuides: enableGuides = true,
    thresholdInches = 0.10,
    pageWidth = PAGE_WIDTH_INCHES,
    pageHeight = PAGE_HEIGHT_INCHES,
    safeMargin = SAFE_MARGIN_INCHES,
    isAltPressed = false,
  } = options;

  let newX = target.x;
  let newY = target.y;
  let newW = target.width;
  let newH = target.height;
  const activeGuides: AlignmentGuide[] = [];

  if (isAltPressed) {
    const clampedDim = clampDimensions(newX, newY, newW, newH, pageWidth, pageHeight);
    return { x: newX, y: newY, width: clampedDim.width, height: clampedDim.height, guides: [] };
  }

  // Right edge snap (e, ne, se)
  if (handle.includes("e")) {
    const currentRight = newX + newW;
    let bestSnapRight = currentRight;
    let minDelta = thresholdInches + 0.001;
    let guide: AlignmentGuide | null = null;

    if (enableGuides) {
      const vTargets = [
        { pos: pageWidth - safeMargin, label: "Right Margin" },
        { pos: pageWidth / 2, label: "Center Axis" },
        ...otherElements
          .filter((el) => el.id !== target.id)
          .flatMap((el) => [
            { pos: el.x, label: "Align Left" },
            { pos: el.x + el.width, label: "Align Right" },
          ]),
      ];

      for (const vt of vTargets) {
        const delta = Math.abs(currentRight - vt.pos);
        if (delta < minDelta) {
          minDelta = delta;
          bestSnapRight = vt.pos;
          guide = { type: "vertical", position: vt.pos, label: vt.label, guideType: "peer" };
        }
      }
    }

    if (minDelta <= thresholdInches && guide) {
      newW = Math.max(MIN_ELEMENT_WIDTH, bestSnapRight - newX);
      activeGuides.push(guide);
    } else if (enableGrid) {
      newW = Math.max(MIN_ELEMENT_WIDTH, snapToGrid(newW, gridStep));
    }
  }

  // Bottom edge snap (s, se, sw)
  if (handle.includes("s")) {
    const currentBottom = newY + newH;
    let bestSnapBottom = currentBottom;
    let minDelta = thresholdInches + 0.001;
    let guide: AlignmentGuide | null = null;

    if (enableGuides) {
      const hTargets = [
        { pos: pageHeight - safeMargin, label: "Bottom Margin" },
        { pos: pageHeight / 2, label: "Middle Axis" },
        ...otherElements
          .filter((el) => el.id !== target.id)
          .flatMap((el) => [
            { pos: el.y, label: "Align Top" },
            { pos: el.y + el.height, label: "Align Bottom" },
          ]),
      ];

      for (const ht of hTargets) {
        const delta = Math.abs(currentBottom - ht.pos);
        if (delta < minDelta) {
          minDelta = delta;
          bestSnapBottom = ht.pos;
          guide = { type: "horizontal", position: ht.pos, label: ht.label, guideType: "peer" };
        }
      }
    }

    if (minDelta <= thresholdInches && guide) {
      newH = Math.max(MIN_ELEMENT_HEIGHT, bestSnapBottom - newY);
      activeGuides.push(guide);
    } else if (enableGrid) {
      newH = Math.max(MIN_ELEMENT_HEIGHT, snapToGrid(newH, gridStep));
    }
  }

  const clampedDim = clampDimensions(newX, newY, newW, newH, pageWidth, pageHeight);
  return {
    x: newX,
    y: newY,
    width: clampedDim.width,
    height: clampedDim.height,
    guides: activeGuides,
  };
}
