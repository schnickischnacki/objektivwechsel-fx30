"use client";

import { motion } from "motion/react";
import { RotateCcw, TriangleAlert, Undo2 } from "lucide-react";
import { beats, trapNachlesen, type TrapId } from "@/data/beats";
import { fehler, umwege, type Slip } from "@/lib/engine";
import type { BestResult } from "@/lib/storage";

/**
 * Abschlusskarte. Seit der Mikro-Iteration nach dem Usability-Test trennt sie
 * Fehler (Sensor gefährdet) von Umwegen (Griff war gerade nicht dran) und
 * verweist bei jedem Punkt auf die Stelle im Kurs, an der er steht (B16, B17).
 * Ein Zertifikat gibt es in der Übung seit dem 24.09.2026 nicht mehr; das einzige
 * Zertifikat des Kurses steht am Ende von Modul 5.
 */
export default function ResultScreen({
  slips,
  seconds,
  best,
  onAgain,
}: {
  slips: Slip[];
  seconds: number | null;
  best: BestResult | null;
  onAgain: () => void;
}) {
  const f = fehler(slips);
  const u = umwege(slips);
  const sauber = f.length === 0;
  // Gleiche Hinweise nur einmal zeigen
  const einmal = (liste: Slip[]) => {
    const gesehen = new Set<string>();
    return liste.filter((s) => (gesehen.has(s.text) ? false : (gesehen.add(s.text), true)));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-[860px] overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-card)]"
    >
      <div
        aria-hidden
        className="h-2"
        style={{ background: "repeating-linear-gradient(135deg,#c1651f 0 14px,#fbeada 14px 24px)" }}
      />
      <div className="p-5 sm:p-7">
        <p className="mb-1 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-accent">Alle neun Schritte geschafft</p>
        <h2 className="mb-2 text-[1.45rem] font-semibold leading-tight">
          {sauber ? "Sauber gewechselt – der Sensor war nie in Gefahr." : "Objektiv gewechselt – aber der Sensor war in Gefahr."}
        </h2>
        <p className="mb-5 max-w-[60ch] text-text-muted">
          {sauber
            ? "Genau diesen Ablauf führst du in der Prüfung vor. Umwege sind Griffe und Antworten, die zu früh, in die falsche Richtung oder knapp daneben waren – sie zählen nicht als Fehler."
            : "Unten steht, wo es gefährlich wurde und wo du es im Kurs nachlesen kannst."}
        </p>

        <dl className="mb-5 grid gap-3 sm:grid-cols-3">
          <Stat label="Fehler" value={String(f.length)} sub="Sensor gefährdet" tone={sauber ? "ok" : "danger"} />
          <Stat label="Umwege" value={String(u.length)} sub="zählen nicht" />
          {seconds != null && <Stat label="Zeit" value={`${seconds} s`} sub={best ? bestText(best) : undefined} />}
        </dl>

        {!sauber && (
          <Liste
            titel="Wo der Sensor in Gefahr war"
            ton="danger"
            punkte={einmal(f).map((s) => ({ text: s.text, wo: trapNachlesen[s.trap as TrapId] }))}
          />
        )}
        {u.length > 0 && (
          <Liste
            titel="Umwege – zum Nachlesen"
            ton="warn"
            punkte={einmal(u).map((s) => ({ text: s.text, wo: beats[s.beatIndex]?.nachlesen }))}
          />
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onAgain}
            className={[
              "inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 font-bold transition-opacity hover:opacity-90",
              sauber ? "border border-line bg-white text-ink" : "bg-accent text-white",
            ].join(" ")}
          >
            <RotateCcw size={18} aria-hidden /> Nochmal wechseln
          </button>
          <p className="text-[0.85rem] text-text-muted">
            Danach kannst du dieses Fenster schließen und im Kurs weitermachen.
          </p>
        </div>
      </div>
    </motion.section>
  );
}

function bestText(best: BestResult): string {
  return `Bester Lauf auf diesem Gerät: ${best.errors} Fehler, ${best.detours} ${best.detours === 1 ? "Umweg" : "Umwege"}${best.seconds != null ? `, ${best.seconds} s` : ""}`;
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "ok" | "danger";
}) {
  return (
    <div
      className={[
        "rounded-xl border p-3",
        tone === "ok" ? "border-ok-line bg-ok-bg" : tone === "danger" ? "border-danger bg-danger-bg" : "border-line bg-cream",
      ].join(" ")}
    >
      <dt className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-text-muted">{label}</dt>
      <dd className={["mt-0.5 font-serif text-[1.6rem] leading-tight", tone === "danger" ? "text-danger" : tone === "ok" ? "text-ok" : ""].join(" ")}>
        {value}
      </dd>
      {sub && <p className="text-[0.75rem] leading-snug text-text-muted">{sub}</p>}
    </div>
  );
}

function Liste({
  titel,
  ton,
  punkte,
}: {
  titel: string;
  ton: "danger" | "warn";
  punkte: { text: string; wo?: string }[];
}) {
  const Icon = ton === "danger" ? TriangleAlert : Undo2;
  return (
    <div
      className={[
        "mb-4 rounded-xl border p-4",
        ton === "danger" ? "border-danger bg-danger-bg" : "border-warn-line bg-warn-bg",
      ].join(" ")}
    >
      <p className={["mb-2 text-[0.75rem] font-bold uppercase tracking-[0.12em]", ton === "danger" ? "text-danger" : "text-warn"].join(" ")}>
        {titel}
      </p>
      <ul className="grid gap-2">
        {punkte.map((p) => (
          <li key={p.text} className="flex gap-2 text-[0.92rem] text-text">
            <Icon size={16} className={["mt-0.5 shrink-0", ton === "danger" ? "text-danger" : "text-warn"].join(" ")} aria-hidden />
            <span>
              {p.text}
              {p.wo && <span className="block text-[0.8rem] text-text-muted">Im Kurs: {p.wo}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
