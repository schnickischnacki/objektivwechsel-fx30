"use client";

import { motion } from "motion/react";
import type { BestResult } from "@/lib/storage";

export default function ResultScreen({
  errors,
  seconds,
  best,
  onAgain,
  onDone,
}: {
  errors: number;
  seconds: number | null;
  best: BestResult | null;
  onAgain: () => void;
  onDone: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-xl border border-line bg-white"
    >
      <div
        aria-hidden
        className="h-2"
        style={{
          background:
            "repeating-linear-gradient(135deg,#c1651f 0 14px,#fbeada 14px 24px)",
        }}
      />
      <div className="p-6">
        <h2 className="mb-2 text-xl font-semibold">Objektiv gewechselt.</h2>
        <p className="mb-5 text-[0.95rem] text-text-muted">
          Alle 13 Schritte in einer Reihenfolge, die der Sensor überlebt. Genau dieser
          Ablauf wird in der Prüfung von dir erwartet.
        </p>

        <dl className="mb-6 flex flex-wrap gap-3">
          <Stat label="Fehlversuche" value={String(errors)} />
          {seconds != null && <Stat label="Zeit" value={`${seconds} s`} />}
          {best != null && (
            <Stat
              label="Dein bisher bester Lauf"
              value={
                best.seconds != null
                  ? `${best.errors} Fehler · ${best.seconds} s`
                  : `${best.errors} Fehler`
              }
            />
          )}
        </dl>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAgain}
            className="min-h-[44px] rounded-lg bg-accent px-5 text-base font-bold text-white transition-opacity hover:opacity-90"
          >
            Nochmal
          </button>
          <button
            type="button"
            onClick={onDone}
            className="min-h-[44px] rounded-lg border border-line bg-white px-5 text-base font-semibold transition-colors hover:bg-cream-warm"
          >
            Fertig
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 basis-40 rounded-lg border border-line bg-cream p-3">
      <dt className="text-[0.72rem] uppercase tracking-[0.1em] text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-lg">{value}</dd>
    </div>
  );
}
