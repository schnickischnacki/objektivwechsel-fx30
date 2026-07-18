"use client";

import { motion } from "motion/react";
import type { HotspotId, SceneState } from "@/data/beats";

/* Werkbank in SVG-Koordinaten. Alles hier ist schematisch, nicht maßstäblich. */
const VIEW = { w: 720, h: 400 };
const PIVOT = { x: 240, y: 210 };
const TILT = { up: -15, level: 0, down: 15 };

const MOUNT = { x: 332, y: 210 };
const LENS_AT = { x: 387, y: 210 };
const HOOD_AT = { x: 462, y: 210 };
const CAP_FRONT_AT = { x: 449, y: 210 };

const SAFE_SPARE = { x: 610, y: 160 };
const SAFE_OLD = { x: 610, y: 245 };
const LOOSE = { x: 470, y: 100 };

const TRAY = {
  hood: { x: 215, y: 340 },
  frontCapOld: { x: 296, y: 340 },
  rearCapSpare: { x: 362, y: 340 },
  frontCapSpare: { x: 428, y: 340 },
};

type Pose = { x: number; y: number; rotate: number };
type Hint = { cx?: number; cy?: number; rx: number; ry?: number };

function rot(x: number, y: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  const dx = x - PIVOT.x;
  const dy = y - PIVOT.y;
  return {
    x: PIVOT.x + dx * Math.cos(r) - dy * Math.sin(r),
    y: PIVOT.y + dx * Math.sin(r) + dy * Math.cos(r),
  };
}

function att(x: number, y: number, tilt: number): Pose {
  const p = rot(x, y, tilt);
  return { x: p.x, y: p.y, rotate: tilt };
}

const spring = { type: "spring", stiffness: 170, damping: 22 } as const;

