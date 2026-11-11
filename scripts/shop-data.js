/* Boutique 3.0 — données et règles : blocs choisis par le MJ, offres (stock partagé, réductions, offres groupées, limites),
 * niveaux (Novice → Mythique, par personnage, fixés par le MJ), étiquettes, groupes MJ, historique, achats exécutés par le MJ.
 * Le cœur du module (base du Catalogue, création d'objet, relais MJ) est passé par main.js via initShop(core). */
export const MOD = "last-horizon-catalogue";
import { CAT_BG, CAT_ICONS } from "./catbg.js";
export const C = {};   /* cœur : getDB, getDBAsync, itemData, buyMapping, withLock, actorLock, gmDo, GM_HANDLERS, picOf, iconPath, esc, msParties */
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const uid = () => foundry.utils.randomID(10);
export const nrm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/* ── montants : abrégés (10,2 M), le montant exact au survol ── */
export const fmtFull = n => Math.round(Number(n) || 0).toLocaleString("fr-FR");
export function fmtShort(n) {
  n = Math.round(Number(n) || 0); const a = Math.abs(n); const f = (v, u) => `${(Math.round(v * 10) / 10).toLocaleString("fr-FR", { maximumFractionDigits: v < 100 ? 1 : 0 })} ${u}`;
  if (a < 100000) return n.toLocaleString("fr-FR"); if (a < 1e6) return f(n / 1e3, "k"); if (a < 1e9) return f(n / 1e6, "M"); if (a < 1e12) return f(n / 1e9, "Md"); return f(n / 1e12, "B");
}
/** montant avec pièce d'or 3D */
export const coin = (cur = "G") => `<i class="bq-coin" aria-hidden="true"><b>${esc(String(cur).slice(0, 1))}</b></i>`;
export const money = (n, cur = "G", cls = "") => { const t = String(fmtShort(n)); const m = t.match(/^(.*?\d)\s*([^\d\s]+)$/);
  return `<span class="bq-money ${cls}" data-tooltip="${fmtFull(n)} ${esc(cur)}"><span class="n">${esc(m ? m[1] : t)}</span>${m ? `<u class="sx">${esc(m[2])}</u>` : ""}${coin(cur)}</span>`; };

/* ── niveaux : nom, couleur, rang et rareté maximum (modifiables par le MJ) ── */
export const LEVELS_DEFAULT = [
  { n: "Novice", c: "#9ca3af", rank: "F", rar: "Commun" }, { n: "Débutant", c: "#7dd3fc", rank: "E", rar: "Commun+" }, { n: "Apprenti", c: "#5eead4", rank: "D", rar: "Peu Commun" },
  { n: "Intermédiaire", c: "#4ade80", rank: "C", rar: "Rare" }, { n: "Confirmé", c: "#a3e635", rank: "B", rar: "Très Rare" }, { n: "Avancé", c: "#c084fc", rank: "A", rar: "Épique" },
  { n: "Expert", c: "#f472b6", rank: "S", rar: "Légendaire" }, { n: "Maître", c: "#fb923c", rank: "SS", rar: "Mythique" }, { n: "Légendaire", c: "#fbbf24", rank: "SSS", rar: "Codex" },
  { n: "Mythique", c: "#ffffff", rank: "SSS", rar: "Artefact" }
];
export const TAG_RARITY = [["Commune", "#9ca3af"], ["Rare", "#38bdf8"], ["Épique", "#c084fc"], ["Légendaire", "#fbbf24"], ["Mythique", "#ff5f8a"]];
export const newShop = () => ({ v: 1, blocks: [], tags: [], groups: [], levels: foundry.utils.deepClone(LEVELS_DEFAULT), event: "", priceGrid: null });

