# 📋 Système de Gestion des Documents et Statuts de Candidature

## Vue d'ensemble

Ce système implémente une gestion complète des candidatures avec :
- **Gestion de documents** (upload, signature, validation)
- **Suivi de statut** avec historique complet
- **Notifications email automatiques** à chaque changement de statut
- **Lien unique de suivi** pour chaque candidat
- **Mise à jour de statut en masse** pour gérer efficacement +1000 candidatures

## 🎯 Fonctionnalités principales

### 1. Gestion des Statuts de Candidature

#### Statuts disponibles :
- `nouveau` - Candidature reçue
- `preselectionne` - Profil retenu
- `en_attente_documents` - Documents requis
- `documents_recus` - Documents reçus et en vérification
- `entretien_programme` - Entretien planifié
- `entretien_realise` - Entretien terminé
- `test_technique` - Test en cours
- `validation_finale` - Validation direction
- `offre_envoyee` - Offre envoyée au candidat
- `offre_acceptee` - Candidat accepté
- `offre_refusee` - Candidat a refusé
- `rejete` - Candidature rejetée
- `abandonne` - Pas de réponse du candidat

### 2. Changement de Statut en Masse

Pour gérer efficacement des centaines de candidatures :

```typescript
// Sélectionner plusieurs candidats dans l'interface Kanban
// Utiliser le composant BulkStatusUpdateComponent

const bulkChange: BulkStatusChange = {
  candidateIds: ['id1', 'id2', 'id3', ...],
  newStatus: 'preselectionne',
  comment: 'Profils intéressants pour notre équipe',
  sendEmail: true  // Envoi automatique des emails
};

candidateService.bulkUpdateStatus(bulkChange).subscribe(result => {
  console.log(`${result.success} candidatures mises à jour`);
  console.log(`${result.failed} échecs`);
});
```

**Avantages :**
- ✅ Interface de sélection multiple dans le Kanban
- ✅ Envoi d'emails en masse sans blocage de l'interface
- ✅ Commentaire personnalisé inclus dans chaque email
- ✅ Historique complet pour chaque candidat
- ✅ Traitement en arrière-plan

### 3. Notifications Email Automatiques

Chaque changement de statut déclenche automatiquement un email :

```typescript
// Automatique lors du changement de statut
candidateService.updateCandidateStatus(
  candidateId, 
  'preselectionne',
  'Votre profil correspond parfaitement',
  'RH Manager'
);
// → Email envoyé automatiquement avec le nouveau statut
```

**Contenu des emails :**
- 📊 Nouveau statut avec couleur distinctive
- 💬 Message personnalisé selon le statut
- 🔗 Lien unique de suivi de candidature
- 📎 Liste des documents disponibles
- ✉️ Commentaire du RH (optionnel)

### 4. Lien Unique de Suivi

Chaque candidat reçoit un lien unique pour suivre sa candidature :

```
https://votre-site.com/candidat/suivi/xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

**Le candidat peut :**
- 📊 Voir le statut actuel de sa candidature
- 📜 Consulter l'historique complet des changements
- 📎 Déposer des documents demandés
- 💾 Télécharger les documents signés (convention de stage)
- 📧 Voir si des emails ont été envoyés

**Génération du token :**
```typescript
const token = candidateService.generateTrackingToken(candidateId);
const trackingUrl = `${window.location.origin}/candidat/suivi/${token}`;
// Envoyer ce lien par email au candidat
```

### 5. Gestion des Documents

#### Types de documents :
- `cv` - Curriculum Vitae
- `lettre_motivation` - Lettre de motivation
- `demande_stage` - Demande de stage (candidat)
- `convention_stage` - Convention de stage (RH)
- `convention_signee` - Convention signée (RH)
- `attestation` - Attestations diverses
- `autre` - Autres documents

#### Workflow des documents :

1. **Candidat dépose une demande de stage** (statut: `soumis`)
2. **RH valide le document** (statut: `valide`)
3. **RH dépose la convention de stage** (statut: `soumis`)
4. **RH signe la convention** (statut: `signe`)
5. **Candidat télécharge la convention signée**

```typescript
// Upload d'un document par le candidat
documentService.uploadDocument(
  candidateId,
  file,
  'demande_stage',
  'candidate'
).subscribe(document => {
  console.log('Document uploadé:', document);
});

