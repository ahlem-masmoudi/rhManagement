import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatchingService } from '../../services/matching.service';
import { CandidateService } from '../../services/candidate.service';
import { Application } from '../../models';
import { environment } from '../../../environments/environment';

interface DossierEntry {
  application: Application;
  documents: any[];
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
          <circle cx="24" cy="24" r="24" fill="#F0FDF4"/>
          <path d="M16 14h16v20H16V14z" fill="#D1FAE5" stroke="#059669" stroke-width="1.5"/>
          <path d="M20 20h8M20 25h6" stroke="#059669" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <h3>Aucun dossier pour le moment</h3>
        <p style="color:var(--gray-500)">Les candidats dont le statut est "Offre acceptée" apparaîtront ici avec leurs documents.</p>
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
            <div class="status-chip accepted">Offre acceptée</div>
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

          <!-- Documents section -->
          <div class="docs-section">
            <div class="docs-header">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
              </svg>
              <span>Documents</span>
              <button class="btn-refresh-card" (click)="refreshEntry(entry)" title="Rafraîchir les documents">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>

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
                  <span *ngIf="!doc.isSigned && doc.status === 'soumis'" class="pending-chip">En attente de signature</span>
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
          </div>
        </div>
      </div>

      <!-- Preview modal -->
      <div *ngIf="preview.visible" class="modal-overlay" (click)="closePreview()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ preview.name }}</h3>
            <button class="btn-secondary" (click)="closePreview()">Fermer</button>
          </div>
          <div class="modal-body">
            <object *ngIf="preview.mime === 'application/pdf'"
                    [data]="getDataUrl()" type="application/pdf" width="100%" height="600">
              Votre navigateur ne peut pas afficher ce PDF.
            </object>
            <img *ngIf="preview.mime && preview.mime.startsWith('image/')"
                 [src]="getDataUrl()" style="max-width:100%;max-height:600px;display:block;margin:auto"/>
            <pre *ngIf="preview.mime === 'text/html' || preview.mime === 'text/plain'"
                 style="white-space:pre-wrap;max-height:600px;overflow:auto;font-size:13px">{{ preview.content }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .dossiers-page { max-width: 100%; animation: fadeUp 0.4s ease both; }

    /* ── Page Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 26px 30px;
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
      border-radius: 18px;
      position: relative;
      overflow: hidden;
    }
    .page-header::before {
      content: '';
      position: absolute;
      width: 280px; height: 280px;
      background: radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%);
      top: -100px; right: -60px;
      border-radius: 50%;
      pointer-events: none;
    }
    .page-header h1 { color: white; font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .page-header .text-muted { color: rgba(255,255,255,0.6); font-size: 13px; margin: 0; }
    .header-right { position: relative; z-index: 1; }

    .header-right { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }

    .btn-refresh-all {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.15);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 10px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      backdrop-filter: blur(4px);
      transition: all 0.2s;
    }
    .btn-refresh-all:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
    .btn-refresh-all:disabled { opacity: 0.5; cursor: not-allowed; }

    .count-badge {
      background: rgba(255,255,255,0.15);
      color: white;
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 700;
      border: 1px solid rgba(255,255,255,0.25);
      backdrop-filter: blur(4px);
    }

    /* ── States ── */
    .empty-state, .loading-state {
      text-align: center;
      padding: 56px 24px;
      background: white;
      border-radius: 18px;
      box-shadow: 0 2px 14px rgba(0,0,0,0.05);
    }
    .empty-state h3 { margin: 0 0 8px; font-size: 18px; color: #111827; }
    .loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; color: #6B7280; }

    /* ── Dossier Grid ── */
    .dossiers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
      gap: 20px;
    }

    .dossier-card {
      background: white;
      border-radius: 18px;
      padding: 22px;
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 2px 14px rgba(0,0,0,0.06);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      animation: fadeUp 0.5s calc(var(--i, 0) * 0.08s) both;
      position: relative;
      overflow: hidden;
    }
    .dossier-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, #059669, #10b981);
    }
    .dossier-card:hover {
      box-shadow: 0 12px 40px rgba(5,150,105,0.12);
      transform: translateY(-4px);
      border-color: rgba(5,150,105,0.2);
    }

