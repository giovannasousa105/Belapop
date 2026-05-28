export const ORDER_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isOrderUuid = (value: string | null | undefined) =>
  Boolean(value && ORDER_UUID_REGEX.test(value.trim()));

export const buildShortOrderCode = (orderId: string | null | undefined) =>
  (orderId ?? "").replace(/-/g, "").slice(0, 8).toUpperCase();

export const normalizeOrderReference = (value: string | null | undefined) =>
  (value ?? "")
    .replace(/^#/, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();

export const matchesOrderReference = ({
  id,
  orderNumber,
  reference
}: {
  id: string | null | undefined;
  orderNumber?: string | null;
  reference: string | null | undefined;
}) => {
  const normalizedReference = normalizeOrderReference(reference);
  if (!normalizedReference || !id) return false;

  const normalizedId = normalizeOrderReference(id);
  const shortCode = buildShortOrderCode(id).toLowerCase();
  const normalizedOrderNumber = normalizeOrderReference(orderNumber);

  return (
    normalizedId === normalizedReference ||
    shortCode === normalizedReference ||
    normalizedOrderNumber === normalizedReference ||
    normalizedOrderNumber.endsWith(normalizedReference)
  );
};
