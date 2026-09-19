import { DocumentModel, DocumentMode } from "@/types/document";
import {
  INITIAL_SAMPLE_DOCUMENT,
  SAMPLE_PRESENTATION_DECK,
  createBlankDocument,
} from "./sample-document";

export { createBlankDocument };

const STORAGE_KEY = "pagepilot_saved_documents_v1";
const ACTIVE_DOC_ID_KEY = "pagepilot_active_doc_id_v1";
const SEEDED_FLAG_KEY = "pagepilot_seeded_starter_v2";

export interface StoredDocumentMeta {
  id: string;
  title: string;
  mode: DocumentMode;
  updatedAt: number;
  createdAt: number;
  pageCount: number;
  elementCount: number;
  tags?: string[];
  isPinned?: boolean;
}

// Built-in starter documents to populate immediately if user has no saved documents
export const STARTER_DOCUMENTS: DocumentModel[] = [
  {
    ...INITIAL_SAMPLE_DOCUMENT,
    id: "doc-sample-compound-interest",
    title: "Compound Interest & Capital Growth",
    mode: "document",
  },
  {
    ...SAMPLE_PRESENTATION_DECK,
    id: "doc-sample-pagepilot-pitch",
    title: "PagePilot AI Workspace Pitch",
    mode: "presentation",
  },
  {
    id: "doc-sample-quantum-decoherence",
    title: "Quantum Computing & Decoherence Dynamics",
    mode: "presentation",
    page: {
      size: "letter",
      width: 8.5,
      height: 11.0,
      unit: "in",
      safeMargin: 0.65,
      background: "#ffffff",
    },
    theme: {
      name: "Modern Slate",
      headingFont: "Inter",
      bodyFont: "Inter",
      primaryColor: "#0f172a",
      accentColor: "#6366f1",
      backgroundColor: "#ffffff",
    },
    pages: [
      {
        id: "page-q1",
        title: "Executive Quantum Overview",
        elements: [
          {
            id: "q-head",
            type: "heading",
            layoutMode: "flow",
            x: 0.65,
            y: 0.65,
            width: 7.2,
            height: 1.1,
            zIndex: 1,
            content: {
              title: "Quantum Computing & Superposition Dynamics",
              subtitle: "Mathematical foundations of qubit decoherence, density matrices, and cryo-benchmarks.",
              badge: "QUANTUM PHYSICS",
            },
          },
          {
            id: "q-formula",
            type: "formula",
            layoutMode: "flow",
            x: 0.65,
            y: 1.9,
            width: 7.2,
            height: 1.5,
            zIndex: 2,
            content: {
              title: "Bloch Sphere State Representation",
              equation: "|\\psi\\rangle = \\cos\\left(\\frac{\\theta}{2}\\right)|0\\rangle + e^{i\\phi}\\sin\\left(\\frac{\\theta}{2}\\right)|1\\rangle",
              breakdown: [
                { symbol: "|\\psi\\rangle", label: "Single Qubit State" },
                { symbol: "\\theta", label: "Polar Angle (Superposition)" },
                { symbol: "\\phi", label: "Azimuthal Angle (Phase)" },
              ],
            },
          },
          {
            id: "q-callout",
            type: "callout",
            layoutMode: "flow",
            x: 0.65,
            y: 3.5,
            width: 7.2,
            height: 1.4,
            zIndex: 3,
            content: {
              title: "Decoherence Threshold",
              text: "T2 coherence time must surpass 150 microseconds under sub-20mK dilution refrigerator staging to support surface code error thresholds.",
            },
          },
        ],
      },
    ],
    elements: [],
  },
  {
    id: "doc-sample-cloud-strategy",
    title: "Executive Cloud & Distributed Systems Memo",
    mode: "document",
    page: {
      size: "letter",
      width: 8.5,
      height: 11.0,
      unit: "in",
      safeMargin: 0.65,
      background: "#ffffff",
    },
    theme: {
      name: "Executive Minimal",
      headingFont: "Inter",
      bodyFont: "Inter",
      primaryColor: "#09090b",
      accentColor: "#059669",
      backgroundColor: "#ffffff",
    },
    pages: [
      {
        id: "page-c1",
        title: "Infrastructure Strategy",
        elements: [
          {
            id: "c-head",
            type: "heading",
            layoutMode: "flow",
            x: 0.65,
            y: 0.65,
            width: 7.2,
            height: 1.1,
            zIndex: 1,
            content: {
              title: "Next-Gen Distributed Architecture Memo",
              subtitle: "Transitioning monolithic endpoints to partition-tolerant event streams with sub-5ms p99 SLAs.",
              badge: "SYSTEMS ARCHITECTURE",
            },
          },
          {
            id: "c-table",
            type: "table",
            layoutMode: "flow",
            x: 0.65,
            y: 1.9,
            width: 7.2,
            height: 2.2,
            zIndex: 2,
            content: {
              title: "Service Latency & Capex Projection",
              headers: ["Cluster Layer", "P95 Latency", "Monthly Capex", "Fault Tolerance"],
              rows: [
                ["Edge Ingress (Anycast)", "4.2 ms", "$14,200", "N+2 Redundant"],
                ["Event Broker (Kafka)", "1.8 ms", "$28,500", "Cross-AZ Quorum"],
                ["Distributed Cache (Redis)", "0.6 ms", "$19,800", "Multi-region Replica"],
                ["Document Store (Firestore)", "12.0 ms", "$8,400", "Multi-region Strong"],
              ],
            },
          },
          {
            id: "c-callout",
            type: "callout",
            layoutMode: "flow",
            x: 0.65,
            y: 4.2,
            width: 7.2,
            height: 1.3,
            zIndex: 3,
            content: {
              title: "Recommendation & Decision Timeline",
              text: "Begin canary migration for US-East traffic in Sprint 4. Freeze legacy database schema alterations by end of Q3.",
            },
          },
        ],
      },
    ],
    elements: [],
  },
];

