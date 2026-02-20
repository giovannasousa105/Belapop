"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { LuxuryButton } from "@/components/LuxuryButton";
import { PaymentBadges } from "@/components/PaymentBadges";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { trackEvent } from "@/lib/analytics/tracker";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { groupItemsBySeller } from "@/lib/cart/groupItemsBySeller";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { buildShippingItems } from "@/lib/shipping/prepareItems";
import { orderRepository } from "@/lib/orders/orderRepository";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Address, Order, SubOrder } from "@/lib/types";
import { createUUID, formatPrice } from "@/lib/utils";

const initialAddress: Address = {
  fullName: "",
  street: "",
  number: "",
  city: "",
  state: "",
  zip: "",
  complement: ""
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const {
    items,
    clearCart,
    shipments,
    totalShipping,
    shippingCep,
    setShippingCep
  } = useCart();
  const { products } = useStoredProducts();

  const [address, setAddress] = useState<Address>(initialAddress);
  const [paymentMethod, setPaymentMethod] = useState<
    "cartao" | "pix" | "boleto"
  >("cartao");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: ""
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  const cartItems = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find(
            (product) => product.id === item.productId
          );
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
        ),
    [items, products]
  );

  const subtotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  const totalOrder = subtotal + totalShipping;
  const shippingItems = buildShippingItems(
    cartItems.map((item) => ({
      product: item.product,
      quantity: item.quantity
    }))
  );

  const getSellerMetadata = (
    sellerId: string,
    map: Map<
      string,
      {
        store_name?: string | null;
        stripe_account_id?: string | null;
        commission_rate?: number | null;
      }
    >
  ) => {
    const stored = map.get(sellerId);
    if (stored) {
      return {
        sellerName: stored.store_name ?? undefined,
        stripeAccountId: stored.stripe_account_id ?? undefined,
        commissionRate: stored.commission_rate ?? undefined
      };
    }
    return {
      sellerName: "Loja parceira",
      stripeAccountId: undefined,
      commissionRate: undefined
    };
  };

  useEffect(() => {
    const cleanZip = address.zip.replace(/\D/g, "");
    if (cleanZip.length === 8 && cleanZip !== shippingCep) {
      setShippingCep(cleanZip);
    }
  }, [address.zip, shippingCep, setShippingCep]);

  const handleConfirm = async () => {
    if (!user) {
      setMessage("Fa�a login para finalizar o pedido.");
      return;
    }
    if (cartItems.length === 0) {
      setMessage("Seu carrinho est� vazio.");
      return;
    }
    const required = ["fullName", "street", "number", "city", "state", "zip"];
    const hasMissing = required.some((key) => !address[key as keyof Address]);
    if (hasMissing) {
      setMessage("Preencha os dados essenciais do endere�o.");
      return;
    }
    if (paymentMethod === "cartao") {
      const { cardNumber, cardName, cardExpiry, cardCvv } = cardData;
      if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
        setMessage("Complete os dados do cart�o.");
        return;
      }
    }

    const sellerGroups = groupItemsBySeller(items);
    const sellerCount = Object.keys(sellerGroups).length;
    if (sellerCount > 0 && shipments.length < sellerCount) {
      setMessage("Calcule o frete para todos os lojistas antes de finalizar.");
      return;
    }

    const detailedCartItems = cartItems.reduce<
      Record<string, typeof cartItems[number][]>
    >((acc, item) => {
      const list = acc[item.sellerId] ?? [];
      list.push(item);
      acc[item.sellerId] = list;
      return acc;
    }, {});

    setMessage(null);
    setIsProcessing(true);
    const orderId = createUUID();
    const createdAt = new Date().toISOString();

    const supabase = getSupabaseClient();
    const sellerIds = Array.from(new Set(cartItems.map((item) => item.sellerId)));
    const { data: sellerRows } = await supabase
      .from("sellers")
      .select("id,store_name,stripe_account_id,commission_rate")
      .in("id", sellerIds);
    const sellerMap = new Map(
      (sellerRows ?? []).map((row) => [row.id as string, row])
    );

    const paymentItems = cartItems.map((item) => {
      const metadata = getSellerMetadata(item.sellerId, sellerMap);
      return {
        productId: item.productId,
        sellerId: item.sellerId,
        sellerName: metadata.sellerName,
        stripeAccountId: metadata.stripeAccountId,
        commissionRate: metadata.commissionRate,
        quantity: item.quantity,
        price: item.product.price
      };
    });

    const shipmentPayload = shipments.map((shipment) => ({
      sellerId: shipment.sellerId,
      price: shipment.price,
      serviceName: shipment.serviceName
    }));

    try {
      const response = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          items: paymentItems,
          shipments: shipmentPayload
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        if (payload.error === "SELLER_NOT_CONNECTED") {
          const missing = (payload.missing ?? [])
            .map(
              (seller: { sellerId: string; sellerName?: string }) =>
                seller.sellerName ?? seller.sellerId
            )
            .filter(Boolean)
            .join(", ");
          setMessage(
            `Ative pagamentos para ${missing} antes de finalizar o pedido.`
          );
        } else {
          setMessage(payload.error ?? "N�o foi poss�vel processar o pagamento.");
        }
        return;
      }

      const splits: SellerSplit[] = payload.splits ?? [];
      type SellerSplit = {
        sellerId: string;
        productTotal?: number;
        shippingTotal?: number;
        platformFee?: number;
        sellerNetAmount?: number;
        sellerName?: string;
      };
      const splitMap = new Map<string, SellerSplit>(
        splits.map((split) => [split.sellerId, split])
      );
      const shipmentMap = new Map(
        shipments.map((shipment) => [shipment.sellerId, shipment])
      );

      const subOrders: SubOrder[] = Object.entries(sellerGroups).map(
        ([sellerId, sellerItems]) => {
          const split = splitMap.get(sellerId);
          const shipment = shipmentMap.get(sellerId);
          const shippingValue =
            split?.shippingTotal ?? shipment?.price ?? 0;
          const productTotal = split?.productTotal ?? 0;
          return {
            id: createUUID(),
            orderId,
            sellerId,
            items: sellerItems,
            shippingValue,
            shippingService: shipment?.serviceName ?? "A definir",
            status: "Confirmado",
            createdAt,
            productTotal,
            shippingTotal: shippingValue,
            platformFee: split?.platformFee ?? 0,
            sellerNetAmount: split?.sellerNetAmount ?? 0,
            paymentStatus: "paid"
          };
        }
      );

      const metadataSubOrders = Object.entries(sellerGroups).map(
        ([sellerId]) => {
          const split = splitMap.get(sellerId);
          const shipment = shipmentMap.get(sellerId);
          const detailItems = detailedCartItems[sellerId] ?? [];
          const shippingValue = 
            split?.shippingTotal ?? shipment?.price ?? 0;
          return {
            sellerId,
            sellerName: split?.sellerName,
            productTotal: split?.productTotal ?? 0,
            shippingTotal: shippingValue,
            platformFee: split?.platformFee ?? 0,
            sellerNetAmount: split?.sellerNetAmount ?? 0,
            shippingService: shipment?.serviceName ?? "A definir",
            status: "Confirmado",
            items: detailItems.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              quantity: item.quantity,
              price: item.product.price
            }))
          };
        }
      );

      void trackEvent({
        type: "purchase",
        orderId,
        metadata: {
          totalProducts: subtotal,
          totalShipping,
          totalOrder: payload.totalAmount ?? totalOrder,
          subOrders: metadataSubOrders
        }
      });

      const order: Order = {
        id: orderId,
        customerId: user.id,
        totalProducts: subtotal,
        totalShipping,
        totalOrder,
        status: "Confirmado",
        createdAt,
        paymentMethod,
        address,
        destinationCep: shippingCep || address.zip,
        paymentIntentId: payload.paymentIntentId,
        totalAmount: payload.totalAmount ?? totalOrder,
        paymentStatus: "paid"
      };

      const orderResult = await orderRepository.save(order);
      if (!orderResult.ok) {
        throw new Error(orderResult.message ?? "Falha ao salvar o pedido.");
      }
      const subResult = await orderRepository.saveSubOrders(subOrders);
      if (!subResult.ok) {
        throw new Error(subResult.message ?? "Falha ao salvar subpedidos.");
      }
      clearCart();
      router.push(`/pedido/sucesso?order=${order.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro inesperado ao confirmar.";
      setMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:flex-row">
      <div className="flex flex-1 flex-col gap-8">
        <div>
          <h1 className="font-display text-3xl text-bpOffWhite">Checkout</h1>
          <p className="mt-2 text-sm text-bpPinkSoft/70">
            Preencha seus dados e finalize com eleg�ncia.
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="font-display text-xl text-bpOffWhite">Endere�o</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input
              placeholder="Nome completo"
              value={address.fullName}
              onChange={(event) =>
                setAddress({ ...address, fullName: event.target.value })
              }
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
            />
            <input
              placeholder="Rua"
              value={address.street}
              onChange={(event) =>
                setAddress({ ...address, street: event.target.value })
              }
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
            />
            <input
              placeholder="N�mero"
              value={address.number}
              onChange={(event) =>
                setAddress({ ...address, number: event.target.value })
              }
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
            />
            <input
              placeholder="Cidade"
              value={address.city}
              onChange={(event) =>
                setAddress({ ...address, city: event.target.value })
              }
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
            />
            <input
              placeholder="Estado"
              value={address.state}
              onChange={(event) =>
                setAddress({ ...address, state: event.target.value })
              }
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
            />
            <input
              placeholder="CEP"
              value={address.zip}
              onChange={(event) =>
                setAddress({ ...address, zip: event.target.value })
              }
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
            />
            <input
              placeholder="Complemento (opcional)"
              value={address.complement}
              onChange={(event) =>
                setAddress({ ...address, complement: event.target.value })
              }
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm md:col-span-2"
            />
          </div>
        </div>

        <ShippingCalculator cartItems={shippingItems} tone="dark" />

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-bpOffWhite">Pagamento</h2>
            <PaymentBadges />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { id: "cartao", label: "Cart�o" },
              { id: "pix", label: "Pix" },
              { id: "boleto", label: "Boleto" }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() =>
                  setPaymentMethod(method.id as "cartao" | "pix" | "boleto")
                }
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                  paymentMethod === method.id
                    ? "border-bpPink text-bpOffWhite"
                    : "border-white/10 text-bpPinkSoft/70"
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          {paymentMethod === "cartao" ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                placeholder="N�mero do cart�o"
                value={cardData.cardNumber}
                onChange={(event) =>
                  setCardData({ ...cardData, cardNumber: event.target.value })
                }
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm md:col-span-2"
              />
              <input
                placeholder="Nome no cart�o"
                value={cardData.cardName}
                onChange={(event) =>
                  setCardData({ ...cardData, cardName: event.target.value })
                }
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm md:col-span-2"
              />
              <input
                placeholder="Validade"
                value={cardData.cardExpiry}
                onChange={(event) =>
                  setCardData({ ...cardData, cardExpiry: event.target.value })
                }
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
              />
              <input
                placeholder="CVV"
                value={cardData.cardCvv}
                onChange={(event) =>
                  setCardData({ ...cardData, cardCvv: event.target.value })
                }
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm"
              />
            </div>
          ) : null}

          {paymentMethod === "pix" ? (
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-bpBlackSoft/60 p-6">
              <div className="h-32 rounded-2xl border border-white/10 bg-gradient-to-br from-bpPinkSoft/20 via-bpBlackSoft to-bpBlack" />
              <p className="text-sm text-bpPinkSoft/70">
                Escaneie o QR code para concluir o pagamento via Pix.
              </p>
            </div>
          ) : null}

          {paymentMethod === "boleto" ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-bpBlackSoft/60 p-6">
              <p className="text-sm text-bpPinkSoft/70">
                Geraremos seu boleto com vencimento em 2 dias �teis.
              </p>
              <LuxuryButton variant="outline" className="mt-4">
                Gerar boleto (mock)
              </LuxuryButton>
            </div>
          ) : null}
        </div>
      </div>

      <div className="w-full max-w-sm">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="font-display text-2xl text-bpOffWhite">Resumo</h2>
          <div className="mt-6 space-y-3 text-sm text-bpPinkSoft/70">
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex justify-between">
                <span>
                  {item.product.name} � {item.quantity}x
                </span>
                <span>{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-bpPinkSoft/60">
                Entrega por vendedor
              </p>
              {shipments.length === 0 ? (
                <p className="text-xs text-bpPinkSoft/60">
                  Calcule o frete para ver o total.
                </p>
              ) : (
                shipments.map((shipment) => (
                  <div
                    key={`${shipment.sellerId}-${shipment.serviceId}`}
                    className="flex items-center justify-between text-xs text-bpPinkSoft/70"
                  >
                    <span>
                      {shipment.sellerName} � {shipment.deliveryTimeDays} dia(s)
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
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-bpOffWhite">
              <span>Total</span>
              <span>{formatPrice(totalOrder)}</span>
            </div>
          </div>
          {message ? (
            <p className="mt-4 text-xs text-bpPink">{message}</p>
          ) : null}
          <div className="mt-6">
            <LuxuryButton
              size="lg"
              className="w-full"
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? "Processando pagamento�" : "Confirmar pedido"}
            </LuxuryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

