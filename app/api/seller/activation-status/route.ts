import { NextRequest, NextResponse } from "next/server";

import { ensureSellerAuthenticated } from "@/lib/seller/serverAuth";
import type {
  ActivationChecklistItem,
  ActivationIssue,
  ActivationStatusResponse
} from "@/lib/seller/activationStatus";

const DIMENSION_FIELDS = [
  "weight_kg",
  "width_cm",
  "height_cm",
  "length_cm"
] as const;

const toNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export async function GET(request: NextRequest) {
  const context = await ensureSellerAuthenticated(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const supabase = context.supabase;

  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id,postal_code,status,stripe_account_id")
    .eq("user_id", context.userId)
    .maybeSingle();

  if (sellerError) {
    console.error("[seller/activation-status] seller query failed:", sellerError);
    return NextResponse.json(
      { error: "Não foi possível carregar o perfil da loja." },
      { status: 500 }
    );
  }

  if (!seller) {
    return NextResponse.json({ error: "Loja não encontrada." }, { status: 403 });
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id,status,weight_kg,width_cm,height_cm,length_cm")
    .eq("seller_id", seller.id);

  if (productsError) {
    console.error("[seller/activation-status] products query failed:", productsError);
    return NextResponse.json(
      { error: "Não foi possível calcular o status da ativação." },
      { status: 500 }
    );
  }

  const productRows = products ?? [];

  const publishedProducts = productRows.filter(
    (product) => product.status === "published"
  );

  const missingDimensionCount = publishedProducts.filter((product) =>
    DIMENSION_FIELDS.some(
      (field) => toNumber((product as Record<string, unknown>)[field]) <= 0
    )
  ).length;

  const awaitingCurationCount = productRows.filter((product) =>
    ["review", "needs_adjustment"].includes(product.status ?? "")
  ).length;

  const hasPostalCode = Boolean(seller.postal_code?.trim());
  const paymentsReady =
    Boolean(seller.stripe_account_id) && seller.status === "active";
  const hasPublishedProduct = publishedProducts.length > 0;
  const dimensionsReady = hasPublishedProduct && missingDimensionCount === 0;
  const storeApproved = seller.status === "active";

  const checklist: ActivationChecklistItem[] = [
    {
      key: "postal-code",
      label: "CEP de origem informado",
      completed: hasPostalCode,
      ctaLabel: "Completar perfil",
      ctaHref: "/seller/profile"
    },
    {
      key: "payments",
      label: "Pagamentos ativados",
      completed: paymentsReady,
      ctaLabel: "Ativar pagamentos",
      ctaHref: "/seller/payments"
    },
    {
      key: "product-published",
      label: "Produto publicado",
      completed: hasPublishedProduct,
      ctaLabel: "Publicar produto",
      ctaHref: "/seller/products/new"
    },
    {
      key: "dimensions",
      label: "Dimensões de frete configuradas",
      completed: dimensionsReady,
      ctaLabel: "Editar produtos",
      ctaHref: "/seller/products"
    },
    {
      key: "store-approved",
      label: "Loja aprovada",
      completed: storeApproved,
      ctaLabel: "Completar perfil",
      ctaHref: "/seller/profile"
    }
  ];

  const issues: ActivationIssue[] = [];

  if (!paymentsReady) {
    issues.push({
      level: "blocker",
      message: "Pagamentos não ativados — vendas bloqueadas.",
      ctaLabel: "Ativar pagamentos",
      ctaHref: "/seller/payments"
    });
  }

  if (missingDimensionCount > 0) {
    issues.push({
      level: "warning",
      message: `${missingDimensionCount} produto${
        missingDimensionCount === 1 ? "" : "s"
      } sem dimensões — frete pode falhar.`,
      ctaLabel: "Corrigir produtos",
      ctaHref: "/seller/products?filter=missing_dimensions"
    });
  }

  if (awaitingCurationCount > 0) {
    issues.push({
      level: "info",
      message: `${awaitingCurationCount} produto${
        awaitingCurationCount === 1 ? "" : "s"
      } aguardando curadoria.`,
      ctaLabel: "Ver produtos",
      ctaHref: "/seller/products?filter=review"
    });
  }

  const completedItems = checklist.filter((item) => item.completed).length;
  const progressPercent = Math.round((completedItems / checklist.length) * 100);

  const payload: ActivationStatusResponse = {
    progressPercent,
    checklist,
    issues
  };

  return NextResponse.json(payload);
}