/**
 * Loads all saved documents from local storage.
 * Seeds initial starter documents on the very first session only.
 */
export function getAllDocuments(): DocumentModel[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const alreadySeeded = localStorage.getItem(SEEDED_FLAG_KEY);
      if (!alreadySeeded) {
        localStorage.setItem(SEEDED_FLAG_KEY, "true");
        saveAllDocuments(STARTER_DOCUMENTS);
        return STARTER_DOCUMENTS;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Deduplicate by ID
      const seen = new Set<string>();
      const deduped: DocumentModel[] = [];
      for (const item of parsed) {
        if (item && item.id && !seen.has(item.id)) {
          seen.add(item.id);
          deduped.push(item);
        }
      }
      return deduped;
    }
    return [];
  } catch (err) {
    console.warn("Error reading documents from localStorage:", err);
    return [];
  }
}

/**
 * Persists all documents list to localStorage.
 */
export function saveAllDocuments(docs: DocumentModel[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.warn("Error saving documents to localStorage:", err);
  }
}

/**
 * Saves or updates a single document in storage.
 * Returns the saved document with ensured id.
 */
export function saveDocument(doc: DocumentModel): DocumentModel {
  const all = getAllDocuments();
  const docId = doc.id || `doc-${Date.now()}`;
  const docToSave: DocumentModel = {
    ...doc,
    id: docId,
  };

  const existingIndex = all.findIndex((d) => d.id === docId);
  let updatedDocs: DocumentModel[];

  if (existingIndex >= 0) {
    updatedDocs = [...all];
    updatedDocs[existingIndex] = docToSave;
  } else {
    updatedDocs = [docToSave, ...all];
  }

  saveAllDocuments(updatedDocs);
  setActiveDocumentId(docId);
  return docToSave;
}

/**
 * Deletes a document by ID.
 */
export function deleteDocument(docId: string): DocumentModel[] {
  const all = getAllDocuments();
  const filtered = all.filter((d) => d.id !== docId);
  saveAllDocuments(filtered);
  return filtered;
}

/**
 * Duplicates a document by ID.
 */
export function duplicateDocument(docId: string): DocumentModel | null {
  const all = getAllDocuments();
  const source = all.find((d) => d.id === docId);
  if (!source) return null;

  const newDoc: DocumentModel = {
    ...JSON.parse(JSON.stringify(source)),
    id: `doc-${Date.now()}`,
    title: `${source.title || "Untitled"} (Copy)`,
  };

  const updated = [newDoc, ...all];
  saveAllDocuments(updated);
  return newDoc;
}

/**
 * Gets the active document ID.
 */
export function getActiveDocumentId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_DOC_ID_KEY);
}

/**
 * Sets the active document ID.
 */
export function setActiveDocumentId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_DOC_ID_KEY, id);
}
