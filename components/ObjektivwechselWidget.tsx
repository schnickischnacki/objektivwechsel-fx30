"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Hand,
  History,
  Info,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import ResultScreen from "@/components/ResultScreen";
import Stage from "@/components/Stage";
import {
  TOTAL_BEATS,
  beats,
  intro,
  phaseTitle,
  spareRevealed,
  type Beat,
  type HotspotId,
  type Phase,
  type SceneState,
} from "@/data/beats";
import {
  choose,
  currentBeat,
  elapsedSeconds,
  fehler,
  grip,
  initialState,
  isSolved,
  liveHotspots,
  umwege,
  type GameState,
  type Reaction,
} from "@/lib/engine";
import { loadBest, saveBest, type BestResult } from "@/lib/storage";

/** Wie lange die Szene eine Fehlhandlung zeigt, bevor sie zurückgenommen wird. */
const CONSEQUENCE_MS = 2200;

const PHASES: Phase[] = ["vorbereiten", "wechseln", "abschliessen"];

export default function ObjektivwechselWidget() {
  const [state, setState] = useState<GameState>(initialState);
  const [reaction, setReaction] = useState<Reaction>({ type: "idle" });
  const [preview, setPreview] = useState<SceneState | null>(null);
  const [consequence, setConsequence] = useState<SceneState | null>(null);
  const [best, setBest] = useState<BestResult | null>(null);
  const [started, setStarted] = useState(false);
  /** Index eines abgeschlossenen Schritts, der gerade noch einmal angesehen wird. */
  const [rueckblick, setRueckblick] = useState<number | null>(null);
  /** Die Rückmeldung im Bild blendet sich nach ein paar Sekunden aus; in der Karte bleibt sie stehen. */
  const [bildHinweis, setBildHinweis] = useState(0);
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
  const imGange = state.startedAt != null && !solved;

  const restart = useCallback(() => {
    setState(initialState());
    setReaction({ type: "idle" });
    setPreview(null);
    setConsequence(null);
    setRueckblick(null);
    window.scrollTo({ top: 0 });
  }, []);

  function finish(round: GameState) {
    setBest(
      saveBest({
        errors: fehler(round.slips).length,
        detours: umwege(round.slips).length,
        seconds: elapsedSeconds(round),
        at: new Date().toISOString(),
      }),
    );
  }

  function react(next: GameState, r: Reaction) {
    setState(next);
    setReaction(r);
    setPreview(null);
    const nr = Date.now();
    setBildHinweis(nr);
    later(() => setBildHinweis((aktuell) => (aktuell === nr ? 0 : aktuell)), 4500);

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
    if (solved || consequence || rueckblick != null) return;
    const [next, r] = grip(state, hotspot);
    if (r.type !== "idle") react(next, r);
  }

  function onChoose(i: number) {
    if (solved || consequence || rueckblick != null) return;
    const [next, r] = choose(state, i);
    if (r.type !== "idle") react(next, r);
  }

  // ------------------------------------------------------------------ Einführung
  if (!started) {
    return (
      <Einfuehrung
        imGange={imGange}
        schritt={state.beatIndex + 1}
        best={best}
        onStart={() => {
          setStarted(true);
          window.scrollTo({ top: 0 });
        }}
        onNeu={() => {
          restart();
          setStarted(true);
        }}
      />
    );
  }

  const blick = rueckblick != null ? state.verlauf.find((v) => v.beatIndex === rueckblick) : undefined;
  const shownScene = blick ? blick.scene : (consequence ?? preview ?? state.scene);
  const shownFocus = beat?.focus ?? { x: 422, y: 228, scale: 1.0 };
  const fehlerBisher = fehler(state.slips).length;
  const umwegeBisher = umwege(state.slips).length;

  return (
    <div className="mx-auto max-w-[1200px] px-3 pb-10 sm:px-4">
      <Kopf onIntro={() => setStarted(false)} />

      <Schrittleiste
        state={state}
        rueckblick={rueckblick}
        onRueckblick={(i) => setRueckblick(i === rueckblick ? null : i)}
      />

      {solved ? (
        <ResultScreen
          slips={state.slips}
          seconds={elapsedSeconds(state)}
          best={best}
          onAgain={restart}
        />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,1fr)]">
          {/* Bild – bleibt beim Scrollen oben stehen */}
          <div className="sticky top-0 z-10 -mx-3 bg-cream px-3 pt-2 pb-1 sm:-mx-4 sm:px-4 lg:top-3 lg:mx-0 lg:px-0 lg:pt-0">
            <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]">
              <Stage
                scene={shownScene}
                focus={shownFocus}
                live={consequence || blick ? [] : live}
                spareVisible={spareRevealed(blick ? blick.scene : state.scene)}
                onGrip={onGrip}
              />

              {/* Rückblick oben, Hinweis auf eine Frage unten im Bild */}
              {blick && (
                <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 bg-ink/85 px-3 py-2 text-[0.85rem] text-white">
                  <span className="flex items-center gap-2 font-semibold">
                    <History size={16} aria-hidden /> Rückblick · Schritt {blick.beatIndex + 1}:{" "}
                    {beats[blick.beatIndex].title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRueckblick(null)}
                    className="rounded-full bg-white px-3 py-1 text-[0.8rem] font-bold text-ink"
                  >
                    Zurück zu Schritt {state.beatIndex + 1}
                  </button>
                </div>
              )}
              {!blick && beat?.kind === "choice" && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-ink/85 px-3 py-1.5 text-[0.8rem] font-semibold text-white">
                    <CircleHelp size={15} aria-hidden />
                    <span className="lg:hidden">Frage – Antwort unten wählen</span>
                    <span className="hidden lg:inline">Frage – Antwort rechts neben dem Bild wählen</span>
                  </span>
                </div>
              )}

              {/* Fehler: rotes Ausrufezeichen mitten in der Arbeitsfläche */}
              {consequence != null && beat?.kind === "grip" && !blick && (
                <motion.div
                  aria-hidden
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 18 }}
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger font-serif text-4xl font-bold text-white shadow-[0_4px_18px_rgba(163,46,34,0.45)]">
                    !
                  </div>
                </motion.div>
              )}

              {/* Rückmeldung im Bild – dort, wo der Blick im Moment des Griffs ist */}
              <AnimatePresence>
                {!blick && reaction.type !== "idle" && bildHinweis !== 0 && (
                  <motion.div
                    key={bildHinweis}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pointer-events-none absolute inset-x-1.5 top-1.5 flex justify-center sm:inset-x-2 sm:top-2"
                  >
                    <Rueckmeldung reaction={reaction} kompakt />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Aufgabenkarte */}
          {blick ? (
            <RueckblickKarte
              beatIndex={blick.beatIndex}
              notizen={blick.notizen}
              onZurueck={() => setRueckblick(null)}
              aktuell={state.beatIndex + 1}
            />
          ) : (
            beat && (
              <Aufgabenkarte
                key={beat.id}
                beat={beat}
                beatIndex={state.beatIndex}
                notizen={state.notizen}
                reaction={reaction}
                gesperrt={consequence != null}
                onChoose={onChoose}
                onPreview={(o) => setPreview(o == null || beat.kind !== "choice" ? null : beat.options[o].preview(state.scene))}
                fehlerBisher={fehlerBisher}
                umwegeBisher={umwegeBisher}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== Kopf */

function Kopf({ onIntro }: { onIntro: () => void }) {
  return (
    <header className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          aria-hidden
          className="h-7 w-7 shrink-0 rounded-lg"
          style={{ background: "repeating-linear-gradient(135deg,#c1651f 0 7px,#1e2530 7px 12px)" }}
        />
        <div className="min-w-0 leading-tight">
          <p className="font-bold tracking-tight">Objektivwechsel üben</p>
          <p className="truncate text-[0.75rem] text-text-muted">Übung zum Kurs Kameraschein · Modul 2 Drehfertig machen</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onIntro}
        className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[0.85rem] font-semibold hover:border-[#cfc8bc]"
      >
        <Info size={17} aria-hidden /> Einführung
      </button>
    </header>
  );
}

/* ========================================================= Schrittleiste */

function Schrittleiste({
  state,
  rueckblick,
  onRueckblick,
}: {
  state: GameState;
  rueckblick: number | null;
  onRueckblick: (i: number) => void;
}) {
  return (
    <>
    <nav aria-label="Ablauf in neun Schritten" className="mb-3 flex items-center justify-between rounded-2xl border border-line bg-white p-1.5 sm:hidden">
      {beats.map((b, i) => {
        const done = i < state.beatIndex;
        const current = i === state.beatIndex;
        const trenner = i > 0 && beats[i - 1].phase !== b.phase;
        return (
          <span key={b.id} className="flex items-center">
            {trenner && <span aria-hidden className="mx-0.5 h-6 w-px bg-line" />}
            <button
              type="button"
              disabled={!done}
              onClick={() => onRueckblick(i)}
              aria-current={current ? "step" : undefined}
              aria-label={`Schritt ${i + 1}: ${b.title}${done ? " – erledigt, noch einmal ansehen" : current ? " – jetzt dran" : ""}`}
              className={[
                "relative grid h-11 w-[34px] place-items-center rounded-lg text-[0.8rem] font-bold",
                current ? "bg-ink text-white" : rueckblick === i ? "bg-cream-warm text-ink" : done ? "bg-ok-bg text-ok" : "text-text-muted",
              ].join(" ")}
            >
              {done ? <Check size={15} strokeWidth={3} aria-hidden /> : i + 1}
              {b.kind === "choice" && (
                <span aria-hidden className="absolute right-0.5 top-0.5 text-[0.6rem] leading-none">?</span>
              )}
            </button>
          </span>
        );
      })}
    </nav>
    <nav aria-label="Ablauf in neun Schritten" className="mb-3 hidden gap-2 sm:grid sm:grid-cols-[3fr_5fr_minmax(8.5rem,1.25fr)]">
      {PHASES.map((phase) => (
        <div key={phase} className="rounded-2xl border border-line bg-white p-2">
          <p className="px-1.5 pb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-text-muted">
            {phaseTitle[phase]}
          </p>
          <ol className="flex flex-wrap gap-1.5">
            {beats.map((b, i) => {
              if (b.phase !== phase) return null;
              const done = i < state.beatIndex;
              const current = i === state.beatIndex;
              const viewing = rueckblick === i;
              return (
                <li key={b.id} className="min-w-0 flex-1">
                  <button
                    type="button"
                    disabled={!done}
                    onClick={() => onRueckblick(i)}
                    aria-current={current ? "step" : undefined}
                    aria-label={`Schritt ${i + 1}: ${b.title}${done ? " – erledigt, noch einmal ansehen" : current ? " – jetzt dran" : ""}`}
                    title={done ? "Noch einmal ansehen" : undefined}
                    className={[
                      "flex min-h-[44px] w-full items-center gap-1.5 rounded-xl border px-1.5 text-left text-[0.76rem] font-semibold leading-tight transition-colors",
                      current
                        ? "border-ink bg-ink text-white"
                        : viewing
                          ? "border-accent bg-cream-warm text-ink"
                          : done
                            ? "border-ok-line bg-ok-bg text-ok hover:border-ok"
                            : "border-transparent bg-cream text-text-muted",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "relative grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.72rem] font-bold",
                        current ? "bg-accent text-white" : done ? "bg-ok text-white" : "bg-white text-text-muted",
                      ].join(" ")}
                    >
                      {done ? <Check size={13} strokeWidth={3} aria-hidden /> : i + 1}
                      {b.kind === "choice" && (
                        <span
                          aria-label="Frage"
                          className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-ink text-[0.55rem] font-bold leading-none text-white ring-2 ring-white"
                        >
                          ?
                        </span>
                      )}
                    </span>
                    <span className="hidden min-w-0 md:inline">{b.short}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </nav>
    </>
  );
}

/* ========================================================= Aufgabenkarte */

function Aufgabenkarte({
  beat,
  beatIndex,
  notizen,
  reaction,
  gesperrt,
  onChoose,
  onPreview,
  fehlerBisher,
  umwegeBisher,
}: {
  beat: Beat;
  beatIndex: number;
  notizen: string[];
  reaction: Reaction;
  gesperrt: boolean;
  onChoose: (i: number) => void;
  onPreview: (i: number | null) => void;
  fehlerBisher: number;
  umwegeBisher: number;
}) {
  const frage = beat.kind === "choice";
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-card)] sm:p-5"
      aria-labelledby="aufgabe-titel"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.13em] text-accent">
          Schritt {beatIndex + 1} von {TOTAL_BEATS} · {phaseTitle[beat.phase]}
        </span>
        <span
          className={[
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.75rem] font-bold",
            frage ? "bg-ink text-white" : "bg-cream-warm text-accent",
          ].join(" ")}
        >
          {frage ? <CircleHelp size={14} aria-hidden /> : <Hand size={14} aria-hidden />}
          {frage ? "Frage beantworten" : "Im Bild handeln"}
        </span>
      </div>
      <h2 id="aufgabe-titel" className="mb-1.5 text-[1.25rem] font-semibold leading-tight">
        {beat.title}
      </h2>
      <p className="mb-4 text-[1rem] leading-relaxed text-text">{beat.prompt}</p>

      {beat.kind === "choice" ? (
        <div className="rounded-xl border-2 border-accent bg-cream-warm p-3.5">
          <p className="mb-2.5 text-[1.05rem] font-semibold">{beat.question}</p>
          <div className="grid gap-2">
            {beat.options.map((o, i) => (
              <button
                key={o.label}
                type="button"
                disabled={gesperrt}
                onClick={() => onChoose(i)}
                onMouseEnter={() => onPreview(i)}
                onFocus={() => onPreview(i)}
                onMouseLeave={() => onPreview(null)}
                onBlur={() => onPreview(null)}
                className="flex min-h-[52px] items-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5 text-left text-[1rem] font-medium transition-colors hover:border-accent hover:bg-cream disabled:opacity-60"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-[0.8rem] font-bold text-text-muted">
                  {String.fromCharCode(65 + i)}
                </span>
                {o.label}
              </button>
            ))}
          </div>
          {beat.id === "haltung" && (
            <p className="mt-2 hidden text-[0.8rem] text-text-muted [@media(hover:hover)]:block">
              Zeig mit der Maus auf eine Antwort – das Bild zeigt die Haltung.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-cream p-3.5 text-[0.93rem]">
          <p className="flex gap-2">
            <Hand size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <span>
              <b>Tippe im Bild an, was du jetzt tust.</b> Markiert ist alles, was du anfassen kannst –
              nicht nur das Richtige.
              {beat.kind === "grip" && beat.targets.length > 1 &&
                (beat.ordered ? " Die Griffe folgen aufeinander." : " Mehrere Griffe, die Reihenfolge ist egal.")}
            </span>
          </p>
          {notizen.length > 0 && (
            <ul className="mt-3 grid gap-1.5 border-t border-line pt-3">
              {notizen.map((n) => (
                <li key={n} className="flex gap-2 text-[0.88rem] text-ok">
                  <Check size={16} className="mt-0.5 shrink-0" aria-hidden />
                  {n}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Rückmeldung – vollständig und für Screenreader */}
      <div aria-live="polite" className="mt-3 min-h-[3rem]">
        {reaction.type !== "idle" && <Rueckmeldung reaction={reaction} />}
      </div>

      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[0.8rem] text-text-muted">
        <span>
          <b className={fehlerBisher ? "text-danger" : "text-text"}>{fehlerBisher}</b> Fehler bisher
        </span>
        <span>
          <b className="text-text">{umwegeBisher}</b> {umwegeBisher === 1 ? "Umweg" : "Umwege"} (zählen nicht)
        </span>
      </p>
    </motion.section>
  );
}

/** Eine Rückmeldung in drei Tönen: richtig, Umweg, Fehler. */
function Rueckmeldung({ reaction, kompakt = false }: { reaction: Reaction; kompakt?: boolean }) {
  if (reaction.type === "idle") return null;
  const art = reaction.type === "trap" ? "fehler" : reaction.type === "correction" ? "umweg" : "ok";
  const stil =
    art === "fehler"
      ? "border-danger bg-danger-bg text-danger"
      : art === "umweg"
        ? "border-warn-line bg-warn-bg text-warn"
        : "border-ok-line bg-ok-bg text-ok";
  const Icon = art === "fehler" ? TriangleAlert : art === "umweg" ? Undo2 : Check;
  const etikett = art === "fehler" ? "Fehler" : art === "umweg" ? "Umweg" : "Richtig";
  const zusatz = art === "fehler" ? " Die Handlung wird zurückgenommen – weiter geht’s korrekt." : "";
  const text = art === "ok" ? reaction.text.replace(/^Richtig\.\s*/, "") : reaction.text;
  return (
    <div
      className={[
        "flex items-start gap-2 rounded-xl border shadow-sm",
        stil,
        kompakt ? "max-w-[46rem] px-2.5 py-1.5 text-[0.72rem] leading-snug sm:px-3 sm:py-2 sm:text-[0.9rem]" : "px-3.5 py-2.5 text-[0.93rem]",
      ].join(" ")}
    >
      <Icon size={kompakt ? 16 : 18} className="mt-0.5 shrink-0" aria-hidden />
      <p className={kompakt ? "line-clamp-1 sm:line-clamp-2" : ""}>
        <b>{etikett}:</b> {text}
        {zusatz}
      </p>
    </div>
  );
}

/* ============================================================ Rückblick */

function RueckblickKarte({
  beatIndex,
  notizen,
  onZurueck,
  aktuell,
}: {
  beatIndex: number;
  notizen: string[];
  onZurueck: () => void;
  aktuell: number;
}) {
  const b = beats[beatIndex];
  return (
    <section className="rounded-2xl border-2 border-accent bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
      <p className="mb-1 flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[0.13em] text-accent">
        <History size={14} aria-hidden /> Rückblick · Schritt {beatIndex + 1} von {TOTAL_BEATS}
      </p>
      <h2 className="mb-1.5 text-[1.2rem] font-semibold">{b.title}</h2>
      <p className="mb-3 text-[0.95rem] text-text-muted">{b.prompt}</p>
      <p className="mb-1.5 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-text-muted">Was du gemacht hast</p>
      <ul className="mb-3 grid gap-1.5">
        {notizen.map((n) => (
          <li key={n} className="flex gap-2 text-[0.92rem] text-ok">
            <Check size={16} className="mt-0.5 shrink-0" aria-hidden />
            {n}
          </li>
        ))}
      </ul>
      <p className="mb-4 text-[0.85rem] text-text-muted">Im Kurs nachlesen: {b.nachlesen}.</p>
      <button
        type="button"
        onClick={onZurueck}
        className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-accent px-5 font-bold text-white hover:opacity-90"
      >
        <ArrowLeft size={18} aria-hidden /> Weiter mit Schritt {aktuell}
      </button>
    </section>
  );
}

/* ============================================================ Einführung */

function Einfuehrung({
  imGange,
  schritt,
  best,
  onStart,
  onNeu,
}: {
  imGange: boolean;
  schritt: number;
  best: BestResult | null;
  onStart: () => void;
  onNeu: () => void;
}) {
  const icons = { hand: Hand, frage: CircleHelp, umweg: Undo2 } as const;
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[760px] items-center justify-center p-3 sm:p-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]"
      >
        <div aria-hidden className="h-2" style={{ background: "repeating-linear-gradient(135deg,#c1651f 0 18px,#1e2530 18px 30px)" }} />
        <div className="p-5 sm:p-7">
          <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-accent">{intro.kicker}</p>
          <h1 className="mb-3 text-[1.45rem] font-semibold leading-tight tracking-tight sm:text-[1.6rem]">{intro.title}</h1>
          <p className="mb-3 leading-relaxed">{intro.lead}</p>
          <p className="mb-4 leading-relaxed text-text-muted">{intro.body}</p>

          <ul className="mb-5 grid gap-2.5">
            {intro.how.map((h) => {
              const Icon = icons[h.icon as keyof typeof icons];
              return (
                <li key={h.text} className="flex items-start gap-3 text-[0.93rem]">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream-warm text-accent">
                    <Icon size={18} aria-hidden />
                  </span>
                  <span className="pt-1">{h.text}</span>
                </li>
              );
            })}
          </ul>

          <p className="mb-5 border-l-2 border-line pl-3 font-serif text-[0.92rem] italic text-text-muted">
            „Der Sensor ist das Herz der Kamera. Wenn du ihn anfasst, hat er ein Problem – und du gleich mit.“ – unbekannt, HS Ansbach
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-base font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
            >
              {imGange ? `Weiter mit Schritt ${schritt}` : intro.cta}
              <ArrowRight size={19} aria-hidden />
            </button>
            {imGange && (
              <button
                type="button"
                onClick={onNeu}
                className="min-h-[52px] w-full rounded-full border border-line bg-white px-5 font-semibold sm:w-auto"
              >
                Von vorn beginnen
              </button>
            )}
            {best && (
              <p className="text-[0.8rem] text-text-muted">
                Bester Lauf auf diesem Gerät: {best.errors} Fehler · {best.detours} {best.detours === 1 ? "Umweg" : "Umwege"}
                {best.seconds != null ? ` · ${best.seconds} s` : ""}
              </p>
            )}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
