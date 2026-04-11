"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { Inter, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"]
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

type Product = {
  id: number;
  tag: string;
  name: string;
  price: string;
  image: string;
  formula: string;
  description: string;
  actives: string[];
  indication: string[];
};

type SupportCardData = {
  title: string;
  subtitle: string;
  product: Product;
};

const products: Product[] = [
  {
    id: 1,
    tag: "BEST-SELLER",
    name: "Serum Radiance 01",
    price: "R$ 289,00",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80",
    formula: "Peptídeos, niacinamida e esqualano",
    description:
      "O gesto central da vitrine: um sérum que entrega viço refinado, textura mais lisa e luminosidade silenciosa.",
    actives: ["Peptídeos", "Niacinamida", "Esqualano"],
    indication: ["Viço opaco", "Textura irregular", "Rotina de glow diário"]
  },
  {
    id: 2,
    tag: "ESCOLHA BelaPop",
    name: "Creme Barrier Celeste",
    price: "R$ 320,00",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=1200&q=80",
    formula: "Ceramidas, centella asiatica e ácido hialurônico",
    description:
      "Nutrição reparadora para restaurar a barreira, devolver conforto imediato e manter a pele macia ao toque.",
    actives: ["Ceramidas", "Centella asiatica", "Ácido hialurônico"],
    indication: ["Barreira fragilizada", "Ressecamento", "Conforto noturno"]
  },
  {
    id: 3,
    tag: "RITUAL DE LIMPEZA",
    name: "Gel Limpeza Veludo",
    price: "R$ 219,00",
    image:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1200&q=80",
    formula: "Centella asiatica, ceramidas e agentes suaves",
    description:
      "Limpeza delicada com sensação de veludo para preservar o conforto da pele e preparar a rotina com precisão.",
    actives: ["Centella asiatica", "Ceramidas", "Glicerina"],
    indication: ["Limpeza sensível", "Pele reativa", "Textura refinada"]
  },
  {
    id: 4,
    tag: "OLHAR",
    name: "Patch Olhos Aurora",
    price: "R$ 198,00",
    image:
      "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=1200&q=80",
    formula: "Cafeína, ácido hialurônico e pantenol",
    description:
      "Um refresh rápido e elegante para reduzir sinais de cansaço e devolver presença ao olhar em minutos.",
    actives: ["Cafeína", "Ácido hialurônico", "Pantenol"],
    indication: ["Olhar cansado", "Inchaço", "Pré-maquiagem"]
  },
  {
    id: 5,
    tag: "NOVA CAMADA",
    name: "Body Mist Rosa Profundo",
    price: "R$ 220,00",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    formula: "Blend floral, extratos botânicos e glicerina",
    description:
      "Bruma acetinada que estende o ritual para o corpo com presença rosada, toque confortável e assinatura sensorial.",
    actives: ["Extratos botânicos", "Glicerina", "Blend floral"],
    indication: ["Corpo", "Finalização sensorial", "Camada de presença"]
  }
];

const heroProduct = products[0];

const supportCards: SupportCardData[] = [
  {
    title: "Conforto Absoluto",
    subtitle: "Barreira reparada com textura cremosa e conforto imediato.",
    product: products[1]
  },
  {
    title: "Textura Refinada",
    subtitle: "Limpeza suave para deixar a pele pronta para os próximos passos.",
    product: products[2]
  },
  {
    title: "Olhar Renovado",
    subtitle: "Refresca e suaviza sinais de cansaço com gesto rápido.",
    product: products[3]
  },
  {
    title: "Presença Sensorial",
    subtitle: "Uma camada floral e acetinada para prolongar o ritual.",
    product: products[4]
  }
];

