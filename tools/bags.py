# Sacs : rattachés à la racine « Sacs » de Manhwa Sheet (msCat), places d'équipement (+N Places = system.slots), contenance (system.capacity),
# description au format « Sac en Bandoulière / +5 Places ». Relançable.
import json, sys, re
P = sys.argv[1]; d = json.load(open(P, encoding="utf-8")); byid = {x["id"]: x for x in d["items"]}
# id : (type affiché, places, feuille Manhwa Sheet, contenance en L, complément)
B = {
  "IT-0130": ("Sac en Bandoulière", 5, "bags_satchel", 10, "Toile épaisse, une poche."),
  "IT-0131": ("Sac de Voyage", 10, "bags_backpack", 70, "Renforcé."),
  "IT-0132": ("Carquois", 2, "bags_satchel", 0, "Contient 30 flèches."),
  "IT-0133": ("Bandoulière de Munitions", 3, "bags_satchel", 0, "12 chargeurs."),
  "IT-9301": ("Sac à Dos", 6, "bags_backpack", 20, ""),
  "IT-9346": ("Sac à Dos de Randonnée", 8, "bags_backpack", 60, "Armature."),
  "IT-9347": ("Valise", 8, "bags_backpack", 70, "Roulettes."),
  "IT-9358": ("Sac Allégé", 10, "bags_dimensional", 40, "Le contenu pèse moitié moins."),
  "IT-9363": ("Sac sans Fond", 20, "bags_dimensional", 500, "Poids constant."),
  "IT-9669": ("Sac en Toile", 3, "bags_satchel", 15, "Cabas."),
  "IT-9679": ("Sacoche de Ceinture", 2, "bags_pouch", 2, "Cuir synthétique."),
  "IT-9683": ("Sac Étanche", 5, "bags_backpack", 20, ""),
  "IT-9691": ("Sac de Sport", 6, "bags_backpack", 40, ""),
  "IT-9695": ("Sacoches de Selle", 6, "bags_satchel", 40, "Paire, cuir ; se portent sur une monture."),
  "IT-9699": ("Carquois", 2, "bags_satchel", 0, "Cuir, 24 flèches."),
  "IT-9700": ("Bourse", 1, "bags_pouch", 0, "Contient 10 000 pièces, poids nul."),
}
n = 0
for i, (typ, places, leaf, cap, extra) in B.items():
  x = byid.get(i)
  if not x: print("absent", i); continue
  x["bag"] = {"type": typ, "places": places, "cap": cap}; x["msCat"] = leaf
  tail = extra if extra else ""
  if cap: tail = (f"{cap} L. " + tail).strip()
  x["desc"] = f"{typ}\n+{places} Place{'s' if places > 1 else ''}" + (f"\n{tail}" if tail else "")
  n += 1
json.dump(d, open(P, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(n, "sacs")