/* ── réglages ── */
export function registerShopSettings() {
  const S = (k, o) => game.settings.register(MOD, k, o);
  S("shop", { scope: "world", config: false, type: Object, default: newShop() });
  S("shopLog", { scope: "world", config: false, type: Object, default: { list: [] } });
  S("signal", { scope: "world", config: false, type: Object, default: { name: "Signal Quotidien", cycles: [] } });
  S("ticker", { scope: "world", config: false, type: Object, default: { custom: [], off: [] } });
  S("catalogPublic", { name: "Les joueurs peuvent consulter le catalogue complet", hint: "Onglet « Catalogue » de la Boutique, en lecture seule (rien ne s'y achète).", scope: "world", config: true, type: Boolean, default: true });
  S("lockedMode", { name: "Objets et blocs verrouillés", hint: "Ce que voit un joueur quand son niveau ou ses étiquettes ne suffisent pas.", scope: "world", config: true, type: String, choices: { hide: "Cachés (défaut)", show: "Visibles avec « Niveau X requis » / « Étiquette requise »" }, default: "hide" });
  S("tickerOn", { name: "Bandeau défilant (nouvelles du cosmos)", scope: "world", config: true, type: Boolean, default: true });
  S("shopSkill", { name: "Compétence qui permet d'acheter", hint: "Nom exact de la compétence sur la fiche. Sans elle, le personnage peut consulter mais pas acheter. Vide = tout le monde peut acheter.", scope: "world", config: true, type: String, default: "Accès à la Boutique" });
}
/* 3.7 — événements : ceux du catalogue plus ceux de la suite (Fiche Manhwa : MANHWA.seasonEvents, dont ceux ajoutés par le MJ) */
export function suiteSeasons() { const out = new Map(); const k = n => nrm(n);
  for (const x of db().seasons || []) { const n = x.name || x; if (n) out.set(k(n), { name: n, icon: x.icon, color: x.color }); }
  for (const e of Object.values(globalThis.MANHWA?.seasonEvents || {})) if (!out.has(k(e.name))) out.set(k(e.name), { name: e.name, icon: e.icon, color: e.color, accent: e.accent });
  return [...out.values()]; }
/* 3.7 — groupes : ce sont les Groupes MJ de la Fiche Manhwa (une seule liste pour la suite) dès que la Fiche les a repris */
export const gmShared = () => { try { return !!globalThis.MANHWA?.gmGroups && !!game.settings.get("manhwa-sheet", "gmGroupsMig"); } catch (e) { return false; } };
const sharedGroups = () => { const G = globalThis.MANHWA.gmGroups; return G.list().map(g => ({ id: g.id, name: g.name, color: g.color, icon: g.icon, members: G.members(g) })); };
export const shop = () => { const s = game.settings.get(MOD, "shop"); const o = s && typeof s === "object" ? foundry.utils.deepClone(s) : newShop();
  o.blocks ||= []; o.tags ||= []; o.groups ||= []; if (!Array.isArray(o.levels) || o.levels.length !== 10) o.levels = foundry.utils.deepClone(LEVELS_DEFAULT);
  if (gmShared()) o.groups = sharedGroups();
  if (o.event === "@world") { o.eventRaw = "@world"; o.event = o.eventResolved = (() => { try { return globalThis.MANHWA?.season?.()?.eventName || ""; } catch (e) { return ""; } })(); }   /* événement = celui de la saison du monde */
  return o; };
const SHOP_LOCK = `set:${MOD}.shop`;
/** modifie la boutique (MJ) sous verrou ; fn(shop) rend false pour ne rien écrire */
export async function editShop(fn) { if (!game.user.isGM) return false; return C.withLock(SHOP_LOCK, async () => { const s = shop(); const r = await fn(s); if (r === false) return false;
  if (gmShared()) s.groups = foundry.utils.deepClone(game.settings.get(MOD, "shop")?.groups || []);
  if (s.eventRaw !== undefined) { if (s.event === s.eventResolved) s.event = s.eventRaw; } delete s.eventRaw; delete s.eventResolved;   /* les groupes partagés ne s'écrivent que dans la Fiche */
  await game.settings.set(MOD, "shop", s); return true; }); }

