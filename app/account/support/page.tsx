"use client";

import { useEffect, useState } from "react";

import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";

type TicketRow = {
  id: string;
  status: string;
  subject: string;
  created_at: string;
};

export default function AccountSupportPage() {
  const { ready, user } = useAuth();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    const supabase = getSupabaseClient();
    const load = async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("id,status,subject,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setTickets(data ?? []);
    };
    void load();
    return () => {
      active = false;
    };
  }, [ready, user]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!subject || !message) {
      setStatusMessage("Preencha assunto e mensagem.");
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    const supabase = getSupabaseClient();
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject, status: "open" })
      .select()
      .single();
    if (error || !ticket) {
      setStatusMessage(error?.message ?? "Não foi possível abrir o ticket.");
      setLoading(false);
      return;
    }
    await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_role: "customer",
      message
    });
    setTickets((prev) => [ticket as TicketRow, ...prev]);
    setSubject("");
    setMessage("");
    setLoading(false);
    setStatusMessage("Ticket criado. Nossa equipe responderá em breve.");
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Ajuda"
        subtitle="Estamos aqui para manter sua experiência impecável."
      />

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Novo ticket</p>
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Assunto"
            className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Conte-nos o que está acontecendo."
            className="min-h-[120px] w-full rounded-2xl border border-black/10 px-4 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-bpPink px-5 py-2 text-xs uppercase tracking-[0.3em] text-white shadow-bpSoft disabled:opacity-60"
          >
            Enviar
          </button>
          {statusMessage && <p className="text-xs text-bpPink">{statusMessage}</p>}
        </form>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Meus tickets</p>
        {tickets.length === 0 ? (
          <p className="mt-4 text-sm text-bpGraphite/80">Nenhum ticket aberto.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between rounded-2xl border border-black/10 p-4 text-sm"
              >
                <div>
                  <p className="font-semibold text-bpBlackSoft">{ticket.subject}</p>
                  <p className="text-xs text-bpGraphite/70">
                    {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
