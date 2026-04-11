import { adminMockData } from "@/data/adm/mockData";

export type AdmDataSource = typeof adminMockData;

export type AdmDataSourceMode = "mock" | "supabase";
