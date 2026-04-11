import { redirect } from "next/navigation";

type SearchParamValue = string | string[] | undefined;
type Audience = "customer" | "partner";

type CallbackPageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

function firstValue(value: SearchParamValue) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function normalizeAudience(value: string | undefined): Audience {
  return value === "partner" ? "partner" : "customer";
}

function buildLoginRedirect(audience: Audience, extras?: Record<string, string>) {
  const params = new URLSearchParams();
  params.set("tab", audience);

  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      params.set(key, value);
    }
  }

  return `/login?${params.toString()}`;
}

export default async function AuthCallbackPage({ searchParams }: CallbackPageProps) {
  const params = (await searchParams) ?? {};
  const audience = normalizeAudience(firstValue(params.audience));
  const code = firstValue(params.code);
  const tokenHash = firstValue(params.token_hash);
  const type = firstValue(params.type);
  const oauthError = firstValue(params.error);
  const oauthErrorCode = firstValue(params.error_code);
  const oauthErrorDescription = firstValue(params.error_description);

  if (oauthError || oauthErrorCode || oauthErrorDescription) {
    const reason = oauthErrorCode ?? oauthError ?? oauthErrorDescription ?? "oauth_failed";
    redirect(
      buildLoginRedirect(audience, {
        oauth_fallback: "1",
        oauth_error: reason
      })
    );
  }

  if (code) {
    redirect(
      buildLoginRedirect(audience, {
        oauth_fallback: "1",
        oauth_code: code
      })
    );
  }

  if (tokenHash && type) {
    redirect(
      buildLoginRedirect(audience, {
        otp_fallback: "1",
        token_hash: tokenHash,
        otp_type: type
      })
    );
  }

  redirect(
    buildLoginRedirect(audience, {
      auth_error: "1"
    })
  );
}
