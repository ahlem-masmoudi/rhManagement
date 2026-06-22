import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatchingService } from '../../services/matching.service';
import { CandidateService } from '../../services/candidate.service';
import { Application } from '../../models';
import { environment } from '../../../environments/environment';

interface DossierEntry {
  application: Application;
  documents: any[];
  docsExpanded: boolean;
  docsLoaded: boolean;
  docsError: boolean;
  signing: boolean;
  signSuccess: string;
  signError: string;
  showSignForm: boolean;
  signatoryName: string;
  signatoryTitle: string;
  entreprise: string;
  tel: string;
  fax: string;
  adresse: string;
  supervisorInfo: string;
  stageStartDate: string;
  stageEndDate: string;
  projectTitle: string;
  projectObjectives: string;
  reuploadLoading: boolean;
  reuploadSuccess: string;
  reuploadError: string;
  notifyLoading: boolean;
  notifyUrl: string;
  notifyError: string;
}

@Component({
  selector: 'app-dossiers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dossiers-page">
      <div class="page-header">
        <div>
          <h1>Dossiers acceptés</h1>
          <p class="text-muted">Candidats dont l'offre a été acceptée — signez et renvoyez les demandes de stage</p>
        </div>
        <div class="header-right">
          <button class="btn-refresh-all" (click)="refreshAll()" [disabled]="loading">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Rafraîchir
          </button>
          <span class="count-badge">{{ dossiers.length }} dossier(s)</span>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && dossiers.length === 0" class="empty-state card">
        <svg width="48" height="48" fill="none" viewBox="0 0 48 48" style="margin:0 auto 16px">
          <circle cx="24" cy="24" r="24" fill="#EEF2FF"/>
          <path d="M16 14h16v20H16V14z" fill="#c7d2fe" stroke="#6366f1" stroke-width="1.5"/>
          <path d="M20 20h8M20 25h6" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <h3>Aucun dossier pour le moment</h3>
        <p style="color:var(--gray-500)">Les candidats dont le statut est "Accepté" apparaîtront ici avec leurs documents.</p>
      </div>

      <div *ngIf="loading" class="loading-state card">
        <div class="spinner"></div>
        <p>Chargement des dossiers...</p>
      </div>

      <!-- Dossier cards -->
      <div class="dossiers-grid" *ngIf="!loading && dossiers.length > 0">
        <div *ngFor="let entry of dossiers; let i = index" class="dossier-card" [style]="'--i:' + i">
          <!-- Candidate header -->
          <div class="candidate-header">
            <div class="avatar">{{ getInitials(entry.application) }}</div>
            <div class="candidate-info">
              <h3>{{ entry.application.candidate?.firstName }} {{ entry.application.candidate?.lastName }}</h3>
              <div class="meta">{{ entry.application.candidate?.email }}</div>
              <div class="meta">{{ entry.application.offer?.title }}</div>
            </div>
            <div class="status-chip accepted">Accepté(e)</div>
          </div>

          <!-- Card actions -->
          <div class="card-actions-row">
            <button class="btn-view" (click)="viewProfile(entry.application.candidateId)">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10z" clip-rule="evenodd"/>
              </svg>
              Voir profil
            </button>
            <button class="btn-notify" [disabled]="entry.notifyLoading" (click)="notifyCandidate(entry)"
                    title="Générer le lien de suivi et envoyer au candidat">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              {{ entry.notifyLoading ? '...' : 'Notifier le candidat' }}
            </button>
            <button class="btn-delete" (click)="removeDossier(entry)">
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              Supprimer
            </button>
          </div>

          <!-- Tracking URL row (shown after Notifier click) -->
          <div *ngIf="entry.notifyUrl" class="notify-url-row">
            <div class="notify-url-label">
              Lien de suivi généré — copiez-le et envoyez-le au candidat :
            </div>
            <div class="notify-url-inner">
              <input #notifyInput type="text" class="notify-url-input" [value]="entry.notifyUrl" readonly
                     (click)="notifyInput.select()">
              <button class="btn-copy-notify" (click)="copyNotifyUrl(entry, notifyInput)">Copier</button>
              <a class="btn-email-notify"
                 [href]="getMailtoLink(entry)"
                 target="_blank"
                 title="Ouvrir dans la messagerie">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                Email
              </a>
            </div>
          </div>

          <div *ngIf="entry.notifyError" class="alert alert-error" style="margin-top:8px">{{ entry.notifyError }}</div>

          <!-- Documents section -->
          <div class="docs-section">
            <div class="docs-header" (click)="toggleDocs(entry)">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
              </svg>
              <span>Documents</span>
              <span *ngIf="entry.docsLoaded && entry.documents.length > 0" class="docs-count-badge">{{ entry.documents.length }}</span>
              <svg class="chevron" [class.open]="entry.docsExpanded" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
              <button class="btn-refresh-card" (click)="$event.stopPropagation(); refreshEntry(entry)" title="Rafraîchir les documents">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>

            <div *ngIf="entry.docsExpanded">
            <!-- Loading documents -->
            <div *ngIf="!entry.docsLoaded" class="doc-loading">
              <div class="spinner spinner-sm"></div> Chargement...
            </div>

            <!-- Error loading documents -->
            <div *ngIf="entry.docsLoaded && entry.docsError" class="docs-error">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              Impossible de charger les documents. <button class="link-btn" (click)="refreshEntry(entry)">Réessayer</button>
            </div>

            <!-- No documents -->
            <div *ngIf="entry.docsLoaded && !entry.docsError && entry.documents.length === 0" class="no-docs">
              Aucun document déposé pour le moment.
              <button class="link-btn" (click)="refreshEntry(entry)">Vérifier</button>
            </div>

            <!-- Document list -->
            <div *ngFor="let doc of entry.documents" class="doc-row">
              <div class="doc-info">
                <div class="doc-name">{{ doc.name }}</div>
                <div class="doc-meta">
                  <span [class]="'doc-type type-' + doc.type">{{ getDocTypeLabel(doc.type) }}</span>
                  <span *ngIf="doc.isSigned" class="signed-chip">Signé</span>
                  <span *ngIf="!doc.isSigned && doc.status === 'soumis' && doc.type !== 'cv' && doc.type !== 'lettre_motivation'" class="pending-chip">En attente de signature</span>
                </div>
              </div>
              <div class="doc-actions">
                <button class="btn-icon" title="Prévisualiser" (click)="previewDoc(entry, doc)">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10z" clip-rule="evenodd"/>
                  </svg>
                </button>
                <button class="btn-icon" title="Télécharger" (click)="downloadDoc(entry, doc)">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                </button>
                <button *ngIf="!doc.isSigned && (doc.type === 'demande_stage' || doc.type === 'convention_stage')"
                        class="btn-sign" (click)="toggleSignForm(entry)">
                  Signer
                </button>
                <label *ngIf="doc.isSigned || doc.type === 'demande_stage' || doc.type === 'convention_stage'"
                       class="btn-reupload" [class.loading]="entry.reuploadLoading" title="Uploader la version physiquement signée et tamponnée">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ entry.reuploadLoading ? '...' : 'Uploader signé' }}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none"
                         (change)="reuploadSignedDoc(entry, doc, $event)">
                </label>
                <button *ngIf="doc.isSigned"
                        class="btn-icon btn-icon-danger" title="Supprimer ce document signé"
                        (click)="deleteSignedDoc(entry, doc)">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
              <div *ngIf="entry.reuploadSuccess" class="alert alert-success" style="margin-top:6px">{{ entry.reuploadSuccess }}</div>
              <div *ngIf="entry.reuploadError" class="alert alert-error" style="margin-top:6px">{{ entry.reuploadError }}</div>
            </div>

            <!-- Sign form -->
            <div *ngIf="entry.showSignForm" class="sign-form">
              <h4 style="margin:0 0 14px">Remplir et signer la demande de stage</h4>

              <p class="sign-form-section-title">Informations de l'entreprise (Fiche PFE)</p>
              <div class="form-row-2">
                <div class="form-group">
                  <label>Entreprise *</label>
                  <input type="text" [(ngModel)]="entry.entreprise" placeholder="Nom de la société">
                </div>
                <div class="form-group">
                  <label>Adresse</label>
                  <input type="text" [(ngModel)]="entry.adresse" placeholder="Adresse de l'entreprise">
                </div>
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label>Tél</label>
                  <input type="text" [(ngModel)]="entry.tel" placeholder="Numéro de téléphone">
                </div>
                <div class="form-group">
                  <label>Fax <span style="font-weight:400;text-transform:none;color:#9ca3af">(optionnel)</span></label>
                  <input type="text" [(ngModel)]="entry.fax" placeholder="Numéro de fax">
                </div>
              </div>
              <div class="form-group">
                <label>Responsable du stagiaire, sa fonction et son email</label>
                <input type="text" [(ngModel)]="entry.supervisorInfo" placeholder="Ex: M. Ahmed Ben Ali, Directeur technique, ahmed@societe.tn">
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label>Stage prévu du</label>
                  <input type="date" [(ngModel)]="entry.stageStartDate">
                </div>
                <div class="form-group">
                  <label>Au</label>
                  <input type="date" [(ngModel)]="entry.stageEndDate">
                </div>
              </div>
              <div class="form-group">
                <label>Titre du projet</label>
                <input type="text" [(ngModel)]="entry.projectTitle" placeholder="Ex: Développement d'une application de gestion RH">
              </div>
              <div class="form-group">
                <label>Objectifs du travail demandé</label>
                <textarea [(ngModel)]="entry.projectObjectives" rows="3" placeholder="Décrire les objectifs du stage..."></textarea>
              </div>

              <p class="sign-form-section-title" style="margin-top:14px">Signature</p>
              <div class="form-row-2">
                <div class="form-group">
                  <label>Nom du signataire *</label>
                  <input type="text" [(ngModel)]="entry.signatoryName" placeholder="Ex: Mme Fatma Ben Ali">
                </div>
                <div class="form-group">
                  <label>Fonction</label>
                  <input type="text" [(ngModel)]="entry.signatoryTitle" placeholder="Ex: Responsable RH">
                </div>
              </div>

              <div class="sign-actions">
                <button class="btn-secondary" (click)="entry.showSignForm = false">Annuler</button>
                <button class="btn-primary" [disabled]="entry.signing || !entry.signatoryName || !entry.entreprise"
                        (click)="signDocument(entry)">
                  <span *ngIf="entry.signing" class="spinner spinner-sm"></span>
                  {{ entry.signing ? 'Signature en cours...' : 'Confirmer la signature' }}
                </button>
              </div>
              <div *ngIf="entry.signSuccess" class="alert alert-success">{{ entry.signSuccess }}</div>
              <div *ngIf="entry.signError" class="alert alert-error">{{ entry.signError }}</div>
            </div>
            </div><!-- /docsExpanded -->
          </div>
        </div>
      </div>

    </div>

    <!-- Confirm Dialog -->
    <div class="confirm-overlay" *ngIf="confirmDialog.show" (click)="closeConfirmDialog()">
      <div class="confirm-box" (click)="$event.stopPropagation()">
        <div class="confirm-icon" [ngClass]="confirmDialog.iconType">
          <svg *ngIf="confirmDialog.iconType==='danger'" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          <svg *ngIf="confirmDialog.iconType==='warning'" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <svg *ngIf="confirmDialog.iconType==='info'" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        </div>
        <h3 class="confirm-title">{{ confirmDialog.title }}</h3>
        <p class="confirm-msg" [innerHTML]="confirmDialog.message"></p>
        <div class="confirm-actions">
          <button class="confirm-cancel" (click)="closeConfirmDialog()">Annuler</button>
          <button class="confirm-ok" [ngClass]="confirmDialog.iconType" (click)="executeConfirm()">{{ confirmDialog.confirmLabel }}</button>
        </div>
      </div>
    </div>

    <!-- Preview modal — outside animated parent so position:fixed works correctly -->
    <div *ngIf="preview.visible" class="modal-overlay" (click)="closePreview()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ preview.name }}</h3>
          <button class="btn-secondary" (click)="closePreview()">Fermer</button>
        </div>
        <div class="modal-body">
          <img *ngIf="preview.mime && preview.mime.startsWith('image/')"
               [src]="preview.blobUrl" style="max-width:100%;max-height:600px;display:block;margin:auto"/>
          <iframe *ngIf="!preview.mime?.startsWith('image/')"
                  [src]="preview.blobUrl"
                  width="100%" height="620"
                  style="border:none;display:block">
          </iframe>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Blue Edition — Dossiers ── */
    @keyframes fadeUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:none} }
    @keyframes spin    { to{transform:rotate(360deg)} }
    @keyframes orbF1   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-16px,12px) scale(1.15)} }
    @keyframes orbF2   { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,-16px) scale(0.85)} }

    .dossiers-page { max-width:100%; animation:fadeUp 0.4s ease both; }

    /* ── Page Header ── */
    .page-header {
      display:flex; justify-content:space-between; align-items:center;
      margin-bottom:24px; padding:26px 30px;
      background:linear-gradient(135deg,#1e1065 0%,#4338ca 45%,#7c3aed 100%);
      border-radius:20px; position:relative; overflow:hidden;
      box-shadow:0 8px 32px rgba(67,56,202,0.3),0 2px 8px rgba(124,58,237,0.16);
    }
    .page-header::before {
      content:''; position:absolute;
      width:260px; height:260px;
      background:radial-gradient(circle,rgba(255,255,255,0.18) 0%,transparent 65%);
      top:-100px; right:-50px; border-radius:50%;
      animation:orbF1 9s ease-in-out infinite; pointer-events:none;
    }
    .page-header::after {
      content:''; position:absolute;
      width:140px; height:140px;
      background:radial-gradient(circle,rgba(255,255,255,0.1) 0%,transparent 70%);
      bottom:-55px; left:40px; border-radius:50%;
      animation:orbF2 7s ease-in-out infinite; pointer-events:none;
    }
    .page-header h1 { color:#fff; font-size:22px; font-weight:800; margin:0 0 4px; position:relative; z-index:1; }
    .page-header .text-muted { color:rgba(255,255,255,0.78); font-size:13px; margin:0; position:relative; z-index:1; }
    .header-right { display:flex; align-items:center; gap:12px; position:relative; z-index:1; }

    .btn-refresh-all {
      display:flex; align-items:center; gap:7px; padding:8px 16px;
      background:rgba(255,255,255,0.2); color:#fff;
      border:1.5px solid rgba(255,255,255,0.4); border-radius:10px;
      font-size:13px; font-weight:600; cursor:pointer; backdrop-filter:blur(4px); transition:all 0.2s;
    }
    .btn-refresh-all:hover:not(:disabled) { background:rgba(255,255,255,0.3); }
    .btn-refresh-all:disabled { opacity:0.5; cursor:not-allowed; }

    .count-badge {
      background:rgba(255,255,255,0.2); color:#fff; padding:8px 18px; border-radius:999px;
      font-size:14px; font-weight:700; border:1.5px solid rgba(255,255,255,0.4); backdrop-filter:blur(4px);
    }

    /* ── States ── */
    .empty-state, .loading-state {
      text-align:center; padding:56px 24px; background:#fff; border-radius:18px;
      box-shadow:0 2px 14px rgba(21,101,192,0.06); border:1px solid #BFDBFE;
    }
    .empty-state h3 { margin:0 0 8px; font-size:18px; color:#0D47A1; }
    .loading-state { display:flex; align-items:center; justify-content:center; gap:12px; color:#1976D2; }

    /* ── Dossier Grid ── */
    .dossiers-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(480px,1fr)); gap:20px; }

    .dossier-card {
      background:#E5F3FD; border-radius:18px; padding:22px;
      border:1px solid rgba(21,101,192,0.14);
      box-shadow:0 3px 18px rgba(21,101,192,0.09),0 1px 4px rgba(21,101,192,0.06);
      transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
      animation:fadeUp 0.5s calc(var(--i,0)*0.08s) both;
      position:relative; overflow:hidden;
    }
    .dossier-card::before {
      content:''; position:absolute; top:0; left:0; right:0; height:4px;
      background:linear-gradient(90deg,#1565C0,#42A5F5);
    }
    .dossier-card:hover {
      box-shadow:0 14px 44px rgba(21,101,192,0.18); transform:translateY(-5px);
      border-color:rgba(21,101,192,0.28); background:#D6EAFB;
    }

    /* ── Candidate Header ── */
    .candidate-header {
      display:flex; align-items:flex-start; gap:14px;
      margin-bottom:18px; padding-bottom:16px; border-bottom:1px solid rgba(21,101,192,0.12);
    }
    .avatar {
      width:46px; height:46px; border-radius:50%;
      background:linear-gradient(135deg,#1565C0,#42A5F5); color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-weight:700; font-size:16px; flex-shrink:0;
      box-shadow:0 4px 12px rgba(21,101,192,0.32);
    }
    .candidate-info { flex:1; min-width:0; }
    .candidate-info h3 { margin:0 0 5px; font-size:16px; font-weight:700; color:#0D47A1; }
    .meta { font-size:13px; color:#5D8BB5; line-height:1.5; }

    .status-chip { padding:5px 12px; border-radius:999px; font-size:11px; font-weight:700; flex-shrink:0; letter-spacing:0.3px; }
    .accepted { background:linear-gradient(135deg,#D1FAE5,#A7F3D0); color:#065F46; border:1px solid #A7F3D0; }

    /* ── Card Action Buttons ── */
    .card-actions-row {
      display:flex; gap:10px; margin-bottom:18px; padding-bottom:16px;
      border-bottom:1px solid rgba(21,101,192,0.1);
    }
    .btn-view {
      display:flex; align-items:center; gap:6px; padding:8px 16px;
      background:linear-gradient(135deg,#1565C0,#1976D2); color:#fff;
      border:none; border-radius:9px; font-size:13px; font-weight:600; cursor:pointer;
      transition:all 0.2s; box-shadow:0 3px 10px rgba(21,101,192,0.32);
    }
    .btn-view:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(21,101,192,0.45); }

    .btn-delete {
      display:flex; align-items:center; gap:6px; padding:8px 16px;
      background:rgba(255,255,255,0.7); color:#dc2626;
      border:1.5px solid rgba(220,38,38,0.2); border-radius:9px;
      font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s;
    }
    .btn-delete:hover { background:#fff; border-color:#dc2626; transform:translateY(-1px); }

    .btn-notify {
      display:flex; align-items:center; gap:6px; padding:8px 16px;
      background:linear-gradient(135deg,#0288D1,#0EA5E9); color:#fff;
      border:none; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer;
      box-shadow:0 3px 10px rgba(2,136,209,0.3); transition:all 0.2s;
    }
    .btn-notify:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 16px rgba(2,136,209,0.45); }
    .btn-notify:disabled { opacity:0.6; cursor:not-allowed; }

    /* ── Docs Section ── */
    .docs-header {
      display:flex; align-items:center; gap:7px;
      font-size:13px; font-weight:700; color:#1565C0;
      text-transform:uppercase; letter-spacing:0.5px; cursor:pointer;
      padding:10px 0; user-select:none; border-radius:8px; transition:color 0.2s;
    }
    .docs-header:hover { color:#0D47A1; }
    .docs-count-badge { background:#DBEAFE; color:#1E40AF; font-size:11px; font-weight:700; padding:1px 7px; border-radius:20px; border:1px solid #BFDBFE; }
    .chevron { margin-left:2px; transition:transform 0.25s ease; color:#93C5FD; flex-shrink:0; }
    .chevron.open { transform:rotate(180deg); }
    .btn-refresh-card {
      margin-left:auto; width:26px; height:26px; border:1.5px solid #BFDBFE; border-radius:7px;
      background:rgba(255,255,255,0.7); display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:#93C5FD; transition:all 0.2s; flex-shrink:0;
    }
    .btn-refresh-card:hover { background:#DBEAFE; color:#1976D2; border-color:#1976D2; }

    .doc-loading, .no-docs { font-size:13px; color:#93C5FD; padding:10px 0; display:flex; align-items:center; gap:8px; }
    .docs-error { font-size:13px; color:#dc2626; padding:10px 0; display:flex; align-items:center; gap:6px; }
    .link-btn { background:none; border:none; padding:0; color:#1976D2; font-size:13px; font-weight:600; cursor:pointer; text-decoration:underline; }

    .doc-row { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:12px 0; border-top:1px solid rgba(21,101,192,0.08); }
    .doc-info { flex:1; min-width:0; }
    .doc-name { font-size:14px; font-weight:600; color:#0D47A1; margin-bottom:5px; }
    .doc-meta { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }

    .doc-type { font-size:11px; padding:3px 9px; border-radius:999px; font-weight:700; letter-spacing:0.2px; }
    .type-demande_stage    { background:#FEF3C7; color:#92400E; }
    .type-convention_stage { background:#DBEAFE; color:#1E40AF; }
    .type-cv               { background:#F0F8FF; color:#1565C0; }
    .type-convention_signee { background:#D1FAE5; color:#065F46; }
    .type-autre            { background:#F3F4F6; color:#6B7280; }

    .signed-chip  { font-size:11px; background:#D1FAE5; color:#065F46; padding:3px 9px; border-radius:999px; font-weight:700; }
    .pending-chip { font-size:11px; background:#FEF3C7; color:#92400E; padding:3px 9px; border-radius:999px; font-weight:600; }

    .doc-actions { display:flex; gap:8px; align-items:center; flex-shrink:0; }
    .btn-icon {
      width:32px; height:32px; border:1.5px solid #BFDBFE; border-radius:9px;
      background:rgba(255,255,255,0.8); display:flex; align-items:center; justify-content:center;
      cursor:pointer; color:#93C5FD; transition:all 0.2s;
    }
    .btn-icon:hover { background:#DBEAFE; color:#1565C0; border-color:#1976D2; }
    .btn-icon-danger { border-color:#FECACA; color:#FCA5A5; }
    .btn-icon-danger:hover { background:#FEE2E2; color:#DC2626; border-color:#DC2626; }

    .btn-sign {
      padding:7px 16px; background:linear-gradient(135deg,#1565C0,#1976D2); color:#fff;
      border:none; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer;
      transition:all 0.2s; box-shadow:0 3px 10px rgba(21,101,192,0.3);
    }
    .btn-sign:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(21,101,192,0.45); }

    /* ── Sign Form ── */
    .sign-form {
      margin-top:16px; padding:18px;
      background:linear-gradient(135deg,#EFF6FF,#DBEAFE);
      border:1px solid #BFDBFE; border-radius:12px; animation:fadeUp 0.3s ease both;
    }
    .sign-form h4 { margin:0 0 14px; font-size:15px; color:#1565C0; font-weight:700; }
    .sign-form-section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#1976D2; margin:0 0 10px; padding-bottom:4px; border-bottom:1px solid #BFDBFE; }
    .form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .form-group { margin-bottom:12px; }
    .form-group label { display:block; font-size:12px; font-weight:700; margin-bottom:5px; color:#374151; text-transform:uppercase; letter-spacing:0.5px; }
    .form-group input, .form-group textarea {
      width:100%; padding:10px 14px; border:1.5px solid #BFDBFE; border-radius:10px;
      font-size:14px; background:#fff; outline:none; transition:all 0.2s; box-sizing:border-box;
    }
    .form-group input:focus, .form-group textarea:focus { border-color:#1976D2; box-shadow:0 0 0 3px rgba(25,118,210,0.12); }
    .form-group textarea { resize:vertical; font-family:inherit; }

    .btn-reupload {
      display:inline-flex; align-items:center; gap:5px; padding:5px 10px;
      background:#EFF6FF; color:#1565C0; border:1px solid #BFDBFE;
      border-radius:7px; font-size:11px; font-weight:600; cursor:pointer; transition:all 0.2s; white-space:nowrap;
    }
    .btn-reupload:hover { background:#DBEAFE; }
    .btn-reupload.loading { opacity:0.6; cursor:not-allowed; pointer-events:none; }

    .sign-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:14px; }
    .btn-secondary {
      padding:8px 18px; border:1.5px solid #BFDBFE; border-radius:9px;
      background:#fff; color:#1565C0; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s;
    }
    .btn-secondary:hover { background:#EFF6FF; border-color:#1976D2; }
    .btn-primary {
      padding:9px 20px; background:linear-gradient(135deg,#1565C0,#1976D2); color:#fff;
      border:none; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer;
      transition:all 0.2s; display:flex; align-items:center; gap:6px;
      box-shadow:0 3px 10px rgba(21,101,192,0.3);
    }
    .btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 16px rgba(21,101,192,0.45); }
    .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }

    .alert { margin-top:12px; padding:10px 14px; border-radius:10px; font-size:13px; }
    .alert-success { background:#DBEAFE; color:#1E40AF; border:1px solid #BFDBFE; }
    .alert-error   { background:#FEE2E2; color:#991B1B; border:1px solid #FCA5A5; }

    /* ── Preview Modal ── */
    .modal-overlay {
      position:fixed; inset:0; background:rgba(13,71,161,0.48); backdrop-filter:blur(5px);
      z-index:9999; display:flex; align-items:center; justify-content:center; padding:24px;
    }
    .modal {
      background:#fff; border-radius:20px; box-shadow:0 25px 80px rgba(13,71,161,0.2);
      max-width:840px; width:100%; max-height:90vh; overflow:hidden; display:flex; flex-direction:column;
    }
    .modal-header {
      display:flex; justify-content:space-between; align-items:center; padding:18px 22px;
      background:linear-gradient(135deg,#1565C0,#42A5F5);
    }
    .modal-header h3 { margin:0; font-size:16px; color:#fff; font-weight:700; }
    .modal-header .btn-secondary { border:1.5px solid rgba(255,255,255,0.4); background:rgba(255,255,255,0.18); color:#fff; }
    .modal-header .btn-secondary:hover { background:rgba(255,255,255,0.3); }
    .modal-body { flex:1; overflow:auto; }

    /* ── Spinner ── */
    .spinner { display:inline-block; width:22px; height:22px; border:3px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
    .spinner-sm { width:14px; height:14px; border-width:2px; }

    /* ── Notify row ── */
    .notify-url-row { margin-top:10px; padding:10px 12px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; }
    .notify-url-label { font-size:11px; font-weight:600; color:#1E40AF; margin-bottom:6px; }
    .notify-url-inner { display:flex; align-items:center; gap:6px; }
    .notify-url-input { flex:1; min-width:0; border:1px solid #BFDBFE; border-radius:7px; padding:6px 10px; font-size:12px; color:#1E3A8A; background:#fff; cursor:text; }
    .btn-copy-notify, .btn-email-notify {
      display:inline-flex; align-items:center; gap:5px; padding:6px 12px;
      border:none; border-radius:7px; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; text-decoration:none;
    }
    .btn-copy-notify { background:#1565C0; color:#fff; }
    .btn-copy-notify:hover { background:#0D47A1; }
    .btn-email-notify { background:#0288D1; color:#fff; }
    .btn-email-notify:hover { background:#01579B; }

    /* ── Confirm Dialog ── */
    @keyframes confirmPop { from{opacity:0;transform:scale(0.92) translateY(16px)} to{opacity:1;transform:none} }
    .confirm-overlay {
      position:fixed; top:0; left:0; width:100vw; height:100vh;
      background:rgba(0,0,0,0.42); backdrop-filter:blur(4px);
      display:flex; align-items:center; justify-content:center;
      z-index:9999; padding:20px; box-sizing:border-box;
    }
    .confirm-box {
      background:#fff; border-radius:20px; padding:36px 32px 28px;
      max-width:420px; width:100%; text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,0.18);
      animation:confirmPop 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    .confirm-icon {
      width:64px; height:64px; border-radius:50%; margin:0 auto 18px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 4px 16px rgba(0,0,0,0.12);
    }
    .confirm-icon.danger  { background:linear-gradient(135deg,#FEE2E2,#FECACA); color:#DC2626; }
    .confirm-icon.warning { background:linear-gradient(135deg,#FEF3C7,#FDE68A); color:#D97706; }
    .confirm-icon.info    { background:linear-gradient(135deg,#DBEAFE,#BFDBFE); color:#1565C0; }
    .confirm-title { font-size:18px; font-weight:800; color:#111827; margin:0 0 10px; }
    .confirm-msg   { font-size:13.5px; color:#6B7280; line-height:1.6; margin:0 0 26px; }
    .confirm-msg strong { color:#374151; }
    .confirm-actions { display:flex; gap:10px; }
    .confirm-cancel {
      flex:1; padding:11px 0; border-radius:12px;
      border:1.5px solid #E5E7EB; background:#F9FAFB; color:#374151;
      font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s;
    }
    .confirm-cancel:hover { background:#F3F4F6; border-color:#D1D5DB; }
    .confirm-ok {
      flex:1; padding:11px 0; border-radius:12px;
      border:none; color:#fff; font-size:14px; font-weight:700;
      cursor:pointer; transition:all 0.25s;
    }
    .confirm-ok.danger  { background:linear-gradient(135deg,#DC2626,#EF4444); box-shadow:0 4px 14px rgba(220,38,38,0.32); }
    .confirm-ok.danger:hover  { background:linear-gradient(135deg,#B91C1C,#DC2626); transform:translateY(-1px); box-shadow:0 7px 20px rgba(220,38,38,0.42); }
    .confirm-ok.warning { background:linear-gradient(135deg,#D97706,#F59E0B); box-shadow:0 4px 14px rgba(217,119,6,0.32); }
    .confirm-ok.warning:hover { background:linear-gradient(135deg,#B45309,#D97706); transform:translateY(-1px); }
    .confirm-ok.info    { background:linear-gradient(135deg,#1565C0,#1976D2); box-shadow:0 4px 14px rgba(21,101,192,0.32); }
    .confirm-ok.info:hover    { background:linear-gradient(135deg,#0D47A1,#1565C0); transform:translateY(-1px); }

    @media (max-width:768px) {
      .page-header { flex-direction:column; gap:14px; padding:20px; }
      .dossiers-grid { grid-template-columns:1fr; }
    }
  `]
})
export class DossiersComponent implements OnInit {
  dossiers: DossierEntry[] = [];
  loading = true;

  confirmDialog: { show: boolean; title: string; message: string; confirmLabel: string; iconType: 'danger'|'warning'|'info'; action: (() => void) | null } =
    { show: false, title: '', message: '', confirmLabel: 'Confirmer', iconType: 'danger', action: null };

  openConfirmDialog(cfg: { title: string; message: string; confirmLabel: string; iconType: 'danger'|'warning'|'info'; action: () => void }): void {
    this.confirmDialog = { show: true, ...cfg };
  }
  closeConfirmDialog(): void {
    this.confirmDialog = { show: false, title: '', message: '', confirmLabel: 'Confirmer', iconType: 'danger', action: null };
  }
  executeConfirm(): void {
    if (this.confirmDialog.action) this.confirmDialog.action();
    this.closeConfirmDialog();
  }

  preview: { visible: boolean; name: string; content: string; mime: string; blobUrl: SafeResourceUrl | string } = {
    visible: false, name: '', content: '', mime: '', blobUrl: ''
  };
  private _rawBlobUrl = '';

  private apiUrl = environment.apiUrl;

  constructor(
    private matchingService: MatchingService,
    private candidateService: CandidateService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  viewProfile(candidateId: string): void {
    this.router.navigate(['/rh/profil', candidateId]);
  }

  deleteSignedDoc(entry: DossierEntry, doc: any): void {
    const candidateId = entry.application.candidateId;
    const docId = doc._id || doc.id;
    this.openConfirmDialog({
      title: 'Supprimer ce document signé ?',
      message: `Le document <strong>${doc.name}</strong> sera supprimé définitivement.`,
      confirmLabel: 'Supprimer',
      iconType: 'danger',
      action: () => {
        this.candidateService.deleteDocument(candidateId, docId).subscribe({
          next: () => { entry.documents = entry.documents.filter(d => (d._id || d.id) !== docId); },
          error: (err: any) => { console.error('Erreur suppression document:', err); }
        });
      }
    });
  }

  removeDossier(entry: DossierEntry): void {
    const name = `${entry.application.candidate?.firstName} ${entry.application.candidate?.lastName}`;
    this.openConfirmDialog({
      title: 'Supprimer ce dossier ?',
      message: `Vous êtes sur le point de supprimer le dossier de <strong>${name}</strong>. Cette action est irréversible.`,
      confirmLabel: 'Supprimer',
      iconType: 'danger',
      action: () => {
        const appId = (entry.application as any)._id || entry.application.id;
        this.matchingService.deleteApplication(appId).subscribe({
          next: () => { this.dossiers = this.dossiers.filter(d => d !== entry); },
          error: (err: any) => { console.error('Erreur suppression:', err); }
        });
      }
    });
  }

  ngOnInit(): void {
    this.matchingService.getApplications().subscribe(apps => {
      const accepted = apps.filter(a => a.status === 'offre_acceptee');
      this.dossiers = accepted.map(app => ({
        application: app,
        documents: [],
        docsExpanded: false,
        docsLoaded: false,
        docsError: false,
        signing: false,
        signSuccess: '',
        signError: '',
        showSignForm: false,
        signatoryName: '',
        signatoryTitle: 'Responsable RH',
        entreprise: '',
        tel: '',
        fax: '',
        adresse: '',
        supervisorInfo: '',
        stageStartDate: '',
        stageEndDate: '',
        projectTitle: '',
        projectObjectives: '',
        reuploadLoading: false,
        reuploadSuccess: '',
        reuploadError: '',
        notifyLoading: false,
        notifyUrl: '',
        notifyError: ''
      }));
      this.loading = false;
      this.loadAllDocuments();
    });
  }

  refreshAll(): void {
    this.loading = true;
    this.dossiers = [];
    this.matchingService.getApplications().subscribe(apps => {
      const accepted = apps.filter(a => a.status === 'offre_acceptee');
      this.dossiers = accepted.map(app => ({
        application: app,
        documents: [],
        docsExpanded: false,
        docsLoaded: false,
        docsError: false,
        signing: false,
        signSuccess: '',
        signError: '',
        showSignForm: false,
        signatoryName: '',
        signatoryTitle: 'Responsable RH',
        entreprise: '',
        tel: '',
        fax: '',
        adresse: '',
        supervisorInfo: '',
        stageStartDate: '',
        stageEndDate: '',
        projectTitle: '',
        projectObjectives: '',
        reuploadLoading: false,
        reuploadSuccess: '',
        reuploadError: '',
        notifyLoading: false,
        notifyUrl: '',
        notifyError: ''
      }));
      this.loading = false;
      this.loadAllDocuments();
    });
  }

  refreshEntry(entry: DossierEntry): void {
    const candidateId = entry.application.candidateId;
    entry.docsLoaded = false;
    entry.docsError = false;
    entry.documents = [];
    if (!candidateId) {
      entry.docsLoaded = true;
      entry.docsError = true;
      return;
    }
    this.candidateService.getCandidateFull(candidateId).subscribe({
      next: candidate => {
        entry.documents = candidate.documents || [];
        entry.docsLoaded = true;
        entry.docsError = false;
      },
      error: () => {
        entry.docsLoaded = true;
        entry.docsError = true;
      }
    });
  }

  private loadAllDocuments(): void {
    this.dossiers.forEach(entry => {
      const candidateId = entry.application.candidateId;
      if (!candidateId) {
        entry.docsLoaded = true;
        entry.docsError = true;
        return;
      }
      this.candidateService.getCandidateFull(candidateId).subscribe({
        next: candidate => {
          entry.documents = candidate.documents || [];
          entry.docsLoaded = true;
          entry.docsError = false;
        },
        error: () => {
          entry.docsLoaded = true;
          entry.docsError = true;
        }
      });
    });
  }

  getInitials(app: Application): string {
    const first = app.candidate?.firstName?.[0] || '';
    const last = app.candidate?.lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
  }

  getDocTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      demande_stage: 'Demande de stage',
      convention_stage: 'Convention de stage',
      convention_signee: 'Convention signée',
      cv: 'CV',
      lettre_motivation: 'Lettre de motivation',
      attestation: 'Attestation',
      autre: 'Autre'
    };
    return labels[type] || type;
  }

  toggleDocs(entry: DossierEntry): void {
    entry.docsExpanded = !entry.docsExpanded;
  }

  toggleSignForm(entry: DossierEntry): void {
    entry.showSignForm = !entry.showSignForm;
    entry.signSuccess = '';
    entry.signError = '';
  }

  signDocument(entry: DossierEntry): void {
    const unsignedDoc = entry.documents.find(
      d => !d.isSigned && (d.type === 'demande_stage' || d.type === 'convention_stage')
    );
    if (!unsignedDoc) return;

    const candidateId = entry.application.candidateId;
    entry.signing = true;
    entry.signError = '';

    this.candidateService.generateSignedInternshipRequest(candidateId, unsignedDoc.id, {
      signatoryName: entry.signatoryName,
      signatoryTitle: entry.signatoryTitle || 'Responsable RH',
      entreprise: entry.entreprise,
      tel: entry.tel,
      fax: entry.fax,
      adresse: entry.adresse,
      supervisorInfo: entry.supervisorInfo,
      stageStartDate: entry.stageStartDate,
      stageEndDate: entry.stageEndDate,
      projectTitle: entry.projectTitle,
      projectObjectives: entry.projectObjectives
    }).subscribe({
      next: () => {
        entry.signing = false;
        entry.signSuccess = 'Document signé et envoyé au candidat avec succès.';
        entry.showSignForm = false;
        // Reload documents
        this.candidateService.getCandidateFull(candidateId).subscribe({
          next: candidate => { entry.documents = candidate.documents || []; },
          error: () => {}
        });
      },
      error: (err: any) => {
        entry.signing = false;
        entry.signError = err?.error?.message || err?.message || 'Erreur lors de la signature.';
      }
    });
  }

  reuploadSignedDoc(entry: DossierEntry, doc: any, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    entry.reuploadLoading = true;
    entry.reuploadSuccess = '';
    entry.reuploadError = '';
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      const content = raw.includes(',') ? raw.split(',')[1] : raw;
      const candidateId = entry.application.candidateId;
      this.candidateService.uploadCandidateDocument(candidateId, {
        name: `${doc.name.replace(/\.[^.]+$/, '')}_signe_cachet.pdf`,
        content,
        type: 'convention_signee',
        isSigned: true,
        status: 'signe'
      }).subscribe({
        next: () => {
          entry.reuploadLoading = false;
          entry.reuploadSuccess = 'Version signée uploadée avec succès.';
          this.refreshEntry(entry);
          (event.target as HTMLInputElement).value = '';
        },
        error: (err: any) => {
          entry.reuploadLoading = false;
          entry.reuploadError = err?.error?.message || 'Erreur lors de l\'upload.';
          (event.target as HTMLInputElement).value = '';
        }
      });
    };
    reader.readAsDataURL(file);
  }

  notifyCandidate(entry: DossierEntry): void {
    entry.notifyLoading = true;
    entry.notifyUrl = '';
    entry.notifyError = '';
    this.cdr.detectChanges();
    this.candidateService.generateTrackingLink(entry.application.candidateId).subscribe({
      next: (token) => {
        entry.notifyLoading = false;
        const url = `${window.location.origin}/candidat/suivi/${token}`;
        entry.notifyUrl = url;
        this.cdr.detectChanges();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).catch(() => {});
        }
      },
      error: (err: any) => {
        entry.notifyLoading = false;
        entry.notifyError = err?.error?.message || err?.message || 'Erreur lors de la génération du lien.';
        this.cdr.detectChanges();
      }
    });
  }

  copyNotifyUrl(entry: DossierEntry, input: HTMLInputElement): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(entry.notifyUrl).then(() => {
        entry.notifyUrl = '';
      }).catch(() => {
        input.select();
        window.prompt('Copiez ce lien :', entry.notifyUrl);
      });
    } else {
      window.prompt('Copiez ce lien :', entry.notifyUrl);
    }
  }

  getMailtoLink(entry: DossierEntry): string {
    const email = encodeURIComponent(entry.application.candidate?.email || '');
    const firstName = entry.application.candidate?.firstName || '';
    const lastName = entry.application.candidate?.lastName || '';
    const subject = encodeURIComponent(`Votre dossier de stage — document disponible`);
    const body = encodeURIComponent(
      `Bonjour ${firstName} ${lastName},\n\n` +
      `Votre demande de stage a été traitée et signée. Vous pouvez consulter et télécharger votre document depuis votre espace de suivi :\n\n` +
      `${entry.notifyUrl}\n\n` +
      `Cordialement,\nL'équipe RH`
    );
    return `https://mail.google.com/mail/?view=cm&to=${email}&su=${subject}&body=${body}`;
  }

  private buildBlobUrl(content: string, mime: string): SafeResourceUrl {
    const isBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(content.trim());
    let blob: Blob;
    if (isBase64) {
      const binary = atob(content.replace(/\s/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      blob = new Blob([bytes], { type: mime });
    } else {
      blob = new Blob([content], { type: mime + ';charset=utf-8' });
    }
    if (this._rawBlobUrl) URL.revokeObjectURL(this._rawBlobUrl);
    this._rawBlobUrl = URL.createObjectURL(blob);
    return this.sanitizer.bypassSecurityTrustResourceUrl(this._rawBlobUrl);
  }

  previewDoc(entry: DossierEntry, doc: any): void {
    this.closePreview();
    const open = (name: string, content: string) => {
      const mime = this.detectMime(name);
      const blobUrl = this.buildBlobUrl(content, mime);
      this.preview = { visible: true, name, content, mime, blobUrl };
    };

    if (doc.content) { open(doc.name, doc.content); return; }

    this.candidateService.downloadDocument(entry.application.candidateId, doc.id).subscribe({
      next: resp => open(resp.name || doc.name, resp.content || ''),
      error: () => alert('Impossible de charger le document.')
    });
  }

  downloadDoc(entry: DossierEntry, doc: any): void {
    const doDownload = (name: string, content: string) => {
      const lower = (name || '').toLowerCase();
      const mime = lower.endsWith('.pdf') ? 'application/pdf'
        : lower.endsWith('.png') ? 'image/png'
        : (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) ? 'image/jpeg'
        : 'application/octet-stream';
      const isBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(content.trim());
      let blob: Blob;
      if (isBase64) {
        const bytes = atob(content.replace(/\s/g, ''));
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        blob = new Blob([arr], { type: mime });
      } else {
        blob = new Blob([content], { type: mime.startsWith('text') ? mime + ';charset=utf-8' : mime });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    };

    if (doc.content) { doDownload(doc.name, doc.content); return; }

    this.candidateService.downloadDocument(entry.application.candidateId, doc.id).subscribe({
      next: resp => doDownload(resp.name || doc.name, resp.content || ''),
      error: () => alert('Erreur lors du téléchargement.')
    });
  }

  closePreview(): void {
    if (this._rawBlobUrl) { URL.revokeObjectURL(this._rawBlobUrl); this._rawBlobUrl = ''; }
    this.preview = { visible: false, name: '', content: '', mime: '', blobUrl: '' };
  }

  private detectMime(filename: string): string {
    const lower = (filename || '').toLowerCase();
    if (lower.endsWith('.pdf')) return 'application/pdf';
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html';
    if (lower.endsWith('.txt')) return 'text/plain';
    return 'application/octet-stream';
  }
}
