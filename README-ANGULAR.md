# RH Management Platform - Angular

Plateforme RH moderne pour la gestion des stages avec système de matching intelligent.

## 🚀 Technologies

- **Angular 17+** - Framework TypeScript
- **TypeScript** - Langage typé
- **RxJS** - Programmation réactive
- **SCSS** - Styles avec variables CSS
- **Standalone Components** - Architecture modulaire moderne

## 📦 Installation

### Prérequis

- Node.js 18+ et npm
- Angular CLI 17+

### Installation des dépendances

```bash
npm install
```

### Lancer l'application

```bash
npm start
```

L'application sera accessible sur `http://localhost:4200`

## 📁 Structure du projet

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/          # Tableau de bord avec KPIs
│   │   ├── offres/             # Gestion des offres de stage
│   │   ├── candidatures/       # Pipeline Kanban des candidatures
│   │   ├── matching/           # Système de matching intelligent
│   │   └── profil/             # Profil détaillé des candidats
│   ├── services/
│   │   ├── candidate.service.ts    # Gestion des candidats
│   │   ├── offer.service.ts        # Gestion des offres
│   │   └── matching.service.ts     # Algorithme de matching
│   ├── models/
│   │   └── index.ts            # Interfaces TypeScript
│   ├── app.component.ts        # Composant racine avec layout
│   ├── app.routes.ts           # Configuration du routing
│   └── app.config.ts           # Configuration de l'app
├── styles.scss                 # Styles globaux
└── index.html                  # Point d'entrée HTML
```

## 🎨 Fonctionnalités

### 1. Tableau de bord
- KPIs en temps réel (candidats, offres, entretiens)
- Alertes et notifications
- Activité récente
- Candidats prioritaires

### 2. Gestion des offres
- Création d'offres avec formulaire modal
- Filtres par département, statut, localisation
- Statistiques par offre (candidatures, vues)
- Gestion du cycle de vie (brouillon → publié → archivé)

### 3. Pipeline de candidatures (Kanban)
- 6 colonnes de statut :
  - Nouveau
  - Présélection
  - Entretien
  - Test technique
  - Offre envoyée
  - Rejeté
- Cartes de candidat avec score de matching
- Filtres et recherche
- Actions rapides

### 4. Intelligent Matching ⭐
- Sélection d'offre
- Calcul de scores :
  - **Score global** : moyenne pondérée
  - **Score sémantique** : similarité des compétences (simulation embeddings)
  - **Score règles** : critères métier (compétences, expérience, formation)
- Explications détaillées :
  - Points forts
  - Points d'attention
  - Recommandations
- Filtres avancés (score minimum, compétences, disponibilité)
- Tri personnalisable

### 5. Profil candidat
- Informations personnelles et contact
- Onglets :
  - Résumé (formation, langues)
  - Compétences avec niveaux
  - Expériences professionnelles
  - Projets techniques
  - Notes internes
- Actions (accepter, refuser, contacter)

## 🧠 Algorithme de Matching

### Calcul des scores

```typescript
// Score compétences
skillsScore = (compétences matchées / compétences requises) * 100

// Score expérience
experienceScore = min((années exp. / années requises) * 100, 100)

// Score formation
educationScore = niveau correspond ? 100 : 50

// Score projets
projectsScore = min((nb projets / 3) * 100, 100)

// Application des poids
rulesScore = (skillsScore * w1) + (experienceScore * w2) + 
             (educationScore * w3) + (projectsScore * w4)

// Score sémantique (simulation)
semanticScore = rulesScore ± variation aléatoire

// Score global
globalScore = (rulesScore * 0.6) + (semanticScore * 0.4)
```

### Explications générées

Le système génère automatiquement :
- **Points forts** : compétences maîtrisées, expérience pertinente, formation adéquate
- **Points d'attention** : compétences manquantes, expérience limitée
- **Recommandations** : axes d'amélioration suggérés

## 🎨 Design System

### Couleurs principales

```scss
--primary-color: #4F46E5;  // Indigo
--success: #10B981;         // Vert
--warning: #F59E0B;         // Orange
--danger: #EF4444;          // Rouge
--info: #3B82F6;            // Bleu
```

### Composants réutilisables

- **Cards** : conteneurs avec ombre et bordure arrondie
- **Badges** : étiquettes de statut colorées
- **Buttons** : primary, secondary, success, danger
- **Forms** : inputs, selects, textareas stylisés
- **Grids** : système de grille responsive (2, 3, 4 colonnes)
- **KPI Cards** : cartes de statistiques avec icônes
- **Score Badges** : badges circulaires avec gradient de couleur

## 🔄 Services et State Management

### CandidateService
- Gestion de la liste des candidats
- Observable RxJS pour reactive updates
- CRUD operations
- Gestion des notes

### OfferService
- Gestion des offres de stage
- Création, modification, suppression
- Filtrage par statut

### MatchingService
- Calcul des scores de matching
- Génération des explications
- Filtrage des applications par offre

## 🚦 Routing

```typescript
/ → Dashboard
/offres → Gestion des offres
/candidatures → Pipeline Kanban
/matching → Intelligent Matching
/profil/:id → Profil détaillé candidat
```

Toutes les routes utilisent le **lazy loading** pour optimiser les performances.

## 📱 Responsive Design

- **Desktop** : layout complet avec sidebar (> 768px)
- **Tablet** : adaptation des grids (768px - 1024px)
- **Mobile** : sidebar escamotable, grids en 1 colonne (< 768px)

## 🛠️ Commandes utiles

```bash
# Développement
npm start

# Build production
npm run build

# Tests
npm test

# Linter
npm run lint
```

## 📈 Évolution future

### Backend
- API REST avec Node.js/Express
- Base de données PostgreSQL
- Authentification JWT

### Matching avancé
- Intégration réelle d'embeddings (OpenAI, Sentence Transformers)
- Fine-tuning du modèle sur données RH
- A/B testing des algorithmes

### Features supplémentaires
- Calendrier d'entretiens
- Envoi d'emails automatisés
- Export PDF des profils
- Analytics et reporting
- Notifications temps réel (WebSockets)
- Multi-tenant pour plusieurs entreprises

## 📄 Licence

Ce projet est un exemple de démonstration pour une plateforme RH.

---

**Développé avec Angular 17+ et TypeScript** ✨
