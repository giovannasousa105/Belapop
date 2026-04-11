"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { useAuth } from "@/lib/AuthContext";
import { CartItem, SellerShipment } from "@/lib/types";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";
import { getCookie, setCookie } from "@/lib/cookies";
import { trackEvent } from "@/lib/analytics/tracker";

type CartContextValue = {
  items: CartItem[];
  addItem: (productId: string, quantity?: number, sellerId?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  replaceCart: (items: CartItem[]) => void;
  clearCart: () => void;
  itemCount: number;
  shipments: SellerShipment[];
  totalShipping: number;
  shippingCep: string;
  setShipments: (shipments: SellerShipment[], mode?: "replace" | "merge") => void;
  setShippingCep: (cep: string) => void;
  ready: boolean;
  cartId: string | null;
  anonId: string | null;
  markCartConverted: (orderId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

type CartStorageShape =
  | CartItem[]
  | {
      items: CartItem[];
      shipments?: SellerShipment[];
      shippingCep?: string;
      cartId?: string;
    };

const normalizeItems = (items: CartItem[]) =>
  items.map((item) => ({
    ...item,
    sellerId: item.sellerId || "unknown"
  }));

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shipments, setShipmentsState] = useState<SellerShipment[]>([]);
  const [shippingCep, setShippingCepState] = useState("");
  const [ready, setReady] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);
  const [anonId, setAnonId] = useState<string | null>(null);
  const syncInFlightRef = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    const stored = readStorage<CartStorageShape>(storageKeys.cart, []);
    if (Array.isArray(stored)) {
      setItems(normalizeItems(stored));
    } else {
      setItems(normalizeItems(stored.items ?? []));
      setShipmentsState(stored.shipments ?? []);
      setShippingCepState(stored.shippingCep ?? "");
      setCartId(stored.cartId ?? null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let storedAnon = getCookie("belapop_anon_id");
    if (!storedAnon) {
      storedAnon =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `anon-${Date.now()}`;
      setCookie("belapop_anon_id", storedAnon);
    }
    setAnonId(storedAnon);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeStorage(storageKeys.cart, {
      items,
      shipments,
      shippingCep,
      cartId
    });
  }, [items, shipments, shippingCep, ready, cartId]);

  useEffect(() => {
    if (!anonId || !ready) return;
    if (items.length === 0 && !cartId) return;
    if (syncInFlightRef.current) return;
    const controller = new AbortController();
    const sync = async () => {
      if (syncInFlightRef.current) return;
      syncInFlightRef.current = true;
      try {
        // Do not block auth/navigation on catalog fetch errors.
        // Subtotal can be recomputed server-side when needed.
        const subtotalCents = 0;

        const response = await fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: controller.signal,
          credentials: "include",
          body: JSON.stringify({
            items,
            subtotalCents,
            anonId,
            cartId,
            userId: user?.id ?? null
          })
        });
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : null;

        if (!response.ok) {
          console.error("[cart] sync failed", {
            status: response.status,
            data
          });
          return;
        }

        if (data?.cartId) {
          setCartId(data.cartId);
        }
      } catch (error) {
        // Ignora aborts do cleanup (ocorrem em dev/strict mode)
        if ((error as any)?.name === "AbortError") return;
        console.error("[cart] sync failed", error);
      } finally {
        syncInFlightRef.current = false;
      }
    };
    const timeout = setTimeout(() => {
      void sync();
    }, 400);

    return () => {
      clearTimeout(timeout);
      if (!controller.signal.aborted) controller.abort();
    };
  }, [items, anonId, cartId, ready, user?.id]);

  const addItem = (productId: string, quantity = 1, sellerId?: string) => {
    const resolvedSellerId = sellerId ?? "unknown";
    void trackEvent({
      type: "add_to_cart",
      productId,
      sellerId: resolvedSellerId,
      metadata: { quantity }
    });

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        { productId, quantity, sellerId: resolvedSellerId || "unknown" }
      ];
    });
  };

  const removeItem = (productId: string) => {
    void trackEvent({
      type: "remove_from_cart",
      productId,
      metadata: {}
    });

    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setShipmentsState([]);
    setShippingCepState("");
  };

  const replaceCart = (nextItems: CartItem[]) => {
    setItems(normalizeItems(nextItems));
    setShipmentsState([]);
    setShippingCepState("");
    setCartId(null);
  };

  const markCartConverted = async (orderId: string) => {
    if (!anonId && !cartId) return;
    await fetch("/api/cart/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({
        cartId,
        anonId,
        orderId,
        userId: user?.id ?? null
      })
    });
    setCartId(null);
    setItems([]);
    setShipmentsState([]);
    setShippingCepState("");
  };

  useEffect(() => {
    if (items.length === 0) {
      setShipmentsState([]);
      return;
    }
    const sellers = new Set(items.map((item) => item.sellerId));
    setShipmentsState((prev) =>
      prev.filter((shipment) => sellers.has(shipment.sellerId))
    );
  }, [items]);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const totalShipping = useMemo(
    () => shipments.reduce((total, shipment) => total + shipment.price, 0),
    [shipments]
  );

  const setShipments = (
    nextShipments: SellerShipment[],
    mode: "replace" | "merge" = "replace"
  ) => {
    setShipmentsState((prev) => {
      if (mode === "replace") return nextShipments;
      const map = new Map(prev.map((shipment) => [shipment.sellerId, shipment]));
      nextShipments.forEach((shipment) => {
        map.set(shipment.sellerId, shipment);
      });
      return Array.from(map.values());
    });
  };

  const setShippingCep = (cep: string) => {
    setShippingCepState(cep);
  };

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    replaceCart,
    clearCart,
    itemCount,
    shipments,
    totalShipping,
    shippingCep,
    setShipments,
    setShippingCep,
    ready,
    cartId,
    anonId,
    markCartConverted
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
};
