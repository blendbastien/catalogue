/* The Last Horizon — Le Catalogue (Boutique du Système) — Foundry VTT v12/v13 — moteur Boutique + contenu livré */
const MOD = "last-horizon-catalogue";
const BASE_URL = `modules/${MOD}/data/catalogue.json`;
const { ApplicationV2 } = foundry.applications.api;
import { C as SHOP_CORE, registerShopSettings, initShopData } from "./shop-data.js";
import { ShopApp } from "./shop-app.js";
import { initSignal, registerSignalTab } from "./signal.js";

/* ───────────────── Réglages ───────────────── */
const MAP_DEFAULT = {
  itemType: "equippableItem", templateName: "",
  keyName: "", keyRang: "rang", keyRarete: "rarete", keyType: "type", keyGold: "gold", keyQuantite: "quantite",
  keyDescription: "description", keyLore: "lore", keyNiveau: "niveau", keyElement: "element", keyCategorie: "", keyRangNum: "",
  actorGoldPath: "system.props.gold", deduct: true
};
class MappingConfig extends FormApplication {
  static get defaultOptions() { return foundry.utils.mergeObject(super.defaultOptions, { id: "bq-map", title: "Boutique — Correspondance CSB", template: `modules/${MOD}/templates/mapping.hbs`, width: 560, classes: ["bq-map-form"] }); }
  getData() { return { m: foundry.utils.mergeObject(foundry.utils.deepClone(MAP_DEFAULT), game.settings.get(MOD, "mapping")) }; }
  async _updateObject(_ev, data) { await game.settings.set(MOD, "mapping", foundry.utils.expandObject(data).m); ui.notifications.info("Correspondance CSB enregistrée."); }
}

