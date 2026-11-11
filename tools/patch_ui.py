# Catalogue 2.7.0 — interface : DA saisonnières (16), fond hexagonal, recherche miroitante + encadré du quota, filtres en pastilles,
# niveau par joueur, roulette retirée, exports JSON/CSV déplacés dans les paramètres, bascule « masqués/grisés » retirée.
import re, sys
P = sys.argv[1]; s = open(P, encoding="utf-8").read()
if "/* ══ 2.7.0 ══ */" in s: print("déjà appliqué"); sys.exit(0)
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:90], c); s = s.replace(a, b)

SEASONS = [  # clé, nom, s0, s1, s2, line, line2, acc, acc-l, acc2, acc2-l, gold, glow1, glow2, filtre du fond, effet, couleurs de l'effet
 ("nouvel-an", "Nouvel An", "#05060f", "#0a0c1c", "#12152e", "#2a2f55", "#4a4f80", "#f5d06a", "#ffe9a8", "#c9d4ff", "#eef2ff", "#ffd760", "#2a2140", "#3a2e10", "hue-rotate(-60deg) saturate(.6) brightness(.9)", "sparks", ["#ffd760", "#ffffff", "#c9d4ff"]),
 ("nouvel-an-lunaire", "Nouvel An lunaire", "#120406", "#1c070a", "#2a0b10", "#5a1a20", "#8a2a30", "#ff4a3a", "#ff8a6a", "#f5c518", "#ffe08a", "#f5c518", "#4a0a10", "#3a2a06", "hue-rotate(-30deg) saturate(1.3)", "lanterns", ["#ff4a3a", "#ff8a3a", "#f5c518"]),
 ("fetes-d-hiver", "Fêtes d'hiver", "#040a14", "#08121f", "#0e1c30", "#1f3a5a", "#3a6a90", "#8fe3ff", "#d6f6ff", "#ff5a6a", "#ffa0aa", "#e8f6ff", "#0a2a4a", "#3a0a14", "hue-rotate(-110deg) saturate(.7) brightness(1.05)", "snow", ["#ffffff", "#d6f6ff", "#a8dcff"]),
 ("nuit-des-masques", "Nuit des Masques", "#0a0410", "#12061a", "#1c0a28", "#3a1a4a", "#5a2a70", "#ff8a1e", "#ffb860", "#a24bff", "#cf9bff", "#ffb020", "#2a0a3a", "#3a1a04", "hue-rotate(10deg) saturate(1.2)", "embers", ["#ff8a1e", "#ff5a1e", "#a24bff"]),
 ("fete-des-oeufs", "Fête des Œufs", "#0a0f12", "#10181c", "#18242a", "#2e4a50", "#4a7078", "#8af0c8", "#c8ffe8", "#ffa8d8", "#ffd0ea", "#ffe28a", "#1a3a30", "#3a1a30", "hue-rotate(-170deg) saturate(.8) brightness(1.1)", "confetti", ["#8af0c8", "#ffa8d8", "#ffe28a", "#a8c8ff"]),
 ("saison-des-plages", "Saison des plages", "#03100f", "#061a19", "#0a2826", "#16504a", "#2a8078", "#2ff0d8", "#9ffff0", "#ffc870", "#ffe2b0", "#ffd27a", "#0a3a36", "#3a2a0a", "hue-rotate(-150deg) saturate(1.1)", "bubbles", ["#9ffff0", "#ffffff", "#2ff0d8"]),
 ("fete-des-lumieres", "Fête des Lumières", "#06040f", "#0c0819", "#140e28", "#2e2250", "#4a3a80", "#ffb347", "#ffd89a", "#8a7aff", "#c2b8ff", "#ffcf5a", "#2a1a4a", "#3a2a0a", "hue-rotate(20deg) saturate(.9)", "lights", ["#ffb347", "#ffd89a", "#fff1c8"]),
 ("jour-des-morts", "Jour des Morts", "#08040a", "#110710", "#1c0c1a", "#3a1a34", "#6a2a5a", "#ff9a1e", "#ffc870", "#ff3aa8", "#ff8ad0", "#ffb020", "#3a0a2a", "#3a2004", "hue-rotate(20deg) saturate(1.3)", "petals", ["#ff9a1e", "#ffb020", "#ff3aa8"]),
 ("fete-des-couleurs", "Fête des Couleurs", "#07060e", "#0e0c1a", "#181428", "#2e2a50", "#4a4480", "#ff4ad0", "#ff9ae6", "#ffd23a", "#ffe89a", "#3affb0", "#3a0a3a", "#0a3a2a", "saturate(1.6)", "dust", ["#ff4ad0", "#ffd23a", "#3affb0", "#3aa8ff", "#ff6a3a"]),
 ("fete-de-l-eau", "Fête de l'Eau", "#030a14", "#06121f", "#0a1c30", "#163a5a", "#2a6a9a", "#3ab8ff", "#a0e0ff", "#3affd8", "#a0fff0", "#bfe8ff", "#0a2a4a", "#0a3a3a", "hue-rotate(-120deg) saturate(1.2)", "rain", ["#a0e0ff", "#3ab8ff"]),
 ("carnaval", "Carnaval", "#06080a", "#0c1012", "#141a1e", "#2a3a30", "#4a6a50", "#ffd23a", "#ffe89a", "#b05aff", "#d6a8ff", "#3aff8a", "#2a0a3a", "#0a3a1a", "hue-rotate(40deg) saturate(1.4)", "confetti", ["#ffd23a", "#b05aff", "#3aff8a", "#ff4a6a"]),
 ("saint-valentin", "Saint-Valentin", "#10040a", "#1a0710", "#280a18", "#5a1a34", "#8a2a50", "#ff4a8a", "#ff9ac0", "#ff8a6a", "#ffc0a8", "#ffb8d0", "#4a0a24", "#3a0a14", "hue-rotate(20deg) saturate(1.2)", "hearts", ["#ff4a8a", "#ff9ac0", "#ffffff"]),
 ("floraison", "Floraison", "#0a060c", "#120a14", "#1c1020", "#3a2440", "#6a3a70", "#ffa8d0", "#ffd6ea", "#8ae08a", "#c8ffc8", "#ffe0f0", "#3a1a30", "#0a3a1a", "hue-rotate(30deg) saturate(.9) brightness(1.1)", "petals", ["#ffc0dd", "#ffd6ea", "#ff8ac0"]),
 ("solstice-d-ete", "Solstice d'été", "#100804", "#1a0e06", "#28160a", "#5a3414", "#8a5420", "#ffb020", "#ffd870", "#ff6a2a", "#ffa070", "#ffe060", "#4a2a04", "#3a1004", "hue-rotate(55deg) saturate(1.3)", "embers", ["#ffd870", "#ffb020", "#ff6a2a"]),
 ("moisson", "Moisson", "#0c0804", "#160e06", "#22160a", "#4a3014", "#7a5020", "#e8a03a", "#ffcf80", "#c8582a", "#ee9070", "#f0c060", "#3a2408", "#2a1006", "hue-rotate(60deg) saturate(.9)", "leaves", ["#e8a03a", "#c8582a", "#f0c060", "#9a4a1a"]),
 ("fete-de-la-biere", "Fête de la Bière", "#0c0904", "#161006", "#221a0a", "#4a3a14", "#7a6020", "#f5b82a", "#ffe08a", "#ffffff", "#fff6e0", "#ffd040", "#3a2a06", "#3a3a2a", "hue-rotate(60deg) saturate(1.1) brightness(1.05)", "bubbles", ["#ffe08a", "#f5b82a", "#ffffff"]),
]
css = ["/* ══ 2.7.0 ══ */",
"#open-gacha,#gacha,#hideTg,#exp-json,#exp-csv{display:none!important}",
"#bgimg{position:fixed;inset:0;z-index:0;pointer-events:none;background:linear-gradient(180deg,color-mix(in srgb,var(--s0) 72%,transparent),color-mix(in srgb,var(--s0) 90%,transparent)),url(bg-hex.webp) center/cover no-repeat;opacity:var(--bgo,1)}",
"#bgimg::before{content:'';position:absolute;inset:0;background:url(bg-hex.webp) center/cover no-repeat;filter:var(--bgf,none);opacity:var(--bgi,.42);mix-blend-mode:screen}",
"#sfx{position:fixed;inset:0;z-index:0;pointer-events:none}",
"body[data-theme=parchemin],body[data-theme=clair]{--bgo:0}",
"header,.tools{background:color-mix(in srgb,var(--s0) 82%,transparent)!important;backdrop-filter:blur(6px)}",
"aside{background:color-mix(in srgb,var(--s0) 70%,transparent)}",
".card .desc,.dbody p{white-space:pre-line}",
"/* recherche miroitante */",
".search{position:relative;border-radius:10px;padding:1.5px;background:linear-gradient(110deg,color-mix(in srgb,var(--acc) 35%,transparent),color-mix(in srgb,var(--acc2) 55%,transparent) 40%,#ffffffcc 50%,color-mix(in srgb,var(--acc2) 55%,transparent) 60%,color-mix(in srgb,var(--acc) 35%,transparent));background-size:250% 100%;animation:bqShine 5s linear infinite;box-shadow:0 0 18px color-mix(in srgb,var(--acc) 22%,transparent)}",
"@keyframes bqShine{from{background-position:100% 0}to{background-position:-150% 0}}",
".search input{border:none!important;border-radius:9px!important;background:linear-gradient(180deg,color-mix(in srgb,var(--s1) 92%,#fff 4%),var(--s1))!important;padding:12px 14px 12px 42px!important;font-size:13.5px!important;letter-spacing:.04em}",
".search input:focus{box-shadow:inset 0 0 0 1px var(--acc),0 0 22px color-mix(in srgb,var(--acc) 30%,transparent)!important}",
".search i{filter:drop-shadow(0 0 6px var(--acc))}",
".search .sq{display:none!important}",
".sqbox{display:flex;align-items:center;gap:10px;padding:5px 12px 5px 10px;border-radius:10px;border:1px solid color-mix(in srgb,var(--acc) 45%,var(--line2));background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 12%,var(--s1)),var(--s1));box-shadow:inset 0 1px 0 #ffffff14,0 0 14px color-mix(in srgb,var(--acc) 18%,transparent)}",
".sqbox .l{font-family:var(--f-ui);font-size:8.5px;letter-spacing:.22em;line-height:1.25;color:var(--mute);text-transform:uppercase}",
".sqbox b{font-family:var(--f-title);font-size:20px;color:var(--w);text-shadow:0 0 10px color-mix(in srgb,var(--acc) 60%,transparent);white-space:nowrap}",
".sqbox b small{font-size:12px;color:var(--mute)}",
".sqbox.low{border-color:var(--amber)} .sqbox.low b{color:var(--amber)} .sqbox.out{border-color:var(--red)} .sqbox.out b{color:var(--red)}",
"/* filtres */",
".tools{gap:10px!important;padding:10px 22px!important}",
".tools .sel{border-radius:999px!important;padding:8px 32px 8px 14px!important;font-size:10.5px!important;letter-spacing:.12em;font-weight:700;color:var(--w)!important;border:1px solid color-mix(in srgb,var(--fc,var(--acc)) 55%,var(--line2))!important;background-color:color-mix(in srgb,var(--fc,var(--acc)) 13%,var(--s1))!important;box-shadow:inset 0 1px 0 #ffffff12,0 0 12px color-mix(in srgb,var(--fc,var(--acc)) 16%,transparent);transition:.15s;max-width:200px!important}",
".tools .sel:hover{border-color:var(--fc,var(--acc))!important;box-shadow:0 0 16px color-mix(in srgb,var(--fc,var(--acc)) 40%,transparent)}",
".tools .sel.act{background-color:color-mix(in srgb,var(--fc,var(--acc)) 30%,var(--s1))!important;border-color:var(--fc,var(--acc))!important}",
"#rar{--fc:#c084fc} #elem{--fc:#38bdf8} #world{--fc:#2dd4bf} #epoch{--fc:#f5c518} #stockf{--fc:#4ade80} #sort{--fc:var(--acc2);margin-left:6px}",
".tools .sep{width:1px;height:26px;background:linear-gradient(180deg,transparent,var(--line2),transparent)}",
".view{border-radius:999px!important;border-color:color-mix(in srgb,var(--acc) 45%,var(--line2))!important}",
".view button.on{background:color-mix(in srgb,var(--acc) 30%,var(--s1))!important;color:var(--w)!important}",
".rb{opacity:.7!important} .rb:hover,.rb.on{opacity:1!important;filter:drop-shadow(0 0 6px var(--c))}",
"/* niveau par joueur */",
".shoplv .who{display:block;margin-top:3px;font-family:var(--f-ui);font-size:9px;letter-spacing:.06em;background:var(--s1);color:var(--w);border:1px solid var(--line2);border-radius:5px;padding:2px 22px 2px 6px!important;max-width:150px}",
]
for (k, n, s0, s1, s2, l1, l2, a, al, b, bl, g, g1, g2, bf, fx, cols) in SEASONS:
    css.append(f"body[data-theme=s-{k}]{{--s0:{s0};--s1:{s1};--s2:{s2};--line:{l1};--line2:{l2};--acc:{a};--acc-l:{al};--acc2:{b};--acc2-l:{bl};--gold:{g};--gold-l:{al};--tk0:{s0};--tk1:{s2};--tkline:{l2};--tkc:{al};--bgf:{bf};--glow:radial-gradient(1100px 600px at 15% -10%,{g1} 0%,transparent 60%),radial-gradient(900px 600px at 105% 105%,{g2} 0%,transparent 60%)}}")
    css.append(f"body[data-theme=s-{k}] .brand b{{background:linear-gradient(90deg,{al},#fff 45%,{a} 70%,{b});-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 0 10px {a}88)}}")
