# Objektivwechsel FX30 – Übungswidget

Standalone-React-Widget für den Moodle-Kurs zur Kamerascheinprüfung (HS Ansbach).
Es übt den Objektivwechsel an der Sony FX30 als **Sequenzaufgabe**: 13 Schritte in der
richtigen Reihenfolge, drei Fallen dazwischen, sofortige visuelle Rückmeldung an einer
schematischen Set-Szene.

Abrufbasiert statt Wiedererkennen: Die Aktionsliste enthält alle 13 richtigen Schritte
plus drei Fallen in zufälliger Reihenfolge – wer die Reihenfolge nicht kann, sieht das
sofort.

## Setup

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Produktionsbuild
```

## Deploy

Vercel-Import ohne Env-Variablen: Repo importieren, Framework-Preset „Next.js" bestätigen,
deployen – es gibt kein Backend, keine Secrets, keine Datenbank.

## Einbau in Moodle

Text- und Medien-Feld anlegen, Editor auf Quellcode umschalten, einfügen und
`DEINE-URL.vercel.app` ersetzen:

```html
<iframe
  src="https://DEINE-URL.vercel.app"
  title="Übung: Objektivwechsel an der Sony FX30"
  width="100%"
  height="780"
  style="border:1px solid #e4dfd7;border-radius:14px;"
  loading="lazy"
  sandbox="allow-scripts allow-same-origin"
></iframe>
```

`allow-same-origin` wird für den `localStorage`-Bestwert gebraucht. Ohne das Attribut
läuft das Widget trotzdem, merkt sich aber nichts.

Bei Erfolg schickt das Widget zusätzlich
`postMessage({type:'objektivwechsel:done', errors:n})` an das Parent-Fenster – falls der
Aktivitätsabschluss in Moodle später daran gehängt werden soll. Ohne Empfänger passiert
schlicht nichts.

## Wo pflege ich was

| Was | Wo |
| --- | --- |
| Formulierungen der 16 Aktionen, Feedbacktexte, Reihenfolge, Toleranzgruppen | `data/actions.ts` |
| Regeln (was ist als Nächstes gültig, Reset, Fehlerzähler) | `lib/engine.ts` |
| Die SVG-Szene und ihre Zustände | `components/SetScene.tsx` |
| Farben und Schriften (Tokens der Moodle-Inline-Seiten) | `app/globals.css` |

Der Originalwortlaut der alten Kursseite steht in `data/actions.ts` als Kommentar über
jedem Schritt – die Button-Labels sind nur gekürzt, inhaltlich nicht verändert.

## Fachliche Grundlage

Alle Sachinhalte stammen 1:1 aus der alten Moodle-Kursseite
„Objektiv wechseln (FX30)" (`Old Moodle Kurs/6_Kamera vorbereiten/Objektiv wechseln.html`).
Die 13 Schritte und ihre Reihenfolge wurden gegen diese Quelle geprüft.

**Reihenfolge-Toleranz** (bewusst gesetzt, nicht aus der Quelle abgeleitet):
Schritte 3 und 4 (Sonnenblende ab / vorderen Deckel zu) sowie 11, 12 und 13
(altes Objektiv verschließen / Sonnenblende dran / vorderen Deckel ab) sind
untereinander in beliebiger Reihenfolge gültig. Alle anderen Schritte sind strikt
sequenziell.

## Bekannte offene Punkte

- Die drei Fallen stammen aus der Prompt-Vorgabe, nicht wörtlich aus der alten
  Kursseite. Der Sensor-Reinigungspreis („rund 300 € beim Verleih") ist eine Angabe aus
  der Kursbesprechung – vor dem Livegang mit Leuthner gegenklären.
- Die Szene bleibt am Ende in der nach unten geneigten Haltung. Die Quelle sagt nichts
  über ein Zurückneigen, deshalb wurde nichts erfunden.
- Kein xAPI/SCORM: Wenn der Aktivitätsabschluss in Moodle wirklich gesetzt werden soll,
  braucht es den `postMessage`-Empfänger auf der Kursseite.