/* ── personnages ── */
export const shopOf = a => ({ lv: 1, tags: [], bought: {}, ...(a?.flags?.[MOD]?.shop || {}) });
export const levelOf = a => Math.max(1, Math.min(10, Number(shopOf(a).lv) || 1));
export const myActors = () => game.user.isGM ? game.actors.filter(a => a.type === "character" && a.hasPlayerOwner) : game.actors.filter(a => a.type === "character" && a.isOwner);
export function hasShopSkill(a) { const want = nrm(game.settings.get(MOD, "shopSkill") || ""); if (!want) return true; return !!a?.items?.some(i => nrm(i.name) === want || i.flags?.[MOD]?.id === "SK-0001"); }
/** étiquettes d'un personnage : données par le MJ ou achetées, plus celles liées à un titre / succès présent sur la fiche */
export function tagsOf(a, s = shop()) { const own = new Set(shopOf(a).tags || []); for (const t of s.tags) if (t.title && a?.items?.some(i => nrm(i.name) === nrm(t.title))) own.add(t.id); return s.tags.filter(t => own.has(t.id)); }
export const inGroup = (a, gid, s = shop()) => !!s.groups.find(g => g.id === gid)?.members?.includes(a?.uuid);

/* ── catalogue : index rapide (la base est recopiée à chaque getDB) ── */
let _db = null, _dbKey = null, _idx = null;
export function db() { let k = ""; try { k = String(game.settings.get(MOD, "delta") || ""); } catch (e) {} if (_db && k === _dbKey) return _db; const d = C.getDB?.(); if (d) { _db = d; _dbKey = k; _idx = null; } return d || { items: [], ranks: [], rars: [], types: [], cats: [] }; }
export const dbDirty = () => { _db = null; _idx = null; };
export function entry(id) { const d = db(); if (!_idx) { _idx = new Map(); for (const e of d.items || []) _idx.set(e.id, e); } return _idx.get(id) || null; }
export const rankIdx = r => Math.max(0, (db().ranks || []).findIndex(x => x.id === r));
export const rarIdx = r => { const i = (db().rars || []).findIndex(x => x.name === r); return i < 0 ? 0 : i; };
/* 3.2 : couleurs d'affichage façon jeu vidéo (lisibles sur fond sombre) ; repli sur celles du catalogue */
export const RANK_UI = { F: "#9aa6bf", E: "#58e08a", D: "#3fb4ff", C: "#9b7bff", B: "#ff6fb5", A: "#ff9a3c", S: "#ffd23f", SS: "#ff4d5e", SSS: "#ffe680" };
export const RAR_UI = { "Ordinaire": "#8a93a6", "Commun": "#c9d1dd", "Commun+": "#8ff0b0", "Peu Commun": "#3ddc84", "Rare": "#3fb4ff", "Très Rare": "#6f7dff", "Épique": "#c06bff",
  "Légendaire": "#ffb31a", "Mythique": "#ff3d5a", "Proto": "#2ee6e6", "Codex": "#ffe9a3", "Nihil": "#e6ecff", "Oméga": "#ff2d8a", "Artefact": "#fff6d6" };
