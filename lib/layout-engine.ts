/**
 * Smart Layout & Pagination Engine for Hybrid Document & Presentation Editor.
 * Enforces strict US Letter 8.5 x 11 inches specification with 0.65" margins.
 */

import { DocumentModel, DocumentElement, PageData, ElementType } from "@/types/document";
import {
  PAGE_WIDTH_IN,
  PAGE_HEIGHT_IN,
  PAGE_MARGIN_IN,
  DPI,
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_CONTENT_WIDTH,
  PAGE_CONTENT_HEIGHT,
} from "./coordinates";

export const PRINTABLE_WIDTH_INCHES = PAGE_WIDTH_IN - PAGE_MARGIN_IN * 2; // 7.2"
export const PRINTABLE_HEIGHT_INCHES = PAGE_HEIGHT_IN - PAGE_MARGIN_IN * 2; // 9.7"
export const MIN_BOTTOM_SPACE_FOR_HEADING = 1.4; // 1.4 inches minimum space for heading + following paragraph

/**
 * Estimates height in inches of an element based on its type and content length.
 */
export function estimateElementHeight(el: DocumentElement): number {
  if (el.height && el.height > 0.2) {
    return el.height;
  }

  const type = el.type;
  switch (type) {
    case "heading": {
      const level = el.style?.fontSize ? (el.style.fontSize > 24 ? 1 : 2) : 1;
      return level === 1 ? 0.85 : 0.6;
    }
    case "text":
    case "richText": {
      const text = typeof el.content === "string" ? el.content : JSON.stringify(el.content || "");
      const lines = Math.ceil(text.length / 80) || 1;
      return Math.max(0.4, lines * 0.25 + 0.15);
    }
    case "quote":
      return 0.9;
    case "callout": {
      const body = typeof el.content === "object" ? el.content?.body || "" : String(el.content || "");
      const lines = Math.ceil(body.length / 75) || 1;
      return Math.max(0.8, 0.5 + lines * 0.22);
    }
    case "table": {
      const rows = Array.isArray(el.content?.rows) ? el.content.rows.length : 3;
      return Math.max(1.2, 0.4 + rows * 0.35);
    }
    case "chart":
      return 2.5;
    case "timeline":
      return 2.4;
    case "diagram":
      return 2.2;
    case "card":
    case "metric":
      return 1.4;
    case "writingLines":
      return 1.5;
    case "divider":
      return 0.3;
    case "pageBreak":
      return 0.4;
    default:
      return 1.0;
  }
}

/**
 * Calculates the running flow layout of elements on a page.
 * Returns element placements (y offset) and whether the page overflows 11".
 */
export function computePageFlowLayout(page: PageData): {
  computedElements: DocumentElement[];
  totalHeightInches: number;
  isOverflowing: boolean;
  overflowIndex: number; // index of first element that breaches page boundary
} {
  let currentY = PAGE_MARGIN_IN;
  const elements = page.elements || [];
  const computed: DocumentElement[] = [];
  let overflowIndex = -1;

  for (let i = 0; i < elements.length; i++) {
    const el = { ...elements[i] };
    const h = estimateElementHeight(el);
    el.height = h;

    if (el.layoutMode === "canvas") {
      // Freeform canvas element: preserves user x & y
      computed.push(el);
      const bottom = (el.y || PAGE_MARGIN_IN) + h;
      if (bottom > PAGE_HEIGHT_IN - PAGE_MARGIN_IN && overflowIndex === -1) {
        overflowIndex = i;
      }
    } else {
      // Document flow element: stacks vertically
      el.layoutMode = "flow";
      el.x = PAGE_MARGIN_IN;
      el.width = el.width && el.width > 0 ? el.width : PRINTABLE_WIDTH_INCHES;
      el.y = currentY;

      // Check heading orphan prevention: if this is a heading and there is not enough room for heading + next block
      if (el.type === "heading" && i < elements.length - 1) {
        if (currentY + h + MIN_BOTTOM_SPACE_FOR_HEADING > PAGE_HEIGHT_IN - PAGE_MARGIN_IN) {
          if (overflowIndex === -1) overflowIndex = i;
        }
      }

      if (currentY + h > PAGE_HEIGHT_IN - PAGE_MARGIN_IN && overflowIndex === -1) {
        overflowIndex = i;
      }

      currentY += h + (el.margin ?? 0.15); // inter-element vertical margin
      computed.push(el);
    }
  }

  const isOverflowing = overflowIndex !== -1 || currentY > PAGE_HEIGHT_IN - PAGE_MARGIN_IN;

  return {
    computedElements: computed,
    totalHeightInches: currentY,
    isOverflowing,
    overflowIndex,
  };
}

