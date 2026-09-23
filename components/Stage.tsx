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
  frontCapOld: { x: 598, y: 336 },
  rearCapSpare: { x: 642, y: 336 },
  frontCapSpare: { x: 684, y: 336 },
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
      <Werkstatt />

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
        {/* Ablage-Schale für lose Teile, vorn auf der Werkbank. Liegt rechts, damit
            die nach unten gehaltene Kamera die linke Hälfte für sich hat. */}
        <rect x="390" y="304" width="312" height="80" rx="14" fill="#e9e5de" stroke="#cfc7ba" strokeWidth="2" />
        <rect x="398" y="312" width="296" height="64" rx="10" fill="#dedad2" />
        <text x="404" y="376" fill="#9a8f80" fontSize="10" fontWeight="700" letterSpacing="1.3">
          DECKEL &amp; SONNENBLENDE
        </text>

        {/* Sichere Fläche: ein weiches Tuch hinten auf der Werkbank. Zwei Stellplätze
            nebeneinander, weil die Objektive senkrecht auf dem Frontdeckel stehen. */}
        <path d="M 516 262 L 710 262 L 716 300 L 510 300 Z" fill="#dbe6de" />
        <path d="M 522 266 L 704 266 L 709 296 L 517 296 Z" fill="none" stroke="#b7cbbd" strokeWidth="1.5" strokeDasharray="5 4" />

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
          <Kamerakoerper an={scene.power === "on"} />

          {/* Statusanzeige, kein Aufdruck: bleibt waagrecht, auch wenn die Kamera
              senkrecht gehalten wird – hochkant wäre „ON" bzw. „OFF" unlesbar. */}
          <circle cx="276" cy="139" r="5" fill={scene.power === "on" ? "#e0553f" : "#4a5566"} />
          <g style={{ transform: `rotate(${-tilt}deg)`, transformBox: "view-box", transformOrigin: "286px 140px" }}>
            <text x="286" y="144" fill={scene.power === "on" ? "#f2b8ad" : "#9aa3b2"} fontSize="11" fontWeight="700">
              {scene.power === "on" ? "ON" : "OFF"}
            </text>
          </g>

          {/* Bajonett (silberner Ring, von der Seite) + Sensor */}
          <ellipse cx={MOUNT.x} cy={MOUNT.y} rx="13" ry="52" fill="#b9c1ca" />
          <ellipse cx={MOUNT.x} cy={MOUNT.y} rx="10" ry="46" fill="#39424f" />
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
          <Lens tone="old" indexOn={false} spin={oldLensPose.rotate} />
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
              <Lens tone="spare" indexOn={scene.spareLens !== "safe"} locked={scene.spareLens === "locked"} spin={spareLensPose.rotate} />
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

        {/* Namen der markierten Stellen: neutral, für richtige Griffe wie für Fallen
            gleich. Sie sagen, was das ist – nicht, ob man es anfassen sollte. */}
        {live
          .filter((id) => id !== "rotate-ccw" && id !== "rotate-cw")
          .map((id) => {
            const at = labelAt(id, scene, tilt, shift);
            if (!at) return null;
            return <Namensschild key={id} x={at.x} y={at.y} text={HOTSPOT_NAME[id]} />;
          })}
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

/**
 * Objektiv von der Seite: Bajonett links (Metallring), Zoom- und Fokusring mit
 * Riffelung, Frontlinse rechts. Altes und Wechselobjektiv unterscheiden sich im
 * Farbring, damit man sie auf der Ablage auseinanderhält.
 */
function Lens({
  tone,
  indexOn,
  locked,
  spin = 0,
}: {
  tone: "old" | "spare";
  indexOn: boolean;
  locked?: boolean;
  /** Drehung des umgebenden Stücks – das Etikett bleibt waagrecht lesbar. */
  spin?: number;
}) {
  const body = tone === "old" ? "#2f3742" : "#3d4755";
  const ring = tone === "old" ? "#222932" : "#2c343f";
  const riffel = tone === "old" ? "#3b4552" : "#4a5566";
  const band = tone === "old" ? "#aab3bd" : "#e0b04f";
  return (
    <g transform="translate(-55,-42)">
      <rect x="0" y="2" width="110" height="80" rx="9" fill={body} />
      <rect x="0" y="2" width="110" height="10" rx="6" fill="#ffffff" opacity="0.07" />
      {/* Zoomring */}
      <rect x="16" y="0" width="34" height="84" rx="5" fill={ring} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={19 + i * 4.3} y="3" width="2" height="78" rx="1" fill={riffel} />
      ))}
      {/* Fokusring */}
      <rect x="58" y="4" width="24" height="76" rx="4" fill={ring} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={60.5 + i * 4.4} y="7" width="1.6" height="70" rx="0.8" fill={riffel} />
      ))}
      <rect x="88" y="3" width="4" height="78" fill={band} />
      {/* Frontlinse und Bajonett */}
      <ellipse cx="110" cy="42" rx="10" ry="40" fill="#1b2027" />
      <ellipse cx="110" cy="42" rx="7" ry="32" fill="#2c4a66" />
      <path d="M 108 20 Q 114 30 112 44" stroke="#9cc6ea" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
      <ellipse cx="0" cy="42" rx="9" ry="38" fill="#b9c1ca" />
      <ellipse cx="0" cy="42" rx="6" ry="31" fill="#2b3543" />
      {indexOn && <circle cx="8" cy="6" r="5" fill={locked ? "#c1651f" : "#ffd591"} stroke="#1e2530" strokeWidth="1" />}
      {/* Etikett „neu“ / „alt“: Seit dem Usability-Test (B27) sind beide Objektive
          auch auf der Ablage auseinanderzuhalten. */}
      <g transform={`translate(70,42) rotate(${-spin})`}>
        <rect x="-17" y="-9" width="34" height="18" rx="9" fill={tone === "old" ? "#f6f4f0" : "#e0b04f"} />
        <text x="0" y="4" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#1e2530">
          {tone === "old" ? "alt" : "neu"}
        </text>
      </g>
    </g>
  );
}

