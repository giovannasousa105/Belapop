"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { formatPrice } from "@/lib/utils";

type FavoriteRow = {
  id: string;
  product_id: string;
  products:
    | {
        id: string;
        name: string;
        price_cents: number;
      }[]
    | null;
};

export default function AccountFavoritesPage() {
  const { ready, user } = useAuth();
  const [rows, setRows] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    const load = async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id,product_id,products(id,name,price_cents)")
        .eq("user_id", user.id);
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
        title="Favoritos"
        subtitle="Sua lista de desejos com assinatura editorial."
      />
      {loading ? (
        <p className="text-sm text-noir-500">Carregando...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-noir-600">
          Nada salvo ainda. Explore a curadoria e guarde seus favoritos.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => {
            const product = row.products?.[0] ?? null;
            return (
              <Link
                key={row.id}
                href={`/produto/${row.product_id}`}
                className="rounded-2xl border border-black/10 bg-white p-5 text-sm shadow-sm"
              >
                <p className="font-semibold text-noir-900">
                  {product?.name ?? "Produto"}
                </p>
                <p className="mt-2 text-sm text-noir-600">
                  {formatPrice((product?.price_cents ?? 0) / 100)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
