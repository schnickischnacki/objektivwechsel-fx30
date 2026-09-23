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

## v3 – Mikro-Iteration nach dem Usability-Test (23.09.2026)

Der Usability-Test (14./15.09.2026) lief mit dem Stand der Tags `usability-test-tp1`
(TP1) und `usability-test-tp2-tp3` (TP2, TP3; nach der kleinen Korrektur aus TP1).
Die überarbeitete Fassung liegt auf dem Zweig **`v3-nach-usability-test`**; `main`
und damit die Live-Fassung im Kurs sind unverändert.

| Befund aus dem Test | Änderung |
|---|---|
| B17 – Ausprobieren zählt als Fehler und steht auf der Urkunde; B10 – Zertifikat „zu leicht verdient" | **Fehler** (Sensor gefährdet: F1–F3) und **Umwege** (Griff war gerade nicht dran) getrennt. Umwege werden erklärt, zählen aber nicht. Das Zertifikat gibt es nur für einen Durchlauf ohne Fehler; Fehlerquote und Ausrutscher stehen nicht mehr darauf. |
| TP3: „jetzt pulsiert ja nur das, deswegen wird das so richtig sein" | Jeder Handlungsschritt hat mindestens zwei markierte Stellen (neue Umwege in Schritt 1, 2 und 5). Ringe ruhiger (gestrichelt, langsamer Puls). |
| TP3: „Ich weiß nicht, was dieses Licht hier ist"; TP1 las den Kreis am Sensor als Richtungswahl | Jede markierte Stelle trägt ein **neutrales Namensschild** (Ein/Aus, Release-Knopf, Sensor, vorderer Deckel …) – für richtige Griffe und Fallen gleich. |
| B27 – Ablage und Fläche fürs Wechselobjektiv nicht unterscheidbar, Zweck des Aufräumens unklar | Werkbank mit Tuch (Objektive) und Schale „Deckel & Sonnenblende"; Objektive tragen „neu" / „alt"; Aufräum-Schritt nennt den Zweck. |
| B08 – kein Zurück, um einen Schritt noch einmal anzusehen | **Schrittleiste** mit drei Abschnitten (Vorbereiten · Wechseln · Abschließen). Erledigte Schritte lassen sich als **Rückblick** öffnen: Bild im damaligen Zustand, was man gemacht hat und warum, Verweis in den Kurs. |
| Orientierung (TP2: „nicht so gut gerafft, was eigentlich gerade los ist"), Aufgabentypen | Einführung mit dem Ablauf auf einen Blick; Aufgabenkarte neben dem Bild mit Typ „Im Bild handeln" / „Frage beantworten"; Fragen neben statt unter dem Bild. |
| B16 / Kap. 7 – Übung als Abkürzung an den Abschnitten vorbei | Ergebnisanzeige und Rückblick verweisen je Punkt auf **Abschnitt 2c, Schritt N**. |
| B22 – Schrift zu klein | Grundschrift 17 px statt 16 px; größere Bedienelemente. |
| B13 – unklar, ob Website oder Hochschul-Tool | Kopfzeile „Übung zum Kurs Kameraschein · Modul 2"; Schlusszeile „Fenster schließen und im Kurs weitermachen". |
| Zertifikat im Zoom-Setting nicht gefunden | Bestätigung „Gespeichert – die PDF liegt in deinem Download-Ordner". |

Dazu die neue Darstellung: Werkstatt-Hintergrund, Kamera im Stil der FX30 (Display mit
Livebild, solange sie an ist; Lüftung; silbernes Bajonett), Objektive mit Zoom- und
Fokusring. Die Rückmeldung erscheint zusätzlich oben im Bild und blendet nach 4,5 s aus.

**Nicht erneut getestet.** Die Fassung ist aus den Befunden abgeleitet und im Browser
selbst geprüft (alle neun Schritte, Fehler- und Umweg-Pfade, Rückblick, Zertifikat,
1280 und 375 px, `next build` ohne Fehler). Live geht sie erst mit einem Merge nach `main`.

## Setup

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Produktionsbuild
```

## Deploy

Vercel deployt automatisch bei jedem Push auf `main` (bestehendes Projekt, keine
Env-Variablen). Der Link im Kurs zeigt auf diese Adresse – ein Push auf `main` ändert
also die Übung für alle, die sie im Kurs öffnen. Redeploy prüfen: Vercel-Dashboard → Projekt → „Deployments" –
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
| Bestwert (`localStorage`, Key `objektivwechsel-fx30:v3`) | `lib/storage.ts` |
| Farben/Schriften (Tokens der Moodle-Inline-Seiten) | `app/globals.css` |

Der Originalwortlaut der alten Kursseite steht in `data/beats.ts` als Kommentar
über jeder Situation; UI-Texte kürzen nur, sie ändern nichts Inhaltliches. Die
Verweise „Abschnitt 2c, Schritt N" folgen der Schrittliste der Kursseite 2c (Stand 02.09.2026).

## Fachliche Grundlage

Alle Sachinhalte stammen 1:1 aus der alten Moodle-Kursseite
„Objektiv wechseln (FX30)" (`Old Moodle Kurs/6_Kamera vorbereiten/Objektiv wechseln.html`).

**Reihenfolge-Toleranz** (bewusst gesetzt): Schritte 3/4 (Sonnenblende ab /
vorderen Deckel zu) und 11/12/13 (Aufräumschritte) sind untereinander frei,
alles andere strikt sequenziell. Die App erzwingt die Phasenfolge, nicht die
Detailreihenfolge innerhalb einer Phase.

## Bekannte offene Punkte

- Die drei Fehlhandlungen stammen aus der Konzeptvorgabe, nicht wörtlich aus der
  alten Kursseite – vor dem Studierenden-Einsatz mit Michael gegenklären.
  Die frühere Betragsangabe zur Sensor-Reinigung („rund 300 € beim Verleih",
  aus der Kursbesprechung, nicht gegengeprüft) ist am 02.08.2026 aus Startkarte
  und Fehlermeldung entfernt worden; beide Stellen sagen jetzt qualitativ
  „wird teuer".
- Die Szene bleibt am Ende in der nach unten geneigten Haltung. Die Quelle sagt
  nichts über ein Zurückneigen, deshalb wurde nichts erfunden.
- Alte Listen-Version: als Git-Tag `v1-listen-sortierung` und physisch unter
  `../Backups/objektivwechsel-fx30_v1_listen-sortierung_2026-07-17/` gesichert.
