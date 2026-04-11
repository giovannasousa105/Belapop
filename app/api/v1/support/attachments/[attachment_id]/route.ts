import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { loadAttachmentForUser } from "@/lib/support/attachments";

const parseExpiresSeconds = (value: string | null) => {
  const parsed = Number(value ?? "");
  if (!Number.isFinite(parsed)) return 600;
  return Math.max(60, Math.min(3600, Math.round(parsed)));
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attachment_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const { attachment_id: attachmentId } = await params;

  let attachment;
  try {
    attachment = await loadAttachmentForUser(admin, attachmentId, userId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao carregar anexo." },
      { status: 500 }
    );
  }

  if (!attachment) {
    return NextResponse.json({ error: "Anexo nao encontrado." }, { status: 404 });
  }
  if (attachment.status === "deleted") {
    return NextResponse.json({ error: "Anexo indisponivel." }, { status: 404 });
  }

  const signed = await admin.storage
    .from(attachment.bucket)
    .createSignedUrl(attachment.storage_path, parseExpiresSeconds(request.nextUrl.searchParams.get("expires")));

  if (signed.error || !signed.data?.signedUrl) {
    return NextResponse.json(
      { error: signed.error?.message ?? "Nao foi possivel gerar URL do arquivo." },
      { status: 500 }
    );
  }

  const wantsRedirect =
    request.nextUrl.searchParams.get("download") === "1" ||
    request.nextUrl.searchParams.get("download") === "true" ||
    request.nextUrl.searchParams.get("raw") === "1";

  if (wantsRedirect) {
    return NextResponse.redirect(signed.data.signedUrl, 302);
  }

  return NextResponse.json({
    attachment_id: attachment.id,
    ticket_id: attachment.ticket_id,
    filename: attachment.filename,
    content_type: attachment.content_type,
    size_bytes: attachment.size_bytes,
    status: attachment.status,
    uploaded_at: attachment.uploaded_at,
    url: `/api/v1/support/attachments/${attachment.id}?download=1`,
    download_url: signed.data.signedUrl
  });
}