/**
 * Kamerakörper im Stil der FX30 von der linken Seite: kompakte Box mit
 * Oberteil und Zubehörschuh, eingeklapptem Display, Lüftungsschlitzen und
 * Akkufach hinten. Das Display zeigt ein Livebild, solange die Kamera an ist –
 * so ist der Schaltzustand auch ohne Beschriftung lesbar.
 */
function Kamerakoerper({ an }: { an: boolean }) {
  return (
    <g>
      <defs>
        <linearGradient id="ow-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#343d49" />
          <stop offset="1" stopColor="#1b2129" />
        </linearGradient>
      </defs>
      {/* Oberteil mit Zubehörschuh */}
      <rect x="204" y="118" width="44" height="10" rx="2" fill="#4a5360" />
      <rect x="196" y="126" width="96" height="28" rx="7" fill="#2b3340" />
      {/* Gehäuse */}
      <rect x="150" y="150" width="182" height="120" rx="15" fill="url(#ow-body)" />
      <rect x="156" y="152" width="170" height="6" rx="3" fill="#ffffff" opacity="0.08" />
      {/* Akkufach / Griffseite hinten */}
      <rect x="150" y="196" width="40" height="74" rx="12" fill="#151a21" />
      <rect x="158" y="208" width="4" height="50" rx="2" fill="#262d36" />
      {/* Eingeklapptes Display */}
      <rect x="198" y="164" width="84" height="58" rx="6" fill="#12161c" stroke="#3b4552" strokeWidth="2" />
      {an ? (
        <g>
          <rect x="203" y="169" width="74" height="48" rx="3" fill="#8fbbd9" />
          <rect x="203" y="197" width="74" height="20" rx="0" fill="#76a06a" />
          <circle cx="252" cy="190" r="7" fill="#f2c9a5" />
          <rect x="246" y="196" width="12" height="16" rx="3" fill="#e8743b" />
          <circle cx="209" cy="175" r="2.5" fill="#e0553f" />
        </g>
      ) : (
        <g>
          <rect x="203" y="169" width="74" height="48" rx="3" fill="#232a33" />
          <path d="M 212 214 L 238 172 L 250 172 L 224 214 Z" fill="#ffffff" opacity="0.05" />
        </g>
      )}
      {/* Lüftungsschlitze vorn oben */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="290" y={168 + i * 8} width="26" height="3.5" rx="1.75" fill="#12161c" />
      ))}
      <text x="292" y="232" fill="#7d8794" fontSize="10" fontWeight="700" letterSpacing="1.2">
        FX30
      </text>
    </g>
  );
}

/** Werkstatt-Hintergrund: Wand mit warmem Licht, Regal, Werkbank. Bleibt ruhig,
 *  damit die anfassbaren Stellen davor die Aufmerksamkeit bekommen. */
function Werkstatt() {
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="ow-wand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6eee2" />
          <stop offset="1" stopColor="#ecdfcb" />
        </linearGradient>
        <radialGradient id="ow-licht" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fffaf0" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fffaf0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ow-tisch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dcbc92" />
          <stop offset="1" stopColor="#c99f6c" />
        </linearGradient>
      </defs>
      <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} fill="url(#ow-wand)" />
      <ellipse cx="300" cy="170" rx="230" ry="150" fill="url(#ow-licht)" />
      {/* Regal oben rechts: Kamerakoffer und Tape */}
      <rect x="548" y="74" width="160" height="7" rx="2" fill="#b98f62" />
      <rect x="560" y="50" width="62" height="24" rx="5" fill="#3b4552" />
      <rect x="582" y="45" width="18" height="6" rx="3" fill="#2b3340" />
      <circle cx="652" cy="63" r="11" fill="#6aa1c7" />
      <circle cx="652" cy="63" r="4.5" fill="#ecdfcb" />
      <rect x="676" y="56" width="22" height="18" rx="3" fill="#e0b04f" />
      {/* Werkbank */}
      <rect x={VIEW.x} y="268" width={VIEW.w} height={VIEW.h - 218} fill="url(#ow-tisch)" />
      <rect x={VIEW.x} y="266" width={VIEW.w} height="5" fill="#b88c5c" />
      <path d={`M ${VIEW.x} 300 C 260 296, 330 306, 460 300 S 640 296, ${VIEW.x + VIEW.w} 302`} stroke="#c69b69" strokeWidth="1.5" fill="none" opacity="0.7" />
      <path d={`M ${VIEW.x} 338 C 240 332, 360 344, 500 338 S 660 334, ${VIEW.x + VIEW.w} 340`} stroke="#bf9362" strokeWidth="1.5" fill="none" opacity="0.6" />
    </g>
  );
}

