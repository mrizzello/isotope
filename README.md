# Isotope

**Isotope** est une application web progressive (PWA) éducative conçue pour faciliter l'apprentissage et la révision de concepts clés en chimie par le jeu. L'application cible les étudiants et passionnés de chimie en entraînant leurs automatismes (charges des ions, structures de Lewis, familles de composés, formules chimiques, etc.) à travers une suite de mini-jeux ludiques et interactifs.

---

## 🚀 Fonctionnalités principales

### 1. Bibliothèque de Mini-Jeux Chimiques
Isotope propose **7 jeux interactifs** et **2 modules utilitaires** :

*   **Structure de Lewis (`/lewis`)** : Devinez le nombre d'électrons de valence et la configuration de la structure électronique des éléments.
*   **Charges (`/charges`)** : Entraînez-vous à identifier la charge correcte (signe et magnitude) pour chaque ion proposé.
*   **Associations (`/associations`)** : Associez les formules chimiques des ions avec leurs noms correspondants.
*   **Memorion (`/memorion`)** : Un jeu de mémoire de type Memory où vous devez associer des paires d'ions (Formule ↔ Nom).
*   **Trivion (`/trivion`)** : Un jeu de questions à choix multiples (QCM) où vous devez trouver la bonne formule pour un ion parmi 4 propositions.
*   **Le jeu des familles (`/family`)** : Identifiez à quelle famille chimique (oxydes, acides, sels, etc.) appartient le composé proposé.
*   **HexaIons (`/hexaions`)** : Jeu de plateau stratégique sur grille hexagonale où vous jouez contre un robot. Posez des cations et des anions pour former des molécules électriquement neutres (charge nette de 0). 
    *   *Règles de bonus :* Les sels acides rapportent **3 points supplémentaires**, et les molécules de 3 ions ou plus rapportent **2 points supplémentaires**.
*   **Horloge Chimique (`/clock`)** : Une horloge numérique originale où les heures et les minutes sont affichées sous la forme des noms des éléments chimiques correspondants à leur numéro atomique (ex. : 6h15 s'affiche comme "Carbone : Phosphore").
*   **Pictiochimie (`/pictiochimie` & `/pictiochimie-score`)** : Un outil de type Pictionary pour la chimie avec un tableau de score séparé (`/pictiochimie-score`) ouvrable dans un autre onglet pour animer des sessions de dessin en classe.

### 2. Support PWA & Mises à jour en tâche de fond
*   L'application est entièrement installable sur mobile et ordinateur sous forme de **Progressive Web App (PWA)**.
*   Grâce à l'intégration du service Angular `SwUpdate`, l'application détecte automatiquement les nouvelles versions publiées en ligne et invite l'utilisateur à recharger la page pour appliquer la mise à jour sans perte de données.

### 3. Persistance des scores
*   Sauvegarde locale des meilleurs scores et bilans cumulés de victoires/défaites (notamment pour HexaIons) grâce à l'utilisation du stockage local (`localStorage`).

---

## 🛠️ Architecture Technique

L'application est développée en **Angular 21** et s'appuie sur la bibliothèque de composants **Angular Material**.

### Structure du projet

```text
src/app/
├── components/          # Composants UI partagés
│   ├── introduction/    # Écran d'accueil et consignes des mini-jeux
│   ├── lewis-structure/ # Rendu visuel d'une structure de Lewis
│   ├── score-stars/     # Évaluation visuelle du score (étoiles)
│   ├── show-results/    # Écran de fin de jeu avec affichage du score et du GIF
│   └── stopwatch/       # Chronomètre global pour les jeux chronométrés
├── games/               # Code source individuel des 7 mini-jeux
│   ├── associations/
│   ├── charges/
│   ├── family/
│   ├── hexaions/        # Contient également le fichier de logique hexaions.logic.ts
│   ├── lewis/
│   ├── memorion/
│   └── trivion/
├── pages/               # Pages globales de l'application
│   ├── clock/           # Horloge chimique
│   ├── home/            # Page d'accueil
│   ├── infos/           # Page d'informations et crédits
│   ├── pictiochimie/    # Module pictionary de chimie
│   └── scores/          # Tableau récapitulatif des records
├── services/            # Services Angular transversaux
│   ├── data.service.ts         # Chargement asynchrone des données JSON au démarrage
│   ├── scores.service.ts       # Gestion de la persistance locale des scores
│   ├── stopwatch.service.ts    # Service de chronométrage
│   └── ...
└── pipes/               # Pipes personnalisés (ex: safeHtml)
```

### Données de l'application (`src/assets/data/`)
Les données des éléments chimiques et des exercices sont stockées sous forme de fichiers statiques JSON :
*   `elements.json` : Informations sur la table périodique des éléments (numéro atomique, nom, etc.).
*   `ions.json` : Liste des cations et anions avec leurs formules et noms.
*   `hexaions.json` : Liste des ions autorisés dans le jeu HexaIons.
*   `lewis.json` : Structures de Lewis des molécules et atomes.
*   `family.json` : Familles de composés.
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
