"use client";

import { useRouter } from "next/navigation";

import { LuxuryButton } from "@/components/LuxuryButton";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { trackEvent } from "@/lib/analytics/tracker";
import { useCart } from "@/lib/CartContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { buildShippingItems } from "@/lib/shipping/prepareItems";
import { formatPrice } from "@/lib/utils";

export default function CarrinhoPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, shipments, totalShipping } = useCart();
  const { products } = useStoredProducts();

  const cartItems = items
    .map((item) => {
      const product = products.find((product) => product.id === item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter(
      (
        item
      ): item is {
        productId: string;
        sellerId: string;
        quantity: number;
        product: typeof products[number];
      } => Boolean(item)
    );

  const subtotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const total = subtotal + totalShipping;
  const shippingItems = buildShippingItems(
    cartItems.map((item) => ({
      product: item.product,
      quantity: item.quantity
    }))
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 lg:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        <h1 className="font-display text-3xl text-bpBlack">Carrinho</h1>
        {cartItems.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6">
            <p className="text-sm text-bpGraphite/80">
              Seu carrinho está vazio. Explore a curadoria.
            </p>
            <div className="mt-6">
              <LuxuryButton href="/catalogo">Ir ao catálogo</LuxuryButton>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {cartItems.map((item) => (
              <div
                key={item.product.id}
                className="glass-panel flex flex-col gap-4 rounded-2xl p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-bpPink/80">
                    {item.product.category}
                  </p>
                  <h3 className="mt-2 text-lg text-bpBlack">
                    {item.product.name}
                  </h3>
                  <p className="mt-1 text-sm text-bpGraphite/80">
                    {formatPrice(item.product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity - 1)
                    }
                    className="rounded-full border border-bpBlack/15 px-3 py-1 text-sm text-bpGraphite"
                  >
                    -
                  </button>
                  <span className="text-sm text-bpBlack">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.product.id, item.quantity + 1)
                    }
                    className="rounded-full border border-bpBlack/15 px-3 py-1 text-sm text-bpGraphite"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-xs uppercase tracking-[0.08em] text-bpPink/85 hover:text-bpBlack"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {cartItems.length > 0 ? (
            <ShippingCalculator cartItems={shippingItems} tone="light" />
          ) : null}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="font-display text-2xl text-bpBlack">Resumo</h2>
            <div className="mt-6 space-y-3 text-sm text-bpGraphite/80">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-bpPink/75">
                  Entrega por vendedor
                </p>
                {shipments.length === 0 ? (
                  <p className="text-xs text-bpGraphite/70">
                    Calcule o frete para ver as opções por lojista.
                  </p>
                ) : (
                  shipments.map((shipment) => (
                    <div
                      key={`${shipment.sellerId}-${shipment.serviceId}`}
                      className="flex items-center justify-between text-xs text-bpGraphite/80"
                    >
                      <span>
                        {shipment.sellerName} • {shipment.deliveryTimeDays} dia(s)
                      </span>
                      <span>{formatPrice(shipment.price)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Total frete</span>
                <span>{formatPrice(totalShipping)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-bpBlack/10 pt-3 text-bpBlack">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <div className="mt-6">
              <LuxuryButton
                size="lg"
                className="w-full"
                onClick={() => {
                  void trackEvent({ type: "start_checkout" });
                  router.push("/checkout");
                }}
              >
                Finalizar compra
              </LuxuryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
