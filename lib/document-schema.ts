import { z } from "zod";

export const ElementStyleSchema = z.object({
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(),
  borderRadius: z.number().optional(),
  borderStyle: z.enum(["solid", "dashed", "dotted", "none"]).optional(),
  fontSize: z.number().optional(),
  fontWeight: z.union([z.number(), z.string()]).optional(),
  fontFamily: z.string().optional(),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  opacity: z.number().optional(),
  padding: z.number().optional(),
  lineHeight: z.number().optional(),
});

export const DocumentElementSchema = z.object({
  id: z.string(),
  type: z.enum([
    "text",
    "heading",
    "richText",
    "image",
    "illustration",
    "icon",
    "shape",
    "line",
    "arrow",
    "chart",
    "table",
    "diagram",
    "flowchart",
    "timeline",
    "formula",
    "callout",
    "quote",
    "divider",
    "writingLines",
    "drawingArea",
    "imagePlaceholder",
    "checkboxGroup",
    "group",
  ]),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional().default(0),
  zIndex: z.number().default(1),
  locked: z.boolean().optional().default(false),
  visible: z.boolean().optional().default(true),
  content: z.any().optional(),
  style: ElementStyleSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export const OperationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add"),
    element: DocumentElementSchema,
  }),
  z.object({
    action: z.literal("update"),
    id: z.string(),
    changes: z.record(z.any()),
  }),
  z.object({
    action: z.literal("delete"),
    id: z.string(),
  }),
  z.object({
    action: z.literal("move"),
    id: z.string(),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    action: z.literal("resize"),
    id: z.string(),
    width: z.number(),
    height: z.number(),
  }),
  z.object({
    action: z.literal("reorder"),
    id: z.string(),
    zIndex: z.number(),
  }),
  z.object({
    action: z.literal("duplicate"),
    id: z.string(),
  }),
  z.object({
    action: z.literal("replace"),
    elements: z.array(DocumentElementSchema),
  }),
]);

export const QualityCheckSchema = z.object({
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
  suggestion: z.string().optional(),
  fixAction: z.enum(["clampSafeMargins", "resolveOverlaps", "fixOverflow"]).optional(),
  elementIds: z.array(z.string()).optional(),
});

export const AIResponseSchema = z.object({
  message: z.string(),
  operations: z.array(OperationSchema),
  qualityChecks: z.array(QualityCheckSchema).default([]),
});