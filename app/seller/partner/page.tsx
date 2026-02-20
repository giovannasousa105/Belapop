"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const steps = [
  { title: "Cadastro", description: "Envie seus dados e conte sobre a marca." },
  { title: "Curadoria", description: "Analise editorial e alinhamento de vitrine." },
  { title: "Publicacao", description: "Produtos com narrativa e visual premium." },
  { title: "Vendas", description: "Checkout integrado e comunicacao com clientes." },
  { title: "Envio", description: "Frete por origem com rastreio claro." }
];

export default function SellerPartnerPage() {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [channel, setChannel] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const mailtoHref = useMemo(() => {
    const subject = "Cadastro de Lojista — BelaPop";
    const lines = [
      "Cadastro de lojista - BelaPop",
      "",
      `Nome: ${name || ""}`,
      `Marca: ${brand || ""}`,
      `Email: ${email || ""}`,
      `WhatsApp: ${whatsapp || ""}`,
      `Site / Instagram: ${channel || ""}`,
      `Categoria principal: ${category || ""}`,
      "",
      "Mensagem:",
      note || ""
    ];
    const body = lines.join("\n");
    return `mailto:giovannasousa105@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  }, [name, brand, email, whatsapp, channel, category, note]);

  return (
    <div className="min-h-screen bg-white text-bpBlackSoft">
      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="flex flex-col gap-8 rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">
              Parceria BelaPop
            </p>
            <h1 className="mt-2 font-display text-4xl text-bpBlack">
              Portal do Parceiro
            </h1>
            <p className="mt-3 text-sm text-bpGraphite/80">
              Venda com curadoria, logistica aveludada e vitrine editorial.
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">
              Como funciona
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-5">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                >
                  <p className="text-[10px] uppercase tracking-[0.3em] text-bpGraphite/60">
                    {index + 1}
                  </p>
                  <h2 className="mt-2 text-sm font-semibold text-bpBlackSoft">
                    {step.title}
                  </h2>
                  <p className="mt-2 text-xs text-bpGraphite/80">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">
              Envie seus dados
            </p>
            <h2 className="mt-2 font-display text-2xl text-bpBlack">
              Conte sobre sua marca
            </h2>
            <p className="mt-2 text-sm text-bpGraphite/80">
              Preencha as informacoes abaixo e envie diretamente para nossa equipe.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlackSoft shadow-sm focus:border-bpPink focus:outline-none"
              />
              <input
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                placeholder="Nome da marca"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlackSoft shadow-sm focus:border-bpPink focus:outline-none"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="E-mail para contato"
                type="email"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlackSoft shadow-sm focus:border-bpPink focus:outline-none"
              />
              <input
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="WhatsApp"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlackSoft shadow-sm focus:border-bpPink focus:outline-none"
              />
              <input
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                placeholder="Site ou Instagram"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlackSoft shadow-sm focus:border-bpPink focus:outline-none md:col-span-2"
              />
              <input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Categoria principal (ex: skincare, fragrancias)"
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlackSoft shadow-sm focus:border-bpPink focus:outline-none md:col-span-2"
              />
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Conte um pouco sobre sua marca e diferenciais"
                rows={4}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlackSoft shadow-sm focus:border-bpPink focus:outline-none md:col-span-2"
              />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={mailtoHref}
                className="rounded-full bg-bpPink px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-bpSoft"
              >
                Enviar para BelaPop
              </a>
              <span className="text-xs text-bpGraphite/70">
                O envio abre seu e-mail com os dados preenchidos.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/seller/login"
              className="rounded-full bg-bpPink px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-bpSoft"
            >
              Entrar
            </Link>
            <Link
              href="/seller/apply"
              className="rounded-full border border-black/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-bpGraphite"
            >
              Criar conta de lojista
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
