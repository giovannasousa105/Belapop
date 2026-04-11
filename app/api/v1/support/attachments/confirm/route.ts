import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import {
  isMissingRelationOrColumn,
  loadAttachmentForUser
} from "@/lib/support/attachments";

type ConfirmBody = {
  attachment_id?: string;
  ticket_id?: string | null;
};

export async function POST(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const body = (await request.json().catch(() => ({}))) as ConfirmBody;
  const attachmentId = String(body.attachment_id ?? "").trim();
  const ticketId = body.ticket_id ? String(body.ticket_id).trim() : null;

  if (!attachmentId) {
    return NextResponse.json({ error: "attachment_id e obrigatorio." }, { status: 400 });
  }

  if (ticketId) {
    const ticketLookup = await admin
      .from("support_tickets")
      .select("id")
      .eq("id", ticketId)
      .eq("user_id", userId)
      .maybeSingle();

    if (ticketLookup.error) {
      return NextResponse.json({ error: ticketLookup.error.message }, { status: 500 });
    }
    if (!ticketLookup.data) {
      return NextResponse.json({ error: "ticket_id invalido para este usuario." }, { status: 400 });
    }
  }

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
    return NextResponse.json(
      {
        error:
          "Anexo nao encontrado. Rode a migration 20260305_0300_customer_events_outbox_support_sla.sql se necessario."
      },
      { status: 404 }
    );
  }

  if (attachment.status === "deleted") {
    return NextResponse.json({ error: "Anexo indisponivel." }, { status: 404 });
  }

  const probe = await admin.storage
    .from(attachment.bucket)
    .createSignedUrl(attachment.storage_path, 60);

  if (probe.error || !probe.data?.signedUrl) {
    await admin
      .from("support_attachments")
      .update({ status: "failed" })
      .eq("id", attachment.id)
      .eq("user_id", userId);

    return NextResponse.json(
      { error: "Upload nao encontrado no storage. Reenvie o arquivo." },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();
  const patch = await admin
    .from("support_attachments")
    .update({
      ticket_id: ticketId ?? attachment.ticket_id,
      status: "uploaded",
      uploaded_at: attachment.uploaded_at ?? nowIso
    })
    .eq("id", attachment.id)
    .eq("user_id", userId);

  if (patch.error && !isMissingRelationOrColumn(patch.error)) {
    return NextResponse.json({ error: patch.error.message }, { status: 500 });
  }

  return NextResponse.json({
    attachment_id: attachment.id,
    ticket_id: ticketId ?? attachment.ticket_id ?? null,
    status: "uploaded",
    url: `/api/v1/support/attachments/${attachment.id}?download=1`
  });
}