export const tierClass = r => ["S", "SS", "SSS"].includes(r) ? r : (["A", "B"].includes(r) ? "hi" : "lo");
export const rankColor = r => RANK_UI[r] || (db().ranks || []).find(x => x.id === r)?.color || "#c8ced8";
export const rarColor = r => RAR_UI[r] || (db().rars || []).find(x => x.name === r)?.color || "#9ca3af";
export const iconUrl = k => route(C.iconPath?.(k));
export const cur = () => db().meta?.cur || "G";
export const route = p => { p = String(p || ""); if (!p || /^(https?:|data:|blob:|\/)/.test(p)) return p; try { return foundry.utils.getRoute(p); } catch (e) { return "/" + p; } };
export const catSlug = (t, c) => `${t}|${c}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/œ/g, "oe").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const TYPE_ICON3D = {}; for (const k of Object.keys(CAT_BG)) { const t = k.split("|")[0]; TYPE_ICON3D[t] ||= catSlug(t, k.slice(t.length + 1)); }
const icon3d = slug => route(`modules/${MOD}/icons2d/${slug}.svg`);
/** image d'un objet : l'icône 3D de sa catégorie (repli : celle du type) */
export function picOrIcon(e) { if (!e) return { pic: icon3d(TYPE_ICON3D.item || "item-consommables"), m3d: true };
  const sl = catSlug(e.t, e.cat); if (CAT_ICONS.has(sl)) return { pic: icon3d(sl), m3d: true }; if (TYPE_ICON3D[e.t]) return { pic: icon3d(TYPE_ICON3D[e.t]), m3d: true };
  const p = e.img || C.picOf?.(e.id); if (p) return { pic: route(p) }; const d = db();
  const c = (d.cats || []).find(c => c.type === e.t && c.name === e.cat); const ic = e.icon || c?.subs?.find(s => s.name === e.sub)?.icon || c?.icon || (d.types || []).find(t => t.id === e.t)?.icon; return { icon: route(C.iconPath?.(ic)) }; }
/** 3.11 : visuel d'un cosmétique (sticker, aperçu du fond d'écran, ou icône dans la couleur de sa famille) */
export function cosPic(e) { if (!e?.cosm) return ""; if (e.img) return `<img class="bq-cosp" src="${esc(route(e.img))}" alt="" loading="lazy">`;
  if (e.ccss) return `<span class="bq-cosw" style="background:${esc(e.ccss)}"></span>`; return `<i class="bq-cosi fa-solid ${esc(e.cicon || "fa-wand-sparkles")}" style="--cc:${esc(e.ccol || "#ff9ad5")}"></i>`; }
export const cosOwned = (a, e) => !!(a && e?.cosm && globalThis.MANHWA?.cosmetics?.owns(a, e.cosm));
/** fond de carte : motif de la famille + teinte de la catégorie */
export function catBg(e) { const v = CAT_BG[`${e?.t}|${e?.cat}`] || CAT_BG[Object.keys(CAT_BG).find(k => k.startsWith(`${e?.t}|`))] || ["dots", 210]; return { cls: `cbg cf-${v[0]}`, style: `--cbh:${v[1]}` }; }
export const catIcon3d = (t, c) => { const sl = catSlug(t, c); return CAT_ICONS.has(sl) ? icon3d(sl) : ""; };
/** niveau minimum pour un objet selon le tableau des niveaux (11 = jamais) */
export function levelFor(e, s = shop()) { const r = rankIdx(e?.rang), q = rarIdx(e?.rar); for (let i = 0; i < s.levels.length; i++) { const L = s.levels[i]; if (r <= rankIdx(L.rank) && q <= rarIdx(L.rar)) return i + 1; } return 11; }

/* ── prix : réduction de l'offre × promotion du bloc, puis offre groupée (« 2e à −50 % », « 2e offert », pack) ── */
export function unitPrice(it, b) { const e = it.tag ? null : entry(it.id); const base = it.tag ? Number(it.price) || 0 : Number(e?.price) || 0;
  let p = base * (1 - (Number(it.pct) || 0) / 100); if (b?.promo?.on) p *= 1 - (Number(b.promo.pct) || 0) / 100; return Math.max(0, Math.round(p)); }
export function basePrice(it) { return it.tag ? Number(it.price) || 0 : Number(entry(it.id)?.price) || 0; }
export function totalPrice(it, b, q) { q = Math.max(0, Math.floor(q)); const u = unitPrice(it, b); const d = it.deal; if (!d || !d.k || q < 2) return u * q;
  const n = Math.max(2, Number(d.n) || 2), pc = Math.max(0, Math.min(100, Number(d.pct) || 0));
  if (d.k === "nth") { const k = Math.floor(q / n); return u * (q - k) + Math.round(u * (1 - pc / 100)) * k; }
  if (d.k === "pack") { const k = Math.floor(q / n); return Math.round(u * n * (1 - pc / 100)) * k + u * (q % n); }
  return u * q; }
