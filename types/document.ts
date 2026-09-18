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
  | "group";

export interface ElementStyle {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  borderStyle?: "solid" | "dashed" | "dotted" | "none";
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  opacity?: number;
  boxShadow?: string;
  padding?: number;
  lineHeight?: number;
}

export interface DocumentElement {
  id: string;
  type: ElementType;
  x: number; // inches
  y: number; // inches
  width: number; // inches
  height: number; // inches
  rotation?: number; // degrees
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
  content?: any; // content payload tailored to type
  style?: ElementStyle;
  metadata?: {
    role?: string;
    label?: string;
    formulaSymbol?: string;
    handCopyPrompt?: string;
    chartType?: "line" | "bar" | "step";
    [key: string]: any;
  };
}

export interface DocumentPage {
  size: "letter";
  width: number; // 8.5
  height: number; // 11
  unit: "in";
  safeMargin: number; // 0.45
  background: string;
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
  page: DocumentPage;
  theme: DocumentTheme;
  elements: DocumentElement[];
}

export type Operation =
  | { action: "add"; element: DocumentElement }
  | { action: "update"; id: string; changes: Partial<DocumentElement> }
  | { action: "delete"; id: string }
  | { action: "move"; id: string; x: number; y: number }
  | { action: "resize"; id: string; width: number; height: number }
  | { action: "reorder"; id: string; zIndex: number }
  | { action: "duplicate"; id: string }
  | { action: "replace"; elements: DocumentElement[] };

export interface QualityCheckIssue {
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
  fixAction?: "clampSafeMargins" | "resolveOverlaps" | "fixOverflow";
  elementIds?: string[];
}

export interface AIResponsePayload {
  message: string;
  operations: Operation[];
  qualityChecks: QualityCheckIssue[];
}