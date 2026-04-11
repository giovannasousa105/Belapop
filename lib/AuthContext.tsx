"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { getSupabaseClient } from "@/lib/supabase/client";
import { SellerProfile, User, UserRole } from "@/lib/types";

export type PasskeyDevice = {
  id: string;
  friendlyName: string;
  status: "verified" | "unverified";
  createdAt: string;
  lastChallengedAt?: string;
};

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  login: (
    email: string,
    password: string,
    role?: UserRole
  ) => Promise<{ ok: boolean; message?: string }>;
  loginWithMagicLink: (
    email: string,
    redirectTo?: string
  ) => Promise<{ ok: boolean; message?: string }>;
  loginWithOAuth: (
    provider: "google" | "facebook",
    redirectTo?: string
  ) => Promise<{ ok: boolean; message?: string }>;
  hasPasskey: () => Promise<boolean>;
  registerPasskey: (
    friendlyName?: string
  ) => Promise<{ ok: boolean; message?: string }>;
  authenticateWithPasskey: () => Promise<{ ok: boolean; message?: string }>;
  listPasskeys: () => Promise<PasskeyDevice[]>;
  removePasskey: (factorId: string) => Promise<{ ok: boolean; message?: string }>;
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
  switchSeller: (sellerId: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const browserSupportsPasskey = () =>
  typeof window !== "undefined" &&
  typeof PublicKeyCredential !== "undefined" &&
  typeof navigator?.credentials !== "undefined";

const mapPasskeyError = (message: string | undefined) => {
  const value = (message ?? "").toLowerCase();
  if (!value) return "Nao foi possivel concluir com Passkey.";
  if (value.includes("not allowed")) return "Operacao cancelada. Tente novamente e confirme no dispositivo.";
  if (value.includes("timed out")) return "Tempo esgotado para confirmar Passkey.";
  if (value.includes("does not support webauthn")) return "Este dispositivo nao suporta Passkey.";
  if (value.includes("no verified webauthn")) return "Nenhuma Passkey verificada encontrada para esta conta.";
  return "Nao foi possivel concluir com Passkey.";
};

const isColumnMissingError = (message: string | undefined) => {
  const value = (message ?? "").toLowerCase();
  return value.includes("column") && value.includes("does not exist");
};

const normalizeUserRole = (value: unknown): UserRole => {
  if (value === "admin") return "admin";
  if (value === "seller" || value === "partner") return "seller";
  return "customer";
};

const normalizeUserRoles = (value: unknown): UserRole[] => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((entry) => normalizeUserRole(entry))));
};

const mapFallbackAuthUser = (authUser: any, userId: string): User => {
  const metadataRole = normalizeUserRole(authUser?.app_metadata?.role ?? authUser?.user_metadata?.role);
  const email = authUser?.email ?? "";
  const fullName =
    (typeof authUser?.user_metadata?.full_name === "string" && authUser.user_metadata.full_name) ||
    (typeof authUser?.user_metadata?.name === "string" && authUser.user_metadata.name) ||
    email;

  return {
    id: userId,
    name: fullName ?? "",
    email,
    role: metadataRole,
    roles: [metadataRole],
    createdAt: authUser?.created_at ?? undefined
  };
};

const mapSellerProfile = (seller: any, data: any): SellerProfile => ({
  sellerId: seller.id ?? undefined,
  storeName: seller.store_name ?? "",
  responsibleName: data.full_name ?? "",
  contact: seller.whatsapp ?? seller.instagram ?? "",
  mainCategory: seller.category ?? "",
  postalCode: seller.postal_code ?? "",
  status: seller.status ?? "pending",
  stripeAccountId: seller.stripe_account_id ?? undefined,
  commissionRate: seller.commission_rate ?? undefined,
  ownerUserId: seller.user_id ?? undefined,
  isOwner: seller.is_owner === true,
  memberRole: typeof seller.member_role === "string" ? seller.member_role : null
});