CSS = "\n".join(css) + "\n"
i = s.find("</style>"); assert i > 0
s = s[:i] + CSS + s[i:]

# éléments
rep('<div id="app">', '<div id="bgimg"></div><canvas id="sfx"></canvas>\n<div id="app">')
rep('<span class="sq" id="sq" style="display:none"></span></div>', '<span class="sq" id="sq" style="display:none"></span></div>\n  <div class="sqbox" id="sqbox" style="display:none" title="Recherches restantes aujourd\'hui"><span class="l">RECHERCHES<br>DU JOUR</span><b id="sqn">—</b></div>')
rep('<div class="l">NIVEAU<br>BOUTIQUE<b id="lvName">—</b></div>', '<div class="l">NIVEAU<br>BOUTIQUE<b id="lvName">—</b><select class="who" id="lvWho" style="display:none" title="Joueur dont on règle le niveau"></select></div>')

# thème : saison
rep("const m=DB.meta; document.body.dataset.theme=m.theme||'neon'; if(!window.__hideInit){ window.__hideInit=true; if(m.hideDefault){ F.hide=true; const ht=$('#hideTg'); ht.classList.add('on'); ht.querySelector('span').textContent='MASQUÉS'; } }",
    "const m=DB.meta; applyTheme();")
rep("function closeModal(){ M.classList.remove('on'); M.innerHTML=''; if(document.body.dataset.theme!==(DB.meta.theme||'neon')){ document.body.dataset.theme=DB.meta.theme||'neon'; BQ.repaint(); } }",
    "function closeModal(){ M.classList.remove('on'); M.innerHTML=''; if(document.body.dataset.theme!==themeFor()){ applyTheme(); BQ.repaint(); } }")
