import { type Action, MAX_ERRORS, TOTAL_STEPS, actions } from "@/data/actions";

export type Verdict =
  | { type: "ok"; action: Action }
  | { type: "too-early"; action: Action }
  | { type: "trap"; action: Action };

export type GameState = {
  /** ids der bereits korrekt ausgeführten Schritte, in Klickreihenfolge */
  done: string[];
  errors: number;
  /** Reihenfolge der Aktionen in der Liste (ids), einmal pro Runde gemischt */
  pool: string[];
  startedAt: number | null;
  finishedAt: number | null;
};

export function byId(id: string): Action | undefined {
  return actions.find((a) => a.id === id);
}

/**
 * Fisher-Yates. Nimmt eine rng, damit der erste Render deterministisch sein kann
 * (Hydration) und erst im Client gemischt wird.
 */
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function initialState(): GameState {
  return {
    done: [],
    errors: 0,
    pool: actions.map((a) => a.id),
    startedAt: null,
    finishedAt: null,
  };
}

export function newRound(): GameState {
  return { ...initialState(), pool: shuffle(actions.map((a) => a.id)) };
}

/**
 * Toleranzgruppen: Schritte mit derselben orderGroup dürfen untereinander in
 * beliebiger Reihenfolge kommen (3/4 und 11/12/13). Eine Gruppe muss vollständig
 * abgearbeitet sein, bevor die nächste Gruppe an die Reihe kommt.
 */
export function isNextValid(state: GameState, action: Action): boolean {
  if (action.kind !== "step" || action.orderGroup == null) return false;
  if (state.done.includes(action.id)) return false;

  const openGroups = actions
    .filter((a) => a.kind === "step" && !state.done.includes(a.id))
    .map((a) => a.orderGroup as number);
  const currentGroup = Math.min(...openGroups);

  return action.orderGroup === currentGroup;
}

export function evaluate(state: GameState, action: Action): Verdict {
  if (action.kind === "trap") return { type: "trap", action };
  return isNextValid(state, action)
    ? { type: "ok", action }
    : { type: "too-early", action };
}

export function applyVerdict(state: GameState, verdict: Verdict): GameState {
  const now = Date.now();
  const startedAt = state.startedAt ?? now;

  switch (verdict.type) {
    case "ok": {
      const done = [...state.done, verdict.action.id];
      const finished = done.length === TOTAL_STEPS;
      return {
        ...state,
        done,
        startedAt,
        finishedAt: finished ? now : null,
      };
    }
    case "trap":
      return { ...state, errors: state.errors + 1, startedAt };
    case "too-early":
      return { ...state, startedAt };
  }
}

export function isBusted(state: GameState): boolean {
  return state.errors >= MAX_ERRORS;
}

export function isSolved(state: GameState): boolean {
  return state.done.length === TOTAL_STEPS;
}

/** Aktionen, die aktuell in der Liste stehen: alle bis auf die erledigten Schritte. */
export function visibleActions(state: GameState): Action[] {
  return state.pool
    .map((id) => byId(id))
    .filter((a): a is Action => a != null && !state.done.includes(a.id));
}

export function elapsedSeconds(state: GameState): number | null {
  if (state.startedAt == null || state.finishedAt == null) return null;
  return Math.round((state.finishedAt - state.startedAt) / 1000);
}