export default function Stage({
  scene,
  focus,
  live,
  onGrip,
}: {
  scene: SceneState;
  focus: { x: number; y: number; scale: number };
  live: HotspotId[];
  onGrip: (id: HotspotId) => void;
}) {
  const tilt = TILT[scene.tilt];
  const bodyOpen = scene.oldLens !== "mounted" && scene.spareLens === "safe";
  const k = focus.scale;

  // Zoom-Frame in der Szene halten: nie über den Rand hinaus, sonst ragen
  // Objekte halb aus dem Bild und wirken wie kaputte Interaktionsflächen.
  const halfW = VIEW.w / (2 * k);
  const halfH = VIEW.h / (2 * k);
  const cx = Math.min(Math.max(focus.x, halfW), VIEW.w - halfW);
  const cy = Math.min(Math.max(focus.y, halfH), VIEW.h - halfH);
  const tx = VIEW.w / 2 - k * cx;
  const ty = VIEW.h / 2 - k * cy;


  const oldLensPose: Pose =
    scene.oldLens === "safe"
      ? { ...SAFE_OLD, rotate: 0 }
      : scene.oldLens === "loose"
        ? { ...LOOSE, rotate: -8 }
        : att(LENS_AT.x, LENS_AT.y, tilt);

  const spareLensPose: Pose =
    scene.spareLens === "safe"
      ? { ...SAFE_SPARE, rotate: 0 }
      : att(LENS_AT.x, LENS_AT.y, tilt);

  const hoodPose: Pose =
    scene.hood === "tray"
      ? { ...TRAY.hood, rotate: -90 }
      : att(HOOD_AT.x, HOOD_AT.y, tilt);

  const frontCapOldPose: Pose =
    scene.frontCapOld === "off"
      ? { ...TRAY.frontCapOld, rotate: 0 }
      : scene.oldLens === "safe"
        ? { x: SAFE_OLD.x + 62, y: SAFE_OLD.y, rotate: 0 }
        : scene.oldLens === "loose"
          ? { x: LOOSE.x + 62, y: LOOSE.y - 8, rotate: -8 }
          : att(CAP_FRONT_AT.x, CAP_FRONT_AT.y, tilt);

  const rearCapSparePose: Pose =
    scene.rearCapSpare === "spare"
      ? { x: SAFE_SPARE.x - 62, y: SAFE_SPARE.y, rotate: 0 }
      : scene.rearCapSpare === "tray"
        ? { ...TRAY.rearCapSpare, rotate: 0 }
        : { x: SAFE_OLD.x - 62, y: SAFE_OLD.y, rotate: 0 };

  const frontCapSparePose: Pose =
    scene.frontCapSpare === "off"
      ? { ...TRAY.frontCapSpare, rotate: 0 }
      : scene.spareLens === "safe"
        ? { x: SAFE_SPARE.x + 62, y: SAFE_SPARE.y, rotate: 0 }
        : att(CAP_FRONT_AT.x, CAP_FRONT_AT.y, tilt);

  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      preserveAspectRatio="xMidYMid meet"
      className="mx-auto block max-h-[48vh] w-full touch-manipulation select-none"
      role="group"
      aria-label="Werkbank mit Kamera, Objektiven, Deckeln und Sonnenblende – anfassbare Stellen sind hervorgehoben"
    >
      {/* Flache Fläche (kein Gradient), damit der Rand links/rechts nahtlos in den
          gleichfarbigen Container-Hintergrund übergeht, wenn die Höhe begrenzt wird. */}
      <rect x="0" y="0" width={VIEW.w} height={VIEW.h} fill="#fbeada" />

      {/* Zoom auf die Situation. Bewusst ohne motion: SVG-Transform-Origin muss
          gegen den viewBox-Ursprung rechnen (transformBox), sonst verrutscht alles. */}
      <g
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          transformOrigin: "0px 0px",
          transformBox: "view-box",
          transition: "transform 650ms cubic-bezier(0.3, 0, 0.2, 1)",
        }}
      >
        {/* Werkbankkante */}
        <line x1="0" y1="300" x2={VIEW.w} y2="300" stroke="#e0d3c2" strokeWidth="2" />

        {/* Ablage-Zone für lose Teile */}
        <rect x="150" y="302" width="330" height="78" rx="10" fill="#f1e2d0" opacity="0.6" />
        <text x="164" y="322" fill="#a99a86" fontSize="11" letterSpacing="1.6">
          ABLAGE
        </text>

        {/* Sichere Fläche mit dem Wechselobjektiv */}
        <rect
          x="520"
          y="108"
          width="182"
          height="186"
          rx="12"
          fill="#f6f4f0"
          stroke="#d9cbba"
          strokeWidth="2"
          strokeDasharray="7 5"
        />
        <text x="611" y="128" textAnchor="middle" fill="#a99a86" fontSize="11" letterSpacing="1.4">
          WECHSELOBJEKTIV
        </text>

        {/* Staub – nur wenn die Öffnung nicht nach unten zeigt */}
        {scene.tilt !== "down" && <Dust danger={scene.tilt === "up"} />}

        {/* --- Gehäuse ------------------------------------------------- */}
        <g
          style={{
            transform: `rotate(${tilt}deg)`,
            transformBox: "view-box",
            transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
            transition: "transform 520ms cubic-bezier(0.3,0,0.2,1)",
          }}
        >
          <rect x="196" y="126" width="96" height="26" rx="6" fill="#2b3543" />
          <rect x="150" y="150" width="182" height="120" rx="14" fill="#1e2530" />
          <rect x="150" y="196" width="46" height="74" rx="12" fill="#161c25" />
          <rect x="166" y="164" width="72" height="52" rx="5" fill="#39424f" />
          <rect x="172" y="170" width="60" height="40" rx="3" fill="#4d5b6e" opacity={scene.power === "on" ? 1 : 0.35} />

          <circle cx="276" cy="139" r="5" fill={scene.power === "on" ? "#e0553f" : "#4a5566"} />
          <text x="286" y="144" fill="#9aa3b2" fontSize="11" fontWeight="600">
            {scene.power === "on" ? "REC" : "OFF"}
          </text>

          {/* Bajonett + Sensor */}
          <ellipse cx={MOUNT.x} cy={MOUNT.y} rx="12" ry="48" fill="#39424f" />
          {bodyOpen && (
            <>
              <ellipse cx={MOUNT.x + 3} cy={MOUNT.y} rx="9" ry="42" fill="#0b0f14" />
              <Hotspot
                id="sensor"
                live={live.includes("sensor")}
                onGrip={onGrip}
                label="Sensor"
                hint={{ cx: MOUNT.x + 3, cy: MOUNT.y, rx: 18, ry: 48 }}
              >
                <rect x={MOUNT.x - 22} y={MOUNT.y - 34} width="44" height="68" fill="transparent" />
                <rect x={MOUNT.x - 3} y={MOUNT.y - 24} width="12" height="48" rx="2" fill="#2f6f8f" />
              </Hotspot>
            </>
          )}

          {/* Index-Punkt am Body */}
          <circle cx={MOUNT.x - 2} cy={MOUNT.y - 56} r="4" fill="#ffd591" />

          {/* Ein/Aus */}
          <Hotspot
            id="power"
            live={live.includes("power")}
            onGrip={onGrip}
            label="Ein-/Ausschalter"
            hint={{ cx: 221, cy: 139, rx: 28 }}
          >
            <circle cx="221" cy="139" r="30" fill="transparent" />
            <rect x="204" y="130" width="34" height="18" rx="9" fill="#4a5566" />
            <motion.circle
              initial={false}
              animate={{ cx: scene.power === "on" ? 230 : 212 }}
              transition={spring}
              cy="139"
              r="7"
              fill={scene.power === "on" ? "#e0553f" : "#f6f4f0"}
            />
          </Hotspot>

          {/* Release */}
          <Hotspot
            id="release"
            live={live.includes("release")}
            onGrip={onGrip}
            label="Release-Knopf des Bajonetts"
            hint={{ cx: 316, cy: 256, rx: 22 }}
          >
            <circle cx="316" cy="256" r="30" fill="transparent" />
            <circle
              cx="316"
              cy="256"
              r="12"
              fill={scene.release ? "#c1651f" : "#39424f"}
              stroke="#f6f4f0"
              strokeWidth="2"
            />
          </Hotspot>
        </g>

        {/* --- Ursprüngliches Objektiv --------------------------------- */}
        <Piece pose={oldLensPose}>
          <Lens tone="old" indexOn={false} />
        </Piece>

        {/* --- Wechselobjektiv ----------------------------------------- */}
        <Piece pose={spareLensPose}>
          <Hotspot
            id="spare-lens"
            live={live.includes("spare-lens")}
            onGrip={onGrip}
            label="Wechselobjektiv ansetzen"
            hint={{ cx: 0, cy: 0, rx: 66, ry: 52 }}
          >
            <Lens tone="spare" indexOn={scene.spareLens !== "safe"} locked={scene.spareLens === "locked"} />
          </Hotspot>
        </Piece>

        {/* Altes Objektiv als Griff, sobald es lose ist */}
        {scene.oldLens === "loose" && (
          <Piece pose={oldLensPose}>
            <Hotspot
              id="old-lens"
              live={live.includes("old-lens")}
              onGrip={onGrip}
              label="Altes Objektiv sicher ablegen"
              hint={{ cx: 0, cy: 0, rx: 66, ry: 52 }}
            >
              <rect x="-62" y="-46" width="124" height="92" rx="8" fill="transparent" />
            </Hotspot>
          </Piece>
        )}

        {/* --- Sonnenblende -------------------------------------------- */}
        <Piece pose={hoodPose}>
          <Hotspot
            id="hood"
            live={live.includes("hood")}
            onGrip={onGrip}
            label="Sonnenblende"
            hint={{ cx: 0, cy: 0, rx: 26, ry: 54 }}
          >
            <path d="M -14 -42 L 14 -54 L 14 54 L -14 42 Z" fill="#2b3543" />
          </Hotspot>
        </Piece>

        {/* --- Deckel --------------------------------------------------- */}
        <Piece pose={frontCapOldPose}>
          <Hotspot
            id="front-cap-old"
            live={live.includes("front-cap-old")}
            onGrip={onGrip}
            label="Vorderer Objektivdeckel"
            hint={{ cx: 0, cy: 0, rx: 22, ry: 50 }}
          >
            <Cap label="V" />
          </Hotspot>
        </Piece>

        <Piece pose={rearCapSparePose}>
          <Hotspot
            id="rear-cap-spare"
            live={live.includes("rear-cap-spare")}
            onGrip={onGrip}
            label="Hinterer Objektivdeckel"
            hint={{ cx: 0, cy: 0, rx: 22, ry: 50 }}
          >
            <Cap label="H" />
          </Hotspot>
        </Piece>

        <Piece pose={frontCapSparePose}>
          <Hotspot
            id="front-cap-spare"
            live={live.includes("front-cap-spare")}
            onGrip={onGrip}
            label="Vorderer Deckel des Wechselobjektivs"
            hint={{ cx: 0, cy: 0, rx: 22, ry: 50 }}
          >
            <Cap label="V" />
          </Hotspot>
        </Piece>

        {/* --- Drehen --------------------------------------------------- */}
        {(live.includes("rotate-ccw") || live.includes("rotate-cw")) && (
          <g>
            {live.includes("rotate-ccw") && (
              <RotateGrip id="rotate-ccw" dir="ccw" onGrip={onGrip} x={278} y={96} />
            )}
            {live.includes("rotate-cw") && (
              <RotateGrip id="rotate-cw" dir="cw" onGrip={onGrip} x={452} y={96} />
            )}
          </g>
        )}
      </g>
    </svg>
  );
}


