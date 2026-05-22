import * as Sentry from "@sentry/nextjs";

export function captureError(
  error: Error | unknown,
  context: Record<string, unknown> = {}
): void {
  Sentry.withScope((scope) => {
    scope.setExtras(context);
    Sentry.captureException(error);
  });
}

export function markAction(
  acao: string,
  dados?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category: "user_action",
    message: acao,
    data: dados,
    level: "info"
  });
}

export function identificarUsuaria(userId: string): void {
  Sentry.setUser({ id: userId });
}
