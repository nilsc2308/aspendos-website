// Aufruf: npm i opentype.js && node _favicon.js  → schreibt bogen.svg (=favicon.svg), touch.svg (App-Symbol)
// Erzeugt Favicon-Entwürfe für Aspendos: Playfair-„A“ als Pfad + Bogen-Motiv (Theater von Aspendos)
const o = require("opentype.js");
const fs = require("fs");
const font = o.loadSync("_favicon-playfair-black.ttf"); // Playfair Display Black

const C = { ember1: "#b00727", ember2: "#e23726", gold: "#e8aa4e", cream: "#f6f1e9", char1: "#21170f", char2: "#0b0605" };

// „A“ zentriert in eine Box (cx, Grundlinie, Höhe)
function letterA(cx, baseline, capH) {
  const size = capH / 0.71; // Versalhöhe ≈ 71 % der Schriftgröße
  const g = font.charToGlyph("A");
  const bb = g.getPath(0, 0, size).getBoundingBox();
  const x = cx - (bb.x1 + bb.x2) / 2;
  return g.getPath(x, baseline, size).toPathData(2);
}

// Bogen: Rechteck mit Halbkreis oben (wie ein Rundbogen des Theaters)
function archPath(cx, top, w, bottom) {
  const r = w / 2, l = cx - r, rr = cx + r;
  return `M${l} ${bottom}V${top + r}A${r} ${r} 0 0 1 ${rr} ${top + r}V${bottom}Z`;
}

const defs = `<defs>
<linearGradient id="e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.ember1}"/><stop offset="1" stop-color="${C.ember2}"/></linearGradient>
<linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.char1}"/><stop offset="1" stop-color="${C.char2}"/></linearGradient>
</defs>`;
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}${body}</svg>`;

const variants = {
  // 1: Glut-Bogen auf Kohle, cremefarbenes A im Bogen, feine Goldkante
  bogen: svg(
    `<rect width="512" height="512" rx="112" fill="url(#c)"/>` +
      `<path d="${archPath(256, 52, 352, 470)}" fill="url(#e)"/>` +
      `<path d="${archPath(256, 52, 352, 470)}" fill="none" stroke="${C.gold}" stroke-width="12"/>` +
      `<path d="${letterA(256, 418, 244)}" fill="${C.cream}"/>`
  ),
  // 2: nur Glut-Fläche mit A – maximal kräftig
  glut: svg(`<rect width="512" height="512" rx="112" fill="url(#e)"/><path d="${letterA(256, 380, 250)}" fill="${C.cream}"/>`),
  // 3: Kohle mit goldenem Bogen-Umriss und goldenem A – edel, zurückhaltend
  gold: svg(
    `<rect width="512" height="512" rx="112" fill="url(#c)"/>` +
      `<path d="${archPath(256, 66, 328, 456)}" fill="none" stroke="${C.gold}" stroke-width="22"/>` +
      `<path d="${letterA(256, 404, 220)}" fill="${C.gold}"/>`
  ),
};
variants.touch = variants.bogen.replace('rx="112"', '');
for (const [n, s] of Object.entries(variants)) fs.writeFileSync(`${n}.svg`, s);

// Vorschaublatt: jede Variante in Tab-Größe auf hellem/dunklem Tab und als App-Symbol
const tab = (n, dark) =>
  `<div class="tab ${dark ? "d" : ""}"><img src="${n}.svg" width="16" height="16"><span>Aspendos Grill &amp; Pizzeria</span></div>`;
const html = `<!doctype html><meta charset=utf-8><style>
body{margin:0;padding:32px;font:14px system-ui;background:#f4f1ec;color:#222;display:flex;gap:40px}
.col{display:flex;flex-direction:column;gap:14px;align-items:flex-start}
h2{margin:0 0 4px;font:600 18px system-ui}
.tab{display:flex;gap:8px;align-items:center;background:#fff;border-radius:8px 8px 0 0;padding:8px 14px;width:230px;box-shadow:0 1px 3px #0002}
.tab.d{background:#2b2b2e;color:#eee}
.row{display:flex;gap:14px;align-items:end}
.app{border-radius:22%;box-shadow:0 6px 18px #0003}
</style>` +
  Object.keys(variants)
    .map(
      (n, i) =>
        `<div class=col><h2>${i + 1}. ${{ bogen: "Glut-Bogen", glut: "Glut", gold: "Gold-Bogen" }[n]}</h2>${tab(n)}${tab(n, 1)}<div class=row><img src="${n}.svg" width=16><img src="${n}.svg" width=32><img src="${n}.svg" width=48><img class=app src="${n}.svg" width=120></div></div>`
    )
    .join("");
fs.writeFileSync("preview.html", html);
