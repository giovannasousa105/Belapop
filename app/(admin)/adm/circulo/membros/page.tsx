import type { Metadata } from "next";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Membros do Círculo | ADM",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const CONCERN_LABELS: Record<string, string> = {
  acne:    "Acne",
  spots:   "Manchas",
  barrier: "Barreira",
  aging:   "Firmeza",
  shine:   "Brilho/Poros",
  unsure:  "Não sei ainda",
};

const SPEND_LABELS: Record<string, string> = {
  lt150:   "Até R$150",
  "150_300": "R$150–300",
  "300_600": "R$300–600",
  gt600:   "+R$600",
};

export default async function MembrosPage() {
  const supabase = getSupabaseAdminClient();

  const { data: members, error, count } = await supabase
    .from("circulo_members")
    .select("id, name, email, whatsapp_e164, skin_concern, spend_range, consent_marketing, created_at, welcome_email_sent_at, welcome_whatsapp_sent_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);

  const totalActive = members?.filter((m) => m.consent_marketing).length ?? 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Membros do Círculo</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {count ?? 0} inscritos · {totalActive} ativos (com consentimento de marketing)
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          Erro ao carregar membros: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">E-mail</th>
              <th className="px-4 py-3 text-left">WhatsApp</th>
              <th className="px-4 py-3 text-left">Preocupação</th>
              <th className="px-4 py-3 text-left">Investimento</th>
              <th className="px-4 py-3 text-left">Email ok</th>
              <th className="px-4 py-3 text-left">WPP ok</th>
              <th className="px-4 py-3 text-left">Inscrito em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {!members?.length && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-neutral-400">
                  Nenhum membro inscrito ainda.
                </td>
              </tr>
            )}
            {members?.map((m) => (
              <tr key={m.id} className={`hover:bg-neutral-50 ${!m.consent_marketing ? "opacity-50" : ""}`}>
                <td className="px-4 py-3 font-medium text-neutral-900">{m.name}</td>
                <td className="px-4 py-3 text-xs text-neutral-600">{m.email}</td>
                <td className="px-4 py-3 text-xs text-neutral-600">{m.whatsapp_e164}</td>
                <td className="px-4 py-3 text-xs">{CONCERN_LABELS[m.skin_concern] ?? m.skin_concern}</td>
                <td className="px-4 py-3 text-xs">{SPEND_LABELS[m.spend_range] ?? m.spend_range}</td>
                <td className="px-4 py-3 text-center text-xs">
                  {m.welcome_email_sent_at ? "✓" : <span className="text-neutral-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center text-xs">
                  {m.welcome_whatsapp_sent_at ? "✓" : <span className="text-neutral-300">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {new Date(m.created_at as string).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
