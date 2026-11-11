/* Boutique — Signal Quotidien (nom modifiable) : récompenses journalières façon gacha. Le MJ crée des cycles (3, 7, 14 ou 28 jours)
 * pour un groupe MJ ou un personnage, choisit la récompense de chaque jour et fait passer les jours lui-même.
 * Les joueurs réclament dans l'onglet du Menu : « ding » + la récompense qui s'affiche. */
import { MOD, C, esc, uid, fmtFull, fmtShort, shop, entry, picOrIcon, catBg, rankColor, cur } from "./shop-data.js";
import * as SFX from "./sfx.js";

export const signalCfg = () => { const s = foundry.utils.deepClone(game.settings.get(MOD, "signal") || {}); s.name ||= "Signal Quotidien"; s.cycles ||= []; return s; };
const LOCK = `set:${MOD}.signal`;
export async function editSignal(fn) { if (!game.user.isGM) return; return C.withLock(LOCK, async () => { const s = signalCfg(); if (fn(s) === false) return; await game.settings.set(MOD, "signal", s); }); }
export const newCycle = () => ({ id: uid(), name: "Signal de la semaine", len: 7, day: 1, target: null, accumulate: true, on: true, rewards: {}, claims: {} });
export function cycleMembers(c, s = shop()) { if (!c?.target) return []; if (c.target.k === "actor") { const a = game.actors.find(x => x.uuid === c.target.id); return a ? [a] : []; }
  const g = s.groups.find(x => x.id === c.target.id); return (g?.members || []).map(u => game.actors.find(a => a.uuid === u)).filter(Boolean); }
export const cyclesFor = (a, S = signalCfg(), s = shop()) => S.cycles.filter(c => c.on !== false && cycleMembers(c, s).some(x => x.id === a?.id));
export function claimable(c, a) { const got = new Set(c.claims?.[a.uuid] || []); const days = c.accumulate !== false ? Array.from({ length: c.day }, (_, i) => i + 1) : [c.day]; return days.filter(d => !got.has(d) && c.rewards?.[d]); }
/** jour suivant / précédent ; après le dernier jour, le cycle recommence à 1 et les réclamations repartent de zéro */
export async function advance(id, dir) { await editSignal(S => { const c = S.cycles.find(x => x.id === id); if (!c) return false; let d = c.day + dir; if (d > c.len) { d = 1; c.claims = {}; } if (d < 1) d = 1; c.day = d; }); }

/* exécuté chez le MJ */
async function handleClaim({ cycle, actor: uuid, day }, userId) {
  const user = game.users.get(userId); const actor = await fromUuid(uuid); if (!user || !actor) return { ok: false, msg: "Personnage introuvable." };
  if (!user.isGM && !actor.testUserPermission(user, "OWNER")) return { ok: false, msg: "Ce personnage n'est pas à toi." };
  return C.withLock(LOCK, async () => {
    const S = signalCfg(); const c = S.cycles.find(x => x.id === cycle); if (!c || c.on === false) return { ok: false, msg: "Ce signal n'existe plus." };
    if (!cycleMembers(c).some(a => a.id === actor.id)) return { ok: false, msg: "Ce signal ne te concerne pas." };
    if (!claimable(c, actor).includes(day)) return { ok: false, msg: "Rien à réclamer pour ce jour." };
    const r = c.rewards[day]; const e = r.id ? entry(r.id) : null; const M = C.buyMapping(); await C.getDBAsync();
    if (e) { const data = await C.itemData(e, M, null); if (!data) return { ok: false, msg: "Objet impossible à créer." };
      if (foundry.utils.hasProperty(data, "system.quantity")) { foundry.utils.setProperty(data, "system.quantity", r.q || 1); await actor.createEmbeddedDocuments("Item", [data]); }
      else await actor.createEmbeddedDocuments("Item", Array.from({ length: Math.min(r.q || 1, 50) }, () => foundry.utils.deepClone(data))); }
    if (r.gold) { const g = Number(foundry.utils.getProperty(actor, M.actorGoldPath)); if (Number.isFinite(g)) await actor.update({ [M.actorGoldPath]: g + Number(r.gold) }); }
    (c.claims ||= {})[actor.uuid] = [...(c.claims[actor.uuid] || []), day]; await game.settings.set(MOD, "signal", S);
    return { ok: true, name: e?.n || "", q: r.q || 1, gold: r.gold || 0, id: e?.id || null };
  });
}

