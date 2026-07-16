"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Action } from "@/data/actions";

export default function ActionList({
  actions,
  onPick,
  nudgedId,
  trapId,
  disabled,
}: {
  actions: Action[];
  onPick: (action: Action) => void;
  /** Aktion, die zu früh geklickt wurde – kurzes „Noch nicht dran" */
  nudgedId: string | null;
  /** Falle, die gerade ausgelöst wurde */
  trapId: string | null;
  disabled: boolean;
}) {
  return (
    <div>
      <h2 className="mb-3 text-base font-semibold">Was tust du als Nächstes?</h2>
      <ul className="grid gap-2">
        <AnimatePresence initial={false}>
          {actions.map((action) => {
            const nudged = nudgedId === action.id;
            const sprung = trapId === action.id;
            return (
              <motion.li
                key={action.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onPick(action)}
                  aria-describedby={
                    nudged ? "feedback-region" : sprung ? "feedback-region" : undefined
                  }
                  className={[
                    "flex min-h-[44px] w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-[0.95rem] transition-colors",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                    sprung
                      ? "border-danger bg-danger-bg"
                      : nudged
                        ? "border-accent bg-cream-warm"
                        : "border-line bg-white hover:bg-cream-warm",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className={[
                      "h-2 w-2 shrink-0 rounded-full",
                      sprung ? "bg-danger" : nudged ? "bg-accent" : "bg-line",
                    ].join(" ")}
                  />
                  <span>{action.label}</span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