export function dealLabel(d) { if (!d?.k) return ""; const n = Number(d.n) || 2, pc = Number(d.pct) || 0; if (d.k === "nth") return pc >= 100 ? `${n}e offert` : `${n}e à −${pc} %`; if (d.k === "pack") return `Pack de ${n} : −${pc} %`; return ""; }
export function promoLeft(p) { if (!p?.on) return ""; const d = Number(p.days) || 0, h = Number(p.hours) || 0; if (d > 1) return `${d} jours`; if (d === 1 && h) return `${h} h`; if (d === 1) return "Dernier jour"; return h ? `${h} h` : ""; }

/* ── accès : bloc et objet pour un personnage ── */
export function blockAccess(a, b, s = shop()) {
  if (game.user.isGM && !a) return { ok: true };
  if (b.hidden) return { ok: false, why: "hidden", silent: true };
  if (b.event && nrm(b.event) !== nrm(s.event)) return { ok: false, why: "event", silent: true };
  const to = b.to || {}; if ((to.actors?.length || to.groups?.length) && !(to.actors || []).includes(a?.uuid) && !(to.groups || []).some(g => inGroup(a, g, s))) return { ok: false, why: "target", silent: true };
  const lv = levelOf(a); if ((Number(b.lv) || 1) > lv) return { ok: false, why: "lv", need: Number(b.lv) };
  const own = new Set(tagsOf(a, s).map(t => t.id)); const miss = (b.tags || []).filter(t => !own.has(t)); if (miss.length) return { ok: false, why: "tag", tags: miss };
  return { ok: true };
}
export function itemAccess(a, it, s = shop()) { if (it.tag || (game.user.isGM && !a)) return { ok: true }; const need = levelFor(entry(it.id), s); if (need > levelOf(a)) return { ok: false, why: "lv", need }; return { ok: true }; }
/** blocs et objets visibles par un personnage (le MJ sans personnage voit tout) */
export function visibleFor(a, s = shop(), mode = game.settings.get(MOD, "lockedMode")) {
  const out = [];
  for (const b of s.blocks) { const ba = blockAccess(a, b, s); if (!ba.ok && (ba.silent || mode === "hide")) continue;
    const items = []; for (const it of b.items || []) { const e = it.tag ? null : entry(it.id); if (!it.tag && !e) { if (game.user.isGM && !a) items.push({ it, e: null, lock: null }); continue; }
      const ia = ba.ok ? itemAccess(a, it, s) : ba; if (!ia.ok && mode === "hide") continue; items.push({ it, e, lock: ia.ok ? null : ia }); }
    if (!items.length && !(game.user.isGM && !a)) continue; out.push({ b, lock: ba.ok ? null : ba, items }); }
  return out;
}
export const findItem = (s, k) => { for (const b of s.blocks) { const it = (b.items || []).find(x => x.k === k); if (it) return { b, it }; } return null; };
export const blocksWith = (s, id) => s.blocks.filter(b => (b.items || []).some(x => x.id === id));