/**
 * Bewegliches Objekt: Position und Drehung über CSS-Transform (nicht motion x/y),
 * weil motions x/y auf einem SVG-<g> die Feder auf halbem Weg einfrieren lässt.
 * Der Zoom-Container nutzt denselben CSS-Ansatz und läuft stabil.
 * Aussen translate (view-box), innen rotate um die Objektmitte.
 */
function Piece({ pose, children }: { pose: Pose; children: React.ReactNode }) {
  const ease = "transform 520ms cubic-bezier(0.3,0,0.2,1)";
  return (
    <g
      style={{
        transform: `translate(${pose.x}px, ${pose.y}px)`,
        transformBox: "view-box",
        transformOrigin: "0px 0px",
        transition: ease,
      }}
    >
      <g style={{ transform: `rotate(${pose.rotate}deg)`, transformBox: "fill-box", transformOrigin: "center", transition: ease }}>
        {children}
      </g>
    </g>
  );
}

function Lens({
  tone,
  indexOn,
  locked,
}: {
  tone: "old" | "spare";
  indexOn: boolean;
  locked?: boolean;
}) {
  const body = tone === "old" ? "#39424f" : "#4a5566";
  const ring = tone === "old" ? "#525d6d" : "#6b7686";
  return (
    <g transform="translate(-55,-42)">
      <rect x="0" y="0" width="110" height="84" rx="8" fill={body} />
      <rect x="16" y="10" width="78" height="7" rx="3.5" fill={ring} />
      <rect x="16" y="67" width="78" height="7" rx="3.5" fill={ring} />
      <rect x="44" y="17" width="22" height="50" rx="3" fill={ring} opacity="0.5" />
      <ellipse cx="110" cy="42" rx="10" ry="40" fill={ring} />
      <ellipse cx="0" cy="42" rx="10" ry="40" fill="#2b3543" />
      {indexOn && <circle cx="8" cy="6" r="5" fill={locked ? "#c1651f" : "#ffd591"} />}
    </g>
  );
}

