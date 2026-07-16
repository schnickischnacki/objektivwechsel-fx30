const KEY = "objektivwechsel-fx30:v1";

export type BestResult = {
  errors: number;
  seconds: number | null;
  at: string; // ISO
};

export function loadBest(): BestResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as BestResult).errors === "number"
    ) {
      return parsed as BestResult;
    }
    return null;
  } catch {
    return null;
  }
}

/** Speichert nur, wenn besser: weniger Fehler, bei Gleichstand schnellere Zeit. */
export function saveBest(result: BestResult): BestResult {
  const current = loadBest();
  const better =
    current == null ||
    result.errors < current.errors ||
    (result.errors === current.errors &&
      result.seconds != null &&
      (current.seconds == null || result.seconds < current.seconds));

  if (!better) return current as BestResult;

  try {
    window.localStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    // localStorage kann im iframe blockiert sein – dann läuft das Widget ohne Persistenz.
  }
  return result;
}
