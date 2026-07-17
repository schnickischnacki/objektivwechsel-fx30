/**
 * Fachliche Quelle: alte Moodle-Kursseite
 * `Old Moodle Kurs/6_Kamera vorbereiten/Objektiv wechseln.html` (FX30).
 *
 * Die 13 Schritte der Quelle sind zu Situationen gebündelt, dazwischen drei
 * eingewobene Mikro-Checks (choice), die das „Warum" abrufen (Testing-Effekt).
 * Zwischen den Situationen ist die Reihenfolge streng – jeder Übergang hat eine
 * Sicherheitslogik, die in der Quelle begründet ist. Innerhalb einer Situation
 * ist die Reihenfolge frei, sofern sie nicht physisch zwingend ist (`ordered`).
 *
 * Mapping Quelle → Situation:
 *   1        → vorbereiten
 *   2        → sichern
 *   3, 4     → freimachen   (frei)
 *   5        → haltung      (Mikro-Check: Warum nach unten?)
 *   —        → statuscheck  (Mikro-Check: Kamera-Status vor dem Öffnen)
 *   6, 7     → abnehmen     (zwingend geordnet)
 *   8        → offen
 *   —        → ausrichten   (Mikro-Check: Woran ausrichten?)
 *   9, 10    → einsetzen    (zwingend geordnet)
 *   11,12,13 → aufraeumen   (frei)
 *
 * Fehlhandlungen (F1–F3) leben in der Szene bzw. in den Mikro-Checks. Sie führen
 * zu einer ehrlichen Konsequenz-Rückmeldung und werden dann zurückgenommen –
 * kein harter Neustart. Alles andere ist eine Korrektur ohne Zähler.
 */

export type SceneState = {
  power: "on" | "off";
  tilt: "up" | "level" | "down";
  hood: "mounted" | "tray" | "new";
  frontCapOld: "off" | "on";
  rearCapSpare: "spare" | "tray" | "old";
  frontCapSpare: "spare" | "off";
  release: boolean;
  oldLens: "mounted" | "loose" | "safe";
  spareLens: "safe" | "aligned" | "locked";
};

export const initialScene: SceneState = {
  power: "on",
  tilt: "level",
  hood: "mounted",
  frontCapOld: "off",
  rearCapSpare: "spare",
  frontCapSpare: "spare",
  release: false,
  oldLens: "mounted",
  spareLens: "safe",
};

/** Anklickbare Elemente in der Szene. */
export type HotspotId =
  | "power"
  | "release"
  | "rotate-ccw"
  | "rotate-cw"
  | "hood"
  | "front-cap-old"
  | "rear-cap-spare"
  | "front-cap-spare"
  | "old-lens"
  | "spare-lens"
  | "sensor";

export type Target = {
  hotspot: HotspotId;
  /** aria-label und Kurzform */
  label: string;
  /** Warum – erscheint nach dem Griff */
  why: string;
  apply: (s: SceneState) => SceneState;
};

export type Correction = {
  hotspot: HotspotId;
  text: string;
};

/** Die drei kanonischen Fehlhandlungen. Nur sie zählen als Ausrutscher. */
export type TrapId = "F1" | "F2" | "F3";

export const trapText: Record<TrapId, string> = {
  F1: "Staub fällt direkt auf den Sensor. Sensor-Reinigung: rund 300 € beim Verleih.",
  F2: "Der Sensor wird nie berührt. Fingerabdrücke sieht man in jeder Aufnahme.",
  F3: "Kamera ist immer aus, bevor der Body geöffnet wird.",
};

export type Option = {
  label: string;
  /** Vorschau-Zustand, solange die Option angetippt/fokussiert ist */
  preview: (s: SceneState) => SceneState;
  verdict: "ok" | "soft" | "trap";
  trap?: TrapId;
  text: string;
};

type Common = {
  id: string;
  title: string;
  /** Die Situation in einem Satz */
  prompt: string;
  /** Bildausschnitt: worauf die Szene zoomt */
  focus: { x: number; y: number; scale: number };
  /** Fehlhandlungen, die in dieser Situation in der Szene anfassbar sind */
  traps?: { hotspot: HotspotId; trap: TrapId }[];
  corrections?: Correction[];
};

