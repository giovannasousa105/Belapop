"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useCart } from "@/lib/CartContext";
import { belapopApi, CartView, CheckoutResponse, OrderDetailResponse, ProductOut, QuoteResponse, StoreOut, UserOut, UserRole } from "@/lib/belapopApi";
import { StripeCheckoutDemo } from "@/components/StripeCheckoutDemo";

const DEFAULT_USER_ID =
  process.env.NEXT_PUBLIC_BELAPOP_USER_ID ??
  "00000000-0000-0000-0000-000000000001";

export default function BelapopMarketplaceDemo() {
  const [userId, setUserId] = useState(DEFAULT_USER_ID);
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [cart, setCart] = useState<CartView | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<CheckoutResponse | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetailResponse | null>(null);
  const [storeCreated, setStoreCreated] = useState<StoreOut | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeAmountCents, setStripeAmountCents] = useState<number>(0);
  const [stripeCurrency, setStripeCurrency] = useState<string>("brl");
  const [couponCode, setCouponCode] = useState<string>("");
  const [postalCode, setPostalCode] = useState<string>("01001000");
  const [promotions, setPromotions] = useState<Array<Record<string, unknown>>>([]);
  const { markCartConverted } = useCart();

  useEffect(() => {
    void refreshProducts();
    void refreshPromotions();
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [userId]);

  useEffect(() => {
    if (orderResult) {
      void refreshOrderDetail(orderResult.order_id);
    }
  }, [orderResult]);

  async function refreshProducts() {
    try {
      const list = await belapopApi.listProducts();
      setProducts(list);
    } catch (error) {
      console.error(error);
    }
  }

  async function refreshPromotions() {
    try {
      const list = await belapopApi.listPromotions();
      setPromotions(list);
    } catch {
      // ignore
    }
  }

  async function refreshCart() {
    try {
      const payload = await belapopApi.getCart(userId);
      setCart(payload);
    } catch {
      setCart(null);
    }
  }

  async function refreshOrderDetail(orderId: string) {
    try {
      const detail = await belapopApi.getOrder(orderId);
      setOrderDetail(detail);
    } catch (error) {
      console.error(error);
    }
  }

  const shippingLookup = useMemo(() => {
    const map = new Map<string, QuoteResponse["stores"][number]>();
    quote?.stores.forEach((store) => map.set(store.store_slug, store));
    return map;
  }, [quote]);

  const totalItems = cart
    ? Object.values(cart.by_store).reduce(
        (acc, store) => acc + store.items.reduce((count, item) => count + item.quantity, 0),
        0
      )
    : 0;

  const handleAddToCart = async (product: ProductOut) => {
    setLoading(true);
    try {
      await belapopApi.addCartItem({
        user_id: userId,
        product_id: product.id,
        quantity: 1,
      });
      await refreshCart();
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId: string, quantity: number) => {
    setLoading(true);
    try {
      await belapopApi.updateCartItem({
        user_id: userId,
        product_id: productId,
        quantity,
      });
      await refreshCart();
    } finally {
      setLoading(false);
    }
  };

  const handleQuote = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await belapopApi.quote({
        user_id: userId,
        postal_code: postalCode,
      });
      setQuote(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const result = await belapopApi.checkout({
        user_id: userId,
        postal_code: postalCode,
        provider: "mockpay",
      });
      setOrderResult(result);
      setQuote(null);
      await markCartConverted(result.order_id);
      await refreshCart();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    if (!userId) return;
    setLoading(true);
    setStripeClientSecret(null);
    try {
      const intent = await belapopApi.stripeCheckout({
        user_id: userId,
        postal_code: postalCode,
        coupon_code: couponCode || undefined,
      });
      setStripeClientSecret(intent.client_secret);
      setStripeAmountCents(intent.amount_cents);
      setStripeCurrency(intent.currency);
      setOrderResult({
        order_id: intent.order_id,
        payment_id: intent.payment_id,
        status: "pending",
        total_cents: intent.amount_cents,
        shipments: [],
      });
      await markCartConverted(intent.order_id);
      await refreshCart();
    } catch (error) {
      setAdminMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromotion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const code = String(form.get("promo_code") ?? "").trim();
    const percent = form.get("promo_percent")
      ? Number(String(form.get("promo_percent")).replace(",", "."))
      : undefined;
    const amountOff = form.get("promo_amount")
      ? Math.round(Number(String(form.get("promo_amount")).replace(",", ".")) * 100)
      : undefined;
    const minSubtotal = form.get("promo_min")
      ? Math.round(Number(String(form.get("promo_min")).replace(",", ".")) * 100)
      : undefined;

    if (!code) {
      setAdminMessage("Informe um código de cupom.");
      return;
    }
    try {
      await belapopApi.createPromotion({
        code,
        percent_off: percent,
        amount_off_cents: amountOff,
        min_subtotal_cents: minSubtotal,
      });
      setAdminMessage(`Cupom ${code} criado`);
      await refreshPromotions();
      event.currentTarget.reset();
    } catch (error) {
      setAdminMessage((error as Error).message);
    }
  };

  const handleUserCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const role = (form.get("role") as UserRole) ?? "customer";
    if (!name || !email) {
      setAdminMessage("Preencha nome e e-mail.");
      return;
    }
    try {
      const user = await belapopApi.createUser({ name, email, role });
      setUserId(user.id);
      setAdminMessage(`Usuário ${user.name} (${user.id}) criado e selecionado.`);
    } catch (error) {
      setAdminMessage((error as Error).message);
    }
  };

  const handleStoreCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const ownerId = String(form.get("owner_user_id") ?? userId).trim();
    if (!ownerId || !name || !slug) {
      setAdminMessage("Informe nome, slug e owner.");
      return;
    }
    try {
      const store = await belapopApi.createStore({
        owner_user_id: ownerId,
        name,
        slug,
        description,
      });
      setStoreCreated(store);
      setAdminMessage(`Loja ${store.slug} criada com ID ${store.id}`);
    } catch (error) {
      setAdminMessage((error as Error).message);
    }
  };

  const handleProductCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const price = Number(form.get("price") ?? 0);
    const storeId = String(form.get("store_id") ?? storeCreated?.id ?? "").trim();
    if (!title || !price || !storeId) {
      setAdminMessage("Informe título, preço e loja.");
      return;
    }
    try {
      await belapopApi.createProduct({
        store_id: storeId,
        title,
        price_cents: Math.round(price * 100),
      });
      setAdminMessage(`Produto “${title}” cadastrado na loja ${storeId}`);
      await refreshProducts();
    } catch (error) {
      setAdminMessage((error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-noir-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-3 rounded-2xl border border-noir-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-semibold text-noir-900">Demo BelaPop Marketplace</h1>
              <p className="text-sm text-noir-600">
                User ID atual: <code>{userId}</code>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.3em] text-noir-500">Trocar usuário</label>
              <input
                type="text"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="w-64 rounded-md border border-noir-200 bg-noir-50 px-3 py-2 text-sm text-noir-900 focus:border-belapop-rose focus:outline-none"
              />
            </div>
          </div>
          <p className="text-noir-600">
            Use essa dashboard para popular o catálogo, acompanhar o carrinho multi-lojista,
            calcular fretes e finalizar pedidos.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-noir-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-noir-900">Produtos</h2>
            <div className="grid gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-xl border border-noir-100 bg-noir-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-noir-900">{product.title}</p>
                    <p className="text-xs text-noir-600">
                      {(product.price_cents / 100).toFixed(2)} BRL · loja {product.store_id}
                    </p>
                  </div>
                  <button
                    onClick={() => void handleAddToCart(product)}
                    disabled={loading}
                    className="rounded-full bg-belapop-rose px-3 py-1 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-belapop-rose/90 disabled:opacity-50"
                  >
                    + carrinho
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-noir-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-noir-900">Carrinho</h2>
            {!cart && <p className="text-sm text-noir-600">Nenhum carrinho encontrado.</p>}
            {cart && (
              <>
                <div className="space-y-4">
                  {Object.entries(cart.by_store).map(([slug, payload]) => {
                    const shipping = shippingLookup.get(slug);
                    return (
                      <div key={slug} className="rounded-xl border border-noir-100 bg-noir-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-noir-900">
                            {slug} — subtotal {(payload.subtotal_cents / 100).toFixed(2)} BRL
                          </p>
                          {shipping && (
                            <span className="rounded-full bg-noir-900 px-3 py-1 text-xs text-white">
                              frete {(shipping.shipping_cents / 100).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 space-y-2">
                          {payload.items.map((item) => (
                            <div key={item.product_id} className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm text-noir-900">{item.title}</p>
                                <p className="text-xs text-noir-500">
                                  {item.quantity} × {(item.unit_price_cents / 100).toFixed(2)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => void handleQuantityChange(item.product_id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="rounded-full bg-noir-900 px-2 py-1 text-xs text-white"
                                >
                                  -
                                </button>
                                <span className="text-sm text-noir-900">{item.quantity}</span>
                                <button
                                  onClick={() => void handleQuantityChange(item.product_id, item.quantity + 1)}
                                  className="rounded-full bg-noir-900 px-2 py-1 text-xs text-white"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-noir-700">
                  <p>{totalItems} produtos no carrinho</p>
                  <p>Subtotal geral {(cart.subtotal_cents / 100).toFixed(2)} BRL</p>
                </div>
              </>
            )}
            <div className="mt-5 flex flex-wrap gap-2 items-center">
              <input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="CEP (ex: 01001000)"
                className="rounded-xl border border-noir-200 px-3 py-2 text-sm text-noir-900"
              />
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Cupom"
                className="rounded-xl border border-noir-200 px-3 py-2 text-sm text-noir-900"
              />
              <button
                onClick={handleQuote}
                disabled={loading || !cart}
                className="rounded-full border border-belapop-rose px-4 py-1 text-xs uppercase tracking-[0.3em] text-belapop-rose transition hover:bg-belapop-rose/5 disabled:opacity-50"
              >
                Calcular frete
              </button>
              <button
                onClick={handleCheckout}
                disabled={loading || !cart}
                className="rounded-full bg-noir-900 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-noir-900/80 disabled:opacity-50"
              >
                Finalizar compra
              </button>
              <button
                onClick={handleStripeCheckout}
                disabled={loading || !cart}
                className="rounded-full bg-[#635bff] px-4 py-1 text-xs uppercase tracking-[0.3em] text-white transition hover:brightness-110 disabled:opacity-50"
              >
                Stripe Checkout
              </button>
            </div>
            {quote && (
              <div className="mt-4 rounded-xl border border-belapop-rose/40 bg-belapop-rose/5 p-4 text-sm text-noir-900">
                <p className="font-semibold uppercase tracking-[0.2em] text-belapop-rose">Cotação</p>
                <p>Subtotal: {(quote.subtotal_cents / 100).toFixed(2)} BRL</p>
                <p>Frete: {(quote.shipping_cents / 100).toFixed(2)} BRL</p>
                <p>Total estimado: {(quote.total_cents / 100).toFixed(2)} BRL</p>
                <div className="mt-2 space-y-2">
                  {quote.stores.map((store) => (
                    <div key={store.store_id} className="flex items-center justify-between text-xs">
                      <span>{store.store_slug}</span>
                      <span>{(store.shipping_cents / 100).toFixed(2)} BRL</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {orderResult && (
              <div className="mt-4 rounded-xl border border-noir-200 bg-white p-4 text-sm text-noir-700 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Pedido criado</p>
                <p className="text-sm text-noir-900">Pedido ID: {orderResult.order_id}</p>
                <p className="text-sm text-noir-900">Pagamento ID: {orderResult.payment_id}</p>
                {stripeClientSecret && (
                  <p className="text-xs text-noir-500 break-all">
                    client_secret: {stripeClientSecret}
                  </p>
                )}
                <Link
                  href={`/orders/${orderResult.order_id}`}
                  className="mt-2 inline-flex rounded-full border border-belapop-rose px-3 py-1 text-xs uppercase tracking-[0.3em] text-belapop-rose"
                >
                  Ver pedido
                </Link>
                {stripeClientSecret && (
                  <div className="mt-4">
                    <StripeCheckoutDemo
                      clientSecret={stripeClientSecret}
                      amountCents={stripeAmountCents}
                      currency={stripeCurrency}
                      onSuccess={() => setAdminMessage("Pagamento confirmado")}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 rounded-2xl border border-noir-100 bg-white p-6 shadow-sm md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-noir-900">Detalhes do pedido</h2>
            {orderDetail ? (
              <div className="mt-4 space-y-3 rounded-xl border border-noir-100 bg-noir-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Status atual</p>
                <p className="text-base font-semibold text-noir-900">{orderDetail.order.status}</p>
                <p className="text-sm text-noir-600">
                  Total {(orderDetail.order.total_cents / 100).toFixed(2)} BRL · {orderDetail.shipments.length} envios
                </p>
                <div className="space-y-4 pt-4">
                  {orderDetail.shipments.map((shipment) => (
                    <div key={shipment.id} className="rounded-lg border border-noir-200 bg-white p-3 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Loja {shipment.store_id}</p>
                      <p className="text-sm font-semibold text-noir-900">{shipment.status}</p>
                      <p className="text-xs text-noir-500">
                        Frete {(shipment.shipping_cents / 100).toFixed(2)} BRL · {shipment.carrier ?? "sem transportadora"}
                      </p>
                      {shipment.tracking_code && (
                        <p className="text-xs text-belapop-rose">Rastreamento {shipment.tracking_code}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-noir-600">Finalize um checkout para visualizar envios.</p>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-noir-900">Área administrativa</h2>
            <div className="space-y-4">
              <form onSubmit={handleUserCreate} className="space-y-2 rounded-xl border border-noir-100 bg-noir-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Criar usuário</p>
                <input name="name" placeholder="Nome" className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm" />
                <input name="email" placeholder="Email" className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm" />
                <select name="role" className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm">
                  <option value="customer">Customer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
                <button className="w-full rounded-full bg-belapop-rose px-3 py-2 text-xs uppercase tracking-[0.3em] text-white">
                  Criar usuário
                </button>
              </form>

              <form onSubmit={handleStoreCreate} className="space-y-2 rounded-xl border border-noir-100 bg-noir-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Criar loja</p>
                <input name="name" placeholder="Nome da loja" className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm" />
                <input name="slug" placeholder="slug-unico" className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm" />
                <input
                  name="description"
                  placeholder="Descrição"
                  className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm"
                />
                <input
                  name="owner_user_id"
                  placeholder="Owner user ID"
                  defaultValue={userId}
                  className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm"
                />
                <button className="w-full rounded-full border border-belapop-rose px-3 py-2 text-xs uppercase tracking-[0.3em] text-belapop-rose">
                  Criar loja
                </button>
              </form>

              <form onSubmit={handleProductCreate} className="space-y-2 rounded-xl border border-noir-100 bg-noir-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Criar produto</p>
                <input
                  name="title"
                  placeholder="Título"
                  className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  placeholder="Preço (R$)"
                  className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm"
                />
                <input
                  name="store_id"
                  placeholder="ID da loja"
                  defaultValue={storeCreated?.id ?? ""}
                  className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm"
                />
                <button className="w-full rounded-full bg-noir-900 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white">
                  Criar produto
                </button>
              </form>

              <form onSubmit={handleCreatePromotion} className="space-y-2 rounded-xl border border-noir-100 bg-noir-50 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Criar cupom</p>
                <input name="promo_code" placeholder="Código" className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="promo_percent"
                    placeholder="% off (opcional)"
                    className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm"
                  />
                  <input
                    name="promo_amount"
                    placeholder="Valor off (R$)"
                    className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm"
                  />
                </div>
                <input
                  name="promo_min"
                  placeholder="Mínimo subtotal (R$)"
                  className="w-full rounded-md border border-noir-200 px-3 py-2 text-sm"
                />
                <button className="w-full rounded-full bg-noir-900 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white">
                  Criar cupom
                </button>
              </form>

              {promotions.length > 0 && (
                <div className="space-y-2 rounded-xl border border-noir-100 bg-white p-4 text-xs text-noir-700">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-noir-500">Cupons ativos</p>
                  {promotions.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-noir-100 pb-1 last:border-0">
                      <span className="font-semibold">{String(p.code)}</span>
                      <span>
                        {p.percent_off ? `${p.percent_off}% ` : ""}
                        {p.amount_off_cents ? `R$ ${(Number(p.amount_off_cents) / 100).toFixed(2)}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {adminMessage && (
                <p className="text-xs uppercase tracking-[0.3em] text-belapop-rose">{adminMessage}</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
