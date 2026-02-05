"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { SellerProfile, User, UserRole } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  login: (
    email: string,
    password: string,
    role?: UserRole
  ) => Promise<{ ok: boolean; message?: string }>;
  loginWithMagicLink: (
    email: string
  ) => Promise<{ ok: boolean; message?: string }>;
  loginWithOAuth: (
    provider: "google" | "facebook"
  ) => Promise<{ ok: boolean; message?: string }>;
  registerCustomer: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message?: string }>;
  registerSeller: (
    profile: SellerProfile,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; message?: string }>;
  updateSellerProfile: (
    profile: Partial<SellerProfile>
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mapUser = (data: any): User => {
  const seller = data?.sellers;
  return {
    id: data.id,
    name: data.full_name ?? data.email ?? "",
    email: data.email ?? "",
    role: (data.role ?? "customer") as UserRole,
    createdAt: data.created_at ?? undefined,
    sellerProfile: seller
      ? {
          sellerId: seller.id ?? undefined,
          storeName: seller.store_name ?? "",
          responsibleName: data.full_name ?? "",
          contact: seller.whatsapp ?? seller.instagram ?? "",
          mainCategory: seller.category ?? "",
          postalCode: seller.postal_code ?? "",
          status: seller.status ?? "pending",
          stripeAccountId: seller.stripe_account_id ?? undefined,
          commissionRate: seller.commission_rate ?? undefined
        }
      : undefined
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const loadProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,email,role,full_name,created_at,sellers(id,store_name,category,postal_code,whatsapp,instagram,status,stripe_account_id,commission_rate)"
        )
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("[auth] Failed to load profile:", error);
        setUser(null);
        return null;
      }
      if (!data) {
        setUser(null);
        return null;
      }
      const mapped = mapUser(data);
      setUser(mapped);
      return mapped;
    },
    [supabase]
  );

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session?.user) {
        await loadProfile(data.session.user.id);
      } else {
        setUser(null);
      }
      setReady(true);
    };
    void init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;
        if (!session?.user) {
          setUser(null);
          setReady(true);
          return;
        }
        await loadProfile(session.user.id);
        setReady(true);
      }
    );

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const registerCustomer = async (
    name: string,
    email: string,
    password: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role: "customer" }
      }
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    const userId = data.user?.id;
    if (!userId) {
      return { ok: false, message: "Não foi possível criar o usuário." };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: name, role: "customer", email })
      .eq("id", userId);

    if (profileError) {
      return { ok: false, message: profileError.message };
    }

    if (!data.session) {
      return {
        ok: false,
        message: "Confirme o e-mail para ativar a conta."
      };
    }

    await loadProfile(userId);
    return { ok: true };
  };

  const registerSeller = async (
    profile: SellerProfile,
    email: string,
    password: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: profile.responsibleName, role: "seller" }
      }
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    const userId = data.user?.id;
    if (!userId) {
      return { ok: false, message: "Não foi possível criar o usuário." };
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: profile.responsibleName, role: "seller", email })
      .eq("id", userId);

    if (profileError) {
      return { ok: false, message: profileError.message };
    }

    const { error: sellerError } = await supabase.from("sellers").insert({
      user_id: userId,
      store_name: profile.storeName,
      category: profile.mainCategory,
      postal_code: profile.postalCode,
      whatsapp: profile.contact,
      commission_rate: profile.commissionRate ?? 10,
      status: "pending"
    });

    if (sellerError) {
      return { ok: false, message: sellerError.message };
    }

    if (!data.session) {
      return {
        ok: false,
        message: "Confirme o e-mail para ativar a conta."
      };
    }

    await loadProfile(userId);
    return { ok: true };
  };

  const login = async (
    email: string,
    password: string,
    role?: UserRole
  ) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error || !data.user) {
      return { ok: false, message: error?.message ?? "Credenciais inválidas." };
    }
    const profile = await loadProfile(data.user.id);
    if (!profile) {
      await supabase.auth.signOut();
      return { ok: false, message: "Perfil não localizado." };
    }
    if (role && profile.role !== role) {
      await supabase.auth.signOut();
      return { ok: false, message: "Tipo de conta incompatível." };
    }
    return { ok: true };
  };

  const loginWithMagicLink = async (email: string) => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "Enviamos um link seguro para o seu e-mail." };
  };

  const loginWithOAuth = async (provider: "google" | "facebook") => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo
      }
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  };

  const updateSellerProfile = async (profile: Partial<SellerProfile>) => {
    if (!user || user.role !== "seller") {
      return { ok: false, message: "Acesso restrito." };
    }

    const { error } = await supabase
      .from("sellers")
      .update({
        store_name: profile.storeName ?? user.sellerProfile?.storeName ?? null,
        category: profile.mainCategory ?? user.sellerProfile?.mainCategory ?? null,
        postal_code: profile.postalCode ?? user.sellerProfile?.postalCode ?? null,
        whatsapp: profile.contact ?? user.sellerProfile?.contact ?? null,
        status: profile.status ?? user.sellerProfile?.status ?? null,
        stripe_account_id:
          profile.stripeAccountId ?? user.sellerProfile?.stripeAccountId ?? null,
        commission_rate:
          profile.commissionRate ?? user.sellerProfile?.commissionRate ?? null
      })
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, message: error.message };
    }

    await loadProfile(user.id);
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      loginWithMagicLink,
      loginWithOAuth,
      registerCustomer,
      registerSeller,
      updateSellerProfile,
      logout
    }),
    [
      user,
      ready,
      login,
      loginWithMagicLink,
      loginWithOAuth,
      registerCustomer,
      registerSeller,
      updateSellerProfile
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

