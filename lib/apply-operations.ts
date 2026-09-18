import { DocumentModel, Operation, DocumentElement, PageData } from "@/types/document";
import { clampElementBounds, clampPosition, clampDimensions, PAGE_WIDTH_INCHES, PAGE_HEIGHT_INCHES } from "./coordinates";

export function applyOperations(
  currentDoc: DocumentModel,
  operations: Operation[]
): DocumentModel {
  const pageWidth = currentDoc.page?.width || PAGE_WIDTH_INCHES;
  const pageHeight = currentDoc.page?.height || PAGE_HEIGHT_INCHES;
  
  // Ensure pages array is initialized
  let updatedPages: PageData[] = currentDoc.pages && currentDoc.pages.length > 0
    ? JSON.parse(JSON.stringify(currentDoc.pages))
    : [
        {
          id: "page-1",
          title: "Page 1",
          elements: currentDoc.elements ? JSON.parse(JSON.stringify(currentDoc.elements)) : [],
        },
      ];

  let activePageIndex = 0;

  for (const op of operations) {
    const opPageIndex = "pageIndex" in op ? op.pageIndex : undefined;
    const targetPageIndex =
      opPageIndex !== undefined && opPageIndex >= 0 && opPageIndex < updatedPages.length
        ? opPageIndex
        : activePageIndex;
    
    let currentElements = [...(updatedPages[targetPageIndex]?.elements || [])];

    switch (op.action) {
      case "add": {
        const clamped = clampElementBounds(op.element, pageWidth, pageHeight);
        const existingIdx = currentElements.findIndex((el) => el.id === clamped.id);
        if (existingIdx >= 0) {
          currentElements[existingIdx] = clamped;
        } else {
          currentElements.push(clamped);
        }
        updatedPages[targetPageIndex].elements = currentElements;
        break;
      }
      case "update": {
        currentElements = currentElements.map((el) => {
          if (el.id === op.id) {
            const merged = {
              ...el,
              ...op.changes,
              style: {
                ...el.style,
                ...(op.changes.style || {}),
              },
              metadata: {
                ...el.metadata,
                ...(op.changes.metadata || {}),
              },
            };
            return clampElementBounds(merged, pageWidth, pageHeight);
          }
          return el;
        });
        updatedPages[targetPageIndex].elements = currentElements;
        break;
      }
      case "delete": {
        currentElements = currentElements.filter((el) => el.id !== op.id);
        updatedPages[targetPageIndex].elements = currentElements;
        break;
      }
      case "move": {
        currentElements = currentElements.map((el) => {
          if (el.id === op.id) {
            const pos = clampPosition(op.x, op.y, el.width, el.height, pageWidth, pageHeight);
            return { ...el, x: pos.x, y: pos.y };
          }
          return el;
        });
        updatedPages[targetPageIndex].elements = currentElements;
        break;
      }
      case "resize": {
        currentElements = currentElements.map((el) => {
          if (el.id === op.id) {
            const dims = clampDimensions(el.x, el.y, op.width, op.height, pageWidth, pageHeight);
            return { ...el, width: dims.width, height: dims.height };
          }
          return el;
        });
        updatedPages[targetPageIndex].elements = currentElements;
        break;
      }
      case "duplicate": {
        const target = currentElements.find((el) => el.id === op.id);
        if (target) {
          const maxZ = currentElements.reduce((max, e) => Math.max(max, e.zIndex || 1), 1);
          const offsetPos = clampPosition(
            target.x + 0.2,
            target.y + 0.2,
            target.width,
            target.height,
            pageWidth,
            pageHeight
          );
          const duplicated: DocumentElement = {
            ...JSON.parse(JSON.stringify(target)),
            id: `el-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            x: offsetPos.x,
            y: offsetPos.y,
            zIndex: maxZ + 1,
            metadata: {
              ...(target.metadata || {}),
              label: target.metadata?.label ? `${target.metadata.label} (Copy)` : undefined,
            },
          };
          currentElements.push(duplicated);
        }
        updatedPages[targetPageIndex].elements = currentElements;
        break;
      }
      case "reorder": {
        currentElements = currentElements.map((el) =>
          el.id === op.id ? { ...el, zIndex: op.zIndex } : el
        );
        updatedPages[targetPageIndex].elements = currentElements;
        break;
      }
      case "replace": {
        currentElements = op.elements.map((el) => clampElementBounds(el, pageWidth, pageHeight));
        updatedPages[targetPageIndex].elements = currentElements;
        break;
      }
      case "addPage": {
        updatedPages.push(op.page);
        break;
      }
      case "deletePage": {
        if (updatedPages.length > 1 && op.pageIndex >= 0 && op.pageIndex < updatedPages.length) {
          updatedPages.splice(op.pageIndex, 1);
        }
        break;
      }
      case "switchMode": {
        currentDoc.mode = op.mode;
        break;
      }
    }
  }

  // Preserve layer order per page
  updatedPages.forEach((page) => {
    if (page.elements) {
      page.elements.sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
    }
  });

  return {
    ...currentDoc,
    pages: updatedPages,
    elements: updatedPages[0]?.elements || [],
  };
}