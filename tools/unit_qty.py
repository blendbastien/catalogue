# Catalogue 2.6.0 — vente à l'unité : les lots (×N), boîtes, paquets et grandes quantités de nourriture / consommables
# passent à 1 unité (ou une portion / une journée), prix divisé d'autant (minimum 1 G). Relançable : n'agit que sur les noms d'origine.
import json, re, sys
P = sys.argv[1]; d = json.load(open(P, encoding="utf-8")); items = {x["id"]: x for x in d["items"]}
KEEP = {"IT-9418", "IT-9430", "IT-9864", "WP-0534", "WP-0593", "CP-0158"}   # paires / jeux / ensembles qui n'ont de sens qu'entiers
PREP = {"de", "d'", "du", "des", "en", "à", "au", "aux", "pour"}
IRR = {"carreaux": "carreau", "cristaux": "cristal", "chirurgicaux": "chirurgical", "couteaux": "couteau", "sceaux": "sceau", "javelots": "javelot", "os": "os", "obus": "obus", "vis": "vis"}
def sing_word(w):
  lw = w.lower()
  if lw in IRR: r = IRR[lw]
  elif lw.endswith("eaux"): r = lw[:-1]
  elif lw.endswith("s") and len(lw) > 3: r = lw[:-1]
  else: return w
  return r[0].upper() + r[1:] if w[0].isupper() else r
def singular(name):
  out = []; stop = False
  for tok in name.split(" "):
    if stop or tok.lower() in PREP or tok.lower().startswith("d'") or not tok[:1].isalpha(): stop = True; out.append(tok); continue
    out.append(sing_word(tok))
  return " ".join(out)
