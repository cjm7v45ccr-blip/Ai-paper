import { DocumentModel, Operation, DocumentElement } from "@/types/document";
import { clampElementBounds, clampPosition, clampDimensions, PAGE_WIDTH_INCHES, PAGE_HEIGHT_INCHES } from "./coordinates";

export function applyOperations(
  currentDoc: DocumentModel,
  operations: Operation[]
): DocumentModel {
  const pageWidth = currentDoc.page?.width || PAGE_WIDTH_INCHES;
  const pageHeight = currentDoc.page?.height || PAGE_HEIGHT_INCHES;
  let updatedElements = [...currentDoc.elements];

  for (const op of operations) {
    switch (op.action) {
      case "add": {
        const clamped = clampElementBounds(op.element, pageWidth, pageHeight);
        const existingIdx = updatedElements.findIndex((el) => el.id === clamped.id);
        if (existingIdx >= 0) {
          updatedElements[existingIdx] = clamped;
        } else {
          updatedElements.push(clamped);
        }
        break;
      }
      case "update": {
        updatedElements = updatedElements.map((el) => {
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
        break;
      }
      case "delete": {
        updatedElements = updatedElements.filter((el) => el.id !== op.id);
        break;
      }
      case "move": {
        updatedElements = updatedElements.map((el) => {
          if (el.id === op.id) {
            const pos = clampPosition(op.x, op.y, el.width, el.height, pageWidth, pageHeight);
            return { ...el, x: pos.x, y: pos.y };
          }
          return el;
        });
        break;
      }
      case "resize": {
        updatedElements = updatedElements.map((el) => {
          if (el.id === op.id) {
            const dims = clampDimensions(el.x, el.y, op.width, op.height, pageWidth, pageHeight);
            return { ...el, width: dims.width, height: dims.height };
          }
          return el;
        });
        break;
      }
      case "duplicate": {
        const target = updatedElements.find((el) => el.id === op.id);
        if (target) {
          const maxZ = updatedElements.reduce((max, e) => Math.max(max, e.zIndex || 1), 1);
          // 0.2 inch offset, clamped
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
          updatedElements.push(duplicated);
        }
        break;
      }
      case "reorder": {
        updatedElements = updatedElements.map((el) =>
          el.id === op.id ? { ...el, zIndex: op.zIndex } : el
        );
        break;
      }
      case "replace": {
        updatedElements = op.elements.map((el) => clampElementBounds(el, pageWidth, pageHeight));
        break;
      }
    }
  }

  // Sort elements by zIndex to preserve layer order
  updatedElements.sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

  return {
    ...currentDoc,
    elements: updatedElements,
  };
}