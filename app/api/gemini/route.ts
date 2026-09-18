import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, getGeminiModelName } from "@/lib/gemini";
import { AIResponseSchema } from "@/lib/document-schema";
import { DocumentModel, Operation } from "@/types/document";
import { autoFixSafeMargins, autoFixOverlaps } from "@/lib/quality-checks";
import { INITIAL_SAMPLE_DOCUMENT } from "@/lib/sample-document";
import { autoDesignDocument, buildChemistryMeasurementGuide } from "@/lib/smart-layout-architect";

export const dynamic = "force-dynamic";

const LAYOUT_SYSTEM_INSTRUCTION = `
You are PagePilot, an elite AI publication layout architect and visual document designer (like Google Docs on steroids).
Users describe documents they want on an 8.5 x 11 inch canvas (US Letter, portrait).
Your job is to reason through content deeply, understand semantic entities, calculate optical balance, establish typography hierarchy, and return operations to construct or update the document.

DOCUMENT METRICS:
- Page width: 8.5 inches.
- Page height: 11.0 inches.
- Print Safe Margin: 0.45 inches on all 4 borders. (Valid X: 0.45 to 8.05. Valid Y: 0.45 to 10.55).
- Content column width: 7.4 inches (single column) or 3.58 inches (dual column with 0.24" gutter).
- All element coordinates (x, y, width, height) MUST BE IN INCHES.

CRITICAL DESIGN PRINCIPLES:
1. SEMANTIC DECONSTRUCTION: Analyze all entities (headings, formulas, mnemonics, tables, comparisons). Eliminate repetitive bad numbering (e.g., converting repeated "1." into organized hierarchical sections §1, §2, §3 or clean chips).
2. FORMULA ELEVATION: Convert mathematical and scientific equations into styled formula cards with KaTeX equations and parameter breakdown keys.
3. PRINT SAFETY: NEVER place elements outside safe margins (0.45" to 8.05" X, 0.45" to 10.55" Y). Clamping is strictly required.
4. BALANCED GEOMETRY: Keep dual columns visually balanced in vertical height. Maintain 0.12" to 0.20" vertical gutters between elements.
5. COLOR HARMONY & CONTRAST: Use refined palettes (Emerald Lab, Modern Indigo, Executive Slate) with 7+:1 text contrast. Avoid mismatched pastel soup.

RESPONSE JSON FORMAT - return ONLY valid JSON:
{
  "message": "Friendly conversational explanation of the layout design decisions (1-2 sentences)",
  "designReasoning": {
    "documentType": "e.g. Chemistry Laboratory Reference & Study Guide",
    "gridSystem": "e.g. 2-column balanced bento grid (0.24\" gutter, 0.45\" bleed)",
    "typographyPairing": "e.g. Inter 800 Display + Inter Regular (1.25 modular scale)",
    "colorPalette": "e.g. Emerald Clinical Lab (#064e3b, #f0fdf4, #1e293b)",
    "semanticComponents": [
      "Converted raw formulas into KaTeX formula cards with variable keys",
      "Replaced repetitive '1.' markers with sequential sections §1 through §6",
      "Structured qualitative vs quantitative comparisons into high-contrast cards"
    ],
    "printSafety": "100% compliant with 0.45\" print bleed"
  },
  "operations": [
    { "action": "add", "element": { ... } },
    { "action": "update", "id": "element-id", "changes": { ... } },
    { "action": "delete", "id": "element-id" },
    { "action": "move", "id": "element-id", "x": 1.0, "y": 2.0 },
    { "action": "resize", "id": "element-id", "width": 3.0, "height": 2.0 },
    { "action": "replace", "elements": [ ... ] }
  ],
  "qualityChecks": []
}
`;

const CHAT_SYSTEM_INSTRUCTION = `
You are PagePilot, a friendly, smart, and knowledgeable AI design assistant embedded in a professional document editor.
You help users create, edit, and refine beautiful 8.5 x 11 inch printable documents.
You are conversational, enthusiastic, and genuinely helpful. You explain design decisions clearly and concisely.
You have deep knowledge of typography, layout design, print standards, and educational document creation.
Keep replies warm, concise, and actionable. When users ask questions, give clear helpful answers.
If they want to make changes to the document, guide them clearly.
Never be robotic — talk like a brilliant creative colleague who truly cares about helping.
`;

function isLayoutRequest(prompt: string): boolean {
  const layoutKeywords = [
    "add", "create", "insert", "put", "place", "make", "build", "generate", "design",
    "fix", "repair", "move", "resize", "delete", "remove", "change", "update", "modify",
    "adjust", "align", "center", "shift", "rearrange", "reorder", "layout", "format",
    "replace", "swap", "duplicate", "clear", "reset",
    "bigger", "smaller", "wider", "narrower", "taller", "shorter",
    "color", "style", "font", "border", "background", "fill",
    "chart", "table", "heading", "title", "formula", "diagram", "lines", "text",
    "template", "page", "margin", "overflow", "overlap", "collision",
    "make this", "set the", "turn this", "convert", "apply", "give me", "show me",
  ];
  const p = prompt.toLowerCase();
  return layoutKeywords.some((kw) => p.includes(kw));
}

function repairJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

function generateDeterministicFallback(
  prompt: string,
  currentDocument?: DocumentModel,
  selectedElementId?: string
): { message: string; operations: Operation[]; qualityChecks: any[]; designReasoning?: any } {
  const doc = (currentDocument && currentDocument.elements) ? currentDocument : INITIAL_SAMPLE_DOCUMENT;
  const p = prompt.toLowerCase();

  // If specific element selected and small modification requested
  if (selectedElementId) {
    const el = doc.elements.find((e) => e.id === selectedElementId);
    if (el) {
      if (p.includes("wider")) {
        const newW = Math.min(7.5, el.width * 1.2);
        return {
          message: `Expanded width of "${el.metadata?.label || el.id}" to ${newW.toFixed(2)}".`,
          operations: [{ action: "resize", id: el.id, width: newW, height: el.height }],
          qualityChecks: [],
        };
      } else if (p.includes("smaller") || p.includes("narrower")) {
        const newW = Math.max(1.0, el.width * 0.85);
        return {
          message: `Reduced width of "${el.metadata?.label || el.id}" to ${newW.toFixed(2)}".`,
          operations: [{ action: "resize", id: el.id, width: newW, height: el.height }],
          qualityChecks: [],
        };
      }
    }
  }

  // Universal Smart Layout Architect Execution
  const designResult = autoDesignDocument(doc, prompt);

  return {
    message: designResult.message,
    operations: [{ action: "replace", elements: designResult.document.elements }],
    qualityChecks: [],
    designReasoning: designResult.reasoning,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, currentDocument, selectedElementId, mode, chatHistory } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallback = generateDeterministicFallback(prompt, currentDocument, selectedElementId);
      return NextResponse.json(fallback);
    }

    try {
      const ai = getGeminiClient();
      const model = getGeminiModelName();
      const doLayoutOp = isLayoutRequest(prompt);

      if (doLayoutOp) {
        // Layout Operation Mode: structured JSON with document operations
        const recentHistory = (chatHistory || [])
          .slice(-4)
          .map((m: any) => `${m.sender === "user" ? "User" : "PagePilot"}: ${m.text}`)
          .join("\n");

        const contextualPrompt = `CURRENT DOCUMENT STATE:\n${JSON.stringify(currentDocument || {}, null, 2)}\n\nSELECTED ELEMENT ID: ${selectedElementId || "NONE"}\nAUTHORING MODE: ${mode || "director"}\n${recentHistory ? `\nRECENT CONVERSATION CONTEXT:\n${recentHistory}\n` : ""}USER REQUEST: "${prompt}"\n\nProduce structured operations conforming strictly to 8.5 x 11 inch US Letter bounds and 0.45" safe margins.\nMake the "message" field a friendly, conversational reply (1-2 sentences).\nReturn pure JSON only.`;

        const response = await ai.models.generateContent({
          model,
          contents: contextualPrompt,
          config: {
            systemInstruction: LAYOUT_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.25,
          },
        });

        const rawText = response.text || "{}";
        const cleanedJson = repairJsonString(rawText);

        let parsedData;
        try {
          parsedData = JSON.parse(cleanedJson);
        } catch {
          console.warn("JSON repair failed, using deterministic fallback");
          return NextResponse.json(generateDeterministicFallback(prompt, currentDocument, selectedElementId));
        }

        const validationResult = AIResponseSchema.safeParse(parsedData);
        if (!validationResult.success) {
          console.warn("Schema validation warning:", validationResult.error.format());
          return NextResponse.json(parsedData);
        }

        return NextResponse.json(validationResult.data);
      } else {
        // Conversational Mode: friendly chat reply with no layout ops
        const history = (chatHistory || []).slice(-8);
        const conversationContext = history
          .map((m: any) => `${m.sender === "user" ? "User" : "PagePilot"}: ${m.text}`)
          .join("\n");

        const conversationPrompt = `${conversationContext ? `CONVERSATION HISTORY:\n${conversationContext}\n\n` : ""}User: ${prompt}\n\nDOCUMENT CONTEXT: ${currentDocument?.elements?.length || 0} elements on the canvas${selectedElementId ? `, currently selected: ${selectedElementId}` : ""}.\n\nRespond as PagePilot conversationally. Be warm, smart, and concise.`;

        const response = await ai.models.generateContent({
          model,
          contents: conversationPrompt,
          config: {
            systemInstruction: CHAT_SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        const replyText =
          response.text?.trim() ||
          "I'm here and ready to help! What would you like to do with your document?";

        return NextResponse.json({ message: replyText, operations: [], qualityChecks: [] });
      }
    } catch (apiError: any) {
      console.warn("Gemini API call failed, using layout engine fallback:", apiError.message);
      return NextResponse.json(generateDeterministicFallback(prompt, currentDocument, selectedElementId));
    }
  } catch (error: any) {
    console.error("Gemini API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred processing the document operation" },
      { status: 500 }
    );
  }
}
