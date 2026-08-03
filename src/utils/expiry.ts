export type ExpiryUrgency =
  | "expired"
  | "today"
  | "soon"
  | "later";

export function getDaysUntilExpiry(
  expiryDate: string,
  today = new Date(),
): number {
  const expiry = new Date(`${expiryDate}T00:00:00`);
  const currentDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const differenceInMilliseconds =
    expiry.getTime() - currentDate.getTime();

  return Math.ceil(
    differenceInMilliseconds / (1000 * 60 * 60 * 24),
  );
}

export function getExpiryUrgency(
  expiryDate: string,
  today = new Date(),
): ExpiryUrgency {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate, today);

  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry === 0) return "today";
  if (daysUntilExpiry <= 3) return "soon";

  return "later";
}