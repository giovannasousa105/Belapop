"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase/client";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?audience=customer&returnTo=/login/nova-senha`
    });

    if (error) {
      setStatus("error");
      setErrorMsg("Não foi possível enviar o email. Verifique o endereço e tente novamente.");
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fcf9f8] px-5 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-black/50 hover:text-black"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao login
        </Link>

        <h1 className="font-[var(--font-playfair)] text-3xl font-medium tracking-[-0.03em] text-black">
          Recuperar senha
        </h1>
        <p className="mt-3 text-sm leading-7 text-black/60">
          Informe seu email e enviaremos um link para você criar uma nova senha.
        </p>

        {status === "sent" ? (
          <div className="mt-8 rounded-2xl border border-[#1D9E75]/20 bg-[#f0fdf4] px-5 py-6">
            <p className="font-semibold text-[#1D9E75]">Verifique seu email</p>
            <p className="mt-2 text-sm text-black/65">
              Enviamos um link de recuperação para <strong>{email}</strong>. Verifique também a caixa de spam.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex text-[11px] font-semibold uppercase tracking-[0.16em] underline underline-offset-4"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.22em] text-black/60">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-12 w-full border border-black/15 bg-white px-4 text-sm text-black placeholder:text-black/35 focus:border-black focus:outline-none"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="min-h-12 w-full bg-black text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-black/85 disabled:opacity-60"
            >
              {status === "loading" ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
