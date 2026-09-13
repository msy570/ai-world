# AI World V16 — Smart History

V16 corrige surtout le spam d'événements et les ralentis permanents en ×100 / 1 jour, puis optimise fortement la simulation.

## Histoire intelligente
- fréquences automatiques beaucoup plus longues : ~10 ans, ~5 ans, ~2 ans ou ~9 mois ;
- un passage du planificateur peut produire une période calme ;
- ralentis avec mode Intelligent ;
- protection haute vitesse : en ×25–×100, seuls les événements réellement historiques peuvent interrompre ;
- délai réel minimum entre deux cinématiques ;
- les événements non montrés restent dans le journal et apparaissent dans un bandeau non bloquant.

## Politique corrigée
Les coups d'État ne dépendent plus simplement de l'agressivité. Le moteur utilise stabilité, approbation, troubles des villes, usure de guerre, nourriture, humeur et force du dirigeant. Une civilisation barbare peut donc rester politiquement stable.

Après une prise de pouvoir, une période de grâce de plusieurs années empêche la répétition immédiate des coups. Une révolution exige une crise bien plus profonde.

## Événements plus vivants
Les épidémies, famines et sécheresses sont des crises qui durent. Elles évoluent puis se terminent. Les hôpitaux limitent les épidémies et les sécheresses/famines réduisent la production alimentaire. Le monde peut aussi connaître des réformes, célébrations et âges d'or.

## Optimisation
- plus de reconstruction complète de l'interface à chaque micro-tick ;
- simulation détaillée adaptative des PNJ en ×25–×100 ;
- collecte des ressources via index spatial ;
- occupation des villes via index spatial ;
- listes technologies/bâtiments/armes mises en cache ;
- panneaux lourds rafraîchis moins souvent ;
- niveau de détail visuel adaptatif à grande distance ;
- snapshots de replay réservés aux événements importants.

Le mode **Précision maximale** garde tous les calculs détaillés. **Auto** est recommandé. **Performance** est prévu pour les très grosses populations.


## V16.1 — correction du temps
Le calendrier utilise maintenant un compteur absolu de minutes simulées puis reconstruit année, saison, jour et heure.
Cela corrige les valeurs décimales/instables du compteur et les gros sauts mal normalisés.

- Jour affiché clairement comme `Jx/90` dans la saison.
- Heure toujours entière et correctement formatée.
- Les anciennes sauvegardes restent compatibles.
- Les replays conservent le nouveau compteur absolu.
- Le ralenti cinématique avance maintenant à quelques secondes simulées par seconde réelle au lieu de plusieurs minutes.


## V16.2 — date lisible
L'interface affiche désormais une date immédiatement compréhensible :
`📅 Année 12 · Été · Jour 43 · 🕒 08:00`.

Le journal et les replays utilisent eux aussi `Année · Saison · Jour`.


## V17 — Dynamic Realms
Cette version pousse surtout trois axes :

### 1) Monde de départ plus libre
- le nouveau monde n'impose plus 2 civilisations ;
- le joueur peut démarrer avec **1 à 8 civilisations** ;
- les murs de séparation initiaux sont maintenant **optionnels** ;
- le mode scénario permet aussi de choisir séparément le style de territoire initial.

### 2) Territoires améliorés
- les territoires ne sont plus juste des cercles visuels autour des villes ;
- une **carte d'influence** colorée est calculée à partir des villes, de leur population, prospérité, défense et statut de capitale ;
- les frontières sont plus lisibles et plus cohérentes ;
- les captures de villes et fondations de nouvelles villes mettent les frontières à jour.

### 3) Textures et rendu
- PNJ plus détaillés ;
- bâtiments plus détaillés et davantage différenciés selon leur type ;
- routes, murs et ressources légèrement améliorés ;
- couleurs de biomes affinées ;
- rendu plus propre tout en restant léger.

### Nouveaux presets
- Solo / une seule civilisation
- Frontière séparée
- Guerre froide
- Empire émergent
- Monde fracturé
- Âge des catastrophes

### Optimisations
- cache de territoires recalculé seulement quand nécessaire ;
- pas de surcoût important ajouté au rendu ;
- génération de départ mutualisée pour 1 à 8 civilisations.
