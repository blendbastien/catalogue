/* Boutique 3.6 — sélecteur d'objets du Catalogue, partagé par toute la suite (Boutique stellaire, Signal Quotidien, bannières du gacha).
 * Arbre des types › catégories › sous-catégories avec icônes 2D, recherche, rangs en pastilles, rareté, cartes visuelles,
 * onglet « Blocs de la Boutique » (un clic ajoute tout un bloc), panier de sélection en bas. Renvoie la liste des identifiants. */
import { esc, nrm, db, entry, shop, picOrIcon, catBg, catIcon3d, rankColor, rarColor, tierClass } from "./shop-data.js";
const { DialogV2 } = foundry.applications.api;
const fa = i => `<i class="fa-solid ${i}"></i>`;

export async function pickEntries({ title = "Choisir dans le Catalogue", multi = true, selected = [], blocks = true } = {}) {
  const d = db(); const items = d.items || []; if (!items.length) { ui.notifications.warn("Le Catalogue est vide."); return null; }
  const picked = new Set(selected || []); const S = shop(); const blk = blocks ? S.blocks.filter(b => (b.items || []).some(x => !x.tag)) : [];
  const types = (d.types || []).map(t => ({ ...t, cats: (d.cats || []).filter(c => c.type === t.id).map(c => ({ ...c, subs: (c.subs || []).map(x => typeof x === "string" ? x : x.name) })) }));
  const count = new Map(); for (const e of items) { count.set(e.t, (count.get(e.t) || 0) + 1); count.set(`${e.t}|${e.cat}`, (count.get(`${e.t}|${e.cat}`) || 0) + 1); count.set(`${e.t}|${e.cat}|${e.sub}`, (count.get(`${e.t}|${e.cat}|${e.sub}`) || 0) + 1); }
  const ranks = (d.ranks || []).map(r => r.id); const rars = (d.rars || []).map(r => r.name);
  const tree = `<a class="pk-tn all on" data-f="">${fa("fa-layer-group")}<span>Tout le Catalogue</span><em>${items.length}</em></a>` + types.map(t => `<div class="pk-tt"><a class="pk-tn t" data-f="${esc(t.id)}" style="--tc:${esc(t.color || "#5ee0ff")}"><i class="pk-tw fa-solid fa-chevron-right"></i><span>${esc(t.label || t.name)}</span><em>${count.get(t.id) || 0}</em></a>
    <div class="pk-tc">${t.cats.map(c => { const ic = catIcon3d(t.id, c.name); return `<a class="pk-tn c" data-f="${esc(`${t.id}|${c.name}`)}">${ic ? `<img src="${esc(ic)}">` : fa("fa-folder")}<span>${esc(c.name)}</span><em>${count.get(`${t.id}|${c.name}`) || 0}</em></a>${c.subs.map(s => `<a class="pk-tn s" data-f="${esc(`${t.id}|${c.name}|${s}`)}"><span>${esc(s)}</span><em>${count.get(`${t.id}|${c.name}|${s}`) || 0}</em></a>`).join("")}`; }).join("")}</div></div>`).join("");
  const card = e => { const P = picOrIcon(e); const cb = catBg(e); return `<a class="pk-card t-${tierClass(e.rang)}${picked.has(e.id) ? " on" : ""}" data-id="${esc(e.id)}" style="--rc:${rankColor(e.rang)};--rr:${rarColor(e.rar)}"><div class="pic ${cb.cls}" style="${cb.style}">${P.pic ? `<img src="${esc(P.pic)}" loading="lazy">` : ""}<span class="bq-rkb n${String(e.rang || "").length}"><b>${esc(e.rang)}</b></span><i class="pk-ok fa-solid fa-check"></i></div><b class="nm">${esc(e.n)}</b><small>${esc(e.cat || "")}${e.sub ? ` › ${esc(e.sub)}` : ""}</small>${e.rar ? `<em class="rar">${esc(e.rar)}</em>` : ""}</a>`; };
  const content = `<div class="pk"><aside class="pk-tree">${tree}</aside><section class="pk-main">
    <div class="pk-bar"><div class="pk-q">${fa("fa-magnifying-glass")}<input type="search" name="q" placeholder="Nom, identifiant, étiquette…" autocomplete="off"></div><select name="rar"><option value="">Toutes raretés</option>${rars.map(r => `<option>${esc(r)}</option>`).join("")}</select>${blk.length ? `<a class="pk-blkb" data-pk="blocks">${fa("fa-cubes")} Blocs de la Boutique</a>` : ""}</div>
    <div class="pk-ranks">${ranks.map(r => `<a data-r="${esc(r)}" style="--rc:${rankColor(r)}">${esc(r)}</a>`).join("")}</div>
    <div class="pk-info"><span class="pk-n"></span>${multi ? `<a data-pk="all">${fa("fa-check-double")} Tout ajouter</a><a data-pk="none">${fa("fa-xmark")} Retirer ces résultats</a>` : ""}</div>
    <div class="pk-grid"></div><div class="pk-blocks" hidden>${blk.map(b => `<a class="pk-blk" data-b="${esc(b.id)}"><b>${esc(b.name || "Bloc")}</b><small>${(b.items || []).filter(x => !x.tag).length} objets</small><span>${(b.items || []).filter(x => !x.tag).slice(0, 8).map(x => { const e = entry(x.id); const P = e ? picOrIcon(e) : null; return P?.pic ? `<img src="${esc(P.pic)}">` : ""; }).join("")}</span><em>${fa("fa-plus")} Ajouter tout le bloc</em></a>`).join("")}</div>
    <div class="pk-tray"><span class="pk-sel"></span><div class="pk-chips"></div></div></section></div>`;
  return DialogV2.wait({ window: { title, icon: "fa-solid fa-magnifying-glass" }, classes: ["bq-picker"], position: { width: Math.min(1180, innerWidth - 60), height: Math.min(780, innerHeight - 60) }, content,
    render: (ev, dlg) => { const root = dlg.element; const $ = s => root.querySelector(s); const grid = $(".pk-grid"); let F = "", R = new Set(), cur = [];
      const tray = () => { $(".pk-sel").textContent = `${picked.size} sélectionné${picked.size > 1 ? "s" : ""}`; $(".pk-chips").innerHTML = [...picked].slice(-40).map(id => { const e = entry(id); return e ? `<a data-rm="${esc(id)}" style="--rc:${rankColor(e.rang)}"><b>${esc(e.rang)}</b>${esc(e.n)}${fa("fa-xmark")}</a>` : ""; }).join("") + (picked.size > 40 ? `<small>+${picked.size - 40}</small>` : ""); };
      const run = () => { const q = nrm($('[name="q"]').value); const rar = $('[name="rar"]').value; const [t, c, s] = F ? F.split("|") : [];
        const all = items.filter(e => (!t || e.t === t) && (!c || e.cat === c) && (!s || e.sub === s) && (!R.size || R.has(e.rang)) && (!rar || e.rar === rar) && (!q || nrm(`${e.n} ${e.id} ${(e.tags || []).join(" ")}`).includes(q)));
        cur = all.slice(0, 240); $(".pk-n").textContent = `${all.length.toLocaleString("fr-FR")} objet${all.length > 1 ? "s" : ""}${all.length > cur.length ? ` · ${cur.length} affichés (affine la recherche)` : ""}`;
        grid.innerHTML = cur.map(card).join("") || `<p class="pk-none">Aucun objet.</p>`; };
      root.querySelector(".pk-tree").addEventListener("click", e => { const a = e.target.closest(".pk-tn"); if (!a) return; e.preventDefault(); if (e.target.closest(".pk-tw")) { a.parentElement.classList.toggle("open"); return; }
        root.querySelectorAll(".pk-tn.on").forEach(x => x.classList.remove("on")); a.classList.add("on"); F = a.dataset.f; if (a.classList.contains("t")) a.parentElement.classList.add("open"); $(".pk-blocks").hidden = true; grid.hidden = false; run(); });
      $(".pk-ranks").addEventListener("click", e => { const a = e.target.closest("[data-r]"); if (!a) return; e.preventDefault(); a.classList.toggle("on"); R.has(a.dataset.r) ? R.delete(a.dataset.r) : R.add(a.dataset.r); run(); });
      $('[name="q"]').addEventListener("input", foundry.utils.debounce(run, 160)); $('[name="rar"]').addEventListener("change", run);
      grid.addEventListener("click", e => { const a = e.target.closest(".pk-card"); if (!a) return; e.preventDefault(); const id = a.dataset.id;
        if (!multi) { picked.clear(); grid.querySelectorAll(".pk-card.on").forEach(x => x.classList.remove("on")); }
        if (picked.has(id)) { picked.delete(id); a.classList.remove("on"); } else { picked.add(id); a.classList.add("on"); } tray(); });
      root.addEventListener("click", e => { const a = e.target.closest("[data-pk], [data-b], [data-rm]"); if (!a) return; e.preventDefault();
        if (a.dataset.rm) { picked.delete(a.dataset.rm); grid.querySelector(`.pk-card[data-id="${CSS.escape(a.dataset.rm)}"]`)?.classList.remove("on"); return tray(); }
        if (a.dataset.b) { const b = blk.find(x => x.id === a.dataset.b); for (const it of b?.items || []) if (!it.tag) picked.add(it.id); a.classList.add("on"); return tray(); }
        const k = a.dataset.pk; if (k === "blocks") { const bl = $(".pk-blocks"); bl.hidden = !bl.hidden; grid.hidden = !bl.hidden ? true : false; return; }
        if (k === "all") { for (const e of cur) picked.add(e.id); grid.querySelectorAll(".pk-card").forEach(x => x.classList.add("on")); return tray(); }
        if (k === "none") { for (const e of cur) picked.delete(e.id); grid.querySelectorAll(".pk-card").forEach(x => x.classList.remove("on")); return tray(); } });
      tray(); run(); $('[name="q"]').focus(); },
    buttons: [{ action: "ok", label: multi ? "Ajouter la sélection" : "Choisir", icon: "fa-solid fa-check", default: true, callback: () => [...picked] }, { action: "cancel", label: "Annuler" }], rejectClose: false }).then(r => Array.isArray(r) ? r : null);
}
/* blocs de la Boutique (pour remplir une bannière du gacha) */
export const shopBlocks = () => shop().blocks.map(b => ({ id: b.id, name: b.name || "Bloc", ids: (b.items || []).filter(x => !x.tag).map(x => x.id) }));
