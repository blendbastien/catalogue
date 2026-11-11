# The Last Horizon — Le Catalogue (Boutique du Système) — v2

Le Catalogue livré avec **8 178 entrées** (compétences, titres, armes, armures, véhicules, compagnons, propriétés, objets), propulsé par le moteur **Boutique** : tout est éditable.

**2.8.1** — Les reflets et balayages ne concernent plus que les objets d'exception : bannières de rang S / SS / SSS seulement, balayage de la fenêtre de détail seulement pour les hauts rangs et hautes raretés. **Étiquettes au style Manhwa Sheet** (rareté pleine fléchée, élément et saison en pastille, monde / catégorie / stock avec barre, tags libres en pointillé ; police Exo 2), comme les fiches Véhicules. **Registre** : noms de champ en Exo 2, couleur du rang. **Progression retirée** du détail. **Optimisations** : plus aucun filtre, ombre ou texte animé (seulement des transformations et opacités, calculées par la carte graphique), contour tournant par rotation, reflet de la recherche en translation, flou d'arrière-plan retiré, lignes du fond teintées par calcul (plus de filtre plein écran), ombres allégées.

**2.8.0** — **DA système / jeu vidéo** : boutons HUD à coins coupés et liseré néon (reflet au survol) partout ; recherche en cadre néon miroitant avec pastille hexagonale et touche affichée ; compteurs Entrées / Affichées / Verrouillées en plaques HUD ; widget Saison et niveau retravaillés ; filtres et tri multicolores (plus de retour à la ligne de « Tri · Rang » à la taille par défaut) ; bouton d'affichage cartes / liste. **Contour néon prononcé** sur les cartes et la fenêtre de détail (balayage lumineux, coins). **Animations des objets d'exception** : hauts rangs (S, SS, SSS) et hautes raretés (Légendaire → Artefact) — reflets, halos pulsés, contour tournant pour SSS / Oméga / Artefact (désactivable dans CONFIG › DA saisonnières). **Séparateurs de rang** en bannière néon foncée et miroitante. **Lignes lumineuses** qui courent entre les hexagones du fond, de la couleur du fond (désactivable). Réglages du module : **opacité de la fenêtre de détail** et **de la bannière du haut**, menu **« Niveau de boutique des joueurs »** (niveau par défaut + niveau de chaque joueur). Les 4 boutons MJ (Édition, Config, Recherches, Données) restent réservés au MJ, même appelés directement.

