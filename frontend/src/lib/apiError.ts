export function getApiError(
  err: unknown,
  fallback = "Une erreur est survenue.",
): string {
  return (
    (err as { response?: { data?: { error?: string } } })?.response?.data
      ?.error ?? fallback
  );
}

export function getApiStatus(err: unknown): number | null {
  return (err as { response?: { status?: number } })?.response?.status ?? null;
}
