import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type CampaignStatus = "active" | "scheduled" | "expired" | "paused";

export type AdminCampaign = {
  id: string;
  code: string;
  percentOff: number | null;
  amountOffCents: number | null;
  minSubtotalCents: number | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string | null;
  status: CampaignStatus;
};

const getStatus = (row: {
  is_active: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
}): CampaignStatus => {
  if (!row.is_active) return "paused";

  const now = new Date();
  const startsAt = row.starts_at ? new Date(row.starts_at) : null;
  const endsAt = row.ends_at ? new Date(row.ends_at) : null;

  if (startsAt && startsAt > now) return "scheduled";
  if (endsAt && endsAt < now) return "expired";
  return "active";
};

const mapCampaign = (row: any): AdminCampaign => ({
  id: row.id,
  code: row.code ?? "",
  percentOff: typeof row.percent_off === "number" ? row.percent_off : null,
  amountOffCents: typeof row.amount_off_cents === "number" ? row.amount_off_cents : null,
  minSubtotalCents: typeof row.min_subtotal_cents === "number" ? row.min_subtotal_cents : null,
  isActive: Boolean(row.is_active),
  startsAt: row.starts_at ?? null,
  endsAt: row.ends_at ?? null,
  createdAt: row.created_at ?? null,
  status: getStatus(row)
});

export async function fetchAdminCampaigns(): Promise<AdminCampaign[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("id,code,percent_off,amount_off_cents,min_subtotal_cents,is_active,starts_at,ends_at,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/campaigns] fetch failed", error);
    return [];
  }

  return (data ?? []).map(mapCampaign);
}
