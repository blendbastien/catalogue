# Catalogue 2.8.0 — DA système / jeu vidéo : boutons HUD, recherche, compteurs, saison, filtres sans retour à la ligne,
# contours néon (cartes + détail), animations haut rang / haute rareté, bannières de rang, lignes lumineuses du fond,
# opacités réglables (fenêtre de détail, bannière), boutons MJ verrouillés.
import sys, os
P = sys.argv[1]; s = open(P, encoding="utf-8").read()
if "/* ══ 2.8.0" in s: print("déjà appliqué"); sys.exit(0)
def rep(a, b, n=1):
    global s
    c = s.count(a); assert c == n, (a[:100], c); s = s.replace(a, b)

css = open(os.path.join(os.path.dirname(__file__), "patch_28.css"), encoding="utf-8").read()
rep("</style>", css + "</style>")

# ── HTML ──
rep('<div id="bgimg"></div><canvas id="sfx"></canvas>', '<div id="bgimg"></div><canvas id="hexfx"></canvas><canvas id="sfx"></canvas>')
rep('<div class="search"><i id="qIco"></i><input id="q" type="text" placeholder="Rechercher…  ( / )" autocomplete="off">',
    '<div class="search"><i id="qIco"></i><input id="q" type="text" placeholder="Rechercher…  ( / )" autocomplete="off"><kbd class="skey" id="qKey">/</kbd><span class="sscan"></span>')
rep('<span class="gmzone" id="gmzone">', '<span class="gmzone hidden" id="gmzone">')

# ── recherche : touche affichée ──
rep("function setSQ(s){ sqBox(s);", "function setSQ(s){ sqBox(s); const qk=$('#qKey'); if(qk) qk.textContent=(s&&s.enabled&&!IS_GM)?'ENTRÉE':'/';")

# ── niveaux d'objets : rang / rareté ──
rep("function cardHTML(e,cls){ const lk=locked(e); const T=TYPES[e.t]; return '<div class=\"card'+(F.sel===e.id?' on':'')",
    "function tierOf(e){ let c=''; const n=RANGS.length, i=RANGS.indexOf(e.rang); if(n>=4&&i>=0){ const t=n-1-i; if(t<3) c+=' hr'+(3-t); } const m=RARS.length, j=RARS.indexOf(e.rar); if(m>=5&&j>=0){ const p=j/(m-1); c+=p>=.9?' rq3':p>=.66?' rq2':p>=.5?' rq1':''; } return c; }\n"
    "function fxHTML(c){ return c?'<i class=\"fx\"></i>'+(/hr3|rq3/.test(c)?'<i class=\"fxb\"></i>':''):''; }\n"
    "function fxDelay(id){ let h=0; for(const ch of String(id)) h=(h*31+ch.charCodeAt(0))|0; return '--fxdl:-'+(Math.abs(h)%70/10)+'s;'; }\n"
    "function cardHTML(e,cls){ const lk=locked(e); const T=TYPES[e.t]; const tc=lk?'':tierOf(e); return '<div class=\"card'+tc+(F.sel===e.id?' on':'')")
rep("'\" data-id=\"'+esc(e.id)+'\" style=\"'+styleVars(e)+'\"><div class=\"rban\">",
    "'\" data-id=\"'+esc(e.id)+'\" style=\"'+styleVars(e)+(tc?fxDelay(e.id):'')+'\">'+fxHTML(tc)+'<div class=\"rban\">")
rep("d.innerHTML='<div class=\"dwin\" style=\"'+styleVars(e)+'\">",
    "const dt=tierOf(e); d.innerHTML='<div class=\"dwin'+dt+'\" style=\"'+styleVars(e)+'\">'+(/hr3|rq3/.test(dt)?'<i class=\"fxb\"></i>':'')+'")

# ── bannières de rang ──
rep("h.innerHTML=badge(e.rang)+'RANG '+esc(e.rang)+'<small>'+n+' ENTRÉE'+(n>1?'S':'')+'</small>';",
    "h.innerHTML='<div class=\"rbn\">'+badge(e.rang)+'<span class=\"rt\">RANG '+esc(e.rang)+'</span><small>'+n+' ENTRÉE'+(n>1?'S':'')+'</small><i class=\"sh\"></i></div>';")

