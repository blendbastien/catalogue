/* Boutique 3.0 — outils du MJ : blocs, offres, objets du catalogue, et la fenêtre « Gestion de la Boutique »
 * (personnages, étiquettes, groupes, niveaux, historique, contrôle des prix, bandeau, options, Signal Quotidien). */
import { picOrIcon, gmShared, suiteSeasons } from "./shop-data.js";
import { MOD, C, esc, nrm, uid, fmtFull, fmtShort, money, shop, editShop, shopOf, levelOf, setLevel, setTags, tagsOf, entry, db, cur, rankColor, rarColor, findItem, blocksWith,
  shopLog, undo, anomalies, GRID_DEFAULT, gridPrice, TAG_RARITY, LEVELS_DEFAULT, dealLabel } from "./shop-data.js";
import { THEMES } from "./themes.js";
import { BASE, SCOPES, tickerCfg, saveTicker, newMsg } from "./ticker.js";
import { signalCfg, editSignal, newCycle, cycleMembers, advance, frieze } from "./signal.js";
const { ApplicationV2, DialogV2 } = foundry.applications.api;

const pcs = () => game.actors.filter(a => a.type === "character" && a.hasPlayerOwner).sort((a, b) => a.name.localeCompare(b.name, "fr"));
const opt = (v, l, sel) => `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(l)}</option>`;
async function form(title, content, { width = 560, icon = "fa-solid fa-pen", ok = "Enregistrer", render } = {}) {
  return DialogV2.prompt({ window: { title, icon }, classes: ["bq-dlg", "bq-form"], position: { width }, rejectClose: false, content, render,
    ok: { label: ok, icon: "fa-solid fa-check", callback: (ev, btn) => { const f = btn.form; const o = {}; for (const el of f.elements) { if (!el.name) continue; if (el.type === "checkbox") { if (el.dataset.multi) { (o[el.name] ||= []); if (el.checked) o[el.name].push(el.value); } else o[el.name] = el.checked; } else o[el.name] = el.value; } return o; } } });
}

