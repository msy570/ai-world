# AI World V19 — Epoch Frontiers

AI World est un sandbox autonome de civilisations jouable directement dans le navigateur.

## V19 — Epoch Frontiers

Cette version se concentre sur la lisibilité de la carte, les frontières dynamiques, la démographie, la personnalisation et l'évolution visuelle des civilisations.

### Génération du monde
- Bouton **Nouveau monde aléatoire**.
- Bouton **Régénérer cette graine**.
- Champ de graine visible.
- Bouton **Nouvelles ressources** pour redistribuer les ressources et recalculer les points stratégiques.
- Le bouton `🗺 Nouveau monde` de la barre d'outils fonctionne à nouveau.
- Réglages des océans, du relief, de l'humidité, de la température, des rivières, des ressources et de la taille du monde.

### Civilisations personnalisables
- 1 à 8 civilisations.
- Nom, couleur, style et doctrine.
- Intelligence, agressivité, coopération, discipline, curiosité et fertilité configurables.
- **Nombre d'habitants réglable individuellement pour chaque civilisation avant le scénario.**
- Dans une partie en cours, un seul champ `Habitants` permet de fixer directement la population.
- Suppression des anciens paramètres artificiels de population minimale / maximale.

### Démographie et fertilité V2
- Vieillissement basé sur les années réellement simulées au lieu du nombre de ticks.
- Grossesses basées sur les jours simulés.
- Formation des couples recalibrée.
- Fertilité influencée par les individus et la civilisation.
- Nourriture, logement, stabilité, santé et stress influencent les naissances sans imposer de plafond arbitraire.
- Bonus naturel de renouvellement pour les petites populations et les populations vieillissantes.
- Les enfants héritent partiellement des caractéristiques de leurs parents.
- Les colonies de départ possèdent désormais suffisamment d'agriculture pour éviter l'effondrement automatique.
- Indicateur de renouvellement démographique dans les paramètres de civilisation.

### Apparence des PNJ
- Taille visuelle par défaut portée à **140 %**.
- Couleur principale de tenue.
- Couleur d'accent.
- Styles : adapté à l'époque, civil, travailleur, savant, militaire, officiel.
- Motifs : uni, bordures, bande, bicolore.
- Couvre-chefs : automatique, aucun, bonnet/casquette, capuche, casque, chapeau.
- Les vêtements changent visuellement selon l'époque de la civilisation.
- Les rôles influencent automatiquement la tenue lorsque le mode `Adapté à l'époque` est utilisé.

### Architecture selon les époques
Les mêmes fonctions de bâtiment changent d'apparence avec la civilisation :

- logements tribaux en matériaux naturels ;
- maisons antiques en pierre/enduit ;
- maisons médiévales à colombages ;
- logements industriels en briques ;
- bâtiments modernes en béton/verre ;
- architecture avancée plus technologique.

Les hôpitaux, bâtiments gouvernementaux, fermes, casernes/bases militaires, usines, laboratoires, centrales et infrastructures avancées possèdent aussi des variantes visuelles adaptées à l'époque.

### Passage à une nouvelle époque
Lorsqu'une civilisation entre dans une nouvelle ère :

- une onde visuelle apparaît depuis son centre principal ;
- le nom de la nouvelle époque est affiché sur la carte ;
- les textures des bâtiments changent immédiatement ;
- les vêtements automatiques s'adaptent à la nouvelle époque ;
- l'événement est inscrit dans l'histoire.

### Frontières V3
- Les frontières dépendent des villes, de leur population, de leur prospérité et de leur défense.
- Les montagnes et autres terrains difficiles ralentissent l'expansion territoriale.
- Les murs bloquent la propagation territoriale.
- Les points stratégiques contrôlés agissent comme de petits foyers d'influence.
- Les frontières se déplacent après les conquêtes, l'évolution des villes et la prise de positions stratégiques.
- Les frontières contestées sont visuellement différentes.

### Points stratégiques
Le jeu détecte automatiquement les zones importantes selon :

- densité de minerai ;
- pétrole ;
- terres fertiles ;
- bois ;
- richesse des villes.

Chaque zone possède une valeur stratégique.

Les armées peuvent prendre le contrôle de ces positions. Leur capture modifie la frontière locale et génère un événement historique.

L'IA diplomatique prend désormais en compte ces zones : une civilisation expansionniste, militariste ou agressive peut déclarer une guerre pour obtenir une région riche au lieu de combattre sans objectif précis.

### Guerre et objectifs
- Une guerre peut enregistrer un objectif stratégique.
- Les armées se dirigent d'abord vers le point stratégique convoité.
- Après sa capture, elles poursuivent vers les villes ennemies.
- Les captures de villes conservent le système de résistance, assimilation et réfugiés de la V18.

### Carte plus lisible
- **Rivières : bleu continu.**
- **Routes commerciales : vert pointillé.**
- Routes terrestres : brun/beige.
- Points stratégiques : zones dorées.
- Frontières contestées clairement distinctes.
- Les rivières et les points stratégiques peuvent être masqués séparément.
- Les points stratégiques apparaissent aussi sur la minimap.

### Légende déployable
Le bouton `🧭 Légende` explique directement sur la carte :

- frontières ;
- frontières contestées ;
- rivières ;
- routes ;
- commerce ;
- murs ;
- points stratégiques ;
- armées ;
- ressources.

### Sauvegarde / replay
- Sauvegardes V19 séparées dans IndexedDB (`ai-world-v19`).
- Les points stratégiques et leurs propriétaires sont sauvegardés dans les replays.
- Compatibilité de chargement avec les données manquantes d'anciennes sauvegardes grâce aux valeurs par défaut.

## Contrôles
- `Espace` : pause / lecture
- `F` : vue monde
- `Échap` : revenir à la sélection
- `1` : ×1
- `2` : ×5
- `3` : ×10
- `4` : ×25
- `5` : ×100
- Molette : zoom
- Clic droit / molette maintenue : déplacer la caméra

## Validation effectuée
- Vérification de syntaxe JavaScript avec Node.js.
- Aucun ID HTML en double.
- Aucune référence DOM manquante.
- Smoke test du moteur.
- Test des 12 presets.
- Test démographique accéléré sur environ 25 années simulées.
- Test démographique accéléré sur environ 100 années simulées : la civilisation testée ne s'éteint pas.

## Installation GitHub Pages
Décompresse le ZIP et place `index.html`, `style.css`, `game.js` et `README.md` à la racine du dépôt.
