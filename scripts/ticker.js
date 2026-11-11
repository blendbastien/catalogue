/* Boutique — bandeau défilant : nouvelles du cosmos façon cyberpunk. Les lieux viennent de la Carte Stellaire (jamais Eos,
 * hors réseau). {g} = galaxie, {s} = système, {p} = planète. Le MJ peut couper des messages et ajouter les siens. */
import { MOD, nrm, uid } from "./shop-data.js";

const G = [
  "FLASH // Tempête ionique sur {g} : liaisons hyperspatiales coupées pour 48 h.",
  "ALERTE // Un essaim de drones sans pavillon remonte le bras extérieur de {g}.",
  "MARCHÉ // Le cours du cristal de saut s'effondre dans tout {g}. Les courtiers pleurent.",
  "RUMEUR // Un vaisseau-cathédrale aurait été aperçu aux confins de {g}. Personne n'en revient.",
  "RÉSEAU // Panne du relais galactique de {g} : messages retardés de trois cycles.",
  "SÉCURITÉ // Les patrouilles de {g} doublent leurs effectifs après une série de piratages.",
  "SCIENCE // Les sondes de {g} captent un signal régulier venu d'avant les étoiles.",
  "CULTE // Une secte du Vide prêche la fin de {g} sur toutes les fréquences pirates.",
  "COMMERCE // Les guildes de {g} annoncent un embargo sur les composants militaires.",
  "ANOMALIE // Une distorsion gravitationnelle avale une ceinture d'astéroïdes de {g}.",
  "INFO // Recensement : la population de {g} franchit un nouveau seuil historique.",
  "CONTREBANDE // Saisie record de neuro-stimulants dans un convoi de {g}.",
  "MÉTÉO SPATIALE // Vent solaire extrême attendu sur l'ensemble de {g}. Restez à quai.",
  "POLITIQUE // Les délégués de {g} quittent la séance du Sénat en signe de protestation.",
  "LÉGENDE // Les vieux pilotes de {g} jurent avoir revu le Vaisseau sans Nom.",
  "BOURSE // Les actions minières de {g} grimpent de 340 % en une nuit. Délit d'initié ?",
  "RECRUTEMENT // Les flottes mercenaires de {g} paient double ce cycle.",
  "INCIDENT // Collision entre deux cargos géants à l'entrée de {g}. Trafic dévié.",
  "DÉCOUVERTE // Une ruine précursive émerge d'une nébuleuse de {g}.",
  "PROPAGANDE // « {g} ne dort jamais » : la nouvelle campagne inonde les écrans.",
  "VIRUS // Un code autoréplicant infecte les IA domestiques de {g}.",
  "CHASSE // Primes triplées sur les pirates du secteur de {g}.",
  "DIPLOMATIE // Trêve fragile signée entre les factions de {g}. Pour combien de temps ?",
  "SIGNAL // Les balises de {g} répètent un même mot depuis minuit : « bientôt ».",
  "ÉNERGIE // Rationnement de plasma dans les stations les plus pauvres de {g}.",
  "ARTEFACT // Un objet de rang inconnu aurait changé de mains dans {g}.",
  "VOYAGE // Ouverture d'une nouvelle route express à travers {g}.",
  "ÉVASION // Trois détenus de haute sécurité disparaissent d'une prison orbitale de {g}.",
  "SPECTACLE // Le tournoi des pilotes de {g} bat des records d'audience.",
  "OBSERVATION // Une étoile de {g} change de couleur sous les yeux des astronomes.",
  "FRAUDE // Faux crédits en circulation dans les comptoirs de {g}. Vérifiez vos jetons.",
  "MIGRATION // Des milliers de réfugiés fuient les marges de {g}.",
  "TECH // Les implants de dernière génération arrivent enfin dans {g}.",
  "MYSTÈRE // Un vaisseau fantôme émet des appels de détresse vieux de mille ans dans {g}.",
  "GUERRE FROIDE // Manœuvres militaires « de routine » aux frontières de {g}.",
  "BOUCLIER // Le grand bouclier de {g} subit une microfissure. Les ingénieurs rassurent.",
  "TRAFIC // Embouteillage spatial historique : 12 000 vaisseaux bloqués dans {g}.",
  "OUBLI // Les archives de {g} perdent trois siècles de données. Effacement volontaire ?",
  "ÉCHO // Une voix synthétique récite des coordonnées sur les canaux publics de {g}.",
  "FÊTE // Les habitats de {g} illuminent le vide pour la nuit des mille feux.",
  "SANTÉ // Une fièvre grise se propage parmi les équipages de {g}. Quarantaine possible.",
  "INFILTRATION // Des agents de l'IBC auraient été repérés dans {g}.",
  "RECORD // Un coureur relie les deux extrémités de {g} en moins de six heures.",
  "SILENCE // Une colonie entière de {g} ne répond plus depuis trois jours.",
  "BAZAR // Les marchands ambulants affluent vers {g} : on parle d'un trésor.",
  "COMÈTE // Une comète géante traversera {g} ce cycle. Spectacle garanti.",
  "SABOTAGE // Les chantiers navals de {g} victimes d'une série d'explosions.",
  "IA // Une intelligence affirme être consciente et réclame des droits dans {g}.",
  "OR NOIR // Un gisement de matière exotique découvert dans {g}. La ruée commence.",
  "DERNIÈRE MINUTE // Le Réseau déclare l'état d'alerte de niveau 2 pour {g}."
];
const S = [
  "FLASH // Éruption stellaire dans le système {s} : communications brouillées.",
  "TRAFIC // Le port principal de {s} est saturé, attente estimée : 9 h.",
  "ALERTE // Des pirates ont pris d'assaut une station-relais de {s}.",
  "MARCHÉ // Pénurie de munitions dans le système {s}. Les prix flambent.",
  "RUMEUR // Un marchand de {s} vendrait des cartes de routes oubliées.",
  "SCIENCE // L'étoile de {s} pulse à un rythme inexpliqué depuis hier.",
  "SÉCURITÉ // Contrôles renforcés à toutes les portes du système {s}.",
  "ACCIDENT // Un remorqueur s'écrase sur la ceinture de {s}. Aucun survivant signalé.",
  "PRIME // 500 000 G pour la capture du « Spectre de {s} ».",
  "COMMERCE // Ouverture d'une zone franche dans le système {s}.",
  "MYSTÈRE // Les satellites de {s} se réorientent seuls vers le même point.",
  "POLITIQUE // Élections anticipées dans le système {s} après un scandale.",
  "CONTREBANDE // Un réseau d'armes démantelé dans les docks de {s}.",
  "FÊTE // Le système {s} célèbre l'anniversaire de sa fondation.",
  "MÉTÉO // Pluie de micrométéorites prévue sur les orbites de {s}.",
  "RECHERCHE // Les laboratoires de {s} cherchent des cobayes. Bien payés.",
  "PANNE // Black-out total sur deux habitats du système {s}.",
  "RENCONTRE // Un signal non humain capté en bordure du système {s}.",
  "CHANTIER // Le système {s} construit un anneau orbital colossal.",
  "TOURNOI // Les arènes de {s} accueillent les champions de dix mondes.",
  "SECTE // Des pèlerins encapuchonnés convergent vers l'étoile de {s}.",
  "DOUANE // Nouveaux droits d'entrée dans le système {s} : +30 %.",
  "ÉPAVE // Une épave inconnue dérive au milieu du système {s}.",
  "INFO // Le système {s} rejoint officiellement le Réseau commercial.",
  "ENQUÊTE // Disparition d'un haut fonctionnaire dans le système {s}.",
  "ÉNERGIE // Une centrale à fusion de {s} frôle la catastrophe.",
  "CHASSE AU TRÉSOR // Des coordonnées gravées sur une coque mènent à {s}.",
  "GRÈVE // Les dockers du système {s} cessent le travail.",
  "OBSERVATOIRE // Une planète errante entre dans le système {s}.",
  "NUIT // Le système {s} plonge dans l'ombre d'une nébuleuse pour trois jours.",
  "RAID // Une flotte inconnue a traversé {s} sans s'arrêter.",
  "MARCHÉ NOIR // Un implant de rang S en vente dans les bas-fonds de {s}.",
  "ÉVÉNEMENT // Course de capsules à travers les anneaux de {s} ce soir.",
  "PROPHÉTIE // Un oracle de {s} annonce « la chute des trois lunes ».",
  "CORPO // Une mégacorporation rachète la moitié du système {s}.",
  "DÉFENSE // Le système {s} active ses tourelles orbitales.",
  "RELIQUE // Une relique précursive exposée au musée de {s}. Sécurité maximale.",
  "VIRUS // Les distributeurs automatiques de {s} offrent tout gratuitement. Bug ?",
  "CONVOI // Un convoi humanitaire attendu dans le système {s}.",
  "SIGNAL // Le phare de {s} s'est éteint. Première fois depuis 400 ans.",
  "LÉGENDE // On dit qu'un dragon de métal dort sous la lune de {s}.",
  "TRANSIT // Réouverture du couloir rapide vers {s}.",
  "ANOMALIE // Le temps s'écoule 2 % plus lentement dans une zone de {s}.",
  "PROTESTATION // Manifestation monstre contre les taxes à {s}.",
  "DÉCOUVERTE // Un minerai qui chante découvert dans le système {s}.",
  "ÉCHANGE // Le taux de change du Gold s'envole dans le système {s}.",
  "ARRESTATION // Un pirate légendaire capturé dans le système {s}.",
  "ÉCLIPSE // Triple éclipse visible depuis tout le système {s}.",
  "DRONES // Un nuage de drones perdus encombre les voies de {s}.",
  "OUVERTURE // Une nouvelle boutique du Système ouvre ses portes dans {s}."
];
const P = [
  "FLASH // Séisme majeur sur {p} ({s}) : les cités basses évacuées.",
  "ALERTE // Contamination de l'eau sur {p}. Restez sous dôme.",
  "MÉTÉO // Tempête de sable géante sur {p}, visibilité nulle.",
  "MARCHÉ // Les épices de {p} atteignent un prix record.",
  "RUMEUR // Une créature gigantesque aurait été filmée sur {p}.",
  "POLITIQUE // Coup d'État éclair sur {p}. Le palais est encerclé.",
  "FÊTE // Toute la population de {p} danse dans les rues ce soir.",
  "CRIME // Vague de cambriolages dans les tours de {p}.",
  "SCIENCE // Les volcans de {p} rejettent une poussière luminescente.",
  "MYSTÈRE // Une ville entière de {p} se réveille sans souvenirs.",
  "RECRUTEMENT // L'armée de {p} cherche des pilotes. Prime d'engagement.",
  "COMMERCE // Le grand marché de {p} ouvre une aile pour les reliques.",
  "INCIDENT // Un ascenseur orbital de {p} bloqué à mi-hauteur.",
  "ÉCOLOGIE // La forêt de {p} gagne 3 km en une nuit.",
  "SPORT // Le champion de {p} défie quiconque ose l'affronter.",
  "PANNE // La grille énergétique de {p} tombe pour la troisième fois.",
  "RELIGION // Un miracle aurait eu lieu dans un temple de {p}.",
  "ÉPIDÉMIE // Toux bleue sur {p}. Masques obligatoires.",
  "DÉCOUVERTE // Une cité souterraine mise au jour sur {p}.",
  "SÉCURITÉ // Couvre-feu instauré sur {p} après des émeutes.",
  "TRAFIC // Les spatioports de {p} débordent de voyageurs.",
  "ART // Une fresque de 10 km apparaît sur une falaise de {p}.",
  "CHASSE // Des bêtes mutantes sortent des terres sauvages de {p}.",
  "FINANCE // La banque centrale de {p} gèle tous les comptes étrangers.",
  "NAUFRAGE // Un yacht de luxe disparaît dans l'océan de {p}.",
  "RUMEUR // Un ancien héros vivrait caché sur {p}.",
  "INNOVATION // Les ingénieurs de {p} dévoilent un moteur silencieux.",
  "BRUME // Une brume rouge recouvre la capitale de {p}.",
  "MARCHÉ NOIR // On vend des souvenirs effacés à la sauvette sur {p}.",
  "CÉLÉBRITÉ // Une idole holographique de {p} affole le Réseau.",
  "CATASTROPHE // Un barrage cède sur {p}. Les secours arrivent.",
  "CONCOURS // Les cuisiniers de {p} s'affrontent pour le titre suprême.",
  "AURORE // Des aurores vertes illuminent les pôles de {p}.",
  "TECHNO // Les rues de {p} passent entièrement au néon autonome.",
  "ENQUÊTE // Un meurtre dans la haute société de {p} intrigue les détectives.",
  "MIGRATION // Les oiseaux de {p} volent tous vers le même pôle.",
  "ARCHÉOLOGIE // Une tablette gravée en langue inconnue retrouvée sur {p}.",
  "RÉVOLTE // Les mineurs de {p} occupent les puits.",
  "TOURISME // {p} élue destination de l'année par le Réseau.",
  "PRIME // Un chasseur offre 1 M de G pour une information sur {p}.",
  "SIGNAL // Une antenne de {p} capte des chants venus du sous-sol.",
  "GLACE // Une vague de froid fige les canaux de {p}.",
  "CARNAVAL // Défilé de masques géants dans les rues de {p}.",
  "PROPHÈTE // Un enfant de {p} prédit la météo de dix mondes. Sans erreur.",
  "PÉNURIE // Plus une seule pièce détachée sur {p} : les ateliers ferment.",
  "OVNI // Des lumières dansent au-dessus des montagnes de {p}.",
  "ENCHÈRE // Un objet légendaire mis aux enchères sur {p} demain.",
  "DISPARITION // Un quartier entier de {p} a disparu des cartes.",
  "RENAISSANCE // Les ruines de {p} reprennent vie grâce aux colons.",
  "DERNIÈRE MINUTE // Les autorités de {p} demandent à tous de lever les yeux vers le ciel."
];
export const BASE = [...G.map((t, i) => ({ id: `g${i}`, sc: "g", t })), ...S.map((t, i) => ({ id: `s${i}`, sc: "s", t })), ...P.map((t, i) => ({ id: `p${i}`, sc: "p", t }))];
export const SCOPES = { g: "Galaxie", s: "Système solaire", p: "Planète", x: "Libre (texte fixe)" };

