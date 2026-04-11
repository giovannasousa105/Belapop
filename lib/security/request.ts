import "server-only";

const parseForwardedValue = (value: string | null) => {
  const parsed = value?.split(",")[0]?.trim() ?? "";
  return parsed || null;
};

export const getRequestIp = (request: Request) =>
  parseForwardedValue(request.headers.get("x-real-ip")) ??
  parseForwardedValue(request.headers.get("x-forwarded-for")) ??
  parseForwardedValue(request.headers.get("cf-connecting-ip"));
