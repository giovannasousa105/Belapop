"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { sellers as seedSellers } from "@/data/sellers";
import { productRepository } from "@/lib/repositories/productRepository";
import { userRepository } from "@/lib/repositories/userRepository";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const statusLabel = (status?: Product["status"]) => {
  switch (status) {
    case "published":
      return "Publicado";
    case "review":
      return "Aguardando curadoria";
    case "paused":
      return "Pausado";
    default:
      return "Rascunho";
  }
};

export default function AdminProductDetailPage() {
  const params = useParams();
  const productId = String(params?.id ?? "");
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerName, setSellerName] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const found = await productRepository.getById(productId);
      if (!active) return;
      setProduct(found);
    };
    void load();
    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    let active = true;
    const loadSeller = async () => {
      const user = await userRepository.findById(product.sellerId);
      if (!active) return;
      if (user?.sellerProfile?.storeName) {
        setSellerName(user.sellerProfile.storeName);
        return;
      }
      const seed = seedSellers.find((item) => item.id === product.sellerId);
      setSellerName(seed?.name ?? "Loja parceira");
    };
    void loadSeller();
    return () => {
      active = false;
    };
  }, [product]);

  const refreshProduct = async () => {
    const updated = await productRepository.getById(productId);
    if (updated) {
      setProduct(updated);
    }
  };

  const callAdminProductEndpoint = async (
    endpoint: "approve" | "needs-adjustment",
    payload?: Record<string, unknown>
  ) => {
    const response = await fetch(`/api/admin/products/${productId}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Não foi possível concluir a ação.");
    }
  };

  const handleApprove = async () => {
    try {
      await callAdminProductEndpoint("approve");
      await refreshProduct();
    } catch (error) {
      console.error("[admin/product-detail] approve", error);
    }
  };

  const handleNeedsAdjustment = async () => {
    const notesPrompt = window.prompt("Descreva os ajustes necessários:");
    if (!notesPrompt) return;
    const notes = notesPrompt.trim();
    if (!notes) return;
    const reasonsRaw = window.prompt("Motivos adicionais (separados por vírgula):");
    const reasons = reasonsRaw
      ? reasonsRaw
          .split(",")
          .map((reason) => reason.trim())
          .filter(Boolean)
      : [];
    try {
      await callAdminProductEndpoint("needs-adjustment", { notes, reasons });
      await refreshProduct();
    } catch (error) {
      console.error("[admin/product-detail] needs adjustment", error);
    }
  };
  const handlePause = async () => {
    if (!product) return;
    const next: Product = { ...product, status: "paused" };
    const result = await productRepository.upsert(next);
    if (result.ok) setProduct(next);
  };
  const toggleFeatured = async () => {
    if (!product) return;
    const next: Product = { ...product, featured: !product.featured };
    const result = await productRepository.upsert(next);
    if (result.ok) setProduct(next);
  };

  if (!product) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm text-bpGraphite/80">Produto não localizado.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
          Detalhe do produto
        </p>
        <h1 className="mt-3 font-display text-3xl text-bpBlack">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          {sellerName} • {product.category} • {statusLabel(product.status)}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LuxuryButton tone="retail" variant="outline" onClick={handleNeedsAdjustment}>
            Solicitar ajustes
          </LuxuryButton>
          <LuxuryButton tone="retail" onClick={handleApprove}>
            Aprovar
          </LuxuryButton>
          <LuxuryButton
            tone="retail"
            variant="outline"
            onClick={handlePause}
          >
            Pausar
          </LuxuryButton>
          <LuxuryButton
            tone="retail"
            variant="outline"
            onClick={toggleFeatured}
          >
            {product.featured ? "Remover destaque" : "Destacar"}
          </LuxuryButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">
            Descrição institucional
          </h2>
          <p className="mt-4 text-sm text-bpGraphite/80">{product.description}</p>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">
            Informações comerciais
          </h2>
          <div className="mt-4 space-y-3 text-sm text-bpGraphite/80">
            <div className="flex justify-between">
              <span>Preço</span>
              <span>{formatPrice(product.price)}</span>
            </div>
            <div className="flex justify-between">
              <span>Peso (kg)</span>
              <span>{product.weightKg ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Dimensões (cm)</span>
              <span>
                {product.widthCm ?? 0} × {product.heightCm ?? 0} × {product.lengthCm ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span>{statusLabel(product.status)}</span>
            </div>
            <div className="flex justify-between">
              <span>Destaque</span>
              <span>{product.featured ? "Sim" : "Não"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
