import { paymentProviders, savedCards } from "@/components/home/luxury-home/data";
import { headlineClassName, IconGlyph } from "@/components/home/luxury-home/shared";

function SectionHeader({ title, step }: { title: string; step: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <h2 className={`${headlineClassName} text-3xl text-[#1c1b1b]`}>{title}</h2>
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#444748]">
        {step}
      </span>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  className = ""
}: {
  label: string;
  placeholder: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#444748]">
        {label}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        className="border-0 border-b border-black/15 bg-white py-3 px-0 text-sm text-[#1c1b1b] placeholder:text-[#747878] focus:ring-0"
      />
    </label>
  );
}

export function CheckoutFormSection() {
  return (
    <div className="space-y-16">
      <section>
        <SectionHeader title="Dados de Entrega" step="Passo 01" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="Nome completo" placeholder="Como no documento" />
          <Field label="E-mail" placeholder="seu@email.com" type="email" />
          <Field
            label="Endereco"
            placeholder="Rua, numero e complemento"
            className="md:col-span-2"
          />
          <Field label="Cidade" placeholder="Ex: Sao Paulo" />
          <Field label="CEP" placeholder="00000-000" />
        </div>
      </section>

      <section>
        <SectionHeader title="Metodo de Pagamento" step="Passo 02" />

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {paymentProviders.map((provider) => (
            <button
              key={provider.label}
              type="button"
              className="flex min-h-[68px] items-center justify-center gap-3 border border-black/10 px-4 py-4 transition-all duration-300 hover:bg-black hover:text-white"
            >
              <span className="text-xs font-bold uppercase tracking-[0.2em]">
                {provider.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-black/10" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]">
            Ou pague com
          </span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-4 border border-black bg-white px-5 py-5">
            <input
              type="radio"
              name="payment"
              defaultChecked
              className="text-black focus:ring-0"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest">
                Cartao de Credito
              </span>
              <span className="text-[10px] text-[#444748]">Ate 10x sem juros</span>
            </div>
          </label>

          <label className="flex cursor-pointer items-center gap-4 border border-black/10 bg-[#f6f3f2] px-5 py-5 transition-colors hover:border-black/25">
            <input type="radio" name="payment" className="text-black focus:ring-0" />
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest">Pix</span>
              <span className="text-[10px] text-[#444748]">Confirmacao instantanea</span>
            </div>
          </label>
        </div>

        <div className="space-y-8">
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#444748]">
              Cartoes salvos
            </span>
            <div className="relative">
              <select className="w-full appearance-none border-0 border-b border-black/15 bg-white py-3 px-0 text-sm text-[#1c1b1b] focus:ring-0">
                {savedCards.map((card) => (
                  <option key={card} value={card}>
                    {card}
                  </option>
                ))}
              </select>
              <IconGlyph
                name="expand_more"
                className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#444748]"
              />
            </div>
          </label>

          <Field label="Numero do cartao" placeholder="0000 0000 0000 0000" />

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <Field label="Validade" placeholder="MM/AA" />
            <Field label="CVV" placeholder="123" />
          </div>

          <label className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded-none border-black/20 text-black focus:ring-0"
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#444748]">
              Salvar este cartao para futuras curadorias
            </span>
          </label>
        </div>
      </section>
    </div>
  );
}
