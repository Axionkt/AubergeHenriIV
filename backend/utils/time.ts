export function toParisNextDayMidnightUTC(dateStr: string): string {
  // 1. Parse input safely (no timezone assumptions)
  const [year, month, day] = dateStr.split("-").map(Number);

  // 2. Build a UTC date for the given calendar day
  // (avoid local timezone entirely)
  const utcMidnight = new Date(Date.UTC(year, month - 1, day));

  // 3. Add 1 day in absolute time (UTC-safe)
  utcMidnight.setUTCDate(utcMidnight.getUTCDate() + 1);

  // 4. Now we need to ensure this corresponds to "00:00 Paris time"
  //    We compute the offset for Europe/Paris at that instant
  const parisFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Extract what "Paris time" thinks this instant is
  const parts = parisFormatter.formatToParts(utcMidnight);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);

  const parisAsUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  // 5. Adjust so that we land exactly at Paris midnight
  const diff = parisAsUTC - utcMidnight.getTime();
  const corrected = new Date(utcMidnight.getTime() - diff);

  return corrected.toISOString();
}
