/* Boutique — petits sons synthétisés (aucun fichier) : pièces d'or façon casino, « ding » de récompense, montée de niveau. */
let ctx = null;
const ac = () => { try { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); return ctx; } catch (e) { return null; } };
const vol = () => { try { return Math.max(0, Math.min(1, (game.settings.get("core", "globalInterfaceVolume") ?? 0.5))) ; } catch (e) { return 0.5; } };
function tone(c, t0, f, d, { type = "sine", g = 0.2, f2 = null } = {}) {
  const o = c.createOscillator(), a = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  a.gain.setValueAtTime(0.0001, t0); a.gain.exponentialRampToValueAtTime(g * vol(), t0 + 0.008); a.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(a).connect(c.destination); o.start(t0); o.stop(t0 + d + 0.02);
}
/** pièces qui tombent (n = nombre de pièces, plafonné) */
export function coins(n = 1) { const c = ac(); if (!c) return; const t = c.currentTime; const k = Math.min(8, Math.max(1, n));
  for (let i = 0; i < k; i++) { const t0 = t + i * 0.07 + Math.random() * 0.02; const f = 1900 + Math.random() * 700;
    tone(c, t0, f, 0.16, { type: "triangle", g: 0.12 }); tone(c, t0 + 0.012, f * 1.5, 0.22, { type: "sine", g: 0.07 }); tone(c, t0 + 0.03, f * 2.01, 0.3, { type: "sine", g: 0.03 }); }
  tone(c, t + k * 0.07 + 0.05, 2637, 0.5, { type: "sine", g: 0.05 }); }
/** « ding » de récompense */
export function ding() { const c = ac(); if (!c) return; const t = c.currentTime; for (const [f, g, d] of [[1318.5, 0.18, 1.2], [1975.5, 0.09, 0.9], [2637, 0.05, 0.7], [3951, 0.025, 0.5]]) tone(c, t, f, d, { g }); tone(c, t + 0.12, 1760, 0.9, { g: 0.08 }); }
/** montée de niveau : arpège lumineux */
export function levelUp() { const c = ac(); if (!c) return; const t = c.currentTime; [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(c, t + i * 0.09, f, 0.6, { type: "triangle", g: 0.09 })); tone(c, t + 0.5, 2093, 1.2, { g: 0.05 }); }
/** clic discret */
export function tick() { const c = ac(); if (!c) return; tone(c, c.currentTime, 1400, 0.05, { type: "square", g: 0.025 }); }
