import { AlertTriangle } from "lucide-react";

import { ClaimStatusBadge } from "@/components/catalog-standards/ClaimStatusBadge";
import type { ClaimValidationResult } from "@/lib/catalog-standards";

type ClaimWarningProps = {
  className?: string;
  result: ClaimValidationResult;
};

export function ClaimWarning({ className = "", result }: ClaimWarningProps) {
  if (result.issues.length === 0) {
    return (
      <div className={`rounded-[8px] border border-emerald-100 bg-emerald-50 p-4 ${className}`}>
        <ClaimStatusBadge status="allowed" />
        <p className="mt-3 text-sm leading-relaxed text-emerald-900">
          Claims dentro da lista controlada BelaPop.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-[8px] border border-amber-100 bg-amber-50 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-800" aria-hidden="true" />
        <div>
          <ClaimStatusBadge status={result.blocked.length > 0 ? "blocked" : "review"} />
          <div className="mt-3 space-y-2">
            {result.issues.map((issue) => (
              <p key={`${issue.code}-${issue.detail}`} className="text-sm leading-relaxed text-amber-950">
                {issue.detail}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
