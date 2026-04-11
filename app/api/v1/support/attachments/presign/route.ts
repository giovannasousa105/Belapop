import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

type PresignBody = {
  filename?: string;
  content_type?: string;
  size_bytes?: number;
};

const MAX_BYTES = Number(process.env.SUPPORT_ATTACHMENTS_MAX_BYTES ?? 15 * 1024 * 1024);
const BUCKET = process.env.SUPPORT_ATTACHMENTS_BUCKET ?? "support-attachments";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
  "application/pdf"
]);

const sanitizeFilename = (filename: string) =>
  filename
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 120);

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as PresignBody;
  if (!body.filename || !body.content_type || !body.size_bytes) {
    return NextResponse.json(
      { error: "filename, content_type e size_bytes sao obrigatorios." },
      { status: 400 }
    );
  }

  const contentType = String(body.content_type).trim().toLowerCase();
  const sizeBytes = Number(body.size_bytes);
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: "Tipo de arquivo nao permitido. Use imagem, mp4 ou pdf." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
    return NextResponse.json(
      { error: `Tamanho invalido. Limite atual: ${MAX_BYTES} bytes.` },
      { status: 400 }
    );
  }

  const attachmentId = randomUUID();
  const safeName = sanitizeFilename(body.filename);
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const storagePath = `support/${userId}/${y}/${m}/${d}/${attachmentId}-${safeName}`;

  const insert = await admin.from("support_attachments").insert({
    id: attachmentId,
    user_id: userId,
    bucket: BUCKET,
    storage_path: storagePath,
    filename: body.filename,
    content_type: contentType,
    size_bytes: sizeBytes,
    status: "pending"
  });
  if (insert.error) {
    const message = String(insert.error.message ?? "").toLowerCase();
    const tableMissing = message.includes("relation") && message.includes("support_attachments");
    if (tableMissing) {
      return NextResponse.json(
        {
          error:
            "Tabela support_attachments nao encontrada. Rode a migration 20260305_0300_customer_events_outbox_support_sla.sql."
        },
        { status: 501 }
      );
    }
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  const signed = await admin.storage.from(BUCKET).createSignedUploadUrl(storagePath);
  if (signed.error || !signed.data) {
    await admin
      .from("support_attachments")
      .update({ status: "failed" })
      .eq("id", attachmentId)
      .eq("user_id", userId);
    return NextResponse.json(
      { error: signed.error?.message ?? "Nao foi possivel gerar upload assinado." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    attachment_id: attachmentId,
    bucket: BUCKET,
    path: storagePath,
    token: signed.data.token ?? null,
    upload_url: signed.data.signedUrl
  });
}
