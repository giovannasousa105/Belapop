import { NextRequest, NextResponse } from "next/server";

import {
  attachPaymentIntentToOrder,
  createCheckoutDraft,
  loadPersistedCheckoutBreakdown,
  deleteCheckoutDraft
} from "@/lib/checkout/serverCheckout";
import { loadCartItemsForCheckout } from "@/lib/cart/serverCart";
import {
  assessCheckoutRisk,
  buildCheckoutAddressHash,
  buildCheckoutCartHash,
  buildCheckoutIdempotencyKey,
  extractCheckoutRequestMeta,
  findReusableCheckoutSession,
  mapStripePaymentMethodTypes,
  markCheckoutSessionFailure,
  persistBlockedCheckoutAttempt,
  persistCheckoutSessionDraft,
  reserveCheckoutSession,
  updateCheckoutSessionAfterPaymentIntent
} from "@/lib/checkout/paymentSessions";
import { mapStripePaymentIntentState, recordPaymentState } from "@/lib/payments/stateMachine";
import { StubProvider } from "@/lib/payments/provider";
import { getStripe } from "@/lib/stripe/stripeClient";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { Address } from "@/lib/types";

export const runtime = "nodejs";

type PaymentIntentRequest = {
  paymentMethod?: "cartao" | "pix" | "boleto";
  address?: Address;
  cartId?: string | null;
};

const fromCents = (value: number) => Number((value / 100).toFixed(2));
const smokeStubEnabled = process.env.ENABLE_SMOKE_SALE_STUB === "1";
const CHECKOUT_IN_PROGRESS_WINDOW_MS = 2 * 60 * 1000;

const normalizeAvailablePaymentMethods = (value: unknown) => {
  if (!Array.isArray(value)) return [] as Array<"cartao" | "pix" | "boleto">;
  return value.filter((item): item is "cartao" | "pix" | "boleto" =>
    item === "cartao" || item === "pix" || item === "boleto"
  );
};

