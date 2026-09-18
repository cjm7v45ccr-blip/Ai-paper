import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, getGeminiModelName } from "@/lib/gemini";
import { AIResponseSchema } from "@/lib/document-schema";
import { DocumentModel, Operation } from "@/types/document";
import { autoFixSafeMargins, autoFixOverlaps } from "@/lib/quality-checks";
import { INITIAL_SAMPLE_DOCUMENT } from "@/lib/sample-document";

export const dynamic = "force-dynamic";

const LAYOUT_SYSTEM_INSTRUCTION = `
You are PagePilot, an elite AI publication layout designer and visual authoring system.
Users describe documents they want on an 8.5 x 11 inch canvas (US Letter, portrait).
Your job is to reason through content, calculate accurate figures, establish clear visual hierarchy, and return operations to construct or update the document.

DOCUMENT METRICS:
- Page width: 8.5 inches.
- Page height: 11.0 inches.
- Print Safe Margin: 0.45 inches on all 4 borders. (Valid X: 0.45 to 8.05. Valid Y: 0.45 to 10.55).
- All element positions (x, y, width, height) MUST BE IN INCHES.

CRITICAL DESIGN RULES:
1. NEVER place or resize elements outside safe margins (0.45" to 8.05" X, 0.45" to 10.55" Y).
2. Clamping is mandatory: element.x + element.width <= 8.05, element.y + element.height <= 10.55.
3. Keep visual balance: header, core formula or text, visual anchor (chart/diagram), and functional area.
4. If an object is selected (selectedElementId provided), modify ONLY that element or its immediate context.
5. If no object is selected, generate or rebalance the page harmoniously.

RESPONSE JSON FORMAT - return ONLY valid JSON:
{
  "message": "Friendly conversational reply explaining what you did (1-2 sentences)",
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
): { message: string; operations: Operation[]; qualityChecks: any[] } {
  const doc = (currentDocument && currentDocument.elements) ? currentDocument : INITIAL_SAMPLE_DOCUMENT;
  const p = prompt.toLowerCase();
  let operations: Operation[] = [];
  let message = "PagePilot layout engine applied safe updates.";

  if (p.includes("fix") || p.includes("margin") || p.includes("fit") || p.includes("overflow") || p.includes("layout")) {
    const fixedDoc = autoFixSafeMargins(doc);
    const resolvedDoc = autoFixOverlaps(fixedDoc);
    operations = [{ action: "replace", elements: resolvedDoc.elements }];
    message = 'Optimized all elements to strictly respect 0.45" safe print margins and resolved overlaps.';
  } else if (p.includes("hand-copy") || p.includes("lines") || p.includes("practice")) {
    const exists = doc.elements.some((el) => el.type === "writingLines");
    if (!exists) {
      operations = [
        {
          action: "add",
          element: {
            id: `el-writing-${Date.now()}`,
            type: "writingLines",
            x: 0.55, y: 7.2, width: 4.4, height: 3.25, zIndex: 10,
            content: {
              title: "Hand-Copy Practice & Student Math",
              promptText: "Write out intermediate steps cleanly:",
              lineCount: 7,
            },
            style: { backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderWidth: 1, borderRadius: 8, padding: 12 },
          },
        },
      ];
      message = "Added ruled hand-copy practice container inside safe margins.";
    } else {
      message = "Ruled practice lines already exist on the canvas — they look great!";
    }
  } else if (selectedElementId) {
    const el = doc.elements.find((e) => e.id === selectedElementId);
    if (el) {
      if (p.includes("wider")) {
        const newW = Math.min(7.5, el.width * 1.2);
        operations = [{ action: "resize", id: el.id, width: newW, height: el.height }];
        message = `Expanded width of "${el.metadata?.label || el.id}" to ${newW.toFixed(2)}".`;
      } else if (p.includes("smaller") || p.includes("narrower")) {
        const newW = Math.max(1.0, el.width * 0.85);
        operations = [{ action: "resize", id: el.id, width: newW, height: el.height }];
        message = `Reduced width of "${el.metadata?.label || el.id}" to ${newW.toFixed(2)}".`;
      } else {
        operations = [{ action: "update", id: el.id, changes: { style: { ...el.style, borderColor: "#4f46e5" } } }];
        message = `Refined styling of "${el.metadata?.label || el.id}".`;
      }
    }
  } else {
    const fixedDoc = autoFixSafeMargins(doc);
    operations = [{ action: "replace", elements: fixedDoc.elements }];
    message = "Balanced document layout and verified print boundaries.";
  }

  return {
    message: `${message} (Add GEMINI_API_KEY in .env.local for full AI generation)`,
    operations,
    qualityChecks: [],
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
