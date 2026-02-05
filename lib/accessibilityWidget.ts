export type AcsbConfig = {
  language: string;
  position: "left" | "right";
  leadColor: string;
  triggerColor: string;
  triggerPositionX: "left" | "right";
  triggerPositionY: "top" | "middle" | "bottom";
  triggerOffsetX: number;
  triggerOffsetY: number;
};

const getEnv = (key: string, fallback: string) => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : fallback;
};

export const getAcsbConfig = (): AcsbConfig => {
  const language = getEnv("NEXT_PUBLIC_ACCESSIBILITY_LANG", "pt");
  const position = (getEnv("NEXT_PUBLIC_ACCESSIBILITY_POSITION", "right") as
    | "left"
    | "right");
  const leadColor = getEnv("NEXT_PUBLIC_ACCESSIBILITY_COLOR", "#111827");

  return {
    language,
    position,
    leadColor,
    triggerColor: leadColor,
    triggerPositionX: position,
    triggerPositionY: "middle",
    triggerOffsetX: 20,
    triggerOffsetY: 0
  };
};

export const initGuarded = (config: AcsbConfig) => {
  if (typeof window === "undefined") return;
  if (window.__acsb_initialized || window.__acsb_init_started) return;

  // Avoid double-init in dev/HMR and avoid throwing if the SDK script isn't ready yet.
  window.__acsb_init_started = true;

  const maxAttempts = 50;
  const delayMs = 100;

  const tryInit = (attempt: number) => {
    if (window.__acsb_initialized) return;

    const api = window.acsbJS;
    if (api && typeof api.init === "function") {
      window.__acsb_initialized = true;
      api.init(config);
      return;
    }

    if (attempt >= maxAttempts) {
      window.__acsb_init_started = false;
      return;
    }

    window.setTimeout(() => tryInit(attempt + 1), delayMs);
  };

  tryInit(0);
};

declare global {
  interface Window {
    __acsb_initialized?: boolean;
    __acsb_init_started?: boolean;
    acsbJS?: { init: (config: AcsbConfig) => void };
  }
}