/**
 * Automatically paginates a document:
 * Traverses pages and redistributes overflowing flow elements onto next pages,
 * creating new pages as needed while keeping headings with following content.
 */
export function autoPaginateDocument(doc: DocumentModel): DocumentModel {
  const newPages: PageData[] = [];
  const originalPages = doc.pages && doc.pages.length > 0 ? doc.pages : [{ id: "page-1", title: doc.title || "Page 1", elements: doc.elements || [] }];

  for (let p = 0; p < originalPages.length; p++) {
    const page = originalPages[p];
    let pageElements = [...(page.elements || [])];
    let pageNumber = newPages.length + 1;

    while (pageElements.length > 0) {
      const currentPageElements: DocumentElement[] = [];
      const overflowElements: DocumentElement[] = [];
      let currentY = PAGE_MARGIN_IN;

      for (let i = 0; i < pageElements.length; i++) {
        const el = { ...pageElements[i] };
        const h = estimateElementHeight(el);
        el.height = h;

        // Manual Page Break
        if (el.type === "pageBreak") {
          overflowElements.push(...pageElements.slice(i + 1));
          break;
        }

        if (el.layoutMode === "canvas") {
          currentPageElements.push(el);
          continue;
        }

        // Check if adding this flow element overflows page limit
        const spaceRemaining = PAGE_HEIGHT_IN - PAGE_MARGIN_IN - currentY;
        const isHeading = el.type === "heading";

        if (isHeading && i < pageElements.length - 1 && spaceRemaining < MIN_BOTTOM_SPACE_FOR_HEADING) {
          // Orphan heading prevention: push heading + rest to next page
          overflowElements.push(...pageElements.slice(i));
          break;
        }

        if (h > spaceRemaining && currentPageElements.length > 0) {
          // Block overflows, push to next page
          overflowElements.push(...pageElements.slice(i));
          break;
        }

        el.y = currentY;
        el.x = PAGE_MARGIN_IN;
        el.width = el.width || PRINTABLE_WIDTH_INCHES;
        currentPageElements.push(el);
        currentY += h + (el.margin ?? 0.15);
      }

      newPages.push({
        id: `page-${pageNumber}`,
        title: pageNumber === 1 ? page.title || "Introduction" : `Page ${pageNumber}`,
        elements: currentPageElements,
        background: page.background,
        isOverflowing: false,
        computedHeightInches: currentY,
      });

      pageElements = overflowElements;
      pageNumber++;
    }
  }

  // Ensure at least one page
  if (newPages.length === 0) {
    newPages.push({
      id: "page-1",
      title: "Document",
      elements: [],
    });
  }

  return {
    ...doc,
    pages: newPages,
    elements: newPages[0]?.elements || [],
  };
}

/**
 * Transforms a page into a rich visual layout (portrait presentation / executive summary)
 */
