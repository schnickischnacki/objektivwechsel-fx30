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
  /** Nur anfassbar, wenn das physisch überhaupt geht (z. B. drehen erst nach Entriegeln). */
  when?: (s: SceneState) => boolean;
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

/** Startkarte vor der Übung: worum es geht und warum es heikel ist. */
export const intro = {
  kicker: "Bevor es losgeht",
  title: "Objektiv wechseln, ohne den Sensor zu ruinieren",
  lead: "Beim Wechsel steht der Body offen – dahinter liegt der Sensor frei. Ein Staubkorn oder Fingerabdruck darauf sieht man in jeder Aufnahme; die Reinigung kostet beim Verleih rund 300 €.",
  body: "Deshalb hat der Wechsel eine feste Reihenfolge: vorbereiten, sichern, öffnen, zügig tauschen, aufräumen. Genau die sollst du in der Prüfung vorführen können.",
  how: [
    "Tippe die hervorgehobenen Stellen an der Werkbank an.",
    "Nicht jede anfassbare Stelle ist eine gute Idee.",
    "Zwischendurch kommen kurze Fragen – die stehen unter dem Bild.",
  ],
  cta: "Übung starten",
};

export const beats: Beat[] = [
  {
    kind: "grip",
    id: "vorbereiten",
    title: "Vorbereiten",
    prompt:
      "Das Wechselobjektiv liegt bereit – noch mit beiden Deckeln. Mach es startklar, bevor du die Kamera überhaupt anfasst.",
    focus: { x: 422, y: 228, scale: 1.0 }, // Establishing: ganze Werkbank, nicht reingezoomt
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
      {
        hotspot: "front-cap-old",
        text: "Dieser Deckel gehört auf die Kamera, die gerade noch läuft – der kommt gleich dran. Erst ist das Wechselobjektiv an der Reihe.",
      },
    ],
  },
  {
    kind: "grip",
    id: "sichern",
    title: "Kamera sichern",
    prompt: "Die FX30 läuft noch. Bevor irgendetwas am Bajonett passiert:",
    focus: { x: 422, y: 228, scale: 1.0 },
    // Quelle 2: „Kamera ausschalten"
    targets: [
      {
        hotspot: "power",
        label: "Kamera ausschalten",
        why: "Kamera ist aus – der Body wird nie im laufenden Betrieb geöffnet.",
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
      "Zwei Handgriffe, in beliebiger Reihenfolge: Das Objektiv muss sich sicher greifen lassen, die Frontlinse geschützt sein.",
    focus: { x: 422, y: 228, scale: 1.0 },
    // Quelle 3: „Sonnenblende abnehmen (um das Objektiv sicher anfassen zu können)"
    // Quelle 4: „den vorderen Objektivdeckel schließen (um Fingerabdrücken vorzubeugen)"
    targets: [
      {
        hotspot: "hood",
        label: "Sonnenblende abnehmen",
        why: "Sonnenblende ab – so bekommst du das Objektiv sicher zu fassen.",
        apply: (s) => ({ ...s, hood: "tray" }),
      },
      {
        hotspot: "front-cap-old",
        label: "Vorderen Deckel schließen",
        why: "Vorderer Deckel zu – das beugt Fingerabdrücken auf der Frontlinse vor.",
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
    focus: { x: 422, y: 228, scale: 1.0 },
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
    title: "Gegencheck",
    prompt: "Gleich löst du den Verschluss. Zwei Dinge müssen jetzt beide stimmen.",
    question: "Welche beiden sind es?",
    focus: { x: 422, y: 228, scale: 1.0 },
    // Abruf zu Quelle 2/5 – kein neuer Sachinhalt.
    options: [
      {
        label: "Kamera aus und Öffnung nach unten",
        preview: (s) => s,
        verdict: "ok",
        text: "Genau diese beiden: Die Kamera ist aus, und die Öffnung zeigt nach unten. Jetzt darf der Body auf.",
      },
      {
        label: "Nur die Neigung – laufen darf sie",
        preview: (s) => ({ ...s, power: "on" }),
        verdict: "trap",
        trap: "F3",
        text: trapText.F3,
      },
      {
        label: "Nur ausschalten – die Neigung ist egal",
        preview: (s) => ({ ...s, tilt: "level" }),
        verdict: "soft",
        text: "Ausschalten allein reicht nicht. Bei waagrechter oder aufwärts gerichteter Öffnung fällt Staub hinein – beides muss stimmen.",
      },
    ],
  },
  {
    kind: "grip",
    id: "abnehmen",
    title: "Objektiv abnehmen",
    prompt:
      "Kamera aus, Öffnung nach unten. Jetzt darf das Objektiv runter – zwei Griffe, die aufeinander folgen müssen.",
    focus: { x: 422, y: 228, scale: 1.0 },
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
        label: "Nach links drehen",
        why: "1/8 bis 1/4 Umdrehung nach links (gegen den Uhrzeigersinn) – dann kommt das Objektiv heraus.",
        apply: (s) => ({ ...s, oldLens: "loose", release: false }),
      },
    ],
    corrections: [
      {
        hotspot: "rotate-cw",
        text: "Falsche Richtung: Nach rechts wird festgemacht, gelöst wird nach links.",
        // Drehen geht erst, wenn der Release-Knopf gedrückt ist.
        when: (s) => s.release,
      },
    ],
  },
  {
    kind: "grip",
    id: "offen",
    title: "Body offen",
    prompt:
      "Der Sensor liegt frei. Das teuerste Bauteil des Sets, ungeschützt – mach die Hände frei fürs Wechselobjektiv.",
    focus: { x: 422, y: 228, scale: 1.0 },
    // Quelle 8: „Auf sicherer Fläche abstellen oder Teammitglied in die Hand geben"
    targets: [
      {
        hotspot: "old-lens",
        label: "Altes Objektiv sicher ablegen",
        why: "Altes Objektiv liegt sicher – beide Hände frei fürs Wechselobjektiv.",
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
    question: "Woran richtest du den Objektivverschluss am Kamerabody aus?",
    focus: { x: 422, y: 228, scale: 1.0 },
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
    focus: { x: 422, y: 228, scale: 1.0 },
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
        label: "Nach rechts drehen",
        why: "Eine 1/4 Umdrehung nach rechts (im Uhrzeigersinn), bis es hörbar klickt und fest sitzt.",
        apply: (s) => ({ ...s, spareLens: "locked" }),
      },
    ],
    traps: [{ hotspot: "sensor", trap: "F2" }],
    corrections: [
      {
        hotspot: "rotate-ccw",
        text: "Falsche Richtung – so löst du es wieder. Festgemacht wird nach rechts.",
        // Drehen geht erst, wenn das Objektiv angesetzt ist.
        when: (s) => s.spareLens !== "safe",
      },
    ],
  },
  {
    kind: "grip",
    id: "aufraeumen",
    title: "Aufräumen",
    prompt:
      "Das Objektiv sitzt, der Body ist zu. Drei Griffe fehlen – in beliebiger Reihenfolge.",
    focus: { x: 422, y: 228, scale: 1.0 }, // Überblick: drei Griffe verteilt
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
        why: "Sonnenblende sitzt wieder am Objektiv.",
        apply: (s) => ({ ...s, hood: "new" }),
      },
      {
        hotspot: "front-cap-spare",
        label: "Vorderen Deckel abnehmen",
        why: "Vorderer Deckel ab – ohne diesen letzten Griff bleibt das Bild schwarz.",
        apply: (s) => ({ ...s, frontCapSpare: "off" }),
      },
    ],
  },
];

export const TOTAL_BEATS = beats.length;