# ── thème : socle néon, animations, lignes du fond ──
rep("FX.set((DB.meta||{}).seasonFx===false?null:(sd?sd[2]:null), sd?sd[3]:null); }",
    "FX.set((DB.meta||{}).seasonFx===false?null:(sd?sd[2]:null), sd?sd[3]:null); const neo=!/^(parchemin|clair)$/.test(t); document.body.classList.toggle('neo',neo); document.body.classList.toggle('nofx',(DB.meta||{}).tierFx===false); HEX.set(neo&&(DB.meta||{}).hexFx!==false); }")
rep("<span class=\"hint\">neige, pétales, lanternes, bulles…</span></div>','c6')+",
    "<span class=\"hint\">neige, pétales, lanternes, bulles…</span></div>','c6')+fld('Lignes lumineuses du fond','<div class=\"rowi\"><input type=\"checkbox\" id=\"sd-hex\"'+(W.meta.hexFx!==false?' checked':'')+'><span class=\"hint\">traits de lumière qui courent entre les hexagones</span></div>','c6')+fld('Animation des objets d\\'exception','<div class=\"rowi\"><input type=\"checkbox\" id=\"sd-tier\"'+(W.meta.tierFx!==false?' checked':'')+'><span class=\"hint\">reflets et halos des hauts rangs et hautes raretés</span></div>','c6')+")
rep("W.meta.seasonFx=v('sd-fx');", "W.meta.seasonFx=v('sd-fx'); W.meta.hexFx=v('sd-hex'); W.meta.tierFx=v('sd-tier');")

HEXJS = r"""
/* ══ 2.8.0 : lignes lumineuses entre les hexagones du fond (grille relevée sur bg-hex.webp : hexagones à sommet plat, R 49 px) ══ */
const HEX=(function(){ const cv=document.getElementById('hexfx'); if(!cv) return {set(){}}; const ctx=cv.getContext('2d');
  const IW=1600, IH=900, DX=73.5, DY=85, OX=18.5, OY=60, R=49, GX=16, GY=9, D2R=Math.PI/180;
  const CM='__CM__'; const COL=[], COLL=[]; for(let i=0;i<GX*GY;i++){ const h=CM.substr(i*6,6); COL.push('#'+h); const v=[0,2,4].map(k=>parseInt(h.substr(k,2),16)); COLL.push('rgb('+v.map(x=>Math.round(x+(255-x)*.45)).join(',')+')'); }
  const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  let on=false, raf=0, last=0, W=0, H=0, sc=1, x0=0, y0=0, P=[];
  function size(){ W=cv.width=innerWidth; H=cv.height=innerHeight; sc=Math.max(W/IW,H/IH); x0=(W-IW*sc)/2; y0=(H-IH*sc)/2; }
  addEventListener('resize',()=>{ if(on) size(); });
  const ci=(x,y)=>Math.max(0,Math.min(GY-1,(y/IH*GY)|0))*GX+Math.max(0,Math.min(GX-1,(x/IW*GX)|0));
  const rnd=(a,b)=>a+Math.random()*(b-a);
  function spawn(){ const vx0=Math.max(0,-x0/sc), vx1=Math.min(IW,(W-x0)/sc), vy0=Math.max(0,-y0/sc), vy1=Math.min(IH,(H-y0)/sc);
    const tx=rnd(vx0,vx1), ty=rnd(vy0,vy1); const c=Math.round((tx-OX)/DX), cy0=OY+(c&1?DY/2:0), r=Math.round((ty-cy0)/DY);
    const cx=OX+c*DX, cy=cy0+r*DY, k=(Math.random()*6)|0; const x=cx+R*Math.cos(60*k*D2R), y=cy+R*Math.sin(60*k*D2R);
    return {x,y,a:60*k+[0,120,240][(Math.random()*3)|0],t:0,sp:rnd(95,165),tr:[],age:0,life:rnd(5,12)}; }
  function stepP(p,dt){ p.age+=dt; p.t+=p.sp*dt; while(p.t>=R){ p.x+=R*Math.cos(p.a*D2R); p.y+=R*Math.sin(p.a*D2R); p.tr.unshift([p.x,p.y]); if(p.tr.length>4) p.tr.pop(); p.t-=R; p.a+=Math.random()<.5?60:-60; } }
  function draw(p){ const hx=p.x+p.t*Math.cos(p.a*D2R), hy=p.y+p.t*Math.sin(p.a*D2R); if(hx<-60||hy<-60||hx>IW+60||hy>IH+60){ p.age=p.life; return; }
    const fade=Math.min(1,p.age/.7,(p.life-p.age)/1.2); if(fade<=0) return; const i=ci(hx,hy), L=R*2.4;
    const pts=[[hx,hy],[p.x,p.y],...p.tr]; let acc=0;
    for(let k=0;k<pts.length-1&&acc<L;k++){ const a=pts[k], b=pts[k+1]; const len=Math.hypot(b[0]-a[0],b[1]-a[1])||1; const take=Math.min(len,L-acc); const ex=a[0]+(b[0]-a[0])*take/len, ey=a[1]+(b[1]-a[1])*take/len;
      const al0=1-acc/L, al1=1-(acc+take)/L; acc+=take; const X0=x0+a[0]*sc, Y0=y0+a[1]*sc, X1=x0+ex*sc, Y1=y0+ey*sc;
      ctx.strokeStyle=COL[i]; ctx.globalAlpha=fade*al0*.22; ctx.lineWidth=7*sc; ctx.beginPath(); ctx.moveTo(X0,Y0); ctx.lineTo(X1,Y1); ctx.stroke();
      ctx.strokeStyle=COLL[i]; ctx.globalAlpha=fade*(al0+al1)/2*.95; ctx.lineWidth=1.8*sc; ctx.beginPath(); ctx.moveTo(X0,Y0); ctx.lineTo(X1,Y1); ctx.stroke(); }
    const X=x0+hx*sc, Y=y0+hy*sc, rg=ctx.createRadialGradient(X,Y,0,X,Y,10*sc); rg.addColorStop(0,'#ffffff'); rg.addColorStop(.3,COL[i]); rg.addColorStop(1,'transparent'); ctx.globalAlpha=fade; ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(X,Y,10*sc,0,6.2832); ctx.fill(); }
  function step(ts){ raf=requestAnimationFrame(step); if(document.hidden||ts-last<33) return; const dt=Math.min(.1,(ts-(last||ts))/1000)||.033; last=ts;
    ctx.globalAlpha=1; ctx.clearRect(0,0,W,H); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
    for(let k=0;k<P.length;k++){ const p=P[k]; stepP(p,dt); if(p.age>=p.life){ P[k]=spawn(); continue; } draw(p); }
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1; }
  function set(v){ v=!!v&&!RM; if(v===on) return; on=v; if(!on){ cancelAnimationFrame(raf); raf=0; P=[]; ctx.clearRect(0,0,W,H); cv.style.display='none'; return; }
    cv.style.display=''; size(); const n=Math.round(Math.min(26,9+(W*H)/(IW*IH)*9)); P=[]; for(let k=0;k<n;k++){ const p=spawn(); p.age=rnd(0,p.life*.8); P.push(p); } last=0; raf=requestAnimationFrame(step); }
  return {set}; })();
"""
CM = open(os.path.join(os.path.dirname(__file__), "hexcolors.txt")).read().strip()
assert len(CM) == 16*9*6
rep("\n/* ══ 2.7.0 : DA saisonnières, effets, fond, quota, niveau par joueur ══ */", HEXJS.replace("__CM__", CM) + "\n/* ══ 2.7.0 : DA saisonnières, effets, fond, quota, niveau par joueur ══ */")

