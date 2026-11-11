/* Boutique 3.0 — fenêtre (plein écran avec Manhwa Sheet) : boutique des blocs choisis par le MJ + catalogue complet en lecture.
 * Sobre : une barre fine, les objets. Clic = petit encadré Acheter / Infos (les clics s'additionnent), clic droit = fiche complète. */
import { MOD, C, esc, nrm, fmtFull, fmtShort, money, shop, shopOf, levelOf, myActors, hasShopSkill, tagsOf, entry, db, rankIdx, rarIdx, rankColor, rarColor, cur,
  picOrIcon, catBg, catIcon3d, iconUrl, coin, levelFor, unitPrice, basePrice, totalPrice, dealLabel, promoLeft, visibleFor, findItem, buy, TAG_RARITY, editShop, blocksWith, uid, cosPic, cosOwned } from "./shop-data.js";
import { decorHTML, themeOf, ambHTML } from "./themes.js";
import { pick } from "./ticker.js";
import * as SFX from "./sfx.js";
const { ApplicationV2, DialogV2 } = foundry.applications.api;

const LS = k => `${MOD}.ui.${k}`;
const lsGet = (k, d) => { try { const v = localStorage.getItem(LS(k)); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(LS(k), JSON.stringify(v)); } catch (e) {} };
const PAGE = 96;
const tierClass = r => ["S", "SS", "SSS"].includes(r) ? r : (["A", "B"].includes(r) ? "hi" : "lo");
/* arbre du catalogue (types › familles › catégories › sous-catégories) avec les nombres d'objets ; recalculé quand la base change */
let _tree = null, _treeDb = null;
function catTree() { const d = db(); if (_tree && _treeDb === d) return _tree; const items = d.items || [];
  const famMap = new Map(); for (const c of d.cats || []) famMap.set(`${c.type}|${c.name}`, String(c.fam || "").trim());
  const famOf = e => famMap.get(`${e.t}|${e.cat}`) || ""; const cnt = new Map(); const inc = k => cnt.set(k, (cnt.get(k) || 0) + 1);
  for (const e of items) { inc(`t|${e.t}`); inc(`f|${e.t}|${famOf(e)}`); inc(`c|${e.t}|${e.cat}`); inc(`s|${e.t}|${e.cat}|${e.sub || ""}`); }
  const types = (d.types || []).map(t => { const cats = (d.cats || []).filter(c => c.type === t.id); const fams = [];
    for (const c of cats) { const fn = String(c.fam || "").trim(); let f = fams.find(x => x.name === fn); if (!f) fams.push(f = { name: fn, cats: [], n: cnt.get(`f|${t.id}|${fn}`) || 0 });
      f.cats.push({ name: c.name, icon: c.icon, n: cnt.get(`c|${t.id}|${c.name}`) || 0, subs: (c.subs || []).map(sb => ({ name: sb.name, n: cnt.get(`s|${t.id}|${c.name}|${sb.name}`) || 0 })).filter(sb => sb.n) }); }
    for (const f of fams) f.cats = f.cats.filter(c => c.n); return { ...t, n: cnt.get(`t|${t.id}`) || 0, fams: fams.filter(f => f.cats.length) }; }).filter(t => t.n);
  _tree = { total: items.length, types, famOf }; _treeDb = d; return _tree; }