export function turnPageIntoVisual(page: PageData): PageData {
  const elements = [...page.elements];
  const transformed: DocumentElement[] = [];
  const heading = elements.find((el) => el.type === "heading");

  if (heading) {
    transformed.push({
      ...heading,
      x: PAGE_MARGIN_IN,
      y: PAGE_MARGIN_IN,
      width: PRINTABLE_WIDTH_INCHES,
      height: 0.9,
      layoutMode: "canvas",
      style: {
        ...heading.style,
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "left",
      },
    });
  }

  const nonHeadings = elements.filter((el) => el.type !== "heading");
  const count = nonHeadings.length;

  // Lay out remaining elements into visual card / bento layout
  if (count <= 2) {
    nonHeadings.forEach((el, idx) => {
      transformed.push({
        ...el,
        x: PAGE_MARGIN_IN,
        y: 1.8 + idx * 3.8,
        width: PRINTABLE_WIDTH_INCHES,
        height: 3.5,
        layoutMode: "canvas",
        style: {
          ...el.style,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(99, 102, 241, 0.2)",
          backgroundColor: "#161824",
          padding: 18,
        },
      });
    });
  } else if (count <= 4) {
    const colWidth = (PRINTABLE_WIDTH_INCHES - 0.25) / 2; // ~3.475"
    nonHeadings.forEach((el, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      transformed.push({
        ...el,
        x: PAGE_MARGIN_IN + col * (colWidth + 0.25),
        y: 1.8 + row * 3.8,
        width: colWidth,
        height: 3.6,
        layoutMode: "canvas",
        style: {
          ...el.style,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.08)",
          backgroundColor: "#151720",
          padding: 16,
        },
      });
    });
  } else {
    // 3 columns bento
    const colWidth = (PRINTABLE_WIDTH_INCHES - 0.3) / 3;
    nonHeadings.forEach((el, idx) => {
      const col = idx % 3;
      const row = Math.floor(idx / 3);
      transformed.push({
        ...el,
        x: PAGE_MARGIN_IN + col * (colWidth + 0.15),
        y: 1.8 + row * 2.8,
        width: colWidth,
        height: 2.6,
        layoutMode: "canvas",
        style: {
          ...el.style,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.08)",
          backgroundColor: "#151720",
          padding: 14,
        },
      });
    });
  }

  return {
    ...page,
    elements: transformed,
  };
}

/**
 * Transforms a visual page back into a clean, structured flowing document (Google Docs style)
 */
export function turnPageIntoDocumentFlow(page: PageData): PageData {
  let runningY = PAGE_MARGIN_IN;
  const transformed: DocumentElement[] = page.elements.map((el) => {
    const h = estimateElementHeight(el);
    const flowEl: DocumentElement = {
      ...el,
      layoutMode: "flow",
      x: PAGE_MARGIN_IN,
      y: runningY,
      width: PRINTABLE_WIDTH_INCHES,
      height: h,
      style: {
        ...el.style,
        backgroundColor: undefined,
        borderColor: undefined,
        borderWidth: undefined,
        boxShadow: undefined,
      },
    };
    runningY += h + 0.2;
    return flowEl;
  });

  return {
    ...page,
    elements: transformed,
  };
}

/**
 * Balances the layout and reduces empty space on the page
 */
export function balancePageLayout(page: PageData): PageData {
  const elements = [...page.elements];
  if (elements.length === 0) return page;

  // Distribute spacing evenly between PAGE_MARGIN_IN and bottom margin
  const availableHeight = PRINTABLE_HEIGHT_INCHES;
  const totalItemHeight = elements.reduce((acc, el) => acc + estimateElementHeight(el), 0);
  const remainingSpace = Math.max(0, availableHeight - totalItemHeight);
  const gap = elements.length > 1 ? remainingSpace / (elements.length + 1) : 0.2;

  let currentY = PAGE_MARGIN_IN + gap;
  const balanced = elements.map((el) => {
    const h = estimateElementHeight(el);
    const updated: DocumentElement = {
      ...el,
      y: currentY,
      x: el.layoutMode === "canvas" ? el.x : PAGE_MARGIN_IN,
      width: el.layoutMode === "canvas" ? el.width : PRINTABLE_WIDTH_INCHES,
    };
    currentY += h + gap;
    return updated;
  });

  return {
    ...page,
    elements: balanced,
  };
}
