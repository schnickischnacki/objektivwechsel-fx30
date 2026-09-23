import { TOTAL_BEATS } from "@/data/beats";

/**
 * Zertifikat als PDF, komplett im Browser erzeugt (jsPDF, dynamisch geladen –
 * die Bibliothek landet erst im Bundle-Chunk, wenn wirklich jemand herunterlädt).
 * Der Name kommt aus dem Eingabefeld und wird ausschließlich in die PDF
 * geschrieben – nichts davon wird gespeichert oder an einen Server geschickt.
 */

/**
 * Das Zertifikat gibt es nur für einen Durchlauf ohne Fehler, also ohne dass der
 * Sensor gefährdet war (Mikro-Iteration nach dem Usability-Test: B10 „zu leicht
 * verdient", B17 „Fehler auf der Urkunde"). Umwege stehen deshalb nicht darauf.
 */
export type CertificateData = {
  name: string;
  seconds: number | null;
};

/* Design-Tokens der App als RGB – identisch zu globals.css. */
const ACCENT: [number, number, number] = [193, 101, 31];
const INK: [number, number, number] = [30, 37, 48];
const CREAM: [number, number, number] = [246, 244, 240];
const LINE: [number, number, number] = [228, 223, 215];
const MUTED: [number, number, number] = [74, 85, 102];

function formatTime(seconds: number | null): string {
  if (seconds == null) return "–";
  if (seconds < 60) return `${seconds} s`;
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "zertifikat"
  );
}

export async function downloadCertificate(data: CertificateData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const W = 297;
  const H = 210;
  const CX = W / 2;

  // Grundfläche
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, W, H, "F");

  // Streifenband oben und unten – das Motiv der Startkarte.
  for (const y of [0, H - 5]) {
    for (let x = 0; x < W; x += 30) {
      doc.setFillColor(...ACCENT);
      doc.rect(x, y, 18, 5, "F");
      doc.setFillColor(...INK);
      doc.rect(x + 18, y, 12, 5, "F");
    }
  }

  // Rahmen
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.8);
  doc.roundedRect(14, 16, W - 28, H - 32, 4, 4);

  // Kopf
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ACCENT);
  doc.text("ZERTIFIKAT", CX, 38, { align: "center", charSpace: 2.2 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...MUTED);
  doc.text(
    "Kameraschein-Vorbereitung · Objektivwechsel an der Sony FX30",
    CX,
    48,
    { align: "center" },
  );

  // Name
  doc.setFont("times", "italic");
  doc.setFontSize(32);
  doc.setTextColor(...INK);
  doc.text(data.name, CX, 78, { align: "center" });

  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(CX - 40, 84, CX + 40, 84);

  const date = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...MUTED);
  doc.text(
    `hat am ${date} den Objektivwechsel in der Übung fehlerfrei durchgeführt:`,
    CX,
    96,
    { align: "center" },
  );
  doc.text("Der Sensor war zu keinem Zeitpunkt in Gefahr.", CX, 102, { align: "center" });

  // Kennzahlen. Keine Fehlerzahl: Das Zertifikat gibt es nur ohne Fehler, eine „0“
  // wäre auf jeder Urkunde dieselbe und sagt nichts (Hinweis Niklas, 23.09.2026).
  const stats: { label: string; value: string; sub?: string }[] = [
    { label: "Schritte", value: `${TOTAL_BEATS} von ${TOTAL_BEATS}`, sub: "vorbereiten, wechseln, abschließen" },
    { label: "Bearbeitungszeit", value: formatTime(data.seconds) },
  ];
  const BOX_W = 72;
  const BOX_H = 30;
  const GAP = 8;
  const totalW = stats.length * BOX_W + (stats.length - 1) * GAP;
  let x = CX - totalW / 2;
  const y = 116;
  for (const s of stats) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, BOX_W, BOX_H, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(s.label.toUpperCase(), x + BOX_W / 2, y + 8, {
      align: "center",
      charSpace: 0.5,
    });

    doc.setFont("times", "normal");
    doc.setFontSize(17);
    doc.setTextColor(...INK);
    doc.text(s.value, x + BOX_W / 2, y + 19, { align: "center" });

    if (s.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(s.sub, x + BOX_W / 2, y + 25, { align: "center" });
    }
    x += BOX_W + GAP;
  }

  // Fußzeile
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    "„Der Sensor ist das Herz der Kamera. Wenn du ihn anfasst, hat er ein Problem – und du gleich mit.“",
    CX,
    166,
    { align: "center" },
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("– unbekannt, HS Ansbach", CX, 172, { align: "center" });

  doc.save(`zertifikat-objektivwechsel-${slugify(data.name)}.pdf`);
}
