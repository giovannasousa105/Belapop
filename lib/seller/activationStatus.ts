export type ActivationChecklistItem = {
  key: string;
  label: string;
  completed: boolean;
  ctaLabel?: string;
  ctaHref?: string;
};

export type ActivationIssueLevel = "blocker" | "warning" | "info";

export type ActivationIssue = {
  level: ActivationIssueLevel;
  message: string;
  ctaLabel: string;
  ctaHref: string;
};

export type ActivationStatusResponse = {
  progressPercent: number;
  checklist: ActivationChecklistItem[];
  issues: ActivationIssue[];
};
