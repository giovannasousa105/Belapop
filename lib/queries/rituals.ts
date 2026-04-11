import "server-only";

export type EditorialRitual = {
  slug: string;
  title: string;
  subtitle: string;
  coverImageUrl: string;
};

const rituals: EditorialRitual[] = [
  {
    slug: "ritual-noturno",
    title: "Ritual Noturno",
    subtitle: "Texturas que abracam a pele depois de um dia intenso.",
    coverImageUrl: "/editorial/ritual-noturno.svg"
  },
  {
    slug: "presenca-diurna",
    title: "Presenca Diurna",
    subtitle: "Glow elegante para mulheres que lideram.",
    coverImageUrl: "/editorial/presenca-diurna.svg"
  },
  {
    slug: "essencia-sensorial",
    title: "Essencia Sensorial",
    subtitle: "Aromas, toques e memorias em forma de ritual.",
    coverImageUrl: "/editorial/essencia-sensorial.svg"
  },
  {
    slug: "edicao-limitada",
    title: "Edicao Limitada",
    subtitle: "Pecas raras. Desejo imediato.",
    coverImageUrl: "/editorial/edicao-limitada.svg"
  }
];

export async function getPublicRituals(): Promise<EditorialRitual[]> {
  return rituals;
}
