import { NextResponse } from "next/server";
import { ensureAdminRequest } from "@/lib/admin/adminAuth";

export async function GET(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const supabase = admin.supabase;
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(req: Request) {
  const admin = await ensureAdminRequest(req as any);
  if ("error" in admin) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const supabase = admin.supabase;
  const body = await req.json();
  const payload = {
    title: body.title,
    slug: body.slug,
    body_md: body.body_md ?? "",
    media_url: body.media_url ?? null,
    media_type: body.media_type ?? null,
    tags: body.tags ?? [],
    status: body.status ?? "draft",
    published_at: body.published_at ?? null
  };
  const { data, error } = await supabase.from("posts").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
