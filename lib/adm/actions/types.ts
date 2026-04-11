import type { AdminVisualStatus, PriorityLevel } from "@/types/adm";

export type AdmActionType =
  | "product.approve"
  | "product.reject"
  | "product.request-adjustment"
  | "seller.activate"
  | "seller.deactivate"
  | "seller.block"
  | "payout.approve"
  | "payout.hold"
  | "refund.approve"
  | "refund.reject"
  | "shipment.update-status"
  | "incident.register"
  | "document.validate"
  | "document.request-update"
  | "review.approve"
  | "review.hide";

export type AdmActionRequest =
  | {
      type: "product.approve" | "product.reject" | "product.request-adjustment";
      entityId: string;
      payload?: {
        note?: string;
        reason?: string;
      };
    }
  | {
      type: "seller.activate" | "seller.deactivate" | "seller.block";
      entityId: string;
    }
  | {
      type: "payout.approve" | "payout.hold";
      entityId: string;
    }
  | {
      type: "refund.approve" | "refund.reject";
      entityId: string;
    }
  | {
      type: "shipment.update-status";
      entityId: string;
      payload: {
        status: AdminVisualStatus;
      };
    }
  | {
      type: "incident.register";
      entityId: string;
      payload?: {
        priority?: PriorityLevel;
        type?: string;
        summary?: string;
      };
    }
  | {
      type: "document.validate";
      entityId: string;
    }
  | {
      type: "document.request-update";
      entityId: string;
      payload?: {
        status?: Extract<AdminVisualStatus, "pendente" | "em-revisao" | "alerta" | "reprovado">;
      };
    }
  | {
      type: "review.approve";
      entityId: string;
    }
  | {
      type: "review.hide";
      entityId: string;
      payload?: {
        status?: Extract<AdminVisualStatus, "alerta" | "bloqueado" | "reprovado">;
      };
    };

export type AdmActionEntityType =
  | "product"
  | "seller"
  | "payout"
  | "refund"
  | "shipment"
  | "incident"
  | "document"
  | "review";

export type AdmActionResult = {
  success: true;
  actionType: AdmActionType;
  entityId: string;
  entityType: AdmActionEntityType;
  message: string;
  updatedStatus?: AdminVisualStatus;
  revalidatedPaths: string[];
};

export type AdmActionFailure = {
  success: false;
  code: string;
  message: string;
};