// Signature par le RH
documentService.signDocument(
  candidateId,
  documentId,
  'RH Manager'
);
```

## 🚀 Utilisation

### Interface RH - Gestion en Masse

1. **Ouvrir la page Candidatures** (`/candidatures`)
2. **Activer le mode sélection** (bouton "Sélectionner")
3. **Cocher les candidats** à traiter
4. **Choisir le nouveau statut** dans le menu déroulant
5. **Ajouter un commentaire** (optionnel)
6. **Cocher "Envoyer les emails"** (recommandé)
7. **Cliquer sur "Appliquer"**

→ Les emails sont envoyés en masse en arrière-plan !

### Interface Candidat - Suivi

Le candidat clique sur le lien unique reçu par email :
```
https://votre-site.com/candidat/suivi/abc123...
```

Il accède à :
- Son statut actuel
- L'historique complet
- Ses documents
- La possibilité d'uploader des documents si demandés

## 📊 Structure des Données

### StatusChange
```typescript
interface StatusChange {
  id: string;
  previousStatus: CandidateStatus | null;
  newStatus: CandidateStatus;
  changedBy: string;
  changedAt: Date;
  comment?: string;
  emailSent: boolean;
  emailSentAt?: Date;
}
```

### CandidateDocument
```typescript
interface CandidateDocument {
  id: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  status: DocumentStatus;
  isSigned?: boolean;
  signedBy?: string;
  signedAt?: Date;
}
```

## 🔧 Services Créés

### 1. `DocumentService`
- `uploadDocument()` - Upload un document
- `signDocument()` - Signer un document
- `validateDocument()` - Valider un document
- `rejectDocument()` - Rejeter un document
- `downloadDocument()` - Télécharger un document
- `deleteDocument()` - Supprimer un document

### 2. `NotificationService`
- `sendStatusChangeEmail()` - Envoyer un email
- `sendBulkStatusChangeEmails()` - Envoi en masse
- `generateEmailContent()` - Générer le HTML de l'email

### 3. `CandidateService` (mis à jour)
- `updateCandidateStatus()` - Mettre à jour avec notification
- `bulkUpdateStatus()` - Mise à jour en masse
- `generateTrackingToken()` - Générer un token unique
- `getCandidateByTrackingToken()` - Récupérer par token

## 🎨 Composants Créés

### 1. `BulkStatusUpdateComponent`
Barre flottante pour la mise à jour en masse des statuts.

**Utilisation :**
```html
<app-bulk-status-update
  [selectedCandidates]="getSelectedCandidates()"
  (selectionCleared)="clearSelection()"
  (statusUpdated)="onStatusUpdated()">
</app-bulk-status-update>
```

### 2. `CandidateDocumentsComponent`
Gestion complète des documents d'un candidat.

**Utilisation :**
```html
<app-candidate-documents 
  [candidateId]="candidate.id"
  [isRH]="true"
  [allowUpload]="true"
  [allowDelete]="false">
</app-candidate-documents>
```

### 3. `CandidateTrackingComponent`
Page publique de suivi de candidature (sans authentification).

**Route :**
```typescript
{
  path: 'candidat/suivi/:token',
  component: CandidateTrackingComponent
}
```

## 📧 Template d'Email

Les emails sont automatiquement générés avec :
- Header avec gradient coloré
- Badge de statut avec couleur adaptée
- Message personnalisé selon le statut
- Bouton de lien de suivi
- Liste des documents disponibles
- Informations de contact

## 🔒 Sécurité

- ✅ Les tokens de suivi sont uniques (UUID v4)
- ✅ Route publique pour le suivi (pas besoin de compte)
- ✅ Les documents sont isolés par candidat
- ✅ Historique complet et immuable des changements
- ✅ Traçabilité : qui, quand, quoi

## 🎯 Cas d'Usage

### Scénario 1 : Filtrage massif de 1000+ candidatures

```typescript
// 1. Ouvrir /candidatures
// 2. Activer le mode sélection
// 3. Filtrer les candidats avec score < 60
// 4. Sélectionner tous (Ctrl+A)
// 5. Changer statut → "rejete"
// 6. Commentaire: "Profil ne correspond pas aux critères"
// 7. Envoyer emails → OUI
// 8. Appliquer

// → 1000 emails envoyés en quelques secondes !
```

### Scénario 2 : Pré sélection avec demande de documents

```typescript
// 1. Sélectionner les 50 meilleurs candidats
// 2. Statut → "preselectionne"
// 3. Commentaire: "Merci de déposer votre demande de stage"
// 4. Envoyer emails → OUI
// 5. Appliquer

// → Chaque candidat reçoit un email avec son lien unique
// → Il peut uploader sa demande de stage
// → Le statut passe automatiquement à "documents_recus"
```

### Scénario 3 : Signature des conventions

```typescript
// 1. Candidat accepté : statut = "offre_acceptee"
// 2. RH upload la convention de stage (non signée)
// 3. RH clique sur "Signer" → document signé
// 4. Candidat reçoit email avec notification
// 5. Candidat télécharge la convention signée depuis son espace
```

## 📝 Notes Importantes

- Les emails sont **simulés** en développement (console.log)
- En production, intégrer un vrai service d'emailing (SendGrid, AWS SES, etc.)
- Les documents sont stockés en **Blob URLs** (simulés), utiliser un vrai storage (S3, Azure Blob)
- Le backend doit gérer l'envoi asynchrone des emails via une queue (RabbitMQ, AWS SQS)

## 🚦 Prochaines Étapes

1. **Backend API** pour persistence réelle
2. **Service d'emailing** réel (SendGrid/AWS SES)
3. **Storage de fichiers** (AWS S3/Azure Blob)
4. **Queue system** pour envoi asynchrone
5. **Tests unitaires** et e2e
6. **Monitoring** des emails envoyés

---

✨ **Développé avec Angular 17+ (Standalone Components)**
