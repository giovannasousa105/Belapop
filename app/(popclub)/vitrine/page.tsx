import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Vitrine de Recompensas | BelaPop",
  description:
    "Galeria premium de recompensas POPCLUB com resgates, beneficios do programa e curadoria editorial."
};

type RewardItem = {
  title: string;
  description: string;
  points: string;
  cta: string;
  image: string;
  locked: boolean;
  badge?: string;
};

const rewards: RewardItem[] = [
  {
    title: "Mascara de Seda",
    description:
      "Pura seda mulberry para uma noite de descanso absoluto e protecao para sua pele.",
    points: "5.000 pontos",
    cta: "Resgatar",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAMXCkqD2SFMwQWEN0nOFP0nzVN9dt0e-kIEE4Z81GVS4CR8iMQaJLNtgCGX1GkaeU0u-8ayH_t9lTYwzNJci6MD0olk33H4LSPsagKAx8dL-z5uT1KKOUt5dDacEd8MicpPMAGBvR46O0KryYnVu11bSH0sg0F8n0mMYCoNxalYrgX4oEFbCJLZmBmWXD-AdrbPBn7PnSRBIUTOgFoloTfPmw-XyS02FyFRZ4M_cf941l0am5ExvyXE4RgHF4mNYIBG5sIwdC5pT-e",
    locked: false
  },
  {
    title: "Espatula Metalica",
    description:
      "Design ergonomico em aco inoxidavel para uma aplicacao precisa e higienica.",
    points: "3.500 pontos",
    cta: "Resgatar",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Jn2wxpm8UWpIL1iQvz0_YZ9YuANElns469pzZqexHNOJhcgQPpJo6Yb6xCALuEzYK7ub-LV2-pLUsm5g8P1LrzWeofP79GtxD7oleDWI_41S5QIZWgLMgEnoO892tX9CRKIn_ke6873uoTNtsfSed4HLBsAwDnP-2RabtNQSh43LZxWe5h041xkuGeo-JrMwhqxa71oOWiKCNi-VtcpBfW_9RqMjN5AYDJKXPHG27XXAUw9cBaC2Hz_Rt5N9U7te2gSJpusQ5QVk",
    locked: false
  },
  {
    title: "Kit Atelier",
    description:
      "Experiencia completa de cuidado artesanal com acessorios exclusivos de edicao limitada.",
    points: "12.000 pontos",
    cta: "Solicitar acesso",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA0ldIQ7sAt3YhQbTgIvX9SFrEXG7gT1jn8zTl3yEKJJCRfnWisCx8GeIKpgt47A9sCnswya7lZaQpOYrhiMRvNImi3n5InGhwpkzfXZduOT4UXutAPsWexEyRB8oTmEcopGMvOWooYIjlru-QVjyxKx-ggQ0pm4oDErX3i1tFi0lB3eELViXxZQkuX3UoMfCl8bXxQBK3Czsq_AH5mH47BfQBIcAvRCS39zAyUSuDx5JqRRPxZLMhuCx-J2C3g2dkRsf8dNZbp9NI3",
    locked: true,
    badge: "Platinum exclusive"
  },
  {
    title: "Vela Santal",
    description:
      "Fragrancia envolvente de sandalo e couro para transformar o ambiente do seu ritual.",
    points: "4.500 pontos",
    cta: "Resgatar",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDkuKav3O-if87RVYBUdaxa1_lobVgbg5qVP0b_SX2dPo8nFAsG_6-UGthG2CYRxvyARbe9tx029WjEigcW4CVmWDfXBWv9zLOQQNt1mNBqBV6j_AJFeNfW0bRH27TPZW7vxfN2KUvvBNS-1fULVEwTiBbdbPuionKLlY_T55VXvYEzJhvepRYhC_XSx91bYisNl-KxVqfPgSNTR3XG1V8gr2VkGKGWVpGMIxyyDyPDjyYZ-9BoClzQS7f__aYbkAeqX1V6ltb_DSnl",
    locked: false
  },
  {
    title: "O Elixir",
    description:
      "A joia da coroa. Nossa formulacao mais potente e rara, disponivel apenas para o topo do clube.",
    points: "20.000 pontos",
    cta: "Bloqueado",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDBMfcNecGO-sBqNAc_20N5ZEiaxElQjgZMpbJb6HCBEHlMM2YPk0sJJcvmF40U4WE5EDlkP_92re11nP31SpGs_EdnaB5hhF3P8MFCEG4tu1GL3BjpI6a_qS3JQlm36GO44OOVptRWvma1g45JnHndVKb6g19Nw6SoCATSn7IG1tOdJBwoaecqwHCijxENzNLYMC60F9RNho1OnJtU8kZNtPJjMOPiManUowgkao-ByQvBa1wyUs-5ER0jYXfD5CfoSY516dukHtLQ",
    locked: true,
    badge: "Member only"
  }
] as const;

