import { getPartnerPortalAccess } from "@/lib/auth/partnerPortal";

function buildWhatsappHref() {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const phone = raw.replace(/\D/g, "");
  if (!phone) return null;
  const text = encodeURIComponent("Ola, preciso de suporte no portal do parceiro BelaPop.");
  return `https://wa.me/${phone}?text=${text}`;
}

export default async function ParceiroSuportePage() {
  await getPartnerPortalAccess({ requirePartner: true });
  const whatsappHref = buildWhatsappHref();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Suporte</p>
        <h1 className="mt-2 font-display text-4xl text-bpBlack">Canal dedicado ao parceiro</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <a
          href="mailto:giovannasousa105@gmail.com?subject=Suporte%20Parceiro%20BelaPop"
          className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-semibold text-bpBlackSoft shadow-sm"
        >
          Enviar e-mail
        </a>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-semibold text-bpBlackSoft shadow-sm"
          >
            WhatsApp concierge
          </a>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-bpGraphite/70 shadow-sm">
            WhatsApp indisponivel no momento.
          </div>
        )}
        <a
          href="/seller/notifications"
          className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-semibold text-bpBlackSoft shadow-sm"
        >
          Ver notificacoes
        </a>
      </div>
    </div>
  );
}

