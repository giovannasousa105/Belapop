import type {
  FooterLinkGroup,
  NavLink,
  RecommendationProduct
} from "@/components/home/luxury-home/types";
import { popClubPaths } from "@/lib/popclub/navigation";

export const primaryNavigation: NavLink[] = [
  { href: "/skincare", label: "Skincare" },
  { href: "/catalogo?categoria=maquiagem", label: "Maquiagem" },
  { href: "/catalogo?categoria=cabelos", label: "Cabelos" },
  { href: "/catalogo?categoria=perfumes", label: "Perfumes" },
  { href: "/skin-scan", label: "Skin Scan Bela" }
];

export const utilityNavigation: NavLink[] = [
  { href: popClubPaths.landing, label: "PopClub" },
  { href: "/conta/favoritos", label: "Favoritos" }
];

export const checkoutProduct: RecommendationProduct = {
  brand: "LA MER",
  title: "Creme de la Mer",
  description: "Tamanho: 60ml",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCKaCm8GffGhvkwjEIUwKj8ESM6Vq3V3_IE8xCnmGxTcnaHGYtxkQ0Jia5rvBNQ03l89ahkcogFtyILTlxZpKBokuLmomdNE0LdSCoryycTdFN7owqzgGbjpqxLTuRSND4-Otmd-C0ic9ZxtUteuLOFrQmZNLMluybcazl8vv7NTtX7lhojX2FQav0Z8kdkeVTuJt2mmR4nWqvu_AAhUvH3XTXaCmd4lN06-3nqdBh8zD34vU2Wv-x7qPxI4Vv8fp_CEpVAERTwqMJW",
  alt: "Creme de la Mer",
  href: "/produto/creme-de-la-mer"
};

export const paymentProviders = [
  { label: "Apple Pay", description: "Carteira digital premium" },
  { label: "Google Pay", description: "Checkout instantaneo" }
];

export const savedCards = [
  "Usar um novo cartao",
  "**** 4242 (Visa)",
  "**** 8888 (Mastercard)"
];

export const footerGroups: FooterLinkGroup[] = [
  {
    title: "Atendimento ao Cliente",
    links: [
      { href: "/contato", label: "Fale Conosco" },
      { href: "/contato", label: "Perguntas Frequentes" },
      { href: "/minha-conta", label: "Meus Pedidos" },
      { href: "/minha-conta", label: "Minha Conta" },
      { href: "/contato", label: "Devolucoes e Reembolsos" }
    ]
  },
  {
    title: "Institucional",
    links: [
      { href: "/sobre", label: "Sobre a BelaPop" },
      { href: "/seguranca", label: "Seguranca" },
      { href: "/carreiras", label: "Trabalhe Conosco" }
    ]
  },
  {
    title: "Legal",
    links: [
      { href: "/aviso-de-privacidade", label: "Aviso de Privacidade" },
      { href: "/termos-e-condicoes", label: "Termos e Condicoes Gerais" },
      { href: "/politica-de-cookies", label: "Cookies" },
      { href: "/politica-de-cookies", label: "Personalizar cookies" }
    ]
  }
];

export const socialLinks = [
  { href: "#", label: "Instagram" },
  { href: "#", label: "TikTok" },
  { href: "#", label: "Facebook" },
  { href: "#", label: "WhatsApp" }
];

export const paymentLogos = [
  {
    alt: "Mastercard",
    className: "h-4 w-auto",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBsYzzKGSgK2tl7nCKrslOBD7rWkFM5wg0N6KvnCzSyNmA1hlcSutiL1f6cyfa0gmAXtCEC1Pk_VwZWzOOez09_0TyVmpsS_VzCXb83HeAq74T7m5YqlYd7zEQ5yrnVL2_gcB5-xjvjbVOgk4fDJ_NQr1Q-bE2e0RCxcUAO6LUlpaOa9CdvpHQc15Ab9VAUMUBQ91aCfug1WVttztzAAUiyA0iYCA-CduDLJehcrf_ANXWlbAo_Q4VKpSZuR2m-3EBLsT_2g341xU8Z"
  },
  {
    alt: "Visa",
    className: "h-3 w-auto",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXpWe2OJzNvlrlADHQ3wh2M9dNaYoTjrpqLhH_urU5waesE4aoijG16Dl6qLhrQPeRvpocCfXUa-ojkKBF2_fpxDft3lr8Nz3OiEwr96fH8QhuuTH4jym8LcBjOmrWC888WGsjPTU5JOPnkgE-sIMqudY-eHnZsk7UMKZ0BxDhPclUMoi47a1fcmZRXLdqJmjPDvxxNCMftSbKsg6ilPt6EGQYnIZr8L12m425ftwEQzDgEdr1JxVxIXOel6ZUi8Xj1TKlAjz5pAF8"
  },
  {
    alt: "American Express",
    className: "h-5 w-auto",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnzIlyCHQZCVPTzSHFqVDGpZZ694JPXeCMnZ5tywsjBAWCsC_Q-sWd87eukljAt4O_JaxE7THjOV93GBDFOcA4WqMOXtgUvZ34_EY0tgmulMn5L2ecjCrMqP9uJv7EhZVx4X9eGC2WtZtYosglzywlomdIckVuhUx2h6CcDH9qgKFu7x1lcdwtp1tdY-NHTK8RbUAqOivcZP79U0jBq4YJmJ3QaYayYJ0iYIBc2fLmU0wTCa7h0dfAL06PusO92MzmiMEypgGwaElC"
  },
  {
    alt: "Elo",
    className: "h-4 w-auto",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_GczbgOGVTWoA3kumPAOpLUUF2JgLwoTul5PerckDfuF5OcgSvtkqLV7jVNR6neF1H9-8pxVr5ywy5FdnX9uKhvOVeIIFxacpxt5CssVecyhmTU_3yiWwdVOxAeEXRLS19w1_2CQwt-tb6x9IcDopQLh0Nh_aY-Np_EsM_Ozj6ew6vH6zqkeJyr9mLTOoTWdMVyqQgXibmK-Iqi4dpFFOHPhmpFhamyGbE3SpQ362b6eKolJS2lSHRBMRsC0a_8_VJQEXGW4qAoVF"
  }
];
