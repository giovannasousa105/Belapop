import { NextResponse } from "next/server";

import { listarWishlist } from "@/lib/catalogo/catalogoService";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { itens: [], authenticated: false },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const itens = await listarWishlist(user.id);
    return NextResponse.json({ itens, authenticated: true });
  } catch (err) {
    console.error("[catalogo/wishlist GET]", err);
    return NextResponse.json({ itens: [], authenticated: false, warning: "wishlist_unavailable" });
  }
}
