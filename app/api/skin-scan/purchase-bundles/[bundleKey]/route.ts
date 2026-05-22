import { NextResponse } from "next/server";

import { skinScanPurchaseBundleMap, type SkinScanPurchaseBundleKey } from "@/lib/popclub/skinScanPurchaseBundles";
import { getPublicProducts } from "@/lib/queries/products";

type RouteContext = {
  params: Promise<{ bundleKey: string }>;
};

const isBundleKey = (value: string): value is SkinScanPurchaseBundleKey =>
  value === "essencial" || value === "premium" || value === "luxo";

export async function GET(_: Request, context: RouteContext) {
  const { bundleKey } = await context.params;

  if (!isBundleKey(bundleKey)) {
    return NextResponse.json({ error: "Bundle de Skin Scan invalido." }, { status: 404 });
  }

  const bundle = skinScanPurchaseBundleMap[bundleKey];
  const products = await getPublicProducts(120);
  const productsBySlug = new Map(products.map((product) => [product.slug, product]));
  const missingSlugs: string[] = [];

  const items = bundle.products.reduce<
    Array<{
      productId: string;
      sellerId: string;
      slug: string;
      title: string;
      quantity: number;
      priceCents: number;
    }>
  >((accumulator, item) => {
    const product = productsBySlug.get(item.slug);
    if (!product) {
      missingSlugs.push(item.slug);
      return accumulator;
    }

    accumulator.push({
      productId: product.id,
      sellerId: product.sellerId,
      slug: product.slug,
      title: product.title,
      quantity: item.quantity ?? 1,
      priceCents: product.price_cents
    });

    return accumulator;
  }, []);

  if (missingSlugs.length > 0) {
    return NextResponse.json(
      {
        error: "Não foi possivel montar a rotina com os produtos publicados atuais.",
        missingSlugs
      },
      { status: 424 }
    );
  }

  const totalCents = items.reduce((total, item) => total + item.priceCents * item.quantity, 0);

  return NextResponse.json({
    bundle: bundle.key,
    title: bundle.title,
    ctaKind: bundle.ctaKind,
    totalCents,
    items
  });
}
