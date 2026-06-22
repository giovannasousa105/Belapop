import "server-only";

type DeliveryResult = {
  ok: boolean;
  provider: string;
  remoteId?: string | null;
  error?: string | null;
};

type EmailInput = {
  to: string;
  subject: string;
  body: string;
  html?: string | null;
};

type WhatsAppInput = {
  to: string;
  body: string;
};

const readEnv = (name: string) => {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const safeJson = async (response: Response) => {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const safeText = async (response: Response) => {
  try {
    return (await response.text()).slice(0, 800);
  } catch {
    return "unknown_error";
  }
};

const htmlEscape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const normalizeWhatsappAddress = (value: string) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const stripped = raw.replace(/[^\d+]/g, "");
  if (!stripped) return null;
  const prefixed = stripped.startsWith("+")
    ? stripped
    : stripped.startsWith("00")
      ? `+${stripped.slice(2)}`
      : stripped.startsWith("55")
        ? `+${stripped}`
        : `+55${stripped}`;
  return prefixed.startsWith("whatsapp:") ? prefixed : `whatsapp:${prefixed}`;
};

const sendEmailResend = async (input: EmailInput): Promise<DeliveryResult> => {
  const apiKey = readEnv("RESEND_API_KEY");
  const from = readEnv("RESEND_FROM_EMAIL");
  if (!apiKey || !from) {
    return {
      ok: false,
      provider: "resend",
      error: "resend_not_configured: RESEND_API_KEY/RESEND_FROM_EMAIL"
    };
  }

  const replyTo = readEnv("EMAIL_REPLY_TO") ?? readEnv("EMAIL_CONTATO");
  const unsubEmail = readEnv("EMAIL_CONTATO") ?? replyTo;

  const payload: Record<string, unknown> = {
    from,
    to: [input.to],
    subject: input.subject,
    text: input.body,
    html:
      input.html && input.html.trim().length > 0
        ? input.html
        : `<p>${htmlEscape(input.body).replaceAll("\n", "<br/>")}</p>`
  };

  if (replyTo) payload.reply_to = replyTo;
  if (unsubEmail) {
    payload.headers = {
      "List-Unsubscribe": `<mailto:${unsubEmail}?subject=cancelar-inscricao>`
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return {
      ok: false,
      provider: "resend",
      error: `resend_http_${response.status}: ${await safeText(response)}`
    };
  }

  const data = await safeJson(response);
  return {
    ok: true,
    provider: "resend",
    remoteId: typeof data?.id === "string" ? data.id : null
  };
};

const sendWhatsappTwilio = async (input: WhatsAppInput): Promise<DeliveryResult> => {
  const accountSid = readEnv("TWILIO_ACCOUNT_SID");
  const authToken = readEnv("TWILIO_AUTH_TOKEN");
  const from = normalizeWhatsappAddress(readEnv("TWILIO_WHATSAPP_FROM") ?? "");
  const to = normalizeWhatsappAddress(input.to);

  if (!accountSid || !authToken || !from) {
    return {
      ok: false,
      provider: "twilio",
      error: "twilio_not_configured: TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM"
    };
  }
  if (!to) {
    return {
      ok: false,
      provider: "twilio",
      error: "invalid_whatsapp_recipient"
    };
  }

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: input.body
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    }
  );

  if (!response.ok) {
    return {
      ok: false,
      provider: "twilio",
      error: `twilio_http_${response.status}: ${await safeText(response)}`
    };
  }

  const data = await safeJson(response);
  return {
    ok: true,
    provider: "twilio",
    remoteId: typeof data?.sid === "string" ? data.sid : null
  };
};

const sendWhatsappZapi = async (input: WhatsAppInput): Promise<DeliveryResult> => {
  const instanceId = readEnv("ZAPI_INSTANCE_ID");
  const token = readEnv("ZAPI_TOKEN");
  const clientToken = readEnv("ZAPI_CLIENT_TOKEN");

  if (!instanceId || !token) {
    return {
      ok: false,
      provider: "zapi",
      error: "zapi_not_configured: ZAPI_INSTANCE_ID/ZAPI_TOKEN"
    };
  }

  const to = String(input.to ?? "").replace(/\D/g, "");
  if (!to) {
    return {
      ok: false,
      provider: "zapi",
      error: "invalid_whatsapp_recipient"
    };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;

  const response = await fetch(
    `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ phone: to, message: input.body })
    }
  );

  if (!response.ok) {
    return {
      ok: false,
      provider: "zapi",
      error: `zapi_http_${response.status}: ${await safeText(response)}`
    };
  }

  const data = await safeJson(response);
  return {
    ok: true,
    provider: "zapi",
    remoteId: typeof data?.messageId === "string" ? data.messageId : null
  };
};

export const deliverEmailNotification = async (input: EmailInput): Promise<DeliveryResult> => {
  const provider = (readEnv("NOTIFICATION_EMAIL_PROVIDER") ?? "resend").toLowerCase();
  if (provider === "resend") return sendEmailResend(input);

  return {
    ok: false,
    provider,
    error: `email_provider_not_supported:${provider}`
  };
};

export const deliverWhatsAppNotification = async (
  input: WhatsAppInput
): Promise<DeliveryResult> => {
  // Z-API roda em paralelo ao provider padrão, atrás de feature flag (default off).
  if (readEnv("ZAPI_ENABLED") === "true") return sendWhatsappZapi(input);

  const provider = (readEnv("NOTIFICATION_WHATSAPP_PROVIDER") ?? "twilio").toLowerCase();
  if (provider === "twilio") return sendWhatsappTwilio(input);
  if (provider === "zapi") return sendWhatsappZapi(input);

  return {
    ok: false,
    provider,
    error: `whatsapp_provider_not_supported:${provider}`
  };
};
