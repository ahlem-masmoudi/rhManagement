# 🔌 Guide d'Intégration Backend - API REST

## Vue d'ensemble

Ce guide explique comment transformer les services actuels (qui utilisent des données en mémoire) en services connectés à une vraie API REST.

---

## 🎯 Architecture Cible

```
┌─────────────────┐      HTTP/REST      ┌─────────────────┐
│  Angular App    │ ←─────────────────→ │  Backend API    │
│  (Frontend)     │      JSON           │  (Node.js/NestJS)│
└─────────────────┘                     └─────────────────┘
                                               │
                                               ↓
                              ┌────────────────────────────┐
                              │  PostgreSQL Database       │
                              │  + S3 File Storage         │
                              │  + RabbitMQ Queue          │
                              │  + SendGrid Email          │
                              └────────────────────────────┘
```

---

## 📡 Endpoints API à Implémenter

### 1. Gestion des Candidats

#### GET /api/candidates
Récupérer tous les candidats

```typescript
// Response
{
  "data": [
    {
      "id": "uuid",
      "firstName": "Sophie",
      "lastName": "Martin",
      "email": "sophie@example.com",
      "status": "preselectionne",
      "trackingToken": "uuid",
      "documents": [...],
      "statusHistory": [...],
      ...
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 50
}
```

#### GET /api/candidates/:id
Récupérer un candidat spécifique

#### GET /api/candidates/tracking/:token
Récupérer un candidat par son token de suivi (route publique)

```typescript
// Response
{
  "candidate": {
    "id": "uuid",
    "firstName": "Sophie",
    "lastName": "Martin",
    "status": "preselectionne",
    "statusHistory": [...],
    "documents": [...]
  }
}
```

#### PUT /api/candidates/:id/status
Changer le statut d'un candidat

```typescript
// Request
{
  "newStatus": "preselectionne",
  "comment": "Profil intéressant",
  "changedBy": "RH Manager",
  "sendEmail": true
}

// Response
{
  "success": true,
  "candidate": {...},
  "emailSent": true
}
```

#### POST /api/candidates/bulk-status
Changer le statut de plusieurs candidats

```typescript
// Request
{
  "candidateIds": ["uuid1", "uuid2", "uuid3", ...],
  "newStatus": "preselectionne",
  "comment": "Présélection suite à filtrage",
  "sendEmail": true
}

// Response
{
  "success": 150,
  "failed": 0,
  "emailsSent": 150,
  "errors": []
}
```

---

### 2. Gestion des Documents

#### POST /api/documents/upload
Upload un document

```typescript
// Request (multipart/form-data)
FormData:
  - file: <binary>
  - candidateId: "uuid"
  - type: "demande_stage"
  - uploadedBy: "candidate" | "RH"

// Response
{
  "document": {
    "id": "uuid",
    "name": "demande_stage.pdf",
    "type": "demande_stage",
    "fileUrl": "https://s3.../documents/uuid.pdf",
    "status": "soumis",
    "uploadedAt": "2024-03-03T10:00:00Z"
  }
}
```

#### GET /api/documents/candidate/:candidateId
Récupérer les documents d'un candidat

```typescript
// Response
{
  "documents": [
    {
      "id": "uuid",
      "name": "cv.pdf",
      "type": "cv",
      "fileUrl": "https://s3.../...",
      "status": "valide",
      "uploadedAt": "..."
    }
  ]
}
```

#### GET /api/documents/:id/download
Télécharger un document (retourne le fichier)

```typescript
// Response: Binary file with appropriate headers
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
```

#### PUT /api/documents/:id/validate
Valider un document

```typescript
// Request
{
  "validatedBy": "RH Manager"
}

// Response
{
  "success": true,
  "document": { "id": "...", "status": "valide", ... }
}
```

#### PUT /api/documents/:id/sign
Signer un document

```typescript
// Request
{
  "signedBy": "RH Manager"
}

// Response
{
  "success": true,
  "document": {
    "id": "...",
    "status": "signe",
    "isSigned": true,
    "signedBy": "RH Manager",
    "signedAt": "2024-03-03T11:00:00Z"
  }
}
```

#### DELETE /api/documents/:id
Supprimer un document

---

### 3. Gestion des Emails

