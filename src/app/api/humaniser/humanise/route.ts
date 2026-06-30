import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-static";

/**
 * @fileoverview Humaniser Rewrite/Humanise API Route
 *
 * POST /api/humaniser/humanise
 * Accepts text with detection results and returns humanised content
 * with side-by-side comparison.
 */

export async function POST(request: NextRequest) {
  try {
    const body: {
      text?: string;
      detectionResult?: any;
      style?: string;
      targetSentenceIndices?: number[];
      preserveTechnicalTerms?: boolean;
      formalityLevel?: string;
      useLLM?: boolean;
    } = await request.json();
    const {
      text,
      detectionResult,
      style = "neutral",
      targetSentenceIndices,
      preserveTechnicalTerms = true,
      formalityLevel = "semi-formal",
      useLLM = false,
    } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text input is required and must be a string" },
        { status: 400 }
      );
    }

    if (!detectionResult) {
      return NextResponse.json(
        { error: "Detection result is required for humanisation" },
        { status: 400 }
      );
    }

    const { HumaniserEngine } = await import("@mycodexvantaos/ai-humaniser");

    const engine = new HumaniserEngine({
      mode: useLLM ? "hybrid" : "native",
    });

    await engine.initialize();

    const result = await engine.humanise({
      originalText: text,
      detectionResult,
      style,
      targetSentenceIndices,
      preserveTechnicalTerms,
      formalityLevel,
    });

    // If LLM enhancement is requested
    if (useLLM && process.env.GEMINI_API_KEY) {
      try {
        const { humaniserRewriteFlow } = await import("@/ai/flows/humaniser-rewrite-flow");
        const llmResult = await humaniserRewriteFlow({
          text,
          style: style as "neutral" | "conversational" | "professional" | "academic" | "creative",
          targetSentenceIndices,
          preserveTechnicalTerms,
          formalityLevel: formalityLevel as "casual" | "semi-formal" | "formal",
        });

        await engine.shutdown();

        return NextResponse.json({
          ...result,
          llmEnhanced: true,
          llmRewrite: llmResult,
        });
      } catch {
        await engine.shutdown();
        return NextResponse.json({
          ...result,
          llmEnhanced: false,
          llmError: "LLM rewrite enhancement unavailable",
        });
      }
    }

    await engine.shutdown();

    return NextResponse.json({
      ...result,
      llmEnhanced: false,
    });
  } catch (error: any) {
    console.error("[Humaniser Humanise API]", error);
    return NextResponse.json({ error: error.message || "Humanisation failed" }, { status: 500 });
  }
}
