# 🧪 Guide de Test - Système de Gestion des Candidatures

## Comment Tester les Nouvelles Fonctionnalités

### 🎯 Prérequis
1. Lancer l'application Angular : `ng serve`
2. Ouvrir la console du navigateur (F12) pour voir les logs des emails simulés

---

## Test 1 : Mise à Jour de Statut Unique

### Objectif
Vérifier que le changement de statut d'un candidat envoie un email automatiquement.

### Étapes
1. Se connecter en tant que RH
2. Aller sur `/candidatures`
3. Ouvrir la console navigateur (F12)
4. Cliquer sur une carte candidat pour ouvrir son profil
5. Dans le profil, changer le statut manuellement via le code suivant dans la console :

```typescript
// Dans la console du navigateur
const candidateService = document.querySelector('app-profil').__ngContext__[8].candidateService;
candidateService.updateCandidateStatus(
  '1',  // ID du candidat Sophie Martin
  'preselectionne',
  'Votre profil nous intéresse beaucoup !',
  'RH Manager'
);
```

### Résultat Attendu
```
📧 Envoi d'email à: sophie.martin@email.fr
   Statut: Nouveau → Présélectionné
✓ Email envoyé à Sophie Martin
```

---

## Test 2 : Mise à Jour en Masse (Bulk Update)

### Objectif
Tester la sélection multiple et l'envoi d'emails en masse.

### Étapes
1. Aller sur `/candidatures`
2. Cliquer sur le bouton **"Sélectionner"** (en haut à droite)
3. Cocher 3-5 candidats dans le Kanban
4. Observer la barre flottante apparaître en bas
5. Sélectionner un nouveau statut : **"Présélectionné"**
6. Ajouter un commentaire : "Félicitations pour votre profil !"
7. S'assurer que **"Envoyer les emails"** est coché
8. Cliquer sur **"Appliquer"**
9. Observer la console navigateur

### Résultat Attendu
```
📧 Envoi en masse de 3 emails...
  ✓ Email envoyé à Sophie Martin (sophie.martin@email.fr)
  ✓ Email envoyé à Thomas Dubois (thomas.dubois@email.fr)
  ✓ Email envoyé à Marie Petit (marie.petit@email.fr)
✓ 3 emails envoyés, 0 échecs
✓ Opération terminée
3 candidature(s) mise(s) à jour
📧 3 email(s) envoyé(s) en masse
```

---

## Test 3 : Génération de Lien de Suivi

### Objectif
Générer un token unique et tester l'accès à la page de suivi.

### Étapes
1. Dans la console du navigateur, exécuter :

```typescript
// Générer un token pour un candidat
const candidateService = /* obtenir le service depuis l'injection */;
const token = candidateService.generateTrackingToken('1');
console.log('Token généré:', token);
console.log('URL de suivi:', `${window.location.origin}/candidat/suivi/${token}`);
```

2. Copier l'URL générée
3. Ouvrir un nouvel onglet (navigation privée recommandée)
4. Coller l'URL : `http://localhost:4200/candidat/suivi/[token]`

### Résultat Attendu
- Page de suivi s'affiche avec :
  - ✅ Nom du candidat : "Bonjour Sophie Martin ! 👋"
  - ✅ Statut actuel avec badge coloré
  - ✅ Historique des changements (timeline)
  - ✅ Section documents (vide initialement)
  - ✅ Informations de contact

---

## Test 4 : Upload de Document par le Candidat

### Objectif
Tester l'upload de document depuis la page de suivi.

### Étapes
1. Accéder à la page de suivi (test 3)
2. S'assurer que le candidat est en statut "présélectionné" ou "en_attente_documents"
3. Cliquer sur **"Ajouter un document"**
4. Sélectionner un fichier (PDF, Word, etc.)
5. Choisir le type : **"Demande de stage"**
6. Cliquer sur **"Uploader"**

### Résultat Attendu
- Document apparaît dans la liste avec :
  - ✅ Nom du fichier
  - ✅ Type : "Demande de stage"
  - ✅ Date d'upload
  - ✅ Badge statut : "Soumis"
  - ✅ Bouton de téléchargement

---

