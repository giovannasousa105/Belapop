import type { PostHog as PostHogClient } from "posthog-node";

export { posthogConsentidoNoClient } from "@/lib/analytics/consent";

export type PosthogServerCapture = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

let posthogInstance: PostHogClient | null = null;

async function getPosthogServer(): Promise<PostHogClient | null> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!posthogInstance) {
    const { PostHog } = await import("posthog-node");
    posthogInstance = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      flushAt: 1,
      flushInterval: 0
    });
  }

  return posthogInstance;
}

export async function capturePosthogServer(
  event: PosthogServerCapture
): Promise<void> {
  const client = await getPosthogServer();
  if (!client) return;
  client.capture(event);
}

export async function shutdownPosthogServer(): Promise<void> {
  if (!posthogInstance) return;
  await posthogInstance.shutdown();
  posthogInstance = null;
}

export const posthogServer = {
  capture: capturePosthogServer,
  shutdown: shutdownPosthogServer
};
