import { DocumentModel, QualityCheckIssue, DocumentElement } from "@/types/document";
import { clampPosition, PAGE_WIDTH_INCHES, PAGE_HEIGHT_INCHES, SAFE_MARGIN_INCHES } from "./coordinates";

export function runDeterministicQualityChecks(doc: DocumentModel): QualityCheckIssue[] {
  const issues: QualityCheckIssue[] = [];
  const safeMargin = doc.page?.safeMargin ?? SAFE_MARGIN_INCHES;
  const pageWidth = doc.page?.width ?? PAGE_WIDTH_INCHES;
  const pageHeight = doc.page?.height ?? PAGE_HEIGHT_INCHES;

  // 1. Page Boundary Breaches (Strict Errors)
  for (const el of doc.elements) {
    if (el.visible === false) continue;

    const right = el.x + el.width;
    const bottom = el.y + el.height;

    if (el.x < -0.01 || el.y < -0.01 || right > pageWidth + 0.01 || bottom > pageHeight + 0.01) {
      issues.push({
        severity: "error",
        message: `Element "${el.metadata?.label || el.id}" is outside the physical page boundary.`,
        suggestion: `Move or resize element to fit within ${pageWidth}" × ${pageHeight}".`,
        fixAction: "clampSafeMargins",
        elementIds: [el.id],
      });
    }
  }

  // 2. Safe Margin Boundaries (Warnings)
  for (const el of doc.elements) {
    if (el.visible === false) continue;

    const right = el.x + el.width;
    const bottom = el.y + el.height;

    const breachesLeft = el.x < safeMargin - 0.02;
    const breachesTop = el.y < safeMargin - 0.02;
    const breachesRight = right > pageWidth - safeMargin + 0.02;
    const breachesBottom = bottom > pageHeight - safeMargin + 0.02;

    if (breachesLeft || breachesTop || breachesRight || breachesBottom) {
      const sides: string[] = [];
      if (breachesLeft) sides.push("left");
      if (breachesTop) sides.push("top");
      if (breachesRight) sides.push("right");
      if (breachesBottom) sides.push("bottom");

      issues.push({
        severity: "warning",
        message: `Element "${el.metadata?.label || el.type}" extends past the ${safeMargin}" print safe margin (${sides.join(", ")}).`,
        suggestion: `Adjust position or dimensions so it remains inside the safe print area.`,
        fixAction: "clampSafeMargins",
        elementIds: [el.id],
      });
    }
  }

  // 3. AABB Collision / Overlap Auditing
  for (let i = 0; i < doc.elements.length; i++) {
    for (let j = i + 1; j < doc.elements.length; j++) {
      const a = doc.elements[i];
      const b = doc.elements[j];

      if (a.visible === false || b.visible === false) continue;
      // Skip groups or background dividers
      if (a.type === "group" || b.type === "group") continue;
      if (a.type === "divider" || b.type === "divider") continue;

      const aRight = a.x + a.width;
      const aBottom = a.y + a.height;
      const bRight = b.x + b.width;
      const bBottom = b.y + b.height;

      const isColliding =
        a.x < bRight - 0.1 &&
        aRight > b.x + 0.1 &&
        a.y < bBottom - 0.1 &&
        aBottom > b.y + 0.1;

      if (isColliding) {
        issues.push({
          severity: "info",
          message: `Overlap detected between "${a.metadata?.label || a.type}" and "${b.metadata?.label || b.type}".`,
          suggestion: `Nudge one of the elements down or resize to prevent visual collision.`,
          fixAction: "resolveOverlaps",
          elementIds: [a.id, b.id],
        });
      }
    }
  }

  // 4. Minimum text readability check
  for (const el of doc.elements) {
    if (el.style?.fontSize && el.style.fontSize < 8) {
      issues.push({
        severity: "warning",
        message: `Small font size (${el.style.fontSize}pt) on "${el.metadata?.label || el.id}" will be difficult to read in print.`,
        suggestion: `Increase font size to at least 9pt for body text or 14pt for headings.`,
        elementIds: [el.id],
      });
    }
  }

  // 5. Page Density & Utilization
  let totalArea = 0;
  const pageArea = pageWidth * pageHeight;
  for (const el of doc.elements) {
    if (el.visible !== false) {
      totalArea += el.width * el.height;
    }
  }
  const density = totalArea / pageArea;
  if (density > 0.85) {
    issues.push({
      severity: "info",
      message: `High page density (${Math.round(density * 100)}% coverage). Canvas may feel crowded.`,
      suggestion: `Consider increasing whitespace or moving secondary notes into a summary callout.`,
    });
  }

  return issues;
}

/**
 * Automatically adjusts all elements to fit strictly inside safe margins.
 */
export function autoFixSafeMargins(doc: DocumentModel): DocumentModel {
  const safeMargin = doc.page?.safeMargin ?? SAFE_MARGIN_INCHES;
  const pageWidth = doc.page?.width ?? PAGE_WIDTH_INCHES;
  const pageHeight = doc.page?.height ?? PAGE_HEIGHT_INCHES;
  const safeWidth = pageWidth - 2 * safeMargin;
  const safeHeight = pageHeight - 2 * safeMargin;

  const updatedElements = doc.elements.map((el) => {
    let w = el.width;
    let h = el.height;
    let x = el.x;
    let y = el.y;

    // Shrink if wider than safe area
    if (w > safeWidth) {
      w = safeWidth;
    }
    if (h > safeHeight) {
      h = safeHeight;
    }

    // Reposition within safe margin box
    if (x < safeMargin) x = safeMargin;
    if (x + w > pageWidth - safeMargin) {
      x = pageWidth - safeMargin - w;
    }
    if (y < safeMargin) y = safeMargin;
    if (y + h > pageHeight - safeMargin) {
      y = pageHeight - safeMargin - h;
    }

    const pos = clampPosition(x, y, w, h, pageWidth, pageHeight);

    return {
      ...el,
      x: Math.round(pos.x * 100) / 100,
      y: Math.round(pos.y * 100) / 100,
      width: Math.round(w * 100) / 100,
      height: Math.round(h * 100) / 100,
    };
  });

  return {
    ...doc,
    elements: updatedElements,
  };
}

/**
 * Automatically resolves overlaps by pushing lower overlapping elements downward.
 */
export function autoFixOverlaps(doc: DocumentModel): DocumentModel {
  const safeMargin = doc.page?.safeMargin ?? SAFE_MARGIN_INCHES;
  const pageHeight = doc.page?.height ?? PAGE_HEIGHT_INCHES;
  const maxBottom = pageHeight - safeMargin;

  // Sort by Y position
  const elements = [...doc.elements].sort((a, b) => a.y - b.y);

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const top = elements[i];
      const bottom = elements[j];

      const aRight = top.x + top.width;
      const aBottom = top.y + top.height;
      const bRight = bottom.x + bottom.width;
      const bBottom = bottom.y + bottom.height;

      // Check horizontal overlap
      const hasHOverlap = top.x < bRight - 0.05 && aRight > bottom.x + 0.05;
      if (hasHOverlap && bottom.y < aBottom + 0.1) {
        // Shift bottom element down
        const newY = Math.min(aBottom + 0.15, maxBottom - bottom.height);
        elements[j] = {
          ...bottom,
          y: Math.round(newY * 100) / 100,
        };
      }
    }
  }

  return {
    ...doc,
    elements,
  };
}