# ── opacités (paramètres du module) ──
rep("if(m.search!==undefined) setSQ(m.search); window.BQ_FROM_PARENT=true;",
    "if(m.search!==undefined) setSQ(m.search); if(m.ui) applyUI(m.ui); window.BQ_FROM_PARENT=true;")
rep("/* ───────── pont Foundry ───────── */",
    "function applyUI(u){ const r=document.documentElement.style; if(u.detail!=null) r.setProperty('--op-detail',Math.max(0,Math.min(100,+u.detail))+'%'); if(u.banner!=null) r.setProperty('--op-banner',Math.max(0,Math.min(100,+u.banner))+'%'); }\n/* ───────── pont Foundry ───────── */")

# ── boutons MJ : réservés au MJ, même en appel direct ──
rep("function openConfig(tab){ tab=tab||'gen';", "function openConfig(tab){ if(!CAN_EDIT) return; tab=tab||'gen';")
rep("function openData(){ const n=DB.items.length", "function openData(){ if(!CAN_EDIT) return; const n=DB.items.length")
rep("$('#sqBtn').onclick=()=>parent.postMessage({type:'bq-searchadmin'},'*');", "$('#sqBtn').onclick=()=>{ if(IS_GM) parent.postMessage({type:'bq-searchadmin'},'*'); };")
rep("} else { DB=loadLocal(); }", "} else { $('#gmzone').classList.remove('hidden'); DB=loadLocal(); }")

open(P, "w", encoding="utf-8").write(s); print("2.8.0 appliqué")
