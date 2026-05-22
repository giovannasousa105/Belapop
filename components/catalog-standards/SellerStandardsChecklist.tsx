import type { SellerQualityStandard, StandardChecklistItem } from "@/lib/catalog-standards";
import { ProductStandardsChecklist } from "@/components/catalog-standards/ProductStandardsChecklist";

type SellerStandardsChecklistProps = {
  className?: string;
  seller: SellerQualityStandard;
};

export function SellerStandardsChecklist({ className = "", seller }: SellerStandardsChecklistProps) {
  const checks: StandardChecklistItem[] = [
    { label: "Dados cadastrais completos", passed: Boolean(seller.brandName && seller.legalName && seller.cnpj), required: true },
    { label: "Contato comercial", passed: Boolean(seller.contact.email && seller.contact.phone), required: true },
    { label: "Origem de envio", passed: Boolean(seller.shippingOriginAddress), required: true },
    { label: "Logo e banner", passed: Boolean(seller.logoUrl && seller.bannerUrl), required: true },
    { label: "Políticas de troca e devolucao", passed: Boolean(seller.returnPolicy.summary && seller.returnPolicy.exchangeRules), required: true },
    { label: "Nota fiscal confirmada", passed: seller.invoiceIssuanceConfirmed, required: true },
    { label: "Autenticidade confirmada", passed: seller.productAuthenticityConfirmed, required: true },
    { label: "Seller aprovado", passed: ["approved", "verified-belapop"].includes(seller.verificationStatus), required: true }
  ];

  return <ProductStandardsChecklist className={className} checks={checks} title="Checklist de seller" />;
}
