export function getApiErrorMessage(
  err: unknown,
  fallback = "Une erreur est survenue.",
): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

export function getApiStatus(err: unknown): number | null {
  return (err as { response?: { status?: number } })?.response?.status ?? null;
}
