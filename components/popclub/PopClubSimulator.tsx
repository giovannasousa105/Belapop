"use client";

import { useState } from "react";

const MIN_SPEND = 50;
const MAX_SPEND = 1000;
const STEP = 50;

const ESSENCIAL_RATE = 1.0;
const PREMIUM_RATE = 1.25;
const LUXO_RATE = 1.5;
const PREMIUM_THRESHOLD = 1500;
const LUXO_THRESHOLD = 4000;
const PREMIUM_CREDIT_BLOCK = 2000;
const PREMIUM_CREDIT_VALUE = 50;
const LUXO_CREDIT_BLOCK = 4000;
const LUXO_CREDIT_VALUE = 120;

function calcSimulation(monthlySpend: number) {
  const monthsToEssential = 0;

  const monthsToPremiun = PREMIUM_THRESHOLD / (monthlySpend * ESSENCIAL_RATE);
  const remainingForLuxo = LUXO_THRESHOLD - PREMIUM_THRESHOLD;
  const monthsToLuxo = monthsToPremiun + remainingForLuxo / (monthlySpend * PREMIUM_RATE);

  const annualSpend = monthlySpend * 12;
  const pointsIn12m = monthsToPremiun <= 12
    ? PREMIUM_THRESHOLD + (annualSpend - PREMIUM_THRESHOLD / ESSENCIAL_RATE) * PREMIUM_RATE
    : annualSpend * ESSENCIAL_RATE;

  let annualCredit = 0;
  if (monthsToLuxo <= 12) {
    const pointsAfterLuxo = pointsIn12m - LUXO_THRESHOLD;
    annualCredit =
      Math.floor(LUXO_THRESHOLD / LUXO_CREDIT_BLOCK) * LUXO_CREDIT_VALUE +
      Math.floor(Math.max(0, pointsAfterLuxo) / LUXO_CREDIT_BLOCK) * LUXO_CREDIT_VALUE;
  } else if (monthsToPremiun <= 12) {
    annualCredit = Math.floor(Math.max(0, pointsIn12m - PREMIUM_THRESHOLD) / PREMIUM_CREDIT_BLOCK) * PREMIUM_CREDIT_VALUE;
  }

  const monthlyPoints = monthlySpend * ESSENCIAL_RATE;

  return {
    monthlyPoints: Math.round(monthlyPoints),
    monthsToPremiun: Math.ceil(monthsToPremiun),
    monthsToLuxo: Math.ceil(monthsToLuxo),
    annualCredit,
    monthsToEssential,
  };
}

const formatBrl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function PopClubSimulator() {
  const [spend, setSpend] = useState(300);
  const sim = calcSimulation(spend);

  return (
    <section className="bg-[#f6f3f2] px-5 py-18 md:px-8 md:py-28">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <span className="text-[10px] uppercase tracking-[0.34em] text-[#ed93d5]">Simulador</span>
          <h2 className="mt-4 font-[var(--font-playfair)] text-4xl font-bold tracking-[-0.05em] md:text-5xl">
            Quanto você acumularia?
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#444748]">
            Ajuste o valor médio de compra mensal e veja o quanto seus pontos renderiam no clube.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-8 md:p-10">
          <div className="mb-8">
            <div className="mb-3 flex items-baseline justify-between">
              <label htmlFor="spend-slider" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/60">
                Compra mensal média
              </label>
              <span className="font-[var(--font-playfair)] text-3xl font-bold tracking-[-0.03em]">
                {formatBrl.format(spend)}
              </span>
            </div>
            <input
              id="spend-slider"
              type="range"
              min={MIN_SPEND}
              max={MAX_SPEND}
              step={STEP}
              value={spend}
              onChange={(e) => setSpend(Number(e.target.value))}
              className="w-full cursor-pointer accent-[#1c1b1b]"
            />
            <div className="mt-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-black/35">
              <span>{formatBrl.format(MIN_SPEND)}</span>
              <span>{formatBrl.format(MAX_SPEND)}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="border border-black/8 bg-[#f6f3f2] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">Pontos / mês</p>
              <p className="mt-3 font-[var(--font-playfair)] text-4xl font-bold tracking-[-0.04em]">
                {sim.monthlyPoints.toLocaleString("pt-BR")}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#444748]">no nível Essencial</p>
            </div>

            <div className="border border-black/8 bg-[#f6f3f2] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">Chega ao Premium</p>
              <p className="mt-3 font-[var(--font-playfair)] text-4xl font-bold tracking-[-0.04em]">
                {sim.monthsToPremiun === 1 ? "1 mês" : `${sim.monthsToPremiun} meses`}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#444748]">
                {sim.monthsToLuxo <= 24
                  ? `Luxo em ${sim.monthsToLuxo} ${sim.monthsToLuxo === 1 ? "mês" : "meses"}`
                  : "Luxo em mais de 24 meses"}
              </p>
            </div>

            <div className="border border-black/8 bg-[#f6f3f2] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">Crédito em 12 meses</p>
              <p className="mt-3 font-[var(--font-playfair)] text-4xl font-bold tracking-[-0.04em]">
                {sim.annualCredit > 0 ? formatBrl.format(sim.annualCredit) : "—"}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#444748]">
                {sim.annualCredit > 0 ? "crédito real para usar na rotina" : "disponível a partir do Premium"}
              </p>
            </div>
          </div>

          <p className="mt-6 text-[11px] leading-5 text-black/35">
            Simulação aproximada. Pontos acumulados em compras elegíveis. Créditos liberados conforme as regras de cada nível.
          </p>
        </div>
      </div>
    </section>
  );
}