/* lieux de la Carte Stellaire (sans Eos) */
let _places = null;
export async function places() {
  if (_places) return _places; _places = { g: [], s: [], p: [] };
  const mod = game.modules.get("carte-stellaire-manhwa"); if (!mod?.active) return _places;
  try { const u = await (await fetch(`modules/carte-stellaire-manhwa/data/universe.json`)).json(); const isEos = n => /(^|\W)eos(\W|$)/i.test(nrm(n));
    for (const g of Object.values(u.gal || {})) { if (!g?.n || isEos(g.n) || isEos(g.id)) continue; _places.g.push({ g: g.n });
      for (const s of g.systems || []) { if (!s?.n || isEos(s.n)) continue; _places.s.push({ g: g.n, s: s.n });
        for (const p of s.planets || []) { if (!p?.n || isEos(p.n)) continue; _places.p.push({ g: g.n, s: s.n, p: p.n }); for (const m of p.moons || []) if (m?.n && !isEos(m.n)) _places.p.push({ g: g.n, s: s.n, p: m.n }); } } }
  } catch (e) { console.warn(MOD, "lieux de la Carte Stellaire introuvables", e); }
  return _places;
}
export const tickerCfg = () => ({ custom: [], off: [], ...(game.settings.get(MOD, "ticker") || {}) });
export const allMessages = () => { const c = tickerCfg(); return [...BASE, ...(c.custom || [])]; };
/** n messages tirés au hasard, lieux remplis */
export async function pick(n = 14) {
  const pl = await places(); const c = tickerCfg(); const off = new Set(c.off || []);
  const pool = allMessages().filter(m => !off.has(m.id) && (m.sc === "x" || (pl[m.sc] || []).length)); if (!pool.length) return [];
  const out = []; for (let i = 0; i < n; i++) { const m = pool[Math.floor(Math.random() * pool.length)]; const L = m.sc === "x" ? {} : pl[m.sc][Math.floor(Math.random() * pl[m.sc].length)];
    out.push(String(m.t).replace(/\{g\}/g, L.g || "").replace(/\{s\}/g, L.s || "").replace(/\{p\}/g, L.p || "")); }
  return [...new Set(out)];
}
export async function saveTicker(fn) { if (!game.user.isGM) return; const c = tickerCfg(); fn(c); await game.settings.set(MOD, "ticker", c); }
export const newMsg = (sc, t) => ({ id: `c${uid()}`, sc, t });
