import { redirect } from "next/navigation";

export default async function PopClubNivelPage({
  params,
}: {
  params: Promise<{ nivel: string }>;
}) {
  const { nivel } = await params;
  redirect(`/popclub#${nivel}`);
}
