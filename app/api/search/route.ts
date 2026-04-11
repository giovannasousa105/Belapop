import { NextResponse } from "next/server";

import { getCatalogData } from "@/lib/queries/catalog";
import { normalizeQuery } from "@/lib/search";

type SearchProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number;
  imageUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
};

type SearchFacet = { name: string; count: number };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawQuery = url.searchParams.get("q") ?? "";
  const limit = Math.min(12, Math.max(1, Number(url.searchParams.get("limit") ?? 8)));
  const normalizedQuery = normalizeQuery(rawQuery);

  if (!normalizedQuery) {
    return NextResponse.json({
      products: [],
      brands: [],
      categories: [],
      normalizedQuery: ""
    });
  }

  const { products: matchedProducts } = await getCatalogData({
    q: normalizedQuery,
    sort: "featured"
  });

  const products: SearchProduct[] = matchedProducts.slice(0, limit).map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.title,
    brand: product.brand,
    category: product.category,
    price: Number(product.price_cents ?? 0) / 100,
    imageUrl: product.hero_image_url ?? null,
    ratingAvg: 0,
    ratingCount: 0
  }));

  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  products.forEach((product) => {
    if (product.brand) {
      brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1);
    }
    const category = product.category ?? "Outros";
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  });

  const brands: SearchFacet[] = Array.from(brandCounts.entries()).map(
    ([name, count]) => ({ name, count })
  );
  const categories: SearchFacet[] = Array.from(categoryCounts.entries()).map(
    ([name, count]) => ({ name, count })
  );

  return NextResponse.json({
    products,
    brands,
    categories,
    normalizedQuery
  });
}
