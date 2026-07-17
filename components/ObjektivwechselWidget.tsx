"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ResultScreen from "@/components/ResultScreen";
import Stage from "@/components/Stage";
import {
  TOTAL_BEATS,
  beats,
  type HotspotId,
  type SceneState,
} from "@/data/beats";
import {
  choose,
  currentBeat,
  elapsedSeconds,
  grip,
  initialState,
  isSolved,
  liveHotspots,
  type GameState,
  type Reaction,
} from "@/lib/engine";
import { loadBest, saveBest, type BestResult } from "@/lib/storage";

/** Wie lange die Szene eine Fehlhandlung zeigt, bevor sie zurückgenommen wird. */
const CONSEQUENCE_MS = 2200;

export default function ObjektivwechselWidget() {
  const [state, setState] = useState<GameState>(initialState);
  const [reaction, setReaction] = useState<Reaction>({ type: "idle" });
  const [preview, setPreview] = useState<SceneState | null>(null);
  const [consequence, setConsequence] = useState<SceneState | null>(null);
  const [best, setBest] = useState<BestResult | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // localStorage gibt es erst im Client – deshalb nach der Hydration laden.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBest(loadBest());
  }, []);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const beat = currentBeat(state);
  const solved = isSolved(state);
  const live = liveHotspots(state);

  const restart = useCallback(() => {
    setState(initialState());
    setReaction({ type: "idle" });
    setPreview(null);
    setConsequence(null);
  }, []);

  function finish(round: GameState) {
    setBest(
      saveBest({
        errors: round.slips.length,
        seconds: elapsedSeconds(round),
        at: new Date().toISOString(),
      }),
    );
  }

  function react(next: GameState, r: Reaction) {
    setState(next);
    setReaction(r);
    setPreview(null);

    if (r.type === "trap") {
      // Ehrliche Konsequenz kurz zeigen, dann Handlung zurücknehmen.
      setConsequence(r.consequence);
      later(() => setConsequence(null), CONSEQUENCE_MS);
      return;
    }
    setConsequence(null);
    if (r.type === "ok" && isSolved(next)) finish(next);
  }

  function onGrip(hotspot: HotspotId) {
    if (solved || consequence) return;
    const [next, r] = grip(state, hotspot);
    if (r.type !== "idle") react(next, r);
  }

  function onChoose(i: number) {
    if (solved || consequence) return;
    const [next, r] = choose(state, i);
    if (r.type !== "idle") react(next, r);
  }

  const shownScene = consequence ?? preview ?? state.scene;
  const shownFocus = beat?.focus ?? { x: 430, y: 220, scale: 1.05 };

  return (
    <main className="mx-auto grid max-w-[960px] gap-4 p-3 sm:p-5">
      {/* Kopf – schlank, die App steht für sich */}
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Objektivwechsel{" "}
          <span className="font-normal text-text-muted">· Sony FX30</span>
        </h1>
        <p className="font-serif text-sm italic text-text-muted">
          „Der Sensor ist das Herz der Kamera. Wenn du ihn anfasst, hat er ein
          Problem – und du gleich mit.“ – Peter Z.
        </p>
      </header>

      {/* Fortschritt als Phasenleiste */}
      <div className="flex items-center gap-3">
        <ol className="flex flex-1 gap-1.5" aria-label="Fortschritt">
          {beats.map((b, i) => (
            <li
              key={b.id}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
              aria-current={i === state.beatIndex ? "step" : undefined}
            >
              <div
                className={[
                  "h-full rounded-full transition-colors",
                  i < state.beatIndex
                    ? "bg-accent"
                    : i === state.beatIndex
                      ? "bg-accent/40"
                      : "bg-transparent",
                ].join(" ")}
              />
            </li>
          ))}
        </ol>
        <p className="shrink-0 font-mono text-xs text-text-muted">
          {Math.min(state.beatIndex + 1, TOTAL_BEATS)}/{TOTAL_BEATS}
        </p>
      </div>

      {solved ? (
        <ResultScreen
          slips={state.slips}
          seconds={elapsedSeconds(state)}
          best={best}
          onAgain={restart}
        />
      ) : (
        <>
          {/* Situation */}
          <div>
            <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent">
              {beat?.title}
            </p>
            <p className="max-w-[62ch] text-[1.05rem] leading-snug text-text">
              {beat?.prompt}
            </p>
          </div>

          {/* Bühne */}
          <div className="overflow-hidden rounded-2xl border border-line bg-cream-warm shadow-[var(--shadow-soft)]">
            <Stage
              scene={shownScene}
              focus={shownFocus}
              live={consequence ? [] : live}
              onGrip={onGrip}
            />
          </div>

          {/* Handlungsebene */}
          {beat?.kind === "choice" ? (
            <div>
              <p className="mb-2 font-semibold">{beat.question}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {beat.options.map((o, i) => (
                  <button
                    key={o.label}
                    type="button"
                    disabled={consequence != null}
                    onClick={() => onChoose(i)}
                    onMouseEnter={() => setPreview(o.preview(state.scene))}
                    onFocus={() => setPreview(o.preview(state.scene))}
                    onMouseLeave={() => setPreview(null)}
                    onBlur={() => setPreview(null)}
                    className="min-h-[52px] rounded-xl border border-line bg-white px-4 py-3 text-left text-[0.95rem] font-medium transition-colors hover:border-accent hover:bg-cream-warm disabled:opacity-60"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              Anfassbare Stellen sind hervorgehoben.{" "}
              {beat && beat.kind === "grip" && beat.targets.length > 1 && !beat.ordered
                ? "Mehrere Griffe sind dran – die Reihenfolge ist dir überlassen."
                : "Nicht jede davon ist eine gute Idee."}
            </p>
          )}

          {/* Rückmeldung */}
          <div aria-live="polite" className="min-h-[56px]">
            {reaction.type !== "idle" && (
              <p
                className={[
                  "rounded-xl border px-4 py-3 text-[0.95rem]",
                  reaction.type === "trap"
                    ? "border-danger bg-danger-bg font-semibold text-danger"
                    : reaction.type === "correction"
                      ? "border-accent bg-cream-warm text-text"
                      : "border-line bg-white text-text-muted",
                ].join(" ")}
              >
                {reaction.type === "trap"
                  ? `${reaction.text} Die Handlung wird zurückgenommen – weiter geht's korrekt.`
                  : reaction.text}
              </p>
            )}
          </div>
        </>
      )}
    </main>
  );
}