export class ShopApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = { id: "lh-catalogue", classes: ["bq-app", "ms-fsable"], window: { title: "Boutique", icon: "fa-solid fa-store", resizable: true, minimizable: true }, position: { width: 1400, height: 860 } };
  static instance = null;
  static open(opts = {}) { let a = ShopApp.instance || foundry.applications.instances.get("lh-catalogue"); if (!a) a = ShopApp.instance = new ShopApp(); if (opts.tab) a.tab = opts.tab; if (opts.actor) a.actorId = opts.actor; a.render({ force: true }); return a; }
  constructor(o) { super(o); this.tab = "shop"; this.actorId = null; this.viewAs = ""; this.q = ""; this.f = { ranks: [], type: "", sort: "rank", afford: false, rar: "" };
    this.view = lsGet("view", "cards"); this.mode = lsGet("mode", "direct"); this.cart = []; this.collapsed = new Set(lsGet("collapsed", [])); this.compose = false; this.catN = PAGE; this.showF = false; this.news = null; this.cq = ""; this.ct = ""; this.cr = ""; this.cN = 60; }
  get title() { return "Boutique"; }
  /** personnage qui achète (MJ : celui qu'il « voit comme », sinon aucun = vue MJ complète) */
  get actor() { if (game.user.isGM) { const a = this.viewAs ? game.actors.get(this.viewAs) : null; return a || null; } const l = myActors(); return l.find(a => a.id === this.actorId) || game.user.character || l[0] || null; }
  get buyer() { if (game.user.isGM) return this.actor || game.actors.get(this.actorId) || null; return this.actor; }

  async _renderHTML() {
    const s = shop(); const gm = game.user.isGM; const a = this.actor; const buyer = this.buyer; const ev = s.event; const th = themeOf(ev);
    const pub = gm || game.settings.get(MOD, "catalogPublic"); if (this.tab === "cat" && !pub) this.tab = "shop";
    const gold = buyer ? Number(foundry.utils.getProperty(buyer, C.buyMapping().actorGoldPath)) || 0 : null;
    const top = `<header class="bq-top">
      <div class="bq-brand"><span class="bq-logo"><svg class="bq-lsvg" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="bqLg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff6ff"/><stop offset=".5" stop-color="#7f8cff"/><stop offset="1" stop-color="#e58bff"/></linearGradient><radialGradient id="bqLg2" cx=".34" cy=".3" r=".85"><stop offset="0" stop-color="#f2fdff"/><stop offset=".4" stop-color="#6cc4ff"/><stop offset="1" stop-color="#23266e"/></radialGradient></defs><path d="M24 2.5 42.6 13.2v21.6L24 45.5 5.4 34.8V13.2Z" fill="#070b1f" stroke="url(#bqLg1)" stroke-width="1.8"/><path d="M24 7.5 38.3 15.8v16.4L24 40.5 9.7 32.2V15.8Z" fill="none" stroke="#8fe9ff" stroke-opacity=".25" stroke-width=".8"/><circle cx="24" cy="25" r="9.5" fill="url(#bqLg2)"/><ellipse cx="24" cy="25" rx="17" ry="5" fill="none" stroke="url(#bqLg1)" stroke-width="1.7" transform="rotate(-20 24 25)"/><path d="M14.5 25a9.5 9.5 0 0 1 19 0" fill="url(#bqLg2)" transform="rotate(-20 24 25)"/><path d="M20.5 22.5h7l-.8 6.2h-5.4Z M22 22.5v-1a2 2 0 0 1 4 0v1" fill="none" stroke="#0b1236" stroke-width="1.3" stroke-linejoin="round" transform="rotate(-20 24 25)" opacity=".75"/><path class="tw" d="M37 6.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1Z" fill="#fff"/><circle class="tw2" cx="10" cy="10" r=".9" fill="#bff6ff"/></svg></span><span class="bq-bt"><b>BOUTIQUE</b><small><i>[</i> SYSTÈME <i>]</i> ORBIS ASTRA</small></span></div>
      <nav class="bq-tabs"><a data-a="tab" data-v="shop" class="${this.tab === "shop" ? "on" : ""}">Boutique</a>${pub ? `<a data-a="tab" data-v="cat" class="${this.tab === "cat" ? "on" : ""}">Catalogue</a>` : ""}</nav>
      ${this.whoHTML(s, a, buyer)}
      <div class="bq-sp"></div>
      ${this.tab === "shop" ? `<label class="bq-search"><i class="fa-solid fa-magnifying-glass"></i><input type="search" data-k="q" value="${esc(this.q)}" placeholder="Rechercher…"></label>
        <button class="bq-b${this.showF ? " on" : ""}" data-a="filters" data-tooltip="Filtres"><i class="fa-solid fa-sliders"></i><span>Filtres</span>${this.fCount() ? `<em>${this.fCount()}</em>` : ""}</button>
        <div class="bq-seg"><button data-a="view" data-v="cards" class="${this.view === "cards" ? "on" : ""}" data-tooltip="Cartes"><i class="fa-solid fa-grip"></i></button><button data-a="view" data-v="list" class="${this.view === "list" ? "on" : ""}" data-tooltip="Liste"><i class="fa-solid fa-list"></i></button></div>
        <div class="bq-modes"><button data-a="mode" data-v="${this.mode === "cart" ? "direct" : "cart"}" class="bq-mode bq-mtog ${this.mode === "cart" ? "c" : "d"} on" data-tooltip="${this.mode === "cart" ? "Les objets vont dans le panier — cliquer pour passer en achat immédiat" : "Un clic = achat — cliquer pour passer en mode panier"}"><i class="fa-solid ${this.mode === "cart" ? "fa-cart-shopping" : "fa-bolt"}"></i><span><small>Mode d'achat :</small> ${this.mode === "cart" ? "Panier" : "Immédiat"}</span><span class="sw" aria-hidden="true"><i class="fa-solid fa-arrows-rotate"></i></span></button></div>` : ""}
      ${gold != null ? `<div class="bq-wallet"><small>SOLDE</small>${money(gold, cur())}</div>` : ""}
      ${gm ? `<div class="bq-gm"><select data-k="viewAs" data-tooltip="Voir comme"><option value="">Vue MJ (tout)</option>${game.actors.filter(x => x.type === "character" && x.hasPlayerOwner).map(x => `<option value="${x.id}"${x.id === this.viewAs ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
        ${this.tab === "shop" ? `<button class="bq-b${this.compose ? " on" : ""}" data-a="compose" data-tooltip="Composer la boutique (glisser des objets du catalogue)"><i class="fa-solid fa-layer-group"></i><span>Composer</span></button>` : ""}
        <button class="bq-b" data-a="admin" data-tooltip="Gestion : personnages, étiquettes, groupes, niveaux, historique, contrôle, bandeau, Signal Quotidien"><i class="fa-solid fa-gear"></i></button></div>` : ""}
    </header>`;
    const ticker = game.settings.get(MOD, "tickerOn") ? `<div class="bq-ticker" data-keep="ticker"></div>` : "";
    const filters = this.tab === "shop" && this.showF ? this.filtersHTML() : "";
    const body = this.tab === "cat" ? this.catalogHTML() : this.compose && gm ? `<div class="bq-compose">${this.composeLeftHTML()}<main class="bq-body" data-scroll="shop">${this.blocksHTML(s, null, true)}</main></div>` : `<main class="bq-body" data-scroll="shop">${this.blocksHTML(s, a)}</main>`;
    const cartN = this.cart.reduce((t, l) => t + l.q, 0);
    const fab = this.tab === "shop" && (this.mode === "cart" || cartN) ? `<button class="bq-fab${cartN ? " has" : ""}" data-a="cart"><i class="fa-solid fa-cart-shopping"></i>${cartN ? `<em>${cartN}</em><span>${money(this.cartTotal(s), cur())}</span>` : "<span>Panier vide</span>"}</button>` : "";
    return `<div class="bq ${th ? "ev" : ""}" ${th ? `style="--ev-a:${th.a};--ev-b:${th.b}"` : ""}><div data-keep="amb">${ambHTML()}</div>${th ? `<div data-keep="decor">${decorHTML(ev)}</div>` : ""}${top}${ticker}${filters}${body}${fab}</div>`;
  }
  whoHTML(s, a, buyer) {
    const gm = game.user.isGM; const L = myActors(); if (gm && !a) return `<div class="bq-who gm"><span class="bq-lv" style="--lc:#e9cf8e"><i class="fa-solid fa-crown"></i>Vue MJ</span></div>`;
    const sel = !gm && L.length > 1 ? `<i class="bq-nmi fa-solid fa-user-astronaut"></i><select data-k="actor" class="nmsel">${L.map(x => `<option value="${x.id}"${x.id === buyer?.id ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select>` : `<b class="nm"><i class="fa-solid fa-user-astronaut"></i><span>${esc(buyer?.name || "—")}</span></b>`;
    const lv = levelOf(buyer); const L0 = s.levels[lv - 1]; const can = hasShopSkill(buyer);
    const tags = tagsOf(buyer, s).sort((x, y) => (y.rarity || 0) - (x.rarity || 0)); const MAXB = 4; const shown = tags.slice(0, MAXB), more = tags.slice(MAXB);
    const badge = t => `<span class="bq-tagb" style="--tc:${esc(t.color || TAG_RARITY[t.rarity || 0][1])}" data-tooltip="${esc(`<b>${t.name}</b><br>${TAG_RARITY[t.rarity || 0][0]}${t.desc ? `<br>${t.desc}` : ""}`)}"><i class="fa-solid ${esc(t.icon || "fa-tag")}"></i>${esc(t.name)}</span>`;
    return `<div class="bq-who">${sel}<span class="bq-lv" style="--lc:${esc(L0.c)}" data-tooltip="Niveau de boutique ${lv} / 10"><i class="fa-solid fa-ranking-star"></i>${esc(L0.n)}</span>
      ${can ? "" : `<span class="bq-warn" data-tooltip="Il faut la compétence « ${esc(game.settings.get(MOD, "shopSkill"))} » pour acheter."><i class="fa-solid fa-eye"></i>Consultation</span>`}
      <span class="bq-tags">${shown.map(badge).join("")}${more.length ? `<span class="bq-more" tabindex="0">+${more.length}<span class="bq-morelist">${more.map(badge).join("")}</span></span>` : ""}</span></div>`;
  }
  fCount() { return (this.f.ranks.length ? 1 : 0) + (this.f.type ? 1 : 0) + (this.f.rar ? 1 : 0) + (this.f.afford ? 1 : 0) + (this.f.sort !== "rank" ? 1 : 0); }
  filtersHTML() { const d = db(); return `<div class="bq-filters">
    <div class="g"><small>Rang</small>${(d.ranks || []).map(r => `<button class="bq-chip${this.f.ranks.includes(r.id) ? " on" : ""}" data-a="fRank" data-v="${esc(r.id)}" style="--rc:${esc(r.color)}">${esc(r.id)}</button>`).join("")}</div>
    <div class="g"><small>Type</small><select data-k="fType"><option value="">Tous</option>${(d.types || []).map(t => `<option value="${esc(t.id)}"${this.f.type === t.id ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div>
    <div class="g"><small>Rareté</small><select data-k="fRar"><option value="">Toutes</option>${(d.rars || []).map(r => `<option${this.f.rar === r.name ? " selected" : ""}>${esc(r.name)}</option>`).join("")}</select></div>
    <div class="g"><small>Tri</small><select data-k="fSort">${[["rank", "Rang"], ["priceA", "Prix croissant"], ["priceD", "Prix décroissant"], ["name", "Nom"]].map(([k, l]) => `<option value="${k}"${this.f.sort === k ? " selected" : ""}>${l}</option>`).join("")}</select></div>
    <label class="g ck"><input type="checkbox" data-k="fAfford"${this.f.afford ? " checked" : ""}> Seulement ce que je peux payer</label>
    <button class="bq-b sm" data-a="fReset"><i class="fa-solid fa-rotate-left"></i> Réinitialiser</button></div>`; }

  /* ── boutique : blocs, objets triés par rang ── */
  blocksHTML(s, a, composing = false) {
    const gm = game.user.isGM; const list = composing ? s.blocks.map(b => ({ b, lock: null, items: (b.items || []).map(it => ({ it, e: it.tag ? null : entry(it.id), lock: null })) })) : visibleFor(a, s);
    const buyer = this.buyer; const gold = buyer ? Number(foundry.utils.getProperty(buyer, C.buyMapping().actorGoldPath)) || 0 : Infinity;
    const q = nrm(this.q); const f = this.f;
    const pass = ({ it, e, b }) => { if (it.tag) return !q || nrm(s.tags.find(t => t.id === it.tag)?.name).includes(q); if (!e) return true;
      if (q && !nrm(`${e.n} ${e.cat} ${e.sub}`).includes(q)) return false; if (f.ranks.length && !f.ranks.includes(e.rang)) return false; if (f.type && e.t !== f.type) return false; if (f.rar && e.rar !== f.rar) return false;
      if (f.afford && unitPrice(it, b) > gold) return false; return true; };
    if (!list.length) return gm ? `<div class="bq-empty"><i class="fa-solid fa-store-slash"></i><p>La boutique est vide.</p><button class="bq-b" data-a="newBlock"><i class="fa-solid fa-plus"></i> Créer un bloc</button><small>Puis « Composer » pour y glisser des objets du catalogue.</small></div>`
      : `<div class="bq-empty"><i class="fa-solid fa-store-slash"></i><p>Rien à vendre pour toi… pour l'instant.</p><small>Le Système ouvrira ses rayons quand tu en seras digne.</small></div>`;
    let html = "";
    for (const B of list) { const b = B.b; const items = B.items.filter(x => pass({ ...x, b })); if (!items.length && (q || this.fCount()) && !composing) continue;
      const col = this.collapsed.has(b.id) && !composing; const prL = promoLeft(b.promo); const ver = gm ? (b.items || []).filter(x => x.verified).length : 0;
      const lockTxt = B.lock ? (B.lock.why === "lv" ? `Niveau ${esc(s.levels[(B.lock.need || 1) - 1]?.n)} requis` : B.lock.why === "tag" ? `Étiquette requise : ${esc((B.lock.tags || []).map(t => s.tags.find(x => x.id === t)?.name).filter(Boolean).join(", "))}` : "") : "";
      html += `<section class="bq-block${b.promo?.on ? " promo" : ""}${B.lock ? " locked" : ""}${b.hidden ? " hid" : ""}${col ? " col" : ""}" data-b="${b.id}" style="--bc:${esc(b.color || "#e9cf8e")}">
        <header class="bq-bh" data-a="collapse"><i class="bi fa-solid ${esc(b.icon || "fa-box-open")}"></i><div class="bt"><h3>${esc(b.name)}</h3>${b.desc ? `<small>${esc(b.desc)}</small>` : ""}</div>
          ${b.promo?.on ? `<span class="bq-ribbon"><b>−${Number(b.promo.pct) || 0} %</b>${b.promo.label ? `<span>${esc(b.promo.label)}</span>` : ""}${prL ? `<em><i class="fa-regular fa-clock"></i>${esc(prL)}</em>` : ""}</span>` : ""}
          ${lockTxt ? `<span class="bq-lock"><i class="fa-solid fa-lock"></i>${lockTxt}</span>` : ""}
          ${gm ? `<span class="bq-bgm">${b.hidden ? `<span class="bq-pill">Masqué</span>` : ""}${b.event ? `<span class="bq-pill">${esc(b.event)}</span>` : ""}${(b.to?.actors?.length || b.to?.groups?.length) ? `<span class="bq-pill"><i class="fa-solid fa-user-lock"></i>Ciblé</span>` : ""}<span class="bq-pill" data-tooltip="Offres vérifiées">${ver}/${(b.items || []).length} <i class="fa-solid fa-check"></i></span>
            <button data-a="restockB" data-tooltip="Réapprovisionner le bloc"><i class="fa-solid fa-boxes-stacked"></i></button><button data-a="editBlock" data-tooltip="Modifier le bloc"><i class="fa-solid fa-pen"></i></button><button data-a="upBlock" data-tooltip="Monter"><i class="fa-solid fa-arrow-up"></i></button><button data-a="delBlock" data-tooltip="Supprimer le bloc"><i class="fa-solid fa-trash"></i></button></span>` : ""}
          <i class="cv fa-solid fa-chevron-down"></i></header>
        ${col ? "" : `<div class="bq-items ${this.view}" data-drop="${b.id}">${this.itemsHTML(items, b, s, gold, composing)}${composing ? `<div class="bq-dropzone"><i class="fa-solid fa-hand-pointer"></i> Glisse ici des objets du catalogue</div>` : ""}</div>`}</section>`; }
    if (gm) html += `<button class="bq-addblock" data-a="newBlock"><i class="fa-solid fa-plus"></i> Nouveau bloc</button>`;
    return html || `<div class="bq-empty"><i class="fa-solid fa-filter-circle-xmark"></i><p>Aucun objet ne correspond.</p></div>`;
  }
  sortItems(items, b) { const f = this.f; const by = { priceA: (x, y) => unitPrice(x.it, b) - unitPrice(y.it, b), priceD: (x, y) => unitPrice(y.it, b) - unitPrice(x.it, b), name: (x, y) => String(x.e?.n || "").localeCompare(String(y.e?.n || ""), "fr") }[f.sort];
    return items.slice().sort(by || ((x, y) => (x.it.tag ? -1 : 0) - (y.it.tag ? -1 : 0) || rankIdx(x.e?.rang) - rankIdx(y.e?.rang) || rarIdx(x.e?.rar) - rarIdx(y.e?.rar) || String(x.e?.n || "").localeCompare(String(y.e?.n || ""), "fr"))); }
  itemsHTML(items, b, s, gold, composing) {
    const sorted = this.sortItems(items, b); let last = null; let out = ""; const cnt = {}; for (const x of sorted) { const k = x.it.tag ? "★" : x.e?.rang || "?"; cnt[k] = (cnt[k] || 0) + 1; }
    for (const x of sorted) { const rk = x.it.tag ? "★" : x.e?.rang || "?"; if (this.f.sort === "rank" && rk !== last) { last = rk; const tag = !!x.it.tag; const n = cnt[rk];
      out += `<div class="bq-rk2 t-${tag ? "tag" : tierClass(rk)}" style="--rc:${tag ? "#ffd76a" : rankColor(rk)}"><header class="bq-rband"><span class="bq-rkb lg n${tag ? 1 : String(rk).length}"><b>${tag ? `<i class="fa-solid fa-tag"></i>` : esc(rk)}</b></span><span class="tt"><small>${tag ? "PRIVILÈGES" : "CLASSE"}</small><b>${tag ? "ÉTIQUETTES" : `RANG ${esc(rk)}`}</b></span><em>${n} ${tag ? (n > 1 ? "étiquettes" : "étiquette") : (n > 1 ? "objets" : "objet")}</em><i class="ln"></i></header></div>`; }
      out += this.cardHTML(x, b, s, gold, composing); }
    return out;
  }
  cardHTML({ it, e, lock }, b, s, gold, composing) {
    const gm = game.user.isGM; const cr = cur();
    if (!it.tag && !e) return `<div class="bq-card missing" data-k="${it.k}" data-b="${b.id}"><p>Objet introuvable<br><small>${esc(it.id)}</small></p>${gm ? `<button class="x" data-a="rmItem" data-tooltip="Retirer"><i class="fa-solid fa-xmark"></i></button>` : ""}</div>`;
    const tag = it.tag ? s.tags.find(t => t.id === it.tag) : null; const name = tag ? tag.name : e.n;
    const u = unitPrice(it, b), b0 = basePrice(it); const disc = u < b0; const out = it.stock != null && it.stock !== "" && Number(it.stock) <= 0;
    const lim = Number(it.limit) || 0; const used = lim && this.buyer ? shopOf(this.buyer).bought?.[it.k] || 0 : 0; const limOut = lim && used >= lim;
    const owned = (tag && this.buyer && (shopOf(this.buyer).tags || []).includes(tag.id)) || (!tag && cosOwned(this.buyer, e));
    const pic = tag ? `<i class="tagic fa-solid ${esc(tag.icon || "fa-tag")}" style="color:${esc(tag.color || "#ffd76a")}"></i>` : (() => { const P = picOrIcon(e); return e.cosm ? cosPic(e) : P.pic ? `<img src="${esc(P.pic)}" alt="" loading="lazy" decoding="async">` : `<i class="ico" style="--ico:url('${esc(P.icon)}')"></i>`; })();
    const rc = tag ? "#ffd76a" : rankColor(e.rang), rr = tag ? (tag.color || "#ffd76a") : rarColor(e.rar); const cb = tag ? null : catBg(e);
    const lockTxt = lock ? (lock.why === "lv" ? `Niveau ${esc(s.levels[(lock.need || 1) - 1]?.n || "?")} requis` : "Étiquette requise") : "";
    const dl = dealLabel(it.deal); const stockTxt = it.stock != null && it.stock !== "" ? fmtShort(it.stock) : ""; const stockTip = it.stock != null && it.stock !== "" ? `Stock : ${fmtFull(it.stock)}${it.max ? ` / ${fmtFull(it.max)}` : ""}` : "";
    const outTxt = it.restock ? "Réapprovisionnement en cours" : "Épuisé — revenez plus tard";
    return `<div class="bq-card t-${tag ? "tag" : tierClass(e.rang)}${out || limOut || owned ? " out" : ""}${lock ? " locked" : ""}${disc ? " disc" : ""}${tag ? " istag" : ""}" data-k="${it.k}" data-b="${b.id}" style="--rc:${esc(rc)};--rr:${esc(rr)}"${composing ? ` draggable="true"` : ""}>
      <span class="rkl">${tag ? `<i class="fa-solid fa-tag"></i>` : `<b>${esc(e.rang)}</b>`}</span><div class="pic${tag ? "" : ` ${cb.cls}`}"${tag ? "" : ` style="${cb.style}"`}>${pic}<span class="rk bq-rkb n${tag ? 1 : String(e.rang||"").length}"><b>${tag ? `<i class="fa-solid fa-tag"></i>` : esc(e.rang)}</b></span>${!tag && e.rar ? `<span class="bq-rar">${esc(e.rar)}</span>` : ""}${disc ? `<span class="pct">−${Math.round((1 - u / Math.max(1, b0)) * 100)} %</span>` : ""}${dl ? `<span class="deal">${esc(dl)}</span>` : ""}</div>
      <div class="inf"><b class="nm">${esc(name)}</b><small class="sub">${tag ? "Étiquette" : `${esc(e.cat || "")}${e.sub ? ` › ${esc(e.sub)}` : ""}`}</small></div>
      <div class="ft"><span class="pr${u > gold ? " ko" : ""}">${disc ? `<s>${fmtShort(b0)}</s>` : ""}${money(u, cr)}</span>${stockTxt ? `<span class="st" data-tooltip="${esc(stockTip)}"><i class="fa-solid fa-boxes-stacked"></i>${stockTxt}</span>` : ""}${lim ? `<span class="lm" data-tooltip="Limite par personnage"><i class="fa-solid fa-user-lock"></i>${used}/${lim}</span>` : ""}</div>
      ${out ? `<div class="ov"><i class="fa-solid fa-box-open"></i><span>${outTxt}</span></div>` : limOut ? `<div class="ov"><i class="fa-solid fa-ban"></i><span>Limite atteinte</span></div>` : owned ? `<div class="ov ok"><i class="fa-solid fa-check"></i><span>${tag ? "Déjà obtenue" : "Déjà débloqué"}</span></div>` : lock ? `<div class="ov lk"><i class="fa-solid fa-lock"></i><span>${lockTxt}</span></div>` : ""}
      ${gm ? `<div class="gmx"><button data-a="verify" class="${it.verified ? "on" : ""}" data-tooltip="${it.verified ? "Vérifié" : "Marquer vérifié"}"><i class="fa-solid fa-check"></i></button><button data-a="editOffer" data-tooltip="Offre : stock, réduction, limite"><i class="fa-solid fa-sliders"></i></button><button data-a="rmItem" data-tooltip="Retirer du bloc"><i class="fa-solid fa-xmark"></i></button></div>` : ""}
    </div>`;
  }
  cartTotal(s = shop()) { let t = 0; for (const l of this.cart) { const f = findItem(s, l.k); if (f) t += totalPrice(f.it, f.b, l.q); } return t; }

  /* ── catalogue complet (lecture ; le MJ peut modifier et ajouter à un bloc) ── */
  /* ── catalogue complet : arborescence type › famille › catégorie › sous-catégorie, rangs néon ── */
  get cpath() { return this._cp ||= { t: "", f: "", c: "", s: "" }; }
  catBase(useRanks = true) { const T = catTree(); const p = this.cpath; const q = nrm(this.cq); const all = this.cAll && q;
    let L = db().items || [];
    if (!all && p.t) L = L.filter(e => e.t === p.t && (!p.f || T.famOf(e) === p.f) && (!p.c || e.cat === p.c) && (!p.s || e.sub === p.s));
    if (q) L = L.filter(e => nrm(`${e.n} ${e.cat} ${e.sub} ${e.id}`).includes(q)); if (this.cRar) L = L.filter(e => e.rar === this.cRar);
    if (useRanks && this.cRanks?.length) L = L.filter(e => this.cRanks.includes(e.rang)); return L; }
  sortCat(L) { const by = { priceA: (x, y) => (Number(x.price) || 0) - (Number(y.price) || 0), priceD: (x, y) => (Number(y.price) || 0) - (Number(x.price) || 0), rar: (x, y) => rarIdx(y.rar) - rarIdx(x.rar) || String(x.n).localeCompare(String(y.n), "fr") }[this.cSort]; return L.slice().sort(by || ((x, y) => String(x.n).localeCompare(String(y.n), "fr"))); }
  treeHTML(compact = false) { const T = catTree(); const p = this.cpath; const open = this.cOpen ||= new Set(lsGet("cOpen", []));
    const node = (cls, attrs, label, n, { icon = "", caret = null, on = false, color = "" } = {}) => `<a class="tn ${cls}${on ? " on" : ""}" data-a="cPath" ${attrs}${color ? ` style="--tc:${esc(color)}"` : ""}>${caret == null ? "<i class='cr'></i>" : `<i class="cr fa-solid fa-chevron-right${caret ? " op" : ""}" data-a="cTog"></i>`}${icon}<span>${esc(label)}</span><em>${n.toLocaleString("fr-FR")}</em></a>`;
    let h = node("all", `data-t=""`, "Tout le catalogue", T.total, { on: !p.t, icon: `<i class="ti fa-solid fa-gem"></i>` });
    for (const t of T.types) { const kT = `t|${t.id}`; const oT = open.has(kT);
      h += `<div class="tg" style="--tc:${esc(t.color || "#7cc4ff")}">` + node("t", `data-t="${esc(t.id)}"`, t.label || t.name, t.n, { on: p.t === t.id && !p.f && !p.c, caret: oT, icon: `<i class="ti ico" style="--ico:url('${esc(iconUrl(t.icon))}')"></i>` });
      if (oT) for (const f of t.fams) { const kF = `${kT}|${f.name}`; const oF = !f.name || open.has(kF);
        if (f.name) h += node("f", `data-t="${esc(t.id)}" data-f="${esc(f.name)}"`, f.name, f.n, { on: p.t === t.id && p.f === f.name && !p.c, caret: oF });
        if (oF) for (const c of f.cats) { const kC = `${kT}|c|${c.name}`; const oC = open.has(kC);
          h += node(`c${f.name ? "" : " nf"}`, `data-t="${esc(t.id)}" data-f="${esc(f.name)}" data-c="${esc(c.name)}"`, c.name, c.n, { on: p.t === t.id && p.c === c.name && !p.s, caret: c.subs.length ? oC : null, icon: catIcon3d(t.id, c.name) ? `<img class="ti3" src="${esc(catIcon3d(t.id, c.name))}" alt="" loading="lazy">` : c.icon ? `<i class="ti ico sm" style="--ico:url('${esc(iconUrl(c.icon))}')"></i>` : "" });
          if (oC) { for (const sb of c.subs) h += node(`s${f.name ? "" : " nf"}`, `data-t="${esc(t.id)}" data-f="${esc(f.name)}" data-c="${esc(c.name)}" data-s="${esc(sb.name)}"`, sb.name, sb.n, { on: p.t === t.id && p.c === c.name && p.s === sb.name });
            if (!compact && c.subs.length > 4) h += `<button class="tcol c${f.name ? "" : " nf"}" data-a="cTog" data-t="${esc(t.id)}" data-f="${esc(f.name)}" data-c="${esc(c.name)}" data-tooltip="Réduire ${esc(c.name)}"><i class="fa-solid fa-chevron-up"></i></button>`; } }
        if (f.name && oF && !compact) h += `<button class="tcol f" data-a="cTog" data-t="${esc(t.id)}" data-f="${esc(f.name)}" data-tooltip="Réduire ${esc(f.name)}"><i class="fa-solid fa-chevron-up"></i></button>`; }
      if (oT) h += `<button class="tcol t" data-a="cTog" data-t="${esc(t.id)}"><i class="fa-solid fa-chevron-up"></i><span>Réduire ${esc(t.label || t.name)}</span></button>`;
      h += `</div>`; }
    return `<nav class="bq-tree${compact ? " compact" : ""}">${h}</nav>`; }
  crumbsHTML() { const T = catTree(); const p = this.cpath; const t = T.types.find(x => x.id === p.t); const parts = [`<a data-a="cPath" data-t="">Catalogue</a>`];
    if (t) parts.push(`<a data-a="cPath" data-t="${esc(t.id)}" style="color:${esc(t.color)}">${esc(t.label || t.name)}</a>`); if (p.f) parts.push(`<a data-a="cPath" data-t="${esc(p.t)}" data-f="${esc(p.f)}">${esc(p.f)}</a>`);
    if (p.c) parts.push(`<a data-a="cPath" data-t="${esc(p.t)}" data-f="${esc(p.f)}" data-c="${esc(p.c)}">${esc(p.c)}</a>`); if (p.s) parts.push(`<a data-a="cPath" data-t="${esc(p.t)}" data-f="${esc(p.f)}" data-c="${esc(p.c)}" data-s="${esc(p.s)}">${esc(p.s)}</a>`);
    return `<div class="bq-crumbs">${parts.join(`<i class="fa-solid fa-chevron-right"></i>`)}</div>`; }
  catalogHTML() { const d = db(); const s = shop(); const gm = game.user.isGM; const base = this.catBase(false); const L = this.catBase(true);
    const byR = new Map(); for (const e of base) byR.set(e.rang, (byR.get(e.rang) || 0) + 1);
    const chips = `<div class="bq-rchips">${(d.ranks || []).map(r => `<button class="bq-hex${this.cRanks?.includes(r.id) ? " on" : ""}${byR.get(r.id) ? "" : " zero"}" data-a="cRank" data-v="${esc(r.id)}" style="--rc:${rankColor(r.id)}"><b>${esc(r.id)}</b><em>${(byR.get(r.id) || 0).toLocaleString("fr-FR")}</em></button>`).join("")}${this.cRanks?.length ? `<button class="bq-b sm" data-a="cRankClr"><i class="fa-solid fa-xmark"></i> Tous les rangs</button>` : ""}</div>`;
    const bar = `<div class="bq-ctool">${this.crumbsHTML()}<span class="bq-sp"></span><label class="bq-search"><i class="fa-solid fa-magnifying-glass"></i><input type="search" data-k="cq" value="${esc(this.cq || "")}" placeholder="Rechercher…"></label>
      <button class="bq-b sm${this.cAll ? " on" : ""}" data-a="cAll" data-tooltip="Chercher dans tout le catalogue (sinon dans la sélection)"><i class="fa-solid fa-globe"></i><span>Partout</span></button>
      <select data-k="cRar"><option value="">Toutes raretés</option>${(d.rars || []).map(r => `<option${this.cRar === r.name ? " selected" : ""}>${esc(r.name)}</option>`).join("")}</select>
      <select data-k="cSort">${[["name", "Nom"], ["priceA", "Prix croissant"], ["priceD", "Prix décroissant"], ["rar", "Rareté"]].map(([k, l]) => `<option value="${k}"${(this.cSort || "name") === k ? " selected" : ""}>${l}</option>`).join("")}</select>
      <div class="bq-seg"><button data-a="view" data-v="cards" class="${this.view === "cards" ? "on" : ""}"><i class="fa-solid fa-grip"></i></button><button data-a="view" data-v="list" class="${this.view === "list" ? "on" : ""}"><i class="fa-solid fa-list"></i></button></div>
      <span class="bq-count">${L.length.toLocaleString("fr-FR")} objets</span>${gm ? `<button class="bq-b sm gold" data-a="newEntry" data-tooltip="Ajouter un objet au catalogue (dans la catégorie affichée)"><i class="fa-solid fa-plus"></i><span>Nouvel objet</span></button>` : ""}</div>`;
    const ranks = [...(d.ranks || [])].reverse(); const show = this.cShow ||= {}; let secs = ""; this.cBase = this.cRanks?.length === 1 ? 48 : 21;
    for (const r of ranks) { const items = this.sortCat(L.filter(e => e.rang === r.id)); if (!items.length) continue; const n = show[r.id] || this.cBase || 48;
      secs += `<section class="bq-rsec t-${tierClass(r.id)}" style="--rc:${rankColor(r.id)}"><header class="bq-rband"><span class="bq-rkb lg n${String(r.id).length}"><b>${esc(r.id)}</b></span><span class="tt"><small>CLASSE</small><b>RANG ${esc(r.id)}</b></span><em>${items.length.toLocaleString("fr-FR")} entrées</em><i class="ln"></i></header>
        <div class="bq-items ${this.view}">${items.slice(0, n).map(e => this.catCard(e, s, gm)).join("")}</div>${items.length > n ? `<button class="bq-more-btn" data-a="cMore" data-v="${esc(r.id)}">Afficher plus (${(items.length - n).toLocaleString("fr-FR")})</button>` : ""}</section>`; }
    return `<div class="bq-catwrap">${this.treeHTML()}<main class="bq-body cat neon" data-scroll="cat">${bar}${chips}${secs || `<div class="bq-empty"><i class="fa-solid fa-filter-circle-xmark"></i><p>Aucun objet ici.</p></div>`}</main></div>`; }
  catCard(e, s, gm) { const P = picOrIcon(e); const CB = catBg(e); const inB = gm ? blocksWith(s, e.id).length : 0; const T = (db().types || []).find(t => t.id === e.t);
    const lvN = levelFor(e, s); const meta = [e.elem ? `<span><i class="fa-solid fa-atom"></i>${esc(e.elem)}</span>` : "", e.origin ? `<span><i class="fa-solid fa-globe"></i>${esc(e.origin)}</span>` : "", e.lv ? `<span><i class="fa-solid fa-arrow-up-right-dots"></i>Niv ${esc(e.lv)}</span>` : ""].filter(Boolean).join("");
    return `<div class="bq-card cat t-${tierClass(e.rang)}" data-id="${esc(e.id)}" style="--rc:${rankColor(e.rang)};--rr:${rarColor(e.rar)};--tc:${esc(T?.color || "#7cc4ff")}"${gm ? ` draggable="true"` : ""}>
      <span class="rkl"><b>${esc(e.rang)}</b></span><div class="pic ${CB.cls}" style="${CB.style}">${e.cosm ? cosPic(e) : P.pic ? `<img src="${esc(P.pic)}" alt="" loading="lazy" decoding="async">` : `<i class="ico" style="--ico:url('${esc(P.icon)}')"></i>`}<span class="rk bq-rkb n${String(e.rang||"").length}"><b>${esc(e.rang)}</b></span>${e.rar ? `<span class="bq-rar">${esc(e.rar)}</span>` : ""}${cosOwned(this.buyer, e) ? `<span class="deal own" data-tooltip="Déjà débloqué pour ${esc(this.buyer.name)}"><i class="fa-solid fa-check"></i></span>` : ""}${inB ? `<span class="deal" data-tooltip="Déjà en boutique"><i class="fa-solid fa-store"></i></span>` : ""}
        ${gm ? `<div class="gmx cat"><button data-a="editEntryC" data-tooltip="Modifier"><i class="fa-solid fa-pen"></i></button><button data-a="delEntry" class="danger" data-tooltip="Retirer du catalogue"><i class="fa-solid fa-trash"></i></button></div>` : ""}</div>
      <div class="inf"><b class="nm">${esc(e.n)}${e.rar ? `<em class="rr">${esc(e.rar)}</em>` : ""}</b><small class="sub"><i class="ty ico" style="--ico:url('${esc(iconUrl(T?.icon))}')"></i>${esc(e.cat || "")}${e.sub ? ` › ${esc(e.sub)}` : ""}</small>${meta ? `<div class="meta">${meta}</div>` : ""}</div>
      <div class="ft"><span class="pr">${money(e.price, cur())}</span>${lvN <= 10 ? `<span class="st lvc" style="--lc:${esc(s.levels[lvN - 1].c || "#e9cf8e")}" data-tooltip="Niveau de boutique requis : ${lvN} / 10"><i class="fa-solid fa-ranking-star"></i>${esc(s.levels[lvN - 1].n)}</span>` : ""}</div></div>`; }
  composeLeftHTML() { const s = shop(); const L = this.sortCat(this.catBase(true)).sort((x, y) => rankIdx(x.rang) - rankIdx(y.rang)); const show = L.slice(0, this.cN || 60);
    return `<aside class="bq-src"><div class="bq-srch"><label class="bq-search wide"><i class="fa-solid fa-magnifying-glass"></i><input type="search" data-k="cq" value="${esc(this.cq || "")}" placeholder="Chercher dans le catalogue…"></label>
      ${this.crumbsHTML()}<small>${L.length.toLocaleString("fr-FR")} objets · glisse-les dans un bloc</small></div>${this.treeHTML(true)}
      <div class="bq-srcl">${show.map(e => { const inB = blocksWith(s, e.id)[0]; return `<div class="bq-src-it${inB ? " used" : ""}" draggable="true" data-id="${esc(e.id)}" style="--rc:${rankColor(e.rang)}"><span class="rk">${esc(e.rang)}</span><b>${esc(e.n)}</b><small>${esc(e.sub || e.cat || "")}</small><em>${fmtShort(e.price)}</em>${inB ? `<i class="fa-solid fa-store" data-tooltip="Déjà dans « ${esc(inB.name)} »"></i>` : ""}</div>`; }).join("")}
      ${L.length > show.length ? `<button class="bq-more-btn" data-a="srcMore">+ ${Math.min(60, L.length - show.length)}</button>` : ""}</div></aside>`; }

  /* ── affichage : on garde le bandeau, le décor, le défilement et la saisie en cours ── */
  _replaceHTML(html, content) {
    const keep = {}; content.querySelectorAll("[data-keep]").forEach(n => keep[n.dataset.keep] = n);
    const sc = {}; content.querySelectorAll("[data-scroll]").forEach(n => sc[n.dataset.scroll] = n.scrollTop); this._treeTop = content.querySelector(".bq-tree")?.scrollTop ?? this._treeTop; const src = content.querySelector(".bq-srcl")?.scrollTop || 0;
    const fk = document.activeElement?.dataset?.k && content.contains(document.activeElement) ? { k: document.activeElement.dataset.k, s: document.activeElement.selectionStart } : null;
    content.innerHTML = html;
    for (const [k, n] of Object.entries(keep)) { const ph = content.querySelector(`[data-keep="${k}"]`); if (ph) ph.replaceWith(n); }
    if (this._resetScroll) { this._resetScroll = false; delete sc.cat; } content.querySelectorAll("[data-scroll]").forEach(n => { if (sc[n.dataset.scroll]) n.scrollTop = sc[n.dataset.scroll]; }); const tr = content.querySelector(".bq-tree"); if (tr && this._treeTop != null) tr.scrollTop = this._treeTop; const sl = content.querySelector(".bq-srcl"); if (sl) sl.scrollTop = src;
    if (fk) { const i = content.querySelector(`[data-k="${fk.k}"]`); if (i) { i.focus(); try { i.setSelectionRange(fk.s, fk.s); } catch (e) {} } }
    this.bind(content); this.fillTicker(content);
  }
  async fillTicker(root) { const t = root.querySelector(".bq-ticker"); if (!t || t.dataset.on) return; t.dataset.on = "1"; this.news ||= await pick(18); if (!this.news.length) { t.remove(); return; }
    const txt = this.news.map(n => `<span>${esc(n)}</span>`).join(`<i>◆</i>`); t.innerHTML = `<div class="tk-lbl"><i class="fa-solid fa-satellite-dish"></i>FLUX COSMIQUE</div><div class="tk-win"><div class="tk-run" style="--dur:${Math.max(60, this.news.join(" ").length / 9)}s">${txt}<i>◆</i>${txt}<i>◆</i></div></div>`; }
  _onFirstRender() { this._lv = null; this.checkLevel(); }
  _onClose() { ShopApp.instance = null; clearTimeout(this._pt); this.closePop(); }

  bind(c) {
    c.querySelectorAll("[data-a]").forEach(el => el.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); this.act(el.dataset.a, el, ev); }));
    c.querySelectorAll("[data-k]").forEach(el => { const k = el.dataset.k; const h = () => this.field(k, el); if (el.tagName === "INPUT" && (el.type === "search" || el.type === "text")) { let t = 0; el.addEventListener("input", () => { clearTimeout(t); t = setTimeout(h, 220); }); } else el.addEventListener("change", h); });
    c.querySelectorAll(".bq-card").forEach(card => { card.addEventListener("click", ev => { if (ev.target.closest("[data-a]")) return; this.cardClick(card, ev); }); card.addEventListener("contextmenu", ev => { ev.preventDefault(); if (game.user.isGM) this.ctxMenu(card, ev); else this.info(card); }); });
    /* glisser du catalogue vers un bloc (MJ) */
    if (game.user.isGM) {
      c.querySelectorAll("[draggable=true]").forEach(d => d.addEventListener("dragstart", ev => { const id = d.dataset.id || findItem(shop(), d.dataset.k)?.it?.id; if (!id) return; ev.dataTransfer.setData("text/plain", JSON.stringify({ bqId: id, fromK: d.dataset.k || null })); ev.dataTransfer.effectAllowed = "copyMove"; }));
      c.querySelectorAll(".bq-block").forEach(sec => { sec.addEventListener("dragover", ev => { ev.preventDefault(); sec.classList.add("over"); }); sec.addEventListener("dragleave", () => sec.classList.remove("over"));
        sec.addEventListener("drop", ev => { ev.preventDefault(); sec.classList.remove("over"); let d = null; try { d = JSON.parse(ev.dataTransfer.getData("text/plain")); } catch (e) {} if (d?.bqId) this.addTo(sec.dataset.b, d.bqId, d.fromK); }); });
    }
  }
  async field(k, el) { const v = el.type === "checkbox" ? el.checked : el.value;
    if (k === "q") { this.q = v; return this.render(); } if (k === "actor") { this.actorId = v; this.cart = []; return this.render(); } if (k === "viewAs") { this.viewAs = v; this.actorId = v || this.actorId; this.cart = []; return this.render(); }
    if (k === "fType") this.f.type = v; else if (k === "fRar") this.f.rar = v; else if (k === "fSort") this.f.sort = v; else if (k === "fAfford") this.f.afford = v;
    else if (k === "cq") { this.cq = v; this.cShow = {}; this.cN = 60; } else if (k === "cRar") { this.cRar = v; this.cShow = {}; } else if (k === "cSort") { this.cSort = v; }
    this.render(); }
  async act(a, el, ev) {
    const s = shop(); const sec = el.closest("[data-b]"); const bid = sec?.dataset.b; const k = el.closest("[data-k]")?.dataset.k;
    const gmApi = () => import("./shop-gm.js");
    switch (a) {
      case "tab": this.tab = el.dataset.v; this.closePop(); return this.render();
      case "filters": this.showF = !this.showF; return this.render();
      case "view": this.view = el.dataset.v; lsSet("view", this.view); return this.render();
      case "mode": this.mode = el.dataset.v; lsSet("mode", this.mode); return this.render();
      case "fRank": { const v = el.dataset.v; this.f.ranks = this.f.ranks.includes(v) ? this.f.ranks.filter(x => x !== v) : [...this.f.ranks, v]; return this.render(); }
      case "fReset": this.f = { ranks: [], type: "", sort: "rank", afford: false, rar: "" }; return this.render();
      case "cRank": { const v = el.dataset.v; this.cRanks ||= []; this.cRanks = this.cRanks.includes(v) ? this.cRanks.filter(x => x !== v) : [...this.cRanks, v]; this.cN = 60; return this.render(); }
      case "cRankClr": this.cRanks = []; return this.render();
      case "cAll": this.cAll = !this.cAll; return this.render();
      case "newEntry": return (await gmApi()).newEntry({ ...this.cpath });
      case "editEntryC": return (await gmApi()).editEntry(el.closest("[data-id]").dataset.id);
      case "delEntry": return (await gmApi()).delEntry(el.closest("[data-id]").dataset.id);
      case "cMore": { this.cShow ||= {}; this.cShow[el.dataset.v] = (this.cShow[el.dataset.v] || this.cBase || 48) + 84; return this.render(); }
      case "cTog": { const a2 = el.closest("[data-t]"); const d2 = a2.dataset; const k2 = d2.c ? `t|${d2.t}|c|${d2.c}` : d2.f ? `t|${d2.t}|${d2.f}` : `t|${d2.t}`; const o = this.cOpen ||= new Set(); if (o.has(k2)) o.delete(k2); else o.add(k2); lsSet("cOpen", [...o]);
        const p = this.cpath; if (!o.has(k2) && p.t === d2.t && (!d2.f || p.f === d2.f) && (!d2.c || p.c === d2.c)) { if (d2.c) p.s = ""; else if (d2.f) { p.c = ""; p.s = ""; } else { p.f = ""; p.c = ""; p.s = ""; } this._cp = { ...p, ...(d2.c ? {} : d2.f ? { f: d2.f } : { t: d2.t }) }; } return this.render(); }
      case "cPath": { if (ev.target.closest('[data-a="cTog"]')) return; const d2 = el.dataset; this._cp = { t: d2.t || "", f: d2.f || "", c: d2.c || "", s: d2.s || "" }; this.cShow = {}; this.cN = 60;
        const o = this.cOpen ||= new Set(); if (d2.t) o.add(`t|${d2.t}`); if (d2.f) o.add(`t|${d2.t}|${d2.f}`); if (d2.c) o.add(`t|${d2.t}|c|${d2.c}`); lsSet("cOpen", [...o]);
        const sc = this.element?.querySelector('[data-scroll="cat"]'); if (sc) sc.scrollTop = 0; this._resetScroll = true; return this.render(); }
      case "srcMore": this.cN += 60; return this.render();
      case "collapse": if (ev.target.closest(".bq-bgm")) return; if (this.collapsed.has(bid)) this.collapsed.delete(bid); else this.collapsed.add(bid); lsSet("collapsed", [...this.collapsed]); return this.render();
      case "compose": this.compose = !this.compose; return this.render();
      case "cart": return this.cartDialog();
      case "admin": return (await gmApi()).AdminApp.open();
      case "newBlock": return (await gmApi()).editBlock(null);
      case "editBlock": return (await gmApi()).editBlock(bid);
      case "delBlock": { const b = s.blocks.find(x => x.id === bid); if (!b) return; if (!await DialogV2.confirm({ window: { title: "Supprimer le bloc" }, classes: ["bq-dlg"], content: `<p>Supprimer « ${esc(b.name)} » et ses ${(b.items || []).length} offres ?</p>` })) return; return editShop(x => { x.blocks = x.blocks.filter(y => y.id !== bid); }); }
      case "upBlock": return editShop(x => { const i = x.blocks.findIndex(y => y.id === bid); if (i <= 0) return false; [x.blocks[i - 1], x.blocks[i]] = [x.blocks[i], x.blocks[i - 1]]; });
      case "restockB": return editShop(x => { const b = x.blocks.find(y => y.id === bid); for (const it of b?.items || []) if (it.max) { it.stock = Number(it.max); it.restock = false; } });
      case "verify": return editShop(x => { const f = findItem(x, k); if (!f) return false; f.it.verified = !f.it.verified; });
      case "editOffer": return (await gmApi()).editOffer(k);
      case "rmItem": return editShop(x => { const b = x.blocks.find(y => y.id === bid); if (!b) return false; b.items = (b.items || []).filter(y => y.k !== k); });
    }
  }
  /** ajoute un objet du catalogue à un bloc (un objet n'est que dans un seul bloc : avertissement) */
  async addTo(bid, id, fromK) {
    const s = shop(); const e = entry(id); if (!e) return; const other = blocksWith(s, id).find(b => b.id !== bid);
    if (fromK && findItem(s, fromK)?.b.id === bid) return;
    if (fromK) return editShop(x => { const f = findItem(x, fromK); if (!f) return false; f.b.items = f.b.items.filter(y => y.k !== fromK); x.blocks.find(y => y.id === bid).items.push(f.it); });
    if (other || blocksWith(s, id).some(b => b.id === bid)) return ui.notifications.warn(`« ${e.n} » est déjà dans le bloc « ${(other || s.blocks.find(b => b.id === bid)).name} ». Un objet ne peut être que dans un seul bloc.`);
    const st = Number.isFinite(Number(e.stock)) && e.stock !== null && e.stock !== "" ? Number(e.stock) : null;
    await editShop(x => { const b = x.blocks.find(y => y.id === bid); if (!b) return false; (b.items ||= []).push({ k: uid(), id, stock: st, max: st, limit: 0, pct: 0, deal: null, verified: false }); });
  }

  /* ── achat : petit encadré ── */
  closePop() { document.querySelectorAll(".bq-pop").forEach(p => p.remove()); this._pop = null; }
  cardClick(card, ev) {
    if (card.classList.contains("cat")) return this.info(card);
    const k = card.dataset.k; if (!k) return; if (this._pop?.k === k) return this.closePop(); this.closePop();
    const s = shop(); const f = findItem(s, k); if (!f) return; const gm = game.user.isGM; const buyer = this.buyer;
    const blocked = card.classList.contains("out") || card.classList.contains("locked") || !buyer || (!gm && !hasShopSkill(buyer));
    const pop = document.createElement("div"); pop.className = "bq-pop"; const cart = this.mode === "cart";
    pop.innerHTML = `<div class="row"><button class="i" data-p="info"><i class="fa-solid fa-circle-info"></i> Infos</button>${f.it.tag ? "" : `<div class="qty"><button data-p="minus">−</button><input type="number" min="1" value="1" data-p="q"><button data-p="plus">+</button></div>`}</div>
      <button class="buy" data-p="buy"${blocked ? " disabled" : ""}><i class="fa-solid ${cart ? "fa-cart-plus" : "fa-coins"}"></i><span>${blocked ? (!buyer ? "Choisis un personnage" : !hasShopSkill(buyer) && !gm ? "Consultation seulement" : "Indisponible") : cart ? "Ajouter au panier" : "Acheter"}</span><em class="pend"></em></button><small class="tot"></small>`;
    document.body.appendChild(pop); const r = card.getBoundingClientRect(); const pw = 240; let left = r.left + r.width / 2 - pw / 2; left = Math.max(8, Math.min(innerWidth - pw - 8, left)); let top = r.bottom - 14; if (top + 150 > innerHeight) top = r.top - 150;
    Object.assign(pop.style, { left: `${left}px`, top: `${top}px`, width: `${pw}px` }); this._pop = { k, el: pop, pending: 0 };
    const qi = pop.querySelector('[data-p="q"]'); const qv = () => Math.max(1, Math.floor(Number(qi?.value) || 1)); const tot = pop.querySelector(".tot");
    const upd = () => { const n = this._pop?.pending || qv(); tot.innerHTML = `Total ${money(totalPrice(f.it, f.b, f.it.tag ? 1 : n), cur())}`; }; upd(); qi?.addEventListener("input", upd);
    pop.addEventListener("click", ev2 => { const b = ev2.target.closest("[data-p]"); if (!b) return; const p = b.dataset.p;
      if (p === "info") { this.closePop(); return this.info(card); }
      if (p === "minus") { qi.value = Math.max(1, qv() - 1); return upd(); } if (p === "plus") { qi.value = qv() + 1; return upd(); }
      if (p === "buy") { if (b.disabled) return; SFX.tick(); const add = f.it.tag ? 1 : qv();
        if (cart) { const l = this.cart.find(x => x.k === k); if (l) l.q += add; else this.cart.push({ k, q: add }); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); pop.querySelector(".pend").textContent = `+${add}`; this.render(); return; }
        if (f.it.tag) { this._pop.pending = 1; } else this._pop.pending += add; pop.querySelector(".pend").textContent = `×${this._pop.pending}`; b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); upd();
        clearTimeout(this._pt); const P = this._pop; this._pt = setTimeout(() => this.commit(P), f.it.tag ? 50 : 950); } });
    setTimeout(() => { const off = ev3 => { if (!pop.isConnected) return document.removeEventListener("pointerdown", off, true); if (!pop.contains(ev3.target) && !ev3.target.closest?.(`.bq-card[data-k="${k}"]`)) { if (this._pop?.pending) { clearTimeout(this._pt); this.commit(this._pop); } this.closePop(); document.removeEventListener("pointerdown", off, true); } }; document.addEventListener("pointerdown", off, true); }, 0);
  }
  async commit(P) { if (!P?.pending) return; const n = P.pending; P.pending = 0; const buyer = this.buyer; this.closePop();
    const r = await buy(buyer, [{ k: P.k, q: n }]); if (r?.ok) { SFX.coins(n); this.flash(P.k); } }
  flash(k) { const c = this.element?.querySelector(`.bq-card[data-k="${k}"]`); if (!c) return; c.classList.add("bought"); setTimeout(() => c.classList.remove("bought"), 900); }
  async cartDialog() {
    const s = shop(); const cr = cur(); const rows = this.cart.map(l => { const f = findItem(s, l.k); if (!f) return ""; const e = f.it.tag ? null : entry(f.it.id); const nm = f.it.tag ? s.tags.find(t => t.id === f.it.tag)?.name : e?.n;
      return `<div class="bq-cl" data-k="${l.k}"><b>${esc(nm || "?")}</b><div class="qty"><button data-c="minus">−</button><input type="number" min="1" value="${l.q}" data-c="q"><button data-c="plus">+</button></div><span class="p">${money(totalPrice(f.it, f.b, l.q), cr)}</span><button class="x" data-c="rm"><i class="fa-solid fa-xmark"></i></button></div>`; }).join("");
    const gold = this.buyer ? Number(foundry.utils.getProperty(this.buyer, C.buyMapping().actorGoldPath)) || 0 : 0;
    const r = await DialogV2.wait({ window: { title: "Panier", icon: "fa-solid fa-cart-shopping" }, classes: ["bq-dlg", "bq-cart"], position: { width: 520 }, rejectClose: false,
      content: `<div class="bq-cartl">${rows || "<p class='none'>Panier vide.</p>"}</div><div class="bq-ct"><span>Total</span><b class="total">${money(this.cartTotal(s), cr)}</b><small>Solde : ${money(gold, cr)}</small></div>`,
      render: (e2, dlg) => { const root = dlg.element ?? dlg; const sync = () => { root.querySelectorAll(".bq-cl").forEach(row => { const l = this.cart.find(x => x.k === row.dataset.k); if (!l) return; const f = findItem(s, l.k); row.querySelector(".p").innerHTML = money(totalPrice(f.it, f.b, l.q), cr); }); root.querySelector(".total").innerHTML = money(this.cartTotal(s), cr); };
        root.addEventListener("click", e3 => { const b = e3.target.closest("[data-c]"); if (!b) return; const row = b.closest(".bq-cl"); const l = this.cart.find(x => x.k === row?.dataset.k); if (!l) return; e3.preventDefault();
          if (b.dataset.c === "minus") l.q = Math.max(1, l.q - 1); if (b.dataset.c === "plus") l.q++; if (b.dataset.c === "rm") { this.cart = this.cart.filter(x => x !== l); row.remove(); } const i = row.querySelector("input"); if (i) i.value = l.q; sync(); });
        root.addEventListener("change", e3 => { const i = e3.target.closest('[data-c="q"]'); if (!i) return; const l = this.cart.find(x => x.k === i.closest(".bq-cl").dataset.k); if (l) l.q = Math.max(1, Math.floor(Number(i.value) || 1)); sync(); }); },
      buttons: [{ action: "buy", label: "Tout acheter", icon: "fa-solid fa-coins", default: true }, { action: "clear", label: "Vider", icon: "fa-solid fa-trash" }, { action: "close", label: "Fermer" }] });
    if (r === "clear") { this.cart = []; return this.render(); }
    if (r !== "buy" || !this.cart.length) return this.render();
    const n = this.cart.reduce((t, l) => t + l.q, 0); const res = await buy(this.buyer, this.cart); if (res?.ok) { SFX.coins(n); this.cart = []; } this.render();
  }

  /* ── fiche complète ── */
  /* 3.11 : clic droit du MJ sur un objet → Fiche / Donner… (quantité, groupes, joueurs) / Ajouter à un bloc */
  ctxMenu(card, ev) { document.getElementById("bq-ctx")?.remove(); const k = card.dataset.k; const f = k ? findItem(shop(), k) : null; const id = card.dataset.id || f?.it?.id; const e = id ? entry(id) : null;
    const m = document.createElement("div"); m.id = "bq-ctx"; m.className = "bq-ctx";
    const items = [["info", "fa-circle-info", "Fiche complète"], ...(e ? [["give", "fa-gift", e.cosm ? "Donner (débloquer)…" : "Donner…"], ...(f ? [] : [["add", "fa-plus", "Ajouter à un bloc"]])] : [])];
    m.innerHTML = `${e ? `<header>${esc(e.n)}</header>` : ""}${items.map(([a, ic, l]) => `<a data-c="${a}"><i class="fa-solid ${ic}"></i>${l}</a>`).join("")}`;
    document.body.appendChild(m); const W = m.offsetWidth, H = m.offsetHeight; m.style.left = `${Math.min(ev.clientX, innerWidth - W - 8)}px`; m.style.top = `${Math.min(ev.clientY, innerHeight - H - 8)}px`;
    const close = () => { m.remove(); document.removeEventListener("pointerdown", out, true); }; const out = e2 => { if (!m.contains(e2.target)) close(); };
    setTimeout(() => document.addEventListener("pointerdown", out, true), 0);
    m.addEventListener("click", async e2 => { const a = e2.target.closest("[data-c]")?.dataset.c; if (!a) return; close();
      if (a === "info") return this.info(card); if (a === "give") return C.giveEntry?.(e); if (a === "add") { const G = await import("./shop-gm.js"); const bid = await G.pickBlock(); if (bid) this.addTo(bid, e.id); } }); }
  async info(card) {
    const s = shop(); const gm = game.user.isGM; const k = card.dataset.k; const f = k ? findItem(s, k) : null; const id = card.dataset.id || f?.it?.id; const cr = cur();
    /* tuile néon : icône, libellé, valeur (couleur optionnelle) */
    const tile = (ic, l, v, c = "") => v != null && v !== "" ? `<div class="st"${c ? ` style="--nc:${esc(c)}"` : ""}><i class="fa-solid ${ic}"></i><span>${l}</span><b>${v}</b></div>` : "";
    const offerTiles = () => { if (!f) return ""; const it = f.it; const base = basePrice(it); const u = unitPrice(it, f.b); const pct = base > 0 && u < base ? Math.round((1 - u / base) * 100) : 0;
      const lim = Number(it.limit) || 0; const used = lim && this.buyer ? shopOf(this.buyer).bought?.[it.k] || 0 : 0;
      return tile("fa-store", "Bloc", esc(f.b.name || "Boutique"), "#7fd8ff")
        + tile("fa-boxes-stacked", "Stock", it.stock != null && it.stock !== "" ? `<span data-tooltip="${fmtFull(it.stock)}${it.max ? ` / ${fmtFull(it.max)}` : ""}">${fmtShort(it.stock)}${it.max ? ` / ${fmtShort(it.max)}` : ""}</span>` : "Illimité", "#5ef0c8")
        + tile("fa-user-lock", "Limite", lim ? `${used} / ${lim} par personnage` : "Aucune", "#ffb86b")
        + tile("fa-percent", "Réduction", pct ? `−${pct} %` : "Aucune", "#ff6b8a")
        + (dealLabel(it.deal) ? tile("fa-gift", "Offre", esc(dealLabel(it.deal)), "#ffd76a") : "")
        + (it.restock ? tile("fa-truck-ramp-box", "Réassort", "En cours", "#9fb2d6") : ""); };
    const btns = (extra = []) => { const L = [{ action: "close", label: "Fermer", default: true }]; return gm ? [...extra, ...L] : L; };
    /* étiquette : même fiche que les objets */
    if (f?.it?.tag) { const t = s.tags.find(x => x.id === f.it.tag) || {}; const R = TAG_RARITY[t.rarity || 0]; const col = t.color || R[1]; const u = unitPrice(f.it, f.b); const base = basePrice(f.it);
      const unlock = s.blocks.filter(bl => (bl.tags || []).includes(t.id)).map(bl => esc(bl.name)).join(", ");
      const content = `<div class="bq-gi tag" style="--rc:${esc(col)};--rr:${esc(col)};--tc:${esc(col)}">
        <div class="hero"><div class="pic"><i class="tagic fa-solid ${esc(t.icon || "fa-tag")}"></i><span class="bq-rkb lg n1"><b><i class="fa-solid fa-tag"></i></b></span></div>
          <div class="hd"><small class="ty"><i class="fa-solid fa-tag"></i> Étiquette · privilège de boutique</small><h2>${esc(t.name || "Étiquette")}</h2>
            <div class="tags"><span class="bq-rar static">${esc(R[0])}</span>${f.it.verified ? `<span class="lvl" style="--lc:#5ef0c8"><i class="fa-solid fa-check"></i> Vérifiée</span>` : ""}</div>
            <div class="price">${money(u, cr)}${u < base ? `<s>${fmtShort(base)}</s>` : ""}</div></div></div>
        ${t.desc ? `<p class="ds">${esc(t.desc)}</p>` : ""}<p class="lo"><i class="fa-solid fa-key"></i>Débloque les blocs qui demandent cette étiquette${unlock ? ` : ${unlock}` : ""}.</p>
        <div class="stats">${tile("fa-gem", "Rareté", esc(R[0]), col)}${offerTiles()}</div></div>`;
      return DialogV2.wait({ window: { title: t.name || "Étiquette", icon: "fa-solid fa-tag" }, classes: ["bq-dlg", "bq-infodlg"], position: { width: 620 }, rejectClose: false, content, buttons: btns() }); }
    const e = entry(id); if (!e) return; const P = picOrIcon(e); const d = db(); const T = (d.types || []).find(t => t.id === e.t);
    const price = f ? unitPrice(f.it, f.b) : Number(e.price) || 0; const lvN = levelFor(e, s); const L = s.levels[lvN - 1];
    const CB = catBg(e); const content = `<div class="bq-gi t-${tierClass(e.rang)}" style="--rc:${rankColor(e.rang)};--rr:${rarColor(e.rar)};--tc:${esc(T?.color || "#7cc4ff")}">
      <div class="hero"><div class="pic ${CB.cls}" style="${CB.style}">${e.cosm ? cosPic(e) : P.pic ? `<img src="${esc(P.pic)}" alt="">` : `<i class="ico" style="--ico:url('${esc(P.icon)}')"></i>`}<span class="bq-rkb lg n${String(e.rang || "").length}"><b>${esc(e.rang)}</b></span></div>
        <div class="hd"><small class="ty"><i class="ico" style="--ico:url('${esc(iconUrl(T?.icon))}')"></i>${esc(T?.name || e.t)} · ${esc(e.cat || "")}${e.sub ? ` › ${esc(e.sub)}` : ""}</small><h2>${esc(e.n)}</h2>
          <div class="tags">${e.rar ? `<span class="bq-rar static">${esc(e.rar)}</span>` : ""}<span class="lvl"${lvN <= 10 ? ` style="--lc:${esc(L.c || "#e9cf8e")}"` : ""}>${lvN <= 10 ? `<i class="fa-solid fa-ranking-star"></i> Boutique · ${esc(L.n)}` : "Hors niveaux"}</span>${gm ? `<span class="id">${esc(e.id)}</span>` : ""}</div>
          <div class="price">${money(price, cr)}${f && price < (Number(e.price) || 0) ? `<s>${fmtShort(e.price)}</s>` : ""}</div></div></div>
      ${e.desc ? `<p class="ds">${esc(e.desc)}</p>` : ""}${e.lore ? `<p class="lo"><i class="fa-solid fa-feather"></i>${esc(e.lore)}</p>` : ""}
      <div class="stats">${tile("fa-chess-rook", "Rang", esc(e.rang), rankColor(e.rang))}${tile("fa-gem", "Rareté", esc(e.rar || ""), rarColor(e.rar))}${tile("fa-globe", "Origine", esc(e.origin || ""), "#7fd8ff")}${tile("fa-hourglass-half", "Époque", esc(e.epoch || ""), "#c9b6ff")}
        ${tile("fa-atom", "Élément", esc(e.elem || ""), "#5ef0ff")}${tile("fa-snowflake", "Saison", esc(e.season || ""), "#bfe9ff")}${tile("fa-arrow-up-right-dots", "Niveau", esc(e.lv || ""), "#8ff0b0")}${tile("fa-arrow-trend-up", "Évolution", esc(e.evo || ""), "#ffb86b")}
        ${tile("fa-unlock", "Condition", esc(e.cond || ""), "#ff9bd8")}${tile("fa-industry", "Fabricant", esc(e.brand || ""), "#d0d8f0")}${e._unit ? tile("fa-layer-group", "Lot", `par ${esc(e._unit)}`, "#ffd76a") : ""}
        ${tile("fa-ranking-star", "Niveau boutique", lvN <= 10 ? `${lvN} · ${esc(L.n)}` : "Hors niveaux", L?.c || "#e9cf8e")}${offerTiles()}</div></div>`;
    const extra = [{ action: "give", label: "Donner…", icon: "fa-solid fa-gift" }, { action: "edit", label: "Modifier", icon: "fa-solid fa-pen" }, { action: "del", label: e.cosm ? "Masquer" : "Retirer", icon: "fa-solid fa-trash" }]; if (!f) extra.splice(1, 0, { action: "add", label: "Ajouter à un bloc", icon: "fa-solid fa-plus" });
    const r = await DialogV2.wait({ window: { title: e.n, icon: "fa-solid fa-circle-info" }, classes: ["bq-dlg", "bq-infodlg"], position: { width: 640 }, rejectClose: false, content, buttons: btns(extra) });
    if (r === "give") return C.giveEntry?.(e); const G = await import("./shop-gm.js"); if (r === "edit") G.editEntry(e.id); if (r === "del") G.delEntry(e.id); if (r === "add") { const bid = await G.pickBlock(); if (bid) this.addTo(bid, e.id); }
  }

  /* ── animation de niveau (une fois par passage de niveau, par navigateur) ── */
  checkLevel() { const a = this.buyer; if (!a || game.user.isGM) return; const lv = levelOf(a); const key = `lv.${a.id}`; const seen = lsGet(key, null); lsSet(key, lv); if (seen == null || lv <= seen) return; this.levelFx(lv); }
  levelFx(lv) { const s = shop(); const L = s.levels[lv - 1]; const root = this.element; if (!root) return; root.querySelector(".bq-lvfx")?.remove();
    const fx = document.createElement("div"); fx.className = "bq-lvfx"; fx.style.setProperty("--lc", L.c); fx.innerHTML = `<div class="rays"></div><div class="ring"></div><div class="txt"><small>NIVEAU DE BOUTIQUE ${lv}</small><b>${esc(L.n)}</b><span>De nouveaux rayons s'ouvrent à toi.</span></div>`;
    root.appendChild(fx); SFX.levelUp(); fx.addEventListener("click", () => fx.remove()); setTimeout(() => fx.remove(), 3600); }
}

