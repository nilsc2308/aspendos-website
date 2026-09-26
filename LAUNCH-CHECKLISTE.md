# Aspendos Grill & Pizzeria — Umzug weg von Lovable

1:1-Kopie von https://aspendos.info (Stand 26.09.2026), ohne Lovable-Technik.
Reines HTML/CSS, keine Abhängigkeiten. Seiten neu erzeugen: `python3 _build.py`
(liest die gesicherten Originalseiten aus `_quelle/`). Lokal ansehen:
`python3 -m http.server 8771` im Ordner, dann http://localhost:8771

## Was geändert ist (bewusst, unsichtbar)
- Lovable-/React-Skripte und Lovable-Besucherstatistik (`~flock.js`) entfernt
- Schriften (Playfair Display, Inter) lokal statt von Google Fonts
- Fotos als JPEG statt 1,8-MB-PNG (sehen gleich aus, Seite lädt schneller)
- Cookie-Banner, Google-Karte und Allergen-Fenster per `main.js` nachgebaut –
  gleiche Optik, gleicher Speicher-Schlüssel (Besucher-Auswahl bleibt erhalten)
- `lang="de"` statt `en`, 404-Seite auf Deutsch

## Gestalterische Änderungen (auf Nils' Wunsch)
- 26.9.: Kapsel „Alles frisch zubereitet“ über der Startseiten-Überschrift ersetzt durch schlichte Goldzeile „Gyros · Schnitzel · Pizza“
- 26.9.: eigenes Seiten-Symbol (Favicon + Handy-App-Symbol) „Glut-Bogen“: Playfair-A unter einem Rundbogen (Theater von Aspendos), Glut-Rot mit Goldkante auf Kohle. Quelle: `_favicon.js`
- 26.9. abends: App-Version (PWA) gebaut und auf Nils' Wunsch am selben Abend wieder entfernt. `sw.js` ist nur noch ein Abschalt-Worker (löscht den Offline-Speicher bei Besuchern, die sie schon hatten) – einige Monate liegen lassen, dann löschen.

## Offen vor dem Umzug
- [ ] Hosting wählen und Dateien hochladen (alles außer `_quelle/`, `_build.py`, dieser Datei)
- [ ] Domain aspendos.info beim Domain-Anbieter auf das neue Hosting umstellen
      (DNS). Erst **danach** Lovable kündigen – sonst ist die Seite kurz offline.
      Prüfen, ob die Domain über Lovable gekauft wurde: dann erst Domain umziehen!
- [ ] Datenschutz: Abschnitt „Server-Logfiles“ nennt keinen Hoster → neuen Hoster
      mit Namen/Anschrift ergänzen (in `_quelle/datenschutz.raw.html`, dann `_build.py`)
- [ ] Fotos interior/kegelbahn/parkplatz sind KI-Bilder (1376×768, Gemini-Format) –
      bei Gelegenheit durch echte Fotos des Ladens ersetzen
- [ ] Hinweis: Nach unserem Standard bräuchte die Seite gar keinen Cookie-Banner
      (Karte lädt ohnehin erst per Klick). Für die 1:1-Kopie drin gelassen.
