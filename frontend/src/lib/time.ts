export function formatDateTime(date: string | null) {
  if (!date) return "Sans expiration";

  return new Date(date).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(date));
}
