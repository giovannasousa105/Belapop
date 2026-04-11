import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { skinProfilePatchSchema } from "@/lib/skincare/contracts";
import {
  normalizeSkinConcernOptions,
  normalizeSkinToneOptions,
  normalizeSkinTypeOptions
} from "@/lib/skincare/profileTaxonomy";
import {
  mapUserSkinProfile,
  type SkinConcernOption,
  type SkinToneOption,
  type SkinTypeOption,
  type RoutineStepOption,
  type UserSkinProfileRow
} from "@/lib/skincare/routine";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

async function loadProfileDependencies(admin: AdminClient) {
  const [
    { data: skinTypes, error: skinTypesError },
    { data: skinTones, error: skinTonesError },
    { data: concerns, error: concernsError },
    { data: steps, error: stepsError }
  ] =
    await Promise.all([
      admin.from("skin_types").select("id,slug,name,description").order("sort_order", { ascending: true }),
      admin.from("skin_tones").select("id,slug,name,description").order("sort_order", { ascending: true }),
      admin.from("skin_concerns").select("id,slug,name,description").order("sort_order", { ascending: true }),
      admin
        .from("routine_steps")
        .select("id,slug,name,step_order")
        .eq("is_active", true)
        .order("step_order", { ascending: true })
    ]);

  const error = skinTypesError ?? skinTonesError ?? concernsError ?? stepsError;
  if (error) {
    throw error;
  }

  return {
    skinTypes: normalizeSkinTypeOptions((skinTypes ?? []) as SkinTypeOption[]),
    skinTones: normalizeSkinToneOptions((skinTones ?? []) as SkinToneOption[]),
    concerns: normalizeSkinConcernOptions((concerns ?? []) as SkinConcernOption[]),
    steps: (steps ?? []) as RoutineStepOption[]
  };
}

export async function GET() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;

  try {
    const [{ skinTypes, skinTones, concerns, steps }, { data: profile, error }] = await Promise.all([
      loadProfileDependencies(admin),
      admin
        .from("user_skin_profiles")
        .select(
          "id,user_id,skin_type_id,skin_tone_id,main_concern_id,sensitivity_level,price_affinity_cents,metadata,created_at,updated_at"
        )
        .eq("user_id", userId)
        .maybeSingle()
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: mapUserSkinProfile((profile ?? null) as UserSkinProfileRow | null, skinTypes, concerns, skinTones),
      options: {
        skin_types: skinTypes,
        skin_tones: skinTones,
        skin_concerns: concerns,
        routine_steps: steps
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar perfil de pele.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = await request.json().catch(() => ({}));
  const parsed = skinProfilePatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload invalido.",
        details: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const input = parsed.data;

  try {
    const [{ skinTypes, skinTones, concerns }, currentProfileResult] = await Promise.all([
      loadProfileDependencies(admin),
      admin.from("user_skin_profiles").select("id").eq("user_id", userId).maybeSingle()
    ]);

    if (currentProfileResult.error) {
      return NextResponse.json({ error: currentProfileResult.error.message }, { status: 500 });
    }

    if (
      typeof input.skin_type_id === "string" &&
      !skinTypes.some((item) => item.id === input.skin_type_id)
    ) {
      return NextResponse.json({ error: "skin_type_id invalido." }, { status: 400 });
    }

    if (
      typeof input.skin_tone_id === "string" &&
      !skinTones.some((item) => item.id === input.skin_tone_id)
    ) {
      return NextResponse.json({ error: "skin_tone_id invalido." }, { status: 400 });
    }

    if (
      typeof input.main_concern_id === "string" &&
      !concerns.some((item) => item.id === input.main_concern_id)
    ) {
      return NextResponse.json({ error: "main_concern_id invalido." }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      user_id: userId
    };

    if (currentProfileResult.data?.id) {
      payload.id = currentProfileResult.data.id;
    }

    if (Object.prototype.hasOwnProperty.call(input, "skin_type_id")) {
      payload.skin_type_id = input.skin_type_id ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "skin_tone_id")) {
      payload.skin_tone_id = input.skin_tone_id ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "main_concern_id")) {
      payload.main_concern_id = input.main_concern_id ?? null;
    }
    if (typeof input.sensitivity_level === "number") {
      payload.sensitivity_level = input.sensitivity_level;
    }
    if (Object.prototype.hasOwnProperty.call(input, "price_affinity_cents")) {
      payload.price_affinity_cents = input.price_affinity_cents ?? null;
    }
    if (input.metadata) {
      payload.metadata = input.metadata;
    }

    const { data: profile, error } = await admin
      .from("user_skin_profiles")
      .upsert(payload, { onConflict: "user_id" })
      .select(
        "id,user_id,skin_type_id,skin_tone_id,main_concern_id,sensitivity_level,price_affinity_cents,metadata,created_at,updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile: mapUserSkinProfile(profile as UserSkinProfileRow, skinTypes, concerns, skinTones)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao atualizar perfil de pele.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