Hooks.once("init", () => {
  game.settings.register(MOD, "delta", { scope: "world", config: false, type: String, default: "" });
  game.settings.register(MOD, "bagFix", { scope: "world", config: false, type: Number, default: 0 });
  game.settings.register(MOD, "autoTemplates", { name: "Créer automatiquement les templates CSB du Catalogue", hint: "À l'ouverture du monde par le MJ, les 12 templates d'objets « Catalogue — … » manquants sont créés. Ignoré si le module Fiche Manhwa est actif (ses templates sont utilisés).", scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MOD, "picPath", { name: "Pack d'icônes illustrées", hint: "Dossier (bibliothèque de fichiers / Assets Library) qui contient icons.json et les icônes des objets. Vide = icônes vectorielles par catégorie.", scope: "world", config: true, type: String, default: "", filePicker: "folder", onChange: () => loadPics() });
  game.settings.register(MOD, "season", { scope: "world", config: false, type: String, default: "" });
  game.settings.register(MOD, "playersCanOpen", { name: "Les joueurs peuvent ouvrir la Boutique", scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MOD, "sidebarButtons", { name: "Boutons dans la barre latérale", hint: "Affiche un bouton d'ouverture du Catalogue en haut de l'onglet Objets et/ou Journal. Désactivé par défaut (le bouton des contrôles de scène reste toujours là).", scope: "world", config: true, type: String, choices: { none: "Masqués (défaut)", journal: "Onglet Journal", items: "Onglet Objets", both: "Journal et Objets" }, default: "none", onChange: () => { ui.journal?.render(); ui.items?.render(); } });
  game.settings.register(MOD, "playersCanBuy", { name: "Les joueurs peuvent acheter", hint: "Sinon seul le MJ peut créer les objets.", scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MOD, "chatOnBuy", { name: "Message dans le chat à chaque achat", scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MOD, "stockDecrement", { name: "Décrémenter le stock à l'achat", hint: "Un article dont le stock est géré perd un exemplaire à chaque achat.", scope: "world", config: true, type: Boolean, default: true });
  game.settings.register(MOD, "mapping", { scope: "world", config: false, type: Object, default: MAP_DEFAULT });
  game.modules.get(MOD).api = { currentSeason, picOf, addToCatalogue, open: openBoutique, buy: buyEntry, give: giveEntry, importCompendium, getDB, setDB, loadBase, templates, templateKeys, ensureTemplates, templateKeyFor, itemData, shop: () => import("./shop-data.js").then(m => m.shop()) , pick: o => import("./picker.js").then(m => m.pickEntries(o)), blocks: () => import("./picker.js").then(m => m.shopBlocks()), icon2d: e => import("./shop-data.js").then(m => m.picOrIcon(e)?.pic || ""), visual: () => import("./shop-data.js").then(m => ({ picOrIcon: m.picOrIcon, catBg: m.catBg, tierClass: m.tierClass, rankColor: m.rankColor, rarColor: m.rarColor, entry: m.entry })), signalNextDay: () => import("./signal.js").then(m => m.nextDayAll()), editShop: fn => import("./shop-data.js").then(m => m.editShop(fn)), shopData: () => import("./shop-data.js").then(m => m.shop()),
    restockAll: () => import("./shop-data.js").then(m => m.editShop(s => { for (const b of s.blocks) for (const it of b.items || []) if (it.max) { it.stock = Number(it.max); it.restock = false; } })),
    promoTick: (n = 1) => import("./shop-data.js").then(m => m.editShop(s => { for (const b of s.blocks) if (b.promo?.on && Number(b.promo.days)) { b.promo.days = Math.max(0, Number(b.promo.days) - n); if (!b.promo.days && !Number(b.promo.hours)) b.promo.on = false; } })), admin: tab => import("./shop-gm.js").then(m => m.AdminApp.open(tab))};
  registerShopSettings();
});

/* ───────────────── Base de données (réglage du monde) ───────────────── */
/* saison : gérée par Manhwa Sheet (MANHWA.season) quand le système est là ; l'« événement » = une saison du Catalogue */
const CLIM_EMOJI = { spring: "🌸", summer: "☀️", autumn: "🍂", winter: "❄️" };
const nrmS = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sheetSeason = () => { try { return globalThis.MANHWA?.season?.() || null; } catch (e) { return null; } };
/** nom de l'événement en cours, tel qu'écrit dans le Catalogue */
export function currentSeason() {
  const ms = sheetSeason(); if (!ms) return game.settings.get(MOD, "season") || "";
  if (!ms.eventName) return ""; const db = getDB() || {}; const names = [...(db.seasons || []).map(x => x.name || x), ...(db.items || []).map(e => e.season).filter(Boolean)];
  return names.find(n => nrmS(n) === nrmS(ms.eventName)) || ms.eventName;
}
const climateOf = () => { const ms = sheetSeason(); return ms ? { key: ms.key, name: ms.name, color: ms.color, emoji: CLIM_EMOJI[ms.key] || "" } : null; };
/* pack d'icônes illustrées : dossier (réglage) contenant icons.json { map: { idObjet: "chemin/relatif.webp" } } */
const PICS = { base: "", data: null };
const absU = p => { p = String(p || ""); if (!p || /^(https?:|data:|blob:|\/)/.test(p)) return p; try { return foundry.utils.getRoute(p); } catch (e) { return "/" + p; } };
async function loadPics() { const dir = String(game.settings.get(MOD, "picPath") || "").replace(/\/+$/, ""); PICS.data = null; PICS.base = ""; if (!dir) return;
  try { PICS.base = absU(dir) + "/"; const r = await fetch(PICS.base + "icons.json", { cache: "no-cache" }); if (r.ok) PICS.data = await r.json(); } catch (e) { console.warn(MOD, "icons.json introuvable", e); } pushState(false); }
/* logo : l'icône du Catalogue du Menu Manhwa (pack d'images de l'Appel des Étoiles), sinon celui d'origine */
function menuLogo() { try { if (!game.modules.get("gacha-manhwa")?.active) return ""; const b = String(game.settings.get("gacha-manhwa", "assetPath") || "").replace(/\/+$/, ""); return b ? absU(`${b}/img/ic_book.webp`) : ""; } catch (e) { return ""; } }
/** image illustrée d'un objet du Catalogue (ou "") — utilisée aussi par l'Appel des Étoiles et les Véhicules */
export const picOf = id => { const p = PICS.data?.map?.[id]; return p ? (/^(https?:|data:|\/)/.test(p) ? p : PICS.base + p) : ""; };
const CFG_KEYS = ["meta", "ranks", "rars", "elems", "worlds", "epochs", "seasons", "levels", "types", "cats", "ticker"];
let _base = null;
async function loadBase() { if (!_base) _base = await (await fetch(BASE_URL)).json(); return _base; }
/* ── Manhwa Sheet : correspondance type|catégorie|sous-catégorie du Catalogue → feuille de l'arbre des objets (data/manhwa-map.json) ── */
let _msMap = null;
async function loadManhwaMap() { if (!_msMap) { try { _msMap = await (await fetch(`modules/${MOD}/data/manhwa-map.json`)).json(); } catch (e) { console.error(MOD, e); _msMap = {}; } } return _msMap; }
const isManhwa = () => game.system.id === "manhwa-sheet" && typeof globalThis.MANHWA?.config === "function";
const msNorm = v => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
function msMatch(list, raw) { const n = msNorm(raw); if (!n) return ""; const hit = (list || []).find(x => msNorm(x.key) === n || msNorm(x.name) === n); return hit ? hit.key : ""; }
/* chemin du portefeuille sur une fiche Manhwa Sheet : la monnaie « gold » si elle existe, sinon celle qui paie les stats, sinon la première */
function msGoldPath() { const c = globalThis.MANHWA.config(); const r = c.resources.find(x => msNorm(x.key) === "gold" || msNorm(x.name) === "gold") || c.resources.find(x => x.paysStats) || c.resources[0]; return r ? `system.resources.${r.key}` : null; }
function msCategory(e, map, db) {
  const cfg = globalThis.MANHWA.config(); const all = globalThis.MANHWA.categories();
  const id = map[`${e.t}|${e.cat}|${e.sub || ""}`] || map[`${e.t}|${e.cat}|`];
  if (id && all.some(n => n.id === id)) return id;
  /* repli : par les noms (type › famille › catégorie › sous-catégorie) dans l'arbre réel de la partie */
  const tn = (db.types || []).find(t => t.id === e.t)?.name; const fam = (db.cats || []).find(c => c.type === e.t && c.name === e.cat)?.fam;
  const roots = { skill: "Compétences", title: "Titres", weapon: "Armes", armor: "Armures", vehicle: "Véhicules", companion: "Compagnons", property: "Propriétés", item: "Objets" };
  const rootName = roots[e.t] || tn; const nice = s => String(s || "").toLowerCase().replace(/(^|\s|&\s)(\p{L})/gu, m => m.toUpperCase());
  for (const path of [[rootName, nice(fam), e.cat, e.sub], [rootName, e.cat, e.sub], [rootName, nice(fam), e.cat], [rootName, e.cat], [rootName]]) { const r = globalThis.MANHWA.findCategory(path.filter(Boolean)); if (r) return r; }
  return all.find(n => !n.children?.length)?.id || "";
}

Hooks.once("ready", () => { loadPics(); loadBase().catch(e => console.error(MOD, e)); if (game.system.id === "manhwa-sheet") loadManhwaMap(); });
function getDelta() { try { const s = game.settings.get(MOD, "delta"); return s ? JSON.parse(s) : null; } catch (e) { console.error(MOD, "delta illisible", e); return null; } }
/* base + delta → base fusionnée (synchrone si la base est déjà chargée) */
function getDB() {
  if (!_base) return null;
  const d = foundry.utils.deepClone(_base); const delta = getDelta();
  if (delta?.cfg) for (const k in delta.cfg) if (CFG_KEYS.includes(k)) d[k] = delta.cfg[k];
  injectCosmetics(d);
  if (delta) { const del = new Set(delta.del || []); if (del.size) d.items = d.items.filter(e => !del.has(e.id)); if (delta.items) { const idx = new Map(d.items.map((e, i) => [e.id, i])); for (const id in delta.items) { const e = delta.items[id]; if (idx.has(id)) { const b = d.items[idx.get(id)]; d.items[idx.get(id)] = (b.bag && !e.bag) ? { ...e, bag: b.bag, msCat: e.msCat || b.msCat, desc: /Places?\n/.test(e.desc || "") ? e.desc : b.desc } : e; } else d.items.push(e); } } }
  /* 2.12 : la catégorie de titres « Obtention » s'appelle « Succès » (y compris dans les modifications enregistrées du monde) */
  if (!(d.cats || []).some(c => c.type === "title" && c.name === "Succès")) for (const c of d.cats || []) if (c.type === "title" && c.name === "Obtention") c.name = "Succès";
  for (const e of d.items) if (e.t === "title" && e.cat === "Obtention") e.cat = "Succès";
  return d;
}
/* 3.11 : les cosmétiques de Manhwa Sheet (carte du joueur, téléphone) sont des articles du Catalogue (type « Cosmétiques »).
 * Acheter ou donner un cosmétique le débloque (rien n'est créé sur la fiche). Le MJ peut changer leur prix, rang, description (modifications du monde). */
const COS_T = { id: "cosm", label: "COSMÉTIQUES", name: "Cosmétique", icon: "sparkle", color: "#ff9ad5", prefix: "CS" };
const cosId = gid => `CS-${String(gid).replace(/[^a-zA-Z0-9]+/g, "-")}`;
function injectCosmetics(d) { const L = globalThis.MANHWA?.cosmetics?.list?.(); if (!L?.length) return;
  d.types ||= []; if (!d.types.some(t => t.id === "cosm")) d.types.push({ ...COS_T }); d.cats ||= [];
  for (const [fam, icon] of [["Carte du joueur", "ticket"], ["Téléphone", "phone"]]) { const subs = [...new Set(L.filter(c => c.family === fam).map(c => c.kindName))]; let c = d.cats.find(x => x.type === "cosm" && x.name === fam);
    if (!c) d.cats.push(c = { type: "cosm", name: fam, icon, fam: "", subs: [] }); for (const n of subs) if (!(c.subs ||= []).some(x => x.name === n)) c.subs.push({ name: n, icon: "" }); }
  const have = new Set(d.items.map(e => e.id));
  for (const c of L) { const id = cosId(c.id); if (have.has(id)) continue; d.items.push({ id, t: "cosm", cat: c.family, sub: c.kindName, n: c.name, rang: c.rank, rar: c.rarName, price: c.price, desc: c.desc, origin: "Orbis Astra", cosm: c.id, img: c.img || "", cicon: c.icon, ccss: c.css || "", ccol: c.color || "", pack: c.packName || "" }); }
}
const cosApi = () => globalThis.MANHWA?.cosmetics;
async function getDBAsync() { await loadBase(); return getDB(); }
/* verrous par clé partagés avec Manhwa Sheet et les autres modules (globalThis) : une seule lecture-écriture à la fois sur le Catalogue
 * (réglage « delta ») ou sur un personnage (or, inventaire), tous modules confondus (2.14.0) */
const LOCKS = globalThis.__manhwaLocks ||= new Map();
function withLock(key, fn) { const prev = LOCKS.get(key) || Promise.resolve(); const run = prev.then(fn); const tail = run.catch(() => {}); LOCKS.set(key, tail); tail.then(() => { if (LOCKS.get(key) === tail) LOCKS.delete(key); }); return run; }
const actorLock = (actor, fn) => withLock(`actor:${actor?.uuid || actor}`, fn);
const DELTA_LOCK = `set:${MOD}.delta`;
async function setDB(delta) { if (!game.user.isGM) return ui.notifications.warn("Seul le MJ peut modifier le Catalogue."); await withLock(DELTA_LOCK, () => game.settings.set(MOD, "delta", JSON.stringify(delta))); }
/* met à jour un article dans le delta (stock…) : lecture et écriture sous le même verrou ; fn(article) rend false pour ne rien écrire */
async function patchItem(id, fn) { return withLock(DELTA_LOCK, async () => { const db = await getDBAsync(); const it = db.items.find(x => x.id === id); if (!it) return null; if (fn(it) === false) return null; const delta = getDelta() || { v: 2, cfg: {}, items: {}, del: [] }; delta.items = delta.items || {}; delta.items[id] = it; await game.settings.set(MOD, "delta", JSON.stringify(delta)); return it; }); }
const typeName = (db, t) => (db?.types || []).find(x => x.id === t)?.name || t;
const rankIndex = (db, r) => Math.max(0, (db?.ranks || []).findIndex(x => x.id === r));
const iconPath = k => k && /^[a-z0-9_]+$/.test(k) ? `modules/${MOD}/icons/${k}.svg` : `modules/${MOD}/icons/box.svg`;

/* ───────────────── Fenêtre : Boutique 3.0 (shop-app.js) ───────────────── */
function openBoutique(opts = {}) { if (!game.user.isGM && !game.settings.get(MOD, "playersCanOpen")) { ui.notifications.warn("La Boutique est fermée."); return null; } return ShopApp.open(opts); }
const pushState = () => {};   /* ancienne fenêtre (iframe) supprimée en 3.0 */

/* ───────────────── Achat ───────────────── */
function targetActor() { const tok = canvas?.tokens?.controlled?.[0]; if (tok?.actor) return tok.actor; if (game.user.character) return game.user.character; return null; }
function fmtG(v, cur) { return Math.round(v || 0).toLocaleString("fr-FR") + " " + (cur || "G"); }
async function buyEntry(e, extra = {}) {
  const db = (await getDBAsync()) || {}; const cur = db.meta?.cur || "G";
  if (!game.user.isGM && !game.settings.get(MOD, "playersCanBuy")) return ui.notifications.warn("Les achats sont réservés au MJ.");
  const live = (db.items || []).find(x => x.id === e.id) || e;
  if (live.stock === 0) return ui.notifications.warn("Rupture de stock.");
  const actor = targetActor(); if (!actor) return ui.notifications.warn("Sélectionne un token ou assigne-toi un personnage.");
  if (!actor.isOwner) return ui.notifications.warn("Tu ne possèdes pas ce personnage.");
  const M = buyMapping();
  const price = live.price || 0; const tn = extra.typeName || typeName(db, live.t);
  const rc = (db.ranks || []).find(r => r.id === live.rang)?.color || "#fff";
  const cur0 = Number(foundry.utils.getProperty(actor, M.actorGoldPath));
  const content = `<div class="bq-buywin" style="--rc:${rc}">
    <div class="bq-bw-head"><div class="bq-bw-badge">${esc(live.rang)}</div><div><div class="bq-bw-sys">[ FENÊTRE SYSTÈME // ACHAT ]</div><div class="bq-bw-name">${esc(live.n)}</div><div class="bq-bw-meta"><span>${esc(live.rar)}</span><span>${esc(tn)}${live.sub ? " · " + esc(live.sub) : ""}</span>${live.elem ? `<span>${esc(live.elem)}</span>` : ""}${live.season ? `<span class="s">✦ ${esc(live.season)}</span>` : ""}</div></div></div>
    <div class="bq-bw-desc">${esc(live.desc)}</div>
    <div class="bq-bw-row"><span>PRIX</span><b class="g">${fmtG(price, cur)}</b></div>
    <div class="bq-bw-row"><span>ACQUÉREUR</span><b>${esc(actor.name)}</b></div>
    ${live.stock != null && live.stock !== "" ? `<div class="bq-bw-row"><span>STOCK</span><b>${live.stock}</b></div>` : ""}
    ${M.deduct && price ? `<div class="bq-bw-row"><span>PORTEFEUILLE</span><b class="${Number.isFinite(cur0) && cur0 < price ? "bad" : ""}">${Number.isFinite(cur0) ? fmtG(cur0, cur) + " → " + fmtG(cur0 - price, cur) : "—"}</b></div>` : ""}
    <div class="bq-bw-foot">Le Système ne pratique aucun remboursement.</div></div>`;
  const ok = await new Promise(res => new Dialog({ title: db.meta?.name || "Boutique", content, buttons: { yes: { icon: '<i class="fa-solid fa-gem"></i>', label: "Acheter", callback: () => res(true) }, no: { icon: '<i class="fa-solid fa-xmark"></i>', label: "Annuler", callback: () => res(false) } }, default: "yes", close: () => res(false) }, { classes: ["dialog", "bq-dialog"], width: 460 }).render(true));
  if (!ok) return null;
  /* l'achat lui-même (stock, paiement, objet) est exécuté par le MJ actif, une opération à la fois : deux joueurs sur le dernier exemplaire,
   * un double clic, un paiement sans objet… ne peuvent plus arriver (2.14.0) */
  const r = await gmDo("buy", { id: live.id, actor: actor.uuid, icon: extra.icon || null, typeName: extra.typeName || null });
  if (!r) return null; if (r.msg) ui.notifications[r.ok ? "info" : "warn"](r.msg); if (!r.ok) return null;
  return { item: { name: r.name }, actor, stockLeft: r.stockLeft };
}
function buyMapping() { const M = foundry.utils.mergeObject(foundry.utils.deepClone(MAP_DEFAULT), game.settings.get(MOD, "mapping")); if (isManhwa()) { const gp = msGoldPath(); if (gp) M.actorGoldPath = gp; } return M; }

/* ── relais MJ (requête / réponse) ── */
const GM_HANDLERS = {}; const WAITING = new Map(); const SEEN = new Map();
const activeGm = () => game.users.activeGM ?? game.users.find(u => u.isGM && u.active);
const runGm = (op, data, userId) => withLock(`gm:${MOD}`, () => GM_HANDLERS[op]?.(data, userId));
async function gmDo(op, data) {
  if (game.user.isGM) { try { return await runGm(op, data, game.user.id); } catch (e) { console.error(MOD, e); return { ok: false, msg: "Erreur : " + e.message }; } }
  if (!activeGm()) return { ok: false, msg: "Aucun MJ connecté : l'achat passe par le MJ." };
  const rid = foundry.utils.randomID(); game.socket.emit(`module.${MOD}`, { type: "req", op, data, from: game.user.id, rid });
  return new Promise(res => { const t = setTimeout(() => { WAITING.delete(rid); res({ ok: false, msg: "Le MJ n'a pas répondu." }); }, 15000); WAITING.set(rid, v => { clearTimeout(t); res(v); }); });
}
/* exécuté chez le MJ : vérifications refaites sur les données du moment, sous verrou du personnage ; paiement rendu si l'objet ne peut pas être créé */
GM_HANDLERS.buy = async ({ id, actor: uuid, icon, typeName: tn }, userId) => {
  const user = game.users.get(userId); const actor = await fromUuid(uuid); if (!user || !actor) return { ok: false, msg: "Personnage introuvable." };
  if (!user.isGM && !actor.testUserPermission(user, "OWNER")) return { ok: false, msg: "Ce personnage n'est pas à toi." };
  const db = (await getDBAsync()) || {}; const live = (db.items || []).find(x => x.id === id); if (!live) return { ok: false, msg: "Article introuvable." };
  if (!user.isGM && !game.settings.get(MOD, "playersCanBuy")) return { ok: false, msg: "Les achats sont réservés au MJ." };
  const cur = db.meta?.cur || "G"; const M = buyMapping(); const price = live.price || 0; const stockOn = game.settings.get(MOD, "stockDecrement") && live.stock != null && live.stock !== "";
  return actorLock(actor, async () => {
    /* 1. stock réservé en premier (vérifié et décrémenté dans la même écriture) */
    let stockLeft = null;
    if (stockOn) { let short = false; const it = await patchItem(id, x => { const st = Number(x.stock); if (!Number.isFinite(st)) return false; if (st <= 0) { short = true; return false; } x.stock = st - 1; }); if (short) return { ok: false, msg: "Rupture de stock." }; if (it) stockLeft = Number(it.stock); }
    const unstock = async () => { if (stockOn && stockLeft != null) await patchItem(id, x => { x.stock = (Number(x.stock) || 0) + 1; }); };
    /* 2. paiement */
    let refund = null;
    if (M.deduct && price) {
      const c = Number(foundry.utils.getProperty(actor, M.actorGoldPath));
      if (Number.isFinite(c)) {
        if (c < price) { if (!user.isGM) { await unstock(); return { ok: false, msg: `Fonds insuffisants : ${fmtG(c, cur)} disponibles.` }; } ui.notifications.warn(`Fonds insuffisants (${fmtG(c, cur)}), achat forcé par le MJ.`); }
        await actor.update({ [M.actorGoldPath]: c - price }); refund = () => actor.update({ [M.actorGoldPath]: Number(foundry.utils.getProperty(actor, M.actorGoldPath)) + price });
      } else if (user.isGM) ui.notifications.warn(`Portefeuille introuvable (${M.actorGoldPath}) — objet créé sans débit.`);
    }
    /* 3. objet (ou cosmétique débloqué) */
    if (live.cosm) { try { if (cosApi()?.owns(actor, live.cosm)) throw new Error("déjà possédé"); await cosApi().unlock(actor, live.cosm, true); return { ok: true, name: live.n, stockLeft, msg: `${live.n} débloqué pour ${actor.name}.` }; }
      catch (err) { try { await refund?.(); await unstock(); } catch (e2) {} return { ok: false, msg: `${live.n} : ${err.message} — paiement rendu.` }; } }
    try {
      const data = await itemData(live, M, db, icon); if (!data) throw new Error("gabarit d'objet introuvable");
      const [item] = await actor.createEmbeddedDocuments("Item", [data]); try { if (typeof item?.reloadTemplate === "function") await item.reloadTemplate(); } catch (e) { console.warn(MOD, e); }
      if (game.settings.get(MOD, "chatOnBuy")) ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="bq-chat"><b>◆ ${esc(db.meta?.name || "Boutique")}</b><br>${esc(actor.name)} acquiert <b>${esc(live.n)}</b> (rang ${esc(live.rang)} · ${esc(live.rar)}) pour ${fmtG(price, cur)}.</div>` }).catch(() => {});
      if (stockOn) pushState(true);
      return { ok: true, name: item?.name || live.n, stockLeft, msg: `${live.n} ajouté à ${actor.name}.` };
    } catch (err) { console.error(MOD, "achat interrompu, paiement rendu", err); try { await refund?.(); await unstock(); } catch (e2) { console.error(MOD, e2); } return { ok: false, msg: `Achat interrompu (${err.message}) : paiement rendu.` }; }
  });
};
/* ───────────────── Don (MJ) : à un ou plusieurs groupes, à des personnages, à tous les personnages des joueurs ───────────────── */
function msParties() { try { return globalThis.MANHWA?.parties?.() ?? foundry.utils.deepClone(game.settings.get("manhwa-sheet", "parties")?.list || []); } catch (e) { return []; } }
async function giveEntry(e, extra = {}) {
  if (!game.user.isGM) return;
  const db = (await getDBAsync()) || {}; const live = (db.items || []).find(x => x.id === e.id) || e;
  const pcs = game.actors.filter(a => a.type === "character" && a.hasPlayerOwner);
  const groups = msParties().filter(p => (p.members || []).length);
  const pk = globalThis.MANHWA?.pickers;
  const who = pk ? pk.field({ mode: "actor", name: "rcpt", multi: true, npcs: true, placeholder: "Nom d'un personnage ou pseudo d'un joueur…" })
    : `<div class="bq-gv-list">${game.actors.filter(a => ["character", "npc"].includes(a.type)).map(a => `<label><input type="checkbox" name="rcpt" value="${a.uuid}"><img src="${esc(a.img)}">${esc(a.name)}</label>`).join("")}</div>`;
  const content = `<div class="bq-givewin">
    <div class="bq-gv-head">${(live.img || picOf(live.id)) ? `<img src="${esc(live.img || picOf(live.id))}">` : `<i class="fa-solid fa-gift bq-gv-ic"></i>`}<div><small>[ FENÊTRE SYSTÈME // DON ]</small><b>${esc(live.n)}</b><span>Rang ${esc(live.rang)} · ${esc(live.rar)}</span></div></div>
    ${groups.length ? `<h4><i class="fa-solid fa-people-group"></i> Groupes</h4><div class="bq-gv-grp">${groups.map(g => `<label><input type="checkbox" name="grp" value="${esc(g.id)}"><b>${esc(g.name)}</b><small>${g.members.length} membre${g.members.length > 1 ? "s" : ""}</small></label>`).join("")}</div>` : ""}
    <h4><i class="fa-solid fa-user"></i> Personnages</h4>${who}
    <label class="bq-gv-all"><input type="checkbox" name="all"> Tous les personnages des joueurs (${pcs.length})</label>
    <div class="bq-gv-row">${live.cosm ? `<span class="bq-gv-cos"><i class="fa-solid fa-wand-sparkles"></i> Cosmétique : il est débloqué${live.cosm.startsWith("phone:") ? " pour les joueurs du personnage" : " sur la carte du personnage"}</span><input type="hidden" name="qty" value="1">` : `<label>Quantité <input type="number" name="qty" value="${Math.max(1, Number(extra.qty) || 1)}" min="1" max="999"></label>`}<label><input type="checkbox" name="tell" checked> Prévenir dans le chat</label></div>
    <p class="bq-gv-hint">Chaque personnage reçoit l'objet une seule fois, même s'il est dans plusieurs groupes. Gratuit : rien n'est débité, le stock ne bouge pas.</p></div>`;
  const r = await foundry.applications.api.DialogV2.prompt({ window: { title: `Donner — ${live.n}`, icon: "fa-solid fa-gift" }, classes: ["bq-givedlg"], position: { width: 520 }, rejectClose: false, content,
    ok: { label: "Donner", icon: "fa-solid fa-gift", callback: (ev, btn) => { const f = btn.form; return { rcpt: [...f.querySelectorAll('[name="rcpt"]')].filter(i => i.type !== "checkbox" || i.checked).map(i => i.value), grp: [...f.querySelectorAll('[name="grp"]:checked')].map(i => i.value), all: f.elements.all.checked, qty: Math.max(1, Math.min(999, Number(f.elements.qty.value) || 1)), tell: f.elements.tell.checked }; } },
    render: (ev, dlg) => { const el = dlg.element ?? dlg; pk?.bind(el); } });
  if (!r) return;
  const uuids = new Set(r.rcpt); for (const g of groups) if (r.grp.includes(g.id)) for (const m of g.members) uuids.add(m.uuid); if (r.all) for (const a of pcs) uuids.add(a.uuid);
  const actors = [...uuids].map(u => { try { return fromUuidSync(u); } catch (x) { return null; } }).filter(a => a?.documentName === "Actor");
  if (!actors.length) return ui.notifications.warn("Personne n'a été choisi.");
  if (live.cosm) { let n = 0; for (const a of actors) { try { if (await cosApi()?.unlock(a, live.cosm, true)) n++; } catch (err) { console.error(MOD, err); } }
    ui.notifications.info(`${live.n} débloqué pour ${n} personnage${n > 1 ? "s" : ""}.`);
    if (r.tell && n) ChatMessage.create({ speaker: { alias: db.meta?.name || "Le Catalogue" }, content: `<div class="bq-chat"><b>◆ ${esc(db.meta?.name || "Le Catalogue")} · Don</b><br>Cosmétique <b>${esc(live.n)}</b> débloqué → ${actors.map(a => esc(a.name)).join(", ")}</div>`, whisper: game.users.filter(u => u.isGM || actors.some(a => a.testUserPermission(u, "OWNER"))).map(u => u.id) });
    return; }
  const M = foundry.utils.mergeObject(foundry.utils.deepClone(MAP_DEFAULT), game.settings.get(MOD, "mapping"));
  const data = await itemData(live, M, db, extra.icon); if (!data) return;
  const stack = foundry.utils.hasProperty(data, "system.quantity");
  if (stack) foundry.utils.setProperty(data, "system.quantity", r.qty);
  const batch = stack ? [data] : Array.from({ length: Math.min(r.qty, 50) }, () => foundry.utils.deepClone(data));
  let n = 0;
  for (const a of actors) { try { const made = await a.createEmbeddedDocuments("Item", batch.map(d => foundry.utils.deepClone(d))); for (const it of made) if (typeof it?.reloadTemplate === "function") await it.reloadTemplate().catch(() => {}); n++; } catch (err) { console.error(MOD, err); ui.notifications.error(`Impossible de donner à ${a.name}.`); } }
  const q = r.qty > 1 ? ` ×${r.qty}` : "";
  ui.notifications.info(`${live.n}${q} donné à ${n} personnage${n > 1 ? "s" : ""}.`);
  if (r.tell && n) ChatMessage.create({ speaker: { alias: db.meta?.name || "Le Catalogue" }, content: `<div class="bq-chat"><b>◆ ${esc(db.meta?.name || "Le Catalogue")} · Don</b><br><b>${esc(live.n)}</b>${q} (rang ${esc(live.rang)} · ${esc(live.rar)}) → ${actors.map(a => esc(a.name)).join(", ")}</div>`,
    whisper: game.users.filter(u => u.isGM || actors.some(a => a.testUserPermission(u, "OWNER"))).map(u => u.id) });
}
/* ───────────────── Passerelle objets Foundry → Catalogue ─────────────────
 * Bouton sur la fiche d'objet, clic droit dans la barre des Objets, ou glisser l'objet dans la fenêtre du Catalogue.
 * L'objet garde un lien (flags.<MOD>.link = { entry, src, sync }) : s'il est synchronisé, le modifier met l'article à jour.
 * « Copie exacte » : acheter ou donner l'article crée une copie de l'objet d'origine (toutes ses données). */
const nrmC = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const plain = h => { const d = document.createElement("div"); d.innerHTML = String(h || "").replace(/<\/(p|div|li|h\d)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n"); return (d.textContent || "").replace(/\n{3,}/g, "\n\n").trim(); };
const ROOT_T = { weapon: "weapon", armor: "armor", items: "item", bags: "item", skill: "skill", title: "title", companion: "companion", vehicle: "vehicle", property: "property" };
const linkOf = item => item?.flags?.[MOD]?.link || null;
/* où ranger l'objet : type, catégorie, sous-catégorie du Catalogue */
async function placeOf(item, db) {
  if (isManhwa()) {
    const id = item.system?.category; const map = await loadManhwaMap();
    const hit = Object.entries(map).find(([, v]) => v === id); if (hit) { const [t, cat, sub] = hit[0].split("|"); if ((db.cats || []).some(c => c.type === t && c.name === cat)) return { t, cat, sub: sub || "" }; }
    const flat = globalThis.MANHWA.categories(); let node = flat.find(n => n.id === id); let root = node; while (root?.parent) root = root.parent;
    const t = ROOT_T[root?.id] || "item"; const names = (globalThis.MANHWA.categoryPath(id) || []).slice(1); const cats = (db.cats || []).filter(c => c.type === t);
    for (let i = names.length - 1; i >= 0; i--) { const c = cats.find(x => nrmC(x.name) === nrmC(names[i])); if (c) { const sn = names[i + 1] || ""; const sb = (c.subs || []).find(x => nrmC(x.name) === nrmC(sn)); return { t, cat: c.name, sub: sb ? sb.name : sn }; } }
    /* nom de famille (« Corps & Combat ») : première catégorie de cette famille */
    for (let i = names.length - 1; i >= 0; i--) { const c = cats.find(x => nrmC(x.fam) === nrmC(names[i])); if (c) return { t, cat: c.name, sub: "" }; }
    return { t, cat: names[0] || "Divers", sub: names.length > 1 ? names[names.length - 1] : "" };
  }
  const f = item.flags?.[MOD]; if (f?.t && f?.cat) return { t: f.t, cat: f.cat, sub: f.sub || "" };
  const t = Object.keys(TPL_RX).find(k => TPL_RX[k].test(item.type) || TPL_RX[k].test(item.name)); return { t: ({ accessory: "armor" })[t] || ((db.types || []).some(x => x.id === t) ? t : "item"), cat: "Divers", sub: "" };
}
/* article du Catalogue à partir de l'objet (prev = article existant à mettre à jour) */
function entryFromItem(item, db, place, prev = {}) {
  const s = item.system || {}; const cfg = isManhwa() ? globalThis.MANHWA.config() : null;
  const nameIn = (list, key) => (list || []).find(x => x.key === key)?.name ?? key;
  const rk = cfg ? nameIn(cfg.ranks, s.rank) : (s.rank ?? s.rang);
  const rang = (db.ranks || []).find(r => nrmC(r.id) === nrmC(rk) || nrmC(r.id) === nrmC(s.rank))?.id || prev.rang || db.ranks?.[0]?.id || "F";
  const rn = cfg ? nameIn(cfg.rarities, s.rarity) : (s.rarity ?? s.rar);
  const rar = (db.rars || []).find(r => nrmC(r.name) === nrmC(rn))?.name || prev.rar || rn || db.rars?.[1]?.name || "Commun";
  const en = cfg ? nameIn(cfg.elements, s.element) : s.element; const elem = (db.elems || []).find(x => nrmC(x.name) === nrmC(en))?.name || (en && nrmC(en) !== "none" && nrmC(en) !== "aucun" ? en : prev.elem || "");
  const on = cfg ? nameIn(cfg.origins, s.origin) : s.origin;
  const e = { ...prev, ...place, n: item.name, rang, rar, price: Number(s.value ?? s.price) || prev.price || 0, desc: plain(s.description) || prev.desc || "", src: item.uuid };
  const lore = plain(s.lore); if (lore) e.lore = lore; else delete e.lore;
  const cond = plain(s.condition); if (cond) e.cond = cond; else if (!prev.cond) delete e.cond;
  if (elem) e.elem = elem; else delete e.elem; if (on) e.origin = on;
  if (item.img && item.img !== (Item.implementation?.DEFAULT_ICON ?? "icons/svg/item-bag.svg")) e.img = item.img; else delete e.img;
  e.tags ||= [place.t === "item" ? "objet" : (db.types || []).find(x => x.id === place.t)?.name?.toLowerCase() || place.t]; e.reqShop ??= 1;
  return e;
}
/* ajoute la catégorie / sous-catégorie au Catalogue si elle n'existe pas encore */
function ensureCat(delta, db, t, cat, sub) {
  const cats = foundry.utils.deepClone(delta.cfg?.cats || db.cats || []); let c = cats.find(x => x.type === t && x.name === cat); let ch = false;
  if (!c) { c = { type: t, name: cat, icon: "", fam: "", subs: [] }; cats.push(c); ch = true; }
  if (sub && !(c.subs || []).some(x => x.name === sub)) { (c.subs ||= []).push({ name: sub, icon: "" }); ch = true; }
  if (ch) { delta.cfg ||= {}; delta.cfg.cats = cats; }
}
async function saveEntry(e, db) {
  if (!game.user.isGM) return ui.notifications.warn("Seul le MJ peut modifier le Catalogue.");
  await withLock(DELTA_LOCK, async () => {   /* identifiant attribué et delta relu au moment de l'écriture : deux MJ qui ajoutent en même temps n'ont plus le même numéro */
    const fresh = getDB() || db; if (!e.id) e.id = newEntryId(fresh, e.t); const cur = fresh.items?.find(x => x.id === e.id); if (cur && cur.stock != null && e.stock != null && e._keepStock) e.stock = cur.stock;
    const delta = getDelta() || { v: 2, cfg: {}, items: {}, del: [] }; delta.items ||= {}; delta.del = (delta.del || []).filter(x => x !== e.id);
    ensureCat(delta, fresh, e.t, e.cat, e.sub); delete e._keepStock; delta.items[e.id] = e; await game.settings.set(MOD, "delta", JSON.stringify(delta)); });
  pushState(true);
}
/* 3.2 : retirer un article du catalogue (MJ) — il reste dans la base livrée mais est masqué par le delta ; réversible en le recréant */
async function deleteEntry(id) {
  if (!game.user.isGM) return ui.notifications.warn("Seul le MJ peut modifier le Catalogue.");
  await withLock(DELTA_LOCK, async () => { const delta = getDelta() || { v: 2, cfg: {}, items: {}, del: [] }; delta.items ||= {}; delete delta.items[id]; delta.del = [...new Set([...(delta.del || []), id])]; await game.settings.set(MOD, "delta", JSON.stringify(delta)); });
}
const newEntryId = (db, t) => { const T = (db.types || []).find(x => x.id === t); const p = T?.prefix || String(t || "IT").slice(0, 2).toUpperCase(); const ids = new Set((db.items || []).map(e => e.id)); let n = 1;
  for (const id of ids) if (id?.startsWith(p + "-")) { const k = parseInt(id.slice(p.length + 1), 10); if (k >= n) n = k + 1; } let id = `${p}-${String(n).padStart(4, "0")}`; while (ids.has(id)) id = `${p}-${String(++n).padStart(4, "0")}`; return id; };
/** fenêtre « Ajouter au Catalogue » (ou « Mettre à jour » si l'objet est déjà lié) */
export async function addToCatalogue(item) {
  if (!game.user.isGM) return ui.notifications.warn("Réservé au MJ.");
  if (!item || item.documentName !== "Item") return;
  const db = (await getDBAsync()) || {}; const ln = linkOf(item); const prev = ln?.entry ? (db.items || []).find(x => x.id === ln.entry) : null;
  const place = prev ? { t: prev.t, cat: prev.cat, sub: prev.sub || "" } : await placeOf(item, db); const e0 = entryFromItem(item, db, place, prev || {});
  const opt = (list, v, key = "name") => list.map(x => `<option value="${esc(x[key])}"${x[key] === v ? " selected" : ""}>${esc(x.label || x.name || x[key])}</option>`).join("");
  const catsOf = t => (db.cats || []).filter(c => c.type === t);
  const content = `<div class="bq-addwin">
    <div class="bq-gv-head">${e0.img ? `<img src="${esc(e0.img)}">` : `<i class="fa-solid fa-box bq-gv-ic"></i>`}<div><small>[ FENÊTRE SYSTÈME // ${prev ? "MISE À JOUR" : "NOUVEL ARTICLE"} ]</small><b>${esc(item.name)}</b><span>${prev ? `Article ${esc(prev.id)}` : "Sera ajouté au Catalogue"}</span></div></div>
    <div class="bq-add-grid">
      <label>Type<select name="t">${opt(db.types || [], e0.t, "id")}</select></label>
      <label>Catégorie<input name="cat" list="bqAddCats" value="${esc(e0.cat)}"></label>
      <label>Sous-catégorie<input name="sub" list="bqAddSubs" value="${esc(e0.sub || "")}"></label>
      <label>Rang<select name="rang">${opt((db.ranks || []).map(r => ({ name: r.id })), e0.rang)}</select></label>
      <label>Rareté<select name="rar">${opt(db.rars || [], e0.rar)}</select></label>
      <label>Prix (${esc(db.meta?.cur || "G")})<input type="number" name="price" min="0" value="${Number(e0.price) || 0}"></label>
      <label>Niveau de boutique<input type="number" name="req" min="1" max="${(db.levels || []).length || 30}" value="${Number(e0.reqShop) || 1}"></label>
      <label>Stock<input type="number" name="stock" min="0" placeholder="illimité" value="${e0.stock ?? ""}"></label>
    </div>
    <datalist id="bqAddCats">${catsOf(e0.t).map(c => `<option value="${esc(c.name)}">`).join("")}</datalist><datalist id="bqAddSubs"></datalist>
    <label class="bq-add-ck"><input type="checkbox" name="sync"${!ln || ln.sync ? " checked" : ""}><span><b>Synchroniser</b> : quand tu modifies cet objet, l'article du Catalogue suit (nom, image, rang, rareté, prix, textes).</span></label>
    <label class="bq-add-ck"><input type="checkbox" name="exact"${prev ? (prev.exact ? " checked" : "") : " checked"}><span><b>Copie exacte</b> : acheter ou donner l'article crée une copie de cet objet (bonus, formule, réglages compris).</span></label>
    ${item.parent ? `<p class="bq-gv-hint">Objet de ${esc(item.parent.name)}. Pour un article durable, mieux vaut d'abord le glisser dans la barre des Objets.</p>` : ""}</div>`;
  const r = await foundry.applications.api.DialogV2.prompt({ window: { title: prev ? "Mettre à jour dans le Catalogue" : "Ajouter au Catalogue", icon: "fa-solid fa-store" }, classes: ["bq-givedlg", "bq-adddlg"], position: { width: 560 }, rejectClose: false, content,
    ok: { label: prev ? "Mettre à jour" : "Ajouter", icon: "fa-solid fa-check", callback: (ev, btn) => { const f = btn.form.elements; return { t: f.t.value, cat: f.cat.value.trim() || "Divers", sub: f.sub.value.trim(), rang: f.rang.value, rar: f.rar.value, price: Math.max(0, Number(f.price.value) || 0), req: Math.max(1, Number(f.req.value) || 1), stock: f.stock.value === "" ? null : Math.max(0, Number(f.stock.value) || 0), sync: f.sync.checked, exact: f.exact.checked }; } },
    render: (ev, dlg) => { const el = dlg.element ?? dlg; const f = el.querySelector("form") || el; const T = el.querySelector('[name="t"]'), C = el.querySelector('[name="cat"]');
      const subs = () => { el.querySelector("#bqAddSubs").innerHTML = (catsOf(T.value).find(c => c.name === C.value)?.subs || []).map(s => `<option value="${esc(s.name)}">`).join(""); };
      T.addEventListener("change", () => { el.querySelector("#bqAddCats").innerHTML = catsOf(T.value).map(c => `<option value="${esc(c.name)}">`).join(""); subs(); }); C.addEventListener("input", subs); subs(); } });
  if (!r) return;
  const e = { ...e0, t: r.t, cat: r.cat, sub: r.sub, rang: r.rang, rar: r.rar, price: r.price, reqShop: r.req, exact: r.exact };
  if (r.stock === null) delete e.stock; else { e.stock = r.stock; e.full ??= Math.max(r.stock, 1); }
  e.id = prev?.id || "";   /* nouvel article : numéro attribué dans saveEntry, sous verrou */
  await saveEntry(e, db);
  await item.setFlag(MOD, "link", { entry: e.id, src: item.uuid, sync: r.sync });
  ui.notifications.info(`${item.name} ${prev ? "mis à jour dans" : "ajouté au"} Catalogue (${e.id} · ${typeName(db, e.t)} › ${e.cat}${e.sub ? " › " + e.sub : ""}).`);
  return e;
}
/* objet glissé dans la fenêtre du Catalogue */
async function dropToCatalogue(data) {
  let d = data; try { if (typeof d === "string") d = JSON.parse(d); } catch (e) { return; }
  if (d?.type !== "Item") return ui.notifications.warn("Glisse un objet (barre des Objets, fiche de personnage, compendium).");
  let item = await fromUuid(d.uuid).catch(() => null); if (!item) return ui.notifications.warn("Objet introuvable.");
  if (item.pack) { const keep = await foundry.applications.api.DialogV2.confirm({ window: { title: "Objet de compendium" }, content: "<p>L'importer d'abord dans la barre des Objets (pour pouvoir le synchroniser) ?</p>", rejectClose: false });
    if (keep) item = await Item.implementation.create(item.toObject()); }
  return addToCatalogue(item);
}
/* synchronisation : l'objet lié change → l'article suit */
const _syncT = new Map();
Hooks.on("updateItem", (item, ch, opts, userId) => {
  if (!game.user.isGM || userId !== game.user.id) return; const ln = linkOf(item); if (!ln?.sync || ln.src !== item.uuid) return;
  if (Object.keys(foundry.utils.flattenObject(ch)).every(k => k.startsWith(`flags.${MOD}`) || k === "_id" || k.startsWith("_stats"))) return;
  clearTimeout(_syncT.get(item.uuid)); _syncT.set(item.uuid, setTimeout(async () => { _syncT.delete(item.uuid);
    const db = (await getDBAsync()) || {}; const prev = (db.items || []).find(x => x.id === ln.entry); if (!prev) return;
    const place = ch.system?.category !== undefined ? await placeOf(item, db) : { t: prev.t, cat: prev.cat, sub: prev.sub || "" };
    const e = entryFromItem(item, db, place, prev); e.id = prev.id; e._keepStock = true; await saveEntry(e, db); }, 700));
});
/* une copie d'un objet lié n'est pas liée (seul l'objet d'origine synchronise) */
Hooks.on("preCreateItem", (item, data) => { const ln = data?.flags?.[MOD]?.link; if (ln) item.updateSource({ [`flags.${MOD}.-=link`]: null }); });
/* bouton sur la fiche d'objet (en-tête) et clic droit dans la barre des Objets */
Hooks.on("getHeaderControlsApplicationV2", (app, controls) => {
  const doc = app.document; if (!game.user.isGM || doc?.documentName !== "Item") return;
  const run = () => addToCatalogue(app.document); app.options.actions ||= {}; app.options.actions.lhCatAdd = run;
  controls.push({ icon: "fa-solid fa-store", label: linkOf(doc) ? "Mettre à jour dans le Catalogue" : "Ajouter au Catalogue", action: "lhCatAdd", onClick: run, visible: true });
});
Hooks.on("getItemContextOptions", (app, opts) => {
  opts.push({ name: "Ajouter au Catalogue", icon: '<i class="fa-solid fa-store"></i>', condition: () => game.user.isGM,
    callback: li => { const el = li instanceof HTMLElement ? li : li?.[0]; const it = game.items.get(el?.closest?.("[data-entry-id]")?.dataset.entryId ?? el?.dataset?.entryId); if (it) addToCatalogue(it); } });
});
/* requêtes des joueurs (achat) : exécutées par le MJ actif, une à la fois, réponses renvoyées au demandeur ; doublons et requêtes forgées refusés */
Hooks.once("ready", () => { game.socket?.on(`module.${MOD}`, async m => {
  if (!m) return;
  if (m.type === "reply") { if (m.to !== game.user.id) return; const f = WAITING.get(m.rid); if (f) { WAITING.delete(m.rid); f(m.value || { ok: false }); } return; }
  if (m.type !== "req" || !game.user.isGM || activeGm()?.id !== game.user.id) return;
  const sender = game.users.get(m.from); if (!sender || sender.isGM || !sender.active) { console.warn(MOD, "requête refusée (expéditeur invalide)", m.op, m.from); return; }
  const now = Date.now(); for (const [k, t] of SEEN) if (now - t > 60000) SEEN.delete(k); if (SEEN.has(m.rid)) return; SEEN.set(m.rid, now);
  let value; try { value = await runGm(m.op, m.data || {}, m.from); } catch (e) { console.error(MOD, e); value = { ok: false, msg: "Erreur côté MJ : " + e.message }; }
  game.socket.emit(`module.${MOD}`, { type: "reply", to: m.from, rid: m.rid, value: value || { ok: false } });
}); });
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* Construit les données d'Item (CSB si possible, sinon générique) */
const TPL_RX = { weapon: /arme|weapon/i, armor: /armure|armor|équipement|equipement/i, accessory: /accessoire|bijou/i, skill: /comp[ée]tence|skill|sort|capacit/i, title: /titre|title/i, vehicle: /v[ée]hicule|vehicle|monture/i, companion: /compagnon|familier|pet|cr[ée]ature/i, property: /propri[ée]t|maison|bien|domaine/i, item: /objet|item|consommable|loot|divers|inventaire/i };
function templates() { return game.items.filter(i => i.type === "_equippableItemTemplate"); }
function findTemplate(M, e, db) {
  const tpls = templates(); if (!tpls.length) return false;
  if (M.templateName) { const t = tpls.find(t => t.name === M.templateName); if (t) return t; }
  const tryRx = rx => tpls.find(t => rx.test(t.name));
  if (e) {
    if (e.cat && /accessoire|bijou/i.test(e.cat)) { const t = tryRx(TPL_RX.accessory); if (t) return t; }
    const tn = typeName(db, e.t);
    const t = tryRx(TPL_RX[e.t] || new RegExp(tn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")); if (t) return t;
    const g = tryRx(TPL_RX.item); if (g) return g;
  }
  return tpls[0];
}
function templateKeys(tpl) {
  const out = []; const walk = o => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk); if (typeof o.key === "string" && o.key) out.push({ key: o.key, label: String(o.label || o.title || o.key), type: o.type || "" }); for (const k of ["contents", "rows", "cols", "columns", "children", "items", "body", "header", "tabs", "content"]) if (o[k]) walk(o[k]); };
  walk(tpl.system?.header); walk(tpl.system?.body); return out;
}
const KEY_RX = { keyRang: /^rang|rank/i, keyRangNum: /rang.?num|rank.?num/i, keyRarete: /raret|rarity/i, keyType: /^type|categorie|cat[ée]gorie/i, keyCategorie: /cat[ée]gorie/i, keyElement: /[ée]l[ée]ment/i, keyGold: /gold|^or$|prix|price|valeur|monnaie/i, keyQuantite: /quantit|qte|qty|nombre/i, keyNiveau: /niveau|level|^lv/i, keyDescription: /descr|effet|effect/i, keyLore: /lore|histoire|fluff/i, keyName: /^nom$|^name$/i };
function autoKeys(tpl, M) {
  const ks = templateKeys(tpl); const res = { ...M };
  for (const [field, rx] of Object.entries(KEY_RX)) {
    if (res[field] && ks.some(k => k.key === res[field])) continue;
    const hit = ks.find(k => rx.test(k.key)) || ks.find(k => rx.test(k.label));
    res[field] = hit ? hit.key : (ks.some(k => k.key === res[field]) ? res[field] : "");
  }
  return res;
}
/* ═══════════ Templates CSB créés par le module ═══════════ */
const TPL_PREFIX = "Catalogue — ";
const opt = arr => arr.map(v => ({ key: String(v), value: String(v) }));
const fld = (key, label, extra) => Object.assign({ key, colSpan: 1, rowSpan: 1, cssClass: "", role: 0, editRole: 0, permission: 0, tooltip: "", visibilityFormula: "", editableFormula: "", escapeHTML: false, size: "full-size", label }, extra);
const selectF = (key, label, options, def, cssClass) => fld(key, label, { type: "select", cssClass, defaultValue: def ?? options[0], selectedOptionType: "custom", options: opt(options) });
const numF = (key, label, def, cssClass, controls) => fld(key, label, { type: "numberField", cssClass, defaultValue: String(def), allowDecimal: false, minVal: "0", maxVal: "", allowRelative: !!controls, showControls: !!controls, controlsStyle: "hover", controlsCustomIncrements: "", inputStyle: "text" });
const textF = (key, label, cssClass) => fld(key, label, { type: "textField", cssClass, defaultValue: "", charLimit: null, maxLength: null, allowDecimal: false, minVal: "", maxVal: "" });
const areaF = (key, label, cssClass) => fld(key, label, { type: "textArea", cssClass: cssClass || "item-description", defaultValue: "", style: "dialog" });
const COUT = ["Aucun", "Très faible", "Faible", "Modéré", "Élevé", "Très élevé", "Extrême"], PORTEE = ["Sur Soi", "Contact", "Très proche", "Proche", "Moyenne Portée", "Longue Portée", "Très Longue Portée", "Illimitée"], EXEC = ["Aucun", "Instantané", "Très rapide", "Rapide", "Moyen", "Lent", "Très lent"];
/* définitions : clé → {name, fields(db)} */
function templateDefs(db) {
  const ranks = (db?.ranks || []).map(r => r.id), rars = (db?.rars || []).map(r => r.name), elems = ["Neutre", ...(db?.elems || []).map(e => e.name).filter(x => x !== "Neutre")];
  const common = () => [selectF("rang", "Rang", ranks, ranks[0], "pill-rang"), selectF("rarete", "Rareté", rars, rars[1] || rars[0], "pill-rarete"), textF("categorie", "Catégorie", "pill-type"), textF("type", "Type", "pill-type")];
  const money = () => [numF("valeur", "Gold", 0, "pill-gold-header"), numF("quantite", "Qnté", 1, "pill-quantite item-qte", true)];
  const body = () => [areaF("description", "Description"), areaF("lore", "Lore", "item-lore"), areaF("evolution", "Évolution", "item-lore"), areaF("condition", "Condition", "item-lore")];
  const skillHead = () => [numF("niveau", "Niveau", 1, "pill-stat stat-cd"), ...common(), selectF("element", "Élément", elems, "Neutre", "pill-element"), selectF("cout", "Coût MP", COUT, "Aucun", "pill-stat stat-mp"), selectF("portee", "Portée", PORTEE, "Sur Soi", "pill-stat stat-def"), selectF("execution", "Exécution", EXEC, "Aucun", "pill-stat stat-res"), numF("valeur", "Gold", 0, "pill-gold-header")];
  return {
    competence: { name: "Compétence", header: skillHead(), body: body() },
    titre: { name: "Titre", header: [...common(), textF("monde", "Monde", "pill-type")], body: body() },
    arme: { name: "Arme", header: [...common(), selectF("element", "Élément", elems, "Neutre", "pill-element"), ...money()], body: body() },
    armure: { name: "Armure", header: [...common(), selectF("element", "Élément", elems, "Neutre", "pill-element"), ...money()], body: body() },
    accessoire: { name: "Accessoire", header: [...common(), ...money()], body: body() },
    consommable: { name: "Consommable", header: [...common(), ...money()], body: body() },
    munition: { name: "Munition", header: [...common(), ...money()], body: body() },
    sac: { name: "Sac", header: [...common(), numF("places", "Places", 1, "pill-quantite item-qte", true), ...money()], body: body() },
    objet: { name: "Objet", header: [...common(), ...money()], body: body() },
    vehicule: { name: "Véhicule", header: [...common(), textF("constructeur", "Constructeur", "pill-type"), textF("monde", "Monde", "pill-type"), ...money()], body: body() },
    compagnon: { name: "Compagnon", header: [numF("niveau", "Niveau", 1, "pill-stat stat-cd"), ...common(), selectF("element", "Élément", elems, "Neutre", "pill-element"), ...money()], body: body() },
    propriete: { name: "Propriété", header: [...common(), textF("monde", "Monde", "pill-type"), numF("valeur", "Gold", 0, "pill-gold-header")], body: body() }
  };
}
const panel = (key, contents) => ({ type: "panel", key, colSpan: 1, rowSpan: 1, cssClass: "", role: 0, editRole: 0, permission: 0, tooltip: "", visibilityFormula: "", editableFormula: "", escapeHTML: false, flow: "vertical", align: "center", verticalAlign: "top", collapsible: false, defaultCollapsed: true, title: "", titleStyle: "default", contents });
function tplByKey(key) { return templates().find(t => t.getFlag(MOD, "tplKey") === key) || templates().find(t => t.name === TPL_PREFIX + (templateDefs(getDB())[key]?.name || "")) || null; }
function templateKeyFor(e) {
  if (e.t === "skill") return "competence"; if (e.t === "title") return "titre"; if (e.t === "weapon") return "arme";
  if (e.t === "armor") return e.cat === "Accessoires" ? "accessoire" : "armure";
  if (e.t === "vehicle") return "vehicule"; if (e.t === "companion") return "compagnon"; if (e.t === "property") return "propriete";
  if (e.t === "item") { const c = e.cat || ""; if (c === "Munitions") return "munition"; if (c === "Contenants") return "sac"; if (["Consommables", "Alimentation", "Médical", "Hygiène", "Poisons", "Drogues", "Quotidien"].includes(c)) return "consommable"; }
  return "objet";
}
/* crée les templates manquants ; update=true réécrit aussi les existants (listes rang/rareté/élément) */
async function ensureTemplates(update = false, quiet = false) {
  if (!game.user.isGM || game.system.id !== "custom-system-builder") return;
  const db = await getDBAsync(); const defs = templateDefs(db); let created = 0, updated = 0;
  for (const [key, def] of Object.entries(defs)) {
    const data = { system: { hidden: [], header: panel("custom_header", def.header), body: panel("custom_body", def.body), modifiers: [], display: { width: 600, height: 600, fix_size: false, pp_width: 128, pp_height: 128 } } };
    const ex = tplByKey(key);
    if (!ex) { await Item.create({ name: TPL_PREFIX + def.name, type: "_equippableItemTemplate", img: `modules/${MOD}/icons/${({ competence: "sparkle", titre: "crown", arme: "swords", armure: "shield", accessoire: "ring", consommable: "potion", munition: "arrow", sac: "bag", objet: "box", vehicule: "car", compagnon: "paw", propriete: "house" })[key]}.svg`, ...data, flags: { [MOD]: { tplKey: key } } }); created++; }
    else if (update) { await ex.update({ ...data, flags: { [MOD]: { tplKey: key } } }); updated++; }
  }
  if (!quiet || created) ui.notifications.info(`Catalogue : ${created} template(s) créé(s)${update ? `, ${updated} mis à jour` : ""}.`);
  return { created, updated };
}
Hooks.once("ready", async () => { if (game.user.isGM && game.users.activeGM?.id === game.user.id && game.settings.get(MOD, "autoTemplates") && !game.modules.get("fiche-manhwa")?.active) { try { await loadBase(); await ensureTemplates(false, true); } catch (e) { console.error(MOD, e); } } });
class TemplatesMenu extends FormApplication {
  static get defaultOptions() { return foundry.utils.mergeObject(super.defaultOptions, { id: "lh-tpl", title: "Catalogue — Templates d'objets", template: `modules/${MOD}/templates/templates.hbs`, width: 520 }); }
  getData() { const defs = templateDefs(getDB()); return { csb: game.system.id === "custom-system-builder", list: Object.entries(defs).map(([k, d]) => ({ key: k, name: TPL_PREFIX + d.name, exists: !!tplByKey(k), fields: d.header.map(f => f.key).join(", ") })) }; }
  activateListeners(html) { super.activateListeners(html); const root = html[0] || html; root.querySelector("[data-create]")?.addEventListener("click", async ev => { ev.preventDefault(); await ensureTemplates(false); this.render(false); }); root.querySelector("[data-update]")?.addEventListener("click", async ev => { ev.preventDefault(); await ensureTemplates(true); this.render(false); }); }
  async _updateObject() {}
}

async function itemData(e, M0, db, icon) { let M = M0; db = db || getDB() || {};
  /* article lié à un objet Foundry (« copie exacte ») : on copie l'objet d'origine tel quel */
  if (e.exact && e.src) { const src = await fromUuid(e.src).catch(() => null); if (src?.documentName === "Item") { const d = src.toObject(); for (const k of ["_id", "folder", "sort", "ownership", "_stats"]) delete d[k]; d.flags ||= {}; d.flags[MOD] = { ...(d.flags[MOD] || {}), id: e.id, t: e.t, cat: e.cat, sub: e.sub, rang: e.rang, rar: e.rar, price: e.price }; delete d.flags[MOD].link; return d; } }
  const desc = `<p>${esc(e.desc).replace(/\n/g, "<br>")}</p>${e.lore ? `<p><i>${esc(e.lore)}</i></p>` : ""}${e.evo ? `<p><b>Évolution :</b> ${esc(e.evo)}</p>` : ""}${e.cond && !(isManhwa() && e.t === "title") ? `<p><b>Condition :</b> ${esc(e.cond)}</p>` : ""}`;
  const ic = icon || e.icon || (db.cats || []).find(c => c.type === e.t && c.name === e.cat)?.subs?.find(s => s.name === e.sub)?.icon || (db.cats || []).find(c => c.type === e.t && c.name === e.cat)?.icon || (db.types || []).find(t => t.id === e.t)?.icon;
  const base = { name: e.n, img: e.img || picOf(e.id) || iconPath(ic), flags: { [MOD]: { id: e.id, t: e.t, cat: e.cat, sub: e.sub, rang: e.rang, rar: e.rar, price: e.price, elem: e.elem, origin: e.origin, ...(e.vp ? { vp: e.vp } : {}), ...(e.t === "vehicle" ? { desc: e.desc } : {}) } } };
  if (isManhwa()) {
    const cfg = globalThis.MANHWA.config(); const map = await loadManhwaMap();
    const category = (e.msCat && globalThis.MANHWA.categories().some(n => n.id === e.msCat)) ? e.msCat : msCategory(e, map, db);
    const sys = { category, rank: msMatch(cfg.ranks, e.rang) || cfg.ranks[0]?.key || "", rarity: msMatch(cfg.rarities, e.rar), quantity: 1, value: Number(e.price) || 0, description: desc };
    if (e.elem) sys.element = msMatch(cfg.elements, e.elem) || "";
    if (["skill", "companion"].includes(e.t)) sys.level = 1;
    if (e.origin) sys.origin = msMatch(cfg.origins, e.origin) || e.origin;
    if (e.brand) sys.manufacturer = e.brand;
    if (e.lore) sys.lore = `<p>${esc(e.lore)}</p>`;
    if (e.cond) sys.condition = `<p>${esc(e.cond)}</p>`;   /* Manhwa Sheet ≥ 1.24.3 : champ « Condition d'obtention » des titres */
    if (e.bag) sys.slots = Number(e.bag.places) || 0;   /* 3.10 : seules les places comptent (l'ancienne « capacité » en litres n'avait aucun effet sur la fiche) */
    const extra = {}; if (e.evo) extra.evolution = e.evo; if (e.cond) extra.condition = e.cond; if (e.cat) extra.catalogue = `${e.cat}${e.sub ? " › " + e.sub : ""}`; if (Object.keys(extra).length) sys.extra = extra;
    return { ...base, type: "item", system: sys };
  }
  const csb = game.system.id === "custom-system-builder";
  if (csb) {
    /* Fiche Manhwa actif : ses templates, ses onglets */
    const fm = game.modules.get("fiche-manhwa"); if (fm?.active && fm.api?.templateFor) { const r = fm.api.templateFor(e); if (r) return { ...base, type: M.itemType || "equippableItem", system: { ...(r.system || {}), template: r.template.id, props: r.props, description: desc } }; ui.notifications.error("Templates de la Fiche Manhwa introuvables ou non visibles : le MJ doit ouvrir Configuration → Fiche Manhwa → « Créer les manquants », puis donner aux joueurs le droit Observateur sur les templates (fait automatiquement par Fiche Manhwa ≥ 1.4)."); return null; }
    let tpl = tplByKey(templateKeyFor(e));
    if (!tpl && game.user.isGM) { await ensureTemplates(false, true); tpl = tplByKey(templateKeyFor(e)); }
    if (tpl) {
      const fields = {}; const walk = o => { if (!o || typeof o !== "object") return; if (Array.isArray(o)) return o.forEach(walk); if (typeof o.key === "string" && o.key) fields[o.key] = o; if (o.contents) walk(o.contents); }; walk(tpl.system?.header); walk(tpl.system?.body);
      const props = {}; const has = k => k in fields; const inOpts = (k, v, def) => { const o = fields[k]?.options?.map(x => x.key); return !o ? v : (o.includes(v) ? v : (o.includes(def) ? def : o[0])); };
      if (has("rang")) props.rang = inOpts("rang", e.rang, e.rang); if (has("rarete")) props.rarete = inOpts("rarete", e.rar, "Commun");
      if (has("categorie")) props.categorie = e.cat || ""; if (has("type")) props.type = e.sub || e.cat || "";
      if (has("element")) props.element = inOpts("element", e.elem || "Neutre", "Neutre");
      if (has("niveau")) props.niveau = 1; if (has("valeur")) props.valeur = e.price || 0; if (has("quantite")) props.quantite = 1; if (has("places")) props.places = 1;
      if (has("monde")) props.monde = e.origin || ""; if (has("constructeur")) props.constructeur = e.brand || "";
      if (has("description")) props.description = e.desc || ""; if (has("lore")) props.lore = e.lore || ""; if (has("evolution")) props.evolution = e.evo || ""; if (has("condition")) props.condition = e.cond || "";
      return { ...base, type: M.itemType || "equippableItem", system: { template: tpl.id, props, description: desc } };
    }
    /* templates du module absents (joueur sans MJ connecté…) : détection générique */
    const tpl2 = findTemplate(M, e, db); if (tpl2) M = autoKeys(tpl2, M);
    const props = {}; const set = (k, v) => { if (k && v !== undefined && v !== null && v !== "") props[k] = v; };
    set(M.keyName, e.n); set(M.keyRang, e.rang); set(M.keyRarete, e.rar); set(M.keyType, e.sub || e.cat); set(M.keyCategorie, e.cat); set(M.keyGold, e.price || 0); set(M.keyQuantite, 1); set(M.keyDescription, e.desc); set(M.keyLore, e.lore || ""); set(M.keyNiveau, e.lv ? 1 : null); set(M.keyElement, e.elem || ""); set(M.keyRangNum, rankIndex(db, e.rang) + 1);
    const sys = { props, description: desc }; if (tpl2) sys.template = tpl2.id; else ui.notifications.warn("Templates du Catalogue introuvables : demandez au MJ d'ouvrir le monde une fois (ils sont créés automatiquement).");
    return { ...base, type: M.itemType || "equippableItem", system: sys };
  }
  const types = Object.keys(game.documentTypes?.Item || CONFIG.Item.typeLabels || {}).filter(t => t !== "base");
  return { ...base, type: types[0] || "base", system: { description: desc } };
}

/* ───────────────── Import compendium ───────────────── */
class ImportDialog extends FormApplication {
  static get defaultOptions() { return foundry.utils.mergeObject(super.defaultOptions, { id: "bq-import", title: "Importer la Boutique en compendium", template: `modules/${MOD}/templates/import.hbs`, width: 460 }); }
  getData() { const db = getDB() || { types: [], items: [] }; /* base chargée au ready */ return { types: db.types.map(t => ({ k: t.id, v: t.label, n: db.items.filter(e => e.t === t.id).length })).filter(t => t.n) }; }
  async _updateObject(_ev, data) { const types = Object.entries(data).filter(([k, v]) => v).map(([k]) => k); if (!types.length) return ui.notifications.warn("Choisis au moins un type."); await importCompendium(types); }
}
async function importCompendium(types) {
  const db = await getDBAsync(); if (!db) return ui.notifications.warn("Le Catalogue est introuvable.");
  const M = foundry.utils.mergeObject(foundry.utils.deepClone(MAP_DEFAULT), game.settings.get(MOD, "mapping"));
  for (const t of types) {
    const T = db.types.find(x => x.id === t); const rows = db.items.filter(e => e.t === t); if (!rows.length) continue;
    const name = `lh-${t.replace(/[^a-z0-9_-]/gi, "_")}`; const label = `${db.meta?.name || "Boutique"} — ${T?.label || t}`;
    let pack = game.packs.get(`world.${name}`);
    if (!pack) pack = await CompendiumCollection.createCompendium({ label, name, type: "Item", package: "world" });
    await pack.configure({ locked: false });
    const existing = new Set((await pack.getIndex({ fields: ["flags"] })).map(i => i.flags?.[MOD]?.id).filter(Boolean));
    const todo = rows.filter(e => !existing.has(e.id));
    ui.notifications.info(`${label} : ${todo.length} article(s) à importer…`);
    const docs = []; for (const e of todo) { const d = await itemData(e, M, db); if (d) docs.push(d); }
    for (let i = 0; i < docs.length; i += 200) { await Item.createDocuments(docs.slice(i, i + 200), { pack: pack.collection, keepId: false }); ui.notifications.info(`${label} : ${Math.min(i + 200, docs.length)} / ${docs.length}`); }
    await pack.configure({ locked: true });
  }
  ui.notifications.info("Import terminé.");
}

/* ───────────────── Boutons ───────────────── */
Hooks.on("getSceneControlButtons", controls => {
  if (!game.user.isGM && !game.settings.get(MOD, "playersCanOpen")) return;
  const tool = { name: "lh-catalogue", title: "Boutique", icon: "fa-solid fa-store", button: true, order: 99, onChange: () => openBoutique() };
  if (Array.isArray(controls)) { const c = controls.find(c => c.name === "notes") || controls[0]; c.tools.push({ ...tool, onClick: () => openBoutique() }); }   /* v12 */
  else { const c = controls.notes || controls.tokens; if (c) c.tools[tool.name] = tool; }   /* v13 : clé = nom */
});
const sidebarBtn = (dir, html, where) => {
  const mode = game.settings.get(MOD, "sidebarButtons") || "none"; if (mode !== "both" && mode !== where) return;
  if (!game.user.isGM && !game.settings.get(MOD, "playersCanOpen")) return;
  const root = html instanceof HTMLElement ? html : html[0]; if (root.querySelector(".bq-cat-btn")) return;
  const db = getDB(); const btn = document.createElement("button"); btn.type = "button"; btn.className = "bq-cat-btn"; btn.innerHTML = `<i class="fa-solid fa-store"></i> ${esc(db?.meta?.name || "Le Catalogue")}`; btn.addEventListener("click", openBoutique);
  (root.querySelector(".directory-header") || root).appendChild(btn);
};
Hooks.on("renderItemDirectory", (dir, html) => sidebarBtn(dir, html, "items"));
Hooks.on("renderJournalDirectory", (dir, html) => sidebarBtn(dir, html, "journal"));

/* 2.5.0 : pièces de véhicule de base (ids VM-xxxx, champ vp = emplacement, environnements, bonus) recopiées dans les drapeaux de l'objet pour le module Véhicules Manhwa */

/* 2.7.0 : niveau de boutique propre à chaque joueur (réglage shopLevels, défaut = shopLv) ; sacs rattachés à « Sacs » de Manhwa Sheet avec leurs places (system.slots) ; descriptions multi-lignes */

/* 2.8.0 : DA système (boutons HUD, contours néon, animations des objets d'exception, bannières de rang, lignes lumineuses du fond) ; opacités de la fenêtre de détail et de la bannière ; menu « Niveau de boutique des joueurs » */

/* ───────────────── Boutique 3.0 : branchement du cœur ───────────────── */
Object.assign(SHOP_CORE, { giveEntry, getDB, getDBAsync, itemData, buyMapping, withLock, actorLock, gmDo, GM_HANDLERS, picOf, iconPath, patchItem, msParties, saveEntry, deleteEntry });
initShopData(); initSignal();
Hooks.once("init", () => { try { registerSignalTab(); } catch (e) { console.warn(MOD, e); } });

/* 3.10 : sacs, sacoches, bourses, coffres et stockages du Catalogue → catégorie « Sacs » de Manhwa Sheet avec leurs places.
 * Les objets déjà achetés (fiches et dossier Objets) sont corrigés une fois : catégorie Sacs + places (system.slots). */
Hooks.once("ready", async () => {
  if (!isManhwa() || !game.user.isGM || game.users.activeGM?.id !== game.user.id || game.settings.get(MOD, "bagFix") >= 1) return;
  try { const db = await getDBAsync(); const byId = new Map(db.items.filter(e => e.bag).map(e => [e.id, e])); const cats = new Set(globalThis.MANHWA.categories().map(n => n.id));
    const fix = it => { const e = byId.get(it.getFlag(MOD, "id")); if (!e) return null; const up = {}; const pl = Number(e.bag.places) || 0;
      if ((Number(it.system.slots) || 0) !== pl) up["system.slots"] = pl; if (e.msCat && cats.has(e.msCat) && !String(it.system.category || "").startsWith("bags")) up["system.category"] = e.msCat;
      return Object.keys(up).length ? { _id: it.id, ...up } : null; };
    let n = 0; const w = game.items.map(fix).filter(Boolean); if (w.length) { await Item.updateDocuments(w); n += w.length; }
    for (const a of game.actors) { const u = a.items.map(fix).filter(Boolean); if (u.length) { await a.updateEmbeddedDocuments("Item", u); n += u.length; } }
    await game.settings.set(MOD, "bagFix", 1); if (n) ui.notifications.info(`Catalogue : ${n} sac${n > 1 ? "s" : ""} corrigé${n > 1 ? "s" : ""} (catégorie Sacs et places).`);
  } catch (err) { console.error(MOD, "bagFix", err); } });