rep("F.season=s||''; $('#seasonSel').value=F.season; $('#season').classList.toggle('on',!!F.season); buildTree(); render(); }",
    "F.season=s||''; $('#seasonSel').value=F.season; $('#season').classList.toggle('on',!!F.season); applyTheme(); buildTree(); render(); }")

# niveau par joueur
rep("parent.postMessage({type:'bq-setlv',shopLv:n}", "parent.postMessage({type:'bq-setlv',shopLv:n,user:($('#lvWho')&&$('#lvWho').value)||''}")
rep("if(m.shopLv) F.shopLv=Math.max(1,m.shopLv);", "if(m.shopLv) F.shopLv=Math.max(1,m.shopLv); if(m.players) setPlayers(m.players,m.defaultLv);")
rep("if(!IS_GM){ $('#lvUp').style.display='none'; $('#lvDn').style.display='none'; $('#seasonSel').disabled=true; F.hide=true;",
    "F.hide=!IS_GM; if(!IS_GM){ $('#lvUp').style.display='none'; $('#lvDn').style.display='none'; $('#seasonSel').disabled=true; F.hide=true;")

# quota de recherche : encadré
rep("function setSQ(s){ if(!s||!s.enabled||IS_GM){ SQ.on=false;", "function setSQ(s){ sqBox(s); if(!s||!s.enabled||IS_GM){ SQ.on=false;")