**2.7.0** — **DA saisonnières** : chaque saison (16) a sa DA (couleurs, fond teinté, effet animé : neige, pétales, lanternes, bulles, braises, cœurs, confettis, pluie, feux d'artifice, feuilles…), réglables dans CONFIG › DA saisonnières (activer, effets, imposer une autre DA par saison). **Fond hexagonal** néon. **Niveau de boutique propre à chaque joueur** (le MJ choisit le joueur sous le niveau ; défaut = réglage du module). Les articles d'un niveau trop haut sont **toujours cachés aux joueurs** (plus de bascule masqués / grisés ; le MJ les voit grisés). **Recherche** au cadre miroitant et encadré « Recherches du jour ». **Filtres et tri** en pastilles colorées. **Roulette retirée** (un module à part viendra). **Exports JSON / CSV** déplacés dans CONFIG › Général (et DONNÉES). **Sacs** rattachés à la catégorie « Sacs » de Manhwa Sheet, avec leurs places d'équipement (ex. Besace : « Sac en Bandoulière / +5 Places »).

**2.6.0** — **Vente à l'unité** : 221 articles vendus par lots ou en vrac passent à une unité, prix divisé d'autant (minimum 1 G, stock multiplié). Munitions et armes de jet à la pièce (flèche, cartouche, sceau, orbe…), médicaments à la dose (comprimé, dose du jour d'antibiotique, cuillère de sirop), nourriture et boissons à la portion ou à la journée (avoine = une journée de cheval, café et thé = une journée, rations de compagnon), composants et réactifs à la dose, carburants en petit format (bidon de 5 L, journée de charbon), matériaux à la pièce (brique, tuile, clou…). Restent entiers : les paires et jeux (talkies, pierres de communication, Cartes du Destin), les ensembles (sets d'armure, essaim de drones, manteau à lames), les contrats et abonnements, les objets dont la mesure est la taille (corde de 30 m, poutre de 4 m, vitre de 1 m²…).

**2.5.0** — 54 **pièces de véhicule de base** (rangs F et E : planches de renfort, plaques de fer, calfatage, rames, voiles, foc, gouvernails, roues cerclées, essieux, arbalète de bord, pavois, coffres, couchettes, emplacements supplémentaires…) et 3 véhicules (Radeau, Sloop, Cogue), pour le module **Véhicules Manhwa** : chaque pièce porte son emplacement, ses environnements et ses bonus, recopiés sur l'objet acheté.

## 3.6.1
- Signal Quotidien : la ligne de la frise s'arrête au dernier jour du cycle.

## 3.6.0
- Sélecteur d'objets partagé par la suite (Boutique stellaire, Signal Quotidien, bannières du gacha) : arbre des catégories avec icônes 2D, recherche, rangs, rareté, cartes visuelles, blocs de la Boutique, panier de sélection.
- Signal Quotidien : frise façon gacha (médaillons ronds ou carrés reliés jour après jour, états réclamé / disponible / aujourd'hui / verrouillé, bouton « Tout réclamer ») ; gestion du MJ avec la même frise, choix des récompenses par le sélecteur, jour suivant pour tous, retour au jour 1, durées 3 à 30 jours.
- Horlogia : les groupes qui « font avancer les modules » font passer les jours des cycles.
- API : sélecteur, blocs, visuels (icônes 2D, fonds), jour suivant du Signal, réassort, offres limitées, gestion.

## 3.5.1
- Icônes recentrées et entières sur les cartes (Catalogue et Boutique) : elles ne débordent plus en bas.
- Nouvelles icônes : Matériaux (planches, lingot, pierre), Munitions (une balle), Camouflage et Armes à feu simplifiés, Munitions spéciales plus petites.

## 3.5.0
- Fond de carte propre à chaque catégorie (191) : teinte et motif (lames, runes, hexagones, rouages, feuilles, gemmes, circuits…).
- Icônes 2D vectorielles pour les 191 catégories (≈300 Ko au total), sur les cartes, la fiche détail et l'arbre des catégories.
- Halo selon le rang : léger (F→C), anneau (A/B), rayons (S), rayons + anneau (SS), rayons irisés (SSS).

## 3.4.0
- Boutique : montants dorés adaptables (pied de carte sombre), séparateur titre / catégorie, bandeaux de rang comme le Catalogue.
- Fiche détail : étiquettes affichées comme les objets ; chaque champ en tuile néon (rang, rareté, origine, époque, bloc, stock, limite, réduction, offre…).
- Fond en dégradé spatial + « flux des étoiles » permanent (fragments lumineux, étoiles filantes, constellation) ; le thème d'hiver n'a plus de neige.

## 3.3.3
- Optimisation : sections hors écran non rendues (content-visibility), 21 objets par rang au départ quand tous les rangs sont affichés, plus de balayages ni d'animations permanentes sur les cartes, badges sans filtre.
- Rangs S/SS/SSS : halo fixe, reflet en haut de l'image, éclat ✦ dans le coin, bordure irisée fixe pour SSS, léger soulèvement au survol.

## 3.3.2
- Entête MJ sur une seule ligne (libellés Filtres/Composer en icônes).

## 3.3.1
- Prix lisibles sur les cartes crème, pied des cartes du Catalogue sans débordement, logo plus grand, entête sur une ligne.

## 3.3.0
- Entête façon fenêtre-système (lecteur omniscient) : dégradé spatial sur toute la barre, étoiles qui scintillent, nouveau logo (planète à anneau dans un hexagone), titre néon encadré.
- Polices embarquées (Orbitron, Rajdhani, Share Tech Mono — licence OFL, dossier fonts/).
- Couleur des niveaux de boutique sur les cartes et la fiche ; rang en colonne pleine en vue liste.
- Arborescence stylée niveau par niveau (type, famille, catégorie, sous-catégorie) + boutons « Réduire » en bas des groupes ouverts.
- Recherche, tris et boutons MJ restylés ; gros boutons « Achat immédiat » / « Panier » ; nom du joueur et solde mis en valeur ; pièce « G » centrée, montants dorés.

## 3.2.1
- Badges de rang SS/SSS lisibles, rareté visible en vue liste, icône boutique sur le niveau requis.

## 3.2.0
- Catalogue : arborescence restylée (plaques 3D par type, lignes de famille), cartes avec badge de rang hexagonal 3D et étiquette de rareté, infos (catégorie, élément, origine, niveau de boutique).
- Bannières de rang en plaques 3D, puces de rang 3D, couleurs de rang et de rareté plus lisibles.
- Barre du haut façon bannière cyberpunk, menus de tri lisibles, pièce d'or 3D.
- Fiche détail façon jeu vidéo (rang, rareté, prix, stats).
- MJ : « Nouvel objet » et « Retirer » directement depuis le Catalogue.

## 3.1.0

Catalogue complet : arborescence à gauche (type › famille › catégorie › sous-catégorie, avec les nombres), fil d'Ariane, pastilles de rang néon (plusieurs à la fois, avec les nombres), grands bandeaux de rang, cartes néon (reflet animé S / SS / SSS, contour irisé SSS), recherche dans la sélection ou partout, tri, rareté. Même arborescence dans « Composer ».

## 3.0.0 — la Boutique

Refonte complète : fenêtre native plein écran, DA de la Boutique stellaire.
- **Boutique** : le MJ compose des **blocs** en glissant des objets du catalogue complet ; objets triés par rang ; cartes ou liste ; clic = Acheter (les clics s'additionnent, + / −), clic droit = fiche ; panier ou achat direct ; montants abrégés.
- **Niveaux** Novice → Mythique par personnage (MJ seulement), tableau rang / rareté modifiable, animation de passage de niveau ; sans la compétence « Accès à la Boutique » : consultation seulement.
- **Étiquettes** (données, achetées ou liées à un titre) qui ouvrent des blocs ; badges près du nom.
- **Blocs** : niveau, étiquettes, réservés à des joueurs ou groupes, événement, masqués ; **promotions** (−X %, ruban, compte à rebours piloté par le MJ), offres « 2e offert », « 2e à −50 % », packs.
- Stock partagé, réapprovisionnement, limite par personnage ; historique par joueur avec annulation.
- Contrôle : offres vérifiées, anomalies, grille de prix ; le prix modifié au catalogue change partout.
- **Signal Quotidien** : onglet du Menu, cycles de 3 à 28 jours par groupe ou personnage, le MJ fait passer les jours.
- Thèmes des événements du catalogue (décor animé léger) et bandeau des nouvelles du cosmos (lieux de la Carte Stellaire).
- Retirés : l'ancienne fenêtre, les recherches quotidiennes, les niveaux par joueur, l'import et les menus CSB.

## 2.16.0

Le Catalogue s'ouvre en plein écran (avec Manhwa Sheet ≥ 1.29) : flèche pour revenir, réduire en barre, quitter.

## Installation
`https://github.com/blendbastien/catalogue/releases/latest/download/module.json` — la mise à jour depuis la 1.x conserve niveau de boutique, saison, correspondance CSB.

## Nouveautés 2.0.0
- Moteur Boutique complet : mode **ÉDITION** (créer / modifier / dupliquer / supprimer des articles, sélection multiple, déplacement de catégorie, changements groupés), arbre éditable (catégories, sous-catégories, types : renommer, icône, famille, déplacer, supprimer), 187 icônes vectorielles, **CONFIG** (nom, monnaie, icône, 5 thèmes, rangs, raretés, éléments, mondes, époques, saisons, niveaux, roulette, bulletins), **DONNÉES** (sauvegarde / import / export JSON et CSV).
- Vos modifications sont enregistrées en **delta** par rapport au contenu livré : le monde ne stocke que ce que vous avez changé ; les mises à jour du module n'écrasent pas vos éditions.
- **Recherches quotidiennes limitées** : chaque joueur dispose de N recherches par jour dans la barre de recherche (validées avec Entrée ; effacer la recherche est gratuit). Réglage du nombre dans les options du module ; bouton **RECHERCHES** (MJ) pour voir les compteurs, accorder des recherches bonus (+1 / +5, permanentes) ou remettre un joueur à zéro. Le MJ n'est jamais limité ; le système peut être désactivé.
- Stock décrémenté à l'achat, fenêtre d'achat stylisée, chat optionnel, détection automatique des templates CSB.

## Templates CSB (2.2.0)
Le module **crée lui-même** les templates d'objets Custom System Builder dont il a besoin, à la première ouverture du monde par le MJ (réglage « Créer automatiquement… », activé par défaut) : `Catalogue — Compétence`, `Titre`, `Arme`, `Armure`, `Accessoire`, `Consommable`, `Munition`, `Sac`, `Objet`, `Véhicule`, `Compagnon`, `Propriété`. Ils sont indépendants de vos propres templates et repérés par un drapeau interne (vous pouvez les renommer). Champs : rang, rareté, catégorie, type (sous-catégorie), élément, niveau, coût MP / portée / exécution (compétences), gold, quantité, places (sacs), monde, constructeur, description, lore, évolution, condition. Réglages → *Templates d'objets du Catalogue* : voir l'état, créer les manquants, mettre à jour les listes (rangs, raretés, éléments) après un changement de configuration. Chaque achat ou import choisit le template selon le type et la catégorie de l'article.

## Avec Fiche Manhwa
Si le module **fiche-manhwa** est actif, le Catalogue n'installe pas ses propres templates : les objets sont créés avec ceux de la fiche Manhwa et s'affichent dans ses onglets.

## Mise à jour
Release GitHub avec exactement `module.json` et `last-horizon-catalogue.zip`.

## v2.3.1
- Achat par un joueur : si les templates de la Fiche Manhwa ne sont pas visibles, l'achat est refusé avec un message clair au lieu de créer un objet sans template ; rechargement du template après création.
- Base : 64 lots bon marché (pharmacie, alimentation, quotidien, consommables, composants, graines, pièges, science…) passés **à l'unité** (prix ramené à l'unité, minimum 1 G) ; 55 descriptions médicales réécrites pour expliquer simplement l'usage (paracétamol, crème antibiotique, désinfectant, garrot, stimulant…). Munitions, boîtes de gants/masques, clous/vis, matériaux de construction et armes de jet restent en lots.

## v2.3.2
- Les objets achetés naissent avec la mise en page de leur template (en-tête, corps) copiée dedans, comme après un « rafraîchir » : plus de refresh manuel. Nécessite Fiche Manhwa ≥ 1.5.

## v2.3.3
- Rang bien lisible dans la fenêtre d'achat (blanc sur fond teinté par le rang).

## v2.3.4
- Badge de rang de la fenêtre d'achat : carré arrondi net, sans découpe.


## Changements

- **2.15.0** : **grande mise à jour du Catalogue de base** (15 071 articles, +6 945). Ordre des catégories : Arme, Armure, Objet, Compétence, Véhicule, Compagnon, Propriété, Titre. Les 52 articles liés au « Lecteur » sont retirés (la catégorie de titres « Lecteur » aussi). Pour chaque monde et son niveau technologique (Eos médiéval-fantasy, Cordelia druidique, Eryndor gothique, Hyperion îles volantes, Andromeda englouti, Clockwork steampunk, Nova dômes futuristes et extérieur post-apo, Inertia station haut de gamme, plus deux mondes de la carte stellaire : Sigma, ravagé par la Légion du Chaos, et Holstein, ruines silencieuses) : +1 400 armes, +1 100 armures, +4 500 objets, tous de rang F à A, centrés sur le début et le milieu de partie. Nouvelles catégories : Matériaux (bois, minerais, lingots, cuirs, tissus, pierres, résines, os, composants tech, verre), Butin de monstres (bête, insecte, mort-vivant, dragon, élémentaire, aberration, plante, machine, Abysseux, Ombre), Récupération post-apo (ferraille, électronique, filtration, pièces, carburant, trouvailles), armes et armures « De fortune ». Prix tenus dans l'échelle existante par rang, brut < raffiné < fabriqué. Les articles déjà existants, les rangs S à SSS et les modifications faites en jeu sont conservés.
- **2.14.0** : **achats sûrs quand plusieurs joueurs achètent en même temps**. L'achat (stock, paiement, création de l'objet) est désormais exécuté par le MJ actif, une opération à la fois et sous le verrou du personnage partagé avec Manhwa Sheet, le Gacha et les Véhicules : le stock est réservé avant le paiement (deux joueurs sur le dernier exemplaire → un seul l'obtient), le paiement est rendu si l'objet ne peut pas être créé (avant, le joueur pouvait payer sans rien recevoir), les doubles clics et requêtes forgées sont ignorés. Écritures du Catalogue (stock, ajout d'article, niveau de boutique, quota de recherches) sous verrou : plus d'écrasement entre deux opérations rapprochées ou deux MJ ; numéro d'article attribué au moment de l'écriture ; un article synchronisé avec un objet ne remet plus le stock à l'ancienne valeur. Les gabarits automatiques ne sont créés que par le MJ actif.
- **2.13.0** : **objets Foundry → Catalogue** (MJ) : « Ajouter au Catalogue » dans le menu ⋮ de la fiche d'objet, au clic droit dans la barre des Objets, ou en **glissant l'objet dans la fenêtre du Catalogue** (barre des Objets, fiche, compendium). Type, catégorie, rang, rareté et prix devinés (modifiables) ; option **Synchroniser** (modifier l'objet met l'article à jour) et **Copie exacte** (acheter ou donner l'article crée une copie de l'objet d'origine, bonus et réglages compris). Image de l'objet utilisée dans le Catalogue. API `addToCatalogue(item)`.
- **2.12.0** : **Donner** (MJ) depuis la fiche d'un article : à un ou plusieurs groupes du Menu, à des personnages (barre de recherche), ou à tous les personnages des joueurs, avec quantité et annonce dans le chat (gratuit, sans toucher au stock). Catégorie de titres « Obtention » renommée **« Succès »** ; la condition d'obtention passe dans le champ dédié des titres de Manhwa Sheet (≥ 1.24.3).
- **2.11.0** : **icônes illustrées par objet** : réglage « Pack d'icônes illustrées » (dossier de la bibliothèque de fichiers contenant `icons.json` = identifiant de l'objet → image) ; l'image s'affiche sur la carte (taille adaptée, jamais rognée), en grand dans la fenêtre de détail (sans cadre) et devient l'image de l'objet acheté ; API `picOf(id)`. Logo en haut à gauche = icône du Catalogue du Menu (pack de l'Appel des Étoiles). « Copier la fiche » réservé au MJ.
- **2.10.0** : la saison est celle de Manhwa Sheet : la saison du monde s'affiche dans l'en-tête et l'« événement » (saison du Catalogue) suit celui réglé dans la fiche ; le MJ peut le changer d'ici, cela met à jour toute la suite (gacha compris).
- **2.9.0** : Catalogue utilisable dans une petite fenêtre : en-tête et boutons qui passent à la ligne, filtres compacts, catégories au-dessus de la liste sous 700 px.
