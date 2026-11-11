/**
 * Builds the SET part of a partial UPDATE. Only keys present in `fieldMap`
 * become columns (never raw request keys), undefined values are skipped,
 * and values come back as $1..$n parameters in the same order.
 */
export function buildSet<T extends Record<string, unknown>>(
  fieldMap: Partial<Record<keyof T, string>>,
  data: Partial<T>,
): { clauses: string[]; values: unknown[] } {
  const clauses: string[] = [];
  const values: unknown[] = [];

  for (const [key, column] of Object.entries(fieldMap)) {
    const value = data[key as keyof T];

    if (value === undefined) continue;

    values.push(value);
    clauses.push(`${column} = $${values.length}`);
  }

  return { clauses, values };
}
