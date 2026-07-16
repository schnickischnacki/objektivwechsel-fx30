"use client";

import { motion } from "motion/react";
import type { SceneEffect } from "@/data/actions";

export type SceneFlags = Record<SceneEffect, boolean>;

/** Drehpunkt, um den die Kamera beim Neigen kippt. */
const PIVOT = { x: 103, y: 150 };
const TILT_DEG = 14;

/** Punkt um den Kamera-Pivot rotieren – für Teile, die an der Kamera hängen. */
function rot(x: number, y: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  const dx = x - PIVOT.x;
  const dy = y - PIVOT.y;
  return {
    x: PIVOT.x + dx * Math.cos(r) - dy * Math.sin(r),
    y: PIVOT.y + dx * Math.sin(r) + dy * Math.cos(r),
  };
}

type Pose = { x: number; y: number; rotate: number };

function attached(x: number, y: number, tilt: number): Pose {
  const p = rot(x, y, tilt);
  return { x: p.x, y: p.y, rotate: tilt };
}

const spring = { type: "spring", stiffness: 180, damping: 24 } as const;

export default function SetScene({ flags }: { flags: SceneFlags }) {
  const tilt = flags["camera-tilted-down"] ? TILT_DEG : 0;

  const lensOff = flags["lens-detached"];
  const spareOn = flags["spare-lens-inserted"];
  const bodyOpen = lensOff && !spareOn;

  // Sonnenblende: montiertes Objektiv → Ablage → neues Objektiv
  const hoodPose: Pose = flags["hood-on-new"]
    ? attached(216, 150, tilt)
    : flags["hood-off-mounted"]
      ? { x: 100, y: 232, rotate: -90 }
      : attached(216, 150, tilt);

  // Vorderer Deckel des ursprünglichen Objektivs: Ablage → altes Objektiv
  const capFrontOldPose: Pose = flags["front-cap-closed"]
    ? lensOff
      ? flags["old-lens-parked"]
        ? { x: 354, y: 186, rotate: 0 }
        : { x: 273, y: 95, rotate: 0 }
      : attached(203, 150, tilt)
    : { x: 150, y: 232, rotate: 0 };

  // Hinterer Deckel des Wechselobjektivs: Wechselobjektiv → Ablage → altes Objektiv
  const capRearSparePose: Pose = flags["old-lens-rear-cap-closed"]
    ? { x: 298, y: 186, rotate: 0 }
    : flags["spare-lens-ready"]
      ? { x: 198, y: 232, rotate: 0 }
      : { x: 298, y: 136, rotate: 0 };

  // Vorderer Deckel des Wechselobjektivs: bleibt drauf bis Schritt 13
  const capFrontSparePose: Pose = flags["front-cap-off-new"]
    ? { x: 246, y: 232, rotate: 0 }
    : spareOn
      ? attached(203, 150, tilt)
      : { x: 354, y: 136, rotate: 0 };

  // Ursprüngliches Objektiv: an der Kamera → in der Hand → sichere Fläche
  const oldLensPose: Pose = flags["old-lens-parked"]
    ? { x: 326, y: 186, rotate: 0 }
    : lensOff
      ? { x: 245, y: 95, rotate: 0 }
      : attached(173, 150, tilt);

  // Wechselobjektiv: sichere Fläche → Kamera
  const spareLensPose: Pose = spareOn
    ? attached(173, 150, tilt)
    : { x: 326, y: 136, rotate: 0 };

  return (
    <svg
      viewBox="0 80 400 180"
      className="block w-full"
      role="img"
      aria-label="Schematische Arbeitsfläche mit Kamera, montiertem Objektiv, Wechselobjektiv, Deckeln und Sonnenblende"
    >
      {/* Arbeitsfläche */}
      <rect x="0" y="0" width="400" height="260" fill="#fbeada" rx="12" />
      <line x1="0" y1="206" x2="400" y2="206" stroke="#e4dfd7" strokeWidth="2" />

      {/* Sichere Fläche */}
      <rect
        x="262"
        y="88"
        width="128"
        height="124"
        rx="8"
        fill="#f6f4f0"
        stroke="#e4dfd7"
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <text
        x="326"
        y="100"
        textAnchor="middle"
        fill="#4a5566"
        fontSize="9"
        letterSpacing="0.08em"
      >
        SICHERE FLÄCHE
      </text>

      {/* Ablage für lose Teile */}
      <text x="14" y="226" fill="#4a5566" fontSize="9" letterSpacing="0.08em">
        ABGELEGT
      </text>

      {/* --- Kameragehäuse ------------------------------------------------ */}
      <motion.g
        initial={false}
        animate={{ rotate: tilt }}
        transition={spring}
        style={{ transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}
      >
        <rect x="82" y="108" width="42" height="12" rx="3" fill="#2b3543" />
        <rect x="60" y="118" width="86" height="64" rx="8" fill="#1e2530" />
        <rect x="68" y="126" width="26" height="18" rx="3" fill="#39424f" />

        {/* Status-LED */}
        <circle
          cx="104"
          cy="135"
          r="4"
          fill={flags["camera-off"] ? "#4a5566" : "#e0553f"}
        />
        <text x="112" y="139" fill="#8d97a6" fontSize="8">
          {flags["camera-off"] ? "OFF" : "ON"}
        </text>

        {/* Bajonett-Öffnung + Sensor */}
        <ellipse cx="148" cy="150" rx="7" ry="24" fill="#39424f" />
        {bodyOpen && (
          <>
            <ellipse cx="150" cy="150" rx="5" ry="20" fill="#0d1117" />
            <rect x="147" y="140" width="6" height="20" rx="1" fill="#2f6f8f" />
          </>
        )}

        {/* Release-Knopf */}
        <circle
          cx="136"
          cy="176"
          r="5"
          fill={flags["release-pressed"] ? "#c1651f" : "#39424f"}
          stroke="#f6f4f0"
          strokeWidth="1"
        />
      </motion.g>

      {/* --- Ursprüngliches Objektiv -------------------------------------- */}
      <motion.g initial={false} animate={oldLensPose} transition={spring}>
        <g transform="translate(-27,-20)">
          <rect x="0" y="0" width="54" height="40" rx="4" fill="#39424f" />
          <rect x="10" y="6" width="34" height="4" rx="2" fill="#525d6d" />
          <rect x="10" y="30" width="34" height="4" rx="2" fill="#525d6d" />
          <ellipse cx="54" cy="20" rx="5" ry="19" fill="#5c6675" />
          <ellipse cx="0" cy="20" rx="5" ry="19" fill="#2b3543" />
        </g>
      </motion.g>

      {/* --- Wechselobjektiv ---------------------------------------------- */}
      <motion.g initial={false} animate={spareLensPose} transition={spring}>
        <g transform="translate(-27,-20)">
          <rect x="0" y="0" width="54" height="40" rx="4" fill="#4a5566" />
          <rect x="10" y="6" width="34" height="4" rx="2" fill="#6b7686" />
          <rect x="10" y="30" width="34" height="4" rx="2" fill="#6b7686" />
          <ellipse cx="54" cy="20" rx="5" ry="19" fill="#6b7686" />
          {!flags["spare-lens-ready"] && (
            <ellipse cx="0" cy="20" rx="5" ry="19" fill="#2b3543" />
          )}
          {/* Index-Punkt */}
          <circle
            cx="6"
            cy="4"
            r="3"
            fill={flags["spare-lens-locked"] ? "#c1651f" : "#ffd591"}
          />
        </g>
      </motion.g>

      {/* --- Sonnenblende -------------------------------------------------- */}
      <motion.g initial={false} animate={hoodPose} transition={spring}>
        <path
          d="M -11 -20 L 11 -27 L 11 27 L -11 20 Z"
          fill="#2b3543"
          opacity="0.92"
        />
      </motion.g>

      {/* --- Deckel -------------------------------------------------------- */}
      <Cap pose={capFrontOldPose} label="V" />
      <Cap pose={capRearSparePose} label="H" />
      <Cap pose={capFrontSparePose} label="V" />

      {/* Klick-Bestätigung beim Arretieren */}
      {flags["spare-lens-locked"] && (
        <motion.text
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          x="173"
          y="104"
          textAnchor="middle"
          fill="#c1651f"
          fontSize="11"
          fontWeight="700"
        >
          klick
        </motion.text>
      )}
    </svg>
  );
}

function Cap({ pose, label }: { pose: Pose; label: string }) {
  return (
    <motion.g initial={false} animate={pose} transition={spring}>
      <ellipse cx="0" cy="0" rx="5" ry="19" fill="#c1651f" />
      <text
        x="0"
        y="3"
        textAnchor="middle"
        fill="#fbeada"
        fontSize="7"
        fontWeight="700"
      >
        {label}
      </text>
    </motion.g>
  );
}
