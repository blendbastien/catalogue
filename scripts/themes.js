/* Boutique — thèmes des événements du Catalogue : couleurs d'accent + décor animé léger (transformations CSS seulement). */
import { nrm } from "./shop-data.js";
/* k : type de décor (voir boutique.css, .bq-decor.k-*) */
export const THEMES = {
  "nouvel an": { a: "#ffd76a", b: "#ff6bd5", k: "spark", glyph: "fa-champagne-glasses" },
  "nouvel an lunaire": { a: "#ff4d4d", b: "#ffcf5a", k: "lantern", glyph: "fa-dragon" },
  "fetes d'hiver": { a: "#bfe9ff", b: "#7cc4ff", k: "stream", glyph: "fa-star" },
  "nuit des masques": { a: "#c084fc", b: "#22d3ee", k: "mask", glyph: "fa-masks-theater" },
  "fete des oeufs": { a: "#fda4af", b: "#a7f3d0", k: "egg", glyph: "fa-egg" },
  "saison des plages": { a: "#22d3ee", b: "#fde68a", k: "bubble", glyph: "fa-umbrella-beach" },
  "fete des lumieres": { a: "#ffe08a", b: "#ffb84a", k: "bokeh", glyph: "fa-lightbulb" },
  "jour des morts": { a: "#ff9f1c", b: "#e879f9", k: "marigold", glyph: "fa-skull" },
  "fete des couleurs": { a: "#f472b6", b: "#60a5fa", k: "powder", glyph: "fa-palette" },
  "fete de l'eau": { a: "#38bdf8", b: "#a5f3fc", k: "drop", glyph: "fa-droplet" },
  "carnaval": { a: "#facc15", b: "#a855f7", k: "confetti", glyph: "fa-masks-theater" },
  "saint-valentin": { a: "#ff5f8a", b: "#ffc2d4", k: "heart", glyph: "fa-heart" },
  "floraison": { a: "#86efac", b: "#f9a8d4", k: "petal", glyph: "fa-seedling" },
  "solstice d'ete": { a: "#fbbf24", b: "#fb7185", k: "mote", glyph: "fa-sun" },
  "moisson": { a: "#f59e0b", b: "#b45309", k: "leaf", glyph: "fa-wheat-awn" },
  "fete de la biere": { a: "#fbbf24", b: "#fef3c7", k: "beer", glyph: "fa-beer-mug-empty" }
};
export const themeOf = ev => ev ? THEMES[nrm(ev)] || { a: "#e9cf8e", b: "#7cc4ff", k: "mote", glyph: "fa-star" } : null;
/** décor : 26 éléments placés au hasard (graine fixe par événement, pas de saut à chaque rendu) */
export function decorHTML(ev) {
  const t = themeOf(ev); if (!t) return ""; let seed = [...nrm(ev)].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7); const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const bits = Array.from({ length: 26 }, () => `<i style="--x:${(rnd() * 100).toFixed(1)}%;--s:${(0.5 + rnd() * 0.9).toFixed(2)};--d:${(9 + rnd() * 14).toFixed(1)}s;--dl:${(-rnd() * 20).toFixed(1)}s;--h:${Math.round(rnd() * 360)}"></i>`).join("");
  return `<div class="bq-decor k-${t.k}" aria-hidden="true">${bits}</div>`;
}

/** décor permanent façon « flux des étoiles » (ORV) : fragments lumineux qui montent, deux étoiles filantes, une constellation discrète.
 * Graine fixe (pas de saut à chaque rendu) ; animations en transform/opacity seulement. */
export function ambHTML() {
  let seed = 20250417; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const frag = Array.from({ length: 16 }, (_, i) => `<i class="fr${i % 3 === 0 ? " g" : ""}" style="--x:${(rnd() * 100).toFixed(1)}%;--s:${(0.6 + rnd() * 0.8).toFixed(2)};--d:${(14 + rnd() * 16).toFixed(1)}s;--dl:${(-rnd() * 30).toFixed(1)}s"></i>`).join("");
  const pts = [[8, 30], [22, 12], [38, 26], [52, 8], [70, 22], [86, 10]]; const line = pts.map(p => p.join(",")).join(" ");
  const cons = `<svg class="cons" viewBox="0 0 100 40" preserveAspectRatio="none"><polyline points="${line}"/>${pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9"/>`).join("")}</svg>`;
  return `<div class="bq-amb" aria-hidden="true">${cons}${frag}<b class="sh s1"></b><b class="sh s2"></b></div>`;
}
