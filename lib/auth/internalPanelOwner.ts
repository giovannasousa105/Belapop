const INTERNAL_PANEL_OWNER_EMAILS = new Set<string>();

export function isInternalPanelOwner(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return false;
  return INTERNAL_PANEL_OWNER_EMAILS.has(normalized);
}
