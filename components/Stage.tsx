"use client";

import { motion } from "motion/react";
import type { HotspotId, SceneState } from "@/data/beats";

/* Werkbank in SVG-Koordinaten. Alles hier ist schematisch, nicht maßstäblich. */
const VIEW = { x: 130, y: 50, w: 585, h: 340 };
const PIVOT = { x: 240, y: 210 };

/**
 * „Nach unten" ist eine echte Vierteldrehung (90°), keine Andeutung: Beim Wechsel
 * zeigt die Bajonett-Öffnung senkrecht zum Boden. Alles andere wäre fachlich
 * irreführend – genau diese Haltung ist der Lerninhalt der Situation „haltung".
 */
const TILT = { up: -15, level: 0, down: 90 };

/**
 * Aufgerichtet ist die Kamera ein hoher, schmaler Turm statt eines breiten Riegels.
 * Der Versatz je Neigung rückt sie danach wieder in den Bildausschnitt – ohne ihn
 * stünde die Rückseite über dem oberen Rand und das Objektiv unter dem unteren.
 */
const TILT_SHIFT = {
  up: { x: 0, y: 18 },
  level: { x: 0, y: 18 },
  down: { x: 38, y: -60 },
};

const MOUNT = { x: 332, y: 210 };
const LENS_AT = { x: 387, y: 210 };
const HOOD_AT = { x: 480, y: 210 };
const CAP_FRONT_AT = { x: 449, y: 210 };

/* Abgelegte Objektive stehen senkrecht auf ihrem Frontdeckel – so, wie sie von der
   nach unten gehaltenen Kamera kommen. Deshalb nebeneinander statt übereinander. */
const SAFE_SPARE = { x: 566, y: 196 };
const SAFE_OLD = { x: 660, y: 196 };
const LOOSE = { x: 436, y: 158 };

/** Abstand Objektivmitte → Deckel entlang der optischen Achse (jetzt senkrecht). */
const CAP_GAP = 62;

/* Reihenfolge im Fach: erst die breite Sonnenblende, dann die drei Deckel. Der
   Abstand ist nach den Griffringen bemessen, nicht nach den Teilen – die Ringe
   sind deutlich größer und würden sich sonst überlappen. */
const TRAY = {
  hood: { x: 470, y: 322 },
  frontCapOld: { x: 570, y: 336 },
  rearCapSpare: { x: 620, y: 336 },
  frontCapSpare: { x: 670, y: 336 },
};

type Pose = { x: number; y: number; rotate: number };
type Hint = { cx?: number; cy?: number; rx: number; ry?: number };

/**
 * Griffring um ein Objektiv. Dreht mit dem Stück mit, deshalb `rx` entlang der
 * optischen Achse. Gegen die Achse versetzt, damit er das stehende Objektiv samt
 * Frontdeckel umschließt, statt den Deckel zu durchschneiden.
 */
const LENS_HINT: Hint = { cx: 0, cy: 8, rx: 76, ry: 54 };

/** Senkrecht abgelegt: Frontlinse nach unten, Bajonett nach oben. */
const STANDING = 90;

function rot(x: number, y: number, deg: number) {
  const r = (deg * Math.PI) / 180;
  const dx = x - PIVOT.x;
  const dy = y - PIVOT.y;
  return {
    x: PIVOT.x + dx * Math.cos(r) - dy * Math.sin(r),
    y: PIVOT.y + dx * Math.sin(r) + dy * Math.cos(r),
  };
}

function att(x: number, y: number, tilt: number, shift: { x: number; y: number }): Pose {
  const p = rot(x, y, tilt);
  return { x: p.x + shift.x, y: p.y + shift.y, rotate: tilt };
}

const spring = { type: "spring", stiffness: 170, damping: 22 } as const;

