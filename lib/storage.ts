export const storageKeys = {
  cart: "belapop.cart",
  users: "belapop.users",
  session: "belapop.session",
  orders: "belapop.orders",
  leads: "belapop.leads",
  newsletter: "belapop.newsletter",
  lastOrder: "belapop.lastOrder",
  products: "belapop.products",
  diary: "belapop.diary",
  favorites: "belapop.favorites",
  subOrders: "belapop.subOrders",
  adminSettings: "belapop.adminSettings"
};

export const readStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const readStorageRaw = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
};

export const writeStorage = <T>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};