## Test 5 : Validation et Signature de Document par le RH

### Objectif
Valider un document soumis et signer une convention.

### Étapes pour Validation

1. Se connecter en tant que RH
2. Ouvrir le profil d'un candidat ayant uploadé un document
3. Dans la section documents, voir le document avec statut "Soumis"
4. Cliquer sur l'icône **✓ (Valider)**
5. Le statut change à **"Validé"**

### Étapes pour Signature

1. RH clique sur **"Ajouter un document"**
2. Upload une convention de stage (PDF)
3. Type : **"Convention de stage"**
4. Le document apparaît avec un bouton **"✍️ Signer"**
5. Cliquer sur **"Signer"**
6. Le document passe à statut **"Signé"** avec badge vert

### Résultat Attendu
```
Document validé ✓
Document signé par RH Manager ✓
Badge "✓ Signé" visible
```

---

## Test 6 : Historique des Changements de Statut

### Objectif
Vérifier que l'historique est correctement enregistré.

### Étapes
1. Changer le statut d'un candidat plusieurs fois :
   - Nouveau → Présélectionné
   - Présélectionné → En attente documents
   - En attente documents → Documents reçus
   - Documents reçus → Entretien programmé

2. Ouvrir la page de suivi du candidat
3. Observer la timeline

### Résultat Attendu
- Timeline avec 4 étapes :
  - ✅ Chaque changement avec date/heure
  - ✅ Commentaires affichés (si ajoutés)
  - ✅ Badge "📧 Email envoyé" visible
  - ✅ Statut actuel surligné

---

## Test 7 : Emails de Notification (Contenu)

### Objectif
Vérifier le contenu des emails générés.

### Étapes
1. Dans la console, après un changement de statut, exécuter :

```typescript
// Récupérer le service de notifications
const notificationService = /* obtenir depuis l'injection */;

// Préparer un email de test
const email = {
  to: 'test@example.com',
  candidateName: 'Sophie Martin',
  previousStatus: 'nouveau',
  newStatus: 'preselectionne',
  trackingUrl: 'http://localhost:4200/candidat/suivi/abc123',
  comment: 'Votre profil correspond parfaitement !',
  documents: []
};

// Générer le HTML
const html = notificationService.generateEmailContent(email);
console.log(html);
```

2. Copier le HTML généré
3. Créer un fichier `test-email.html`
4. Coller le contenu
5. Ouvrir dans un navigateur

### Résultat Attendu
- Email HTML avec :
  - ✅ Header coloré (gradient violet)
  - ✅ Message de bienvenue
  - ✅ Badge de statut coloré : "Présélectionné"
  - ✅ Message personnalisé : "🎉 Félicitations ! Votre profil a retenu notre attention..."
  - ✅ Commentaire affiché
  - ✅ Bouton "📋 Suivre ma candidature"
  - ✅ Signature "L'équipe Ressources Humaines"

---

## Test 8 : Sélection Multiple avec Filtres

### Objectif
Tester la sélection en masse avec différents critères.

### Scénario : Rejeter tous les candidats avec score < 60

### Étapes
1. Aller sur `/candidatures`
2. Activer le mode sélection
3. (Simuler) Sélectionner tous les candidats dans la colonne "Nouveau"
4. Statut → **"Rejeté"**
5. Commentaire : "Profil ne correspond pas aux critères requis"
6. Cocher "Envoyer les emails"
7. Appliquer

### Résultat Attendu
```
📧 Envoi en masse de X emails...
  ✓ Email envoyé à Candidat1 (email1@...)
  ✓ Email envoyé à Candidat2 (email2@...)
  ...
✓ X candidature(s) mise(s) à jour
📧 X email(s) envoyé(s) en masse
```

---

## Test 9 : Navigation et Persistance

### Objectif
Vérifier que les données persistent durant la session.

### Étapes
1. Effectuer des changements de statut
2. Rafraîchir la page (F5)
3. Retourner sur `/candidatures`
4. Vérifier que les candidats sont dans les bonnes colonnes
5. Ouvrir un profil candidat
6. Vérifier que l'historique est présent