export default function Stage({
  scene,
  focus,
  live,
  spareVisible,
  onGrip,
}: {
  scene: SceneState;
  focus: { x: number; y: number; scale: number };
  live: HotspotId[];
  /** Wechselobjektiv samt Deckeln und Beschriftung erst zeigen, wenn die Kamera gesichert ist. */
  spareVisible: boolean;
  onGrip: (id: HotspotId) => void;
}) {
  const tilt = TILT[scene.tilt];
  const shift = TILT_SHIFT[scene.tilt];

  // Sanftes Einblenden statt hartem Umschalten; unsichtbar auch klickdurchlässig.
  const spareStyle: React.CSSProperties = {
    opacity: spareVisible ? 1 : 0,
    transition: "opacity 700ms ease",
    pointerEvents: spareVisible ? undefined : "none",
  };
  const bodyOpen = scene.oldLens !== "mounted" && scene.spareLens === "safe";
  const k = focus.scale;

  // Zoom-Frame in der Szene halten: nie über den Rand hinaus, sonst ragen
  // Objekte halb aus dem Bild und wirken wie kaputte Interaktionsflächen.
  const halfW = VIEW.w / (2 * k);
  const halfH = VIEW.h / (2 * k);
  const cx = Math.min(Math.max(focus.x, VIEW.x + halfW), VIEW.x + VIEW.w - halfW);
  const cy = Math.min(Math.max(focus.y, VIEW.y + halfH), VIEW.y + VIEW.h - halfH);
  const tx = VIEW.x + VIEW.w / 2 - k * cx;
  const ty = VIEW.y + VIEW.h / 2 - k * cy;


  const oldLensPose: Pose =
    scene.oldLens === "safe"
      ? { ...SAFE_OLD, rotate: STANDING }
      : scene.oldLens === "loose"
        ? { ...LOOSE, rotate: STANDING }
        : att(LENS_AT.x, LENS_AT.y, tilt, shift);

  const spareLensPose: Pose =
    scene.spareLens === "safe"
      ? { ...SAFE_SPARE, rotate: STANDING }
      : att(LENS_AT.x, LENS_AT.y, tilt, shift);

  const hoodPose: Pose =
    scene.hood === "tray"
      ? { ...TRAY.hood, rotate: -90 }
      : att(HOOD_AT.x, HOOD_AT.y, tilt, shift);

  const frontCapOldPose: Pose =
    scene.frontCapOld === "off"
      ? { ...TRAY.frontCapOld, rotate: 0 }
      : scene.oldLens === "safe"
        ? { x: SAFE_OLD.x, y: SAFE_OLD.y + CAP_GAP, rotate: STANDING }
        : scene.oldLens === "loose"
          ? { x: LOOSE.x, y: LOOSE.y + CAP_GAP, rotate: STANDING }
          : att(CAP_FRONT_AT.x, CAP_FRONT_AT.y, tilt, shift);

  const rearCapSparePose: Pose =
    scene.rearCapSpare === "spare"
      ? { x: SAFE_SPARE.x, y: SAFE_SPARE.y - CAP_GAP, rotate: STANDING }
      : scene.rearCapSpare === "tray"
        ? { ...TRAY.rearCapSpare, rotate: 0 }
        : { x: SAFE_OLD.x, y: SAFE_OLD.y - CAP_GAP, rotate: STANDING };

  const frontCapSparePose: Pose =
    scene.frontCapSpare === "off"
      ? { ...TRAY.frontCapSpare, rotate: 0 }
      : scene.spareLens === "safe"
        ? { x: SAFE_SPARE.x, y: SAFE_SPARE.y + CAP_GAP, rotate: STANDING }
        : att(CAP_FRONT_AT.x, CAP_FRONT_AT.y, tilt, shift);

  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      preserveAspectRatio="xMidYMid meet"
      className="mx-auto block max-h-[48vh] w-full touch-manipulation select-none"
      role="group"
      aria-label="Werkbank mit Kamera, Objektiven, Deckeln und Sonnenblende – anfassbare Stellen sind hervorgehoben"
    >
      {/* Flache Fläche (kein Gradient), damit der Rand links/rechts nahtlos in den
          gleichfarbigen Container-Hintergrund übergeht, wenn die Höhe begrenzt wird. */}
      <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} fill="#fbeada" />

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
        {/* Werkbankkante – nur unter der Ablageseite. Über die volle Breite würde sie
            die senkrecht gehaltene Kamera durchschneiden, als steckte sie im Tisch. */}
        <line x1="388" y1="300" x2={VIEW.x + VIEW.w} y2="300" stroke="#e0d3c2" strokeWidth="2" />

        {/* Ablage-Zone für lose Teile. Liegt rechts, damit die nach unten gehaltene
            Kamera die linke Hälfte in voller Höhe für sich hat. */}
        <rect x="388" y="302" width="314" height="78" rx="10" fill="#f1e2d0" opacity="0.6" />
        <text x="392" y="374" fill="#a99a86" fontSize="11" letterSpacing="1.6">
          ABLAGE
        </text>

        {/* Sichere Fläche mit dem Wechselobjektiv – zwei Stellplätze nebeneinander,
            weil senkrecht stehende Objektive übereinander nicht hineinpassen. */}
        <rect
          x="520"
          y="100"
          width="186"
          height="196"
          rx="12"
          fill="#f6f4f0"
          stroke="#d9cbba"
          strokeWidth="2"
          strokeDasharray="7 5"
        />
        <text
          x="613"
          y="92"
          textAnchor="middle"
          fill="#a99a86"
          fontSize="11"
          letterSpacing="1.4"
          style={spareStyle}
        >
          WECHSELOBJEKTIV
        </text>

        {/* Staub – nur wenn die Öffnung nicht nach unten zeigt */}
        {scene.tilt !== "down" && <Dust danger={scene.tilt === "up"} />}

        {/* --- Gehäuse ------------------------------------------------- */}
        <g
          style={{
            transform: `translate(${shift.x}px, ${shift.y}px) rotate(${tilt}deg)`,
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
          {/* Statusanzeige, kein Aufdruck: bleibt waagrecht, auch wenn die Kamera
              senkrecht gehalten wird – hochkant wäre „REC" bzw. „OFF" unlesbar. */}
          <g style={{ transform: `rotate(${-tilt}deg)`, transformBox: "view-box", transformOrigin: "286px 140px" }}>
            <text x="286" y="144" fill="#9aa3b2" fontSize="11" fontWeight="600">
              {scene.power === "on" ? "REC" : "OFF"}
            </text>
          </g>

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

        {/* --- Wechselobjektiv (erscheint erst nach gesicherter Kamera) -- */}
        <g style={spareStyle}>
          <Piece pose={spareLensPose}>
            <Hotspot
              id="spare-lens"
              live={live.includes("spare-lens")}
              onGrip={onGrip}
              label="Wechselobjektiv ansetzen"
              hint={LENS_HINT}
            >
              <Lens tone="spare" indexOn={scene.spareLens !== "safe"} locked={scene.spareLens === "locked"} />
            </Hotspot>
          </Piece>
        </g>

        {/* Altes Objektiv als Griff, sobald es lose ist */}
        {scene.oldLens === "loose" && (
          <Piece pose={oldLensPose}>
            <Hotspot
              id="old-lens"
              live={live.includes("old-lens")}
              onGrip={onGrip}
              label="Altes Objektiv sicher ablegen"
              hint={LENS_HINT}
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
            <rect x="-20" y="-56" width="40" height="112" fill="transparent" />
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
            <Cap label="V" spin={frontCapOldPose.rotate} />
          </Hotspot>
        </Piece>

        <g style={spareStyle}>
          <Piece pose={rearCapSparePose}>
            <Hotspot
              id="rear-cap-spare"
              live={live.includes("rear-cap-spare")}
              onGrip={onGrip}
              label="Hinterer Objektivdeckel"
              hint={{ cx: 0, cy: 0, rx: 22, ry: 50 }}
            >
              <Cap label="H" spin={rearCapSparePose.rotate} />
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
              <Cap label="V" spin={frontCapSparePose.rotate} />
            </Hotspot>
          </Piece>
        </g>

        {/* --- Drehen --------------------------------------------------- */}
        {/* Beide Drehrichtungen sind nur bei nach unten gehaltener Kamera dran; dort
            ist rechts neben dem Kameraturm der einzige freie Streifen – deshalb
            untereinander statt nebeneinander. */}
        {(live.includes("rotate-ccw") || live.includes("rotate-cw")) && (
          <g>
            {live.includes("rotate-ccw") && (
              <RotateGrip id="rotate-ccw" dir="ccw" onGrip={onGrip} x={446} y={196} />
            )}
            {live.includes("rotate-cw") && (
              <RotateGrip id="rotate-cw" dir="cw" onGrip={onGrip} x={446} y={252} />
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
 *
 * Drehung und Verschiebung in einer Transform um den Nullpunkt: Jedes Teil ist um
 * (0,0) herum gezeichnet, also dreht es um die eigene Mitte. Eine getrennte
 * Innendrehung um `fill-box`/`center` verschob die Teile – deren Mitte ist die
 * Mitte des Bounding-Box inklusive unsichtbarer Trefferflächen, nicht (0,0).
 */
function Piece({ pose, children }: { pose: Pose; children: React.ReactNode }) {
  return (
    <g
      style={{
        transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotate}deg)`,
        transformBox: "view-box",
        transformOrigin: "0px 0px",
        transition: "transform 520ms cubic-bezier(0.3,0,0.2,1)",
      }}
    >
      {children}
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
 *
 * `spin` ist die Drehung des umgebenden Stücks. Die Kappe dreht mit, ihr Buchstabe
 * nicht – „H" und „V" auf der Seite liegend sind nicht mehr lesbar.
 */
function Cap({ label, spin = 0 }: { label: string; spin?: number }) {
  return (
    <g>
      <circle cx="0" cy="0" r="26" fill="transparent" />
      <ellipse cx="2" cy="0" rx="13" ry="40" fill="#8f4715" />
      <ellipse cx="-1" cy="0" rx="12" ry="38" fill="#c1651f" />
      <rect x="-5" y="-22" width="9" height="7" rx="3.5" fill="#8f4715" opacity="0.75" />
      <rect x="-5" y="15" width="9" height="7" rx="3.5" fill="#8f4715" opacity="0.75" />
      <g transform={`rotate(${-spin})`}>
        <text x="0" y="5" textAnchor="middle" fill="#fbeada" fontSize="13" fontWeight="700">
          {label}
        </text>
      </g>
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
  // Nicht aktiv = komplett klickdurchlässig. Sonst fangen die unsichtbaren
  // Touch-Flächen (fill="transparent") Klicks ab und blockieren Elemente,
  // die darunter liegen – etwa die Sonnenblende hinter dem geschlossenen Deckel.
  if (!live) return <g style={{ pointerEvents: "none" }}>{children}</g>;
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
  const W = 124;
  const H = 42;
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
      {/* Rotations-Icon (rotate-left.png); für „nach rechts" gespiegelt */}
      <g transform={`translate(${-W / 2 + 22},0) scale(${dir === "cw" ? -1 : 1},1)`}>
        <image href="/rotate-left.png" x={-11} y={-11} width={22} height={22} />
      </g>
      <text x={17} y={5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#c1651f">
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