/**
 * Objektivdeckel als plastische Kappe: dunkler Rand hinten, hellere Fläche vorn,
 * zwei Griffmulden. Flache Ovale waren im Test nicht als Deckel erkennbar.
 */
function Cap({ label }: { label: string }) {
  return (
    <g>
      <circle cx="0" cy="0" r="34" fill="transparent" />
      <ellipse cx="2" cy="0" rx="13" ry="40" fill="#8f4715" />
      <ellipse cx="-1" cy="0" rx="12" ry="38" fill="#c1651f" />
      <rect x="-5" y="-22" width="9" height="7" rx="3.5" fill="#8f4715" opacity="0.75" />
      <rect x="-5" y="15" width="9" height="7" rx="3.5" fill="#8f4715" opacity="0.75" />
      <text x="-1" y="5" textAnchor="middle" fill="#fbeada" fontSize="13" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

/**
 * Pulsierende Affordance an einer anfassbaren Stelle: statischer Ring plus ein
 * nach außen laufender Puls-Ring. Weißer Unterbau, damit der orange Ring auf
 * jedem Hintergrund (Cream, dunkle Kamera, orange Deckel) sichtbar bleibt.
 */
function Pulse({ cx = 0, cy = 0, rx, ry }: Hint) {
  const yr = ry ?? rx;
  return (
    <g style={{ pointerEvents: "none" }} aria-hidden>
      <ellipse cx={cx} cy={cy} rx={rx} ry={yr} fill="none" stroke="#ffffff" strokeWidth={5} opacity={0.55} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={yr} fill="none" stroke="#c1651f" strokeWidth={2.5} />
      <motion.ellipse
        cx={cx}
        cy={cy}
        fill="none"
        stroke="#c1651f"
        strokeWidth={2.5}
        initial={{ rx, ry: yr, opacity: 0.55 }}
        animate={{ rx: rx + 11, ry: yr + 11, opacity: 0 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
      />
    </g>
  );
}

/**
 * Anfassbares Element. Nur „live" reagiert – sonst ist es reine Kulisse.
 *
 * Wichtig: Griffe, Fallen und Korrekturen sehen identisch aus (gleicher Puls-Ring).
 * Würden nur die richtigen Stellen leuchten, wäre die Entscheidung geschenkt –
 * und genau die Unterscheidung ist der Lerninhalt.
 */
function Hotspot({
  id,
  live,
  onGrip,
  label,
  hint,
  children,
}: {
  id: HotspotId;
  live: boolean;
  onGrip: (id: HotspotId) => void;
  label: string;
  hint?: Hint;
  children: React.ReactNode;
}) {
  if (!live) return <g>{children}</g>;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      className="hotspot cursor-pointer"
      onClick={() => onGrip(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onGrip(id);
        }
      }}
    >
      {children}
      {hint && <Pulse {...hint} />}
    </g>
  );
}

/**
 * Dreh-Schaltfläche mit Klartext. Ein bloßes Kreispfeil-Icon war im Test nicht
 * eindeutig als „links" oder „rechts" lesbar – deshalb Text plus Pfeil.
 */
function RotateGrip({
  id,
  dir,
  onGrip,
  x,
  y,
}: {
  id: HotspotId;
  dir: "ccw" | "cw";
  onGrip: (id: HotspotId) => void;
  x: number;
  y: number;
}) {
  const W = 154;
  const H = 44;
  const text = dir === "ccw" ? "nach links" : "nach rechts";
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={
        dir === "ccw"
          ? "Objektiv nach links drehen (gegen den Uhrzeigersinn)"
          : "Objektiv nach rechts drehen (im Uhrzeigersinn)"
      }
      className="hotspot cursor-pointer"
      onClick={() => onGrip(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onGrip(id);
        }
      }}
      transform={`translate(${x},${y})`}
    >
      <motion.rect
        x={-W / 2}
        y={-H / 2}
        width={W}
        height={H}
        rx={H / 2}
        fill="none"
        stroke="#c1651f"
        strokeWidth={2.5}
        initial={{ opacity: 0.5, scale: 1 }}
        animate={{ opacity: 0, scale: 1.14 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
      <rect
        x={-W / 2}
        y={-H / 2}
        width={W}
        height={H}
        rx={H / 2}
        fill="#ffffff"
        stroke="#c1651f"
        strokeWidth="2.5"
      />
      {/* Rotationspfeil: im Uhrzeigersinn gezeichnet, für „links" gespiegelt */}
      <g transform={`translate(${-W / 2 + 26},0) scale(${dir === "ccw" ? -1 : 1},1)`}>
        <path
          d="M -7.7 5.6 A 9.5 9.5 0 1 1 7.7 5.6"
          fill="none"
          stroke="#c1651f"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path d="M 7.7 5.6 l 6.4 -2.4 l -2.6 8 z" fill="#c1651f" />
      </g>
      <text x={20} y={6} textAnchor="middle" fontSize="15" fontWeight="700" fill="#c1651f">
        {text}
      </text>
    </g>
  );
}

/** Schwebender Staub. Rot, wenn die Öffnung nach oben zeigt. */
function Dust({ danger }: { danger: boolean }) {
  const motes = [
    { x: 300, d: 0 },
    { x: 340, d: 0.7 },
    { x: 380, d: 1.4 },
    { x: 320, d: 2.1 },
    { x: 360, d: 2.8 },
  ];
  return (
    <g aria-hidden>
      {motes.map((m, i) => (
        <motion.circle
          key={i}
          cx={m.x}
          r={danger ? 3 : 2}
          fill={danger ? "#c1651f" : "#c9bda9"}
          initial={{ cy: 60, opacity: 0 }}
          animate={{ cy: [60, 190], opacity: [0, danger ? 0.95 : 0.5, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, delay: m.d, ease: "linear" }}
        />
      ))}
    </g>
  );
}
