# 🎯 Plateforme RH - Gestion des Stages avec Matching Intelligent

Une interface web moderne et professionnelle pour gérer les offres de stage, les candidatures et le recrutement avec un système de **matching intelligent** basé sur l'IA.

## ✨ Fonctionnalités principales

### 🏠 Dashboard
- Vue d'ensemble des KPIs (offres actives, candidatures, top matches)
- Alertes et notifications importantes
- Liste des candidatures prioritaires à traiter
- Statistiques et activité récente

### 📄 Gestion des Offres
- Création et modification d'offres de stage/alternance
- Formulaire multi-étapes (stepper)
- Configuration des critères de matching
- Filtres et recherche avancée
- Statistiques par offre (candidatures, présélections, etc.)

### 📋 Pipeline de Candidatures (Kanban)
- Vue Kanban drag & drop
- 6 colonnes : Nouveau, Présélection, Entretien, Test, Offre, Rejeté
- Cartes candidats avec score et compétences
- Actions rapides (voir profil, planifier entretien, rejeter)

### 🎯 Matching Intelligent (Cœur du système)
- Sélection d'offre et lancement du matching
- **Score sémantique** : analyse du contenu du CV vs description d'offre
- **Score règles** : validation des critères obligatoires (formation, expérience, langues)
- Score total combiné (0-100%)
- **Explications IA** : points forts et manques identifiés
- Panneau de filtres avancés
- Comparateur de candidats (jusqu'à 3)
- Recommandations IA

### 👤 Profil Candidat Détaillé
- Vue 2 colonnes : informations + contenu
- Sections : Résumé, Compétences, Expériences, Projets, Matching, Notes
- Score de matching avec analyse détaillée
- Timeline des événements
- Questions d'entretien suggérées par l'IA
- Gestion du statut et actions (entretien, télécharger CV, rejeter)
- Système de notes et feedback collaboratif

## 🎨 Design System

### Couleurs
- **Primaire** : Bleu indigo (#4F46E5)
- **Succès** : Vert (#10B981)
- **Attention** : Orange (#F59E0B)
- **Danger** : Rouge (#EF4444)
- **Info** : Bleu (#3B82F6)

### Typographie
- Police : **Inter** (Google Fonts)
- Hiérarchie claire : H1 (1.875rem) → H2 (1.5rem) → H3 (1.125rem)
- Taille de base : 14px

### Composants
- Cards avec ombres douces
- Badges et tags colorés
- Boutons : primaire, secondaire, succès, danger
- Score badges circulaires avec code couleur
- Barres de progression
- Skeleton loaders
- Modales et drawers

## 📱 Responsive Design

- **Desktop** : Layout avec sidebar fixe (260px)
- **Tablet** : Adaptation des grilles
- **Mobile** : Sidebar en drawer, topbar compacte, colonnes empilées

## 🚀 Technologies

- **HTML5** : Structure sémantique
- **CSS3** : Design system custom, variables CSS, flexbox/grid
- **JavaScript (Vanilla)** : Interactivité sans framework
- **Google Fonts** : Inter

## 📁 Structure du projet

```
RhManagement/
├── index.html              # Dashboard (page d'accueil)
├── styles/
│   └── main.css           # Design system complet + styles
├── pages/
│   ├── offres.html        # Gestion des offres
│   ├── candidatures.html  # Pipeline Kanban
│   ├── matching.html      # Matching intelligent
│   └── profil.html        # Profil candidat détaillé
├── js/
│   └── app.js             # Logique JavaScript
└── README.md              # Documentation
```

## 🎯 Installation et utilisation

### Installation simple
1. Clonez ou téléchargez le projet
2. Ouvrez `index.html` dans votre navigateur

Aucune installation de dépendances requise ! Le projet fonctionne directement dans le navigateur.

### Utilisation locale
```bash
# Option 1 : Ouvrir directement
open index.html

# Option 2 : Serveur local Python
python -m http.server 8000
# Ouvrir http://localhost:8000

# Option 3 : Live Server (VS Code)
# Installer l'extension "Live Server" et cliquer sur "Go Live"
```

## 🔍 Navigation

### Pages disponibles :
- **/** : Dashboard avec KPIs et alertes
- **/pages/offres.html** : Liste des offres + création
- **/pages/candidatures.html** : Pipeline Kanban
- **/pages/matching.html** : Système de matching intelligent
- **/pages/profil.html** : Profil candidat détaillé

## 💡 Fonctionnalités JavaScript

### Interactivité implémentée :
- ✅ Menu mobile (toggle sidebar)
- ✅ Recherche dynamique
- ✅ Sliders de filtres
- ✅ Drag & drop (Kanban)
- ✅ Système de tags (compétences)
- ✅ Comparaison de candidats
- ✅ Filtres avancés
- ✅ Notifications toast
- ✅ Animations de score
- ✅ Toggle d'explications
- ✅ Changement de statut

### Données de démo :
```javascript
// Accès aux données de test
console.log(window.demoData);
```

## 🎨 Personnalisation

### Modifier les couleurs :
Éditez les variables CSS dans `styles/main.css` :

```css
:root {
  --primary-color: #4F46E5;
  --success: #10B981;
  --warning: #F59E0B;
  --danger: #EF4444;
  /* ... */
}
```

### Ajouter des candidats :
Modifiez `window.demoData` dans `js/app.js`

## ✨ Points forts de l'UX

### Clarté et lisibilité
- Hiérarchie visuelle claire
- Espacement généreux
- Contraste suffisant (WCAG AA)

### Transparence IA
- Explications claires et non-techniques
- Points forts et manques identifiés
- Méthodologie visible ("Basé sur...")

### Performance
- Skeleton loaders pour les chargements
- Transitions douces (200ms)
- Pas de framework lourd

### Accessibilité
- Navigation au clavier
- Labels clairs
- États visuels distincts (hover, focus, active)

## 🔮 Évolutions possibles

### Backend (à implémenter) :
- [ ] API REST pour gérer les données
- [ ] Base de données (PostgreSQL/MongoDB)
- [ ] Authentification et gestion des rôles
- [ ] Système de matching réel (embeddings + ML)
- [ ] Upload de CV et parsing automatique
- [ ] Génération de rapports PDF
- [ ] Emails automatiques
- [ ] Intégration calendrier (Google Calendar, Outlook)

### Frontend :
- [ ] Mode sombre
- [ ] Recherche avancée avec filtres sauvegardés
- [ ] Export Excel/CSV des candidats
- [ ] Graphiques interactifs (Chart.js)
- [ ] Chat entre recruteurs
- [ ] Notifications temps réel (WebSocket)
- [ ] PWA (Progressive Web App)

## 📊 Matching Intelligent - Détails

### Calcul du score (conceptuel) :

**Score sémantique (50%)** :
- Analyse du contenu du CV et de l'offre par embeddings
- Similarité cosinus entre les vecteurs
- Pondération : compétences (40%) + expérience (30%) + formation (20%) + projets (10%)

**Score règles (50%)** :
- Critères obligatoires : compétences, niveau d'étude, langues, années d'expérience
- Chaque critère validé = points
- Pénalité si critère manquant

**Score final** = (Score sémantique × 0.5) + (Score règles × 0.5)

### Explications générées :
- Top 3 points forts (basés sur les matches)
- Top 2 manques/risques (basés sur les gaps)
- Recommandations contextuelles

## 🤝 Contributions

Ce projet est un prototype UI/UX. Les contributions sont les bienvenues pour :
- Améliorer l'accessibilité
- Optimiser les performances
- Ajouter des animations
- Créer de nouvelles pages (Calendrier, Paramètres, etc.)

## 📝 Licence

Projet de démonstration - Libre d'utilisation et de modification

## 👤 Auteur

Conçu pour une plateforme RH moderne avec système de matching intelligent

---

**🎯 Objectif** : Simplifier le recrutement avec une interface intuitive et un système de matching transparent qui aide les RH à prendre de meilleures décisions, plus rapidement.