const mapUser = (data: any): User => {
  const activeRole = normalizeUserRole(data?.role ?? "customer");
  const roles = normalizeUserRoles(data?.roles);
  if (!roles.includes(activeRole)) {
    roles.unshift(activeRole);
  }

  const seller = data?.sellers;
  const sellerProfiles = Array.isArray(data?.seller_profiles)
    ? data.seller_profiles
        .map((entry: any) => mapSellerProfile(entry, data))
        .filter((entry: SellerProfile) => Boolean(entry.sellerId))
    : [];
  const mappedSeller = seller ? mapSellerProfile(seller, data) : null;
  if (
    mappedSeller?.sellerId &&
    !sellerProfiles.some((entry: SellerProfile) => entry.sellerId === mappedSeller.sellerId)
  ) {
    sellerProfiles.unshift(mappedSeller);
  }

  const activeSellerId =
    typeof data?.active_seller_id === "string" ? data.active_seller_id : undefined;
  const activeSeller =
    sellerProfiles.find((entry: SellerProfile) => entry.sellerId === activeSellerId) ??
    mappedSeller ??
    sellerProfiles[0];

  return {
    id: data.id,
    name: data.full_name ?? data.email ?? "",
    email: data.email ?? "",
    role: activeRole,
    roles,
    createdAt: data.created_at ?? undefined,
    sellerProfile: activeSeller,
    sellerProfiles: sellerProfiles.length > 0 ? sellerProfiles : undefined
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const supabase = useMemo(() => getSupabaseClient(), []);

  const ensureUserRole = useCallback(async () => {
    try {
      await fetch("/api/auth/ensure-role", { method: "POST" });
    } catch (error) {
      console.warn("[auth] ensure-role failed", error);
    }
  }, []);

  const loadProfile = useCallback(
    async (userId: string, authUser?: any) => {
      try {
        const response = await fetch("/api/auth/ensure-profile", { method: "POST" });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          console.warn("[auth] ensure-profile failed", payload?.error ?? response.statusText);
        } else if (payload?.profile?.id === userId) {
          const mapped = mapUser(payload.profile);
          setUser(mapped);
          return mapped;
        }
      } catch (error) {
        console.warn("[auth] Failed to load profile via API:", error);
      }

      const fallback = mapFallbackAuthUser(authUser, userId);
      setUser(fallback);
      void ensureUserRole();
      return fallback;
    },
    [ensureUserRole]
  );

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session?.user) {
        await loadProfile(data.session.user.id, data.session.user);
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
        await loadProfile(session.user.id, session.user);
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

    await loadProfile(userId, data.user);
    return { ok: true };
  };

  const registerSeller = async (
    profile: SellerProfile,
    email: string,
    password: string
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanStoreName = profile.storeName.trim();
    const cleanResponsibleName = profile.responsibleName.trim();
    const cleanCnpj = (profile.cnpj ?? "").replace(/\D/g, "");
    const cleanCompanyZip = (profile.companyAddress?.postalCode ?? "").replace(/\D/g, "");
    const cleanCompanyStreet = profile.companyAddress?.street?.trim() ?? "";
    const cleanCompanyNumber = profile.companyAddress?.number?.trim() ?? "";
    const cleanCompanyDistrict = profile.companyAddress?.district?.trim() ?? "";
    const cleanCompanyCity = profile.companyAddress?.city?.trim() ?? "";
    const cleanCompanyState = (profile.companyAddress?.state ?? "").trim().toUpperCase();

    if (!cleanStoreName || !cleanResponsibleName || !normalizedEmail || !password) {
      return { ok: false, message: "Preencha os dados obrigatorios para criar a conta." };
    }

    if (password.length < 6) {
      return { ok: false, message: "A senha deve ter no minimo 6 caracteres." };
    }

    if (cleanCnpj.length !== 14) {
      return { ok: false, message: "Informe um CNPJ valido com 14 digitos." };
    }

    if (cleanCompanyZip.length !== 8) {
      return { ok: false, message: "Informe um CEP valido com 8 digitos." };
    }

    if (
      !cleanCompanyStreet ||
      !cleanCompanyNumber ||
      !cleanCompanyDistrict ||
      !cleanCompanyCity ||
      cleanCompanyState.length !== 2
    ) {
      return { ok: false, message: "Preencha o endereco completo da empresa." };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: cleanResponsibleName, role: "seller" }
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
      .update({ full_name: cleanResponsibleName, role: "seller", email: normalizedEmail })
      .eq("id", userId);

    if (profileError) {
      return { ok: false, message: profileError.message };
    }

    const { error: sellerError } = await supabase.from("sellers").insert({
      user_id: userId,
      store_name: cleanStoreName,
      category: profile.mainCategory?.trim() || null,
      postal_code: cleanCompanyZip,
      whatsapp: profile.contact?.trim() || null,
      commission_rate: profile.commissionRate ?? 10,
      status: "pending"
    });

    if (sellerError) {
      return { ok: false, message: sellerError.message };
    }

    const baseApplicationPayload = {
      user_id: userId,
      brand_name: cleanStoreName,
      cnpj: cleanCnpj,
      contact_name: cleanResponsibleName,
      phone: null,
      instagram: null,
      catalog_link: null,
      status: "pending"
    };

    let { error: applicationError } = await supabase.from("partner_applications").insert({
      ...baseApplicationPayload,
      company_postal_code: cleanCompanyZip,
      company_street: cleanCompanyStreet,
      company_number: cleanCompanyNumber,
      company_complement: profile.companyAddress?.complement?.trim() || null,
      company_district: cleanCompanyDistrict,
      company_city: cleanCompanyCity,
      company_state: cleanCompanyState
    });

    if (applicationError && isColumnMissingError(applicationError.message)) {
      const fallback = await supabase.from("partner_applications").insert(baseApplicationPayload);
      applicationError = fallback.error;
    }

    if (applicationError) {
      return { ok: false, message: applicationError.message };
    }

    if (!data.session) {
      return {
        ok: false,
        message: "Confirme o e-mail para ativar a conta."
      };
    }

    await loadProfile(userId, data.user);
    return { ok: true };
  };

  const login = async (
    email: string,
    password: string,
    role?: UserRole
  ) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          error?: string;
          session?: {
            accessToken?: string;
            refreshToken?: string;
          };
        }
      | null;

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        message: payload?.error ?? "Credenciais inválidas."
      };
    }

    const accessToken = payload.session?.accessToken?.trim();
    const refreshToken = payload.session?.refreshToken?.trim();

    if (!accessToken || !refreshToken) {
      return { ok: false, message: "Sessão não criada." };
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (error || !data.user) {
      return {
        ok: false,
        message: error?.message ?? "Não foi possível sincronizar sua sessão."
      };
    }

    const profile = await loadProfile(data.user.id, data.user);
    if (!profile) {
      await logout();
      return { ok: false, message: "Perfil não localizado." };
    }
    const grantedRoles = new Set([profile.role, ...(profile.roles ?? [])]);
    if (role && !grantedRoles.has(role)) {
      await logout();
      return { ok: false, message: "Tipo de conta incompatível." };
    }
    return { ok: true };
  };

  const resolveRedirect = (redirectTo?: string) => {
    if (typeof window === "undefined") return undefined;
    const configuredOrigin = window.location.origin;
    if (!redirectTo) return `${configuredOrigin}/login`;
    if (redirectTo.startsWith("http")) return redirectTo;
    return `${configuredOrigin}${redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`}`;
  };

  const loginWithMagicLink = async (email: string, redirectTo?: string) => {
    const resolved = resolveRedirect(redirectTo);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: resolved
      }
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "Enviamos um link seguro para o seu e-mail." };
  };

  const loginWithOAuth = async (
    provider: "google" | "facebook",
    redirectTo?: string
  ) => {
    const resolved = resolveRedirect(redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: resolved,
        skipBrowserRedirect: true
      }
    });
    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("provider is not enabled")) {
        const providerLabel = provider === "google" ? "Google" : "Facebook";
        return {
          ok: false,
          message: `Login com ${providerLabel} ainda nao habilitado no Supabase deste ambiente.`
        };
      }
      return { ok: false, message: error.message };
    }
    const url = data?.url;
    if (!url) {
      return { ok: false, message: "Nao foi possivel iniciar o login social." };
    }

    // Defensive check: Facebook OAuth must use numeric App ID.
    if (provider === "facebook") {
      try {
        const parsed = new URL(url);
        const clientId = parsed.searchParams.get("client_id")?.trim() ?? "";
        if (!/^\d+$/.test(clientId)) {
          return {
            ok: false,
            message:
              "Facebook Login nao configurado corretamente (App ID invalido no Supabase)."
          };
        }
      } catch {
        return { ok: false, message: "Nao foi possivel iniciar o login com Facebook." };
      }
    }

    if (typeof window !== "undefined") {
      window.location.assign(url);
    }
    return { ok: true };
  };

  const mapPasskeyFactor = (factor: {
    id: string;
    friendly_name?: string;
    status: string;
    created_at: string;
    last_challenged_at?: string;
  }): PasskeyDevice => ({
    id: factor.id,
    friendlyName: factor.friendly_name?.trim() || "Passkey",
    status: factor.status === "verified" ? "verified" : "unverified",
    createdAt: factor.created_at,
    lastChallengedAt: factor.last_challenged_at
  });

  const getPasskeyFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return { factors: [], error };

    const factors =
      data?.all?.filter(
        (factor) => factor.factor_type === "webauthn" && factor.status === "verified"
      ) ?? [];
    return { factors, error: null };
  };

  const listPasskeys = async (): Promise<PasskeyDevice[]> => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return [];

    return (
      data?.all
        ?.filter((factor) => factor.factor_type === "webauthn")
        .map((factor) =>
          mapPasskeyFactor({
            id: factor.id,
            friendly_name: factor.friendly_name,
            status: factor.status,
            created_at: factor.created_at,
            last_challenged_at: factor.last_challenged_at
          })
        ) ?? []
    );
  };

  const hasPasskey = async () => {
    const { factors, error } = await getPasskeyFactors();
    if (error) return false;
    return factors.length > 0;
  };

  const registerPasskey = async (friendlyName?: string) => {
    if (!browserSupportsPasskey()) {
      return { ok: false, message: "Este dispositivo nao suporta Passkey." };
    }

    const label =
      friendlyName && friendlyName.trim().length > 0
        ? friendlyName.trim()
        : `BelaPop Passkey ${new Date().toLocaleDateString("pt-BR")}`;

    const { error } = await supabase.auth.mfa.webauthn.register({
      friendlyName: label,
      webauthn: {
        rpId: window.location.hostname,
        rpOrigins: [window.location.origin]
      }
    });

    if (error) {
      return { ok: false, message: mapPasskeyError(error.message) };
    }

    return { ok: true, message: "Passkey cadastrada com sucesso." };
  };

  const authenticateWithPasskey = async () => {
    if (!browserSupportsPasskey()) {
      return { ok: false, message: "Este dispositivo nao suporta Passkey." };
    }

    const { factors, error: factorError } = await getPasskeyFactors();
    if (factorError) {
      return { ok: false, message: mapPasskeyError(factorError.message) };
    }

    if (!factors.length) {
      return { ok: false, message: "Nenhuma Passkey verificada encontrada para esta conta." };
    }

    let lastErrorMessage: string | undefined;
    let authenticated = false;

    // Some accounts may have stale factors (old domain/device). Try all verified factors.
    for (const factor of factors) {
      const { error } = await supabase.auth.mfa.webauthn.authenticate({
        factorId: factor.id,
        webauthn: {
          rpId: window.location.hostname,
          rpOrigins: [window.location.origin]
        }
      });

      if (!error) {
        authenticated = true;
        break;
      }

      lastErrorMessage = error.message;
    }

    if (!authenticated) {
      return {
        ok: false,
        message:
          mapPasskeyError(lastErrorMessage) +
          " Se necessario, recadastre sua Passkey neste dispositivo."
      };
    }

    const {
      data: { user: authUser }
    } = await supabase.auth.getUser();
    if (authUser?.id) {
      await loadProfile(authUser.id, authUser);
    }

    return { ok: true, message: "Sessao reforcada com Passkey." };
  };

  const removePasskey = async (factorId: string) => {
    if (!factorId) {
      return { ok: false, message: "Passkey invalida." };
    }

    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      return { ok: false, message: mapPasskeyError(error.message) };
    }

    return { ok: true, message: "Passkey removida." };
  };

  const updateSellerProfile = async (profile: Partial<SellerProfile>) => {
    const canUseSellerPortal =
      user?.role === "seller" || (user?.roles ?? []).includes("seller");
    if (!user || !canUseSellerPortal) {
      return { ok: false, message: "Acesso restrito." };
    }

    const activeSellerId = user.sellerProfile?.sellerId?.trim();
    if (!activeSellerId) {
      return { ok: false, message: "Nenhuma loja ativa selecionada." };
    }
    if (user.sellerProfile?.isOwner === false) {
      return {
        ok: false,
        message: "Somente o owner da loja pode editar os dados institucionais."
      };
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
      .eq("id", activeSellerId);

    if (error) {
      return { ok: false, message: error.message };
    }

    await loadProfile(user.id);
    return { ok: true };
  };

  const switchSeller = async (sellerId: string) => {
    const canUseSellerPortal =
      user?.role === "seller" || (user?.roles ?? []).includes("seller");
    if (!user || !canUseSellerPortal) {
      return { ok: false, message: "Acesso restrito." };
    }

    const normalizedSellerId = sellerId.trim();
    if (!normalizedSellerId) {
      return { ok: false, message: "Loja invalida." };
    }

    if (user.sellerProfile?.sellerId === normalizedSellerId) {
      return { ok: true };
    }

    const response = await fetch("/api/auth/active-seller", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sellerId: normalizedSellerId })
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        message: payload?.error ?? "Nao foi possivel trocar a loja ativa."
      };
    }

    await loadProfile(user.id);
    return { ok: true };
  };

  const logout = async () => {
    let serverRevokedSession = false;

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });
      serverRevokedSession = response.ok;
    } catch {
      serverRevokedSession = false;
    }

    try {
      await supabase.auth.signOut({
        scope: serverRevokedSession ? "local" : "global"
      });
    } catch {
      // Keep UI state consistent even when token revocation already happened on the server.
    }

    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    ready,
    login,
    loginWithMagicLink,
    loginWithOAuth,
    hasPasskey,
    registerPasskey,
    authenticateWithPasskey,
    listPasskeys,
    removePasskey,
    registerCustomer,
    registerSeller,
    updateSellerProfile,
    switchSeller,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