#### POST /api/emails/send
Envoyer un email (utilisé en interne par l'API)

```typescript
// Request
{
  "to": "candidate@example.com",
  "subject": "Mise à jour de votre candidature",
  "html": "<html>...</html>",
  "data": {
    "candidateName": "Sophie Martin",
    "status": "preselectionne",
    "trackingUrl": "https://..."
  }
}

// Response
{
  "success": true,
  "messageId": "sendgrid-message-id"
}
```

#### GET /api/emails/queue
Récupérer les emails en attente (admin)

---

## 🔧 Modification des Services Angular

### 1. CandidateService

**Avant (données en mémoire) :**
```typescript
getCandidates(): Observable<Candidate[]> {
  return this.candidates$;
}
```

**Après (API REST) :**
```typescript
import { HttpClient } from '@angular/common/http';

constructor(
  private http: HttpClient,
  private notificationService: NotificationService
) {}

getCandidates(): Observable<Candidate[]> {
  return this.http.get<{ data: Candidate[] }>(`${this.apiUrl}/candidates`)
    .pipe(
      map(response => response.data),
      tap(candidates => this.candidatesSubject.next(candidates))
    );
}

updateCandidateStatus(
  candidateId: string, 
  status: CandidateStatus, 
  comment?: string, 
  changedBy: string = 'RH'
): Observable<any> {
  return this.http.put(`${this.apiUrl}/candidates/${candidateId}/status`, {
    newStatus: status,
    comment,
    changedBy,
    sendEmail: true
  }).pipe(
    tap(() => {
      // Rafraîchir la liste locale
      this.getCandidates().subscribe();
    })
  );
}

bulkUpdateStatus(bulkChange: BulkStatusChange): Observable<{ success: number; failed: number }> {
  return this.http.post<{ success: number; failed: number }>(
    `${this.apiUrl}/candidates/bulk-status`,
    bulkChange
  );
}

getCandidateByTrackingToken(token: string): Observable<Candidate> {
  return this.http.get<{ candidate: Candidate }>(
    `${this.apiUrl}/candidates/tracking/${token}`
  ).pipe(
    map(response => response.candidate)
  );
}
```

---

### 2. DocumentService

**Avant (Blob URLs) :**
```typescript
uploadDocument(candidateId: string, file: File, ...): Observable<CandidateDocument> {
  const fileUrl = URL.createObjectURL(file);
  // ...
}
```

**Après (Upload vers S3 via API) :**
```typescript
import { HttpClient } from '@angular/common/http';

uploadDocument(
  candidateId: string, 
  file: File, 
  type: DocumentType, 
  uploadedBy: string
): Observable<CandidateDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('candidateId', candidateId);
  formData.append('type', type);
  formData.append('uploadedBy', uploadedBy);

  return this.http.post<{ document: CandidateDocument }>(
    `${this.apiUrl}/documents/upload`,
    formData
  ).pipe(
    map(response => response.document)
  );
}

getCandidateDocuments(candidateId: string): Observable<CandidateDocument[]> {
  return this.http.get<{ documents: CandidateDocument[] }>(
    `${this.apiUrl}/documents/candidate/${candidateId}`
  ).pipe(
    map(response => response.documents)
  );
}

downloadDocument(doc: CandidateDocument): void {
  // Téléchargement direct depuis S3
  window.open(doc.fileUrl, '_blank');
  
  // OU via API pour tracking
  this.http.get(`${this.apiUrl}/documents/${doc.id}/download`, {
    responseType: 'blob'
  }).subscribe(blob => {
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = doc.name;
    link.click();
    window.URL.revokeObjectURL(url);
  });
}

signDocument(candidateId: string, documentId: string, signedBy: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/documents/${documentId}/sign`, {
    signedBy
  });
}

validateDocument(candidateId: string, documentId: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/documents/${documentId}/validate`, {
    validatedBy: 'RH'
  });
}
```

---

### 3. NotificationService

**Après (Emails gérés côté backend) :**
```typescript
// Le frontend n'envoie plus d'emails directement
// C'est le backend qui gère l'envoi lors des changements de statut

// Garder juste pour prévisualisation
generateEmailContent(email: StatusChangeEmail): string {
  // Template HTML pour prévisualisation
  // ...
}

// Nouvelle méthode pour récupérer l'historique des emails
getEmailHistory(candidateId: string): Observable<any[]> {
  return this.http.get<{ emails: any[] }>(
    `${this.apiUrl}/candidates/${candidateId}/emails`
  ).pipe(
    map(response => response.emails)
  );
}
```

---

## 🔐 Configuration HttpClient

### app.config.ts (ou app.module.ts)

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

---

## 🔑 Intercepteur d'Authentification

### auth.interceptor.ts

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Ajouter le token JWT à chaque requête
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req);
};
```

---

## 🌐 Variables d'Environnement

### environment.ts (development)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  s3BaseUrl: 'http://localhost:9000', // MinIO local
};
```

