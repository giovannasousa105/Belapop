"use client";

import type { AssistantFlow, AssistantRequest } from "@/lib/assistant/types";

export const CONSULTORA_BELAPOP_OPEN_EVENT = "belapop-assistant:open";
export const LEGACY_CURADORIA_OPEN_EVENT = "open-curadoria-chat";

export type ConsultoraBelaPopOpenDetail = {
  flow?: AssistantFlow;
  origin?: string;
  currentProductSlug?: string | null;
  scanContext?: AssistantRequest["scanContext"];
};

export const dispatchConsultoraBelaPopOpen = (detail?: ConsultoraBelaPopOpenDetail) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ConsultoraBelaPopOpenDetail>(CONSULTORA_BELAPOP_OPEN_EVENT, {
      detail
    })
  );
};
