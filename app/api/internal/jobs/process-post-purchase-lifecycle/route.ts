import { NextRequest, NextResponse } from "next/server";

import { isInternalJobAuthorized } from "@/lib/internal/jobs";
import { dailyLifecycleProcessor } from "@/lib/lifecycle/postPurchase";

export const runtime = "nodejs";

async function handle(request: NextRequest) {
  if (!isInternalJobAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado para job interno." }, { status: 401 });
  }

  const now = request.nextUrl.searchParams.get("now") ?? undefined;
  const result = dailyLifecycleProcessor({ now });

  return NextResponse.json({
    ok: true,
    processor: "post_purchase_lifecycle_mock",
    ...result,
    messages: result.messages.map((message) => ({
      messageId: message.messageId,
      customerId: message.customerId,
      orderId: message.orderId,
      templateId: message.templateId,
      channel: message.channel,
      status: message.status,
      scheduledAt: message.scheduledAt
    }))
  });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
