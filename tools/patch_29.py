# Catalogue 2.8.1 — effets réservés aux objets d'exception (bannières de rang, fenêtre de détail), étiquettes au style
# Manhwa Sheet, registre lisible, progression retirée, optimisations (animations composées sur le GPU uniquement).
import sys
P = sys.argv[1]; s = open(P, encoding="utf-8").read()
if "/* ══ 2.8.1" in s: print("déjà appliqué"); sys.exit(0)
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:110], c); s = s.replace(a, b)

# ── police des étiquettes (même que Manhwa Sheet) ──
rep("family=Orbitron:wght@400;700;900&", "family=Orbitron:wght@400;700;900&family=Exo+2:wght@600;700&")

# ── progression retirée de la fenêtre de détail ──
rep("(e.lv?'<h5>Progression</h5><div class=\"lvbar\">'+'<i></i>'.repeat(Math.min(30,e.lv))+'</div>':'')+", "")

# ── bannière de rang : classe « hr » pour les 3 rangs du haut ──
rep("h.className='rsec';", "h.className='rsec'+(RANGS.length>=4&&RANGS.indexOf(e.rang)>=0&&RANGS.length-1-ri(e.rang)<3?' hr':'');")

# ── animations coûteuses retirées (filtres / ombres / text-shadow animés) ──
rep(".neo .dact button.buy-b:not(:disabled){animation:buyGlow 2.4s ease-in-out infinite}\n@keyframes buyGlow{50%{filter:brightness(1.22)}}\n", "")
rep(";animation:seasGlow 3s ease-in-out infinite}\n@keyframes seasGlow{50%{filter:brightness(1.18)}}", "}")
rep(".card.hr2 .badge,.card.hr3 .badge{animation:hrBadge 2.6s ease-in-out infinite}\n@keyframes hrBadge{50%{filter:drop-shadow(0 0 9px var(--rc)) brightness(1.25)}}",
    ".card.hr2 .badge,.card.hr3 .badge{filter:drop-shadow(0 0 7px var(--rc))}")
rep(".card.rq2 .rban span,.card.rq3 .rban span{animation:rqText 3s ease-in-out infinite}\n@keyframes rqText{50%{text-shadow:0 0 6px var(--rr),0 0 16px var(--rr),0 0 2px #fff}}",
    ".card.rq2 .rban span,.card.rq3 .rban span{text-shadow:0 0 6px var(--rr),0 0 14px var(--rr)}")
rep(".neo .dwin.hr2,.neo .dwin.hr3,.neo .dwin.rq3{animation:dGlow 3s ease-in-out infinite}\n@keyframes dGlow{50%{box-shadow:0 0 0 1px var(--rc),0 0 46px color-mix(in srgb,var(--rc) 70%,transparent),inset 0 0 50px color-mix(in srgb,var(--rc) 18%,transparent)}}",
    ".neo .dwin.hr2,.neo .dwin.hr3,.neo .dwin.rq3{box-shadow:0 0 0 1px var(--rc),0 0 40px color-mix(in srgb,var(--rc) 62%,transparent),inset 0 0 48px color-mix(in srgb,var(--rc) 16%,transparent)}")
rep(";will-change:transform}", "}")
# fond lumineux : filtre de saison appliqué aux couleurs en JS, plus de filtre ni de fusion plein écran
rep("#hexfx{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:calc(var(--bgo,1) * .9);filter:var(--bgf,none);mix-blend-mode:screen}",
    "#hexfx{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:calc(var(--bgo,1) * .9)}")

