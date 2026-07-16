"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ActionList from "@/components/ActionList";
import ResultScreen from "@/components/ResultScreen";
import SequenceTrack from "@/components/SequenceTrack";
import SetScene, { type SceneFlags } from "@/components/SetScene";
import { MAX_ERRORS, type Action, type SceneEffect } from "@/data/actions";
import {
  applyVerdict,
  byId,
  elapsedSeconds,
  evaluate,
  initialState,
  isBusted,
  isSolved,
  newRound,
  visibleActions,
  type GameState,
} from "@/lib/engine";
import { loadBest, saveBest, type BestResult } from "@/lib/storage";

type Feedback =
  | { tone: "ok" | "nudge" | "trap" | "bust"; text: string }
  | null;

const NUDGE_MS = 1600;

export default function ObjektivwechselWidget() {
  // Erst-Render deterministisch (Reihenfolge aus data/actions), danach im Client mischen.
  const [state, setState] = useState<GameState>(initialState);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [nudgedId, setNudgedId] = useState<string | null>(null);
  const [trapId, setTrapId] = useState<string | null>(null);
  const [best, setBest] = useState<BestResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Gemischt wird erst nach der Hydration: Server und erster Client-Render müssen
  // dieselbe Reihenfolge liefern, sonst gibt es einen Hydration-Mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(newRound());
    setBest(loadBest());
  }, []);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const flags = useMemo(() => {
    const f = {} as SceneFlags;
    for (const id of state.done) {
      const effect = byId(id)?.sceneEffect;
      if (effect) f[effect as SceneEffect] = true;
    }
    return f;
  }, [state.done]);

  const doneActions = useMemo(
    () => state.done.map((id) => byId(id)).filter((a): a is Action => a != null),
    [state.done],
  );

  const solved = isSolved(state);
  const busted = isBusted(state);
  const list = visibleActions(state);

  const restart = useCallback(() => {
    setState(newRound());
    setFeedback(null);
    setNudgedId(null);
    setTrapId(null);
    setDismissed(false);
  }, []);

  /** Runde gelöst: Bestwert sichern, Moodle-Einbindung optional informieren. */
  function finish(round: GameState) {
    setBest(
      saveBest({
        errors: round.errors,
        seconds: elapsedSeconds(round),
        at: new Date().toISOString(),
      }),
    );
    try {
      window.parent?.postMessage(
        { type: "objektivwechsel:done", errors: round.errors },
        "*",
      );
    } catch {
      // Kein Parent erreichbar – Widget läuft standalone.
    }
  }

  function pick(action: Action) {
    if (solved || busted) return;
    const verdict = evaluate(state, action);
    const next = applyVerdict(state, verdict);
    setState(next);

    if (verdict.type === "ok") {
      setNudgedId(null);
      setTrapId(null);
      setFeedback({ tone: "ok", text: action.feedbackOk ?? "" });
      if (isSolved(next)) finish(next);
      return;
    }

    if (verdict.type === "too-early") {
      setNudgedId(action.id);
      setFeedback({ tone: "nudge", text: "Noch nicht dran." });
      later(() => setNudgedId((cur) => (cur === action.id ? null : cur)), NUDGE_MS);
      return;
    }

    // Falle: sie bleibt in der Liste stehen.
    setTrapId(action.id);

    // Nach 3 Fehlern: Runde zurücksetzen, gleiche Aktionen in neuer Reihenfolge.
    if (isBusted(next)) {
      setFeedback({
        tone: "bust",
        text: "Der Sensor hätte das nicht überlebt – nochmal von vorn.",
      });
      later(() => {
        setState(newRound());
        setNudgedId(null);
        setTrapId(null);
        setFeedback(null);
      }, 2400);
      return;
    }

    setFeedback({ tone: "trap", text: action.feedbackTrap ?? "" });
    later(() => setTrapId((cur) => (cur === action.id ? null : cur)), NUDGE_MS);
  }

  if (dismissed) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-[880px] items-center justify-center p-5">
        <div className="text-center">
          <p className="mb-4 text-[0.95rem] text-text-muted">
            Übung beendet. Du kannst jederzeit zurückkommen.
          </p>
          <button
            type="button"
            onClick={restart}
            className="min-h-[44px] rounded-lg border border-line bg-white px-5 text-base font-semibold hover:bg-cream-warm"
          >
            Nochmal üben
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[880px] gap-5 p-4 sm:p-5">
      {/* Peter-Zitat: einmal, als Situierung */}
      <section className="relative overflow-hidden rounded-[14px] bg-ink p-6 text-cream shadow-[var(--shadow-card)]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1.5"
          style={{
            background:
              "repeating-linear-gradient(135deg,#c1651f 0 18px,#1e2530 18px 30px)",
          }}
        />
        <p className="mt-2 mb-3 font-serif text-[1.2rem] leading-snug text-gold">
          &bdquo;Der Sensor ist das Herz der Kamera. Wenn du ihn anfasst, hat er ein
          Problem &ndash; und du gleich mit.&ldquo;
        </p>
        <p className="flex items-center gap-2.5 text-sm opacity-85">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
          Peter Z., beim Objektivwechsel
        </p>
      </section>

      {/* Set-Szene */}
      <section className="overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--shadow-soft)]">
        <SetScene flags={flags} />
      </section>

      {/* Feedback + Fehlerstand */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Bewusst ohne AnimatePresence: eine aria-live-Region darf beim Wechsel
            nicht kurz leer sein, und ein hängender Exit würde sie blockieren. */}
        <div
          id="feedback-region"
          aria-live="polite"
          className="min-h-[44px] flex-1 basis-64"
        >
          {feedback && (
            <p
              className={[
                "flex min-h-[44px] items-center rounded-lg border px-4 py-2 text-[0.9rem] transition-colors",
                feedback.tone === "trap" || feedback.tone === "bust"
                  ? "border-danger bg-danger-bg font-semibold text-danger"
                  : feedback.tone === "nudge"
                    ? "border-line bg-cream-warm text-text"
                    : "border-line bg-white text-text-muted",
              ].join(" ")}
            >
              {feedback.text}
            </p>
          )}
        </div>

        <p className="text-sm text-text-muted" aria-live="polite">
          Fehlversuche:{" "}
          <span className="font-mono font-bold text-text">
            {state.errors} / {MAX_ERRORS}
          </span>
        </p>
      </div>

      {solved ? (
        <ResultScreen
          errors={state.errors}
          seconds={elapsedSeconds(state)}
          best={best}
          onAgain={restart}
          onDone={() => setDismissed(true)}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <SequenceTrack done={doneActions} />
          <ActionList
            actions={list}
            onPick={pick}
            nudgedId={nudgedId}
            trapId={trapId}
            disabled={busted}
          />
        </div>
      )}
    </main>
  );
}