    /* ── Candidate Header ── */
    .candidate-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 20px;
      padding-bottom: 18px;
      border-bottom: 1px solid #f3f4f6;
    }
    .avatar {
      width: 46px; height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(5,150,105,0.3);
    }
    .candidate-info { flex: 1; min-width: 0; }
    .candidate-info h3 { margin: 0 0 5px; font-size: 16px; font-weight: 700; color: #111827; }
    .meta { font-size: 13px; color: #9CA3AF; line-height: 1.5; }

    .status-chip {
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      flex-shrink: 0;
      letter-spacing: 0.3px;
    }
    .accepted {
      background: linear-gradient(135deg, #D1FAE5, #A7F3D0);
      color: #065F46;
      border: 1px solid rgba(5,150,105,0.2);
    }

    /* ── Card Action Buttons ── */
    .card-actions-row {
      display: flex;
      gap: 10px;
      margin-bottom: 18px;
      padding-bottom: 18px;
      border-bottom: 1px solid #f3f4f6;
    }
    .btn-view {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; border: none; border-radius: 9px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 3px 10px rgba(99,102,241,0.3);
    }
    .btn-view:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(99,102,241,0.45); }

    .btn-delete {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px;
      background: white; color: #dc2626;
      border: 1.5px solid #fee2e2; border-radius: 9px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-delete:hover { background: #fee2e2; border-color: #dc2626; transform: translateY(-1px); }

    .btn-notify {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: white; border: none; border-radius: 10px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      box-shadow: 0 3px 10px rgba(14,165,233,0.3);
      transition: all 0.2s;
    }
    .btn-notify:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(14,165,233,0.45); }
    .btn-notify:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── Docs Section ── */
    .docs-header {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn-refresh-card {
      margin-left: auto;
      width: 26px; height: 26px;
      border: 1.5px solid #e5e7eb;
      border-radius: 7px;
      background: white;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #9CA3AF;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .btn-refresh-card:hover { background: #f0fdf4; color: #059669; border-color: #059669; }

    .doc-loading, .no-docs {
      font-size: 13px;
      color: #9CA3AF;
      padding: 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .docs-error {
      font-size: 13px;
      color: #dc2626;
      padding: 10px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .link-btn {
      background: none; border: none; padding: 0;
      color: #059669; font-size: 13px; font-weight: 600;
      cursor: pointer; text-decoration: underline;
    }
    .doc-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      border-top: 1px solid #f9fafb;
    }
    .doc-info { flex: 1; min-width: 0; }
    .doc-name { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 5px; }
    .doc-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

    .doc-type {
      font-size: 11px;
      padding: 3px 9px;
      border-radius: 999px;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    .type-demande_stage   { background: #FEF3C7; color: #92400E; }
    .type-convention_stage { background: #DBEAFE; color: #1E40AF; }
    .type-cv              { background: #F3F4F6; color: #374151; }
    .type-convention_signee { background: #D1FAE5; color: #065F46; }
    .type-autre           { background: #F3F4F6; color: #6B7280; }

    .signed-chip  { font-size: 11px; background: #D1FAE5; color: #065F46; padding: 3px 9px; border-radius: 999px; font-weight: 700; }
    .pending-chip { font-size: 11px; background: #FEF3C7; color: #92400E; padding: 3px 9px; border-radius: 999px; font-weight: 600; }

    .doc-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
    .btn-icon {
      width: 32px; height: 32px;
      border: 1.5px solid #e5e7eb;
      border-radius: 9px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #9CA3AF;
      transition: all 0.2s;
    }
    .btn-icon:hover { background: #f0fdf4; color: #059669; border-color: #059669; }

    .btn-sign {
      padding: 7px 16px;
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      border: none;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 3px 10px rgba(5,150,105,0.3);
    }
    .btn-sign:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(5,150,105,0.4); }

    /* ── Sign Form ── */
    .sign-form {
      margin-top: 16px;
      padding: 18px;
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border: 1px solid #A7F3D0;
      border-radius: 12px;
      animation: fadeUp 0.3s ease both;
    }
    .sign-form h4 { margin: 0 0 14px; font-size: 15px; color: #065F46; font-weight: 700; }
    .sign-form-section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #059669; margin: 0 0 10px; padding-bottom: 4px; border-bottom: 1px solid #D1FAE5; }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .form-group { margin-bottom: 12px; }
    .form-group label { display: block; font-size: 12px; font-weight: 700; margin-bottom: 5px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group textarea {
      width: 100%;
      padding: 10px 14px;
      border: 1.5px solid #D1FAE5;
      border-radius: 10px;
      font-size: 14px;
      background: white;
      outline: none;
      transition: all 0.2s;
      box-sizing: border-box;
    }
    .form-group input:focus, .form-group textarea:focus { border-color: #059669; box-shadow: 0 0 0 3px rgba(5,150,105,0.12); outline: none; }
    .form-group textarea { resize: vertical; font-family: inherit; }

    .btn-reupload {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 10px;
      background: #eff6ff; color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 7px;
      font-size: 11px; font-weight: 600; cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-reupload:hover { background: #dbeafe; }
    .btn-reupload.loading { opacity: 0.6; cursor: not-allowed; pointer-events: none; }

    .sign-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
    .btn-secondary {
      padding: 8px 18px;
      border: 1.5px solid #e5e7eb;
      border-radius: 9px;
      background: white;
      color: #374151;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-secondary:hover { background: #f9fafb; border-color: #374151; }
    .btn-primary {
      padding: 9px 20px;
      background: linear-gradient(135deg, #059669, #10b981);
      color: white;
      border: none;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 3px 10px rgba(5,150,105,0.3);
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(5,150,105,0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .alert { margin-top: 12px; padding: 10px 14px; border-radius: 10px; font-size: 13px; }
    .alert-success { background: #D1FAE5; color: #065F46; border: 1px solid #6EE7B7; }
    .alert-error   { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }

    /* ── Preview Modal ── */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(5px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .modal {
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 80px rgba(0,0,0,0.25);
      max-width: 840px; width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 22px;
      background: linear-gradient(135deg, #064e3b, #065f46);
    }
    .modal-header h3 { margin: 0; font-size: 16px; color: white; font-weight: 700; }
    .modal-header .btn-secondary {
      border: 1.5px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .modal-header .btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .modal-body { flex: 1; overflow: auto; }

    /* ── Spinner ── */
    .spinner {
      display: inline-block;
      width: 22px; height: 22px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    .spinner-sm { width: 14px; height: 14px; border-width: 2px; }

    /* ── Notify row ── */
    .notify-url-row {
      margin-top: 10px;
      padding: 10px 12px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
    }
    .notify-url-label { font-size: 11px; font-weight: 600; color: #1e40af; margin-bottom: 6px; }
    .notify-url-inner { display: flex; align-items: center; gap: 6px; }
    .notify-url-input {
      flex: 1; min-width: 0;
      border: 1px solid #bfdbfe; border-radius: 7px;
      padding: 6px 10px; font-size: 12px; color: #1e3a8a;
      background: white; cursor: text;
    }
    .btn-copy-notify, .btn-email-notify {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 12px;
      border: none; border-radius: 7px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      white-space: nowrap; text-decoration: none;
    }
    .btn-copy-notify { background: #1d4ed8; color: white; }
    .btn-copy-notify:hover { background: #1e40af; }
    .btn-email-notify { background: #059669; color: white; }
    .btn-email-notify:hover { background: #047857; }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 14px; padding: 20px; }
      .dossiers-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DossiersComponent implements OnInit {
  dossiers: DossierEntry[] = [];
  loading = true;

  preview: { visible: boolean; name: string; content: string; mime: string } = {
    visible: false, name: '', content: '', mime: ''
  };

  private apiUrl = environment.apiUrl;

  constructor(
    private matchingService: MatchingService,
    private candidateService: CandidateService,
    private router: Router
  ) {}

  viewProfile(candidateId: string): void {
    this.router.navigate(['/rh/profil', candidateId]);
  }

  removeDossier(entry: DossierEntry): void {
    const name = `${entry.application.candidate?.firstName} ${entry.application.candidate?.lastName}`;
    if (!confirm(`Supprimer le dossier de ${name} ?`)) return;
    this.dossiers = this.dossiers.filter(d => d !== entry);
  }

  ngOnInit(): void {
    this.matchingService.getApplications().subscribe(apps => {
      const accepted = apps.filter(a => a.status === 'offre_acceptee');
      this.dossiers = accepted.map(app => ({
        application: app,
        documents: [],
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
        notifyUrl: ''
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
        notifyUrl: ''
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
    this.candidateService.generateTrackingLink(entry.application.candidateId).subscribe({
      next: (token) => {
        entry.notifyLoading = false;
        const url = `${window.location.origin}/candidat/suivi/${token}`;
        entry.notifyUrl = url;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).catch(() => {});
        }
      },
      error: () => { entry.notifyLoading = false; }
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

  previewDoc(entry: DossierEntry, doc: any): void {
    if (doc.content) {
      this.preview = {
        visible: true,
        name: doc.name,
        content: doc.content,
        mime: this.detectMime(doc.name)
      };
      return;
    }
    this.candidateService.downloadDocument(entry.application.candidateId, doc.id).subscribe({
      next: resp => {
        this.preview = {
          visible: true,
          name: resp.name || doc.name,
          content: resp.content || '',
          mime: this.detectMime(resp.name || doc.name)
        };
      },
      error: () => alert('Impossible de charger le document.')
    });
  }

  downloadDoc(entry: DossierEntry, doc: any): void {
    const doDownload = (name: string, content: string) => {
      const isBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(content.trim());
      let blob: Blob;
      if (isBase64) {
        const bytes = atob(content.replace(/\s/g, ''));
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        blob = new Blob([arr]);
      } else {
        blob = new Blob([content], { type: 'text/html;charset=utf-8' });
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
    this.preview = { visible: false, name: '', content: '', mime: '' };
  }

  getDataUrl(): string {
    if (!this.preview.content) return '';
    const isBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(this.preview.content.trim());
    if (isBase64) return `data:${this.preview.mime};base64,${this.preview.content.replace(/\s/g, '')}`;
    return `data:${this.preview.mime};charset=utf-8,${encodeURIComponent(this.preview.content)}`;
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