# roulette retirée de la configuration ; DA saisonnières
rep("['levels','Niveaux'],['gacha','Roulette'],['ticker','Bulletins']]", "['levels','Niveaux'],['seasonda','DA saisonnières'],['ticker','Bulletins']]")
rep("    gacha:()=>'<div class=\"frm\">'", "    seasonda:()=>seasonDABody(W),\n    gacha:()=>'<div class=\"frm\">'")
rep("} else if(tab==='gacha'){", "} else if(tab==='seasonda'){ W.meta.seasonDA=v('sd-on'); W.meta.seasonFx=v('sd-fx'); W.meta.seasonThemes={}; M.querySelectorAll('[data-sdk]').forEach(x=>{ W.meta.seasonThemes[x.dataset.sdk]=x.value; }); } else if(tab==='gacha'){")
rep("fld('Monnaie (symbole ou mot)',inp('m-cur',W.meta.cur,'G'),'c4','affiché après chaque prix : 120 G, 50 Cr, 3 po…')+'</div>",
    "fld('Monnaie (symbole ou mot)',inp('m-cur',W.meta.cur,'G'),'c4','affiché après chaque prix : 120 G, 50 Cr, 3 po…')+'</div><div class=\"msec\">EXPORTER LES ENTRÉES AFFICHÉES</div><div class=\"rowi\" style=\"gap:8px\"><button class=\"mbtn\" onclick=\"document.getElementById(\\'exp-json\\').onclick()\">'+svgIcon('download')+' JSON</button><button class=\"mbtn\" onclick=\"document.getElementById(\\'exp-csv\\').onclick()\">'+svgIcon('download')+' CSV</button><span class=\"hint\" style=\"color:var(--mute);font-size:12px\">selon les filtres en cours ; la sauvegarde complète est dans DONNÉES</span></div>")