### environment.prod.ts (production)

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.votresite.com/api',
  s3BaseUrl: 'https://s3.amazonaws.com/votre-bucket',
};
```

---

## 🎯 Exemple Backend (NestJS)

### candidates.controller.ts

```typescript
import { Controller, Get, Put, Post, Body, Param } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { EmailService } from './email.service';

@Controller('api/candidates')
export class CandidatesController {
  constructor(
    private candidatesService: CandidatesService,
    private emailService: EmailService
  ) {}

  @Get()
  async getAllCandidates() {
    const candidates = await this.candidatesService.findAll();
    return { data: candidates, total: candidates.length };
  }

  @Get(':id')
  async getCandidate(@Param('id') id: string) {
    return await this.candidatesService.findById(id);
  }

  @Get('tracking/:token')
  async getCandidateByToken(@Param('token') token: string) {
    const candidate = await this.candidatesService.findByToken(token);
    return { candidate };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { newStatus: string; comment?: string; changedBy: string; sendEmail: boolean }
  ) {
    // Mettre à jour le statut
    const candidate = await this.candidatesService.updateStatus(id, body);
    
    // Envoyer l'email en arrière-plan (via queue)
    if (body.sendEmail) {
      await this.emailService.queueStatusChangeEmail(candidate, body.newStatus);
    }
    
    return { success: true, candidate, emailSent: body.sendEmail };
  }

  @Post('bulk-status')
  async bulkUpdateStatus(@Body() body: {
    candidateIds: string[];
    newStatus: string;
    comment?: string;
    sendEmail: boolean;
  }) {
    let success = 0;
    let failed = 0;
    
    for (const id of body.candidateIds) {
      try {
        await this.candidatesService.updateStatus(id, {
          newStatus: body.newStatus,
          comment: body.comment,
          changedBy: 'RH'
        });
        
        if (body.sendEmail) {
          const candidate = await this.candidatesService.findById(id);
          await this.emailService.queueStatusChangeEmail(candidate, body.newStatus);
        }
        
        success++;
      } catch (error) {
        failed++;
      }
    }
    
    return { success, failed, emailsSent: body.sendEmail ? success : 0 };
  }
}
```

### email.service.ts (avec RabbitMQ)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('emails') private emailQueue: Queue
  ) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async queueStatusChangeEmail(candidate: any, newStatus: string) {
    // Ajouter à la queue pour traitement asynchrone
    await this.emailQueue.add('status-change', {
      candidateId: candidate.id,
      email: candidate.email,
      name: `${candidate.firstName} ${candidate.lastName}`,
      status: newStatus,
      trackingToken: candidate.trackingToken
    });
  }

  // Processor (s'exécute en arrière-plan)
  @Process('status-change')
  async handleStatusChange(job: Job) {
    const { email, name, status, trackingToken } = job.data;
    
    const msg = {
      to: email,
      from: 'recrutement@votreentreprise.com',
      subject: 'Mise à jour de votre candidature',
      html: this.generateEmailHTML(name, status, trackingToken)
    };
    
    await sgMail.send(msg);
  }
}
```

---

## 📦 Packages NPM Nécessaires

### Backend
```bash
npm install --save @nestjs/common @nestjs/core @nestjs/platform-express
npm install --save @nestjs/typeorm typeorm pg
npm install --save @nestjs/bull bull redis
npm install --save @sendgrid/mail
npm install --save aws-sdk  # Pour S3
npm install --save uuid bcrypt jsonwebtoken
```

### Frontend (Angular)
```bash
# Déjà inclus dans Angular
# HttpClient est dans @angular/common/http
```

---

## 🚀 Déploiement

### Docker Compose (dev/staging)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: rh_management
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://admin:password@postgres:5432/rh_management
      REDIS_URL: redis://redis:6379
      S3_ENDPOINT: http://minio:9000
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - minio

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## ✅ Checklist d'Intégration

- [ ] Créer les endpoints API backend
- [ ] Configurer PostgreSQL
- [ ] Configurer S3 / MinIO
- [ ] Configurer SendGrid / AWS SES
- [ ] Configurer RabbitMQ / Bull
- [ ] Modifier CandidateService (HttpClient)
- [ ] Modifier DocumentService (Upload API)
- [ ] Configurer HttpClient dans Angular
- [ ] Créer l'intercepteur d'auth
- [ ] Configurer les environnements
- [ ] Tester avec Postman
- [ ] Tester end-to-end
- [ ] Déployer sur serveur de staging
- [ ] Tests de charge
- [ ] Déploiement production

---

**📘 Ce guide fournit une base solide pour transformer l'application en un système full-stack production-ready !**
