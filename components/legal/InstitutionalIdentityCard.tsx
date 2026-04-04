import {
  belapopCompany,
  belapopOperationalContacts
} from "@/lib/legal/content";

type InstitutionalIdentityCardProps = {
  tone?: "light" | "dark";
  compact?: boolean;
  className?: string;
  showSellerNotice?: boolean;
};

function PlaceholderValue() {
  return (
    <span className="inline-flex rounded-full border border-[#d7c3c6] bg-[#fff6f7] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c5d66]">
      Pendente de validacao operacional
    </span>
  );
}

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

  return (
    <section className={`rounded-[28px] border p-5 sm:p-6 ${containerClass} ${className}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.28em] ${labelClass}`}>
        Identificacao da BelaPop
      </p>
      <div className={compact ? "mt-4 space-y-3" : "mt-4 space-y-4"}>
        <div>
          <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>Razao social</p>
          <p className={`mt-1 text-sm leading-6 ${valueClass}`}>{belapopCompany.legalName}</p>
        </div>
        <div>
          <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>CNPJ</p>
          <p className={`mt-1 text-sm leading-6 ${valueClass}`}>{belapopCompany.cnpj}</p>
        </div>
        <div>
          <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>Endereco comercial</p>
          <p className={`mt-1 text-sm leading-6 ${valueClass}`}>{belapopCompany.address}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>E-mail institucional</p>
            <div className="mt-2">
              {belapopOperationalContacts.institutionalEmail ? (
                <p className={`text-sm ${valueClass}`}>
                  {belapopOperationalContacts.institutionalEmail}
                </p>
              ) : (
                <PlaceholderValue />
              )}
            </div>
          </div>
          <div>
            <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>Canal de privacidade</p>
            <div className="mt-2">
              {belapopOperationalContacts.privacyChannel ? (
                <p className={`text-sm ${valueClass}`}>
                  {belapopOperationalContacts.privacyChannel}
                </p>
              ) : (
                <PlaceholderValue />
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className={`text-[10px] uppercase tracking-[0.22em] ${labelClass}`}>
              Encarregado(a) / responsavel por dados
            </p>
            <div className="mt-2">
              {belapopOperationalContacts.dpoName || belapopOperationalContacts.dpoChannel ? (
                <p className={`text-sm ${valueClass}`}>
                  {[belapopOperationalContacts.dpoName, belapopOperationalContacts.dpoChannel]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              ) : (
                <PlaceholderValue />
              )}
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
          A BelaPop e a vendedora direta por padrao. Seller parceiro so existe quando essa
          informacao estiver destacada de forma clara antes da conclusao da compra.
        </div>
      ) : null}
    </section>
  );
}
