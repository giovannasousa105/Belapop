import "server-only";

import { adminMockData } from "@/data/adm/mockData";
import { loadSupabaseAdmDataSource } from "@/lib/adm/repositories/source.supabase";
import type { AdmDataSource, AdmDataSourceMode } from "@/lib/adm/repositories/source.types";

type AdmGlobalScope = typeof globalThis & {
  __BELAPOP_ADM_DATA_SOURCE__?: AdmDataSource;
};

const cloneAdmDataSource = (): AdmDataSource => {
  if (typeof structuredClone === "function") {
    return structuredClone(adminMockData);
  }

  return JSON.parse(JSON.stringify(adminMockData)) as AdmDataSource;
};

const globalScope = globalThis as AdmGlobalScope;

export const admDataSource =
  globalScope.__BELAPOP_ADM_DATA_SOURCE__ ?? (globalScope.__BELAPOP_ADM_DATA_SOURCE__ = cloneAdmDataSource());

const resolveAdmDataSourceMode = (): AdmDataSourceMode => {
  const normalized = process.env.ADM_DATA_SOURCE_MODE?.trim().toLowerCase();
  if (normalized === "mock") return "mock";
  if (normalized === "supabase") return "supabase";
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return "supabase";
  }

  return "mock";
};

export const getMockAdmDataSource = () => admDataSource;

export const getAdmDataSource = async () => {
  if (resolveAdmDataSourceMode() !== "supabase") {
    return admDataSource;
  }

  return loadSupabaseAdmDataSource(admDataSource);
};

export const getAdmDataSourceMode = () => resolveAdmDataSourceMode();

export function mutateAdmDataSource<T>(mutator: (data: AdmDataSource) => T) {
  return mutator(admDataSource);
}

export type { AdmDataSource, AdmDataSourceMode };
