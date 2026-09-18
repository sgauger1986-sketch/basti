// Rendert beipackzettel.html als A4-PDF und erzeugt Seitenvorschauen (PNG).
// Aufruf: node render.js [ausgabe-ordner]
// Benötigt: npm install playwright (Chromium wird von Playwright bereitgestellt).
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

(async () => {
  const outDir = path.resolve(process.argv[2] || __dirname);
  fs.mkdirSync(outDir, { recursive: true });
  const html = "file://" + path.resolve(__dirname, "beipackzettel.html");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
  await page.goto(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  // Layout-Prüfung: Inhalt darf die Seite nicht überlaufen.
  const report = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll(".page").forEach((pg, i) => {
      const r = pg.getBoundingClientRect();
      const foot = pg.querySelector(".foot");
      const prev = foot.previousElementSibling;
      const gap = foot.getBoundingClientRect().top - prev.getBoundingClientRect().bottom;
      let overflow = 0;
      pg.querySelectorAll("*").forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.bottom > r.bottom + 0.5) overflow = Math.max(overflow, b.bottom - r.bottom);
      });
      out.push({ page: i + 1, freeBeforeFooterPx: Math.round(gap), overflowPx: Math.round(overflow) });
    });
    return out;
  });
  console.log("Layout-Prüfung:", JSON.stringify(report));

  await page.pdf({
    path: path.join(outDir, "Trittwerk-Beipackzettel-Tierorthesen.pdf"),
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await page.emulateMedia({ media: "print" });
  const pages = await page.$$(".page");
  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({ path: path.join(outDir, `seite-${i + 1}.png`) });
  }
  await browser.close();
  console.log("Fertig:", outDir);
})();
