import {
  TOTAL_BEATS,
  beats,
  initialScene,
  type Beat,
  type HotspotId,
  type SceneState,
  type TrapId,
  trapText,
} from "@/data/beats";

export type Slip = { trap: TrapId; text: string };

export type GameState = {
  beatIndex: number;
  /** Hotspots der in dieser Situation bereits erledigten Griffe */
  hit: HotspotId[];
  scene: SceneState;
  /** Ausrutscher (F1–F3): ehrliche Konsequenz, dann geht es korrigiert weiter. */
  slips: Slip[];
  startedAt: number | null;
  finishedAt: number | null;
};

export type Reaction =
  | { type: "ok"; text: string; beatDone: boolean }
  | { type: "correction"; text: string }
  /** consequence: Szenenzustand, der die Folge kurz zeigt, bevor zurückgenommen wird */
  | { type: "trap"; trap: TrapId; text: string; consequence: SceneState }
  | { type: "idle" };

export function initialState(): GameState {
  return {
    beatIndex: 0,
    hit: [],
    scene: initialScene,
    slips: [],
    startedAt: null,
    finishedAt: null,
  };
}

export function currentBeat(s: GameState): Beat | undefined {
  return beats[s.beatIndex];
}

export function isSolved(s: GameState): boolean {
  return s.beatIndex >= TOTAL_BEATS;
}

/**
 * Welche Hotspots sind in dieser Situation gerade anfassbar?
 * Bei `ordered` ist immer nur der nächste Griff dran – die anderen wären physisch
 * gar nicht möglich (man dreht nicht, bevor der Release gedrückt ist).
 */
export function activeTargets(s: GameState) {
  const beat = currentBeat(s);
  if (!beat || beat.kind !== "grip") return [];
  const open = beat.targets.filter((t) => !s.hit.includes(t.hotspot));
  return beat.ordered ? open.slice(0, 1) : open;
}

/** Korrekturen, die im aktuellen Szenenzustand überhaupt möglich sind. */
function activeCorrections(s: GameState) {
  const beat = currentBeat(s);
  if (!beat) return [];
  return (beat.corrections ?? []).filter((c) => !c.when || c.when(s.scene));
}

/** Alles, was in dieser Situation auf einen Klick reagiert (Griffe, Fehlhandlungen, Korrekturen). */
export function liveHotspots(s: GameState): HotspotId[] {
  const beat = currentBeat(s);
  if (!beat) return [];
  const ids: HotspotId[] = [
    ...activeTargets(s).map((t) => t.hotspot),
    ...(beat.traps ?? []).map((t) => t.hotspot),
    ...activeCorrections(s).map((c) => c.hotspot),
  ];
  return [...new Set(ids)];
}

/** Wie die Szene eine Fehlhandlung kurz zeigt, bevor sie zurückgenommen wird. */
function consequenceScene(scene: SceneState, trap: TrapId): SceneState {
  switch (trap) {
    case "F1":
      return { ...scene, tilt: "up" };
    case "F3":
      return { ...scene, power: "on" };
    case "F2":
      return scene;
  }
}

export function grip(s: GameState, hotspot: HotspotId): [GameState, Reaction] {
  const beat = currentBeat(s);
  if (!beat || beat.kind !== "grip") return [s, { type: "idle" }];

  const startedAt = s.startedAt ?? Date.now();

  const trap = (beat.traps ?? []).find((t) => t.hotspot === hotspot);
  if (trap) {
    // Konsequenz zeigen, Handlung zurücknehmen – die Szene selbst bleibt unverändert.
    return [
      { ...s, slips: [...s.slips, { trap: trap.trap, text: trapText[trap.trap] }], startedAt },
      {
        type: "trap",
        trap: trap.trap,
        text: trapText[trap.trap],
        consequence: consequenceScene(s.scene, trap.trap),
      },
    ];
  }

  const target = activeTargets(s).find((t) => t.hotspot === hotspot);
  if (target) {
    const hit = [...s.hit, hotspot];
    const beatDone = hit.length === beat.targets.length;
    const next: GameState = {
      ...s,
      hit: beatDone ? [] : hit,
      beatIndex: beatDone ? s.beatIndex + 1 : s.beatIndex,
      scene: target.apply(s.scene),
      startedAt,
      finishedAt:
        beatDone && s.beatIndex + 1 >= TOTAL_BEATS ? Date.now() : s.finishedAt,
    };
    return [next, { type: "ok", text: target.why, beatDone }];
  }

  const correction = activeCorrections(s).find((c) => c.hotspot === hotspot);
  if (correction) {
    return [{ ...s, startedAt }, { type: "correction", text: correction.text }];
  }

  return [s, { type: "idle" }];
}

export function choose(s: GameState, optionIndex: number): [GameState, Reaction] {
  const beat = currentBeat(s);
  if (!beat || beat.kind !== "choice") return [s, { type: "idle" }];

  const option = beat.options[optionIndex];
  if (!option) return [s, { type: "idle" }];

  const startedAt = s.startedAt ?? Date.now();

  if (option.verdict === "trap" && option.trap) {
    return [
      {
        ...s,
        slips: [...s.slips, { trap: option.trap, text: option.text }],
        startedAt,
      },
      {
        type: "trap",
        trap: option.trap,
        text: option.text,
        consequence: option.preview(s.scene),
      },
    ];
  }

  if (option.verdict === "soft") {
    return [{ ...s, startedAt }, { type: "correction", text: option.text }];
  }

  const beatIndex = s.beatIndex + 1;
  return [
    {
      ...s,
      beatIndex,
      hit: [],
      scene: option.preview(s.scene),
      startedAt,
      finishedAt: beatIndex >= TOTAL_BEATS ? Date.now() : s.finishedAt,
    },
    { type: "ok", text: option.text, beatDone: true },
  ];
}

export function elapsedSeconds(s: GameState): number | null {
  if (s.startedAt == null || s.finishedAt == null) return null;
  return Math.round((s.finishedAt - s.startedAt) / 1000);
}
