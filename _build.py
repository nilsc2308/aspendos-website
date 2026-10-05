#!/usr/bin/env python3
"""Baut die statische Aspendos-Website aus den gesicherten Lovable-Seiten in _quelle/.

Die Seiten sind 1:1 das serverseitig gerenderte HTML der Lovable-Version
(aspendos.info, Stand 26.09.2026). Entfernt wird nur die Lovable-/React-Technik;
Interaktion (Cookie-Banner, Karte, Allergen-Fenster) übernimmt main.js.
Aufruf: python3 _build.py
"""
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
                        f'<link rel="apple-touch-icon" href="{pre}apple-touch-icon.png"/></head>', 1)
    html = html.replace("</body>", f'<script src="{pre}main.js" data-root="{pre}" defer></script></body>')

    # Hinweis auf crestra im Fuß (wie bei CO2NSULTING)
    madeby = ('<div class="madeby-rahmen"><div class="madeby">'
              '<span>Diese Website gefällt Ihnen?</span>'
              '<a href="https://crestra.de" target="_blank" rel="noopener">Website von <b>crestra.de</b> →</a>'
              '<a href="mailto:info@crestra.de">info@crestra.de</a></div></div>')
    html, n = re.subn(r'(</div><div class="border-t border-white/10">)', r'</div>' + madeby.replace('\\', '\\\\') + '<div class="border-t border-white/10">', html, count=1)
    if page != "404":
        assert n == 1, page
    html = html.replace("</head>", f'<link rel="stylesheet" href="{pre}css/crestra.css"/></head>', 1)
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


if __name__ == "__main__":
    main()