/** Neutrale Namen der anfassbaren Stellen. */
const HOTSPOT_NAME: Record<HotspotId, string> = {
  power: "Ein/Aus",
  release: "Release-Knopf",
  "rotate-ccw": "",
  "rotate-cw": "",
  hood: "Sonnenblende",
  "front-cap-old": "vorderer Deckel",
  "rear-cap-spare": "hinterer Deckel",
  "front-cap-spare": "vorderer Deckel",
  "old-lens": "altes Objektiv",
  "spare-lens": "Wechselobjektiv",
  sensor: "Sensor",
};

/**
 * Wo das Namensschild einer markierten Stelle steht (SVG-Koordinaten). Von Hand
 * je Zustand gesetzt, damit sich die Schilder in keinem der neun Schritte
 * überdecken – im Browser für jeden Schritt nachgeprüft.
 */
function labelAt(
  id: HotspotId,
  scene: SceneState,
  tilt: number,
  shift: { x: number; y: number },
): { x: number; y: number } | null {
  const down = scene.tilt === "down";
  switch (id) {
    case "power": {
      const p = att(221, 139, tilt, shift);
      return down ? { x: p.x + 58, y: p.y } : { x: p.x, y: p.y - 40 };
    }
    case "release": {
      const p = att(316, 256, tilt, shift);
      return down ? { x: 186, y: p.y + 40 } : { x: p.x, y: p.y + 34 };
    }
    case "sensor": {
      const p = att(MOUNT.x + 3, MOUNT.y, tilt, shift);
      return { x: p.x, y: p.y + 44 };
    }
    case "hood": {
      if (scene.hood === "tray") return { x: TRAY.hood.x, y: TRAY.hood.y + 32 };
      const p = att(HOOD_AT.x, HOOD_AT.y, tilt, shift);
      return { x: p.x + 6, y: p.y - 70 };
    }
    case "front-cap-old": {
      if (scene.frontCapOld === "off") return { x: TRAY.frontCapOld.x, y: TRAY.frontCapOld.y - 50 };
      const p = att(CAP_FRONT_AT.x, CAP_FRONT_AT.y, tilt, shift);
      return { x: p.x, y: p.y + 62 };
    }
    case "rear-cap-spare":
      if (scene.rearCapSpare === "spare") return { x: SAFE_SPARE.x, y: SAFE_SPARE.y - CAP_GAP - 30 };
      if (scene.rearCapSpare === "tray") return { x: TRAY.rearCapSpare.x - 8, y: TRAY.rearCapSpare.y - 48 };
      return null;
    case "front-cap-spare": {
      if (scene.spareLens === "safe") return { x: SAFE_SPARE.x, y: SAFE_SPARE.y + CAP_GAP + 34 };
      const p = att(CAP_FRONT_AT.x, CAP_FRONT_AT.y, tilt, shift);
      return { x: p.x, y: p.y - 56 };
    }
    case "old-lens":
      return { x: LOOSE.x, y: LOOSE.y - 72 };
    case "spare-lens":
      return scene.spareLens === "safe" ? { x: SAFE_SPARE.x, y: SAFE_SPARE.y - 74 } : null;
    default:
      return null;
  }
}

/** Namensschild einer markierten Stelle. Wandert mit, wenn sich die Szene bewegt. */
function Namensschild({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 6.9 + 20;
  return (
    <g
      aria-hidden
      style={{
        pointerEvents: "none",
        transform: `translate(${x}px, ${y}px)`,
        transformBox: "view-box",
        transformOrigin: "0px 0px",
        transition: "transform 520ms cubic-bezier(0.3,0,0.2,1)",
      }}
    >
      <rect x={-w / 2} y={-11} width={w} height="22" rx="11" fill="#1e2530" opacity="0.9" stroke="#ffffff" strokeWidth="1.5" />
      <text x="0" y="4.5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
        {text}
      </text>
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
      <ellipse cx={cx} cy={cy} rx={rx} ry={yr} fill="none" stroke="#ffffff" strokeWidth={6} opacity={0.7} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={yr} fill="none" stroke="#c1651f" strokeWidth={3} strokeDasharray="7 4" />
      <motion.ellipse
        cx={cx}
        cy={cy}
        fill="none"
        stroke="#c1651f"
        strokeWidth={2.5}
        initial={{ rx, ry: yr, opacity: 0.45 }}
        animate={{ rx: rx + 9, ry: yr + 9, opacity: 0 }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
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
