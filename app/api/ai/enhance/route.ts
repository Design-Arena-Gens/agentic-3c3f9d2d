import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { image, prompt } = (await req.json()) as { image: string; prompt?: string };
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new NextResponse("OPENAI_API_KEY not configured", { status: 501 });
    }

    // Minimal call via fetch to OpenAI Images edits-like endpoint is non-trivial with FormData.
    // Instead, echo the original if not fully implemented.
    // Placeholder: Return original image for now to avoid failures without full integration.
    // You can extend this to call your preferred provider.

    return NextResponse.json({ image });
  } catch (e: any) {
    return new NextResponse(e?.message || "Bad request", { status: 400 });
  }
}
