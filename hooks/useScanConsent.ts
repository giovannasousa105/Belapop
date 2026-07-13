"use client";

import { useState, useCallback, useEffect } from "react";
import type { ConsentType } from "@/lib/skin-scan/inference/types";

interface ConsentEntry {
  consent_type:   string;
  granted:        boolean;
  policy_version: string;
  granted_at:     string;
  revoked_at:     string | null;
}

interface ConsentState {
  consent_scan:         ConsentEntry | null;
  consent_data_sharing: ConsentEntry | null;
}

interface DeletionResult {
  ok:   boolean;
  note: string;
}

export interface UseScanConsentReturn {
  consents:          ConsentState;
  loading:           boolean;
  hasScanConsent:    boolean;
  hasDataSharing:    boolean;
  grant(type: ConsentType): Promise<void>;
  revoke(type: ConsentType): Promise<void>;
  requestDeletion(): Promise<DeletionResult>;
  refresh(): Promise<void>;
}

const POLICY_VERSION = "2026-07-10";

function isActive(entry: ConsentEntry | null): boolean {
  return entry?.granted === true && entry.revoked_at == null;
}

export function useScanConsent(): UseScanConsentReturn {
  const [consents, setConsents] = useState<ConsentState>({
    consent_scan: null,
    consent_data_sharing: null,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scan/consent");
      if (res.ok) setConsents(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const grant = useCallback(async (type: ConsentType) => {
    await fetch("/api/scan/consent", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ consent_type: type, granted: true, policy_version: POLICY_VERSION }),
    });
    await refresh();
  }, [refresh]);

  const revoke = useCallback(async (type: ConsentType) => {
    await fetch("/api/scan/consent", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ consent_type: type, granted: false, policy_version: POLICY_VERSION }),
    });
    await refresh();
  }, [refresh]);

  const requestDeletion = useCallback(async (): Promise<DeletionResult> => {
    const res  = await fetch("/api/scan/data", { method: "DELETE" });
    const data = await res.json() as DeletionResult;
    await refresh();
    return data;
  }, [refresh]);

  return {
    consents,
    loading,
    hasScanConsent: isActive(consents.consent_scan),
    hasDataSharing: isActive(consents.consent_data_sharing),
    grant,
    revoke,
    requestDeletion,
    refresh,
  };
}
