"use client";

import { useEffect, useState } from "react";

import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

export default function AccountReviewsPage() {
  const { ready, user } = useAuth();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    const supabase = getSupabaseClient();
    setLoading(true);
    const load = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id,rating,title,body,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setRows(data ?? []);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [ready, user]);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Avaliações"
        subtitle="Compartilhe suas experiências com a curadoria BelaPop."
      />
      {loading ? (
        <p className="text-sm text-bpGraphite/70">Carregando...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/80">
          Sem avaliações no momento. Assim que seus pedidos forem entregues, você
          poderá compartilhar sua experiência.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-black/10 bg-white p-5 text-sm">
              <p className="font-semibold text-bpBlackSoft">
                {row.title ?? "Avaliação"}
              </p>
              <p className="text-xs text-bpGraphite/70">
                Nota {row.rating} • {new Date(row.created_at).toLocaleDateString("pt-BR")}
              </p>
              {row.body && <p className="mt-2 text-sm text-bpGraphite/80">{row.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
