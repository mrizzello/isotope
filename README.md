# Isotope

**Isotope** est une application web progressive (PWA) éducative conçue pour faciliter l'apprentissage et la révision de concepts clés en chimie par le jeu. L'application cible les étudiants et passionnés de chimie en entraînant leurs automatismes (charges des ions, structures de Lewis, familles de composés, formules chimiques, etc.) à travers une suite de mini-jeux ludiques et interactifs.

---

## 🚀 Fonctionnalités principales

### 1. Bibliothèque de Mini-Jeux Chimiques
Isotope propose **8 jeux interactifs** et **2 modules utilitaires** (dans l'ordre du menu) :

*   **Structure de Lewis (`/lewis`)** : Retrouvez la structure de Lewis d'un élément parmi 8 propositions disposées en cercle autour de lui (le groupe est indiqué en chiffre romain). La difficulté augmente par paliers de groupes (I–III, puis IV–V, puis VI–VIII). Chaque erreur ajoute **+3 s** au chrono.
*   **Charges (`/charges`)** : Trouvez la charge correcte (signe et valeur) de 10 ions de difficulté croissante (paliers 3/3/2/2, sans métaux de transition). Les 4 charges proposées forment une arche au-dessus de la formule, et le fond « batterie » se remplit au fil des réponses. Chaque erreur ajoute **+3 s** au chrono.
*   **Associations (`/associations`)** : Associez les formules chimiques des ions avec leurs noms correspondants.
*   **Memorion (`/memorion`)** : Un jeu de mémoire de type Memory où vous devez associer des paires d'ions (Formule ↔ Nom).
*   **Trivion (`/trivion`)** : Trouvez le nom d'un ion parmi 4 cartes reliées à sa formule comme les atomes d'une molécule. 10 ions de difficulté croissante (paliers 3/3/2/2), avec le groupe en indice et sans pénalité de temps.
*   **Le jeu des familles (`/family`)** : Identifiez à quelle famille chimique (oxydes, acides, sels, etc.) appartient le composé proposé.
*   **Family Rush (`/family-rush`)** : Des composés tombent du ciel sur 4 couloirs : cliquez sur un composé, puis sur le bac de sa famille avant qu'il ne touche le sol. La partie dure 60 secondes.
    *   *Règles de bonus :* 5 bonnes réponses rapides d'affilée (≤ 3 s chacune) augmentent le multiplicateur, jusqu'à **×3**. Une erreur le ramène à ×1. Une molécule « surcharge », plus rapide, rapporte **5 points supplémentaires**.
    *   En cas d'erreur, le bon bac clignote en vert et le mauvais est bloqué 1 seconde.
*   **HexaIons (`/hexaions`)** : Jeu de plateau stratégique sur grille hexagonale où vous jouez contre un robot. Posez des cations et des anions pour former des molécules électriquement neutres (charge nette de 0).
    *   *Règles de bonus :* Les sels acides rapportent **3 points supplémentaires**, et les molécules de 3 ions ou plus rapportent **2 points supplémentaires**.
*   **Horloge Chimique (`/clock`)** : Une horloge numérique originale où les heures et les minutes sont affichées sous la forme des noms des éléments chimiques correspondants à leur numéro atomique (ex. : 6h15 s'affiche comme "Carbone : Phosphore").
*   **Pictiochimie (`/pictiochimie` & `/pictiochimie-score`)** : Un outil de type Pictionary pour la chimie avec un tableau de score séparé (`/pictiochimie-score`) ouvrable dans un autre onglet pour animer des sessions de dessin en classe.

### 2. Support PWA & Mises à jour en tâche de fond
*   L'application est entièrement installable sur mobile et ordinateur sous forme de **Progressive Web App (PWA)**.
*   Le service `UpdateService` (basé sur `SwUpdate` d'Angular) détecte automatiquement les nouvelles versions publiées en ligne. Une boîte de dialogue de confirmation propose alors de mettre à jour, et la page se recharge si l'utilisateur accepte.

### 3. Persistance des scores
*   Sauvegarde locale des meilleurs scores et bilans cumulés de victoires/défaites (notamment pour HexaIons) grâce à l'utilisation du stockage local (`localStorage`).
*   La page **Scores (`/scores`)** affiche les records dans l'ordre du menu et propose un bouton **« Réinitialiser les scores »**.

---

## 🛠️ Architecture Technique

L'application est développée en **Angular 21** et s'appuie sur la bibliothèque de composants **Angular Material**.

### Structure du projet

```text
src/app/
├── components/          # Composants UI partagés
│   ├── confirm-dialog/  # Boîte de dialogue de confirmation (mise à jour, réinitialisation des scores)
│   ├── introduction/    # Écran d'accueil et consignes des mini-jeux
│   ├── lewis-structure/ # Rendu visuel d'une structure de Lewis
│   ├── score-stars/     # Évaluation visuelle du score (étoiles)
│   ├── show-results/    # Écran de fin de jeu avec affichage du score et du GIF
│   └── stopwatch/       # Chronomètre global pour les jeux chronométrés
├── games/               # Code source individuel des 8 mini-jeux
│   ├── associations/
│   ├── charges/
│   ├── family/
│   ├── family-rush/     # Contient également le fichier de logique family-rush.logic.ts
│   ├── hexaions/        # Contient également le fichier de logique hexaions.logic.ts
│   ├── lewis/
│   ├── memorion/
│   └── trivion/
├── pages/               # Pages globales de l'application
│   ├── clock/           # Horloge chimique
│   ├── home/            # Page d'accueil
│   ├── infos/           # Page d'informations et crédits
│   ├── pictiochimie/    # Module pictionary de chimie
│   ├── pictiochimie-score/ # Tableau de score du Pictiochimie (à ouvrir dans un autre onglet)
│   └── scores/          # Tableau récapitulatif des records
├── services/            # Services Angular transversaux
│   ├── data.service.ts         # Chargement asynchrone des données JSON au démarrage
│   ├── introduction.service.ts # Affichage de l'écran d'introduction des jeux
│   ├── scores.service.ts       # Gestion de la persistance locale des scores
│   ├── show-results.service.ts # Affichage de l'écran de fin de partie
│   ├── stopwatch.service.ts    # Service de chronométrage (avec pénalités de temps)
│   └── update.service.ts       # Détection des nouvelles versions de la PWA
└── pipes/               # Pipes personnalisés (ex: safeHtml)
```

### Données de l'application (`src/assets/data/`)
Les données des éléments chimiques et des exercices sont stockées sous forme de fichiers statiques JSON :
*   `elements.json` : Informations sur la table périodique des éléments (numéro atomique, nom, etc.).
*   `ions.json` : Liste des cations et anions avec leurs formules et noms.
*   `hexaions.json` : Liste des ions autorisés dans le jeu HexaIons.
*   `lewis.json` : Structures de Lewis des molécules et atomes.
*   `family.json` : Familles de composés (utilisé par le jeu des familles et Family Rush).
*   `pictiochimie.json` : Mots de vocabulaire classés par catégories pour le Pictionary.
*   `success.json` : Phrases de félicitations et liens de GIFs animés pour récompenser le joueur.

---

## ⚙️ Installation & Démarrage

### Prérequis
*   [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
*   [Angular CLI](https://github.com/angular/angular-cli) (installé globalement ou exécuté via `npx`)

### Démarrage local

1.  Clonez le dépôt du projet :
    ```bash
    git clone <depot-url>
    cd isotope
    ```
2.  Installez les dépendances :
    ```bash
    npm install
    ```
3.  Lancez le serveur de développement :
    ```bash
    npm run start
    # ou
    ng serve
    ```
4.  Ouvrez votre navigateur sur `http://localhost:4200/`.

### Construction pour la production

Pour générer les fichiers optimisés de production (compilés AOT, avec génération du Service Worker) :
```bash
npm run build
# ou
ng build
```
Les fichiers générés se trouveront dans le répertoire `dist/isotope/`.

### Lancement des tests unitaires

Exécutez la suite de tests unitaires via Karma :
```bash
npm run test -- --watch=false
# ou
ng test
```
