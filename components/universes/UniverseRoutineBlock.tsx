import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

import { BundleAddToCartButton } from "@/components/bundles/BundleAddToCartButton";
import type {
  BelaPopUniverse,
  UniverseRoutine
} from "@/lib/discovery/universes";
import { getSkinBundleById } from "@/lib/skincare/skincareBundles";

type UniverseRoutineBlockProps = {
  universe: BelaPopUniverse;
  routines: UniverseRoutine[];
};

export function UniverseRoutineBlock({ universe, routines }: UniverseRoutineBlockProps) {
  if (!routines.length) return null;

  return (
    <section id="rotinas" className="bg-[#fcf9f8] px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
            Rotinas recomendadas
          </p>
          <h2 className="mt-4 font-headline text-4xl leading-tight tracking-normal sm:text-5xl">
            Por onde comecar dentro deste universo.
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#5f5a55]">
            {universe.skinScanPrompt}
          </p>

          <div id="comece" className="mt-8 grid gap-4 sm:grid-cols-2">
            {universe.startHere.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group border border-[#ded8d2] bg-white p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(28,27,27,0.07)]"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6c5e06]">
                  Comece por aqui
                </p>
                <h3 className="mt-3 font-headline text-3xl leading-tight tracking-normal">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#5f5a55]">{item.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.20em] text-[#1c1b1b]">
                  {item.cta}
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          {routines.map((routine) => {
            const bundle = getSkinBundleById(routine.bundleId);

            return (
              <article key={routine.id} className="border border-[#ded8d2] bg-white p-6 shadow-[0_24px_80px_rgba(28,27,27,0.06)]">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6c5e06]">
                  {routine.subtitle}
                </p>
                <h3 className="mt-3 font-headline text-4xl leading-none tracking-normal">
                  {routine.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#5f5a55]">{routine.description}</p>
                <ol className="mt-6 grid gap-3">
                  {routine.steps.map((step) => (
                    <li key={step.label} className="flex gap-3 border-t border-[#ece6e0] pt-3">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#6c5e06]" aria-hidden="true" />
                      <span>
                        <strong className="block text-sm uppercase tracking-[0.16em] text-[#1c1b1b]">
                          {step.label}
                        </strong>
                        <span className="mt-1 block text-sm leading-6 text-[#5f5a55]">
                          {step.description}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 grid gap-3">
                  {bundle ? (
                    <BundleAddToCartButton bundle={bundle} label="Adicionar kit ao carrinho" />
                  ) : null}
                  <Link
                    href={routine.href}
                    className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#1c1b1b] px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
                  >
                    {routine.cta}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