### Résultat Attendu
- ⚠️ **Note** : En développement, les données sont en mémoire
- Les modifications persistent durant la session
- Après rechargement complet de l'application, retour aux données demo

---

## Test 10 : Téléchargement de Document Signé

### Objectif
Le candidat télécharge sa convention signée.

### Étapes
1. RH signe une convention (Test 5)
2. Candidat accède à sa page de suivi
3. Voir le document "Convention de stage" avec badge "✓ Signé"
4. Cliquer sur l'icône de téléchargement
5. Le fichier est téléchargé

### Résultat Attendu
- ✅ Téléchargement du fichier
- ✅ Nom du fichier correct
- ✅ Contenu préservé

---

## 🔍 Points de Vérification

### Console Navigateur
Lors des tests, surveiller la console pour :
- ✅ Logs d'envoi d'emails
- ✅ Erreurs éventuelles
- ✅ Confirmations de succès

### Interface Utilisateur
- ✅ Badges de statut avec bonnes couleurs
- ✅ Transitions fluides
- ✅ Feedback visuel (cartes sélectionnées)
- ✅ Barre flottante apparaît/disparaît
- ✅ Messages de succès/erreur

### Données
- ✅ Historique complet enregistré
- ✅ Emails marqués comme envoyés
- ✅ Documents avec bons statuts
- ✅ Tokens uniques générés

---

## 🐛 Debugging

### Accéder aux Services depuis la Console

```typescript
// Obtenir le CandidateService
const getCandidateService = () => {
  const appRoot = document.querySelector('app-root');
  return appRoot.__ngContext__[8].get(CandidateService);
};

// Obtenir le NotificationService
const getNotificationService = () => {
  const appRoot = document.querySelector('app-root');
  return appRoot.__ngContext__[8].get(NotificationService);
};

// Obtenir le DocumentService
const getDocumentService = () => {
  const appRoot = document.querySelector('app-root');
  return appRoot.__ngContext__[8].get(DocumentService);
};

// Utilisation
const candidateService = getCandidateService();
const candidates = candidateService.candidatesSubject.value;
console.log('Tous les candidats:', candidates);
```

### Vérifier l'Historique d'un Candidat

```typescript
const candidateService = getCandidateService();
const candidate = candidateService.getCandidateById('1');
console.log('Historique:', candidate.statusHistory);
console.log('Documents:', candidate.documents);
console.log('Token:', candidate.trackingToken);
```

### Vérifier la Queue d'Emails

```typescript
const notificationService = getNotificationService();
const emailQueue = notificationService.getEmailQueue();
console.log('Emails en attente:', emailQueue);
```

---

## 📊 Metrics de Test

Après tous les tests, vérifier :

- [ ] ✅ Mise à jour de statut unique fonctionne
- [ ] ✅ Emails automatiques envoyés
- [ ] ✅ Mise à jour en masse (5+ candidats)
- [ ] ✅ Emails en masse sans erreur
- [ ] ✅ Token unique généré
- [ ] ✅ Page de suivi accessible
- [ ] ✅ Upload de documents fonctionnel
- [ ] ✅ Validation/rejet de documents
- [ ] ✅ Signature de convention
- [ ] ✅ Téléchargement de documents
- [ ] ✅ Historique complet affiché
- [ ] ✅ Timeline avec toutes les étapes
- [ ] ✅ Interface responsive
- [ ] ✅ Aucune erreur dans la console

---

## 🎯 Test de Performance

### Scénario : 100 Candidats

1. Générer 100 candidats dans le service
2. Sélectionner tous
3. Changer le statut en masse
4. Mesurer le temps d'exécution

```typescript
console.time('Bulk Update');
candidateService.bulkUpdateStatus({
  candidateIds: [...100 IDs],
  newStatus: 'preselectionne',
  sendEmail: true
}).subscribe(() => {
  console.timeEnd('Bulk Update');
});
```

### Résultat Attendu
- Temps < 3 secondes pour 100 candidats
- Interface reste réactive
- Pas de freeze du navigateur

---

✅ **Tous les tests passent = Fonctionnalité prête pour la production !**

*Note : En production, remplacer les simulations par de vrais appels API et service d'emailing.*
