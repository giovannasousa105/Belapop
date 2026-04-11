import { redirect } from "next/navigation";

export default function SellerLoginAliasPage() {
  redirect("/login?tab=partner");
}
