import { financeRepository } from "@/lib/adm/repositories/financeRepository";
import { ordersRepository } from "@/lib/adm/repositories/ordersRepository";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { AdminVisualStatus } from "@/types/adm";

export type DashboardMetrics = {
  gmv: number;
  criticalOrders: number;
  pendingCuration: number;
  pendingDocuments: number;
  openAlerts: number;
  sellersAtRisk: number;
};

export type PriorityCard = {
  id: string;
  title: string;
  detail: string;
  status: AdminVisualStatus;
  href: string;
};

export const overviewRepository = {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const adminMockData = await getAdmDataSource();
    const gmv = adminMockData.orders.reduce((sum, order) => sum + order.total, 0);
    const criticalOrders = adminMockData.orders.filter((order) => order.priority === "critica").length;
    const pendingCuration = adminMockData.products.filter(
      (product) => product.curationStatus === "pendente" || product.curationStatus === "em-revisao"
    ).length;
    const pendingDocuments = adminMockData.documents.filter(
      (document) => document.status === "pendente" || document.status === "bloqueado"
    ).length;
    const openAlerts = adminMockData.financialAlerts.filter((alert) => alert.status !== "resolvido").length;
    const sellersAtRisk = adminMockData.sellers.filter(
      (seller) => seller.riskLevel === "alta" || seller.riskLevel === "critica"
    ).length;

    return {
      gmv,
      criticalOrders,
      pendingCuration,
      pendingDocuments,
      openAlerts,
      sellersAtRisk
    };
  },

  async listPriorityCards(limit = 4): Promise<PriorityCard[]> {
    const adminMockData = await getAdmDataSource();
    return adminMockData.financialAlerts.slice(0, limit).map((alert) => ({
      id: alert.id,
      title: alert.type,
      detail: alert.summary,
      status: alert.status,
      href: `/adm/financeiro/auditoria?alert=${alert.id}&priority=${alert.priority}`
    }));
  },

  async listTopCriticalOrders(limit = 4) {
    const response = await ordersRepository.listOrders({
      page: 1,
      pageSize: 100,
      sortBy: "createdAt",
      sortDir: "desc"
    });

    return response.data.items
      .filter((order) => order.priority === "critica" || order.status === "critico")
      .slice(0, limit);
  },

  async getExecutiveSummary() {
    const adminMockData = await getAdmDataSource();
    const orders = adminMockData.orders;
    const gmv = orders.reduce((sum, order) => sum + order.total, 0);
    const avgTicket = gmv / Math.max(orders.length, 1);
    const activeSellers = adminMockData.sellers.filter((seller) => seller.status !== "bloqueado").length;
    const criticalIncidents = adminMockData.logisticsIncidents.filter(
      (incident) => incident.status === "critico"
    ).length;
    const financeSummary = await financeRepository.getFinanceSummary();

    return {
      gmv,
      avgTicket,
      activeSellers,
      criticalIncidents,
      openAlerts: financeSummary.openAlerts
    };
  }
};