const TAG_ICONS = ["fa-tag", "fa-tags", "fa-star", "fa-crown", "fa-gem", "fa-medal", "fa-trophy", "fa-award", "fa-certificate", "fa-ribbon", "fa-heart", "fa-shield", "fa-shield-halved", "fa-khanda", "fa-wand-magic-sparkles", "fa-hat-wizard", "fa-dragon", "fa-skull", "fa-ghost", "fa-fire", "fa-bolt", "fa-snowflake", "fa-leaf", "fa-sun", "fa-moon", "fa-meteor", "fa-rocket", "fa-satellite", "fa-earth-europe", "fa-key", "fa-lock", "fa-unlock", "fa-scroll", "fa-book", "fa-flask", "fa-hammer", "fa-gear", "fa-coins", "fa-sack-dollar", "fa-store", "fa-cart-shopping", "fa-gift", "fa-ticket", "fa-handshake", "fa-user-shield", "fa-users", "fa-people-group", "fa-paw", "fa-feather", "fa-eye", "fa-mask", "fa-music", "fa-palette", "fa-compass", "fa-map", "fa-anchor", "fa-ship", "fa-car", "fa-house", "fa-building", "fa-chess-knight", "fa-chess-queen", "fa-dice", "fa-infinity", "fa-hourglass-half", "fa-seedling", "fa-tree", "fa-water", "fa-mountain", "fa-biohazard", "fa-radiation", "fa-microchip", "fa-robot", "fa-atom", "fa-dna"];
/* ── bloc ── */
export async function editBlock(bid) {
  const s = shop(); const b = s.blocks.find(x => x.id === bid) || { id: null, name: "Nouveau bloc", desc: "", icon: "fa-box-open", color: "#e9cf8e", lv: 1, tags: [], to: { actors: [], groups: [] }, event: "", hidden: false, promo: { on: false, pct: 20, label: "", days: 3, hours: 0 }, items: [] };
  const p = b.promo || {};
  const content = `<div class="bq-f">
    <div class="r2"><label>Nom<input name="name" value="${esc(b.name)}"></label><label>Icône (Font Awesome)<input name="icon" value="${esc(b.icon || "")}" placeholder="fa-box-open"></label></div>
    <label>Description<input name="desc" value="${esc(b.desc || "")}"></label>
    <div class="r3"><label>Couleur<input type="color" name="color" value="${esc(b.color || "#e9cf8e")}"></label><label>Niveau minimum<select name="lv">${s.levels.map((L, i) => opt(i + 1, `${i + 1} · ${L.n}`, Number(b.lv || 1) === i + 1)).join("")}</select></label>
      <label>Événement (thème)<select name="event">${opt("", "Toujours", !b.event)}${suiteSeasons().map(e => opt(e.name, e.name, b.event === e.name)).join("")}</select></label></div>
    <fieldset><legend>Étiquettes requises (toutes)</legend>${s.tags.length ? s.tags.map(t => `<label class="ck"><input type="checkbox" name="tags" data-multi="1" value="${t.id}"${(b.tags || []).includes(t.id) ? " checked" : ""}><i class="fa-solid ${esc(t.icon || "fa-tag")}" style="color:${esc(t.color || "#ffd76a")}"></i>${esc(t.name)}</label>`).join("") : "<small>Aucune étiquette créée (Gestion › Étiquettes).</small>"}</fieldset>
    <fieldset><legend>Réservé à (vide = tout le monde)</legend><div class="cols">${s.groups.map(g => `<label class="ck"><input type="checkbox" name="groups" data-multi="1" value="${g.id}"${(b.to?.groups || []).includes(g.id) ? " checked" : ""}><i class="fa-solid fa-people-group"></i>${esc(g.name)}</label>`).join("")}
      ${pcs().map(a => `<label class="ck"><input type="checkbox" name="actors" data-multi="1" value="${a.uuid}"${(b.to?.actors || []).includes(a.uuid) ? " checked" : ""}><img src="${esc(a.img)}">${esc(a.name)}</label>`).join("")}</div></fieldset>
    <fieldset><legend>Promotion</legend><div class="r4"><label class="ck"><input type="checkbox" name="pOn"${p.on ? " checked" : ""}> Active</label><label>Réduction %<input type="number" name="pPct" min="0" max="100" value="${Number(p.pct) || 0}"></label><label>Jours restants<input type="number" name="pDays" min="0" value="${Number(p.days) || 0}"></label><label>Heures (dernier jour)<input type="number" name="pHours" min="0" max="24" value="${Number(p.hours) || 0}"></label></div>
      <label>Texte du ruban<input name="pLabel" value="${esc(p.label || "")}" placeholder="Vente flash, Promotion d'hiver…"></label><small>Le compte à rebours ne bouge pas tout seul : baisse les jours, puis règle l'heure le dernier jour. À 0 jour et 0 heure, la promotion s'arrête.</small></fieldset>
    <label class="ck"><input type="checkbox" name="hidden"${b.hidden ? " checked" : ""}> Masqué (invisible pour les joueurs)</label></div>`;
  const r = await form(bid ? `Bloc — ${b.name}` : "Nouveau bloc", content, { width: 640, icon: "fa-solid fa-layer-group" }); if (!r) return;
  const days = Math.max(0, Number(r.pDays) || 0), hours = Math.max(0, Number(r.pHours) || 0);
  const nb = { name: r.name || "Bloc", desc: r.desc, icon: r.icon || "fa-box-open", color: r.color, lv: Number(r.lv) || 1, event: r.event || "", tags: r.tags || [], to: { actors: r.actors || [], groups: r.groups || [] }, hidden: !!r.hidden,
    promo: { on: !!r.pOn && (days > 0 || hours > 0), pct: Math.max(0, Math.min(100, Number(r.pPct) || 0)), label: r.pLabel || "", days, hours } };
  await editShop(x => { if (bid) { const t = x.blocks.find(y => y.id === bid); if (!t) return false; Object.assign(t, nb); } else x.blocks.push({ id: uid(), items: [], ...nb }); });
}
export async function pickBlock() { const s = shop(); if (!s.blocks.length) { ui.notifications.warn("Crée d'abord un bloc."); return null; }
  const r = await form("Ajouter à un bloc", `<label>Bloc<select name="b">${s.blocks.map(b => opt(b.id, b.name)).join("")}</select></label>`, { width: 380, ok: "Ajouter", icon: "fa-solid fa-plus" }); return r?.b || null; }

/* ── offre ── */
export async function editOffer(k) {
  const s = shop(); const f = findItem(s, k); if (!f) return; const it = f.it; const e = it.tag ? null : entry(it.id); const d = it.deal || {};
  const content = `<div class="bq-f"><p class="hd"><b>${esc(e?.n || s.tags.find(t => t.id === it.tag)?.name || "?")}</b>${e ? ` — prix du catalogue ${money(e.price, cur())}` : ""}</p>
    ${it.tag ? `<label>Prix de l'étiquette<input type="number" name="price" min="0" value="${Number(it.price) || 0}"></label>` : ""}
    <div class="r3"><label>Stock (vide = illimité)<input type="number" name="stock" min="0" value="${it.stock ?? ""}"></label><label>Stock maximum (réapprovisionnement)<input type="number" name="max" min="0" value="${it.max ?? ""}"></label><label>Limite par personnage (0 = aucune)<input type="number" name="limit" min="0" value="${Number(it.limit) || 0}"></label></div>
    <div class="r3"><label>Réduction de l'objet %<input type="number" name="pct" min="0" max="100" value="${Number(it.pct) || 0}"></label>
      <label>Offre groupée<select name="dk">${opt("", "Aucune", !d.k)}${opt("nth", "Le Ne à −X % (100 = offert)", d.k === "nth")}${opt("pack", "Pack de N à −X %", d.k === "pack")}</select></label>
      <div class="r2"><label>N<input type="number" name="dn" min="2" value="${Number(d.n) || 2}"></label><label>X %<input type="number" name="dp" min="0" max="100" value="${Number(d.pct) || 50}"></label></div></div>
    <label class="ck"><input type="checkbox" name="restock"${it.restock ? " checked" : ""}> Épuisé : afficher « Réapprovisionnement en cours » (sinon « Revenez plus tard »)</label>
    <label class="ck"><input type="checkbox" name="verified"${it.verified ? " checked" : ""}> Vérifié</label></div>`;
  const r = await form("Offre", content, { width: 600, icon: "fa-solid fa-sliders" }); if (!r) return;
  const num = v => v === "" || v == null ? null : Math.max(0, Math.floor(Number(v) || 0));
  await editShop(x => { const g = findItem(x, k); if (!g) return false; Object.assign(g.it, { stock: num(r.stock), max: num(r.max), limit: num(r.limit) || 0, pct: Math.max(0, Math.min(100, Number(r.pct) || 0)), restock: !!r.restock, verified: !!r.verified,
    deal: r.dk ? { k: r.dk, n: Math.max(2, Number(r.dn) || 2), pct: Math.max(0, Math.min(100, Number(r.dp) || 0)) } : null }); if (g.it.tag) g.it.price = num(r.price) || 0; });
}

/* ── objet du catalogue (le prix changé ici change partout) ── */
export async function editEntry(id) {
  const e = entry(id); if (!e) return; const d = db();
  const content = `<div class="bq-f"><div class="r2"><label>Nom<input name="n" value="${esc(e.n)}"></label><label>Prix (${esc(cur())})<input type="number" name="price" min="0" value="${Number(e.price) || 0}"></label></div>
    <div class="r3"><label>Rang<select name="rang">${(d.ranks || []).map(r => opt(r.id, r.id, e.rang === r.id)).join("")}</select></label><label>Rareté<select name="rar">${(d.rars || []).map(r => opt(r.name, r.name, e.rar === r.name)).join("")}</select></label><label>Stock du catalogue<input type="number" name="stock" min="0" value="${e.stock ?? ""}"></label></div>
    <label>Description<textarea name="desc" rows="3">${esc(e.desc || "")}</textarea></label><label>Lore (facultatif)<textarea name="lore" rows="3">${esc(e.lore || "")}</textarea></label>
    <label>Image (facultatif)<input name="img" value="${esc(e.img || "")}" placeholder="chemin ou URL"></label></div>`;
  const r = await form(`Objet — ${e.n}`, content, { width: 620 }); if (!r) return;
  await C.patchItem(id, x => { x.n = r.n || x.n; x.price = Math.max(0, Number(r.price) || 0); x.rang = r.rang; x.rar = r.rar; x.desc = r.desc; if (r.lore) x.lore = r.lore; else delete x.lore; if (r.img) x.img = r.img; else delete x.img; x.stock = r.stock === "" ? null : Math.max(0, Number(r.stock) || 0); });
  ui.notifications.info(`« ${r.n} » modifié.`);
}

/* ══════════ Gestion de la Boutique ══════════ */
const TABS = [["pcs", "Personnages", "fa-users"], ["tags", "Étiquettes", "fa-tags"], ["groups", "Groupes MJ", "fa-crown"], ["levels", "Niveaux", "fa-ranking-star"], ["log", "Historique", "fa-receipt"], ["check", "Contrôle", "fa-clipboard-check"], ["signal", "Signal Quotidien", "fa-tower-broadcast"], ["ticker", "Bandeau", "fa-satellite-dish"], ["opts", "Événement & options", "fa-wand-magic-sparkles"]];
export class AdminApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = { id: "lh-shop-admin", classes: ["bq-app", "bq-admin"], window: { title: "Gestion de la Boutique", icon: "fa-solid fa-gear", resizable: true }, position: { width: 980, height: 720 } };
  static open(tab) { const a = foundry.applications.instances.get("lh-shop-admin") || new AdminApp(); if (tab) a.tab = tab; a.render({ force: true }); return a; }
  constructor(o) { super(o); this.tab = "pcs"; this.logUser = ""; this.tq = ""; this.tsc = ""; this.cyc = null; }
  async _renderHTML() {
    const nav = `<nav class="bq-atabs">${TABS.map(([k, l, i]) => `<a data-a="tab" data-v="${k}" class="${this.tab === k ? "on" : ""}"><i class="fa-solid ${i}"></i>${l}</a>`).join("")}</nav>`;
    let body = ""; try { body = this[`t_${this.tab}`](); } catch (err) { console.error(MOD, err); body = `<p class="bq-err">Erreur : ${esc(err.message)}</p>`; }
    return `<div class="bq-adm">${nav}<section class="bq-abody">${body}</section></div>`;
  }
  _replaceHTML(html, c) { const sc = c.querySelector(".bq-abody")?.scrollTop || 0; c.innerHTML = html; const b = c.querySelector(".bq-abody"); if (b) b.scrollTop = sc;
    c.querySelectorAll("[data-a]").forEach(el => el.addEventListener(el.tagName === "SELECT" || el.tagName === "INPUT" ? "change" : "click", ev => { if (el.tagName !== "SELECT" && el.tagName !== "INPUT") ev.preventDefault(); this.act(el.dataset.a, el, ev); }));
    const gg = c.querySelector("[data-gg-root]"); if (gg) globalThis.MANHWA?.gmGroups?.bindCards(gg, () => this.render()); }

  t_pcs() { const s = shop();
    return `<p class="hint">Le niveau de boutique est propre à chaque personnage ; seul le MJ le change. Les étiquettes ouvrent des blocs.</p><table class="bq-t"><thead><tr><th>Personnage</th><th>Niveau</th><th>Étiquettes</th><th>Compétence</th></tr></thead><tbody>
      ${pcs().map(a => { const lv = levelOf(a); const own = new Set(shopOf(a).tags || []); const auto = tagsOf(a, s).filter(t => !own.has(t.id));
        return `<tr data-id="${a.id}"><td><img src="${esc(a.img)}"><b>${esc(a.name)}</b></td><td><select data-a="setLv">${s.levels.map((L, i) => opt(i + 1, `${i + 1} · ${L.n}`, lv === i + 1)).join("")}</select></td>
          <td class="tg">${s.tags.map(t => `<label class="bq-tgk${own.has(t.id) ? " on" : ""}" style="--tc:${esc(t.color || "#ffd76a")}" data-tooltip="${own.has(t.id) ? "Possédée — clic pour retirer" : "Clic pour donner"}"><input type="checkbox" data-a="setTag" value="${t.id}"${own.has(t.id) ? " checked" : ""}><i class="fa-solid ${esc(t.icon || "fa-tag")}"></i>${esc(t.name)}</label>`).join("") || "<small>—</small>"}${auto.map(t => `<span class="bq-pill" data-tooltip="Obtenue par le titre « ${esc(t.title)} »">${esc(t.name)} ✓</span>`).join("")}</td>
          <td>${a.items.some(i => nrm(i.name) === nrm(game.settings.get(MOD, "shopSkill"))) ? `<i class="fa-solid fa-check ok"></i>` : `<span class="dim">absente</span>`}</td></tr>`; }).join("")}</tbody></table>`; }
  t_tags() { const s = shop();
    return `<p class="hint">Une étiquette (avantage, succès, bonus) ouvre les blocs qui la demandent. Elle s'obtient : donnée par toi (onglet Personnages), achetée en boutique (bouton « Mettre en vente »), ou automatiquement si le personnage possède le titre indiqué.</p>
      <button class="bq-b" data-a="newTag"><i class="fa-solid fa-plus"></i> Nouvelle étiquette</button>
      <div class="bq-tl">${s.tags.map(t => `<div class="bq-tr" data-id="${t.id}"><span class="bq-tagb" style="--tc:${esc(t.color || TAG_RARITY[t.rarity || 0][1])}"><i class="fa-solid ${esc(t.icon || "fa-tag")}"></i>${esc(t.name)}</span><small>${TAG_RARITY[t.rarity || 0][0]}${t.title ? ` · titre « ${esc(t.title)} »` : ""}</small><span class="d">${esc(t.desc || "")}</span>
        <button class="bq-b sm" data-a="sellTag"><i class="fa-solid fa-store"></i> Mettre en vente</button><button class="bq-b sm" data-a="editTag"><i class="fa-solid fa-pen"></i></button><button class="bq-b sm" data-a="delTag"><i class="fa-solid fa-trash"></i></button></div>`).join("") || "<p class='dim'>Aucune étiquette.</p>"}</div>`; }
  t_groups() { const G = globalThis.MANHWA?.gmGroups;
    if (G && gmShared()) return `<p class="hint"><i class="fa-solid fa-crown"></i> Les <b>Groupes MJ</b> sont communs à toute la suite (Boutique, Signal Quotidien, Horlogia, Portraits, Scénarios) et se règlent aussi dans le Centre du MJ › Joueurs et groupes. Un joueur coché amène tous ses personnages.</p>
      <div class="bq-ggtop"><button class="bq-b" data-a="ggNew"><i class="fa-solid fa-plus"></i> Groupe MJ</button></div><div class="bq-gglist" data-gg-root>${G.cards() || "<p class='dim'>Aucun groupe MJ.</p>"}</div>`;
    const s = shop(); const parties = C.msParties?.() || [];
    return `<p class="hint">Groupes MJ : pour réserver des blocs et faire avancer le Signal Quotidien.</p>
      <button class="bq-b" data-a="newGroup"><i class="fa-solid fa-plus"></i> Nouveau groupe</button>${parties.length ? `<select data-a="importParty"><option value="">Reprendre un groupe d'aventure…</option>${parties.map(p => opt(p.id, p.name)).join("")}</select>` : ""}
      <div class="bq-tl">${s.groups.map(g => `<div class="bq-tr col" data-id="${g.id}"><div class="h"><b style="color:${esc(g.color || "#7cc4ff")}"><i class="fa-solid fa-people-group"></i> ${esc(g.name)}</b><button class="bq-b sm" data-a="renGroup"><i class="fa-solid fa-pen"></i></button><button class="bq-b sm" data-a="delGroup"><i class="fa-solid fa-trash"></i></button></div>
        <div class="cols">${pcs().map(a => `<label class="ck sm"><input type="checkbox" data-a="grpMember" value="${a.uuid}"${(g.members || []).includes(a.uuid) ? " checked" : ""}><img src="${esc(a.img)}">${esc(a.name)}</label>`).join("")}</div></div>`).join("") || "<p class='dim'>Aucun groupe.</p>"}</div>`; }
  t_levels() { const s = shop(); const d = db();
    return `<p class="hint">Chaque niveau autorise les objets jusqu'à un rang et une rareté (les deux doivent être respectés). Le niveau est cumulatif.</p><table class="bq-t"><thead><tr><th>#</th><th>Nom</th><th>Couleur</th><th>Rang max</th><th>Rareté max</th></tr></thead><tbody>
      ${s.levels.map((L, i) => `<tr data-i="${i}"><td>${i + 1}</td><td><input data-a="lvSet" data-f="n" value="${esc(L.n)}"></td><td><input type="color" data-a="lvSet" data-f="c" value="${esc(L.c)}"></td>
        <td><select data-a="lvSet" data-f="rank">${(d.ranks || []).map(r => opt(r.id, r.id, L.rank === r.id)).join("")}</select></td><td><select data-a="lvSet" data-f="rar">${(d.rars || []).map(r => opt(r.name, r.name, L.rar === r.name)).join("")}</select></td></tr>`).join("")}</tbody></table>
      <button class="bq-b" data-a="lvReset"><i class="fa-solid fa-rotate-left"></i> Valeurs d'origine</button>`; }
  t_log() { const L = shopLog().reverse(); const users = [...new Set(L.map(e => e.un))].sort(); const list = this.logUser ? L.filter(e => e.un === this.logUser) : L; const cr = cur();
    const by = {}; for (const e of list) (by[e.un] ||= []).push(e);
    return `<div class="bq-row"><select data-a="logUser"><option value="">Tous les joueurs</option>${users.map(u => opt(u, u, this.logUser === u)).join("")}</select><span class="dim">${list.length} achats</span></div>
      ${Object.entries(by).map(([u, es]) => `<h4>${esc(u)} <small>${es.length} achat(s) · ${fmtShort(es.filter(e => !e.undone).reduce((t, e) => t + e.total, 0))} ${esc(cr)}</small></h4><table class="bq-t"><tbody>${es.map(e => `<tr class="${e.undone ? "undone" : ""}" data-id="${e.id}"><td class="dim">${new Date(e.t).toLocaleString("fr-FR")}</td><td><b>${esc(e.an)}</b></td><td>${e.lines.map(l => `${esc(l.n)}${l.q > 1 ? ` ×${l.q}` : ""}`).join(", ")}</td><td>${money(e.total, cr)}</td>
        <td>${e.undone ? "<span class='dim'>annulé</span>" : `<button class="bq-b sm" data-a="undo"><i class="fa-solid fa-rotate-left"></i> Annuler</button>`}</td></tr>`).join("")}</tbody></table>`).join("") || "<p class='dim'>Aucun achat.</p>"}`; }
  t_check() { const s = shop(); const g = s.priceGrid || GRID_DEFAULT(); const A = anomalies(s); const d = db(); const ranks = d.ranks || [];
    const offers = s.blocks.flatMap(b => (b.items || []).filter(x => !x.tag).map(it => ({ it, e: entry(it.id) }))); const total = offers.length; const ver = offers.filter(x => x.it.verified).length;
    const rk = x => x.e?.rang || "?"; const by = {}; for (const x of A) (by[rk(x)] ||= []).push(x);
    const offBy = {}; for (const o of offers) { const r = o.e?.rang || "?"; offBy[r] ||= { n: 0, v: 0 }; offBy[r].n++; if (o.it.verified) offBy[r].v++; }
    const order = [...ranks.map(r => r.id), ...Object.keys(by).filter(k => !ranks.some(r => r.id === k))];
    const sel = this.ckRank || ""; const shown = order.filter(r => (by[r] || []).length && (!sel || sel === r));
    const chip = r => { const c = rankColor(r); const n = (by[r] || []).length; const o = offBy[r] || { n: 0, v: 0 }; return `<a class="bq-ckr${sel === r ? " on" : ""}${n ? "" : " ok"}" data-a="ckRank" data-v="${esc(r)}" style="--rc:${c}"><b>${esc(r)}</b><span>${n ? `${n} à voir` : `<i class="fa-solid fa-check"></i>`}</span><small>${o.v}/${o.n} vérifiées</small></a>`; };
    return `<div class="bq-ck">
      <div class="bq-ckhelp"><div><i class="fa-solid fa-1"></i><b>Repère</b><span>chaque rang a sa couleur ; le chiffre dit combien d'offres posent question.</span></div><div><i class="fa-solid fa-2"></i><b>Corrige</b><span>« Prix conseillé » applique la grille, le crayon ouvre l'offre.</span></div><div><i class="fa-solid fa-3"></i><b>Règle la grille</b><span>prix de base par rang × rareté, avec une tolérance.</span></div></div>
      <div class="bq-prog"><b>${ver} / ${total}</b> offres vérifiées<div class="bar"><i style="width:${total ? Math.round(ver / total * 100) : 0}%"></i></div></div>
      <div class="bq-ckrs"><a class="bq-ckr all${sel ? "" : " on"}" data-a="ckRank" data-v="" style="--rc:#9fb0d4"><b>Tous</b><span>${A.length} à voir</span><small>tous les rangs</small></a>${order.map(chip).join("")}</div>
      ${shown.map(r => `<div class="bq-cksec" style="--rc:${rankColor(r)}"><header><span class="rk" style="--rc:${rankColor(r)}">${esc(r)}</span><b>Rang ${esc(r)}</b><small>${by[r].length} offre${by[r].length > 1 ? "s" : ""} à vérifier · prix de base ${fmtShort(Number(g.rank?.[r]) || 0)}</small></header>
        ${by[r].map(x => `<div class="bq-ckrow" data-k="${x.it.k}" data-id="${esc(x.it.id)}"><div class="nm"><b>${esc(x.e?.n || x.it.id)}</b><small>${esc(x.b.name)}</small></div><div class="ws">${x.w.map(w => `<span class="warn"><i class="fa-solid fa-triangle-exclamation"></i>${esc(w)}</span>`).join("")}</div>
          <div class="ac">${x.gp ? `<button class="bq-b sm gp" data-a="fixPrice" data-v="${x.gp}"><i class="fa-solid fa-wand-magic-sparkles"></i> Prix conseillé ${fmtShort(x.gp)}</button>` : ""}<button class="bq-b sm" data-a="openEntry" data-tooltip="Ouvrir l'offre"><i class="fa-solid fa-pen"></i></button></div></div>`).join("")}</div>`).join("") || `<p class="bq-ckok"><i class="fa-solid fa-circle-check"></i> Rien à signaler${sel ? ` pour le rang ${esc(sel)}` : ""}.</p>`}
      <h4 class="bq-ckh"><i class="fa-solid fa-table-cells"></i> Grille de prix <small>prix conseillé = prix de base du rang × multiplicateur de rareté</small><span class="sp"></span><label class="tol">Tolérance ±%<input type="number" data-a="gridSet" data-f="tol" value="${g.tol}"></label><button class="bq-b sm" data-a="gridReset"><i class="fa-solid fa-rotate-left"></i> Recalculer depuis le catalogue</button></h4>
      <div class="bq-ckgrid">${ranks.map(r => `<label class="bq-ckg" style="--rc:${r.color}"><b>${esc(r.id)}</b><span>prix de base</span><input type="number" data-a="gridSet" data-f="rank.${r.id}" value="${Number(g.rank?.[r.id]) || 0}"></label>`).join("")}</div>
      <div class="bq-ckgrid rar">${(d.rars || []).map(r => `<label class="bq-ckg" style="--rc:${r.color || "#c9d4ff"}"><b>${esc(r.name)}</b><span>× rareté</span><input type="number" step="0.05" data-a="gridSet" data-f="rar.${r.name}" value="${Number(g.rar?.[r.name]) || 1}"></label>`).join("")}</div></div>`; }
  t_signal() { const S = signalCfg(); const s = shop();
    return `<div class="sg-adm-top"><label>Nom du signal<input data-a="sigName" value="${esc(S.name)}"></label><button class="sg-b gr" data-a="newCycle"><i class="fa-solid fa-plus"></i> Nouveau cycle</button><button class="sg-b cy" data-a="cycAllNext"><i class="fa-solid fa-forward-step"></i> Jour suivant pour tous</button></div>
      <p class="hint">Chaque cycle vise un groupe MJ ou un personnage. Clique un jour pour choisir sa récompense. Les jours passent avec « Jour suivant », depuis le Centre du MJ (Temps et jours) ou avec Horlogia (groupes qui font avancer les modules).</p>
      ${S.cycles.map(c => { const who = c.target?.k === "group" ? s.groups.find(g => g.id === c.target.id)?.name : game.actors.find(a => a.uuid === c.target?.id)?.name; const mem = cycleMembers(c, s);
        return `<div class="sg-cyc${c.on === false ? " off" : ""}" data-id="${c.id}"><header><b>${esc(c.name)}</b><span class="sg-pill"><i class="fa-solid ${c.target?.k === "group" ? "fa-people-group" : "fa-user"}"></i> ${esc(who || "personne")}</span><span class="sg-pill">Jour ${c.day} / ${c.len}</span>${c.accumulate !== false ? `<span class="sg-pill">cumul</span>` : ""}${c.on === false ? `<span class="sg-pill off">en pause</span>` : ""}
          <span class="sp"></span><button class="sg-b or sm" data-a="cycPrev" data-tooltip="Jour précédent"><i class="fa-solid fa-backward-step"></i></button><button class="sg-b cy sm" data-a="cycNext"><i class="fa-solid fa-forward-step"></i> Jour suivant</button><button class="sg-b vi sm" data-a="cycReset" data-tooltip="Revenir au jour 1 (réclamations remises à zéro)"><i class="fa-solid fa-rotate-left"></i></button><button class="sg-b gd sm" data-a="cycEdit" data-tooltip="Réglages du cycle"><i class="fa-solid fa-pen"></i></button><button class="sg-b rd sm" data-a="cycDel" data-tooltip="Supprimer"><i class="fa-solid fa-trash"></i></button></header>
          ${frieze(c, { gm: true, mem })}</div>`; }).join("") || "<p class='dim'>Aucun cycle.</p>"}`; }
  t_ticker() { const c = tickerCfg(); const off = new Set(c.off || []); const q = nrm(this.tq); const all = [...BASE, ...(c.custom || [])].filter(m => (!this.tsc || m.sc === this.tsc) && (!q || nrm(m.t).includes(q)));
    const groups = { g: [], s: [], p: [], x: [] }; for (const m of all) (groups[m.sc] ||= []).push(m);
    return `<div class="bq-row"><label class="ck"><input type="checkbox" data-a="tickOn"${game.settings.get(MOD, "tickerOn") ? " checked" : ""}> Bandeau activé</label><select data-a="tickSc"><option value="">Toutes les portées</option>${Object.entries(SCOPES).map(([k, l]) => opt(k, l, this.tsc === k)).join("")}</select><input data-a="tickQ" value="${esc(this.tq)}" placeholder="Filtrer…"><button class="bq-b" data-a="tickAdd"><i class="fa-solid fa-plus"></i> Message</button></div>
      <p class="hint">{g} = une galaxie, {s} = un système solaire, {p} = une planète, tirés de la Carte Stellaire (jamais Eos). « Libre » = texte affiché tel quel.</p>
      ${Object.entries(groups).filter(([, l]) => l.length).map(([sc, l]) => `<h4>${SCOPES[sc]} <small>${l.filter(m => !off.has(m.id)).length}/${l.length}</small></h4><div class="bq-ml">${l.map(m => `<div class="bq-mi${off.has(m.id) ? " off" : ""}" data-id="${m.id}"><input type="checkbox" data-a="tickTog"${off.has(m.id) ? "" : " checked"}><span>${esc(m.t)}</span>${m.id.startsWith("c") ? `<button class="bq-b sm" data-a="tickDel"><i class="fa-solid fa-trash"></i></button>` : ""}</div>`).join("")}</div>`).join("")}`; }
  t_opts() { const s = shop(); const evs = suiteSeasons(); const G = k => game.settings.get(MOD, k);
    const sw = (k, label, hint) => `<label class="bq-sw"><input type="checkbox" data-a="optSet" data-k="${k}"${G(k) ? " checked" : ""}><i></i><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ""}</span></label>`;
    const gacha = game.modules.get("gacha-manhwa")?.active; let CU = { all: true, ids: [] }; try { if (gacha) CU = game.settings.get("gacha-manhwa", "catalogueUsers") || CU; } catch (e) {}
    const players = game.users.filter(u => !u.isGM);
    return `<div class="bq-opts"><div class="bq-osec" style="--oc:#ff9ad5"><h4><i class="fa-solid fa-wand-magic-sparkles"></i> Événement de la boutique <small>décor animé, couleurs, blocs liés à l'événement</small>${globalThis.MANHWA?.seasonEventsEditor ? `<span class="sp"></span><button class="bq-b sm" data-a="seasonEd"><i class="fa-solid fa-plus"></i> Ajouter des événements</button>` : ""}</h4>
      ${globalThis.MANHWA?.season ? (() => { const S = globalThis.MANHWA.season(); return `<p class="hint">Saison du monde : <b style="color:${esc(S.color)}"><i class="fa-solid ${esc(S.icon)}"></i> ${esc(S.name)}</b>${S.eventName ? ` · événement <b>${esc(S.eventName)}</b>` : ""} <em>(${esc(S.src)})</em> — elle vient de la Fiche Manhwa (Horlogia ou calendrier) et s'applique aussi ici quand tu choisis « Saison du monde ».</p>`; })() : ""}
      <div class="bq-evs"><a data-a="setEv" data-v="" class="${!s.event && !s.eventRaw ? "on" : ""}"><i class="fa-solid fa-ban"></i>Aucun</a>${globalThis.MANHWA?.season ? `<a data-a="setEv" data-v="@world" class="${s.eventRaw === "@world" ? "on" : ""}" style="--a:#8fd8ff;--b:#ffd760"><i class="fa-solid fa-earth-europe"></i>Saison du monde</a>` : ""}${evs.map(e => { const t = THEMES[nrm(e.name)] || {}; return `<a data-a="setEv" data-v="${esc(e.name)}" class="${!s.eventRaw && s.event === e.name ? "on" : ""}" style="--a:${t.a || e.color || "#e9cf8e"};--b:${t.b || e.accent || "#7cc4ff"}"><i class="fa-solid ${t.glyph || e.icon || "fa-star"}"></i>${esc(e.name)}</a>`; }).join("")}</div></div>
      <div class="bq-osec" style="--oc:#5ee0ff"><h4><i class="fa-solid fa-eye"></i> Ce que voient les joueurs</h4><div class="bq-sws">${sw("catalogPublic", "Catalogue complet consultable", "onglet « Catalogue » de la Boutique, en lecture seule")}${sw("tickerOn", "Bandeau défilant", "nouvelles du cosmos en haut de la Boutique")}</div>
        <label class="bq-orow"><b>Objets et blocs verrouillés</b><select data-a="optSel" data-k="lockedMode">${opt("hide", "Cachés", G("lockedMode") === "hide")}${opt("show", "Visibles avec « Niveau X requis »", G("lockedMode") === "show")}</select></label>
        ${gacha ? `<div class="bq-orow cu"><b>Onglet « Catalogue » du Menu visible pour</b><span class="bq-cu"><label class="bq-cuc${CU.all !== false ? " on" : ""}"><input type="radio" name="cuMode" data-a="cuMode" value="all"${CU.all !== false ? " checked" : ""}>Tous les joueurs</label><label class="bq-cuc${CU.all === false ? " on" : ""}"><input type="radio" name="cuMode" data-a="cuMode" value="list"${CU.all === false ? " checked" : ""}>Seulement :</label>
          ${players.map(u => `<label class="bq-cuc u${CU.all === false && (CU.ids || []).includes(u.id) ? " on" : ""}${CU.all !== false ? " dis" : ""}" style="--uc:${esc(u.color?.css ?? u.color ?? "#8ea0c8")}"><input type="checkbox" data-a="cuUser" value="${u.id}"${(CU.ids || []).includes(u.id) ? " checked" : ""}${CU.all !== false ? " disabled" : ""}><i></i>${esc(u.name)}</label>`).join("")}</span><small>Le MJ le voit toujours (onglet ajouté par Appel des Étoiles).</small></div>` : ""}</div>
      <div class="bq-osec" style="--oc:#3ddc84"><h4><i class="fa-solid fa-cart-shopping"></i> Achat et stock</h4><label class="bq-orow"><b>Compétence qui permet d'acheter</b><input type="text" data-a="optTxt" data-k="shopSkill" value="${esc(G("shopSkill") || "")}" placeholder="vide = tout le monde"></label>
        <button class="bq-b" data-a="restockAll"><i class="fa-solid fa-boxes-stacked"></i> Réapprovisionner toute la boutique (stock maximum)</button></div></div>`; }

  async act(a, el, ev) {
    const row = el.closest("[data-id]"); const id = row?.dataset.id; const rerender = () => this.render();
    switch (a) {
      case "tab": this.tab = el.dataset.v; return rerender();
      case "setLv": return setLevel(game.actors.get(id), el.value);
      case "setTag": { const ac = game.actors.get(id); const t = new Set(shopOf(ac).tags || []); if (el.checked) t.add(el.value); else t.delete(el.value); return setTags(ac, [...t]); }
      case "newTag": case "editTag": return this.tagForm(a === "editTag" ? id : null);
      case "delTag": return editShop(s => { s.tags = s.tags.filter(t => t.id !== id); for (const b of s.blocks) { b.tags = (b.tags || []).filter(t => t !== id); b.items = (b.items || []).filter(x => x.tag !== id); } }).then(rerender);
      case "sellTag": { const bid = await pickBlock(); if (!bid) return; return editShop(s => { const b = s.blocks.find(x => x.id === bid); if (s.blocks.some(x => (x.items || []).some(y => y.tag === id))) { ui.notifications.warn("Cette étiquette est déjà en vente."); return false; } b.items.push({ k: uid(), tag: id, price: 1000, stock: null, max: null, limit: 1, pct: 0, verified: true }); }); }
      case "newGroup": { const r = await form("Nouveau groupe", `<label>Nom<input name="n" value="Groupe"></label><label>Couleur<input type="color" name="c" value="#7cc4ff"></label>`, { width: 360 }); if (!r) return; return editShop(s => { s.groups.push({ id: uid(), name: r.n || "Groupe", color: r.c, members: [] }); }).then(rerender); }
      case "importParty": { const p = (C.msParties?.() || []).find(x => x.id === el.value); if (!p) return; return editShop(s => { s.groups.push({ id: uid(), name: p.name, color: p.color || "#7cc4ff", members: (p.members || []).map(m => m.uuid) }); }).then(rerender); }
      case "renGroup": { const g = shop().groups.find(x => x.id === id); const r = await form("Groupe", `<label>Nom<input name="n" value="${esc(g?.name)}"></label><label>Couleur<input type="color" name="c" value="${esc(g?.color || "#7cc4ff")}"></label>`, { width: 360 }); if (!r) return; return editShop(s => { const x = s.groups.find(y => y.id === id); x.name = r.n; x.color = r.c; }).then(rerender); }
      case "delGroup": return editShop(s => { s.groups = s.groups.filter(g => g.id !== id); for (const b of s.blocks) if (b.to) b.to.groups = (b.to.groups || []).filter(g => g !== id); }).then(rerender);
      case "grpMember": return editShop(s => { const g = s.groups.find(x => x.id === id); const m = new Set(g.members || []); if (el.checked) m.add(el.value); else m.delete(el.value); g.members = [...m]; });
      case "lvSet": { const i = Number(el.closest("[data-i]").dataset.i); return editShop(s => { s.levels[i][el.dataset.f] = el.value; }); }
      case "lvReset": return editShop(s => { s.levels = foundry.utils.deepClone(LEVELS_DEFAULT); }).then(rerender);
      case "logUser": this.logUser = el.value; return rerender();
      case "undo": if (await DialogV2.confirm({ window: { title: "Annuler l'achat" }, classes: ["bq-dlg"], content: "<p>Rembourser, retirer les objets de la fiche et remettre le stock ?</p>" })) { await undo(id); rerender(); } return;
      case "ggNew": await globalThis.MANHWA?.gmGroups?.create({}); return rerender();
      case "ckRank": this.ckRank = el.dataset.v || ""; return rerender();
      case "fixPrice": await C.patchItem(el.closest("[data-id]").dataset.id, x => { x.price = Number(el.dataset.v); }); return rerender();
      case "openEntry": return editEntry(el.closest("[data-id]").dataset.id);
      case "gridReset": return editShop(s => { s.priceGrid = null; }).then(rerender);
      case "gridSet": return editShop(s => { const g = s.priceGrid || GRID_DEFAULT(); foundry.utils.setProperty(g, el.dataset.f, Number(el.value) || 0); s.priceGrid = g; }).then(rerender);
      case "sigName": return editSignal(S => { S.name = el.value || "Signal Quotidien"; });
      case "newCycle": case "cycEdit": return this.cycleForm(a === "cycEdit" ? id : null);
      case "cycDel": if (await DialogV2.confirm({ window: { title: "Supprimer le cycle" }, classes: ["bq-dlg"], content: "<p>Supprimer ce cycle et ses récompenses ?</p>" })) return editSignal(S => { S.cycles = S.cycles.filter(c => c.id !== id); }).then(rerender); return;
      case "cycNext": return advance(id, +1).then(rerender);
      case "cycPrev": return advance(id, -1).then(rerender);
      case "cycReset": return editSignal(S => { const c = S.cycles.find(x => x.id === id); if (!c) return false; c.day = 1; c.claims = {}; }).then(rerender);
      case "cycAllNext": { for (const c of signalCfg().cycles.filter(x => x.on !== false)) await advance(c.id, +1); return rerender(); }
      case "cycDay": return this.dayForm(id, Number(el.dataset.d));
      case "tickOn": return game.settings.set(MOD, "tickerOn", el.checked);
      case "tickSc": this.tsc = el.value; return rerender();
      case "tickQ": this.tq = el.value; return rerender();
      case "tickTog": return saveTicker(c => { const s = new Set(c.off || []); if (el.checked) s.delete(id); else s.add(id); c.off = [...s]; }).then(rerender);
      case "tickDel": return saveTicker(c => { c.custom = (c.custom || []).filter(m => m.id !== id); }).then(rerender);
      case "tickAdd": { const r = await form("Nouveau message", `<label>Portée<select name="sc">${Object.entries(SCOPES).map(([k, l]) => opt(k, l, k === "p")).join("")}</select></label><label>Texte<input name="t" placeholder="ALERTE // Une flotte inconnue survole {p} ({s})."></label>`, { width: 560 }); if (!r?.t) return; return saveTicker(c => { (c.custom ||= []).push(newMsg(r.sc, r.t)); }).then(rerender); }
      case "optSet": return game.settings.set(MOD, el.dataset.k, el.checked);
      case "optSel": case "optTxt": return game.settings.set(MOD, el.dataset.k, el.value.trim());
      case "seasonEd": return globalThis.MANHWA?.seasonEventsEditor?.();
      case "cuMode": case "cuUser": { const box = el.closest(".bq-cu"); const all = box.querySelector('[data-a="cuMode"]:checked')?.value !== "list"; const ids = [...box.querySelectorAll('[data-a="cuUser"]:checked')].map(x => x.value); await game.settings.set("gacha-manhwa", "catalogueUsers", { all, ids }); return rerender(); }
      case "setEv": return editShop(s => { s.event = el.dataset.v || ""; }).then(rerender);
      case "restockAll": return editShop(s => { for (const b of s.blocks) for (const it of b.items || []) if (it.max) { it.stock = Number(it.max); it.restock = false; } }).then(() => ui.notifications.info("Boutique réapprovisionnée."));
    }
  }
  async tagForm(id) { const s = shop(); const t = s.tags.find(x => x.id === id) || { name: "Nouvelle étiquette", desc: "", icon: "fa-tag", color: "#7dd3fc", rarity: 0, title: "" };
    const SW = ["#7dd3fc", "#38bdf8", "#5ef0ff", "#3ddc84", "#a3e635", "#ffd76a", "#fbbf24", "#ff9a3d", "#ff5f8a", "#ff4d5e", "#c084fc", "#a46bff", "#e9cf8e", "#ffffff", "#9ca3af"];
    const content = `<div class="bq-tagf"><div class="tf-prev"><span class="bq-tagb big" data-pv style="--tc:${esc(t.color || "#7dd3fc")}"><i class="fa-solid ${esc(t.icon || "fa-tag")}"></i><b>${esc(t.name)}</b></span><small>Aperçu</small></div>
      <div class="tf-row"><label>Nom<input name="name" value="${esc(t.name)}" data-live></label><label>Titre / succès qui la donne <em>(facultatif)</em><input name="title" value="${esc(t.title || "")}" placeholder="nom exact du titre"></label></div>
      <label>Description (au survol)<input name="desc" value="${esc(t.desc || "")}"></label>
      <div class="tf-h">Rareté <em>ordre des badges</em></div><div class="tf-rar">${TAG_RARITY.map(([n, c], i) => `<a data-rar="${i}" class="${Number(t.rarity) === i ? "on" : ""}" style="--c:${c}">${esc(n)}</a>`).join("")}</div><input type="hidden" name="rarity" value="${Number(t.rarity) || 0}">
      <div class="tf-h">Couleur</div><div class="tf-sw">${SW.map(c => `<a data-col="${c}" style="--c:${c}" class="${(t.color || "").toLowerCase() === c ? "on" : ""}"></a>`).join("")}<input type="color" name="color" value="${esc(t.color || "#7dd3fc")}" data-live title="Autre couleur"></div>
      <div class="tf-h">Icône <em>clique pour choisir</em><input type="search" data-iq placeholder="Rechercher (anglais : star, crown…)"></div><input type="hidden" name="icon" value="${esc(t.icon || "fa-tag")}">
      <div class="tf-ic">${TAG_ICONS.map(i => `<a data-ic="${i}" class="${t.icon === i ? "on" : ""}" title="${i.replace("fa-", "")}"><i class="fa-solid ${i}"></i></a>`).join("")}</div></div>`;
    const r = await form(id ? `Étiquette — ${t.name}` : "Nouvelle étiquette", content, { width: 640, icon: "fa-solid fa-tag", render: (ev, dlg) => { const el = dlg.element ?? dlg; const f = el.querySelector("form") || el; const pv = el.querySelector("[data-pv]");
      const val = n => el.querySelector(`[name="${n}"]`); const draw = () => { pv.style.setProperty("--tc", val("color").value); pv.querySelector("i").className = `fa-solid ${val("icon").value}`; pv.querySelector("b").textContent = val("name").value || "Étiquette"; };
      el.addEventListener("click", e => { const ic = e.target.closest("[data-ic]"), co = e.target.closest("[data-col]"), ra = e.target.closest("[data-rar]"); if (!ic && !co && !ra) return; e.preventDefault();
        if (ic) { val("icon").value = ic.dataset.ic; el.querySelectorAll("[data-ic]").forEach(x => x.classList.toggle("on", x === ic)); }
        if (co) { val("color").value = co.dataset.col; el.querySelectorAll("[data-col]").forEach(x => x.classList.toggle("on", x === co)); }
        if (ra) { val("rarity").value = ra.dataset.rar; el.querySelectorAll("[data-rar]").forEach(x => x.classList.toggle("on", x === ra)); if (!t.color || co == null) { const c = TAG_RARITY[+ra.dataset.rar][1]; val("color").value = c; } }
        draw(); });
      el.querySelectorAll("[data-live]").forEach(i => i.addEventListener("input", draw));
      el.querySelector("[data-iq]").addEventListener("input", e => { const q = e.target.value.trim().toLowerCase(); el.querySelectorAll("[data-ic]").forEach(a => { a.hidden = !!q && !a.dataset.ic.includes(q); }); }); } }); if (!r) return;
    await editShop(x => { const v = { name: r.name || "Étiquette", icon: r.icon || "fa-tag", rarity: Number(r.rarity) || 0, color: r.color, title: r.title || "", desc: r.desc || "" }; if (id) Object.assign(x.tags.find(y => y.id === id), v); else x.tags.push({ id: uid(), ...v }); }); this.render(); }
  async cycleForm(id) { const S = signalCfg(); const s = shop(); const c = S.cycles.find(x => x.id === id) || newCycle();
    const r = await form(id ? `Cycle — ${c.name}` : "Nouveau cycle", `<div class="bq-f"><label>Nom<input name="name" value="${esc(c.name)}"></label>
      <div class="r3"><label>Durée<select name="len">${[3, 5, 7, 10, 14, 21, 28, 30].map(n => opt(n, `${n} jours`, c.len === n)).join("")}</select></label><label>Pour<select name="target">${s.groups.map(g => opt(`group:${g.id}`, `Groupe · ${g.name}`, c.target?.k === "group" && c.target.id === g.id)).join("")}${pcs().map(a => opt(`actor:${a.uuid}`, a.name, c.target?.k === "actor" && c.target.id === a.uuid)).join("")}</select></label>
      <label class="ck"><input type="checkbox" name="accumulate"${c.accumulate !== false ? " checked" : ""}> Les jours non réclamés se cumulent</label></div><div class="r3"><label>Forme des médaillons<select name="shape">${opt("round", "Ronds", c.shape !== "square")}${opt("square", "Carrés", c.shape === "square")}</select></label><label class="ck"><input type="checkbox" name="on"${c.on !== false ? " checked" : ""}> Actif</label></div></div>`, { width: 600, icon: "fa-solid fa-tower-broadcast" }); if (!r) return;
    const [k, ...rest] = String(r.target || "").split(":"); const tid = rest.join(":"); if (!tid) return ui.notifications.warn("Choisis un groupe ou un personnage (crée d'abord un groupe dans l'onglet Groupes).");
    await editSignal(S2 => { const v = { name: r.name || "Cycle", len: Number(r.len) || 7, target: { k, id: tid }, accumulate: !!r.accumulate, on: !!r.on, shape: r.shape === "square" ? "square" : "round" }; if (id) { const x = S2.cycles.find(y => y.id === id); Object.assign(x, v); x.day = Math.min(x.day, x.len); } else S2.cycles.push({ ...c, ...v }); }); this.render(); }
  async dayForm(cid, d) { const S = signalCfg(); const c = S.cycles.find(x => x.id === cid); if (!c) return; const r0 = c.rewards?.[d] || {}; let id = r0.id || null;
    const vis = () => { const e = id ? entry(id) : null; const P = e ? picOrIcon(e) : null; return e ? `<div class="sg-pick" style="--rc:${rankColor(e.rang)}">${P?.pic ? `<img src="${esc(P.pic)}">` : ""}<span><b>${esc(e.n)}</b><small>${esc(e.rang)} · ${esc(e.cat || "")}</small></span></div>` : `<div class="sg-pick none"><i class="fa-solid fa-box-open"></i><span>Aucun objet</span></div>`; };
    const r = await form(`${c.name} — jour ${d}`, `<div class="bq-f sg-dayf"><div class="sg-pk">${vis()}<button type="button" class="sg-b cy" data-pk="1"><i class="fa-solid fa-magnifying-glass"></i> Choisir dans le Catalogue</button><button type="button" class="sg-b rd sm" data-pk="0" data-tooltip="Pas d'objet"><i class="fa-solid fa-xmark"></i></button></div>
      <div class="r3"><label>Quantité<input type="number" name="qty" min="1" value="${Number(r0.q) || 1}"></label><label>Gold<input type="number" name="gold" min="0" value="${Number(r0.gold) || 0}"></label><label class="ck"><input type="checkbox" name="big"${r0.big ? " checked" : ""}> Gros lot (mis en avant)</label></div>
      <small>Aucun objet et 0 Gold : jour sans récompense.</small></div>`, { width: 560, icon: "fa-solid fa-gift",
      render: (ev, dlg) => { const root = dlg.element ?? dlg; root.addEventListener("click", async e2 => { const b = e2.target.closest("[data-pk]"); if (!b) return; e2.preventDefault();
        if (b.dataset.pk === "0") id = null; else { const ids = await (await import("./picker.js")).pickEntries({ title: `Récompense — jour ${d}`, multi: false, selected: id ? [id] : [] }); if (ids?.length) id = ids[0]; }
        root.querySelector(".sg-pick").outerHTML = vis(); }); } });
    if (!r) return;
    await editSignal(S2 => { const x = S2.cycles.find(y => y.id === cid); x.rewards ||= {}; if (!id && !Number(r.gold)) delete x.rewards[d]; else x.rewards[d] = { id, q: Math.max(1, Number(r.qty) || 1), gold: Math.max(0, Number(r.gold) || 0), big: !!r.big }; }); this.render(); }
}
Hooks.on("updateSetting", st => { if ([`${MOD}.shop`, "manhwa-sheet.gmGroups", `${MOD}.shopLog`, `${MOD}.signal`, `${MOD}.ticker`, `${MOD}.tickerOn`].includes(st.key)) { const a = foundry.applications.instances.get("lh-shop-admin"); if (a?.rendered && !a.element.contains(document.activeElement)) a.render(); } });
Hooks.on("updateActor", () => { const a = foundry.applications.instances.get("lh-shop-admin"); if (a?.rendered && ["pcs", "signal"].includes(a.tab) && !a.element.contains(document.activeElement)) a.render(); });

/* ── 3.2 : ajouter / retirer un objet du catalogue (MJ) ── */
export async function newEntry(path = {}) {
  const d = db(); const t0 = path.t || "item"; const cats = t => (d.cats || []).filter(c => c.type === t);
  const content = `<div class="bq-f"><div class="r2"><label>Nom<input name="n" value="" placeholder="Nom de l'objet" autofocus></label><label>Prix (${esc(cur())})<input type="number" name="price" min="0" value="0"></label></div>
    <div class="r3"><label>Type<select name="t">${(d.types || []).map(t => opt(t.id, t.name || t.id, t.id === t0)).join("")}</select></label><label>Catégorie<input name="cat" value="${esc(path.c || "")}" list="bq-ncat"><datalist id="bq-ncat">${cats(t0).map(c => `<option value="${esc(c.name)}">`).join("")}</datalist></label>
      <label>Sous-catégorie<input name="sub" value="${esc(path.s || "")}" list="bq-nsub"><datalist id="bq-nsub"></datalist></label></div>
    <div class="r3"><label>Rang<select name="rang">${(d.ranks || []).map(r => opt(r.id, r.id, r.id === "F")).join("")}</select></label><label>Rareté<select name="rar">${(d.rars || []).map(r => opt(r.name, r.name, r.name === "Commun")).join("")}</select></label><label>Stock (vide = aucun)<input type="number" name="stock" min="0" value=""></label></div>
    <div class="r2"><label>Élément<input name="elem" value=""></label><label>Origine<input name="origin" value=""></label></div>
    <label>Description<textarea name="desc" rows="3"></textarea></label><label>Lore (facultatif)<textarea name="lore" rows="2"></textarea></label><label>Image (facultatif)<input name="img" placeholder="chemin ou URL"></label>
    <small>Une catégorie ou sous-catégorie nouvelle est créée automatiquement dans l'arborescence.</small></div>`;
  const r = await form("Nouvel objet du catalogue", content, { width: 640, icon: "fa-solid fa-plus", ok: "Créer",
    render: (ev, dlg) => { const root = dlg.element ?? dlg; const tS = root.querySelector('[name="t"]'), cI = root.querySelector('[name="cat"]');
      const fill = () => { root.querySelector("#bq-ncat").innerHTML = cats(tS.value).map(c => `<option value="${esc(c.name)}">`).join(""); const c = cats(tS.value).find(x => x.name === cI.value); root.querySelector("#bq-nsub").innerHTML = (c?.subs || []).map(x => `<option value="${esc(x.name)}">`).join(""); };
      tS.addEventListener("change", fill); cI.addEventListener("input", fill); fill(); } });
  if (!r) return; if (!String(r.n || "").trim()) return ui.notifications.warn("Il faut un nom."); if (!String(r.cat || "").trim()) return ui.notifications.warn("Il faut une catégorie.");
  const e = { t: r.t, cat: r.cat.trim(), sub: (r.sub || "").trim(), n: r.n.trim(), rang: r.rang, rar: r.rar, price: Math.max(0, Number(r.price) || 0), desc: r.desc || "", id: "" };
  if (r.lore) e.lore = r.lore; if (r.img) e.img = r.img; if (r.elem) e.elem = r.elem; if (r.origin) e.origin = r.origin; if (r.stock !== "" && r.stock != null) e.stock = Math.max(0, Number(r.stock) || 0);
  await C.saveEntry(e, db()); ui.notifications.info(`« ${e.n} » ajouté au catalogue${e.id ? ` (${e.id})` : ""}.`);
}
export async function delEntry(id) {
  const e = entry(id); if (!e) return; const s = shop(); const inB = blocksWith(s, id);
  const ok = await DialogV2.confirm({ window: { title: "Retirer du catalogue", icon: "fa-solid fa-trash" }, classes: ["bq-dlg"], content: `<p>Retirer <b>${esc(e.n)}</b> (${esc(e.id)}) du catalogue ?</p>${inB.length ? `<p>Il sera aussi retiré de la boutique (bloc${inB.length > 1 ? "s" : ""} ${inB.map(b => `« ${esc(b.name)} »`).join(", ")}).</p>` : ""}<p class="hint">Les objets déjà achetés restent sur les fiches.</p>` });
  if (!ok) return; await C.deleteEntry(id); if (inB.length) await editShop(x => { for (const b of x.blocks) b.items = (b.items || []).filter(it => it.id !== id); });
  ui.notifications.info(`« ${e.n} » retiré du catalogue.`);
}
