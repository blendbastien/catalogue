# Boutique - Manhwa — `last-horizon-catalogue`

Catalogue d'objets (~15 000 entrées), Boutique (blocs, offres, stock), Signal Quotidien, bandeau d'actualités et **sélecteur d'objets partagé** par la suite.

La documentation détaillée du module est dans `DOCUMENTATION.md`.

Code de la version **3.11.0** (dernière release), pour Foundry VTT v13.

## Liens avec la suite Manhwa

La suite compte un système (Fiche - Manhwa) et 11 modules. La Fiche est le centre : les données partagées y vivent et les modules les lisent via `globalThis.MANHWA`.

- Lit `MANHWA.categories`, `config`, `season`, `gmGroups`, `cosmetics` (Fiche) ; écoute `manhwaNewDay` (Horlogia) et `manhwaSeason`.
- Lieux du bandeau tirés de la Carte Stellaire.
- Fournit objets, icônes et sélecteur au Gacha, aux Scénarios et au Domaine.
- Règle commune : un module ne plante jamais si un autre est absent (vérifier `game.modules.get(id)?.active` avant d'appeler son API).

## Livraison

1. Augmenter `version` dans `module.json` (jamais deux livraisons au même numéro).
2. Construire le zip, qui doit contenir le dossier `last-horizon-catalogue/` :
   ```bash
   mkdir -p build/last-horizon-catalogue && git archive HEAD | tar -x -C build/last-horizon-catalogue
   cd build && zip -qr last-horizon-catalogue.zip last-horizon-catalogue
   ```
3. Créer la release GitHub `vX.Y.Z` avec **exactement 2 fichiers** : `module.json` et `last-horizon-catalogue.zip`. Le manifeste pointe vers `releases/latest/download/…`.
4. The Forge : Bazaar → *Install From Manifest* avec l'URL versionnée `https://github.com/blendbastien/catalogue/releases/download/vX.Y.Z/module.json`. Ne jamais utiliser *Update All Packages*.
5. Redémarrer le monde de test, vérifier la version installée et tester.
