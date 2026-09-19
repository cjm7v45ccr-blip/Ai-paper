import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback } from "@/lib/gemini";
import { DocumentModel, DocumentElement, DocumentMode, PageData, PageLayoutType } from "@/types/document";

export const dynamic = "force-dynamic";

function cleanJson(raw: string): string {
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

const AI_CREATION_SYSTEM_PROMPT = `You are PagePilot, a unified AI workspace architect that unifies Google Docs, Google Slides, Microsoft Word, Microsoft PowerPoint, and AI generation tools into one cohesive, intelligent editor.

You generate polished, publication-ready documents, presentation decks, executive reports, study guides, worksheets, and proposals.

CORE DIRECTIVES:
1. **Meaningful Structure & Purpose**: Understand the topic deeply before structuring pages. Decide for each page whether it needs paragraphs, headings, bullet lists, tables, charts, formulas, quote blocks, callouts, exercises, or summary boxes.
2. **Never Output Walls of Boring Text**: Use visual hierarchy, key metric cards, structured tables, and KaTeX LaTeX formulas.
3. **Format Tailoring**:
   - **presentation**: 16:9 or visual portrait slides with high-contrast takeaways, KPI metric cards, comparison matrices, and **speakerNotes** for every slide.
   - **document** / **report** / **proposal**: Multi-page structured publication with clear headings, executive summary, tables, charts, citations, and headers/footers.
   - **study-guide** / **worksheet**: Key definitions, KaTeX formulas with symbol breakdowns, practice exercise checkboxes, and reflection prompts.
   - **hybrid**: A single cohesive project where pages mix layout types (flow, visual, worksheet, table, report, presentation).
4. **Speaker Notes**: For every presentation slide or page, provide insightful, professional speaker notes (2-4 sentences of talking points).

Dimensions & Grid:
- Width: 8.5 inches (US Letter) or 13.33 inches (16:9 slide)
- Height: 11.0 inches (US Letter) or 7.5 inches (16:9 slide)
- Safe Margins: 0.65 inches (printable width: 7.2 inches)
- Flow elements: width: 7.2, x: 0.65. Side-by-side cards: width: 3.45 to 3.5, with x: 0.65 and x: 4.35.

You must return strictly valid JSON matching this exact schema:
{
  "title": "String (engaging, professional title for the project)",
  "message": "String (1-2 sentences summarizing the generated content and structure)",
  "recommendedMode": "document|presentation|report|worksheet|study-guide|proposal",
  "pages": [
    {
      "id": "page-1",
      "title": "String (e.g. Executive Summary, Market Dynamics, Financial Projections)",
      "layoutType": "flow|visual|canvas|worksheet|table|report|presentation",
      "speakerNotes": "String (concise talking points and presenter guidance for this page)",
      "headerText": "String (optional subtle top header)",
      "footerText": "String (optional subtle footer)",
      "elements": [
        {
          "id": "heading-1",
          "type": "heading",
          "layoutMode": "flow",
          "x": 0.65,
          "y": 0.65,
          "width": 7.2,
          "height": 1.0,
          "zIndex": 1,
          "content": {
            "title": "Clear Section Headline",
            "subtitle": "Informative 1-2 sentence narrative context.",
            "badge": "OPTIONAL CATEGORY BADGE"
          }
        },
        {
          "id": "card-1",
          "type": "callout",
          "layoutMode": "flow",
          "x": 0.65,
          "y": 1.8,
          "width": 7.2,
          "height": 1.5,
          "zIndex": 2,
          "content": {
            "title": "Strategic Focus & Key Finding",
            "text": "Concrete, high-value takeaway with actionable detail and precise numbers."
          }
        }
      ]
    }
  ]
}

Supported element types:
- "heading": content has "title", "subtitle", "badge". layoutMode: "flow"
- "callout": content has "title", "text" or "body". layoutMode: "flow" or "canvas"
- "text": content has "title", "text". layoutMode: "flow"
- "card": content has "title", "description", "iconName", "badge". layoutMode: "flow" or "canvas"
- "metric": content has "value", "label", "delta", "deltaType" ("positive"|"negative"), "period". layoutMode: "flow" or "canvas"
- "timeline": content has "title", "milestones" (array of { "date": string, "title": string, "description": string, "status": "completed"|"current"|"upcoming" }). layoutMode: "flow"
- "formula": content has "title", "equation" (valid KaTeX LaTeX math string e.g. "E = mc^2" or "D = \\frac{m}{V}"), "breakdown" (array of { "symbol": "...", "label": "..." }). layoutMode: "flow" or "canvas"
- "table": content has "title", "headers" (array of strings), "rows" (2D array of string cells). layoutMode: "flow"
- "chart": content has "title", "series" (array of { name, color, values: number[] }), "labels" (array of strings). layoutMode: "flow" or "canvas"
- "checkboxGroup": content has "title", "items" (array of { "text": string, "checked": boolean }). layoutMode: "flow"
- "writingLines": content has "title", "promptText", "lineCount" (number). layoutMode: "flow"`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      actionType,
      documentMode = "document",
      documentState,
      selectedElementId,
      activePageIndex = 0,
      targetMode,
      audience,
      desiredLength,
      visualTheme,
      sourceContent,
      referenceLinks,
      images,
      image,
    } = body;

    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "AI_API_KEY or GEMINI_API_KEY environment variable is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // Helper to format image parts for Gemini API
    const rawImagesList: Array<{ mimeType: string; data: string; name?: string }> = [];
    if (Array.isArray(images)) {
      for (const img of images) {
        if (typeof img === "string") {
          const match = img.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            rawImagesList.push({ mimeType: match[1], data: match[2] });
          } else {
            rawImagesList.push({ mimeType: "image/png", data: img });
          }
        } else if (img?.data) {
          const rawData = img.data.replace(/^data:[^;]+;base64,/, "");
          rawImagesList.push({ mimeType: img.mimeType || "image/png", data: rawData, name: img.name });
        }
      }
    } else if (typeof image === "string") {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        rawImagesList.push({ mimeType: match[1], data: match[2] });
      } else {
        rawImagesList.push({ mimeType: "image/png", data: image });
      }
    }

    const imageParts = rawImagesList.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data,
      },
    }));

    // ACTION: Recommend Best Format based on User Intent
    if (actionType === "recommend_format") {
      const p = (prompt || "").toLowerCase();
      let recMode: DocumentMode = "document";
      let reason = "Standard readable document";

      if (p.includes("pitch") || p.includes("deck") || p.includes("presentation") || p.includes("slides") || p.includes("keynote")) {
        recMode = "presentation";
        reason = "Visual presentation slides recommended for pitch and talk";
      } else if (p.includes("proposal") || p.includes("rfp") || p.includes("bid") || p.includes("client proposal")) {
        recMode = "proposal";
        reason = "Structured multi-section proposal format";
      } else if (p.includes("study guide") || p.includes("exam") || p.includes("cheat sheet") || p.includes("chemistry") || p.includes("physics")) {
        recMode = "study-guide";
        reason = "Study guide with equations, tables and definitions";
      } else if (p.includes("worksheet") || p.includes("lesson plan") || p.includes("quiz") || p.includes("exercises") || p.includes("practice")) {
        recMode = "worksheet";
        reason = "Interactive exercises and question worksheet";
      } else if (p.includes("report") || p.includes("research") || p.includes("analysis") || p.includes("audit") || p.includes("metrics") || p.includes("quarterly")) {
        recMode = "report";
        reason = "Executive multi-page report with analytics";
      }

      return NextResponse.json({
        recommendedMode: recMode,
        reason,
      });
    }

    // ACTION: Transform Document <-> Presentation
    if (actionType === "transform_document_mode") {
      const activeDoc: DocumentModel = documentState;
      const target: DocumentMode = targetMode || (documentMode === "presentation" ? "report" : "presentation");

      const isToPresentation = target === "presentation";
      const instruction = isToPresentation
        ? `You are converting the provided full document into a high-impact, visual PRESENTATION DECK (3-6 slides).
Summarize each major section into concise, punchy bullet points, KPI cards, comparison tables, and provide rich speaker notes for each slide. Do not copy walls of text.`
        : `You are converting the provided presentation slides into a comprehensive, deeply articulated DOCUMENT/EXECUTIVE REPORT (2-4 pages).
Expand the slide bullet points into full explanatory paragraphs, analytical insights, detailed data tables, equations, and citations.`;

      const promptPayload = `${instruction}
Target Mode: "${target}"
Original Project Title: "${activeDoc.title}"
Original Document Mode: "${activeDoc.mode || documentMode}"
Current Pages & Content:
${JSON.stringify(activeDoc.pages || [], null, 2)}

Return strictly valid JSON according to schema with full transformed pages, elements, and speaker notes.`;

      const rawJson = await callGeminiWithFallback({
        contents: promptPayload,
        systemInstruction: AI_CREATION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.25,
      });

      const parsed = JSON.parse(cleanJson(rawJson));

      if (parsed.pages && Array.isArray(parsed.pages)) {
        const transformedDoc: DocumentModel = {
          ...activeDoc,
          title: parsed.title || activeDoc.title,
          mode: target,
          pages: parsed.pages.map((p: any, idx: number) => ({
            id: p.id || `page-${idx + 1}`,
            title: p.title || `${isToPresentation ? "Slide" : "Section"} ${idx + 1}`,
            layoutType: p.layoutType || (isToPresentation ? "visual" : "flow"),
            speakerNotes: p.speakerNotes || "",
            elements: (p.elements || []).map((el: any, elIdx: number) => ({
              id: el.id || `elem-${idx + 1}-${elIdx + 1}`,
              type: el.type || "text",
              layoutMode: el.layoutMode || (isToPresentation && el.width < 6.0 ? "canvas" : "flow"),
              x: typeof el.x === "number" ? el.x : (isToPresentation ? 0.8 : 0.65),
              y: typeof el.y === "number" ? el.y : 0.65 + elIdx * 1.6,
              width: typeof el.width === "number" ? el.width : (isToPresentation ? 11.7 : 7.2),
              height: typeof el.height === "number" ? el.height : 1.6,
              zIndex: el.zIndex || elIdx + 1,
              content: el.content || {},
              style: el.style || {},
              metadata: el.metadata || {},
            })),
          })),
        };

        return NextResponse.json({
          message: parsed.message || `Transformed project into ${target}.`,
          document: transformedDoc,
        });
      }
    }

    // ACTION: Contextual AI Assistant / Editing Existing Document
    if (documentState && actionType !== "create_from_prompt") {
      const activeDoc: DocumentModel = documentState;
      const currentPage =
        activeDoc.pages?.[activePageIndex] || activeDoc.pages?.[0];

      const commandInstruction = `You are PagePilot's elite document and layout AI assistant.
The user is working on an interactive ${documentMode}. They have typed text, added images, or created blocks, and now want you to MOVE, FIX, ORGANIZE, or RESTYLE elements.
${rawImagesList.length > 0 ? "NOTE: The user has attached " + rawImagesList.length + " image(s). Analyze visual(s) carefully." : ""}

CURRENT CONTEXT:
Document Title: "${activeDoc.title}"
Mode: "${documentMode}" (${documentMode === "presentation" ? "16:9 Widescreen slide" : "8.5x11 inch US Letter document"})
Active Page Index: ${activePageIndex}
Active Page Title: "${currentPage?.title || "Page"}"
Selected Element ID: ${selectedElementId || "none"}

CURRENT ELEMENTS ON THIS PAGE:
${JSON.stringify(currentPage?.elements || [], null, 2)}

USER INSTRUCTION / COMMAND:
"${prompt}"

CAPABILITIES & RULES:
1. Adjust coordinates, switch between "flow" and "canvas" layout modes.
2. Structure raw notes into structured typography, headings, tables, or callouts.
3. If user requests speaker notes, update the page's speakerNotes field.
4. Clean up grammar, polish executive tone.

RETURN STRICTLY VALID JSON matching this schema:
{
  "message": "1-sentence friendly confirmation of what was moved, fixed, or formatted.",
  "updatedPage": {
    "id": "${currentPage?.id || "page-1"}",
    "title": "Page title",
    "layoutType": "flow|visual|canvas|worksheet|table|report|presentation",
    "speakerNotes": "Speaker notes talking points",
    "elements": [ ... ]
  }
}`;

      const contentsToSend =
        imageParts.length > 0
          ? [{ text: commandInstruction }, ...imageParts]
          : commandInstruction;

      const rawJson = await callGeminiWithFallback({
        contents: contentsToSend,
        systemInstruction: AI_CREATION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.2,
      });

      const parsed = JSON.parse(cleanJson(rawJson));

      if (parsed.updatedDocument && Array.isArray(parsed.updatedDocument.pages)) {
        return NextResponse.json({
          message: parsed.message || "Updated document.",
          document: parsed.updatedDocument,
        });
      }

      if (parsed.updatedPage && Array.isArray(parsed.updatedPage.elements)) {
        const updatedPages = [...(activeDoc.pages || [])];
        const pageId = parsed.updatedPage.id || currentPage?.id || `page-${activePageIndex + 1}`;
        const pageTitle = parsed.updatedPage.title || currentPage?.title || `Slide ${activePageIndex + 1}`;
        const pageLayoutType = parsed.updatedPage.layoutType || currentPage?.layoutType || (documentMode === "presentation" ? "visual" : "flow");
        const pageSpeakerNotes = parsed.updatedPage.speakerNotes !== undefined ? parsed.updatedPage.speakerNotes : (currentPage?.speakerNotes || "");

        const originalImages = (currentPage?.elements || []).filter((el) => el.type === "image");
        const processedElements = parsed.updatedPage.elements.map((el: any, idx: number) => {
          if (el.type === "image") {
            if (el.content?.url === "USER_ATTACHED_IMAGE_0" && rawImagesList.length > 0) {
              return {
                ...el,
                content: {
                  ...el.content,
                  url: `data:${rawImagesList[0].mimeType};base64,${rawImagesList[0].data}`,
                  caption: el.content?.caption || "Attached Image",
                },
              };
            }
            if (!el.content?.url || el.content?.url === "") {
              const matchingOrig = originalImages.find((orig) => orig.id === el.id) || originalImages[idx] || originalImages[0];
              if (matchingOrig?.content?.url) {
                return {
                  ...el,
                  content: {
                    ...el.content,
                    url: matchingOrig.content.url,
                    caption: el.content?.caption || matchingOrig.content.caption,
                  },
                };
              }
            }
          }
          return el;
        });

        updatedPages[activePageIndex] = {
          id: pageId,
          title: pageTitle,
          layoutType: pageLayoutType,
          speakerNotes: pageSpeakerNotes,
          elements: processedElements,
        };

        return NextResponse.json({
          message: parsed.message || `Updated active page.`,
          document: {
            ...activeDoc,
            pages: updatedPages,
            elements: updatedPages[activePageIndex].elements,
          },
        });
      }

      throw new Error("Invalid AI layout response received.");
    }

    // PRIMARY GENERATION FLOW: Create complete first draft from prompt
    if (actionType === "create_from_prompt" || (!actionType && prompt)) {
      const pageCountTarget =
        desiredLength === "short"
          ? "2 pages/slides"
          : desiredLength === "detailed"
          ? "6-8 pages/slides"
          : desiredLength === "deep"
          ? "8-10 pages/slides"
          : "3-5 pages/slides";

      const audienceInstruction = audience
        ? `Target Audience: "${audience}". Tailor terminology, tone, and depth specifically for this audience.`
        : "";

      const visualThemeInstruction = visualTheme
        ? `Visual Theme: "${visualTheme}". Apply appropriate aesthetic styling.`
        : "";

      const sourceContentInstruction = sourceContent
        ? `Reference Notes / Source Text:\n${sourceContent.slice(0, 3000)}\n`
        : "";

      const linksInstruction =
        Array.isArray(referenceLinks) && referenceLinks.length > 0
          ? `Reference Resources:\n${referenceLinks.join("\n")}\n`
          : "";

      const promptContents = `FORMAT: ${documentMode.toUpperCase()}
TARGET LENGTH: ${pageCountTarget}
${audienceInstruction}
${visualThemeInstruction}
${sourceContentInstruction}
${linksInstruction}
${rawImagesList.length > 0 ? `Attached Images: ${rawImagesList.length}. Integrate concepts, equations, or diagrams from images.` : ""}

USER TOPIC / REQUEST:
"${prompt}"

Generate the complete structured JSON with all pages, diverse elements (headings, cards, tables, charts, formulas with KaTeX LaTeX, timelines, checklists), and speaker notes for every page.`;

      const contentsToSend =
        imageParts.length > 0
          ? [{ text: promptContents }, ...imageParts]
          : promptContents;

      const rawJson = await callGeminiWithFallback({
        contents: contentsToSend,
        systemInstruction: AI_CREATION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.25,
      });

      const parsed = JSON.parse(cleanJson(rawJson));

      if (parsed.pages && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        const isPresentation = documentMode === "presentation";

        const sanitizedPages: PageData[] = parsed.pages.map((p: any, pIdx: number) => ({
          id: p.id || `page-${pIdx + 1}`,
          title: p.title || (isPresentation ? `Slide ${pIdx + 1}` : `Section ${pIdx + 1}`),
          layoutType: p.layoutType || (isPresentation ? "visual" : "flow"),
          speakerNotes: p.speakerNotes || "",
          headerText: p.headerText || `${parsed.title || "Project"} • ${p.title || `Section ${pIdx + 1}`}`,
          footerText: p.footerText || "Confidential & Proprietary",
          pageNumber: pIdx + 1,
          elements: (p.elements || []).map((el: any, elIdx: number) => ({
            id: el.id || `elem-${pIdx + 1}-${elIdx + 1}`,
            type: el.type || "text",
            layoutMode: el.layoutMode || (isPresentation && el.width && el.width < 6.0 ? "canvas" : "flow"),
            x: typeof el.x === "number" ? el.x : (isPresentation ? 0.8 : 0.65),
            y: typeof el.y === "number" ? el.y : 0.65 + elIdx * 1.6,
            width: typeof el.width === "number" ? el.width : (isPresentation ? 11.7 : 7.2),
            height: typeof el.height === "number" ? el.height : 1.6,
            zIndex: el.zIndex || elIdx + 1,
            content: el.content || {},
            style: el.style || {},
            metadata: el.metadata || {},
          })),
        }));

        const newDocument: DocumentModel = {
          id: `doc-${Date.now()}`,
          title: parsed.title || prompt.slice(0, 45),
          mode: documentMode,
          pages: sanitizedPages,
          elements: sanitizedPages[0]?.elements || [],
          page: {
            size: isPresentation ? "presentation-16-9" : "letter",
            width: isPresentation ? 13.333 : 8.5,
            height: isPresentation ? 7.5 : 11.0,
            unit: "in",
            safeMargin: 0.65,
            background: isPresentation ? "#0d0f14" : "#ffffff",
          },
          theme: {
            name: visualTheme || (isPresentation ? "Obsidian Dark" : "Executive Slate"),
            headingFont: isPresentation ? "Outfit" : "Inter",
            bodyFont: "Inter",
            primaryColor: isPresentation ? "#f8fafc" : "#0f172a",
            accentColor: "#4f46e5",
            backgroundColor: isPresentation ? "#0d0f14" : "#ffffff",
          },
        };

        return NextResponse.json({
          message: parsed.message || `Generated ${sanitizedPages.length} ${isPresentation ? "slides" : "sections"} for "${prompt}".`,
          document: newDocument,
        });
      }

      throw new Error("Invalid format received from AI model.");
    }

    return NextResponse.json({ error: "No action performed" }, { status: 400 });
  } catch (error: any) {
    console.error("AI Generation Endpoint Error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to communicate with AI generation endpoint.",
      },
      { status: 500 }
    );
  }
}