rep("const THEMES=[['neon','Néon — fenêtre système (défaut)'],['royal','Royal — velours & or'],['terminal','Terminal — phosphore vert'],['parchemin','Parchemin — fantasy clair'],['clair','Clair — moderne épuré']];",
    "const THEMES=[['neon','Néon — fenêtre système (défaut)'],['royal','Royal — velours & or'],['terminal','Terminal — phosphore vert'],['parchemin','Parchemin — fantasy clair'],['clair','Clair — moderne épuré'],...SEASON_DA.map(x=>['s-'+x[0],'Saison — '+x[1]])];")

import json
SDJS = json.dumps([[k, n, fx, cols] for (k, n, *_r, fx, cols) in [(x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], x[8], x[9], x[10], x[11], x[12], x[13], x[14], x[15], x[16]) for x in SEASONS]], ensure_ascii=False)
JS = r"""
/* ══ 2.7.0 : DA saisonnières, effets, fond, quota, niveau par joueur ══ */
const SEASON_DA=__SD__;
const sdNorm=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function seasonKey(name){ const k=sdNorm(name); return SEASON_DA.some(x=>x[0]===k)?'s-'+k:null; }
function themeFor(){ const m=DB.meta||{}; if(m.seasonDA!==false&&F.season){ const t=(m.seasonThemes||{})[F.season]; if(t) return t; const k=seasonKey(F.season); if(k) return k; } return m.theme||'neon'; }
function applyTheme(){ const t=themeFor(); document.body.dataset.theme=t; const sd=SEASON_DA.find(x=>'s-'+x[0]===t); FX.set((DB.meta||{}).seasonFx===false?null:(sd?sd[2]:null), sd?sd[3]:null); }
function seasonDABody(W){ const seasons=[...new Set([...(W.seasons||[]).map(x=>x.name||x),...SEASON_DA.map(x=>x[1])])]; const opts=cur=>'<option value="">Automatique (DA de la saison)</option>'+THEMES.map(t=>'<option value="'+t[0]+'"'+(cur===t[0]?' selected':'')+'>'+esc(t[1])+'</option>').join('');
  return '<div class="frm">'+fld('DA selon la saison','<div class="rowi"><input type="checkbox" id="sd-on"'+(W.meta.seasonDA!==false?' checked':'')+'><span class="hint">quand une saison est active, la boutique prend sa DA</span></div>','c6')+fld('Effets animés','<div class="rowi"><input type="checkbox" id="sd-fx"'+(W.meta.seasonFx!==false?' checked':'')+'><span class="hint">neige, pétales, lanternes, bulles…</span></div>','c6')+'</div><div class="msec">DA PAR SAISON</div><div class="lst">'+seasons.map(n=>'<div class="lrow" style="grid-template-columns:1fr 1fr"><b style="font-family:var(--f-ui);font-size:12px;letter-spacing:.06em">'+esc(n)+'</b><select data-sdk="'+esc(n)+'">'+opts(((W.meta.seasonThemes||{})[n])||'')+'</select></div>').join('')+'</div><div class="mnote" style="margin-top:10px">Chaque saison a sa propre DA (couleurs, fond teinté, effet animé). Vous pouvez en imposer une autre, y compris un thème classique. La saison active se choisit en haut de la boutique.</div>'; }
const FX=(function(){ const cv=document.getElementById('sfx'); const ctx=cv.getContext('2d'); let type=null, cols=['#fff'], P=[], raf=0, W=0, H=0, last=0; const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size(){ W=cv.width=innerWidth; H=cv.height=innerHeight; } addEventListener('resize',size); size();
  const R=(a,b)=>a+Math.random()*(b-a), C=()=>cols[(Math.random()*cols.length)|0];
  function mk(init){ const p={x:R(0,W),y:init?R(0,H):-20,c:C(),r:R(2,5),a:R(0,6.28),va:R(-.03,.03),vx:R(-.3,.3),vy:R(.4,1.2),o:R(.35,.9),t:R(0,100)};
    switch(type){ case 'embers': case 'lanterns': case 'bubbles': case 'lights': p.y=init?R(0,H):H+20; p.vy=-R(.25,type==='bubbles'?1.1:.6); if(type==='lanterns'){p.r=R(5,10);} if(type==='lights'){p.r=R(2,4);} if(type==='bubbles'){p.r=R(2,7);} break;
      case 'rain': p.vy=R(6,11); p.vx=-1.2; p.r=R(10,20); p.o=R(.2,.5); break; case 'snow': p.vy=R(.3,1); p.r=R(1,3.5); break; case 'hearts': p.y=init?R(0,H):H+20; p.vy=-R(.3,.8); p.r=R(5,9); break;
      case 'sparks': p.x=R(W*.1,W*.9); p.y=R(H*.1,H*.5); p.life=R(40,80); p.vx=R(-2,2); p.vy=R(-2,2); p.r=R(1,2.2); break; case 'dust': p.r=R(30,90); p.o=R(.04,.1); p.vy=R(-.15,.15); p.vx=R(-.25,.25); p.y=R(0,H); break; }
    return p; }
  function set(t,c){ type=RM?null:t; if(c) cols=c; P=[]; if(!type){ ctx.clearRect(0,0,W,H); cancelAnimationFrame(raf); raf=0; return; } const n={snow:90,petals:40,leaves:30,embers:50,lanterns:16,bubbles:40,lights:40,confetti:60,hearts:20,rain:110,sparks:0,dust:14}[type]||40; for(let i=0;i<n;i++) P.push(mk(true)); if(!raf) raf=requestAnimationFrame(step); }
  function draw(p){ ctx.globalAlpha=p.o; ctx.fillStyle=p.c; ctx.strokeStyle=p.c;
    switch(type){ case 'snow': case 'bubbles': if(type==='bubbles'){ ctx.lineWidth=1; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.28); ctx.stroke(); } else { ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.28); ctx.fill(); } break;
      case 'embers': case 'lights': { const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4); g.addColorStop(0,p.c); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*4,0,6.28); ctx.fill(); break; }
      case 'lanterns': { ctx.save(); ctx.translate(p.x,p.y); const g=ctx.createRadialGradient(0,0,0,0,0,p.r*3); g.addColorStop(0,p.c); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,p.r*3,0,6.28); ctx.fill(); ctx.fillStyle=p.c; ctx.globalAlpha=Math.min(1,p.o+.2); ctx.beginPath(); ctx.ellipse(0,0,p.r*.8,p.r,0,0,6.28); ctx.fill(); ctx.restore(); break; }
      case 'petals': case 'leaves': case 'confetti': ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.a); if(type==='confetti') ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r); else { ctx.beginPath(); ctx.ellipse(0,0,p.r*(type==='leaves'?1.6:1.3),p.r*.7,0,0,6.28); ctx.fill(); } ctx.restore(); break;
      case 'hearts': ctx.save(); ctx.translate(p.x,p.y); ctx.scale(p.r/10,p.r/10); ctx.beginPath(); ctx.moveTo(0,4); ctx.bezierCurveTo(-10,-4,-6,-12,0,-6); ctx.bezierCurveTo(6,-12,10,-4,0,4); ctx.fill(); ctx.restore(); break;
      case 'rain': ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+p.vx*2,p.y+p.r); ctx.stroke(); break;
      case 'sparks': ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.28); ctx.fill(); break;
      case 'dust': { const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r); g.addColorStop(0,p.c); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.28); ctx.fill(); break; } } }
  function step(ts){ raf=requestAnimationFrame(step); if(document.hidden||ts-last<33) return; last=ts; ctx.clearRect(0,0,W,H);
    if(type==='sparks'&&Math.random()<.04){ const cx=R(W*.15,W*.85), cy=R(H*.1,H*.45), c=C(); for(let i=0;i<34;i++){ const a=i/34*6.28, v=R(1.2,2.6); P.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:R(1,2),c,o:1,life:R(45,70),a:0,va:0,t:0}); } }
    for(let i=P.length-1;i>=0;i--){ const p=P[i]; p.t++; p.a+=p.va;
      if(type==='sparks'){ p.x+=p.vx; p.y+=p.vy; p.vy+=.03; p.vx*=.985; p.life--; p.o=Math.max(0,p.life/60); if(p.life<=0){ P.splice(i,1); continue; } }
      else { p.x+=p.vx+(type==='snow'||type==='petals'||type==='leaves'?Math.sin(p.t/40)*.4:0); p.y+=p.vy; if(type==='lights'||type==='embers') p.o=.4+.4*Math.sin(p.t/20); if(p.y>H+30||p.y<-30||p.x<-100||p.x>W+100) P[i]=mk(false); }
      draw(p); } ctx.globalAlpha=1; }
  return {set}; })();
function sqBox(s){ const b=$('#sqbox'); if(!b) return; if(!s||!s.enabled){ b.style.display='none'; return; } b.style.display=''; if(IS_GM){ b.className='sqbox'; $('#sqn').innerHTML=(s.quota??'—')+'<small> / jour</small>'; b.title='Chaque joueur dispose de '+(s.quota??'—')+' recherche(s) par jour. Le MJ n\'est pas limité.'; return; } const r=s.remaining??0, q=s.quota??0; $('#sqn').innerHTML=r+'<small> / '+q+'</small>'; b.className='sqbox'+(r<=0?' out':r<=1?' low':''); b.title='Recherches restantes aujourd\'hui : '+r+' sur '+q; }
function setPlayers(list,def){ const s=$('#lvWho'); if(!s) return; const cur=s.value; s.innerHTML='<option value="">Par défaut · niv. '+(def||1)+'</option>'+list.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' · niv. '+(p.lv||def||1)+'</option>').join(''); s.style.display=list.length?'':'none'; if([...s.options].some(o=>o.value===cur)) s.value=cur; s.onchange=()=>{ const p=list.find(x=>x.id===s.value); F.shopLv=Math.max(1,(p&&p.lv)||def||1); setLvUI(); buildTree(); render(); }; s.onchange(); }
""".replace("__SD__", SDJS)
# insérer le JS avant le pont Foundry (fonctions utilisées par applyConfig)
k = s.find("/* ───────── pont Foundry ───────── */"); assert k > 0
s = s[:k] + JS + "\n" + s[k:]
open(P, "w", encoding="utf-8").write(s)
print("ok")
