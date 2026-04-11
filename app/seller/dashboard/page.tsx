import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function SellerDashboardLegacyRedirectPage({
  searchParams
}: PageProps) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();

  for (const [key, raw] of Object.entries(params)) {
    const value = firstValue(raw);
    if (!value) continue;
    query.set(key, value);
  }

  const qs = query.toString();
  redirect(qs ? `/parceiro?${qs}` : "/parceiro");
}