/* ── achat (exécuté chez le MJ, une opération à la fois) ── */
export async function buy(actor, lines) {
  if (!actor) return { ok: false, msg: "Aucun personnage." };
  const r = await C.gmDo("shopBuy", { actor: actor.uuid, lines: lines.map(l => ({ k: l.k, q: Math.max(1, Math.floor(l.q)) })) });
  if (r?.msg) ui.notifications[r.ok ? "info" : "warn"](r.msg); return r;
}
async function handleBuy({ actor: uuid, lines }, userId) {
  const user = game.users.get(userId); const actor = await fromUuid(uuid); if (!user || !actor) return { ok: false, msg: "Personnage introuvable." };
  if (!user.isGM && !actor.testUserPermission(user, "OWNER")) return { ok: false, msg: "Ce personnage n'est pas à toi." };
  if (!user.isGM && !hasShopSkill(actor)) return { ok: false, msg: `Il faut la compétence « ${game.settings.get(MOD, "shopSkill")} » pour acheter.` };
  if (!Array.isArray(lines) || !lines.length) return { ok: false, msg: "Rien à acheter." };
  await C.getDBAsync(); const M = C.buyMapping(); const cr = cur();
  return C.actorLock(actor, () => C.withLock(SHOP_LOCK, async () => {
    const s = shop(); const st = shopOf(actor); const bought = { ...(st.bought || {}) }; const plan = []; let total = 0;
    for (const l of lines) { const f = findItem(s, l.k); if (!f) return { ok: false, msg: "Une offre n'existe plus." }; const { b, it } = f; const e = it.tag ? null : entry(it.id);
      if (!it.tag && !e) return { ok: false, msg: "Objet introuvable au catalogue." };
      if (!user.isGM) { const ba = blockAccess(actor, b, s); if (!ba.ok) return { ok: false, msg: `« ${b.name} » n'est pas accessible.` }; const ia = itemAccess(actor, it, s); if (!ia.ok) return { ok: false, msg: `Niveau insuffisant pour ${e?.n}.` }; }
      const name = it.tag ? (s.tags.find(t => t.id === it.tag)?.name || "Étiquette") : e.n;
      if (it.tag && (st.tags || []).includes(it.tag)) return { ok: false, msg: `Tu as déjà l'étiquette « ${name} ».` };
      const q = it.tag || e?.cosm ? 1 : l.q;
      if (e?.cosm) { const CA = globalThis.MANHWA?.cosmetics; if (!CA) return { ok: false, msg: "Manhwa Sheet est requis pour les cosmétiques." }; if (e.cosm.startsWith("phone:") && !game.users.some(u => !u.isGM && actor.testUserPermission(u, "OWNER"))) return { ok: false, msg: `${name} : ce personnage n'a pas de joueur (le téléphone se débloque pour un joueur).` }; if (CA.owns(actor, e.cosm) || plan.some(p => p.e?.cosm === e.cosm)) return { ok: false, msg: `${name} : déjà débloqué.` }; }
      if (it.stock != null && it.stock !== "" && Number(it.stock) < q) return { ok: false, msg: Number(it.stock) > 0 ? `Plus que ${it.stock} × ${name} en stock.` : `${name} : épuisé.` };
      if (Number(it.limit) > 0 && (bought[it.k] || 0) + q > Number(it.limit)) return { ok: false, msg: `${name} : limite de ${it.limit} par personnage.` };
      const price = totalPrice(it, b, q); total += price; plan.push({ b, it, e, q, price, name }); bought[it.k] = (bought[it.k] || 0) + q; }
    const goldPath = M.actorGoldPath; const gold = Number(foundry.utils.getProperty(actor, goldPath));
    if (total && M.deduct !== false) { if (!Number.isFinite(gold)) return { ok: false, msg: "Portefeuille introuvable sur la fiche." }; if (gold < total && !user.isGM) return { ok: false, msg: `Fonds insuffisants : ${fmtFull(gold)} ${cr} pour ${fmtFull(total)} ${cr}.` }; }
    /* stock d'abord, puis paiement, puis objets ; tout est rendu si la création échoue */
    for (const p of plan) if (p.it.stock != null && p.it.stock !== "") p.it.stock = Math.max(0, Number(p.it.stock) - p.q);
    await game.settings.set(MOD, "shop", s);
    const restoreStock = async () => { const s2 = shop(); for (const p of plan) { const f = findItem(s2, p.it.k); if (f && f.it.stock != null && f.it.stock !== "") f.it.stock = Number(f.it.stock) + p.q; } await game.settings.set(MOD, "shop", s2); };
    if (total && M.deduct !== false) await actor.update({ [goldPath]: gold - total });
    const made = []; const unl = []; const newTags = [...(st.tags || [])];
    try {
      for (const p of plan) { if (p.it.tag) { if (!newTags.includes(p.it.tag)) newTags.push(p.it.tag); continue; }
        if (p.e?.cosm) { await globalThis.MANHWA.cosmetics.unlock(actor, p.e.cosm, true); unl.push(p.e.cosm); continue; }
        const data = await C.itemData(p.e, M, db()); if (!data) throw new Error("gabarit d'objet introuvable");
        if (foundry.utils.hasProperty(data, "system.quantity")) { foundry.utils.setProperty(data, "system.quantity", p.q); const [it] = await actor.createEmbeddedDocuments("Item", [data]); if (it) made.push(it.id); }
        else { const list = await actor.createEmbeddedDocuments("Item", Array.from({ length: Math.min(p.q, 50) }, () => foundry.utils.deepClone(data))); made.push(...list.map(i => i.id)); } }
    } catch (err) { console.error(MOD, "achat interrompu, tout est rendu", err); try { for (const c of unl) await globalThis.MANHWA?.cosmetics?.unlock(actor, c, false); if (made.length) await actor.deleteEmbeddedDocuments("Item", made); if (total && M.deduct !== false) await actor.update({ [goldPath]: Number(foundry.utils.getProperty(actor, goldPath)) + total }); await restoreStock(); } catch (e2) { console.error(MOD, e2); } return { ok: false, msg: `Achat interrompu (${err.message}).` }; }
    await actor.update({ [`flags.${MOD}.shop.bought`]: bought, [`flags.${MOD}.shop.tags`]: newTags });
    await logAdd({ id: uid(), t: Date.now(), u: userId, un: user.name, a: actor.uuid, an: actor.name, lines: plan.map(p => ({ k: p.it.k, b: p.b.id, bn: p.b.name, id: p.it.id || null, tag: p.it.tag || null, cosm: p.e?.cosm || null, n: p.name, q: p.q, price: p.price })), total, items: made });
    if (game.settings.get(MOD, "chatOnBuy")) ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), whisper: game.users.filter(u => u.isGM || actor.testUserPermission(u, "OWNER")).map(u => u.id),
      content: `<div class="bq-chat"><b>◆ Boutique</b><br>${esc(actor.name)} achète ${plan.map(p => `<b>${esc(p.name)}</b>${p.q > 1 ? ` ×${p.q}` : ""}`).join(", ")}${total ? ` — ${fmtFull(total)} ${esc(cr)}` : ""}</div>` });
    return { ok: true, total, msg: `${plan.map(p => `${p.name}${p.q > 1 ? ` ×${p.q}` : ""}`).join(", ")} → ${actor.name}${total ? ` (${fmtFull(total)} ${cr})` : ""}.` };
  }));
}