NAME = {  # noms à l'unité écrits à la main quand la règle ne suffit pas
  "IT-9243": "Rouleau de papier toilette", "IT-9248": "Mouchoir", "IT-9350": "Couvert de porcelaine", "IT-9479": "Pièce de Celestia",
  "IT-9595": "Gant en latex", "IT-9942": "Vis et écrou", "IT-9970": "Tôle ondulée", "IT-10212": "Bandelette de papier pH",
  "IT-10930": "Cellule à fusion portable", "IT-10924": "Cellule d'énergie basse", "IT-10929": "Cellule à plasma haute densité",
  "IT-11158": "Crédit d'Inertia", "IT-11159": "Jeton du Grand Bazar", "IT-10986": "Os de squelette", "IT-11143": "Écaille de wyverne",
  "WP-0532": "Carte tranchante", "WP-0533": "Carte de feu", "IT-9069": "Cellule d'énergie", "WP-0706": "Obus de 155 mm",
  "IT-0036": "Cartouche de poing", "IT-10941": "Pierre de fronde enchantée", "IT-0037": "Cartouche de fusil", "WP-0702": "Grenade à fragmentation", "WP-0703": "Grenade fumigène",
}
DESC = {  # descriptions remises au singulier
  "WP-0032": "Lame équilibrée, se range dans un étui de cuir.", "IT-0034": "Fût de bois, pointe de fer.", "IT-0035": "Carreau d'arbalète.",
  "IT-0039": "Flèche à pointe de mana.", "WP-0079": "Enflamme la cible.", "WP-0080": "Efficace contre les créatures de la nuit.",
  "WP-0081": "Chargée de mana, traverse les boucliers magiques.", "WP-0084": "Pointe de lumière solide, +50 % contre les ombres.",
  "WP-0105": "Papier runique explosant à l'impact.", "WP-0106": "Gèle la surface touchée.", "WP-0110": "Dague qui revient à la main après le lancer.",
  "IT-9066": "Bois, pointe acier.", "IT-9067": "Explose à l'impact.", "IT-9243": "Un rouleau.", "IT-9248": "En tissu jetable.",
  "IT-9350": "Assiette, verre et couverts en porcelaine pour une personne.", "IT-9479": "Pièce royale, échangeable à Celestia.",
  "IT-9595": "Gant jetable pour soigner sans contaminer la plaie ni se salir.", "IT-9596": "Masque jetable : limite la transmission des maladies et protège de la poussière légère.",
  "IT-9598": "Protection contre les maladies et les grossesses.", "IT-9781": "Feutre jaune.", "IT-9830": "Un crayon de bois.", "IT-9883": "Verre.",
  "IT-10083": "À gonfler.", "IT-10212": "Mesure l'acidité d'un liquide.", "IT-10887": "Pointe d'acier trempé, fût de frêne.",
  "IT-10888": "Pointe barbelée, blessures saignantes.", "IT-10889": "S'enflamme à l'impact.", "IT-10890": "Perce 5 mm d'acier.",
  "IT-10891": "Gèle la cible 2 s.", "IT-10893": "Perce toute armure de rang C.", "IT-10894": "Invisible en vol.", "IT-10896": "Perce toute armure de rang A.",
  "IT-10898": "Carreau d'acier standard.", "IT-10899": "Carreau pour arbalète de siège.", "IT-10900": "Perce 8 mm d'acier.", "IT-10901": "Explose à l'impact, 3 m.",
  "IT-10903": "Perce toute armure de rang C.", "IT-10905": "Indestructible, perce tout blindage de rang A.", "IT-10906": "Munition de pistolet standard.",
  "IT-10911": "Munition de fusil d'assaut.", "IT-10912": "Munition de fusil de combat.", "IT-10914": "Munition de tireur d'élite, 1 500 m.",
  "IT-10915": "Anti-matériel, perce 2 cm d'acier.", "IT-10916": "S'enflamme à l'impact.", "IT-10919": "Fragmente la pierre ; +100 % dégâts contre les golems.",
  "IT-10920": "Perce toute armure de rang C.", "IT-10923": "Perce tout blindage connu.", "IT-10924": "Pour armes à énergie de rang E, 20 tirs.",
  "IT-10926": "Pour armes à plasma, 30 tirs.", "IT-10927": "Pour armes magitech, 50 tirs.", "IT-10929": "Pour armes à plasma lourdes, 50 tirs.",
  "IT-10930": "Alimente une arme lourde 1 000 tirs.", "IT-10932": "Obus explosif de 81 mm.", "IT-10933": "Obus de canon, 20 m de rayon.",
  "IT-10934": "Perce 60 cm de blindage.", "IT-10937": "Fait fondre 1 m de blindage.", "IT-10940": "Recharge de baguette de rang E.",
  "IT-10941": "Explose en lumière à l'impact.", "IT-10942": "Projectile de mana condensé.", "IT-10943": "Projectile gravé, effet élémentaire aléatoire.",
  "IT-10944": "Charge une arme d'un sort de rang C.", "IT-10946": "Traverse les murs.", "IT-10947": "Chargée par la constellation sponsor.",
  "IT-10986": "Ossement animé, inerte.", "IT-11143": "Écaille de 10 cm.", "IT-11298": "Soldat de plomb qui se bat seul.",
  "WP-0350": "Galet calibré de 40 g.", "WP-0351": "Fer de 500 g, manche court 35 cm.", "WP-0352": "Shuriken à 4 branches, acier, 8 cm.",
  "WP-0353": "Lame de 22 cm, acier trempé, équilibrée.", "WP-0354": "Disque de 12 cm en alliage ; revient au lanceur après 3 s.",
  "WP-0355": "Dague de mithril ; se téléporte dans la main après impact.", "WP-0370": "Hampe de 190 cm, pointe en acier, 700 g.",
  "WP-0371": "Pointe en acier trempé, portée 60 m.", "WP-0512": "Bande de papier encrée ; réduit de 5 % le coût du prochain sort.",
  "WP-0517": "Lame d'énergie de 20 cm ; se dissipe 10 s après le lancer.", "WP-0518": "Plume durcie ; revient au lanceur, 80 dégâts.",
  "WP-0519": "Lame de glace indestructible ; gèle 1 s au contact.", "WP-0520": "Lame nommée ; orbite autour du porteur et frappe seule.",
  "WP-0522": "Bille de 3 cm ; explosion de 1 m, 60 dégâts de feu.", "WP-0523": "Orbe de 5 cm ; nuage de brume de 8 m pendant 10 s.",
  "WP-0524": "Orbe ; le sol devient sable mouvant sur 5 m durant 6 s.", "WP-0527": "Papier scellé ; éclaire 20 m et aveugle 1 s.",
  "WP-0528": "Papier scellé ; éclair de 300 dégâts à l'impact.", "WP-0529": "Papier scellé ; racines immobilisant la cible 3 s.",
  "WP-0532": "Carte à bords d'acier ; 15 dégâts.", "WP-0533": "Carte enchantée ; s'enflamme en vol, 120 dégâts.",
  "WP-0683": "Cartouche 9 mm, ogive plomb.", "WP-0684": "Cartouche 7,62 mm.", "WP-0685": "Cartouche, 9 plombs de 8 mm.",
  "WP-0687": "Ralentit la cible de 20 % pendant 3 s.", "WP-0688": "Traverse 30 cm d'acier ; +30 % dégâts contre les golems.",
  "WP-0689": "Balle invisible et silencieuse ; ignore les boucliers magiques.", "WP-0691": "Fût en bois, pointe en fer, empennage plume.",
  "WP-0692": "Fût en carbone, pointe acier, +10 % portée.", "WP-0693": "Pointe en acier trempé effilée ; ignore 20 % de l'armure.",
  "WP-0694": "Émet un sifflement ; ralliement des alliés sur 200 m.", "WP-0696": "Attire les ennemis sur 4 m pendant 2 s.",
  "WP-0698": "Fût en bois, pointe en acier.", "IT-9880": "Bouton de couture.", "IT-9942": "Acier.", "IT-10082": "Coloré.", "VH-0117": "Standard.", "VH-0427": "Acier forgé, pose non incluse.",
}
# lots sans « (×N) » dans le nom + nourriture, boissons, soins, composants, carburants vendus en vrac : (nouveau nom, diviseur, nouvelle description)
MANUAL = {
  "IT-0120": ("Analgésique (comprimé)", 20, "Comprimé contre la douleur modérée. Un comprimé toutes les 6 heures."),
  "IT-0121": ("Antibiotique (dose du jour)", 7, "Dose d'une journée d'un traitement contre l'infection. Il en faut 7 jours de suite."),
  "IT-9606": ("Antibiotique (dose du jour)", 7, "Dose d'une journée d'une cure d'antibiotiques contre une infection déclarée (plaie infectée, fièvre persistante). Il en faut 7 jours de suite."),
  "IT-0196": ("Herbe médicinale", 10, "Une plante séchée."),
  "IT-9581": ("Désinfectant (dose)", 10, "Dose pour nettoyer une plaie avant de la panser. Pique un peu, empêche l'infection."),
  "IT-9584": ("Sirop contre la toux (cuillère)", 20, "Une cuillère calme la toux pour quelques heures."),
  "AR-0078": ("Sous-vêtement en coton", 3, "Une pièce."), "AR-0140": ("Body", 3, "Coton."),
  "IT-10684": ("Coffre de butin F", 10, "Un coffre de butin de rang F."),
  "IT-10973": ("Cigarette", 20, "Une cigarette."), "IT-11499": ("Mochi aux fleurs", 8, "Un mochi."),
  "IT-9305": ("Allumette", 50, "Une allumette."), "IT-9794": ("Carte à collectionner", 5, "Une carte au hasard."),
  "IT-9194": ("Jambon (tranche)", 4, "Cuit."), "IT-9231": ("Chocolat fin", 12, "Un chocolat de l'assortiment."),
  "IT-9234": ("Lait infantile (biberons du jour)", 10, "Poudre pour une journée de biberons."),
  "IT-11450": ("Œuf peint", 12, "Peint à la main."),
  # boissons et denrées : une portion / la consommation d'une journée
  "IT-9124": ("Café soluble (journée)", 10, "Café instantané, de quoi tenir une journée."),
  "IT-9126": ("Café en grains de Portus Pacis (journée)", 8, "Arabica des terrasses de Portus Pacis, de quoi tenir une journée. Vigilance +1 h."),
  "IT-9127": ("Café noir de l'Anchorage (journée)", 8, "Torréfaction des docks d'Anchorage, Novastella. De quoi tenir une journée. Annule une nuit blanche."),
  "IT-9129": ("Thé noir en vrac (journée)", 10, "Feuilles entières, de quoi infuser une théière par jour."),
  "IT-9130": ("Thé vert sencha (journée)", 10, "Thé vert de qualité, une théière."),
  "IT-9131": ("Thé blanc de Celestia (journée)", 10, "Aiguilles d'argent des jardins royaux de Celestia, une théière. Calme, concentration +1 h."),
  "IT-9132": ("Thé de mana de Sophora (tasse)", 10, "Cultivé dans les serres de Sophora, Novastella. Une tasse restaure 10 % de mana."),
  "IT-11500": ("Thé aux fleurs de Floraison (théière)", 10, "Cueilli au printemps de Celestia. Une théière."),
  "IT-9185": ("Champignons de Paris (portion)", 2, "Frais, une portion."), "IT-9188": ("Truffe noire (lamelle)", 10, "Champignon rare, de quoi parfumer un plat."),
  "IT-9195": ("Bœuf séché (portion)", 2, "Conservation longue, une portion."), "IT-9203": ("Crevettes (portion)", 2, "Décortiquées, une portion."),
  "IT-9205": ("Thon rouge de Portus Pacis (portion)", 3, "Pêche du port neutre, une portion."), "IT-9206": ("Caviar (cuillère)", 5, "Esturgeon, une cuillère."),
  "IT-9207": ("Fromage râpé (portion)", 5, "Emmental, une portion."), "IT-9209": ("Comté 18 mois (portion)", 6, "Affiné, une portion."),
  "IT-9210": ("Roquefort (portion)", 6, "Brebis, une portion."),
  "IT-9072": ("Croquettes (ration du jour)", 25, "Ration d'une journée pour un animal."),
  "IT-9073": ("Viande pour créature (ration du jour)", 5, "Ration d'une journée pour une créature carnivore."),
  "IT-11396": ("Croquettes de mana (ration du jour)", 30, "Ration d'une journée pour un compagnon magique."),
  "IT-11398": ("Braise pour salamandre (ration du jour)", 30, "Ration d'une journée pour une salamandre."),
  "IT-11400": ("Viande de wyverne pour créature (ration)", 7, "Ration d'une journée ; croissance +20 % ce jour-là (7 rations = 1 semaine)."),
  "IT-11402": ("Chair pour mort-vivant lié (ration du jour)", 30, "Ration d'une journée pour un compagnon mort-vivant."),
  "IT-11403": ("Mana liquide pour élémentaire (ration du jour)", 30, "Ration d'une journée pour un élémentaire de rang B."),
  "VH-0414": ("Avoine (ration du jour)", 14, "Nourrit un cheval une journée."),
  "VH-0116": ("Fourrage (ration du jour)", 10, "Une journée de fourrage pour une monture."),
  "VH-0112": ("Essence (5 L)", 10, "Moteur thermique, un bidon de 5 L."), "VH-0416": ("Gazole (5 L)", 10, "Moteurs diesel, un bidon de 5 L."),
  "VH-0113": ("Charbon (journée)", 10, "Une journée de chauffe pour une machine à vapeur."),
  "VH-0419": ("Hydrogène (1 kg)", 10, "80 km pour une voiture à pile."), "VH-0420": ("Kérosène (100 L)", 10, "Aviation légère, environ 35 min de vol."),
  "VH-0422": ("Uranium enrichi (dose d'un an)", 5, "Fait tourner un réacteur naval une année."),
  # composants et réactifs : une dose
  "IT-9908": ("Poudre d'os (dose)", 10, "Une pincée."), "IT-9909": ("Sel de mer (poignée)", 10, "Gros sel."), "IT-9910": ("Soufre (dose)", 10, "Poudre."),
  "IT-9911": ("Salpêtre (dose)", 10, "Poudre."), "IT-9912": ("Verre pilé (dose)", 10, "Une pincée."), "IT-9913": ("Suif (morceau)", 10, "Un morceau."),
  "IT-9916": ("Camomille (dose)", 10, "Séchée, de quoi faire une infusion."), "IT-9917": ("Lavande (dose)", 10, "Séchée, une poignée."),
  "IT-9920": ("Graisse d'oie (cuillère)", 10, "Une cuillère."), "IT-9921": ("Champignon commun (poignée)", 5, "Séché."),
  "IT-9924": ("Mousse de caverne (touffe)", 10, "Phosphorescente."), "IT-9930": ("Cendre volcanique (dose)", 10, "Une pincée."),
  "IT-9931": ("Eau de pluie d'orage (fiole)", 10, "Chargée, une fiole de 10 cl."), "IT-10987": ("Poudre d'argent (dose)", 10, "Trace un cercle contre les morts-vivants."),
  "IT-11142": ("Poudre de mana (dose)", 10, "Mana cristallisé en poudre, une dose."), "IT-9109": ("Sang de licorne (goutte)", 10, "Rituels de résurrection, une goutte."),
  "IT-10992": ("Sang de dragon (goutte)", 10, "Catalyseur de rituel de rang S, une goutte."), "IT-0274": ("Eau bénite (fiole)", 10, "Une fiole de 10 cl. Efficace contre morts-vivants et démons."),
  "IT-11482": ("Eau bénie de la Fête (fiole)", 10, "Une fiole de 10 cl : retire une malédiction mineure et une bonne partie de la poussière."),
  "IT-9110": ("Papier (feuille)", 100, "Une feuille blanche."),
}
import math
def nice(v):
  if v < 1: return 1
  if v < 1000: return int(math.floor(v + 0.5))
  p = 10 ** (int(math.log10(v)) - 2); return int(math.floor(v / p + 0.5) * p)
changed = []
for x in d["items"]:
  i = x["id"]
  if x.get("_unit"): continue
  m = re.search(r"\s*\(\s*[×x]\s*(\d+)\s*\)\s*$", x["n"])
  if m and i not in KEEP:
    n = int(m.group(1)); base = x["n"][:m.start()]
    x["n"] = NAME.get(i) or (singular(base) if n > 1 else base); x["desc"] = DESC.get(i, x["desc"])
  elif i in MANUAL:
    x["n"], n, x["desc"] = MANUAL[i]
  else: continue
  old = x["price"]; x["price"] = nice(old / n) if old else 0
  for k in ("stock", "full"):
    if isinstance(x.get(k), (int, float)) and x[k] not in (None, "") and n > 1: x[k] = int(x[k]) * n
  x["_unit"] = n; changed.append((i, x["n"], old, x["price"], n))
json.dump(d, open(P, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
for c in changed: print(*c, sep=" | ")
print(len(changed), "articles passés à l'unité")
