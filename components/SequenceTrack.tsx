"use client";

import { AnimatePresence, motion } from "motion/react";
import { TOTAL_STEPS, type Action } from "@/data/actions";

export default function SequenceTrack({ done }: { done: Action[] }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">Dein Ablauf</h2>
        <span className="font-mono text-xs text-text-muted">
          {done.length} / {TOTAL_STEPS}
        </span>
      </div>

      {done.length === 0 ? (
        <p className="text-sm text-text-muted">
          Noch nichts getan. Der erste Griff passiert, bevor du die Kamera überhaupt
          anfasst.
        </p>
      ) : (
        <ol className="grid gap-1.5">
          <AnimatePresence initial={false}>
            {done.map((action, i) => (
              <motion.li
                key={action.id}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2.5 text-sm"
              >
                <span className="mt-px inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream-warm font-mono text-[0.65rem] font-bold text-accent">
                  {i + 1}
                </span>
                <span className="text-text-muted">{action.label}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </div>
  );
}
