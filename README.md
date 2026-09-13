# AI World V18 — Zenith Sandbox

AI World est un sandbox autonome de civilisations dans le navigateur. Le joueur peut créer un monde, placer une ou plusieurs civilisations, les personnaliser, les séparer avec des murs, accélérer le temps et observer l'histoire émerger.

## V18 — Zenith Sandbox

### Sandbox libre
- 1 à 8 civilisations.
- Plus de duo Savants / Barbares imposé.
- Noms, couleurs, styles, doctrines et traits personnalisables avant le lancement.
- Outil `🏳 Peuple ici` pour créer une civilisation exactement où le joueur le souhaite.
- Outil `🏗 Ville ici` pour fonder une ville à un emplacement choisi.
- Murs dessinables en glissant la souris.
- Les murs bloquent réellement les PNJ et influencent l'expansion territoriale.
- Suppression possible jusqu'à une seule civilisation restante.

### Presets
- Solo
- Duel
- 8 tribus primitives
- Archipel
- Frontière séparée
- Guerre froide
- Monde en guerre
- Monde paisible
- Course technologique
- Empire émergent
- Monde fracturé
- Âge des catastrophes

### Territoires
- Expansion territoriale calculée à partir des villes.
- Le relief, les montagnes, les murs, les capitales, la population, la prospérité et la défense influencent les frontières.
- Frontières contestées entre civilisations voisines.
- Mise à jour après fondation ou capture d'une ville.
- Les grandes frontières remplacent les anciens simples cercles autour des villes.

### Conquêtes
- Capture de villes par les armées.
- Résistance locale après occupation.
- Certains habitants restent sous la nouvelle souveraineté.
- D'autres deviennent réfugiés et fuient vers une ville de leur ancienne civilisation.
- Les journaux personnels enregistrent les changements de souveraineté et les exils.

### Économie et commerce
- Stocks locaux de nourriture, bois, minerai, pétrole et biens.
- Production par les bâtiments.
- Routes commerciales dynamiques.
- Échanges de nourriture et de biens entre villes.
- Revenus commerciaux et amélioration progressive des relations entre partenaires.

### Vie et politique
- Familles, couples, naissances, métiers, éducation, fortune et réputation.
- Gouvernements, dirigeants, élections, politiques publiques et coups d'État conditionnels.
- Un gouvernement choisi manuellement peut être verrouillé pour empêcher l'IA de le remplacer automatiquement.
- IA locale des PNJ et IA stratégique des civilisations.

### Histoire
- Journal mondial filtré sur les événements importants.
- Journal personnel par PNJ.
- Discours et rassemblements.
- Cinématiques automatiques intelligentes.
- Protection contre les ralentis permanents à haute vitesse.
- Crises longues : épidémies, famines, sécheresses et autres événements.
- Statistiques historiques et Hall of Fame.
- Replay, export/import et sauvegarde locale.

### Rendu
- PNJ et bâtiments plus détaillés.
- Animation légère des PNJ.
- Routes et ressources améliorées.
- Littoraux plus lisibles.
- Rivières procédurales lissées.
- Cycle jour / nuit.
- Lumières nocturnes.
- Pluie, tempêtes et neige visibles.
- Routes commerciales animées.
- Infobulle au survol de la carte.
- Minimap et caméra libre.

### Performance
- Index spatial pour PNJ, ressources, bâtiments et murs.
- Niveau de détail automatique quand le monde est dézoomé.
- Cadence adaptative des calculs en ×25 / ×50 / ×100.
- Recalcul des territoires et des infrastructures moins fréquent à haute vitesse.
- Économie des villes regroupée par ville au lieu de rescanner inutilement le monde.
- Modes Exact / Auto / Performance.

## Contrôles utiles
- `Espace` : lecture / pause
- `F` : vue monde
- `Échap` : revenir à la sélection
- `1` : ×1
- `2` : ×5
- `3` : ×10
- `4` : ×25
- `5` : ×100
- Molette : zoom
- Clic droit ou molette maintenue : déplacer la caméra

## Installation GitHub Pages
Place simplement `index.html`, `style.css`, `game.js` et `README.md` à la racine du dépôt. GitHub Pages peut servir directement le jeu sans build ni dépendance.