/* ── historique (MJ) ── */
const LOG_LOCK = `set:${MOD}.shopLog`;
export const shopLog = () => foundry.utils.deepClone(game.settings.get(MOD, "shopLog")?.list || []);
async function logAdd(e) { await C.withLock(LOG_LOCK, async () => { const l = shopLog(); l.push(e); while (l.length > 2000) l.shift(); await game.settings.set(MOD, "shopLog", { list: l }); }); }
/** annule un achat : rembourse, retire les objets créés, remet le stock et les limites, retire les étiquettes achetées */
export async function undo(id) {
  if (!game.user.isGM) return; const e = shopLog().find(x => x.id === id); if (!e || e.undone) return;
  const actor = await fromUuid(e.a).catch(() => null); const M = C.buyMapping();
  if (actor) await C.actorLock(actor, async () => {
    const ids = (e.items || []).filter(i => actor.items.get(i)); if (ids.length) await actor.deleteEmbeddedDocuments("Item", ids);
    for (const l of e.lines) if (l.cosm) await globalThis.MANHWA?.cosmetics?.unlock(actor, l.cosm, false);
    if (e.total && M.deduct !== false) { const g = Number(foundry.utils.getProperty(actor, M.actorGoldPath)); if (Number.isFinite(g)) await actor.update({ [M.actorGoldPath]: g + e.total }); }
    const st = shopOf(actor); const bought = { ...(st.bought || {}) }; for (const l of e.lines) bought[l.k] = Math.max(0, (bought[l.k] || 0) - l.q);
    const tags = (st.tags || []).filter(t => !e.lines.some(l => l.tag === t)); await actor.update({ [`flags.${MOD}.shop.bought`]: bought, [`flags.${MOD}.shop.tags`]: tags });
  });
  await editShop(s => { for (const l of e.lines) { const f = findItem(s, l.k); if (f && f.it.stock != null && f.it.stock !== "") f.it.stock = Number(f.it.stock) + l.q; } });
  await C.withLock(LOG_LOCK, async () => { const l = shopLog(); const x = l.find(y => y.id === id); if (x) x.undone = Date.now(); await game.settings.set(MOD, "shopLog", { list: l }); });
  ui.notifications.info(`Achat annulé : ${e.an} remboursé de ${fmtFull(e.total)} ${cur()}.`);
}

