/**
 * Fachliche Quelle: alte Moodle-Kursseite
 * `Old Moodle Kurs/6_Kamera vorbereiten/Objektiv wechseln.html` (FX30).
 * Die Reihenfolge der 13 Schritte ist Prüfungsstoff und wurde 1:1 übernommen.
 * Die Button-Labels sind gekürzt; der Originalwortlaut steht jeweils im Kommentar.
 *
 * Hier pflegst du alle Formulierungen zentral – Logik liegt in lib/engine.ts.
 */

export type SceneEffect =
  | "spare-lens-ready"
  | "camera-off"
  | "hood-off-mounted"
  | "front-cap-closed"
  | "camera-tilted-down"
  | "release-pressed"
  | "lens-detached"
  | "old-lens-parked"
  | "spare-lens-inserted"
  | "spare-lens-locked"
  | "old-lens-rear-cap-closed"
  | "hood-on-new"
  | "front-cap-off-new";

export type Action = {
  id: string;
  label: string; // Was auf dem Button steht
  kind: "step" | "trap";
  order?: number; // nur bei step, 1..13
  orderGroup?: number; // Toleranzgruppen: 3/4 → gleich, 11/12/13 → gleich
  feedbackOk?: string; // kurze Warum-Bestätigung
  feedbackTrap?: string; // nur bei trap
  sceneEffect?: SceneEffect; // symbolische Kennung für die SVG-Szenen-Änderung
};

