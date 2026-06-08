/**
 * Data Stewardship Utility
 * Enforces project invariants for data normalization and purity.
 */

/**
 * Normalizes an Order Number to be uppercase, alphanumeric, and max 7 characters.
 */
export const normalizeOrderNumber = (value: string): string => {
  return value.replace(/[^A-Za-z0-9]/g, '').slice(0, 7).toUpperCase();
};

/**
 * Normalizes an identification string (Wire ID, Customer Name, Person Name, etc.) to UPPERCASE.
 */
export const normalizeId = (value: string | undefined | null): string => {
  return (value || '').trim().toUpperCase();
};

/**
 * Normalizes a list of items by applying standard identification normalization.
 * Useful for ensuring entire records are stewarded correctly.
 */
export const stewardRecord = <T extends Record<string, any>>(record: T, fields: (keyof T)[]): T => {
  const updated = { ...record };
  fields.forEach(field => {
    if (typeof updated[field] === 'string') {
      if (field === 'orderNumber') {
        (updated[field] as any) = normalizeOrderNumber(updated[field] as string);
      } else {
        (updated[field] as any) = normalizeId(updated[field] as string);
      }
    }
  });
  return updated;
};
