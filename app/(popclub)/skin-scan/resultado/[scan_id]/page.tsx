import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { SkinIdCard } from "@/components/skinScan/SkinIdCard";
import { RotinaDisplay } from "@/components/skinScan/RotinaDisplay";
import type { SkinProfile } from "@/lib/skinScan/types";
import type { RotinaResult } from "@/lib/skinScan/rotinaBuilder";

export const dynamic = "force-dynamic"; // resultado é personalizado — sem cache

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scan_id: string }>;
}): Promise<Metadata> {
  const { scan_id } = await params;
  return {
    title: "Seu resultado | Skin Scan BelaPop",
    description: `Perfil de pele e rotina personalizada. Referência: ${scan_id.slice(0, 8).toUpperCase()}`,
  };
}

type PageProps = {
  params: Promise<{ scan_id: string }>;
};

export default async function SkinScanResultadoPage({ params }: PageProps) {
  const { scan_id } = await params;
  const admin = getSupabaseAdminClient();

  // Buscar scan + dados associados em paralelo
  const [scanResult, profileResult, rotinasResult] = await Promise.all([
    admin
      .from("skin_scans")
      .select("id, skin_id, status")
      .eq("id", scan_id)
      .maybeSingle(),
    admin
      .from("scan_skin_profiles")
      .select("skin_profile, perfil_resumo")
      .eq("skin_scan_id", scan_id)
      .maybeSingle(),
    admin
      .from("scan_rotinas")
      .select("periodo, rotina")
      .eq("skin_scan_id", scan_id),
  ]);

  const scan = scanResult.data;

  // Se o scan não existe ou ainda não concluiu, redirecionar
  if (!scan) {
    redirect("/skin-scan/foco");
  }

  if (scan.status !== "CONCLUIDO") {
    redirect(`/skin-scan/processando/${scan_id}`);
  }

  const skinProfile = profileResult.data?.skin_profile as SkinProfile | null;
  const narrativa = profileResult.data?.perfil_resumo ?? null;

  const rotinasMap: Record<string, RotinaResult> = {};
  for (const r of rotinasResult.data ?? []) {
    rotinasMap[r.periodo as string] = r.rotina as RotinaResult;
  }

  if (!skinProfile || !scan.skin_id) {
    redirect(`/skin-scan/processando/${scan_id}`);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bp-offwhite, #fbf7f4)",
        color: "var(--bp-black, #1e1e1e)",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      {/* Nav simplificada */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--bp-offwhite, #fbf7f4)",
          borderBottom: "1px solid rgba(30,30,30,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: 60,
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Skin Scan
        </p>

        <Link
          href="/skin-scan/foco"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(30,30,30,0.45)",
            textDecoration: "none",
          }}
          aria-label="Refazer análise"
        >
          <RotateCcw size={12} />
          Refazer
        </Link>
      </header>

      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        {/* ── Skin ID Card (dados estáticos, server-rendered) ─────────────── */}
        <section style={{ paddingTop: 40 }}>
          <SkinIdCard
            skinId={scan.skin_id as string}
            skinProfile={skinProfile}
            narrativa={narrativa}
            scanId={scan_id}
          />
        </section>

        {/* ── Separador ───────────────────────────────────────────────────── */}
        <div
          aria-hidden
          style={{
            height: 1,
            background: "rgba(30,30,30,0.08)",
            margin: "40px 0",
          }}
        />

        {/* ── Rotina (client component com tabs e cart) ────────────────────── */}
        <section>
          <RotinaDisplay
            rotinasManha={(rotinasMap["manha"] as RotinaResult) ?? null}
            rotinasNoite={(rotinasMap["noite"] as RotinaResult) ?? null}
            scanId={scan_id}
          />
        </section>
      </main>
    </div>
  );
}