function RewardCard({
  title,
  description,
  points,
  cta,
  image,
  locked,
  badge
}: RewardItem) {
  return (
    <article
      className={`relative flex flex-col ${locked ? "opacity-90" : ""}`}
      data-belapop-section="reward-card"
    >
      <div className={`relative overflow-hidden bg-[#f0eded] ${locked ? "grayscale" : ""}`}>
        <div className="relative aspect-[4/5] w-full sm:aspect-[4/3] xl:aspect-[4/5]">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="mx-4 -mt-14 bg-[#fcf9f8] p-6 shadow-[0_10px_34px_rgba(0,0,0,0.06)] sm:mx-6 sm:p-8">
        {locked && badge ? (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-600">
              {badge}
            </span>
          </div>
        ) : null}

        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="max-w-[60%] font-[var(--font-playfair)] text-[1.75rem] font-semibold leading-tight text-[#1c1b1b]">
            {title}
          </h3>
          <span
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
              locked
                ? "text-[#444748]/70"
                : "bg-black text-white"
            }`}
          >
            {points}
          </span>
        </div>

        <p className="mb-6 text-sm leading-7 text-[#444748]">{description}</p>

        <button
          type="button"
          disabled={locked}
          className={`min-h-12 w-full text-[10px] font-extrabold uppercase tracking-[0.24em] transition ${
            locked
              ? "cursor-not-allowed border border-black text-black opacity-50"
              : "bg-black text-white hover:bg-[#2a2929]"
          }`}
        >
          {cta}
        </button>
      </div>
    </article>
  );
}

export default function VitrinePage() {
  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b]" data-belapop-page="vitrine-recompensas">
      <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-28 lg:pt-14">
        <section className="mb-14 lg:mb-18">
          <div className="flex flex-col gap-8 border-b border-black/8 pb-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <span className="block text-[10px] font-bold uppercase tracking-[0.32em] text-[#6f6a66]">
                PopClub rewards
              </span>
              <h1 className="font-[var(--font-playfair)] text-[2.25rem] font-semibold leading-[0.95] tracking-[-0.04em] text-[#1c1b1b] sm:text-5xl lg:text-6xl">
                Vitrine de
                <br />
                recompensas
              </h1>
            </div>

            <div className="w-full max-w-[440px] bg-black p-7 text-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
              <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">
                Saldo disponivel
              </p>
              <p className="mt-3 font-[var(--font-playfair)] text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                24.850
              </p>
              <p className="mt-3 text-sm leading-7 text-white/70">
                Seu saldo atual libera resgates imediatos e acesso a beneficios exclusivos do clube.
              </p>
              <button
                type="button"
                className="mt-6 border-b border-white pb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white"
              >
                Historico de resgates
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-20 lg:space-y-24">
          <div className="grid gap-20 md:grid-cols-2 xl:grid-cols-3">
            {rewards.map((reward) => (
              <RewardCard key={reward.title} {...reward} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