export type Beat =
  | (Common & { kind: "grip"; targets: Target[]; ordered?: boolean })
  | (Common & { kind: "choice"; question: string; options: Option[] });

export const beats: Beat[] = [
  {
    kind: "grip",
    id: "vorbereiten",
    title: "Vorbereiten",
    prompt:
      "Das Wechselobjektiv liegt bereit – noch mit beiden Deckeln. Mach es startklar, bevor du die Kamera überhaupt anfasst.",
    focus: { x: 610, y: 168, scale: 2.1 },
    // Quelle 1: „Wechselobjektiv vorbereiten: (nur) hintere Objektivdeckel entfernen
    // und Objektiv auf sicherer Fläche bereitstellen bzw einem Teammitglied in die Hand geben."
    targets: [
      {
        hotspot: "rear-cap-spare",
        label: "Hinteren Deckel abnehmen",
        why: "Der hintere Deckel muss weg, sonst passt das Objektiv nicht ans Bajonett. Jetzt liegt es startklar – der Body bleibt später nur kurz offen.",
        apply: (s) => ({ ...s, rearCapSpare: "tray" }),
      },
    ],
    corrections: [
      {
        hotspot: "front-cap-spare",
        text: "Der vordere Deckel bleibt vorerst drauf – er schützt die Frontlinse, bis das Objektiv sitzt. Ganz zum Schluss kommt er ab.",
      },
    ],
  },
  {
    kind: "grip",
    id: "sichern",
    title: "Kamera sichern",
    prompt: "Die FX30 läuft noch. Bevor irgendetwas am Bajonett passiert:",
    focus: { x: 240, y: 195, scale: 1.9 },
    // Quelle 2: „Kamera ausschalten"
    targets: [
      {
        hotspot: "power",
        label: "Kamera ausschalten",
        why: "Der Body wird nie im laufenden Betrieb geöffnet.",
        apply: (s) => ({ ...s, power: "off" }),
      },
    ],
    traps: [{ hotspot: "release", trap: "F3" }],
  },
  {
    kind: "grip",
    id: "freimachen",
    title: "Objektiv freimachen",
    prompt:
      "Zwei Griffe, bevor du zugreifst – in beliebiger Reihenfolge: Das Objektiv muss anfassbar sein, die Frontlinse geschützt.",
    focus: { x: 400, y: 205, scale: 1.7 },
    // Quelle 3: „Sonnenblende abnehmen (um das Objektiv sicher anfassen zu können)"
    // Quelle 4: „den vorderen Objektivdeckel schließen (um Fingerabdrücken vorzubeugen)"
    targets: [
      {
        hotspot: "hood",
        label: "Sonnenblende abnehmen",
        why: "Ohne Sonnenblende bekommst du das Objektiv sicher zu fassen.",
        apply: (s) => ({ ...s, hood: "tray" }),
      },
      {
        hotspot: "front-cap-old",
        label: "Vorderen Deckel schließen",
        why: "Beugt Fingerabdrücken auf der Frontlinse vor.",
        apply: (s) => ({ ...s, frontCapOld: "on" }),
      },
    ],
  },
  {
    kind: "choice",
    id: "haltung",
    title: "Haltung",
    prompt:
      "Gleich steht der Body offen. Was dann in ihn hineinfällt, bleibt auf dem Sensor.",
    question: "Wie hältst du die Kamera dabei?",
    focus: { x: 300, y: 200, scale: 1.35 },
    // Quelle 5: „Kamera eher nach unten keinesfalls aber nach oben neigen
    // (um zu vermeiden, dass Staub auf den Sensor fällt)"
    options: [
      {
        label: "Nach oben geneigt",
        preview: (s) => ({ ...s, tilt: "up" }),
        verdict: "trap",
        trap: "F1",
        text: trapText.F1,
      },
      {
        label: "Waagrecht",
        preview: (s) => ({ ...s, tilt: "level" }),
        verdict: "soft",
        text: "Besser als nach oben – aber Staub schwebt weiter in die Öffnung. Der Kurs sagt „eher nach unten“, nicht „egal“.",
      },
      {
        label: "Nach unten geneigt",
        preview: (s) => ({ ...s, tilt: "down" }),
        verdict: "ok",
        text: "Richtig. Was jetzt fällt, fällt aus dem Body heraus – nicht hinein.",
      },
    ],
  },
  {
    kind: "choice",
    id: "statuscheck",
    title: "Kurzer Check",
    prompt: "Der Verschluss geht gleich auf. Ein Blick auf die Kamera:",
    question: "Wie steht sie da, bevor der Body geöffnet wird?",
    focus: { x: 260, y: 190, scale: 1.5 },
    // Abruf zu Quelle 2/5 – kein neuer Sachinhalt.
    options: [
      {
        label: "Aus, Öffnung nach unten – so bleibt sie",
        preview: (s) => s,
        verdict: "ok",
        text: "Genau. Ausgeschaltet seit dem zweiten Griff, Öffnung nach unten – jetzt darf der Body auf.",
      },
      {
        label: "Sie könnte ruhig noch laufen – geht schneller",
        preview: (s) => ({ ...s, power: "on" }),
        verdict: "trap",
        trap: "F3",
        text: trapText.F3,
      },
      {
        label: "Egal, solange man zügig arbeitet",
        preview: (s) => s,
        verdict: "soft",
        text: "Zügig ja – aber nicht statt der Sicherung. Kamera aus und Öffnung nach unten sind die Voraussetzung, das Tempo kommt obendrauf.",
      },
    ],
  },
  {
    kind: "grip",
    id: "abnehmen",
    title: "Objektiv abnehmen",
    prompt:
      "Kamera aus, Öffnung nach unten. Jetzt darf das Objektiv runter – zwei Griffe, die aufeinander folgen müssen.",
    focus: { x: 360, y: 215, scale: 1.7 },
    ordered: true,
    // Quelle 6: „Release knopf des Bajonettverschlusses am Kameragehäuse drücken"
    // Quelle 7: „ca 1/8 bis 1/4 Umdrehung nach links (gegen den Uhrzeigersinn) drehen und herausnehmen"
    targets: [
      {
        hotspot: "release",
        label: "Release-Knopf drücken",
        why: "Der Bajonettverschluss ist entriegelt – erst jetzt lässt sich das Objektiv drehen.",
        apply: (s) => ({ ...s, release: true }),
      },
      {
        hotspot: "rotate-ccw",
        label: "Gegen den Uhrzeigersinn drehen",
        why: "1/8 bis 1/4 Umdrehung gegen den Uhrzeigersinn – dann kommt das Objektiv heraus.",
        apply: (s) => ({ ...s, oldLens: "loose", release: false }),
      },
    ],
    corrections: [
      {
        hotspot: "rotate-cw",
        text: "Falsche Richtung. Im Uhrzeigersinn arretiert – gelöst wird gegen den Uhrzeigersinn.",
      },
    ],
  },
  {
    kind: "grip",
    id: "offen",
    title: "Body offen",
    prompt:
      "Der Sensor liegt frei. Das teuerste Bauteil des Sets, ungeschützt – mach die Hände frei fürs Wechselobjektiv.",
    focus: { x: 330, y: 210, scale: 1.6 },
    // Quelle 8: „Auf sicherer Fläche abstellen oder Teammitglied in die Hand geben"
    targets: [
      {
        hotspot: "old-lens",
        label: "Altes Objektiv sicher ablegen",
        why: "Auf sicherer Fläche oder in die Hand eines Teammitglieds. Beide Hände frei fürs Wechselobjektiv.",
        apply: (s) => ({ ...s, oldLens: "safe" }),
      },
    ],
    traps: [{ hotspot: "sensor", trap: "F2" }],
  },
  {
    kind: "choice",
    id: "ausrichten",
    title: "Ausrichten",
    prompt: "Das Wechselobjektiv muss jetzt rasch rein – der Body steht offen.",
    question: "Woran richtest du es aus?",
    focus: { x: 400, y: 190, scale: 1.5 },
    // Abruf zu Quelle 9: „Dabei Übereinstimmung mit Index-Punkt beachten"
    options: [
      {
        label: "Am Index-Punkt – Markierung an Body und Objektiv",
        preview: (s) => s,
        verdict: "ok",
        text: "Richtig. Die Markierungen müssen übereinstimmen – dann greift das Bajonett sofort.",
      },
      {
        label: "Einfach ansetzen und drehen, bis es fasst",
        preview: (s) => s,
        verdict: "soft",
        text: "Ohne Index-Punkt greift das Bajonett nicht – und der Body steht länger offen als nötig.",
      },
      {
        label: "Am roten Aufnahmeknopf",
        preview: (s) => s,
        verdict: "soft",
        text: "Der Aufnahmeknopf hat mit dem Bajonett nichts zu tun. Ausgerichtet wird am Index-Punkt.",
      },
    ],
  },
  {
    kind: "grip",
    id: "einsetzen",
    title: "Wechselobjektiv einsetzen",
    prompt:
      "Zügig jetzt – je kürzer der Body offen steht, desto weniger Staub findet den Weg hinein.",
    focus: { x: 380, y: 210, scale: 1.6 },
    ordered: true,
    // Quelle 9: „Wechselobjektiv rasch einsetzen. Dabei Übereinstimmung mit Index-Punkt beachten"
    // Quelle 10: „ca 1/4 Umdrehung nach rechts (im Uhrzeigersinn) drehen bis
    // Arretierungs- (Release-)knopf hörbar klickt"
    targets: [
      {
        hotspot: "spare-lens",
        label: "Ansetzen, Index-Punkt beachten",
        why: "Die Markierungen an Body und Objektiv stimmen überein – das Bajonett greift.",
        apply: (s) => ({ ...s, spareLens: "aligned" }),
      },
      {
        hotspot: "rotate-cw",
        label: "Im Uhrzeigersinn drehen",
        why: "Eine 1/4 Umdrehung im Uhrzeigersinn, bis der Arretierungsknopf hörbar klickt.",
        apply: (s) => ({ ...s, spareLens: "locked" }),
      },
    ],
    traps: [{ hotspot: "sensor", trap: "F2" }],
    corrections: [
      {
        hotspot: "rotate-ccw",
        text: "Falsche Richtung – so würdest du es wieder lösen. Arretiert wird im Uhrzeigersinn.",
      },
    ],
  },
  {
    kind: "grip",
    id: "aufraeumen",
    title: "Aufräumen",
    prompt:
      "Das Objektiv sitzt, der Body ist zu. Drei Griffe fehlen – in beliebiger Reihenfolge.",
    focus: { x: 430, y: 230, scale: 1.15 },
    // Quelle 11: „Beim Ursprünglichen Objektiv hinteren Deckel zumachen und sicher verwahren"
    // Quelle 12: „beim neu angebrachten Objektiv Sonnenblende befestigen"
    // Quelle 13: „und Objektivdeckel abnehmen"
    targets: [
      {
        hotspot: "rear-cap-spare",
        label: "Altes Objektiv verschließen",
        why: "Hinterer Deckel drauf, Objektiv sicher verwahrt.",
        apply: (s) => ({ ...s, rearCapSpare: "old" }),
      },
      {
        hotspot: "hood",
        label: "Sonnenblende ans neue Objektiv",
        why: "Sonnenblende sitzt.",
        apply: (s) => ({ ...s, hood: "new" }),
      },
      {
        hotspot: "front-cap-spare",
        label: "Vorderen Deckel abnehmen",
        why: "Ohne diesen letzten Griff bleibt das Bild schwarz.",
        apply: (s) => ({ ...s, frontCapSpare: "off" }),
      },
    ],
  },
];

export const TOTAL_BEATS = beats.length;
