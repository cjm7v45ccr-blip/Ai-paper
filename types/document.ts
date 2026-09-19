export type DocumentMode =
  | "document"
  | "presentation"
  | "worksheet"
  | "report"
  | "study-guide"
  | "proposal"
  | "one-pager"
  | "blank"
  | "hybrid";

export type PageLayoutType =
  | "flow"
  | "visual"
  | "canvas"
  | "worksheet"
  | "table"
  | "report"
  | "presentation"
  | "study-guide"
  | "proposal"
  | "one-pager"
  | "blank"
  | "hybrid";

export interface DocumentComment {
  id: string;
  author: string;
  text: string;
  timestamp?: string;
  createdAt?: string;
  resolved?: boolean;
  elementId?: string;
}

export interface DocumentCitation {
  id: string;
  number?: number;
  text: string;
  url?: string;
}

export type ElementType =
  | "text"
  | "heading"
  | "richText"
  | "image"
  | "illustration"
  | "icon"
  | "shape"
  | "line"
  | "arrow"
  | "chart"
  | "table"
  | "diagram"
  | "flowchart"
  | "timeline"
  | "formula"
  | "callout"
  | "quote"
  | "divider"
  | "writingLines"
  | "drawingArea"
  | "imagePlaceholder"
  | "checkboxGroup"
  | "group"
  | "card"
  | "metric"
  | "pageBreak";

export interface ElementStyle {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderStyle?: "solid" | "dashed" | "dotted" | "none";
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: "normal" | "italic" | "oblique" | string;
  textDecoration?: "none" | "underline" | "line-through" | string;
  letterSpacing?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize" | string;
  textAlign?: "left" | "center" | "right" | "justify";
  opacity?: number;
  boxShadow?: string;
  padding?: number;
  lineHeight?: number;
  objectFit?: "contain" | "cover" | "fill";
  [key: string]: any;
}

export interface DocumentElement {
  id: string;
  type: ElementType;
  layoutMode?: "flow" | "canvas"; // flow = natural document stacking; canvas = freeform absolute positioning
  x: number; // inches (used when layoutMode === 'canvas')
  y: number; // inches (used when layoutMode === 'canvas')
  width: number; // inches
  height: number; // inches
  minWidth?: number; // inches
  minHeight?: number; // inches
  margin?: number; // inches
  padding?: number; // inches
  parentSectionId?: string;
  rotation?: number; // degrees
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  content?: any; // content payload tailored to type
  style?: ElementStyle;
  metadata?: {
    role?: string;
    label?: string;
    badge?: string;
    categoryBadge?: string;
    accentColor?: string;
    preserveAspectRatio?: boolean;
    formulaSymbol?: string;
    handCopyPrompt?: string;
    chartType?: "line" | "bar" | "step";
    [key: string]: any;
  };
}

export interface PageData {
  id: string;
  title?: string;
  layoutType?: PageLayoutType;
  speakerNotes?: string;
  elements: DocumentElement[];
  background?: string;
  isOverflowing?: boolean;
  computedHeightInches?: number;
  headerText?: string;
  footerText?: string;
  pageNumber?: number;
}

export interface DocumentPage {
  size: "letter" | "a4" | "presentation-16-9" | "custom";
  width: number; // 8.5 for US Letter
  height: number; // 11.0 for US Letter
  unit: "in";
  safeMargin: number; // 0.65 inches default print-safe margin
  background: string;
  orientation?: "portrait" | "landscape";
}

export interface DocumentTheme {
  name: string;
  headingFont: string;
  bodyFont: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}

export interface DocumentModel {
  id?: string;
  title?: string;
  mode?: DocumentMode;
  page: DocumentPage;
  theme: DocumentTheme;
  pages?: PageData[]; // Multi-page / multi-slide support
  elements: DocumentElement[]; // Single-page compatibility and fallback
  comments?: DocumentComment[];
  citations?: DocumentCitation[];
}

export type Operation =
  | { action: "add"; element: DocumentElement; pageIndex?: number }
  | { action: "update"; id: string; changes: Partial<DocumentElement>; pageIndex?: number }
  | { action: "delete"; id: string; pageIndex?: number }
  | { action: "move"; id: string; x: number; y: number; pageIndex?: number }
  | { action: "resize"; id: string; width: number; height: number; pageIndex?: number }
  | { action: "reorder"; id: string; zIndex: number; pageIndex?: number }
  | { action: "duplicate"; id: string; pageIndex?: number }
  | { action: "replace"; elements: DocumentElement[]; pageIndex?: number }
  | { action: "addPage"; page: PageData }
  | { action: "deletePage"; pageIndex: number }
  | { action: "switchMode"; mode: DocumentMode }
  | { action: "switchElementMode"; id: string; layoutMode: "flow" | "canvas"; pageIndex?: number }
  | { action: "paginate"; pageIndex?: number };

export interface QualityCheckIssue {
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
  fixAction?: "clampSafeMargins" | "resolveOverlaps" | "fixOverflow";
  elementIds?: string[];
}

export interface DesignReasoning {
  documentType: string;
  gridSystem: string;
  typographyPairing: string;
  colorPalette: string;
  semanticComponents: string[];
  printSafety: string;
}

export interface AIResponsePayload {
  message: string;
  operations: Operation[];
  qualityChecks: QualityCheckIssue[];
  designReasoning?: DesignReasoning;
}