/* ── rafraîchissements ── */
let _rt = 0; const soon = () => { clearTimeout(_rt); _rt = setTimeout(() => { const a = ShopApp.instance; if (a?.rendered) a.render(); }, 120); };
Hooks.on("manhwaSeason", () => soon());
Hooks.on("updateSetting", st => { if ([`${MOD}.shop`, "manhwa-sheet.gmGroups", `${MOD}.delta`, `${MOD}.tickerOn`, `${MOD}.catalogPublic`, `${MOD}.lockedMode`].includes(st.key)) soon(); if (st.key === `${MOD}.ticker`) { const a = ShopApp.instance; if (a) { a.news = null; a.element?.querySelector(".bq-ticker")?.removeAttribute("data-on"); soon(); } } });
Hooks.on("updateActor", (actor, ch) => { const a = ShopApp.instance; if (!a?.rendered) return; if (a.buyer?.id === actor.id || game.user.isGM) { if (a.buyer?.id === actor.id && foundry.utils.hasProperty(ch, `flags.${MOD}.shop.lv`)) a.checkLevel(); soon(); } });
Hooks.on("createItem", it => { if (it.parent?.id === ShopApp.instance?.buyer?.id) soon(); }); Hooks.on("deleteItem", it => { if (it.parent?.id === ShopApp.instance?.buyer?.id) soon(); });
