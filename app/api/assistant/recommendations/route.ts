import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { buildConsultoraBelaPopRecommendations } from "@/lib/assistant/recommendations";
import { assistantRequestSchema } from "@/lib/assistant/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = assistantRequestSchema.parse(await request.json());
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const payload = await buildConsultoraBelaPopRecommendations({
      supabase,
      request: body,
      userId: user?.id ?? null
    });

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Payload invalido para a Consultora BelaPop.",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possivel montar a orientacao agora."
      },
      { status: 500 }
    );
  }
}