const buildPaymentIntentResponse = ({
  orderId,
  paymentIntentId,
  clientSecret,
  totalAmountCents,
  splits,
  availablePaymentMethods,
  mode,
  checkoutSessionId
}: {
  orderId: string;
  paymentIntentId: string;
  clientSecret: string;
  totalAmountCents: number;
  splits: Awaited<ReturnType<typeof createCheckoutDraft>>["splits"];
  availablePaymentMethods: Array<"cartao" | "pix" | "boleto">;
  mode?: string;
  checkoutSessionId?: string | null;
}) => ({
  checkoutSessionId: checkoutSessionId ?? null,
  orderId,
  paymentIntentId,
  clientSecret,
  totalAmount: fromCents(totalAmountCents),
  totalAmountCents,
  availablePaymentMethods,
  mode,
  splits: splits.map((item) => ({
    sellerId: item.sellerId,
    sellerName: item.sellerName,
    productTotal: fromCents(item.productTotalCents),
    shippingTotal: fromCents(item.shippingTotalCents),
    platformFee: fromCents(item.platformFeeCents),
    sellerNetAmount: fromCents(item.sellerNetCents),
    commissionRate: item.commissionRate,
    shippingService: item.shippingService
  }))
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: "Autenticacao obrigatoria." }, { status: 401 });
    }

    const body = (await request.json()) as PaymentIntentRequest;
    const currency = "brl";
    const paymentMethod = body.paymentMethod ?? "cartao";
    const address = body.address;
    const requestMeta = extractCheckoutRequestMeta(request);

    if (!address) {
      return NextResponse.json({ error: "Endereco obrigatorio." }, { status: 400 });
    }

    let items: Array<{ productId: string; quantity: number }>;
    try {
      try {
        const cart = await loadCartItemsForCheckout({
          userId: user.id,
          cartId: body.cartId ?? null
        });
        items = cart.items;
      } catch (error) {
        const cartError = error as Error & { code?: string };
        if (cartError.code === "CART_ACCESS_DENIED" && body.cartId) {
          const fallback = await loadCartItemsForCheckout({ userId: user.id });
          items = fallback.items;
        } else {
          throw error;
        }
      }
    } catch (error) {
      const cartError = error as Error & { code?: string };
      if (cartError.code === "CART_NOT_FOUND") {
        return NextResponse.json({ error: cartError.message }, { status: 404 });
      }
      if (cartError.code === "CART_EMPTY") {
        return NextResponse.json({ error: cartError.message }, { status: 400 });
      }
      if (cartError.code === "CART_ACCESS_DENIED") {
        return NextResponse.json({ error: cartError.message }, { status: 403 });
      }
      if (cartError.code === "CART_INACTIVE") {
        return NextResponse.json({ error: cartError.message }, { status: 409 });
      }
      throw error;
    }

    const cartHash = buildCheckoutCartHash(items);
    const addressHash = buildCheckoutAddressHash(address);
    const idempotencyKey = buildCheckoutIdempotencyKey({
      customerId: user.id,
      currency,
      paymentMethodPreference: paymentMethod,
      cartHash,
      addressHash
    });

    const reservedSession = await reserveCheckoutSession({
      customerId: user.id,
      idempotencyKey,
      cartHash,
      addressHash,
      paymentMethodPreference: paymentMethod,
      currency,
      meta: requestMeta
    });

    const reusableSession = reservedSession.session
      ? await findReusableCheckoutSession({
          customerId: user.id,
          idempotencyKey
        })
      : null;

    if (
      reusableSession?.payment_intent_id &&
      reusableSession.order_id
    ) {
      const availablePaymentMethods = normalizeAvailablePaymentMethods(
        reusableSession.allowed_payment_methods
      );
      const persistedBreakdown = await loadPersistedCheckoutBreakdown(reusableSession.order_id);
      const totalAmountCents =
        persistedBreakdown.totalAmountCents > 0
          ? persistedBreakdown.totalAmountCents
          : 0;

      if (smokeStubEnabled) {
        return NextResponse.json(
          buildPaymentIntentResponse({
            checkoutSessionId: reusableSession.id as string,
            orderId: reusableSession.order_id,
            paymentIntentId: reusableSession.payment_intent_id,
            clientSecret: `stub_reused_${reusableSession.payment_intent_id}`,
            totalAmountCents,
            splits: persistedBreakdown.splits,
            availablePaymentMethods:
              availablePaymentMethods.length > 0 ? availablePaymentMethods : ["cartao"],
            mode: "stub-reused"
          })
        );
      }

      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(reusableSession.payment_intent_id);

      return NextResponse.json(
        buildPaymentIntentResponse({
          checkoutSessionId: reusableSession.id as string,
          orderId: reusableSession.order_id,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret ?? "",
          totalAmountCents:
            totalAmountCents > 0 ? totalAmountCents : Number(paymentIntent.amount ?? 0),
          splits: persistedBreakdown.splits,
          availablePaymentMethods:
            availablePaymentMethods.length > 0
              ? availablePaymentMethods
              : mapStripePaymentMethodTypes(paymentIntent.payment_method_types)
        })
      );
    }

    if (
      reservedSession.wasExisting &&
      reservedSession.session &&
      !reservedSession.session.order_id &&
      !reservedSession.session.payment_intent_id
    ) {
      const createdAt = Date.parse(String(reservedSession.session.created_at ?? ""));
      if (!Number.isNaN(createdAt) && Date.now() - createdAt < CHECKOUT_IN_PROGRESS_WINDOW_MS) {
        return NextResponse.json(
          {
            error:
              "Ja existe um checkout em processamento para esse carrinho. Aguarde alguns segundos e tente novamente.",
            code: "CHECKOUT_IN_PROGRESS"
          },
          { status: 409 }
        );
      }
    }

    let draft: Awaited<ReturnType<typeof createCheckoutDraft>>;
    try {
      draft = await createCheckoutDraft({
        customerId: user.id,
        items,
        address,
        paymentMethod,
        currency,
        allowUnconnectedSellers: smokeStubEnabled
      });
    } catch (error) {
      await markCheckoutSessionFailure({
        customerId: user.id,
        idempotencyKey,
        failureCode: "CHECKOUT_DRAFT_FAILED",
        failureReason: error instanceof Error ? error.message : "Falha ao criar draft do checkout."
      });
      throw error;
    }

    const risk = await assessCheckoutRisk({
      customerId: user.id,
      totalAmountCents: draft.totalAmountCents,
      meta: requestMeta
    });

    if (risk.blocked) {
      await persistBlockedCheckoutAttempt({
        customerId: user.id,
        idempotencyKey,
        cartHash,
        addressHash,
        paymentMethodPreference: paymentMethod,
        currency,
        meta: requestMeta,
        risk
      });
      await deleteCheckoutDraft(draft.orderId);
      return NextResponse.json(
        {
          error: risk.rateLimited
            ? "Muitas tentativas de checkout em pouco tempo. Tente novamente em alguns minutos."
            : "Checkout temporariamente bloqueado para revisao de seguranca.",
          code: risk.rateLimited ? "CHECKOUT_RATE_LIMITED" : "CHECKOUT_BLOCKED_RISK",
          risk: {
            tier: risk.tier,
            score: risk.score,
            flags: risk.flags
          }
        },
        {
          status: risk.rateLimited ? 429 : 403,
          headers: risk.rateLimited ? { "Retry-After": "600" } : undefined
        }
      );
    }

    const sessionDraft = await persistCheckoutSessionDraft({
      customerId: user.id,
      orderId: draft.orderId,
      idempotencyKey,
      cartHash,
      addressHash,
      paymentMethodPreference: paymentMethod,
      currency,
      meta: requestMeta,
      risk,
      pricingSnapshot: draft.pricingSnapshot,
      shippingSnapshot: draft.shippingSnapshot
    });

    if (smokeStubEnabled) {
      const provider = new StubProvider();
      const paymentIntent = await provider.createPaymentIntent({
        amountCents: draft.totalAmountCents,
        currency,
        customerId: draft.orderId
      });

      await attachPaymentIntentToOrder(draft.orderId, paymentIntent.id);
      await recordPaymentState({
        orderId: draft.orderId,
        state: "requires_payment_method",
        paymentIntentId: paymentIntent.id,
        amountCents: draft.totalAmountCents,
        currency,
        provider: "stub",
        event: "payment_intent.created",
        metadata: {
          payment_method: paymentMethod,
          mode: "stub",
          device_fingerprint: requestMeta.deviceFingerprint
        }
      });
      await updateCheckoutSessionAfterPaymentIntent({
        customerId: user.id,
        idempotencyKey,
        orderId: draft.orderId,
        paymentIntentId: paymentIntent.id,
        provider: "stub",
        providerStatus: "requires_payment_method",
        allowedPaymentMethods:
          paymentMethod === "pix"
            ? ["pix"]
            : paymentMethod === "boleto"
              ? ["boleto"]
              : ["cartao"]
      });

      return NextResponse.json({
        ...buildPaymentIntentResponse({
          checkoutSessionId: sessionDraft?.id as string | undefined,
          orderId: draft.orderId,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.clientSecret ?? "",
          totalAmountCents: draft.totalAmountCents,
          availablePaymentMethods:
            paymentMethod === "pix"
              ? ["pix"]
              : paymentMethod === "boleto"
                ? ["boleto"]
                : ["cartao"],
          mode: "stub",
          splits: draft.splits
        })
      });
    }

    const stripe = getStripe();
    const basePayload = {
      amount: draft.totalAmountCents,
      currency,
      metadata: {
        orderId: draft.orderId,
        paymentMethod,
        checkoutIdempotencyKey: idempotencyKey
      },
      transfer_group: draft.orderId
    } as const;

    let paymentIntent;
    try {
      try {
        paymentIntent = await stripe.paymentIntents.create({
          ...basePayload,
          automatic_payment_methods: { enabled: true }
        }, {
          idempotencyKey
        });
      } catch (error) {
        if (
          error instanceof Error &&
          /No valid payment method types/i.test(error.message)
        ) {
          paymentIntent = await stripe.paymentIntents.create({
            ...basePayload,
            payment_method_types: ["card"]
          }, {
            idempotencyKey
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      await markCheckoutSessionFailure({
        customerId: user.id,
        idempotencyKey,
        orderId: draft.orderId,
        failureCode: "PAYMENT_INTENT_CREATE_FAILED",
        failureReason: error instanceof Error ? error.message : "Falha ao criar payment intent."
      });
      await deleteCheckoutDraft(draft.orderId);
      throw error;
    }

    try {
      await attachPaymentIntentToOrder(draft.orderId, paymentIntent.id);
      const availablePaymentMethods = mapStripePaymentMethodTypes(
        paymentIntent.payment_method_types
      );
      await recordPaymentState({
        orderId: draft.orderId,
        state: mapStripePaymentIntentState(paymentIntent.status),
        paymentIntentId: paymentIntent.id,
        amountCents: draft.totalAmountCents,
        currency,
        provider: "stripe",
        event: "payment_intent.created",
        metadata: {
          payment_method_preference: paymentMethod,
          available_payment_methods: availablePaymentMethods,
          device_fingerprint: requestMeta.deviceFingerprint,
          request_ip: requestMeta.ipAddress
        }
      });
      await updateCheckoutSessionAfterPaymentIntent({
        customerId: user.id,
        idempotencyKey,
        orderId: draft.orderId,
        paymentIntentId: paymentIntent.id,
        provider: "stripe",
        providerStatus: paymentIntent.status,
        allowedPaymentMethods: availablePaymentMethods
      });
    } catch (error) {
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id);
      } catch (cancelError) {
        console.error("[stripe/payment-intent] cancel fallback failed", cancelError);
      }
      await markCheckoutSessionFailure({
        customerId: user.id,
        idempotencyKey,
        orderId: draft.orderId,
        failureCode: "ORDER_ATTACH_FAILED",
        failureReason: error instanceof Error ? error.message : "Falha ao anexar payment intent ao pedido."
      });
      await deleteCheckoutDraft(draft.orderId);
      throw error;
    }

    return NextResponse.json(
      buildPaymentIntentResponse({
        checkoutSessionId: sessionDraft?.id as string | undefined,
        orderId: draft.orderId,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret ?? "",
        totalAmountCents: draft.totalAmountCents,
        availablePaymentMethods: mapStripePaymentMethodTypes(paymentIntent.payment_method_types),
        splits: draft.splits
      })
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SELLER_NOT_CONNECTED"
    ) {
      const typedError = error as Error & { sellerId?: string; sellerName?: string };
      return NextResponse.json(
        {
          error: "SELLER_NOT_CONNECTED",
          missing: [
            {
              sellerId: typedError.sellerId,
              sellerName: typedError.sellerName
            }
          ]
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      const typedError = error as Error & {
        code?: string;
        sellerId?: string;
        sellerName?: string;
      };

      if (typedError.code === "SHIPPING_PROVIDER_NOT_CONFIGURED") {
        return NextResponse.json(
          {
            error:
              "Frete indisponivel temporariamente. Configure o Melhor Envio com credenciais validas.",
            code: typedError.code
          },
          { status: 503 }
        );
      }

      if (
        typedError.code === "SHIPPING_UNAVAILABLE" ||
        typedError.code === "SHIPPING_QUOTE_FAILED" ||
        typedError.code === "SELLER_ORIGIN_CEP_MISSING"
      ) {
        return NextResponse.json(
          {
            error: typedError.message,
            code: typedError.code,
            sellerId: typedError.sellerId,
            sellerName: typedError.sellerName
          },
          { status: 400 }
        );
      }
    }

    const message =
      error instanceof Error ? error.message : "Erro ao criar pagamento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
