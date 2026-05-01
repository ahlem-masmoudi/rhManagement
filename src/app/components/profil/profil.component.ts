import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { Candidate, CandidateStatus } from '../../models';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profil-page" *ngIf="candidate">
      <div class="profil-layout">
        <aside class="profil-sidebar">
          <div class="card profile-card">
            <div class="profile-avatar-large">{{ getInitials() }}</div>
            <h2 class="profile-name">{{ candidate.firstName }} {{ candidate.lastName }}</h2>
            <p class="profile-school">{{ candidate.school }}</p>
            <span class="status-pill" [ngStyle]="{ background: getStatusBg(candidate.status), color: getStatusColor(candidate.status) }">
              {{ getStatusLabel(candidate.status) }}
            </span>

            <div class="profile-contact">
              <div class="contact-item">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <span>{{ candidate.email }}</span>
              </div>
              <div class="contact-item" *ngIf="candidate.phone">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                <span>{{ candidate.phone }}</span>
              </div>
              <div class="contact-item" *ngIf="candidate.location">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
                <span>{{ candidate.location }}</span>
              </div>
            </div>
          </div>

          <div class="card info-card">
            <h3>Informations</h3>
            <div class="info-list">
              <div class="info-item" *ngIf="candidate.level">
                <div class="info-label">Niveau</div>
                <div class="info-value">{{ candidate.level }}</div>
              </div>
              <div class="info-item" *ngIf="candidate.expectedDegree">
                <div class="info-label">Diplôme attendu</div>
                <div class="info-value">{{ candidate.expectedDegree }}</div>
              </div>
              <div class="info-item" *ngIf="candidate.availability">
                <div class="info-label">Disponibilité</div>
                <div class="info-value">{{ candidate.availability | date:'dd/MM/yyyy' }}</div>
              </div>
              <div class="info-item" *ngIf="candidate.expectedGraduation">
                <div class="info-label">Diplôme prévu</div>
                <div class="info-value">{{ candidate.expectedGraduation | date:'MM/yyyy' }}</div>
              </div>
            </div>
          </div>

          <!-- CV quick access -->
          <div class="card cv-card" *ngIf="getCvDocument()">
            <h3>CV</h3>
            <p class="cv-name">{{ getCvDocument()?.name }}</p>
            <button class="btn btn-outline btn-sm" (click)="openCv()">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
              Voir le CV
            </button>
          </div>
        </aside>

        <main class="profil-main">
          <div class="tabs">
            <button
              *ngFor="let tab of visibleTabs()"
              class="tab-btn"
              [class.active]="activeTab === tab.id"
              (click)="activeTab = tab.id">
              {{ tab.label }}
            </button>
          </div>

          <div class="tab-content card">

            <!-- RESUME TAB -->
            <div *ngIf="activeTab === 'resume'">
              <h3>Résumé du profil</h3>
              <div class="resume-section">
                <h4>Formation</h4>
                <p><strong>{{ candidate.school }}</strong></p>
                <p *ngIf="candidate.level || candidate.expectedDegree">{{ candidate.level }}<span *ngIf="candidate.level && candidate.expectedDegree"> — </span>{{ candidate.expectedDegree }}</p>
                <p class="text-muted" *ngIf="candidate.expectedGraduation">Diplôme prévu : {{ candidate.expectedGraduation | date:'MM/yyyy' }}</p>
              </div>

              <div class="resume-section" *ngIf="candidate.skills?.length">
                <h4>Compétences clés</h4>
                <div class="skills-chips">
                  <span class="chip" *ngFor="let skill of candidate.skills">{{ skill.name }}</span>
                </div>
              </div>

              <div class="resume-section" *ngIf="(candidate.statusHistory || []).length > 0">
                <h4>Historique du statut</h4>
                <div class="timeline">
                  <div class="timeline-item" *ngFor="let h of getReversedHistory()">
                    <div class="tl-dot" [style.background]="getStatusColor(h.newStatus)"></div>
                    <div class="tl-body">
                      <span class="tl-badge" [ngStyle]="{ background: getStatusBg(h.newStatus), color: getStatusColor(h.newStatus) }">
                        {{ getStatusLabel(h.newStatus) }}
                      </span>
                      <div class="tl-meta">
                        {{ h.changedAt | date:'dd/MM/yyyy HH:mm' }}
                        <span *ngIf="h.comment"> — {{ h.comment }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div *ngIf="!(candidate.statusHistory || []).length && !candidate.skills?.length" class="empty-message">
                Profil incomplet — le candidat n'a pas encore renseigné toutes ses informations.
              </div>
            </div>

            <!-- SKILLS TAB -->
            <div *ngIf="activeTab === 'skills'">
              <h3>Compétences techniques</h3>
              <div *ngIf="!candidate.skills?.length" class="empty-message">Aucune compétence renseignée.</div>
              <div class="skills-grid" *ngIf="candidate.skills?.length">
                <div *ngFor="let skill of candidate.skills" class="skill-item-large">
                  <div class="skill-header">
                    <span class="skill-name">{{ skill.name }}</span>
                    <span class="skill-level">{{ skill.level }}/5</span>
                  </div>
                  <div class="skill-bar">
                    <div class="skill-progress" [style.width.%]="((skill.level || 0) / 5) * 100"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- EXPERIENCES TAB -->
            <div *ngIf="activeTab === 'experiences'">
              <h3>Expériences professionnelles</h3>
              <div class="empty-message">Aucune expérience professionnelle renseignée.</div>
            </div>

            <!-- PROJECTS TAB -->
            <div *ngIf="activeTab === 'projects'">
              <h3>Projets</h3>
              <div class="empty-message">Aucun projet renseigné.</div>
            </div>

            <!-- DOCUMENTS TAB -->
            <div *ngIf="activeTab === 'documents'">
              <h3>Documents RH</h3>
              <div *ngIf="shouldHideRhDocuments()" class="empty-message">
                Les documents RH seront disponibles seulement après la présélection du candidat.
              </div>
              <ng-container *ngIf="!shouldHideRhDocuments()">
                <div *ngIf="!candidate.documents?.length" class="empty-message">
                  Aucun document pour ce candidat.
                </div>

                <div *ngFor="let doc of candidate.documents || []" class="project-card">
                  <div class="doc-header">
                    <div>
                      <h4>{{ doc.name }}</h4>
                      <p class="project-description">
                        <span class="doc-type-badge">{{ getDocTypeLabel(getDocumentType(doc)) }}</span>
                        <span class="doc-status-badge" [class]="'ds-' + getDocumentStatus(doc)">{{ getDocumentStatusLabel(getDocumentStatus(doc)) }}</span>
                      </p>
                    </div>
                    <div class="experience-skills">
                      <button class="btn btn-secondary btn-sm" (click)="downloadDocument(doc)">Télécharger</button>
                      <button
                        *ngIf="isInternshipRequest(doc) && !doc.isSigned"
                        class="btn btn-primary btn-sm"
                        (click)="generateSignedRequest(doc)">
                        Renvoyer signée
                      </button>
                    </div>
                  </div>
                </div>

                <div class="project-card assignment-card">
                  <h4>Lettre d'affectation</h4>
                  <p class="project-description">
                    Disponible uniquement pour les candidats présélectionnés ou acceptés.
                  </p>
                  <p *ngIf="candidate && !canGenerateAssignmentLetter()" class="text-muted" style="margin-top:8px;">
                    Non disponible pour ce statut.
                  </p>
                  <button class="btn btn-success btn-sm" [disabled]="!canGenerateAssignmentLetter()" (click)="openAssignmentLetterModal()">
                    Générer la lettre d'affectation
                  </button>
                </div>
              </ng-container>
            </div>

            <!-- NOTES TAB -->
            <div *ngIf="activeTab === 'notes'">
              <h3>Notes internes</h3>
              <p class="text-muted">Visibles uniquement par l'équipe RH.</p>
              <textarea
                class="notes-area"
                [(ngModel)]="recruiterNotes"
                rows="8"
                placeholder="Observations, commentaires, rappels concernant ce candidat..."></textarea>
              <div class="notes-footer">
                <span *ngIf="notesSaved" class="notes-saved">Sauvegardé ✓</span>
                <button class="btn btn-primary" [disabled]="notesSaving" (click)="saveNotes()">
                  {{ notesSaving ? 'Sauvegarde...' : 'Sauvegarder' }}
                </button>
              </div>
            </div>

          </div>

          <!-- ACTIONS BAR -->
          <div class="actions-bar card">
            <div class="status-changer">
              <label>Statut :</label>
              <select class="status-select" [(ngModel)]="selectedStatus">
                <option *ngFor="let opt of statusOptions" [value]="opt.value">{{ opt.label }}</option>
              </select>
              <button
                class="btn btn-outline"
                [disabled]="statusLoading || selectedStatus === candidate.status"
                (click)="applyStatus()">
                {{ statusLoading ? '...' : 'Appliquer' }}
              </button>
            </div>
            <div class="action-btns">
              <button class="btn btn-danger" [disabled]="statusLoading || candidate.status === 'rejete'" (click)="refuser()">
                Refuser
              </button>
              <button class="btn btn-primary" [disabled]="statusLoading || isTerminalStatus()" (click)="accepter()">
                Accepter →
              </button>
              <button class="btn btn-success" (click)="envoyerEmail()">
                Envoyer un email
              </button>
            </div>
          </div>
        </main>
      </div>

      <!-- ASSIGNMENT LETTER MODAL -->
      <div *ngIf="showAssignmentModal" class="modal-overlay" (click)="closeAssignmentLetterModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Lettre d'affectation</h3>
              <p>Modifiez uniquement les champs personnels avant génération.</p>
            </div>
            <button class="icon-close" type="button" (click)="closeAssignmentLetterModal()">×</button>
          </div>

          <div class="modal-layout">
            <div class="modal-form">
              <div class="form-grid">
                <label class="field">
                  <span>Institut FR</span>
                  <input [(ngModel)]="assignmentForm.instituteNameFr" />
                </label>
                <label class="field">
                  <span>Institut AR</span>
                  <input [(ngModel)]="assignmentForm.instituteNameAr" />
                </label>
                <label class="field">
                  <span>Logo (sigle)</span>
                  <input [(ngModel)]="assignmentForm.logoText" maxlength="10" />
                </label>
                <label class="field">
                  <span>Date de lettre</span>
                  <input [(ngModel)]="assignmentForm.letterDate" placeholder="17/04/2026" />
                </label>
                <label class="field">
                  <span>Société</span>
                  <input [(ngModel)]="assignmentForm.companyName" />
                </label>
                <label class="field">
                  <span>Directeur</span>
                  <input [(ngModel)]="assignmentForm.directorName" />
                </label>
                <label class="field field-full">
                  <span>Intitulé du stage</span>
                  <input [(ngModel)]="assignmentForm.internshipTitle" />
                </label>
                <label class="field field-full">
                  <span>Filière / diplôme</span>
                  <input [(ngModel)]="assignmentForm.specialty" />
                </label>
                <label class="field">
                  <span>Date début</span>
                  <input [(ngModel)]="assignmentForm.startDate" placeholder="02 février 2026" />
                </label>
                <label class="field">
                  <span>Date fin</span>
                  <input [(ngModel)]="assignmentForm.endDate" placeholder="30 avril 2026" />
                </label>
                <label class="field">
                  <span>Signataire</span>
                  <input [(ngModel)]="assignmentForm.signatoryName" />
                </label>
                <label class="field">
                  <span>Fonction</span>
                  <input [(ngModel)]="assignmentForm.signatoryTitle" />
                </label>
              </div>
            </div>

            <div class="letter-preview">
              <div class="letter-sheet">
                <div class="letter-top">
                  <div class="letter-ministry">
                    République Tunisienne<br>
                    Ministère de l'Enseignement Supérieur<br>
                    {{ assignmentForm.instituteNameFr }}
                  </div>
                  <div class="letter-logo">{{ assignmentForm.logoText }}</div>
                  <div class="letter-ar">{{ assignmentForm.instituteNameAr }}</div>
                </div>

                <div class="letter-title-row">
                  <div class="letter-title-box">Lettre d'affectation à un stage</div>
                  <div class="letter-ref-box">
                    Ref : IDF015<br>
                    Version : 01<br>
                    Date : {{ assignmentForm.letterDate }}
                  </div>
                </div>

                <div class="letter-body">
                  <p class="letter-target">
                    <strong>À l'attention de M. le Directeur de la société : {{ assignmentForm.companyName }}</strong>
                  </p>

                  <p>Monsieur,</p>

                  <p>
                    Suite à l'offre de stage que vous avez eu l'amabilité d'accorder à
                    <strong>{{ candidate.firstName }} {{ candidate.lastName }}</strong>
                    étudiant(e) à {{ assignmentForm.instituteNameFr }} inscrit(e) en
                    <strong>{{ assignmentForm.specialty }}</strong>,
                    j'ai le plaisir de confirmer par la présente son affectation à votre honorable établissement
                    pour un stage
                    <strong>{{ assignmentForm.internshipTitle }}</strong>
                    du <strong>{{ assignmentForm.startDate }}</strong>
                    au <strong>{{ assignmentForm.endDate }}</strong>.
                  </p>

                  <p>
                    Je saisis cette occasion pour vous exprimer mes vifs remerciements pour votre précieuse collaboration.
                  </p>

                  <p>
                    Nous vous signalons que, durant la période de stage, l'étudiant est couvert par la Mutuelle Accident Scolaire et Universitaire.
                  </p>

                  <p>
                    Par ailleurs, je me tiens à votre entière disposition pour tout autre renseignement concernant les stages.
                  </p>

                  <p>
                    Veuillez croire, Madame, Monsieur, à l'expression de ma haute considération.
                  </p>

                  <div class="letter-signature">
                    <strong>{{ assignmentForm.signatoryTitle }}</strong><br>
                    {{ assignmentForm.signatoryName }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" type="button" (click)="closeAssignmentLetterModal()">Annuler</button>
            <button class="btn btn-success" type="button" (click)="submitAssignmentLetter()">Générer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profil-page {
      max-width: 1400px;
    }

    .profil-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: var(--spacing-lg);
    }

    .profil-sidebar {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .profile-card {
      text-align: center;
    }

    .profile-avatar-large {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
      margin: 0 auto var(--spacing-sm);
    }

    .profile-name {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 2px 0;
    }

    .profile-school {
      color: var(--gray-500);
      margin: 0 0 8px 0;
      font-size: 13px;
    }

    .status-pill {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: var(--spacing-md);
    }

    .profile-contact {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      padding-top: var(--spacing-md);
      border-top: 1px solid var(--gray-200);
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--gray-600);
      font-size: 13px;
      text-align: left;
      word-break: break-word;
    }

    .contact-item svg { flex-shrink: 0; }

    .info-card h3, .cv-card h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 var(--spacing-md) 0;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .info-label {
      font-size: 11px;
      color: var(--gray-400);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--gray-900);
    }

    .cv-card { text-align: center; }
    .cv-name { font-size: 13px; color: var(--gray-600); margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 0;
      margin-bottom: var(--spacing-lg);
      border-bottom: 2px solid var(--gray-200);
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 10px 18px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      cursor: pointer;
      font-weight: 500;
      font-size: 14px;
      color: var(--gray-500);
      transition: all 0.15s;
    }

    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }

    .tab-btn:hover:not(.active) { color: var(--gray-800); }

    .tab-content {
      margin-bottom: var(--spacing-lg);
      min-height: 240px;
    }

    .tab-content h3 {
      margin: 0 0 var(--spacing-lg) 0;
      font-size: 16px;
    }

    .resume-section {
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--gray-100);
    }

    .resume-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

    .resume-section h4 {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--gray-400);
      margin: 0 0 10px 0;
    }

    .resume-section p { margin: 0 0 4px; font-size: 14px; }

    .text-muted { color: var(--gray-500); font-size: 13px; }

    /* Skills chips (resume tab) */
    .skills-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      padding: 4px 12px;
      background: #eef2ff;
      color: #4338ca;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
    }

    /* Status history timeline */
    .timeline { display: flex; flex-direction: column; gap: 0; }

    .timeline-item {
      display: flex;
      gap: 12px;
      padding-bottom: 16px;
      position: relative;
    }

    .timeline-item:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 16px;
      bottom: 0;
      width: 2px;
      background: var(--gray-200);
    }

    .tl-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 3px;
    }

    .tl-body { flex: 1; }

    .tl-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 3px;
    }

    .tl-meta { font-size: 12px; color: var(--gray-400); }

    /* Skills grid */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);
    }

    .skill-item-large {
      padding: var(--spacing-md);
      background: var(--gray-50);
      border-radius: var(--radius-md);
    }

    .skill-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .skill-name { font-weight: 600; color: var(--gray-900); font-size: 13px; }
    .skill-level { font-size: 12px; color: var(--primary-color); font-weight: 600; }

    .skill-bar {
      height: 5px;
      background: var(--gray-200);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .skill-progress {
      height: 100%;
      background: var(--primary-color);
      border-radius: var(--radius-full);
    }

    /* Documents */
    .project-card {
      padding: var(--spacing-md);
      background: var(--gray-50);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-md);
    }

    .project-card h4 { margin: 0 0 6px 0; font-size: 14px; }

    .doc-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }

    .project-description {
      color: var(--gray-600);
      font-size: 13px;
      margin-bottom: 0;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      align-items: center;
    }

    .doc-type-badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
    }

    .doc-status-badge {
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
    }

    .ds-soumis { background: #fef9c3; color: #854d0e; }
    .ds-valide { background: #dcfce7; color: #166534; }
    .ds-rejete { background: #fee2e2; color: #991b1b; }
    .ds-signe  { background: #d1fae5; color: #065f46; }
    .ds-en_attente { background: #f3f4f6; color: #6b7280; }

    .experience-skills { display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }

    .assignment-card { border: 1px dashed #c7d2fe; }

    /* Notes tab */
    .notes-area {
      width: 100%;
      min-height: 160px;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      padding: 12px;
      font-size: 14px;
      resize: vertical;
      font-family: inherit;
      line-height: 1.6;
      box-sizing: border-box;
      margin-top: 8px;
    }

    .notes-area:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px #eef2ff; }

    .notes-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 12px;
    }

    .notes-saved { color: #059669; font-size: 13px; font-weight: 600; }

    /* Actions bar */
    .actions-bar {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-lg);
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
    }

    .status-changer {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .status-changer label {
      font-size: 13px;
      font-weight: 500;
      color: var(--gray-600);
      white-space: nowrap;
    }

    .status-select {
      padding: 7px 10px;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius-md);
      font-size: 13px;
      background: white;
      cursor: pointer;
      max-width: 200px;
    }

    .action-btns {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-danger {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fca5a5;
    }

    .btn-danger:hover:not(:disabled) { background: #fecaca; }

    .btn-outline {
      background: white;
      color: var(--primary-color);
      border: 1px solid var(--primary-color);
    }

    .btn-outline:hover:not(:disabled) { background: #eef2ff; }

    .btn-sm { padding: 5px 10px; font-size: 12px; }

    .empty-message {
      text-align: center;
      padding: var(--spacing-xl);
      color: var(--gray-400);
      font-size: 14px;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 1000;
    }

    .modal-card {
      width: min(1200px, 100%);
      max-height: 92vh;
      overflow: auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
      padding: 24px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 20px;
    }

    .modal-header h3 { margin: 0 0 6px; font-size: 22px; }
    .modal-header p { margin: 0; color: #64748b; font-size: 14px; }

    .icon-close {
      border: none;
      background: #eef2ff;
      color: #4338ca;
      width: 40px;
      height: 40px;
      border-radius: 999px;
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
      flex-shrink: 0;
    }

    .modal-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 20px;
    }

    .modal-form {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .field { display: flex; flex-direction: column; gap: 5px; }
    .field-full { grid-column: 1 / -1; }

    .field span { font-size: 12px; font-weight: 600; color: #334155; }

    .field input {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
      box-sizing: border-box;
    }

    .letter-preview {
      background: #f1f5f9;
      border-radius: 16px;
      padding: 16px;
      overflow: auto;
    }

    .letter-sheet {
      background: white;
      min-height: 700px;
      padding: 28px 34px 40px;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    }

    .letter-top {
      display: grid;
      grid-template-columns: 1fr 90px 1fr;
      align-items: center;
      gap: 10px;
      font-size: 11px;
      margin-bottom: 14px;
    }

    .letter-ministry, .letter-ar {
      text-align: center;
      font-weight: 700;
      line-height: 1.35;
    }

    .letter-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #94a3b8;
      color: #0f172a;
      font-weight: 800;
      font-size: 20px;
      min-height: 64px;
    }

    .letter-title-row {
      display: grid;
      grid-template-columns: 1fr 210px;
      border: 1px solid #64748b;
      margin-bottom: 24px;
    }

    .letter-title-box, .letter-ref-box {
      padding: 12px 14px;
      font-size: 13px;
      font-weight: 700;
    }

    .letter-title-box {
      border-right: 1px solid #64748b;
      text-align: center;
      background: #e5e7eb;
    }

    .letter-ref-box { line-height: 1.5; font-size: 12px; }

    .letter-body { font-size: 13px; line-height: 1.75; color: #111827; }

    .letter-target { text-align: center; margin: 18px 0 24px; }

    .letter-signature { margin-top: 40px; text-align: center; font-size: 14px; }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .profil-layout { grid-template-columns: 1fr; }
      .skills-grid { grid-template-columns: 1fr; }
      .modal-layout { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .tab-btn { padding: 8px 12px; font-size: 13px; }
      .profile-avatar-large { width: 64px; height: 64px; font-size: 22px; }
      .modal-overlay { padding: 8px; align-items: flex-end; }
      .modal-card { border-radius: 16px 16px 0 0; max-height: 95vh; }
      .modal-header h3 { font-size: 18px; }
      .form-grid { grid-template-columns: 1fr; }
      .letter-preview { display: none; }
      .actions-bar { flex-direction: column; align-items: stretch; }
      .status-changer { width: 100%; }
      .status-select { max-width: 100%; flex: 1; }
      .action-btns { justify-content: flex-end; }
    }

    @media (max-width: 480px) {
      .tabs { overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
      .tab-btn { white-space: nowrap; flex-shrink: 0; padding: 8px 10px; font-size: 12px; }
      .skills-grid { grid-template-columns: 1fr; }
      .profil-layout { gap: var(--spacing-md); }
      .doc-header { flex-direction: column; }
      .action-btns button { font-size: 12px; padding: 7px 10px; }
    }
  `]
})
export class ProfilComponent implements OnInit {
  candidate: Candidate | undefined;
  activeTab = 'resume';
  showAssignmentModal = false;
  todayLabel = new Date().toLocaleDateString('fr-FR');

  selectedStatus: string = 'nouveau';
  statusLoading = false;
  recruiterNotes = '';
  notesSaving = false;
  notesSaved = false;

  statusOptions = [
    { value: 'nouveau',              label: 'Nouveau' },
    { value: 'preselectionne',       label: 'Présélectionné' },
    { value: 'en_attente_documents', label: 'En attente de documents' },
    { value: 'documents_recus',      label: 'Documents reçus' },
    { value: 'entretien_programme',  label: 'Entretien programmé' },
    { value: 'entretien_realise',    label: 'Entretien réalisé' },
    { value: 'test_technique',       label: 'Test technique' },
    { value: 'validation_finale',    label: 'Validation finale' },
    { value: 'offre_envoyee',        label: 'Offre envoyée' },
    { value: 'offre_acceptee',       label: 'Offre acceptée' },
    { value: 'rejete',               label: 'Rejeté' },
    { value: 'abandonne',            label: 'Abandonné' },
  ];

  private readonly nextStatus: Record<string, string> = {
    'nouveau':              'preselectionne',
    'preselectionne':       'entretien_programme',
    'entretien_programme':  'entretien_realise',
    'entretien_realise':    'test_technique',
    'test_technique':       'validation_finale',
    'validation_finale':    'offre_envoyee',
    'offre_envoyee':        'offre_acceptee',
  };

  assignmentForm = {
    instituteNameFr: '',
    instituteNameAr: '',
    logoText: 'ISGI',
    letterDate: '',
    companyName: '',
    directorName: '',
    internshipTitle: 'Stage obligatoire',
    specialty: '',
    startDate: '',
    endDate: '',
    signatoryName: 'Direction des stages',
    signatoryTitle: 'La Direction des Stages'
  };

  tabs = [
    { id: 'resume',      label: 'Résumé' },
    { id: 'skills',      label: 'Compétences' },
    { id: 'experiences', label: 'Expériences' },
    { id: 'projects',    label: 'Projets' },
    { id: 'documents',   label: 'Documents RH' },
    { id: 'notes',       label: 'Notes' },
  ];

  constructor(
    private route: ActivatedRoute,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCandidate(id);
    }
  }

  loadCandidate(id: string): void {
    this.candidateService.getCandidateFull(id).subscribe(candidate => {
      this.candidate = {
        id: candidate._id,
        firstName: candidate.userId?.firstName || '',
        lastName: candidate.userId?.lastName || '',
        email: candidate.userId?.email || '',
        phone: candidate.phone || '',
        avatar: undefined,
        status: candidate.status || 'nouveau',
        school: candidate.school || '',
        level: candidate.educationLevel || '',
        expectedDegree: candidate.expectedDegree || '',
        expectedGraduation: candidate.expectedGraduation || '',
        location: candidate.location || '',
        availability: candidate.availability || '',
        skills: (candidate.skills || []).map((skill: string) => ({ name: skill, level: 3 })),
        experiences: [],
        projects: [],
        languages: [],
        notes: [],
        documents: candidate.documents || [],
        statusHistory: candidate.statusHistory || [],
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt
      };
      this.selectedStatus = this.candidate.status;
      this.recruiterNotes = candidate.recruiterNotes || '';
    });
  }

  getInitials(): string {
    if (!this.candidate) return '';
    const f = this.candidate.firstName?.[0] || '';
    const l = this.candidate.lastName?.[0] || '';
    return (f + l).toUpperCase();
  }

  visibleTabs() {
    return this.tabs.filter(t => t.id !== 'documents' || !this.shouldHideRhDocuments());
  }

  getReversedHistory(): any[] {
    return [...(this.candidate?.statusHistory || [])].reverse();
  }

  getCvDocument(): any | null {
    return (this.candidate?.documents || []).slice().reverse().find((d: any) => d.type === 'cv') || null;
  }

  openCv(): void {
    const doc = this.getCvDocument();
    if (!doc?.content) return;
    const content = doc.content.startsWith('data:') ? doc.content : `data:application/pdf;base64,${doc.content}`;
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${content}" style="width:100%;height:100%;border:none;"></iframe>`);
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'nouveau':              'Nouveau',
      'preselectionne':       'Présélectionné',
      'en_attente_documents': 'En attente de documents',
      'documents_recus':      'Documents reçus',
      'entretien_programme':  'Entretien programmé',
      'entretien_realise':    'Entretien réalisé',
      'test_technique':       'Test technique',
      'validation_finale':    'Validation finale',
      'offre_envoyee':        'Offre envoyée',
      'offre_acceptee':       'Offre acceptée',
      'offre_refusee':        'Offre refusée',
      'rejete':               'Rejeté',
      'abandonne':            'Abandonné',
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'nouveau':              '#6b7280',
      'preselectionne':       '#3b82f6',
      'en_attente_documents': '#f59e0b',
      'documents_recus':      '#8b5cf6',
      'entretien_programme':  '#06b6d4',
      'entretien_realise':    '#0ea5e9',
      'test_technique':       '#8b5cf6',
      'validation_finale':    '#6366f1',
      'offre_envoyee':        '#10b981',
      'offre_acceptee':       '#059669',
      'offre_refusee':        '#ef4444',
      'rejete':               '#dc2626',
      'abandonne':            '#6b7280',
    };
    return colors[status] || '#6b7280';
  }

  getStatusBg(status: string): string {
    return this.getStatusColor(status) + '18';
  }

  isTerminalStatus(): boolean {
    return ['offre_acceptee', 'offre_refusee', 'rejete', 'abandonne'].includes(this.candidate?.status || '');
  }

  applyStatus(): void {
    this.changeStatus(this.selectedStatus as CandidateStatus);
  }

  refuser(): void {
    this.changeStatus('rejete');
  }

  accepter(): void {
    const current = this.candidate?.status || 'nouveau';
    const next = (this.nextStatus[current] || 'preselectionne') as CandidateStatus;
    this.changeStatus(next);
  }

  changeStatus(newStatus: CandidateStatus): void {
    if (!this.candidate) return;
    this.statusLoading = true;
    this.candidateService.updateSingleStatus(this.candidate.id, newStatus).subscribe({
      next: () => {
        const previous = this.candidate!.status;
        this.candidate!.status = newStatus;
        this.selectedStatus = newStatus;
        this.candidate!.statusHistory = [
          ...(this.candidate!.statusHistory || []),
          {
            id: Date.now().toString(),
            previousStatus: previous,
            newStatus,
            changedBy: 'RH',
            changedAt: new Date(),
            emailSent: false
          } as any
        ];
        this.statusLoading = false;
      },
      error: () => { this.statusLoading = false; }
    });
  }

  envoyerEmail(): void {
    if (!this.candidate?.email) return;
    const subject = encodeURIComponent(`Votre candidature — ${this.getStatusLabel(this.candidate.status)}`);
    window.open(`mailto:${this.candidate.email}?subject=${subject}`);
  }

  saveNotes(): void {
    if (!this.candidate) return;
    this.notesSaving = true;
    this.notesSaved = false;
    this.candidateService.saveRecruiterNotes(this.candidate.id, this.recruiterNotes).subscribe({
      next: () => {
        this.notesSaving = false;
        this.notesSaved = true;
        setTimeout(() => { this.notesSaved = false; }, 3000);
      },
      error: () => { this.notesSaving = false; }
    });
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getDocTypeLabel(type: any): string {
    const labels: Record<string, string> = {
      cv: 'CV',
      lettre_motivation: 'Lettre de motivation',
      demande_stage: 'Demande de stage',
      convention_stage: 'Convention de stage',
      convention_signee: 'Convention signée',
      attestation: 'Lettre d\'affectation',
      autre: 'Autre'
    };
    return labels[type || 'autre'] || (type || 'Document');
  }

  getDocumentType(doc: any): string { return doc?.type || 'autre'; }

  getDocumentStatus(doc: any): string { return doc?.status || 'soumis'; }

  isInternshipRequest(doc: any): boolean { return this.getDocumentType(doc) === 'demande_stage'; }

  getDocumentStatusLabel(status: any): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      soumis: 'Soumis',
      valide: 'Validé',
      rejete: 'Rejeté',
      signe: 'Signé'
    };
    return labels[status || 'soumis'] || (status || 'soumis');
  }

  downloadDocument(doc: any): void {
    if (!this.candidate) return;
    this.candidateService.downloadDocument(this.candidate.id, doc.id).subscribe(response => {
      const blob = new Blob([response.content], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = response.name || doc.name;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  generateSignedRequest(doc: any): void {
    if (!this.candidate) return;
    this.candidateService.generateSignedInternshipRequest(this.candidate.id, doc.id, {
      signatoryName: 'Direction des stages',
      signatoryTitle: 'Responsable RH'
    }).subscribe(() => {
      this.loadCandidate(this.candidate!.id);
    });
  }

  openAssignmentLetterModal(): void {
    if (!this.candidate || !this.canGenerateAssignmentLetter()) return;
    this.assignmentForm = {
      instituteNameFr: 'Institut Supérieur de Gestion Industrielle de Sfax',
      instituteNameAr: 'المعهد العالي للتصرف الصناعي بصفاقس',
      logoText: 'ISGI',
      letterDate: this.todayLabel,
      companyName: 'Informatique net',
      directorName: 'Directeur société',
      internshipTitle: 'Stage obligatoire',
      specialty: this.candidate.expectedDegree || this.candidate.level || '',
      startDate: '',
      endDate: '',
      signatoryName: 'Direction des stages',
      signatoryTitle: 'La Direction des Stages'
    };
    this.showAssignmentModal = true;
  }

  closeAssignmentLetterModal(): void { this.showAssignmentModal = false; }

  submitAssignmentLetter(): void {
    if (!this.candidate || !this.canGenerateAssignmentLetter()) return;
    this.candidateService.generateAssignmentLetter(this.candidate.id, this.assignmentForm).subscribe(() => {
      this.loadCandidate(this.candidate!.id);
      this.closeAssignmentLetterModal();
    });
  }

  canGenerateAssignmentLetter(): boolean {
    if (!this.candidate) return false;
    return ['preselectionne', 'offre_acceptee', 'entretien_programme', 'entretien_realise',
            'test_technique', 'validation_finale', 'offre_envoyee'].includes(this.candidate.status as string);
  }

  shouldHideRhDocuments(): boolean {
    if (!this.candidate) return true;
    return this.candidate.status === 'nouveau';
  }
}