/* ── onglet du Menu : frise façon gacha (médaillons reliés jour après jour) ── */
export function frieze(c, { a = null, gm = false, mem = [] } = {}) {
  const can = new Set(a ? claimable(c, a) : []); const got = new Set(a ? (c.claims?.[a.uuid] || []) : []); const cr = cur(); const shape = c.shape === "square" ? "sq" : "rd";
  const node = d => { const r = c.rewards?.[d]; const e = r?.id ? entry(r.id) : null; const P = e ? picOrIcon(e) : null; const cb = e ? catBg(e) : null;
    const st = a ? (got.has(d) ? "got" : can.has(d) ? "can" : d === c.day ? "today" : d > c.day ? "future" : "miss") : (d === c.day ? "today" : d < c.day ? "past" : "future");
    const n = gm && !a ? mem.filter(x => (c.claims?.[x.uuid] || []).includes(d)).length : 0;
    const tip = r ? `${e ? `${e.n}${r.q > 1 ? ` ×${r.q}` : ""}` : ""}${r.gold ? `${e ? " + " : ""}${fmtFull(r.gold)} ${cr}` : ""}` : "Pas de récompense";
    return `<div class="sg-n ${st}${r?.big ? " big" : ""}${d === c.day ? " now" : ""}" data-d="${d}" ${a ? `data-mact="${st === "can" ? "sigClaim" : "noop"}"` : `data-a="cycDay"`} style="--rc:${e ? rankColor(e.rang) : r?.gold ? "#ffd76a" : "#5a6a9a"}" data-tooltip="Jour ${d} : ${esc(tip)}${gm && !a ? `<br>${n} / ${mem.length} réclamé` : ""}">
      <span class="sg-day">JOUR ${d}</span><div class="sg-med ${shape}"><div class="sg-in ${cb?.cls || ""}" style="${cb?.style || ""}">${r ? (P?.pic ? `<img src="${esc(P.pic)}" alt="">` : e ? `<i class="ico" style="--ico:url('${esc(P.icon)}')"></i>` : `<i class="fa-solid fa-coins sg-gold"></i>`) : `<i class="fa-solid fa-satellite-dish sg-none"></i>`}</div>
      ${e ? `<span class="bq-rkb n${String(e.rang).length}"><b>${esc(e.rang)}</b></span>` : ""}${st === "got" ? `<i class="sg-ck fa-solid fa-check"></i>` : st === "future" && a ? `<i class="sg-lk fa-solid fa-lock"></i>` : ""}${st === "can" ? `<i class="sg-nw">!</i>` : ""}</div>
      <span class="sg-q">${r ? (e ? `${esc(e.n)}${r.q > 1 ? ` <em>×${r.q}</em>` : ""}` : `${fmtShort(r.gold)} ${esc(cr)}`) : "—"}</span>${r?.gold && e ? `<span class="sg-g">+ ${fmtShort(r.gold)} ${esc(cr)}</span>` : ""}${gm && !a ? `<span class="sg-cl">${n}/${mem.length}</span>` : ""}</div>`; };
  return `<div class="sg-track ${shape}" style="--len:${c.len}"><div class="sg-line"><i style="width:${Math.max(0, Math.min(100, (c.day - 1) / Math.max(1, c.len - 1) * 100))}%"></i></div>${Array.from({ length: c.len }, (_, i) => node(i + 1)).join("")}</div>`;
}
function tabHTML(app) {
  const a = app.actor; const S = signalCfg(); const s = shop(); const gm = game.user.isGM;
  const list = a ? cyclesFor(a, S, s) : [];
  const head = `<div class="bq-sig-h"><div class="beacon"><i class="fa-solid fa-tower-broadcast"></i><span></span><span></span></div><div><small>RÉCOMPENSES JOURNALIÈRES</small><b>${esc(S.name)}</b></div>${gm ? `<button class="bq-b sm" data-mact="sigAdmin"><i class="fa-solid fa-gear"></i> Gérer</button>` : ""}</div>`;
  if (!list.length) return `<div class="bq-sig">${head}<p class="none">${gm ? (a ? `${esc(a.name)} n'est dans aucun cycle.` : "Aucun personnage.") + " Crée un cycle dans Gestion › Signal Quotidien." : "Aucun signal pour toi en ce moment."}</p></div>`;
  return `<div class="bq-sig">${head}${list.map(c => { const can = claimable(c, a);
    return `<section class="bq-sigc sg" data-c="${c.id}"><header class="sg-h"><b>${esc(c.name)}</b><span class="sg-pill">${"Jour"} ${c.day} / ${c.len}</span>${can.length ? `<span class="sg-pill hot"><i class="fa-solid fa-gift"></i> ${can.length} à réclamer</span>` : `<span class="sg-pill ok"><i class="fa-solid fa-check"></i> à jour</span>`}
      ${can.length > 1 ? `<button class="sg-all" data-mact="sigAll"><i class="fa-solid fa-gift"></i> Tout réclamer (${can.length})</button>` : can.length === 1 ? `<button class="sg-all" data-mact="sigClaim" data-d="${can[0]}"><i class="fa-solid fa-gift"></i> Réclamer</button>` : ""}</header>${frieze(c, { a })}</section>`; }).join("")}</div>`;
}
async function claimFx(app, res) {
  const root = app.element; if (!root || !res?.ok) return; SFX.ding(); const e = res.id ? entry(res.id) : null; const P = e ? picOrIcon(e) : null; const cr = cur();
  const fx = document.createElement("div"); fx.className = "bq-claimfx"; fx.style.setProperty("--rc", e ? rankColor(e.rang) : "#ffd76a");
  fx.innerHTML = `<div class="burst"></div><div class="card"><div class="pic">${P?.pic ? `<img src="${esc(P.pic)}">` : e ? `<i class="ico" style="--ico:url('${esc(P.icon)}')"></i>` : `<i class="fa-solid fa-coins"></i>`}</div><small>RÉCOMPENSE OBTENUE</small><b>${esc(e ? e.n : "")}${res.q > 1 && e ? ` ×${res.q}` : ""}</b>${res.gold ? `<span>+ ${fmtFull(res.gold)} ${esc(cr)}</span>` : ""}</div>`;
  root.appendChild(fx); fx.addEventListener("click", () => fx.remove()); setTimeout(() => fx.remove(), 3200);
}
async function tabAct(app, act, el) {
  if (act === "sigAdmin") return (await import("./shop-gm.js")).AdminApp.open("signal");
  const cid = el.closest("[data-c]")?.dataset.c; const a = app.actor; if (!a || !cid) return;
  if (act === "sigClaim") { if (el.dataset.busy) return; el.dataset.busy = "1"; const res = await C.gmDo("signalClaim", { cycle: cid, actor: a.uuid, day: Number(el.dataset.d) }); if (!res?.ok) return ui.notifications.warn(res?.msg || "Échec."); await claimFx(app, res); }
  if (act === "sigAll") { const c = signalCfg().cycles.find(x => x.id === cid); for (const d of claimable(c, a)) { const res = await C.gmDo("signalClaim", { cycle: cid, actor: a.uuid, day: d }); if (res?.ok) await claimFx(app, res); await new Promise(r => setTimeout(r, 450)); } }
}
export function initSignal() { C.GM_HANDLERS.signalClaim = handleClaim; }
export function registerSignalTab() {
  const api = globalThis.MANHWA; if (!api?.registerMenuTab) return;
  api.registerMenuTab({ key: "lhSignal", group: "orbis", name: "Signal Quotidien", icon: "fa-tower-broadcast", color: "#ffd76a", render: app => tabHTML(app), act: (app, a, el) => tabAct(app, a, el) });
}
Hooks.on("updateSetting", st => { if (st.key !== `${MOD}.signal` && st.key !== `${MOD}.shop` && st.key !== "manhwa-sheet.gmGroups") return; for (const app of foundry.applications.instances.values()) if (app.tab === "lhSignal" && app.rendered && String(app.id).startsWith("ms-menu-")) app.render(); });

/* Horlogia : un groupe qui « fait avancer les modules » fait passer les jours des cycles dont un membre est dans ce groupe */
Hooks.on("manhwaNewDay", async info => { if (!game.user.isGM || game.users.activeGM?.id !== game.user.id) return; const set = new Set(info?.actors || []); if (!set.size) return;
  const ids = signalCfg().cycles.filter(c => c.on !== false && cycleMembers(c).some(a => set.has(a.uuid))).map(c => c.id); const n = Math.max(1, Math.min(60, Number(info.days) || 1));
  for (const id of ids) for (let i = 0; i < n; i++) await advance(id, +1); });
export async function nextDayAll() { for (const c of signalCfg().cycles.filter(x => x.on !== false)) await advance(c.id, +1); }