export const actions: Action[] = [
  {
    // Original: "Wechselobjektiv vorbereiten: (nur) hintere Objektivdeckel entfernen
    // und Objektiv auf sicherer Fläche bereitstellen bzw einem Teammitglied in die Hand geben."
    id: "s01",
    label: "Wechselobjektiv vorbereiten: nur den hinteren Deckel abnehmen, Objektiv sicher ablegen",
    kind: "step",
    order: 1,
    orderGroup: 1,
    feedbackOk: "Das Wechselobjektiv liegt bereit – der vordere Deckel bleibt vorerst drauf.",
    sceneEffect: "spare-lens-ready",
  },
  {
    // Original: "Kamera ausschalten"
    id: "s02",
    label: "Kamera ausschalten",
    kind: "step",
    order: 2,
    orderGroup: 2,
    feedbackOk: "Der Body wird nie im laufenden Betrieb geöffnet.",
    sceneEffect: "camera-off",
  },
  {
    // Original: "Beim montierten Objektiv die Sonnenblende abnehmen
    // (um das Objektiv sicher anfasssen zu können.)"
    id: "s03",
    label: "Sonnenblende vom montierten Objektiv abnehmen",
    kind: "step",
    order: 3,
    orderGroup: 3,
    feedbackOk: "Ohne Sonnenblende bekommst du das Objektiv sicher zu fassen.",
    sceneEffect: "hood-off-mounted",
  },
  {
    // Original: "den vorderen Objektivdeckel schließen (um Fingerabdrücken vorzubeugen)"
    id: "s04",
    label: "Vorderen Objektivdeckel schließen",
    kind: "step",
    order: 4,
    orderGroup: 3,
    feedbackOk: "Beugt Fingerabdrücken auf der Frontlinse vor.",
    sceneEffect: "front-cap-closed",
  },
  {
    // Original: "Kamera eher nach unten keinesfalls aber nach oben neigen
    // (um zu vermeiden, dass Staub auf den Sensor fällt)"
    id: "s05",
    label: "Kamera eher nach unten neigen – keinesfalls nach oben",
    kind: "step",
    order: 5,
    orderGroup: 4,
    feedbackOk: "So fällt kein Staub auf den Sensor, sobald der Body offen ist.",
    sceneEffect: "camera-tilted-down",
  },
  {
    // Original: "Release knopf des Bajonettverschlusses am Kameragehäuse drücken"
    id: "s06",
    label: "Release-Knopf des Bajonettverschlusses am Gehäuse drücken",
    kind: "step",
    order: 6,
    orderGroup: 5,
    feedbackOk: "Der Bajonettverschluss ist entriegelt.",
    sceneEffect: "release-pressed",
  },
  {
    // Original: "Objektiv ca 1/8 bis 1/4 Umdrehung nach links (gegen den Uhrzeigersinn)
    // drehen und herausnehmen."
    id: "s07",
    label: "Objektiv ca. 1/8 bis 1/4 Umdrehung gegen den Uhrzeigersinn drehen und herausnehmen",
    kind: "step",
    order: 7,
    orderGroup: 6,
    feedbackOk: "Objektiv ab – der Body steht jetzt offen und nach unten geneigt.",
    sceneEffect: "lens-detached",
  },
  {
    // Original: "Auf sicherer Fläche abstellen oder Teammitglied in die Hand geben"
    id: "s08",
    label: "Abgenommenes Objektiv auf sicherer Fläche abstellen oder weitergeben",
    kind: "step",
    order: 8,
    orderGroup: 7,
    feedbackOk: "Beide Hände frei fürs Wechselobjektiv.",
    sceneEffect: "old-lens-parked",
  },
  {
    // Original: "Wechselobjektiv rasch einsetzen . Dabei Übereinstimmung mit Index-Punkt beachten"
    id: "s09",
    label: "Wechselobjektiv rasch einsetzen, Index-Punkt beachten",
    kind: "step",
    order: 9,
    orderGroup: 8,
    feedbackOk: "Die Markierungen an Body und Objektiv stimmen überein – je kürzer der Body offen ist, desto besser.",
    sceneEffect: "spare-lens-inserted",
  },
  {
    // Original: "Wechselobjektiv ca 1/4 Umdrehung nach rechts (im Uhrzeigersinn) drehen
    // bis Arretierungs- (Release-)knopf hörbar klickt."
    id: "s10",
    label: "Wechselobjektiv ca. 1/4 Umdrehung im Uhrzeigersinn drehen, bis es hörbar klickt",
    kind: "step",
    order: 10,
    orderGroup: 9,
    feedbackOk: "Der Arretierungsknopf klickt – das Objektiv sitzt.",
    sceneEffect: "spare-lens-locked",
  },
  {
    // Original: "Beim Ursprünglichen Objektiv hinteren Deckel zumachen und Objektiv sicher verwahren"
    id: "s11",
    label: "Beim ursprünglichen Objektiv den hinteren Deckel schließen und verwahren",
    kind: "step",
    order: 11,
    orderGroup: 10,
    feedbackOk: "Das alte Objektiv ist geschlossen und sicher verstaut.",
    sceneEffect: "old-lens-rear-cap-closed",
  },
  {
    // Original: "beim neu angebrachten Objektiv Sonnenblende befestigen"
    id: "s12",
    label: "Am neu montierten Objektiv die Sonnenblende befestigen",
    kind: "step",
    order: 12,
    orderGroup: 10,
    feedbackOk: "Sonnenblende sitzt.",
    sceneEffect: "hood-on-new",
  },
  {
    // Original: "und Objektivdeckel abnehmen"
    id: "s13",
    label: "Am neu montierten Objektiv den vorderen Objektivdeckel abnehmen",
    kind: "step",
    order: 13,
    orderGroup: 10,
    feedbackOk: "Ohne diesen Griff bleibt das Bild schwarz.",
    sceneEffect: "front-cap-off-new",
  },

  // --- Fallen -------------------------------------------------------------
  {
    id: "t01",
    label: "Kamera nach oben neigen",
    kind: "trap",
    feedbackTrap:
      "Staub fällt direkt auf den Sensor. Sensor-Reinigung: rund 300 € beim Verleih.",
  },
  {
    id: "t02",
    label: "Sensor kurz mit dem Finger sauber wischen",
    kind: "trap",
    feedbackTrap:
      "Der Sensor wird nie berührt. Fingerabdrücke sieht man in jeder Aufnahme.",
  },
  {
    id: "t03",
    label: "Objektiv bei laufender Kamera wechseln",
    kind: "trap",
    feedbackTrap: "Kamera ist immer aus, bevor der Body geöffnet wird.",
  },
];

export const steps = actions.filter((a) => a.kind === "step");
export const traps = actions.filter((a) => a.kind === "trap");
export const TOTAL_STEPS = steps.length; // 13
export const MAX_ERRORS = 3;
