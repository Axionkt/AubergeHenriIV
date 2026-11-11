// Resource details formatting
export const noData = "Pas de données";

// String formatting
export function toStringOrNull(v: string): string | null {
  return v.trim() === "" ? null : v;
}

// Number formatting
export function toNumberOrUndefined(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function toNumberOrNull(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(",", ".")); // accepts French-style decimals like "12,5"
  return Number.isFinite(n) ? n : null;
}

const intFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

export function formatInt(n: number | null | undefined) {
  let txt = "";
  if (n != null && Number.isFinite(n)) {
    txt = intFormatter.format(n);
  }
  return txt;
}

// Date formatting
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
