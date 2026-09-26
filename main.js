// Interaktion der Aspendos-Website: Cookie-Banner, Google-Karte (nur mit Einwilligung)
// und Allergen-Fenster der Speisekarte. Markup und Klassen entsprechen der Lovable-Version.
(function () {
  const ROOT = document.currentScript.dataset.root || "";
  const KEY = "aspendos-consent-v2";
  const VERSION = 2;

  const svg = (cls, inner) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${inner}</svg>`;
  const ICON_X = (cls) => svg(`lucide lucide-x ${cls}`, '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>');
  const ICON_COOKIE = svg(
    "lucide lucide-cookie h-5 w-5",
    '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5v.01"></path><path d="M16 15.5v.01"></path><path d="M12 12v.01"></path><path d="M11 17v.01"></path><path d="M7 14v.01"></path>'
  );

  /* ---------- Einwilligung ---------- */

  function readConsent() {
    try {
      const c = JSON.parse(localStorage.getItem(KEY) || "null");
      return c && c.version === VERSION ? c : null;
    } catch (e) {
      return null;
    }
  }

  function saveConsent(maps) {
    const c = { categories: { necessary: true, maps: !!maps }, decidedAt: new Date().toISOString(), version: VERSION };
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch (e) {}
    applyConsent(c);
  }

  const BTN_GHOST = "rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary";
  const BTN_MAIN =
    "rounded-full bg-[image:var(--gradient-ember)] px-5 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-warm)] transition-transform hover:scale-[1.02]";

  let banner = null;

  function openBanner(showDetails) {
    closeBanner();
    const mapsOn = !!(readConsent() || { categories: {} }).categories.maps;
    banner = document.createElement("div");
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "false");
    banner.setAttribute("aria-labelledby", "consent-title");
    banner.setAttribute("aria-describedby", "consent-desc");
    banner.className = "fixed inset-x-0 bottom-0 z-50 px-4 pb-4 md:px-8 md:pb-6";

    const render = (details) => {
      banner.innerHTML =
        `<div class="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card/95 p-5 shadow-[var(--shadow-warm)] backdrop-blur-md md:p-7">` +
        `<div class="flex items-start gap-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-ember)] text-primary-foreground">${ICON_COOKIE}</span>` +
        `<div class="flex-1"><h2 id="consent-title" class="font-display text-lg font-semibold text-foreground">Wir respektieren deine Privatsphäre</h2>` +
        `<p id="consent-desc" class="mt-2 text-sm leading-relaxed text-foreground/80">Wir verwenden nur technisch notwendige Speicher&shy;mechanismen, damit unsere Webseite funktioniert. Mit deiner Einwilligung laden wir zusätzlich die Karte von Google Maps, um dir die Anfahrt zu zeigen. Dabei werden Daten (u. a. deine IP-Adresse) an Google in Drittländer (USA) übertragen. Du kannst deine Auswahl jederzeit unter <a href="${ROOT}datenschutz/" class="text-gold underline-offset-4 hover:underline">Datenschutz</a> ändern. Eine Ablehnung hat keine Nachteile.</p></div>` +
        `<button type="button" data-act="close" aria-label="Banner schließen ohne Einwilligung" class="rounded-full p-1 text-foreground/60 transition-colors hover:bg-secondary hover:text-foreground">${ICON_X("h-4 w-4")}</button></div>` +
        (details
          ? `<div class="mt-5 space-y-3 rounded-xl border border-border bg-background/40 p-4">` +
            `<label class="flex cursor-pointer items-start gap-3"><input class="mt-1 h-4 w-4 accent-[color:var(--ember)] disabled:opacity-60" disabled type="checkbox" checked><span class="flex-1"><span class="block text-sm font-semibold text-foreground">Notwendig</span><span class="block text-xs leading-relaxed text-foreground/65">Speichert deine Cookie-Auswahl. Ohne diese funktioniert das Banner nicht.</span></span></label>` +
            `<label class="flex cursor-pointer items-start gap-3"><input data-maps class="mt-1 h-4 w-4 accent-[color:var(--ember)] disabled:opacity-60" type="checkbox"${mapsOn ? " checked" : ""}><span class="flex-1"><span class="block text-sm font-semibold text-foreground">Google Maps</span><span class="block text-xs leading-relaxed text-foreground/65">Lädt die interaktive Karte auf der Kontaktseite. Anbieter: Google Ireland Ltd.</span></span></label></div>`
          : "") +
        `<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center">` +
        `<button data-act="toggle" class="text-sm font-medium text-foreground/70 underline-offset-4 hover:underline sm:mr-auto">${details ? "Details ausblenden" : "Einstellungen"}</button>` +
        (details ? `<button data-act="save" class="${BTN_GHOST}">Auswahl speichern</button>` : "") +
        `<button data-act="reject" class="${BTN_GHOST}">Ablehnen</button>` +
        `<button data-act="accept" class="${BTN_MAIN}">Alle akzeptieren</button></div></div>`;
    };
    render(showDetails);

    banner.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]");
      if (!act) return;
      switch (act.dataset.act) {
        case "toggle":
          return render(!banner.querySelector("[data-maps]"));
        case "save":
          saveConsent(banner.querySelector("[data-maps]").checked);
          break;
        case "accept":
          saveConsent(true);
          break;
        default: // close, reject
          saveConsent(false);
      }
      closeBanner();
    });
    document.body.appendChild(banner);
  }

  function closeBanner() {
    if (banner) banner.remove();
    banner = null;
  }

  /* ---------- Google-Karte (Kontaktseite) ---------- */

  const mapBox = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Karte laden");
  const mapWrap = mapBox && mapBox.closest(".overflow-hidden");
  const placeholder = mapWrap && mapWrap.innerHTML;
  const mapQuery = mapWrap && new URL(mapWrap.querySelector("a[href*='google.com/maps']").href).searchParams.get("destination");

  function applyConsent(c) {
    if (!mapWrap) return;
    const on = !!(c && c.categories.maps);
    const shown = !!mapWrap.querySelector("iframe");
    if (on && !shown) {
      mapWrap.innerHTML = `<iframe title="Karte — Aspendos Grill &amp; Pizzeria" src="https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" class="h-full min-h-[500px] w-full"></iframe>`;
    } else if (!on && shown) {
      mapWrap.innerHTML = placeholder;
    }
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || (banner && banner.contains(b))) return;
    const label = b.textContent.trim();
    if (label === "Karte laden") saveConsent(true);
    else if (label === "Cookie-Einstellungen" || (mapWrap && mapWrap.contains(b) && label === "Einstellungen")) openBanner(true);
  });

  const consent = readConsent();
  applyConsent(consent);
  if (!consent) openBanner(false);

  /* ---------- Allergen-Fenster (Speisekarte) ---------- */

  let lastFocus = null;

  function openDish(tpl) {
    lastFocus = document.activeElement;
    const overlay = document.createElement("div");
    overlay.setAttribute("aria-hidden", "true");
    overlay.dataset.state = "open";
    overlay.className =
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";
    const dlg = document.createElement("div");
    dlg.setAttribute("role", "dialog");
    dlg.setAttribute("aria-modal", "true");
    dlg.setAttribute("aria-labelledby", "dish-title");
    if (tpl.content.querySelector("#dish-desc")) dlg.setAttribute("aria-describedby", "dish-desc");
    dlg.dataset.state = "open";
    dlg.tabIndex = -1;
    dlg.className =
      "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg max-w-lg";
    dlg.appendChild(tpl.content.cloneNode(true));

    const close = () => {
      overlay.dataset.state = dlg.dataset.state = "closed";
      document.removeEventListener("keydown", onKey);
      setTimeout(() => {
        overlay.remove();
        dlg.remove();
        document.body.style.overflow = "";
        if (lastFocus) lastFocus.focus();
      }, 150);
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const f = dlg.querySelectorAll("button, a[href]");
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    overlay.addEventListener("click", close);
    dlg.querySelectorAll("button").forEach((b) => b.addEventListener("click", close));
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    document.body.append(overlay, dlg);
    dlg.focus();
  }

  document.querySelectorAll("li > button.group + template").forEach((tpl) => {
    tpl.previousElementSibling.addEventListener("click", () => openDish(tpl));
  });
})();
