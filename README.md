# Objektivwechsel FX30 – virtuelle Übung

Standalone-Web-App für den Moodle-Kurs zur Kamerascheinprüfung (HS Ansbach).
Sie lässt den **Objektivwechsel an der Sony FX30 virtuell hands-on durchspielen**:
Man handelt direkt an einer animierten Szene (Schalter, Sonnenblende, Release,
Objektive, Deckel), statt Textzeilen zu sortieren. In den Ablauf sind drei kurze
Mikro-Checks eingewoben, die das „Warum" abrufen (Testing-Effekt).

Fehlhandlungen (Kamera nach oben neigen, Sensor berühren, bei laufender Kamera
öffnen) sind echte, wählbare Handlungen in der Szene. Sie zeigen kurz die ehrliche
Konsequenz, werden dann zurückgenommen – **kein harter Neustart**. Am Ende fasst
der Abschlussscreen die Ausrutscher zusammen.

## Setup

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Produktionsbuild
```

## Deploy

Vercel deployt automatisch bei jedem Push auf `main` (bestehendes Projekt, keine
Env-Variablen). Redeploy prüfen: Vercel-Dashboard → Projekt → „Deployments" –
der oberste Eintrag muss den letzten Commit-Hash tragen.

## Einbindung in Moodle: per Link, kein iframe

Die App wird als **Link/Button auf der Kursseite** hinterlegt (Text- und
Medien-Feld, Editor auf Quellcode umschalten, URL ersetzen):

```html
<a href="https://DEINE-URL.vercel.app"
   target="_blank" rel="noopener"
   style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;background:#c1651f;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:700;">
  Objektivwechsel virtuell üben &rarr;
</a>
```

Kein iframe, kein postMessage – die App steht für sich und ist ab 320 px Breite
voll bedienbar (Touch und Tastatur).

## Wo pflege ich was

| Was | Wo |
| --- | --- |
| Situationen, Mikro-Check-Fragen, Feedback- und Konsequenztexte, Toleranzen | `data/beats.ts` |
| Ablauf-/Konsequenz-Logik (rein, unit-testbar) | `lib/engine.ts` |
| Szene (SVG, Zoom, anfassbare Stellen) | `components/Stage.tsx` |
| Bestwert (`localStorage`, Key `objektivwechsel-fx30:v2`) | `lib/storage.ts` |
| Farben/Schriften (Tokens der Moodle-Inline-Seiten) | `app/globals.css` |

Der Originalwortlaut der alten Kursseite steht in `data/beats.ts` als Kommentar
über jeder Situation; UI-Texte kürzen nur, sie ändern nichts Inhaltliches.

## Fachliche Grundlage

Alle Sachinhalte stammen 1:1 aus der alten Moodle-Kursseite
„Objektiv wechseln (FX30)" (`Old Moodle Kurs/6_Kamera vorbereiten/Objektiv wechseln.html`).

**Reihenfolge-Toleranz** (bewusst gesetzt): Schritte 3/4 (Sonnenblende ab /
vorderen Deckel zu) und 11/12/13 (Aufräumschritte) sind untereinander frei,
alles andere strikt sequenziell. Die App erzwingt die Phasenfolge, nicht die
Detailreihenfolge innerhalb einer Phase.

## Bekannte offene Punkte

- Die drei Fehlhandlungen stammen aus der Konzeptvorgabe, nicht wörtlich aus der
  alten Kursseite. Der Sensor-Reinigungspreis („rund 300 € beim Verleih") ist eine
  Angabe aus der Kursbesprechung – vor dem Studierenden-Einsatz mit Michael
  gegenklären.
- Die Szene bleibt am Ende in der nach unten geneigten Haltung. Die Quelle sagt
  nichts über ein Zurückneigen, deshalb wurde nichts erfunden.
- Alte Listen-Version: als Git-Tag `v1-listen-sortierung` und physisch unter
  `../Backups/objektivwechsel-fx30_v1_listen-sortierung_2026-07-17/` gesichert.