/* ── MJ : niveaux et étiquettes des personnages ── */
export async function setLevel(a, lv) { if (!game.user.isGM || !a) return; await a.update({ [`flags.${MOD}.shop.lv`]: Math.max(1, Math.min(10, Number(lv) || 1)) }); }
export async function setTags(a, tags) { if (!game.user.isGM || !a) return; await a.update({ [`flags.${MOD}.shop.tags`]: [...new Set(tags)] }); }

/* ── grille de prix (anomalies) : prix conseillé = base du rang × multiplicateur de rareté, tolérance en % ── */
/* grille par défaut tirée du catalogue lui-même : médiane des prix par rang, puis multiplicateur médian de chaque rareté */
let _grid = null;
export const GRID_DEFAULT = () => { if (_grid) return foundry.utils.deepClone(_grid); const items = (db().items || []).filter(e => Number(e.price) > 0); const med = a => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
  const rank = {}; for (const r of db().ranks || []) rank[r.id] = Math.round(med(items.filter(e => e.rang === r.id).map(e => Number(e.price)))) || 0;
  const rar = {}; for (const r of db().rars || []) { const v = med(items.filter(e => e.rar === r.name && rank[e.rang]).map(e => Number(e.price) / rank[e.rang])); rar[r.name] = v ? Math.round(v * 100) / 100 : 1; }
  _grid = { tol: 75, rank, rar }; return foundry.utils.deepClone(_grid); };
export function gridPrice(e, g) { if (!e || !g) return null; const b = Number(g.rank?.[e.rang]); if (!b) return null; const m = Number(g.rar?.[e.rar]) || 1; return Math.round(b * m); }
export function anomalies(s = shop()) {
  const g = s.priceGrid || GRID_DEFAULT(); const out = []; const seen = new Map();
  for (const b of s.blocks) for (const it of b.items || []) { if (it.tag) continue; const e = entry(it.id); const w = [];
    if (!e) { out.push({ b, it, e, w: ["Objet introuvable au catalogue"] }); continue; }
    if (seen.has(it.id)) w.push(`Aussi dans « ${seen.get(it.id)} »`); else seen.set(it.id, b.name);
    const gp = gridPrice(e, g); const p = Number(e.price) || 0; if (gp && (p < gp * (1 - g.tol / 100) || p > gp * (1 + g.tol / 100))) w.push(`Prix ${fmtShort(p)} hors grille (conseillé ${fmtShort(gp)})`);
    if (!p) w.push("Prix à 0"); if (!String(e.desc || "").trim()) w.push("Pas de description");
    if (it.stock != null && it.stock !== "" && Number(it.stock) <= 0) w.push("Épuisé");
    if (levelFor(e, s) > 10) w.push("Aucun niveau ne l'autorise");
    if (w.length) out.push({ b, it, e, w, gp }); }
  return out;
}

export function initShopData() {
  C.GM_HANDLERS.shopBuy = handleBuy;
  Hooks.on("updateSetting", st => { if (st.key === `${MOD}.delta`) dbDirty(); });
}
