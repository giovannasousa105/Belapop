import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cancelamento de inscrição — Círculo BelaPop",
  robots: { index: false, follow: false },
};

type Status = "success" | "invalid" | "error";

export default async function CirculoCancelarPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const config: Record<Status, { title: string; body: string }> = {
    success: {
      title: "Inscrição cancelada.",
      body: "Você não receberá mais comunicações do Círculo BelaPop. Se mudar de ideia, pode se inscrever novamente a qualquer momento.",
    },
    invalid: {
      title: "Link inválido ou expirado.",
      body: "Este link de cancelamento não é válido. Se precisar cancelar sua inscrição, entre em contato pelo atendimento.",
    },
    error: {
      title: "Algo deu errado.",
      body: "Não foi possível processar o cancelamento. Tente novamente ou entre em contato com o atendimento.",
    },
  };

  const current = config[(status as Status) ?? "invalid"] ?? config.invalid;

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-bpGraphite/40">
          Círculo BelaPop
        </p>
        <h1 className="text-xl font-semibold text-bpBlack">{current.title}</h1>
        <p className="text-sm leading-relaxed text-bpGraphite/70">{current.body}</p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/"
            className="rounded-full border border-neutral-200 px-5 py-2.5 text-xs tracking-wider transition-colors hover:border-bpBlack"
          >
            Página inicial
          </Link>
          <Link
            href="/contato"
            className="rounded-full bg-bpBlack px-5 py-2.5 text-xs tracking-wider text-white transition-colors hover:bg-neutral-700"
          >
            Atendimento
          </Link>
        </div>
      </div>
    </main>
  );
}
