import {
  belapopCompany,
  belapopOperationalContacts
} from "@/lib/legal/content";
import { buildBelapopMailto } from "@/lib/brand/contact";

type InstitutionalIdentityCardProps = {
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
  showSellerNotice?: boolean;
};

export function InstitutionalIdentityCard({
  tone = "light",
  compact = false,
  className = "",
  showSellerNotice = true
}: InstitutionalIdentityCardProps) {
  const isDark = tone === "dark";
  const labelClass = isDark
    ? "text-white/55"
    : "text-[#6d6667]";
  const valueClass = isDark
    ? "text-white"
    : "text-[#1c1b1b]";
  const containerClass = isDark
    ? "border-white/10 bg-white/[0.04]"
    : "border-black/10 bg-white";
  const institutionalHref = buildBelapopMailto(
    belapopOperationalContacts.institutionalEmail,
    "Atendimento BelaPop"
  );
  const privacyHref = buildBelapopMailto(
    belapopOperationalContacts.privacyChannel,
    "Solicitação LGPD - BelaPop"
  );

  return (
    <section className={`rounded-[28px] border p-5 sm:p-6 ${containerClass} ${className}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.28em] ${labelClass}`}>
        IDENTIFICAÇÃO DA BELAPOP
      </p>
      <div className={compact ? "mt-4 space-y-3" : "mt-4 space-y-4"}>
        <div>
          <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>RAZÃO SOCIAL</p>
          <p className={`mt-1 text-sm leading-6 ${valueClass}`}>{belapopCompany.legalName}</p>
        </div>
        <div>
          <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>CNPJ</p>
          <p className={`mt-1 text-sm leading-6 ${valueClass}`}>{belapopCompany.cnpj}</p>
        </div>
        <div>
          <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>ENDEREÇO COMERCIAL</p>
          <p className={`mt-1 text-sm leading-6 ${valueClass}`}>{belapopCompany.address}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>E-mail institucional</p>
            <div className="mt-2">
              <a className={`text-sm underline-offset-4 hover:underline ${valueClass}`} href={institutionalHref}>
                {belapopOperationalContacts.institutionalEmail}
              </a>
            </div>
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>Canal de privacidade</p>
            <div className="mt-2">
              <a className={`text-sm underline-offset-4 hover:underline ${valueClass}`} href={privacyHref}>
                {belapopOperationalContacts.privacyChannel}
              </a>
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>
              ENCARREGADO(A) / RESPONSÁVEL POR DADOS
            </p>
            <div className="mt-2">
              <p className={`text-sm ${valueClass}`}>
                {belapopOperationalContacts.dpoName} - {belapopOperationalContacts.dpoChannel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showSellerNotice ? (
        <div
          className={`mt-5 rounded-[24px] border px-4 py-4 text-sm leading-6 ${
            isDark
              ? "border-white/10 bg-black/20 text-white/80"
              : "border-[#ece3e4] bg-[#fcf7f7] text-[#3e3637]"
          }`}
        >
          A BelaPop atua como plataforma de curadoria e venda. Quando um seller parceiro
          participar do pedido, a identificação fica visível antes da conclusão da compra.
        </div>
      ) : null}
    </section>
  );
}
