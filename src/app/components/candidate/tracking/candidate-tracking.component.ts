import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from '../../../services/candidate.service';
import { Candidate, StatusChange, CandidateDocument } from '../../../models';

@Component({
  selector: 'app-candidate-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="tracking-page">

      <!-- Background orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <!-- Header -->
      <header class="top-header">
        <div class="header-logo">
          <div class="header-icon">
            <svg width="20" height="20" fill="white" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clip-rule="evenodd"/>
            </svg>
          </div>
          <span class="header-title">
            🎓&nbsp;Suivi de candidature
          </span>
        </div>
      </header>

      <!-- Stage terminé -->
      <div class="container" *ngIf="candidate && candidate.status === 'stage_termine'">
        <div class="glass-card done-card" style="--delay:0.05s">
          <div class="done-icon">🏁</div>
          <h2 class="done-title">Stage terminé</h2>
          <p class="done-sub">Votre stage est maintenant clôturé. Merci pour votre engagement et votre contribution au sein de l'équipe I.NET.</p>
          <div class="done-badge">Ce lien de suivi est désormais archivé.</div>
        </div>
      </div>

      <div class="container" *ngIf="candidate && candidate.status !== 'stage_termine'; else notFound">

        <!-- Welcome card -->
        <div class="glass-card welcome-card" style="--delay:0.05s">
          <div class="welcome-left">
            <div class="candidate-avatar">{{ getInitials() }}</div>
            <div>
              <h1 class="welcome-name">Bonjour, {{ candidate.firstName }} {{ candidate.lastName }} <span *ngIf="isLastYear()">🎓</span><span *ngIf="!isLastYear()">👋</span></h1>
              <p class="welcome-sub">Bienvenue sur votre espace de suivi personnalisé</p>
            </div>
          </div>
          <div class="welcome-offer" *ngIf="application?.offer?.title">
            <div class="offer-chip">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
              {{ application.offer.title }}
            </div>
          </div>
        </div>

        <!-- Status card -->
        <div class="glass-card status-card" style="--delay:0.12s">
          <div class="status-header-row">
            <h2 class="card-title">Statut de votre candidature</h2>
          </div>

          <!-- Pipeline steps -->
          <div class="pipeline">
            <div *ngFor="let step of pipelineSteps; let i = index"
                 class="pipeline-step"
                 [class.done]="isStepDone(step.status)"
                 [class.active]="isStepActive(step.status)"
                 [class.refused]="candidate.status === 'offre_refusee' && step.status === 'offre_refusee'">
              <div class="step-dot">
                <svg *ngIf="isStepDone(step.status) && !isStepActive(step.status)" width="12" height="12" fill="white" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="step-label">{{ step.label }}</div>
            </div>
          </div>

          <!-- Current status badge -->
          <div class="status-center">
            <div class="status-badge-wrap">
              <div class="status-badge" [style.background]="getStatusGradient(candidate.status)">
                {{ getStatusLabel(candidate.status) }}
              </div>
              <div class="status-pulse" [style.background]="getStatusColor(candidate.status)"></div>
            </div>
            <p class="status-desc">{{ getStatusDescription(candidate.status) }}</p>
          </div>
        </div>

        <!-- Interview card -->
        <div class="glass-card interview-card" *ngIf="hasInterviewInfo()" style="--delay:0.18s">
          <h2 class="card-title">
            <span class="card-icon cal-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            </span>
            Votre entretien
          </h2>
          <div class="interview-grid">
            <div class="interview-block">
              <div class="ib-label">Date</div>
              <div class="ib-value">{{ formatInterviewDate(application?.interviewDate) }}</div>
            </div>
            <div class="interview-block">
              <div class="ib-label">Heure</div>
              <div class="ib-value">{{ application?.interviewTime }}</div>
            </div>
            <div class="interview-block" *ngIf="application?.offer?.title">
              <div class="ib-label">Poste</div>
              <div class="ib-value">{{ application?.offer?.title }}</div>
            </div>
            <div class="interview-block" *ngIf="application?.interviewNotes">
              <div class="ib-label">Notes</div>
              <div class="ib-value small">{{ application?.interviewNotes }}</div>
            </div>
          </div>
          <div class="interview-advice">
            <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
            Merci de vous présenter à l'heure indiquée. En cas d'empêchement, contactez-nous dans les meilleurs délais.
          </div>
        </div>

        <!-- Discord card -->
        <div class="discord-card" *ngIf="candidate.status === 'offre_acceptee'" style="--delay:0.22s; animation: cardIn 0.55s cubic-bezier(.34,1.56,.64,1) var(--delay) both;">
          <div class="discord-glow"></div>
          <div class="discord-inner">
            <div class="discord-logo">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
            </div>
            <div class="discord-body">
              <h3>Rejoignez notre groupe Discord</h3>
              <p>Afin de faciliter la communication durant votre encadrement, nous avons créé un groupe Discord. N'hésitez pas à rejoindre ce groupe pour échanger avec votre encadrant.</p>
              <a href="https://discord.gg/aeFTt2AgpA" target="_blank" class="discord-btn">
                Rejoindre le Discord
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Upload demande de stage -->
        <div class="glass-card upload-card" *ngIf="canUploadDemandeStage()" style="--delay:0.26s">
          <h2 class="card-title">
            📤&nbsp;Déposer votre demande de stage
          </h2>
          <p class="upload-intro">Félicitations ! Veuillez déposer votre <strong>demande de stage</strong> (PDF) afin que l'équipe RH puisse la signer et vous la retourner.</p>

          <div *ngIf="getUnsignedDemandeStage()" class="doc-banner pending-banner">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
            <div>
              <strong>{{ getUnsignedDemandeStage()?.name }}</strong> — en attente de signature RH
              <div class="banner-sub">Vous pouvez remplacer le fichier si nécessaire.</div>
            </div>
          </div>

          <div *ngIf="getSignedDemandeStage()" class="doc-banner signed-banner">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            <div style="flex:1">
              <strong>Demande signée disponible !</strong>
              <div class="banner-sub">{{ getSignedDemandeStage()?.name }}</div>
            </div>
            <button class="btn-dl" (click)="downloadDocument(getSignedDemandeStage()!)">Télécharger</button>
          </div>

          <div class="file-drop" (click)="fileInput.click()" [class.has-file]="selectedFile">
            <div class="file-drop-icon">
              <svg width="28" height="28" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>
            </div>
            <p *ngIf="!selectedFile">Cliquez pour sélectionner un fichier PDF</p>
            <p *ngIf="selectedFile"><strong>{{ selectedFile.name }}</strong> &nbsp;·&nbsp; {{ formatFileSize(selectedFile.size) }}</p>
            <input #fileInput type="file" accept=".pdf,application/pdf" style="display:none" (change)="onFileSelected($event)">
          </div>

          <div *ngIf="uploadError" class="alert-error">{{ uploadError }}</div>

          <button class="btn-upload" [disabled]="!selectedFile || uploadLoading" (click)="uploadDemandeStage()">
            <span *ngIf="!uploadLoading">Déposer ma demande de stage</span>
            <span *ngIf="uploadLoading" class="btn-loading"><span class="spinner"></span> Dépôt en cours...</span>
          </button>

          <div *ngIf="uploadSuccess" class="alert-success">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            Document déposé avec succès. L'équipe RH va le traiter prochainement.
          </div>
        </div>

        <!-- Other documents -->
        <div class="glass-card docs-card" *ngIf="getOtherDocuments().length > 0" style="--delay:0.30s">
          <h2 class="card-title">
            <span class="card-icon doc-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>
            </span>
            Mes documents
          </h2>
          <div *ngFor="let doc of getOtherDocuments()" class="doc-item">
            <div class="doc-info">
              <div class="doc-name">{{ doc.name }}</div>
              <div class="doc-meta">
                {{ getDocTypeLabel(doc.type) }}
                <span *ngIf="doc.isSigned" class="signed-chip">Signé ✓</span>
              </div>
            </div>
            <button class="btn-dl" (click)="downloadDocument(doc)">Télécharger</button>
          </div>
        </div>

        <!-- Timeline -->
        <div class="glass-card timeline-card" style="--delay:0.34s">
          <h2 class="card-title">
            <span class="card-icon hist-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
            </span>
            Historique
          </h2>
          <div class="timeline" *ngIf="getStatusHistory().length > 0; else noHistory">
            <div *ngFor="let change of getStatusHistory(); let isLast = last"
                 class="tl-item" [class.tl-current]="isLast">
              <div class="tl-dot" [style.background]="getStatusColor(change.newStatus)">
                <svg *ngIf="isLast" width="10" height="10" fill="white" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="tl-content">
                <div class="tl-row">
                  <strong>{{ getStatusLabel(change.newStatus) }}</strong>
                  <span class="tl-date">{{ formatDate(change.changedAt) }}</span>
                </div>
                <p *ngIf="change.comment" class="tl-comment">{{ change.comment }}</p>
                <span *ngIf="change.emailSent" class="email-chip">📧 Email envoyé</span>
              </div>
            </div>
          </div>
          <ng-template #noHistory>
            <p class="empty-text">Aucun historique disponible pour le moment.</p>
          </ng-template>
        </div>

        <!-- Contact -->
        <div class="glass-card contact-card" style="--delay:0.38s">
          <h2 class="card-title">
            <span class="card-icon phone-icon">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            </span>
            Besoin d'aide ?
          </h2>
          <p class="contact-intro">Si vous avez des questions concernant votre candidature, n'hésitez pas à nous contacter :</p>
          <div class="contact-items">
            <div class="contact-item">
              <span class="ci-icon">📧</span>
              <span>recrutement&#64;i-net.tn</span>
            </div>
            <div class="contact-item">
              <span class="ci-icon">📞</span>
              <span>+216 92 313 572</span>
            </div>
            <div class="contact-item">
              <span class="ci-icon">⏰</span>
              <span>Lundi – Vendredi, 8h – 17h</span>
            </div>
          </div>
        </div>

      </div><!-- /container -->

      <!-- Not found -->
      <ng-template #notFound>
        <div class="container">
          <div class="glass-card error-card" style="--delay:0.05s">
            <div class="error-icon">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            <h2>Lien invalide</h2>
            <p>Ce lien de suivi n'est pas valide.<br>Vérifiez votre email ou contactez notre service RH.</p>
          </div>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .tracking-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 28px 16px 60px;
      position: relative;
      overflow-x: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ── Orbs ── */
    .orb {
      position: fixed;
      border-radius: 50%;
      filter: blur(70px);
      opacity: 0.22;
      pointer-events: none;
      z-index: 0;
    }
    .orb-1 { width: 500px; height: 500px; background: #9b59b6; top: -150px; right: -100px; animation: orbFloat 14s ease-in-out infinite; }
    .orb-2 { width: 350px; height: 350px; background: #667eea; bottom: 10%; left: -80px; animation: orbFloat 18s ease-in-out infinite reverse; }
    .orb-3 { width: 250px; height: 250px; background: #b39ddb; bottom: 40%; right: 5%; animation: orbFloat 22s ease-in-out infinite 4s; }

    @keyframes orbFloat {
      0%,100% { transform: translate(0,0) scale(1); }
      33%      { transform: translate(25px,-18px) scale(1.04); }
      66%      { transform: translate(-18px,14px) scale(0.96); }
    }

    /* ── Header ── */
    .top-header {
      position: relative; z-index: 1;
      display: flex; align-items: center; justify-content: center; flex-direction: column;
      max-width: 720px; margin: 0 auto 32px; text-align: center;
      animation: cardIn 0.5s ease both;
    }
    .header-logo { display: flex; align-items: center; gap: 10px; justify-content: center; }
    .header-icon {
      width: 44px; height: 44px; border-radius: 14px;
      background: linear-gradient(135deg, #764ba2, #9b59b6);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 6px 18px rgba(118,75,162,0.45);
    }
    .header-title {
      font-size: 26px; font-weight: 900; color: white;
      letter-spacing: -0.6px; text-shadow: 0 2px 12px rgba(0,0,0,0.18);
    }

    /* ── Container ── */
    .container {
      position: relative; z-index: 1;
      max-width: 720px; margin: 0 auto;
      display: flex; flex-direction: column; gap: 18px;
    }

    /* ── Glass card ── */
    .glass-card {
      background: white;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      animation: cardIn 0.55s cubic-bezier(.34,1.56,.64,1) var(--delay, 0s) both;
    }

    @keyframes cardIn {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)    scale(1); }
    }

    .card-title {
      font-size: 15px; font-weight: 700; color: #1f2937;
      margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
    }
    .card-icon {
      width: 30px; height: 30px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .cal-icon    { background: rgba(102,126,234,0.12); color: #667eea; }
    .upload-icon { background: rgba(118,75,162,0.12); color: #764ba2; }
    .doc-icon    { background: rgba(155,89,182,0.12); color: #9b59b6; }
    .hist-icon   { background: rgba(245,158,11,0.12); color: #d97706; }
    .phone-icon  { background: rgba(16,185,129,0.12); color: #059669; }

    /* ── Welcome card ── */
    .welcome-card {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; flex-wrap: wrap;
    }
    .welcome-left { display: flex; align-items: center; gap: 16px; }
    .candidate-avatar {
      width: 54px; height: 54px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; font-size: 18px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 3px rgba(102,126,234,0.2), 0 4px 16px rgba(102,126,234,0.3);
      flex-shrink: 0;
    }
    .welcome-name {
      font-size: 20px; font-weight: 800; color: #1f2937;
      letter-spacing: -0.4px; line-height: 1.3;
    }
    .welcome-sub { font-size: 13px; color: #6b7280; margin-top: 3px; }
    .offer-chip {
      display: flex; align-items: center; gap: 6px;
      background: rgba(102,126,234,0.08); border: 1px solid rgba(102,126,234,0.2);
      border-radius: 99px; padding: 6px 14px;
      font-size: 12px; font-weight: 600; color: #667eea;
      white-space: nowrap;
    }

    /* ── Status card ── */
    .status-card { }
    .status-header-row { margin-bottom: 24px; }

    /* Pipeline steps */
    .pipeline {
      display: flex; align-items: flex-start; justify-content: space-between;
      position: relative; margin-bottom: 32px;
    }
    .pipeline::before {
      content: '';
      position: absolute;
      top: 14px; left: 14px; right: 14px; height: 2px;
      background: #e5e7eb;
      z-index: 0;
    }
    .pipeline-step {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      position: relative; z-index: 1; flex: 1;
    }
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%;
      background: #f3f4f6;
      border: 2px solid #e5e7eb;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s;
    }
    .pipeline-step.done .step-dot {
      background: rgba(102,126,234,0.2);
      border-color: #667eea;
    }
    .pipeline-step.active .step-dot {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-color: #764ba2;
      box-shadow: 0 0 0 4px rgba(102,126,234,0.3);
      animation: pulseDot 2s ease infinite;
    }
    .pipeline-step.refused .step-dot {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      border-color: #ef4444;
    }
    @keyframes pulseDot {
      0%,100% { box-shadow: 0 0 0 4px rgba(102,126,234,0.3); }
      50%      { box-shadow: 0 0 0 8px rgba(102,126,234,0.1); }
    }
    .step-label {
      font-size: 10px; font-weight: 600; color: #9ca3af;
      text-align: center; letter-spacing: 0.3px; max-width: 70px; line-height: 1.3;
    }
    .pipeline-step.done .step-label,
    .pipeline-step.active .step-label { color: #374151; }

    /* Status badge */
    .status-center { text-align: center; }
    .status-badge-wrap { position: relative; display: inline-block; margin-bottom: 12px; }
    .status-badge {
      display: inline-block; padding: 12px 32px;
      border-radius: 99px; color: white;
      font-size: 16px; font-weight: 800;
      letter-spacing: -0.3px;
      position: relative; z-index: 1;
    }
    .status-pulse {
      position: absolute; inset: -4px; border-radius: 99px;
      opacity: 0.3; animation: pulseBadge 2.5s ease infinite;
      z-index: 0;
    }
    @keyframes pulseBadge {
      0%,100% { transform: scale(1); opacity: 0.3; }
      50%      { transform: scale(1.06); opacity: 0.15; }
    }
    .status-desc { font-size: 14px; color: #6b7280; line-height: 1.6; max-width: 480px; margin: 0 auto; }

    /* ── Interview card ── */
    .interview-card { border-left: 3px solid #667eea; }
    .interview-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px; margin-bottom: 16px;
    }
    .interview-block {
      background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 14px 16px;
    }
    .ib-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; margin-bottom: 6px; }
    .ib-value { font-size: 15px; font-weight: 700; color: #1f2937; }
    .ib-value.small { font-size: 13px; font-weight: 500; }
    .interview-advice {
      display: flex; align-items: flex-start; gap: 8px;
      background: rgba(102,126,234,0.07); border: 1px solid rgba(102,126,234,0.2);
      border-radius: 10px; padding: 11px 14px;
      font-size: 13px; color: #4c51bf; line-height: 1.5;
    }
    .interview-advice svg { flex-shrink: 0; margin-top: 1px; }

    /* ── Discord card ── */
    .discord-card {
      background: linear-gradient(135deg, #4752c4, #5865f2, #7289da);
      border-radius: 20px; overflow: hidden; position: relative;
    }
    .discord-glow {
      position: absolute; top: -30px; right: -30px;
      width: 200px; height: 200px; border-radius: 50%;
      background: rgba(255,255,255,0.08); pointer-events: none;
    }
    .discord-inner { display: flex; align-items: flex-start; gap: 20px; padding: 26px; }
    .discord-logo {
      width: 50px; height: 50px; background: rgba(255,255,255,0.15);
      border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .discord-body { flex: 1; }
    .discord-body h3 { font-size: 17px; font-weight: 800; color: white; margin-bottom: 8px; }
    .discord-body p  { font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 16px; }
    .discord-btn {
      display: inline-flex; align-items: center; gap: 7px;
      background: white; color: #5865f2;
      padding: 10px 20px; border-radius: 10px;
      text-decoration: none; font-weight: 800; font-size: 13px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .discord-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.25); }

    /* ── Upload card ── */
    .upload-intro { font-size: 13.5px; color: #6b7280; line-height: 1.6; margin-bottom: 18px; }
    .upload-intro strong { color: #1f2937; }

    .doc-banner {
      display: flex; align-items: flex-start; gap: 10px;
      border-radius: 12px; padding: 12px 14px; margin-bottom: 14px;
      font-size: 13px;
    }
    .pending-banner { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
    .signed-banner  { background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; }
    .banner-sub { font-size: 11px; opacity: 0.75; margin-top: 3px; }

    .file-drop {
      border: 2px dashed #d1d5db; border-radius: 14px;
      padding: 32px 16px; text-align: center; cursor: pointer;
      transition: border-color 0.2s, background 0.2s; margin-bottom: 14px;
    }
    .file-drop:hover, .file-drop.has-file {
      border-color: #764ba2; background: rgba(118,75,162,0.05);
    }
    .file-drop-icon { color: #d1d5db; margin-bottom: 10px; }
    .file-drop p { font-size: 13.5px; color: #9ca3af; }
    .file-drop.has-file p { color: #764ba2; font-weight: 600; }

    .btn-upload {
      width: 100%; padding: 13px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white; border: none; border-radius: 12px;
      font-size: 14px; font-weight: 700; cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
      box-shadow: 0 4px 16px rgba(102,126,234,0.35);
    }
    .btn-upload:hover:not(:disabled) { transform: translateY(-2px); opacity: 0.92; }
    .btn-upload:disabled { opacity: 0.4; cursor: default; }
    .btn-loading { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .alert-error {
      font-size: 13px; color: #b91c1c;
      background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 10px; padding: 10px 14px; margin-bottom: 12px;
    }
    .alert-success {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: #065f46;
      background: #ecfdf5; border: 1px solid #6ee7b7;
      border-radius: 10px; padding: 10px 14px; margin-top: 12px;
    }

    .btn-dl {
      background: #f3f4f6; border: 1px solid #e5e7eb;
      color: #374151; border-radius: 8px; padding: 7px 14px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      transition: background 0.15s; white-space: nowrap; flex-shrink: 0;
    }
    .btn-dl:hover { background: #e5e7eb; }

    /* ── Docs card ── */
    .doc-item {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      padding: 14px 16px; border-radius: 12px;
      background: #f9fafb; border: 1px solid #f3f4f6;
      margin-bottom: 10px;
    }
    .doc-item:last-child { margin-bottom: 0; }
    .doc-name { font-size: 13.5px; font-weight: 600; color: #1f2937; }
    .doc-meta { font-size: 11.5px; color: #9ca3af; margin-top: 3px; }
    .signed-chip {
      display: inline-block; background: #ecfdf5;
      color: #065f46; padding: 2px 8px; border-radius: 99px;
      font-size: 10.5px; font-weight: 700; margin-left: 6px;
      border: 1px solid #6ee7b7;
    }

    /* ── Timeline ── */
    .timeline { display: flex; flex-direction: column; gap: 16px; position: relative; padding-left: 36px; }
    .timeline::before {
      content: ''; position: absolute; left: 13px; top: 6px; bottom: 6px;
      width: 2px; background: linear-gradient(to bottom, #764ba2, rgba(102,126,234,0.1));
    }
    .tl-item { position: relative; }
    .tl-dot {
      position: absolute; left: -36px;
      width: 26px; height: 26px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      border: 3px solid white;
    }
    .tl-current .tl-dot { box-shadow: 0 0 0 3px rgba(102,126,234,0.25); }
    .tl-content {
      background: #f9fafb; border: 1px solid #f3f4f6;
      border-radius: 12px; padding: 12px 16px;
    }
    .tl-current .tl-content {
      background: rgba(102,126,234,0.06); border-color: rgba(102,126,234,0.2);
    }
    .tl-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .tl-row strong { font-size: 13.5px; color: #1f2937; }
    .tl-date { font-size: 11.5px; color: #9ca3af; }
    .tl-comment { font-size: 12.5px; color: #6b7280; font-style: italic; margin-top: 4px; }
    .email-chip {
      display: inline-block; margin-top: 6px;
      background: #eff6ff; color: #1d4ed8;
      border-radius: 99px; padding: 2px 9px; font-size: 11px; font-weight: 600;
      border: 1px solid #bfdbfe;
    }
    .empty-text { font-size: 13px; color: #9ca3af; text-align: center; padding: 20px 0; }

    /* ── Contact card ── */
    .contact-intro { font-size: 13.5px; color: #6b7280; margin-bottom: 16px; line-height: 1.6; }
    .contact-items { display: flex; flex-direction: column; gap: 10px; }
    .contact-item {
      display: flex; align-items: center; gap: 12px;
      background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 10px; padding: 11px 14px;
      font-size: 13.5px; color: #374151;
    }
    .ci-icon { font-size: 16px; }

    /* ── Done card (stage terminé) ── */
    .done-card { text-align: center; padding: 52px 28px; }
    .done-icon { font-size: 52px; margin-bottom: 16px; }
    .done-title { font-size: 22px; font-weight: 800; color: #1f2937; margin-bottom: 10px; }
    .done-sub { font-size: 14px; color: #6b7280; line-height: 1.7; margin-bottom: 20px; }
    .done-badge {
      display: inline-block; padding: 8px 20px; border-radius: 99px;
      background: #f3f4f6; border: 1px solid #e5e7eb;
      font-size: 12px; color: #6b7280; font-weight: 600;
    }

    /* ── Error card ── */
    .error-card { text-align: center; padding: 48px 28px; }
    .error-icon { color: #ef4444; margin-bottom: 20px; }
    .error-card h2 { font-size: 20px; font-weight: 800; color: #1f2937; margin-bottom: 10px; }
    .error-card p { font-size: 14px; color: #6b7280; line-height: 1.7; }

    /* ── Responsive ── */
    @media (max-width: 600px) {
      .tracking-page { padding: 20px 12px 48px; }
      .glass-card { padding: 20px; }
      .welcome-name { font-size: 17px; }
      .pipeline { gap: 0; }
      .step-label { font-size: 9px; max-width: 55px; }
      .interview-grid { grid-template-columns: 1fr 1fr; }
      .discord-inner { flex-direction: column; gap: 14px; }
      .top-header { flex-direction: column; align-items: flex-start; gap: 6px; }
    }
  `]
})
export class CandidateTrackingComponent implements OnInit {
  candidate: Candidate | undefined;
  trackingToken: string = '';
  application: any = null;

  selectedFile: File | null = null;
  uploadLoading = false;
  uploadError = '';
  uploadSuccess = false;

  pipelineSteps = [
    { status: 'nouveau',              label: 'Reçue' },
    { status: 'preselectionne',       label: 'Présélection' },
    { status: 'entretien_programme',  label: 'Entretien' },
    { status: 'offre_acceptee',       label: 'Accepté(e)' },
    { status: 'offre_refusee',        label: 'Refusé(e)' },
  ];

  private readonly statusOrder = ['nouveau','preselectionne','entretien_programme','offre_acceptee'];

  constructor(
    private route: ActivatedRoute,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    this.trackingToken = this.route.snapshot.paramMap.get('token') || '';
    if (this.trackingToken) {
      this.candidateService.getTrackingCandidate(this.trackingToken).subscribe({
        next: (candidate) => {
          this.application = candidate.application || null;
          this.candidate = {
            id: candidate._id,
            firstName: candidate.userId?.firstName || '',
            lastName: candidate.userId?.lastName || '',
            email: candidate.userId?.email || '',
            phone: candidate.phone || '',
            status: candidate.status || 'nouveau',
            school: candidate.school || '',
            level: candidate.educationLevel || '',
            expectedDegree: candidate.expectedDegree || '',
            expectedGraduation: candidate.expectedGraduation || '',
            location: candidate.location || '',
            availability: candidate.availability || '',
            skills: (candidate.skills || []).map((skill: string) => ({ name: skill })),
            experiences: [],
            projects: [],
            languages: [],
            documents: candidate.documents || [],
            statusHistory: candidate.statusHistory || [],
            createdAt: candidate.createdAt,
            updatedAt: candidate.updatedAt
          };
        },
        error: () => { this.candidate = undefined; }
      });
    }
  }

  isLastYear(): boolean {
    const deg   = (this.candidate?.expectedDegree || '').toLowerCase();
    const level = (this.candidate?.level || '').toLowerCase();
    const combined = deg + ' ' + level;
    return /licence\s*3|l3\b|master\s*2|m2\b|ing[eé]nieur\s*3|3[eè]me\s*ann[eé]e\s*ing|cycle\s*ing[eé]nieur\s*3|derni[eè]re\s*ann[eé]e/.test(combined);
  }

  getInitials(): string {
    const f = this.candidate?.firstName?.[0] || '';
    const l = this.candidate?.lastName?.[0] || '';
    return (f + l).toUpperCase();
  }

  isStepDone(status: string): boolean {
    if (!this.candidate) return false;
    const cur = this.candidate.status;
    if (cur === 'offre_refusee') return status === 'nouveau' || status === 'preselectionne';
    const curIdx = this.statusOrder.indexOf(cur);
    const stepIdx = this.statusOrder.indexOf(status);
    return stepIdx !== -1 && stepIdx <= curIdx;
  }

  isStepActive(status: string): boolean {
    return this.candidate?.status === status;
  }

  hasInterviewInfo(): boolean {
    return !!this.application?.interviewDate && !!this.application?.interviewTime;
  }

  canUploadDemandeStage(): boolean {
    return ['offre_acceptee','en_attente_documents','documents_recus'].includes(this.candidate?.status || '');
  }

  getUnsignedDemandeStage(): CandidateDocument | null {
    return (this.candidate?.documents || []).find((d: any) => d.type === 'demande_stage' && !d.isSigned) || null;
  }

  getSignedDemandeStage(): CandidateDocument | null {
    return (this.candidate?.documents || []).find((d: any) => d.type === 'demande_stage' && d.isSigned) || null;
  }

  getOtherDocuments(): CandidateDocument[] {
    return (this.candidate?.documents || []).filter((d: any) => d.type !== 'demande_stage');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    this.uploadError = '';
    this.uploadSuccess = false;
  }

  uploadDemandeStage(): void {
    if (!this.selectedFile || !this.trackingToken) return;
    if (this.selectedFile.size > 10 * 1024 * 1024) { this.uploadError = 'Le fichier ne doit pas dépasser 10 Mo.'; return; }
    this.uploadLoading = true;
    this.uploadError = '';
    this.uploadSuccess = false;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.candidateService.uploadTrackingDocument(this.trackingToken, {
        name: this.selectedFile!.name, content: base64, type: 'demande_stage'
      }).subscribe({
        next: () => {
          this.uploadLoading = false;
          this.uploadSuccess = true;
          this.selectedFile = null;
          this.candidateService.getTrackingCandidate(this.trackingToken).subscribe({
            next: (c) => { if (this.candidate) this.candidate.documents = c.documents || []; }
          });
        },
        error: (msg: string) => { this.uploadLoading = false; this.uploadError = msg || 'Erreur lors du dépôt.'; }
      });
    };
    reader.readAsDataURL(this.selectedFile);
  }

  downloadDocument(doc: CandidateDocument): void {
    if (!this.trackingToken) return;
    this.candidateService.downloadTrackingDocument(this.trackingToken, doc.id).subscribe({
      next: (response) => {
        const content = response.content || '';
        const name = response.name || doc.name;
        let blob: Blob;
        const isBase64 = content.length > 0 && /^[A-Za-z0-9+/=\r\n]+$/.test(content.trim());
        if (isBase64) {
          const binary = atob(content.replace(/\s/g, ''));
          const arr = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
          const lower = name.toLowerCase();
          const mime = lower.endsWith('.pdf') ? 'application/pdf' : lower.endsWith('.png') ? 'image/png' : lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'image/jpeg' : 'application/octet-stream';
          blob = new Blob([arr], { type: mime });
        } else {
          blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        }
        const url = window.URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url; link.download = name; link.click();
        window.URL.revokeObjectURL(url);
      }
    });
  }

  getStatusHistory(): StatusChange[] { return this.candidate?.statusHistory || []; }

  getDocTypeLabel(type: any): string {
    return ({ cv:'CV', lettre_motivation:'Lettre de motivation', demande_stage:'Demande de stage', convention_stage:'Convention de stage', convention_signee:'Convention signée', attestation:'Lettre d\'affectation', autre:'Autre' } as any)[type || 'autre'] || type || 'Document';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  getStatusLabel(status: string): string {
    return ({ nouveau:'Nouveau', preselectionne:'Présélectionné', en_attente_documents:'En attente de documents', documents_recus:'Documents reçus', entretien_programme:'Entretien programmé', entretien_realise:'Entretien réalisé', validation_finale:'Validation finale', offre_envoyee:'Offre envoyée', offre_acceptee:'Accepté(e)', offre_refusee:'Refusé(e)', rejete:'Rejeté', abandonne:'Abandonné', stage_termine:'Stage terminé' } as any)[status] || status;
  }

  getStatusColor(status: string): string {
    return ({ nouveau:'#6b7280', preselectionne:'#667eea', en_attente_documents:'#f59e0b', documents_recus:'#764ba2', entretien_programme:'#667eea', entretien_realise:'#7c6fd4', validation_finale:'#764ba2', offre_envoyee:'#10b981', offre_acceptee:'#059669', offre_refusee:'#ef4444', rejete:'#dc2626', abandonne:'#6b7280', stage_termine:'#059669' } as any)[status] || '#6b7280';
  }

  getStatusGradient(status: string): string {
    const gradients: Record<string,string> = {
      nouveau: 'linear-gradient(135deg,#4b5563,#6b7280)',
      preselectionne: 'linear-gradient(135deg,#2563eb,#3b82f6)',
      en_attente_documents: 'linear-gradient(135deg,#d97706,#f59e0b)',
      documents_recus: 'linear-gradient(135deg,#7c3aed,#8b5cf6)',
      entretien_programme: 'linear-gradient(135deg,#0891b2,#06b6d4)',
      entretien_realise: 'linear-gradient(135deg,#0284c7,#0ea5e9)',
      validation_finale: 'linear-gradient(135deg,#4f46e5,#6366f1)',
      offre_envoyee: 'linear-gradient(135deg,#059669,#10b981)',
      offre_acceptee: 'linear-gradient(135deg,#047857,#059669)',
      offre_refusee: 'linear-gradient(135deg,#dc2626,#ef4444)',
      rejete: 'linear-gradient(135deg,#b91c1c,#dc2626)',
      stage_termine: 'linear-gradient(135deg,#047857,#059669)',
    };
    return gradients[status] || 'linear-gradient(135deg,#4b5563,#6b7280)';
  }

  getStatusDescription(status: string): string {
    return ({ nouveau:'Votre candidature a bien été reçue et est en cours d\'examen.', preselectionne:'Félicitations ! Votre profil a retenu notre attention. Consultez ci-dessous la date et l\'heure de votre entretien.', en_attente_documents:'Votre candidature est acceptée. Veuillez déposer votre demande de stage (formulaire vierge) ci-dessous.', documents_recus:'Votre demande de stage a été reçue. Le service RH est en train de la traiter.', entretien_programme:'Votre entretien est confirmé. Consultez les détails ci-dessous.', entretien_realise:'Merci pour votre participation à l\'entretien. Nous revenons vers vous prochainement.', validation_finale:'Votre candidature est en cours de validation finale.', offre_envoyee:'Une offre vous a été envoyée !', offre_acceptee:'Bienvenue dans l\'équipe ! Rejoignez notre groupe Discord d\'encadrement.', offre_refusee:'Nous ne pouvons pas donner suite à votre candidature pour le moment.', rejete:'Nous ne pouvons pas donner suite pour le moment.', abandonne:'Votre candidature semble inactive.', stage_termine:'Votre stage est maintenant terminé. Merci pour votre engagement.' } as any)[status] || '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  formatInterviewDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  }
}
