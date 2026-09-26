#!/usr/bin/env python3
"""Baut die statische Aspendos-Website aus den gesicherten Lovable-Seiten in _quelle/.

Die Seiten sind 1:1 das serverseitig gerenderte HTML der Lovable-Version
(aspendos.info, Stand 26.09.2026). Entfernt wird nur die Lovable-/React-Technik;
Interaktion (Cookie-Banner, Karte, Allergen-Fenster) übernimmt main.js.
Aufruf: python3 _build.py
"""
import hashlib
import json
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "_quelle")
DOMAIN = "https://aspendos.info"
PAGES = ["index", "speisekarte", "kegelbahn", "ueber-uns", "kontakt", "impressum", "datenschutz", "404"]


def out_path(page):
    if page in ("index", "404"):
        return os.path.join(ROOT, page + ".html")
    return os.path.join(ROOT, page, "index.html")


def transform(page, html):
    # 404.html wird unter beliebigen Adressen ausgeliefert, braucht daher absolute Pfade
    pre = {"index": "", "404": "/"}.get(page, "../")
    url = DOMAIN + "/" + ("" if page == "index" else page + "/")

    # Lovable-/React-Technik entfernen
    html = re.sub(r'<link rel="modulepreload"[^>]*/>', "", html)
    html = re.sub(r'<link rel="preconnect"[^>]*/>', "", html)
    html = re.sub(r'<script defer src="/~flock\.js"[^>]*></script>', "", html)
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S)
    html = html.replace("<!--$-->", "").replace("<!--/$-->", "").replace("<!-- -->", "")

    # Stile, Schriften (lokal statt Google Fonts), Bilder
    html = re.sub(r'<link rel="stylesheet" href="/assets/styles-[^"]+\.css"[^>]*/>',
                  f'<link rel="stylesheet" href="{pre}fonts/fonts.css"/><link rel="stylesheet" href="{pre}css/styles.css"/>', html)
    html = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*/>', "", html)
    html = re.sub(r'/__l5e/assets-v1/[0-9a-f-]+/([\w.-]+)', lambda m: pre + "img/" + m.group(1), html)
    html = re.sub(r'https://pub-[^"]+\.r2\.dev/[^"]+\.png', DOMAIN + "/img/og.png", html)

    # Kopfdaten
    html = html.replace('<html lang="en">', '<html lang="de">')
    html = re.sub(r'<meta property="og:url" content="[^"]*"/>', f'<meta property="og:url" content="{url}"/>', html)
    html = re.sub(r'<link rel="canonical" href="[^"]*"/>', f'<link rel="canonical" href="{url}"/>', html)

    # interne Links relativ, damit die Seite auf jeder Domain und in Unterordnern läuft
    def link(m):
        target = m.group(1)
        if target == "":
            return f'href="{pre or "./"}"'
        path, _, frag = target.partition("#")
        return f'href="{pre}{path}/' + (f"#{frag}" if frag else "") + '"'
    html = re.sub(r'href="/([a-z-]*(?:#[\w-]+)?)"', link, html)

    # eigenes Symbol für Browser-Tab, Lesezeichen und Handy-Startbildschirm (siehe _favicon.js)
    html = html.replace("</head>",
                        f'<link rel="icon" href="{pre}favicon.ico" sizes="48x48"/>'
                        f'<link rel="icon" href="{pre}favicon.svg" type="image/svg+xml"/>'
                        f'<link rel="apple-touch-icon" href="{pre}apple-touch-icon.png"/>'
                        # App-Version (PWA): installierbar, eigene Farbe in der Statusleiste
                        f'<link rel="manifest" href="{pre}manifest.webmanifest"/>'
                        '<meta name="theme-color" content="#120c09"/>'
                        '<meta name="mobile-web-app-capable" content="yes"/>'
                        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>'
                        '<meta name="apple-mobile-web-app-title" content="Aspendos"/></head>', 1)
    html = html.replace("</body>", f'<script src="{pre}main.js" data-root="{pre}" defer></script></body>')
    return html


def add_dish_dialogs(html):
    """Hängt jedem Gericht den Inhalt seines Allergen-Fensters als <template> an."""
    dialogs = json.load(open(os.path.join(SRC, "dialogs.json"), encoding="utf-8"))
    parts = re.split(r'(<li><button type="button" class="group.*?</button>)(?=</li>)', html, flags=re.S)
    buttons = parts[1::2]
    assert len(buttons) == len(dialogs), (len(buttons), len(dialogs))
    for i, content in enumerate(dialogs):
        content = content.replace('id="radix-_R_taqH1_"', 'id="dish-title"').replace('id="radix-_R_taqH2_"', 'id="dish-desc"')
        parts[2 * i + 1] = buttons[i] + f"<template>{content}</template>"
    return "".join(parts)


def main():
    for page in PAGES:
        html = open(os.path.join(SRC, f"{page}.raw.html"), encoding="utf-8").read()
        html = transform(page, html)
        if page == "404":
            html = (html.replace("Page not found", "Seite nicht gefunden")
                    .replace("The page you&#x27;re looking for doesn&#x27;t exist or has been moved.",
                             "Die gesuchte Seite gibt es nicht oder sie wurde verschoben.")
                    .replace(">Go home<", ">Zur Startseite<"))
        if page == "index":
            # Kapsel „Alles frisch zubereitet“ über der Überschrift ersetzt (wirkte wie Baukasten
            # und doppelte den ersten Vorteil darunter) – jetzt schlichte Zeile mit Goldstrich
            html, n = re.subn(
                r'<span class="inline-flex items-center gap-2 rounded-full border border-white/20[^"]*">'
                r'<svg[^>]*lucide-flame.*?</svg> Alles frisch zubereitet</span>',
                '<span class="inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-gold">'
                '<span class="h-px w-10" style="background:currentColor"></span>Gyros · Schnitzel · Pizza</span>',
                html, flags=re.S)
            assert n == 1
        if page == "speisekarte":
            html = add_dish_dialogs(html)
        dest = out_path(page)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        open(dest, "w", encoding="utf-8").write(html)
        print("✓", os.path.relpath(dest, ROOT))
    build_service_worker()


def build_service_worker():
    """Erzeugt sw.js: alle Seiten und Dateien für den Offline-Betrieb, Version = Prüfsumme des Inhalts."""
    urls = ["/"] + [f"/{p}/" for p in PAGES if p not in ("index", "404")]
    files = [os.path.join(ROOT, "index.html")] + [out_path(p) for p in PAGES if p not in ("index", "404")]
    for folder in ("css", "fonts", "img", "icons"):
        for name in sorted(os.listdir(os.path.join(ROOT, folder))):
            if name.startswith(".") or name == "og.png" or name.endswith(".svg") and folder == "icons":
                continue
            urls.append(f"/{folder}/{name}")
            files.append(os.path.join(ROOT, folder, name))
    for name in ("main.js", "manifest.webmanifest", "favicon.svg", "favicon.ico", "apple-touch-icon.png"):
        urls.append("/" + name)
        files.append(os.path.join(ROOT, name))
    digest = hashlib.sha256()
    for f in files:
        digest.update(open(f, "rb").read())
    sw = open(os.path.join(ROOT, "_sw-vorlage.js"), encoding="utf-8").read()
    sw = sw.replace("__VERSION__", digest.hexdigest()[:10]).replace("__FILES__", json.dumps(urls, indent=2))
    open(os.path.join(ROOT, "sw.js"), "w", encoding="utf-8").write(sw)
    print("✓ sw.js –", len(urls), "Dateien offline verfügbar")


if __name__ == "__main__":
    main()
