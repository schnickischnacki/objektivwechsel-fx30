"use client";

import { motion } from "motion/react";
import type { Slip } from "@/lib/engine";
import type { BestResult } from "@/lib/storage";

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
  const clean = slips.length === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-2xl border border-line bg-white"
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
        <h2 className="mb-2 text-xl font-semibold">
          {clean ? "Sauberer Durchlauf." : "Objektiv gewechselt."}
        </h2>
        <p className="mb-5 max-w-[58ch] text-[0.95rem] text-text-muted">
          {clean
            ? "Alle Handgriffe gesessen, der Sensor blieb außer Gefahr. Genau so sieht es in der Prüfung aus."
            : "Der Wechsel ist geschafft – unten steht, wo es gehakt hat. Ein zweiter Durchlauf lohnt sich, bis er sauber ist."}
        </p>

        <dl className="mb-5 flex flex-wrap gap-3">
          <Stat label="Ausrutscher" value={String(slips.length)} />
          {seconds != null && <Stat label="Zeit" value={`${seconds} s`} />}
          {best != null && (
            <Stat
              label="Dein bisher bester Lauf"
              value={
                best.seconds != null
                  ? `${best.errors} Ausrutscher · ${best.seconds} s`
                  : `${best.errors} Ausrutscher`
              }
            />
          )}
        </dl>

        {!clean && (
          <div className="mb-6 rounded-xl border border-line bg-cream p-4">
            <p className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-text-muted">
              Wo es gehakt hat
            </p>
            <ul className="grid gap-1.5">
              {[...new Set(slips.map((s) => s.text))].map((text) => (
                <li key={text} className="flex gap-2 text-sm text-text">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={onAgain}
          className="min-h-[48px] rounded-full bg-accent px-6 text-base font-bold text-white transition-opacity hover:opacity-90"
        >
          Nochmal wechseln
        </button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 basis-40 rounded-xl border border-line bg-cream p-3">
      <dt className="text-[0.72rem] uppercase tracking-[0.1em] text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-lg">{value}</dd>
    </div>
  );
}