css = r"""/* ══ 2.8.1 : effets réservés aux objets d'exception, étiquettes, registre, optimisations ══ */
/* balayage de la fenêtre de détail : seulement hauts rangs / hautes raretés */
.neo .dwin::after{display:none;animation:none}
.neo .dwin:is(.hr1,.hr2,.hr3,.rq1,.rq2,.rq3)::after{display:block;animation:dScan 7s linear infinite}
/* bannières de rang : reflet seulement pour S, SS, SSS (ou les 3 rangs du haut) */
.neo .rsec .rbn .sh{display:none;animation:none}
.neo .rsec.hr .rbn .sh{display:block;animation:fxSweep 4.6s ease-in-out infinite}
.neo .rsec:not(.hr)::before{opacity:.16}
/* recherche : plus de filtre (le reflet glisse en transform, sans repeindre) */
.neo .search{filter:none;overflow:hidden;clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)}
.neo .search::before{inset:0 auto 0 0;width:300%;clip-path:none;background:linear-gradient(110deg,var(--acc) 0%,var(--acc2) 18%,#ffffff 25%,var(--acc2) 32%,var(--acc) 50%,var(--acc2) 68%,#ffffff 75%,var(--acc2) 82%,var(--acc) 100%);background-size:100% 100%;animation:sShine 6s linear infinite}
@keyframes sShine{from{transform:translateX(0)}to{transform:translateX(-50%)}}
/* contour tournant : rotation (GPU) au lieu d'un angle animé */
.fxb{background:none;overflow:hidden;animation:none}
.fxb::before{content:'';position:absolute;left:50%;top:50%;width:var(--fxs,620px);height:var(--fxs,620px);margin:calc(var(--fxs,620px) / -2) 0 0 calc(var(--fxs,620px) / -2);background:conic-gradient(transparent 0 58%,color-mix(in srgb,var(--fxc,var(--rc)) 70%,transparent) 72%,#fff 76%,var(--fxc,var(--rc)) 80%,transparent 94%);animation:fxRot 3.4s linear infinite}
.dwin .fxb{--fxs:2200px}
@keyframes fxRot{to{transform:rotate(360deg)}}
body.nofx .fxb::before{animation:none}
@media (prefers-reduced-motion:reduce){.fxb::before,.neo .search::before{animation:none}}
/* flou d'arrière-plan retiré (recalculé à chaque image derrière le fond animé) */
.neo header,.neo .tools{backdrop-filter:none}
/* ombres allégées */
.neo .card{box-shadow:0 0 0 1px color-mix(in srgb,var(--rc) 16%,transparent),0 0 10px color-mix(in srgb,var(--rc) 28%,transparent),inset 0 0 12px color-mix(in srgb,var(--rc) 9%,transparent)}

/* registre : noms de champ */
.neo .kv{gap:7px 14px;align-items:baseline}
.neo .kv b{font-family:'Exo 2',var(--f-ui),sans-serif;font-weight:700;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:color-mix(in srgb,var(--rc) 70%,#ffffff);text-shadow:0 0 8px color-mix(in srgb,var(--rc) 45%,transparent);white-space:nowrap}
.neo .kv span{font-family:var(--f-mono);font-size:11.5px;color:var(--w)}

/* étiquettes : même style que Manhwa Sheet (plein fléché / pastille / barre / pointillé) */
.neo :is(.tag,.pill){--kc:var(--acc);display:inline-flex;align-items:center;gap:4px;height:18px;padding:0 8px;border-radius:2px;clip-path:none;font-family:'Exo 2',var(--f-ui),sans-serif;font-weight:700;font-size:10px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;line-height:1;text-shadow:none;box-shadow:none;color:color-mix(in srgb,var(--kc) 80%,#fff);background:#0006;border:1px solid color-mix(in srgb,var(--kc) 55%,transparent);border-left-width:3px}
.neo :is(.tag,.pill) svg{width:10px;height:10px;margin:0}
/* niveau 0 : plein, fléché — rareté */
.neo .dwin .tag{clip-path:none;border-radius:2px}
.neo .dwin .tag.rar{--kc:var(--rr);color:var(--s0);background:var(--kc);border:1px solid var(--kc);padding:0 13px 0 8px;clip-path:polygon(0 0,calc(100% - 7px) 0,100% 50%,calc(100% - 7px) 100%,0 100%)}
/* niveau 1 : pastille lumineuse — élément, saison */
.neo :is(.dwin .tag.elem,.pill:not(.cat):not(.stock)){--kc:var(--pc,var(--ec,var(--acc)));border-radius:10px;color:#fff;background:color-mix(in srgb,var(--kc) 28%,var(--s2));border:1px solid color-mix(in srgb,var(--kc) 70%,transparent);border-left-width:1px;box-shadow:0 0 10px -5px var(--kc)}
.neo .dwin .tag.elem{--kc:var(--ec)}
.neo .pill.seas{--kc:var(--pink)}
/* niveau 2 : barre à gauche — monde, catégorie, stock */
.neo .dwin .tag.world{--kc:var(--wc)}
.neo .pill.cat{--kc:var(--tc,var(--acc))}
.neo .pill.stock{--kc:var(--pc)}
.neo .pill.stock.none{background:color-mix(in srgb,var(--red) 16%,#0006)}
/* niveau 3 : pointillé — niveau d'objet, tags libres */
.neo .dwin .tag:not(.rar):not(.elem):not(.world){--kc:var(--mute);color:color-mix(in srgb,var(--tx) 80%,var(--mute));background:transparent;border:1px dashed color-mix(in srgb,var(--acc) 40%,transparent);font-weight:600;text-transform:none;letter-spacing:.04em;font-size:10.5px}
.neo .dwin .dhead .meta{gap:5px}
"""
rep("</style>", css + "</style>")

# ── fond lumineux : couleurs passées dans le filtre de la saison (calcul unique) ──
rep("  let on=false, raf=0, last=0, W=0, H=0, sc=1, x0=0, y0=0, P=[];",
    "  const BASE=COL.slice(), BASEL=COLL.slice(); let FK='';\n"
    "  function tint(){ const f=(getComputedStyle(document.body).getPropertyValue('--bgf')||'').trim(); if(f===FK) return; FK=f; if(!f||f==='none'){ for(let i=0;i<BASE.length;i++){ COL[i]=BASE[i]; COLL[i]=BASEL[i]; } return; }\n"
    "    try{ const c=document.createElement('canvas'); c.width=GX; c.height=GY*2; const x=c.getContext('2d'); x.filter=f; for(let i=0;i<BASE.length;i++){ x.fillStyle=BASE[i]; x.fillRect(i%GX,(i/GX|0),1,1); x.fillStyle=BASEL[i]; x.fillRect(i%GX,GY+(i/GX|0),1,1); } const d=x.getImageData(0,0,GX,GY*2).data; const px=(k)=>'rgb('+d[k*4]+','+d[k*4+1]+','+d[k*4+2]+')'; for(let i=0;i<BASE.length;i++){ COL[i]=px(i); COLL[i]=px(GX*GY+i); } }catch(e){} }\n"
    "  let on=false, raf=0, last=0, W=0, H=0, sc=1, x0=0, y0=0, P=[];")
rep("  function set(v){ v=!!v&&!RM; if(v===on) return;", "  function set(v){ v=!!v&&!RM; if(v) tint(); if(v===on) return;")

open(P, "w", encoding="utf-8").write(s); print("2.8.1 appliqué")
