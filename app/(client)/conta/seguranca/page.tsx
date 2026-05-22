import { redirect } from "next/navigation";

export default function ContaSegurancaPage() {
  redirect("/mfa?next=%2Fconta%2Fseguranca");
}
