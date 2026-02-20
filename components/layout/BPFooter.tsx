"use client";

import Link from "next/link";

import { Section } from "@/components/ui/Section";

const instagramUrl =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/belapop.oficial";
const facebookUrl =
  process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/belapopoficial";
const tiktokUrl =
  process.env.NEXT_PUBLIC_TIKTOK_URL || "https://tiktok.com/@belapop.oficial";

export function BPFooter() {
  return (
    <footer className="border-t border-bpPink/20 bg-bpBlack text-bpOffWhite">
      <Section className="py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-bpPinkSoft">
              Atendimento
            </p>
            <ul className="mt-4 space-y-2 text-sm text-bpOffWhite/85">
              <li>Concierge: Seg a Sex, 8h as 20h</li>
              <li>Sabado: 9h as 20h</li>
              <li>contato@belapop.com.br</li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-bpPinkSoft">
              Institucional
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="/sobre" className="text-bpOffWhite/85 hover:text-bpPinkSoft">
                Sobre a BelaPop
              </Link>
              <Link href="/termos" className="text-bpOffWhite/85 hover:text-bpPinkSoft">
                Termos e Condicoes
              </Link>
              <Link href="/privacidade" className="text-bpOffWhite/85 hover:text-bpPinkSoft">
                Aviso de Privacidade
              </Link>
              <Link href="/carreiras" className="text-bpOffWhite/85 hover:text-bpPinkSoft">
                Trabalhe Conosco
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-bpPinkSoft">
              Social
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link href={instagramUrl} target="_blank" className="text-bpOffWhite/85 hover:text-bpPinkSoft">
                Instagram
              </Link>
              <Link href={facebookUrl} target="_blank" className="text-bpOffWhite/85 hover:text-bpPinkSoft">
                Facebook
              </Link>
              <Link href={tiktokUrl} target="_blank" className="text-bpOffWhite/85 hover:text-bpPinkSoft">
                TikTok
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-bpPinkSoft">
              Newsletter
            </p>
            <p className="mt-4 text-sm text-bpOffWhite/75">
              Receba edicoes da curadoria e notas do Diario BelaPop.
            </p>
            <form className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="w-full rounded-bpMd border border-bpOffWhite/20 bg-bpBlackSoft px-3 py-2 text-sm text-bpOffWhite placeholder:text-bpOffWhite/45"
              />
              <button
                type="submit"
                className="rounded-bpMd bg-bpPink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-bpOffWhite"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 border-t border-bpOffWhite/10 pt-6 text-xs text-bpOffWhite/60">
          © {new Date().getFullYear()} BelaPop. Curadoria editorial de beleza e autocuidado.
        </div>
      </Section>
    </footer>
  );
}