function ProductPreviewModal({
  product,
  onClose
}: {
  product: Product | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!product) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(27,14,11,0.58)] px-4 py-6 backdrop-blur-[4px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[1180px] overflow-hidden rounded-[34px] border border-[rgba(242,222,214,0.74)] bg-[#fffaf7] shadow-[0_40px_120px_rgba(43,18,15,0.26)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fechar preview do produto"
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(102,63,58,0.16)] bg-white/82 text-[28px] leading-none text-[#6B5148] transition hover:bg-white"
        >
          ×
        </button>

        <div className="grid lg:grid-cols-[0.94fr_1.06fr]">
          <div className="relative min-h-[360px] overflow-hidden bg-[linear-gradient(180deg,#f4ddd3_0%,#e7bda9_52%,#c88772_100%)] lg:min-h-[680px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,244,238,0.46)_0%,rgba(255,244,238,0.1)_26%,transparent_64%),linear-gradient(118deg,rgba(255,255,255,0.42)_6%,transparent_18%,transparent_30%,rgba(255,222,208,0.16)_38%,transparent_48%,rgba(255,255,255,0.22)_60%,transparent_74%)]" />
            <div className="absolute inset-x-[20%] bottom-[18%] h-16 rounded-[999px] bg-[radial-gradient(circle,rgba(255,233,220,0.8)_0%,rgba(255,204,183,0.36)_44%,transparent_74%)] blur-2xl" />
            <div className="absolute inset-x-[23%] bottom-[8%] h-8 rounded-[999px] bg-[linear-gradient(180deg,#f0c6b2_0%,#9e5f4e_100%)] shadow-[0_16px_40px_rgba(73,28,21,0.34)]" />
            <div className="absolute inset-x-[11%] top-[9%] bottom-[12%] rounded-[34px] border border-white/24 bg-[linear-gradient(180deg,rgba(255,248,244,0.08),rgba(255,248,244,0.02))]" />
            <img
              src={product.image}
              alt={product.name}
              className="absolute left-1/2 top-[9%] h-[72%] w-[58%] -translate-x-1/2 rounded-[32px] object-cover shadow-[0_28px_70px_rgba(73,28,21,0.24)]"
            />
          </div>

          <div className="p-8 md:p-10 lg:p-12">
            <p
              className={`${inter.className} inline-flex rounded-full bg-[#f4ddd4] px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[#8A4C47]`}
            >
              {product.tag}
            </p>

            <h3
              className={`${playfair.className} mt-6 text-4xl leading-[0.94] tracking-[-0.03em] text-[#5B232C] md:text-6xl`}
            >
              {product.name}
            </h3>

            <p
              className={`${inter.className} mt-4 text-[17px] font-medium text-[#5B232C] md:text-[18px]`}
            >
              {product.price}
            </p>

            <div className="mt-6 h-px w-full bg-[rgba(123,74,68,0.12)]" />

            <p
              className={`${playfair.className} mt-7 text-[30px] leading-[1.18] text-[#6B3B34] md:text-[34px]`}
            >
              {product.formula}
            </p>

            <p
              className={`${inter.className} mt-6 max-w-xl text-[18px] leading-9 text-[#4E352F]`}
            >
              {product.description}
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <div className="rounded-[22px] border border-[rgba(138,106,98,0.12)] bg-[#fbf3ee] p-5">
                <p className={`${playfair.className} text-[22px] text-[#5B232C]`}>
                  Ativos principais
                </p>
                <ul
                  className={`${inter.className} mt-4 space-y-3 text-[17px] leading-8 text-[#6B5148]`}
                >
                  {product.actives.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[22px] border border-[rgba(138,106,98,0.12)] bg-[#fbf3ee] p-5">
                <p className={`${playfair.className} text-[22px] text-[#5B232C]`}>
                  Indicação
                </p>
                <ul
                  className={`${inter.className} mt-4 space-y-3 text-[17px] leading-8 text-[#6B5148]`}
                >
                  {product.indication.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                className={`${inter.className} rounded-full bg-[linear-gradient(135deg,#6D1F2D,#8B2D39)] px-8 py-4 text-[15px] font-medium text-white shadow-[0_16px_34px_rgba(109,31,45,0.26)] transition hover:scale-[1.01] hover:opacity-95`}
              >
                Adicionar ao carrinho
              </button>

              <button
                type="button"
                className={`${inter.className} rounded-full border border-[rgba(127,86,81,0.4)] bg-white/60 px-8 py-4 text-[15px] font-medium text-[#6B3B34] transition hover:bg-white`}
              >
                Comprar agora
              </button>
            </div>

            <Link
              href="/vitrine"
              className={`${inter.className} mt-7 inline-flex text-[16px] text-[#6B5148] transition hover:text-[#5B232C]`}
            >
              Ver produto completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportCard({
  title,
  subtitle,
  product,
  onOpen
}: SupportCardData & { onOpen: (product: Product) => void }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => onOpen(product)}
      className="group w-full text-left"
    >
      <article className="h-full rounded-[28px] border border-[rgba(255,246,242,0.56)] bg-[linear-gradient(180deg,rgba(255,250,247,0.94),rgba(251,241,235,0.86))] p-4 shadow-[0_22px_50px_rgba(67,22,20,0.16)] backdrop-blur-sm transition duration-500 hover:-translate-y-1 hover:rotate-[-1deg] hover:shadow-[0_28px_60px_rgba(67,22,20,0.22)]">
        <div className="overflow-hidden rounded-[20px]">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-[1.08] w-full object-cover transition duration-700 group-hover:scale-110 group-hover:rotate-[1.5deg]"
          />
        </div>

        <div className="mt-4">
          <p
            className={`${playfair.className} text-[26px] leading-[1.02] tracking-[-0.02em] text-[#5A2C2E]`}
          >
            {title}
          </p>
          <p className={`${inter.className} mt-3 text-[15px] leading-7 text-[#6F554D]`}>
            {subtitle}
          </p>
        </div>
      </article>
    </button>
  );
}

function CtaCard() {
  return (
    <article className="flex h-full flex-col justify-between rounded-[28px] border border-[rgba(255,246,242,0.56)] bg-[linear-gradient(180deg,rgba(255,247,244,0.96),rgba(248,231,224,0.9))] p-5 shadow-[0_22px_50px_rgba(67,22,20,0.16)] backdrop-blur-sm">
      <div>
        <p
          className={`${inter.className} text-[11px] uppercase tracking-[0.3em] text-[#9D605F]`}
        >
          Glow Perfeito
        </p>
        <h3
          className={`${playfair.className} mt-3 text-[30px] leading-[1.02] tracking-[-0.02em] text-[#5A2C2E]`}
        >
          Kits exclusivos para completar o ritual.
        </h3>
        <p className={`${inter.className} mt-4 text-[15px] leading-7 text-[#6F554D]`}>
          Uma seleção comprável para transformar desejo editorial em rotina pronta.
        </p>
      </div>

      <Link
        href="/vitrine"
        className={`${inter.className} mt-6 inline-flex items-center justify-center rounded-full border border-[rgba(111,61,56,0.3)] bg-[rgba(110,47,42,0.86)] px-6 py-3 text-[13px] uppercase tracking-[0.24em] text-white transition hover:translate-y-[-1px] hover:bg-[#5b232c]`}
      >
        Ver kits exclusivos
      </Link>
    </article>
  );
}

export default function BelaPopPremiumShelf() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [heroTilt, setHeroTilt] = useState({ rotateX: 0, rotateY: 0, scale: 1 });

  const handleHeroMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((offsetX - centerX) / centerX) * 8;
    const rotateX = ((centerY - offsetY) / centerY) * 6;

    setHeroTilt({
      rotateX,
      rotateY,
      scale: 1.06
    });
  };

  const resetHeroTilt = () => {
    setHeroTilt({
      rotateX: 0,
      rotateY: 0,
      scale: 1
    });
  };

  return (
    <>
      <section
        id="vitrine"
        className="border-b border-[#DDD3CA] bg-[#F6F1EB] px-6 py-16 md:px-10 lg:px-14 lg:py-20"
      >
        <div className="mx-auto max-w-[1500px]">
          <div className="relative overflow-hidden rounded-[42px] border border-[rgba(198,141,123,0.34)] px-6 py-12 shadow-[0_34px_100px_rgba(83,32,28,0.16)] sm:px-8 md:px-10 lg:px-14 lg:py-16">
            <div className="absolute inset-0 bg-[linear-gradient(140deg,#915344_0%,#c88370_26%,#b46c59_52%,#8a4f43_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,244,236,0.36)_0%,rgba(255,244,236,0.1)_26%,transparent_58%),radial-gradient(circle_at_20%_16%,rgba(255,231,221,0.28)_0%,transparent_42%),radial-gradient(circle_at_82%_18%,rgba(255,231,221,0.22)_0%,transparent_38%),radial-gradient(circle_at_50%_72%,rgba(255,220,203,0.18)_0%,transparent_48%)]" />
            <div className="absolute inset-0 opacity-70 [background:linear-gradient(118deg,rgba(255,255,255,0.38)_4%,transparent_16%,transparent_28%,rgba(255,226,210,0.14)_36%,transparent_46%,transparent_56%,rgba(255,255,255,0.18)_64%,transparent_76%),linear-gradient(74deg,rgba(111,63,49,0.18)_12%,transparent_24%,rgba(255,246,240,0.22)_40%,transparent_50%,rgba(126,74,59,0.16)_62%,transparent_74%)] blur-[2px]" />
            <div className="absolute inset-0 opacity-55 [background:radial-gradient(1200px_420px_at_-12%_12%,rgba(255,255,255,0.26)_0%,transparent_60%),radial-gradient(900px_300px_at_108%_14%,rgba(255,235,226,0.2)_0%,transparent_62%),radial-gradient(880px_260px_at_50%_88%,rgba(84,33,28,0.18)_0%,transparent_66%)]" />
            <div className="absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,rgba(255,249,246,0.18),rgba(255,249,246,0))]" />
            <div className="relative z-10">
              <div className="mx-auto max-w-4xl text-center">
                <p
                  className={`${playfair.className} text-[28px] italic text-[#fff4ee] md:text-[36px]`}
                >
                  Edição Premium BelaPop
                </p>
                <h2
                  className={`${playfair.className} mx-auto mt-4 max-w-4xl text-4xl uppercase leading-[0.96] tracking-[-0.03em] text-[#fff7f2] sm:text-5xl lg:text-[68px]`}
                >
                  Descubra o segredo da pele perfeita
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(heroProduct)}
                  className={`${inter.className} mt-8 inline-flex rounded-full border border-[rgba(255,241,235,0.38)] bg-[rgba(104,43,37,0.86)] px-8 py-3 text-[13px] uppercase tracking-[0.24em] text-white shadow-[0_18px_36px_rgba(83,32,28,0.24)] transition hover:translate-y-[-1px] hover:bg-[#5b232c]`}
                >
                  Experimente agora
                </button>
              </div>

              <div className="mt-14 lg:hidden">
                <div className="mx-auto max-w-[420px]">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setSelectedProduct(heroProduct)}
                    className="group relative w-full"
                  >
                    <div className="absolute inset-x-[6%] top-[18%] h-[56%] rounded-full bg-[radial-gradient(circle,rgba(255,235,218,0.82)_0%,rgba(255,209,186,0.24)_46%,transparent_76%)] blur-3xl" />
                    <div className="absolute inset-x-[18%] bottom-8 h-14 rounded-[999px] bg-[linear-gradient(180deg,#f0c1ab_0%,#9e5d4c_100%)] shadow-[0_16px_40px_rgba(73,28,21,0.38)]" />
                    <div className="relative overflow-hidden rounded-[34px] border border-[rgba(255,245,240,0.5)] bg-[linear-gradient(180deg,rgba(255,248,243,0.34),rgba(255,248,243,0.08))] p-4 shadow-[0_28px_70px_rgba(73,28,21,0.28)]">
                      <img
                        src={heroProduct.image}
                        alt={heroProduct.name}
                        className="aspect-[4/5] w-full rounded-[28px] object-cover transition duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="relative mt-6 text-center">
                      <p
                        className={`${inter.className} text-[11px] uppercase tracking-[0.3em] text-[#ffe9e1]`}
                      >
                        Hero Product
                      </p>
                      <p
                        className={`${playfair.className} mt-3 text-[34px] leading-none text-white`}
                      >
                        {heroProduct.name}
                      </p>
                      <p className={`${inter.className} mt-2 text-[15px] text-[#ffe5dd]`}>
                        {heroProduct.price}
                      </p>
                    </div>
                  </button>
                </div>

                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  {supportCards.map((card) => (
                    <SupportCard
                      key={card.product.id}
                      title={card.title}
                      subtitle={card.subtitle}
                      product={card.product}
                      onOpen={setSelectedProduct}
                    />
                  ))}
                  <div className="sm:col-span-2">
                    <CtaCard />
                  </div>
                </div>
              </div>

              <div className="relative mt-16 hidden lg:block lg:min-h-[760px]">
                <div className="absolute left-0 top-[18%] z-10 flex w-[24%] flex-col gap-6 xl:w-[22%]">
                  {supportCards.slice(0, 2).map((card) => (
                    <SupportCard
                      key={card.product.id}
                      title={card.title}
                      subtitle={card.subtitle}
                      product={card.product}
                      onOpen={setSelectedProduct}
                    />
                  ))}
                </div>

                <div className="absolute right-0 top-[18%] z-10 flex w-[24%] flex-col gap-6 xl:w-[22%]">
                  {supportCards.slice(2).map((card) => (
                    <SupportCard
                      key={card.product.id}
                      title={card.title}
                      subtitle={card.subtitle}
                      product={card.product}
                      onOpen={setSelectedProduct}
                    />
                  ))}
                  <CtaCard />
                </div>

                <div className="pointer-events-none absolute inset-x-[26%] top-[15%] bottom-[16%] z-0 bg-[radial-gradient(circle,rgba(255,233,220,0.34)_0%,rgba(255,233,220,0.12)_30%,transparent_72%)] blur-2xl" />

                <div className="absolute left-1/2 top-[7%] z-20 w-full max-w-[430px] -translate-x-1/2">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => setSelectedProduct(heroProduct)}
                    onMouseMove={handleHeroMouseMove}
                    onMouseLeave={resetHeroTilt}
                    onBlur={resetHeroTilt}
                    className="group relative mx-auto block w-full text-left [transform-style:preserve-3d]"
                    style={{
                      transform: `perspective(1400px) rotateX(${heroTilt.rotateX}deg) rotateY(${heroTilt.rotateY}deg) rotateZ(-2deg) scale(${heroTilt.scale})`,
                      transition: "transform 220ms ease, filter 220ms ease"
                    }}
                  >
                    <div className="absolute inset-x-[8%] top-[14%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(255,239,228,0.92)_0%,rgba(255,217,195,0.32)_42%,transparent_76%)] blur-3xl" />
                    <div className="absolute inset-x-[22%] bottom-8 h-16 rounded-[999px] bg-[linear-gradient(180deg,#f7cfba_0%,#b66753_100%)] shadow-[0_22px_46px_rgba(73,28,21,0.42)]" />
                    <div className="absolute inset-x-[30%] bottom-2 h-8 rounded-[999px] bg-[radial-gradient(circle,rgba(47,14,11,0.42)_0%,transparent_76%)] blur-xl" />
                    <div className="relative overflow-hidden rounded-[38px] border border-[rgba(255,247,243,0.54)] bg-[linear-gradient(180deg,rgba(255,250,247,0.28),rgba(255,250,247,0.06))] p-5 shadow-[0_38px_90px_rgba(73,28,21,0.34)] backdrop-blur-[2px] transition duration-500 group-hover:shadow-[0_46px_110px_rgba(73,28,21,0.4)]">
                      <img
                        src={heroProduct.image}
                        alt={heroProduct.name}
                        className="aspect-[4/5] w-full rounded-[30px] object-cover transition duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="relative mt-7 text-center">
                      <p
                        className={`${inter.className} text-[11px] uppercase tracking-[0.32em] text-[#ffe9e0]`}
                      >
                        Hero Product
                      </p>
                      <p
                        className={`${playfair.className} mt-3 text-[42px] leading-none text-white`}
                      >
                        {heroProduct.name}
                      </p>
                      <p className={`${inter.className} mt-2 text-[16px] text-[#ffe0d6]`}>
                        {heroProduct.price}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductPreviewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
