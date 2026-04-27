import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { Candidate } from '../../models';

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

            <div class="profile-contact">
              <div class="contact-item">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <span>{{ candidate.email }}</span>
              </div>
              <div class="contact-item">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                <span>{{ candidate.phone }}</span>
              </div>
              <div class="contact-item">
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
              <div class="info-item">
                <div class="info-label">Niveau</div>
                <div class="info-value">{{ candidate.level }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Diplome attendu</div>
                <div class="info-value">{{ candidate.expectedDegree }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Disponibilite</div>
                <div class="info-value">{{ candidate.availability }}</div>
              </div>
            </div>
          </div>
        </aside>

        <main class="profil-main">
          <div class="tabs">
            <button
              *ngFor="let tab of tabs"
              class="tab-btn"
              [class.active]="activeTab === tab.id"
              (click)="activeTab = tab.id">
              {{ tab.label }}
            </button>
          </div>

          <div class="tab-content card">
            <div *ngIf="activeTab === 'resume'">
              <h3>Resume du profil</h3>
              <div class="resume-section">
                <h4>Formation</h4>
                <p><strong>{{ candidate.school }}</strong></p>
                <p>{{ candidate.level }} - {{ candidate.expectedDegree }}</p>
                <p class="text-muted">Diplome prevu: {{ candidate.expectedGraduation }}</p>
              </div>
            </div>

            <div *ngIf="activeTab === 'skills'">
              <h3>Competences techniques</h3>
              <div class="skills-grid">
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

            <div *ngIf="activeTab === 'experiences'">
              <h3>Experiences professionnelles</h3>
              <div class="empty-message">Aucune experience professionnelle renseignee.</div>
            </div>

            <div *ngIf="activeTab === 'projects'">
              <h3>Projets</h3>
              <div class="empty-message">Aucun projet renseigne.</div>
            </div>

            <div *ngIf="activeTab === 'documents'">
              <h3>Documents RH</h3>
              <div *ngIf="shouldHideRhDocuments()" class="empty-message">
                Les documents RH seront disponibles seulement apres la preselection du candidat.
              </div>
              <div *ngIf="!shouldHideRhDocuments() && (!candidate.documents || candidate.documents.length === 0)" class="empty-message">
                Aucun document pour ce candidat.
              </div>

              <div *ngFor="let doc of candidate.documents || []" class="project-card" [style.display]="shouldHideRhDocuments() ? 'none' : null">
                <h4>{{ doc.name }}</h4>
                <p class="project-description">
                  Type: {{ getDocTypeLabel(getDocumentType(doc)) }} • Statut: {{ getDocumentStatusLabel(getDocumentStatus(doc)) }}
                </p>
                <div class="experience-skills">
                  <button class="btn btn-secondary" (click)="downloadDocument(doc)">Telecharger</button>
                  <button
                    *ngIf="isInternshipRequest(doc) && !doc.isSigned"
                    class="btn btn-primary"
                    (click)="generateSignedRequest(doc)">
                    Renvoyer signee
                  </button>
                </div>
              </div>

              <div *ngIf="!shouldHideRhDocuments()" class="project-card assignment-card">
                <h4>Lettre d'affectation</h4>
                <p class="project-description">
                  Disponible uniquement pour les candidats preselectionnes ou acceptes. Le RH modifie seulement les champs personnels.
                </p>
                <p *ngIf="candidate && !canGenerateAssignmentLetter()" class="project-description" style="margin-top:8px; color:#b45309;">
                  Cette lettre n'est pas utile pour un candidat nouveau ou encore non retenu.
                </p>
                <button class="btn btn-success" [disabled]="!canGenerateAssignmentLetter()" (click)="openAssignmentLetterModal()">
                  Generer la lettre d'affectation
                </button>
              </div>
            </div>

            <div *ngIf="activeTab === 'notes'">
              <h3>Notes internes</h3>
              <div class="empty-message">Aucune note pour le moment.</div>
            </div>
          </div>

          <div class="actions-bar card">
            <button class="btn btn-secondary">Refuser</button>
            <button class="btn btn-primary">Accepter</button>
            <button class="btn btn-success">Envoyer un email</button>
          </div>
        </main>
      </div>

      <div *ngIf="showAssignmentModal" class="modal-overlay" (click)="closeAssignmentLetterModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Lettre d'affectation</h3>
              <p>Modifiez seulement les champs personnels avant generation.</p>
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
                  <span>Date de lettre</span>
                  <input [(ngModel)]="assignmentForm.letterDate" placeholder="17/04/2026" />
                </label>
                <label class="field">
                  <span>Societe</span>
                  <input [(ngModel)]="assignmentForm.companyName" />
                </label>
                <label class="field">
                  <span>Directeur</span>
                  <input [(ngModel)]="assignmentForm.directorName" />
                </label>
                <label class="field field-full">
                  <span>Intitule du stage</span>
                  <input [(ngModel)]="assignmentForm.internshipTitle" />
                </label>
                <label class="field field-full">
                  <span>Filiere / diplome</span>
                  <input [(ngModel)]="assignmentForm.specialty" />
                </label>
                <label class="field">
                  <span>Date debut</span>
                  <input [(ngModel)]="assignmentForm.startDate" placeholder="02 fevrier 2026" />
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
                    Republique Tunisienne<br>
                    Ministere de l'Enseignement Superieur<br>
                    {{ assignmentForm.instituteNameFr }}
                  </div>
                  <div class="letter-logo">ISGI</div>
                  <div class="letter-ar">{{ assignmentForm.instituteNameAr }}</div>
                </div>

                <div class="letter-title-row">
                  <div class="letter-title-box">Lettre d'affectation a un stage</div>
                  <div class="letter-ref-box">
                    Ref : IDF015<br>
                    Version : 01<br>
                    Date : {{ assignmentForm.letterDate }}
                  </div>
                </div>

                <div class="letter-body">
                  <p class="letter-target">
                    <strong>A l'attention de M. le Directeur de la societe : {{ assignmentForm.companyName }}</strong>
                  </p>

                  <p>Monsieur,</p>

                  <p>
                    Suite a l'offre de stage que vous avez eu l'amabilite d'accorder a
                    <strong>{{ candidate.firstName }} {{ candidate.lastName }}</strong>
                    etudiant(e) a {{ assignmentForm.instituteNameFr }} inscrit(e) en
                    <strong>{{ assignmentForm.specialty }}</strong>,
                    j'ai le plaisir de confirmer par la presente son affectation a votre honorable etablissement
                    pour un stage
                    <strong>{{ assignmentForm.internshipTitle }}</strong>
                    du <strong>{{ assignmentForm.startDate }}</strong>
                    au <strong>{{ assignmentForm.endDate }}</strong>.
                  </p>

                  <p>
                    Je saisis cette occasion pour vous exprimer mes vifs remerciements pour votre precieuse collaboration.
                  </p>

                  <p>
                    Nous vous signalons que, durant la periode de stage, l'etudiant est couvert par la Mutuelle Accident Scolaire et Universitaire.
                  </p>

                  <p>
                    Par ailleurs, je me tiens a votre entiere disposition pour tout autre renseignement concernant les stages.
                  </p>

                  <p>
                    Veuillez croire, Madame, Monsieur, a l'expression de ma haute consideration.
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
            <button class="btn btn-success" type="button" (click)="submitAssignmentLetter()">Generer</button>
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
      grid-template-columns: 320px 1fr;
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
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: 700;
      margin: 0 auto var(--spacing-md);
    }

    .profile-name {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .profile-school {
      color: var(--gray-500);
      margin: 0 0 var(--spacing-lg) 0;
    }

    .profile-contact {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--gray-200);
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--gray-600);
      font-size: 13px;
      text-align: left;
    }

    .info-card h3 {
      font-size: 16px;
      margin: 0 0 var(--spacing-md) 0;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--gray-900);
    }

    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--gray-200);
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 12px 20px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-weight: 500;
      color: var(--gray-600);
      transition: all 0.2s;
    }

    .tab-btn.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }

    .tab-content {
      margin-bottom: var(--spacing-lg);
    }

    .tab-content h3 {
      margin: 0 0 var(--spacing-lg) 0;
    }

    .resume-section {
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--gray-200);
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-lg);
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

    .skill-name {
      font-weight: 600;
      color: var(--gray-900);
    }

    .skill-level {
      font-size: 13px;
      color: var(--primary-color);
      font-weight: 600;
    }

    .skill-bar {
      height: 6px;
      background: var(--gray-200);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: 6px;
    }

    .skill-progress {
      height: 100%;
      background: var(--primary-color);
      border-radius: var(--radius-full);
    }

    .project-card {
      padding: var(--spacing-lg);
      background: var(--gray-50);
      border-radius: var(--radius-md);
      margin-bottom: var(--spacing-lg);
    }

    .project-card h4 {
      margin: 0 0 8px 0;
    }

    .project-description {
      color: var(--gray-700);
      line-height: 1.5;
      margin-bottom: var(--spacing-md);
    }

    .experience-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .assignment-card {
      border: 1px dashed #c7d2fe;
    }

    .actions-bar {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      flex-wrap: wrap;
    }

    .empty-message {
      text-align: center;
      padding: var(--spacing-xl);
      color: var(--gray-500);
    }

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

    .modal-header h3 {
      margin: 0 0 6px;
      font-size: 24px;
    }

    .modal-header p {
      margin: 0;
      color: #64748b;
    }

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
    }

    .modal-layout {
      display: grid;
      grid-template-columns: 360px 1fr;
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
      gap: 14px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-full {
      grid-column: 1 / -1;
    }

    .field span {
      font-size: 13px;
      font-weight: 600;
      color: #334155;
    }

    .field input {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 14px;
    }

    .letter-preview {
      background: #f1f5f9;
      border-radius: 16px;
      padding: 18px;
    }

    .letter-sheet {
      background: white;
      min-height: 760px;
      padding: 28px 34px 40px;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    }

    .letter-top {
      display: grid;
      grid-template-columns: 1fr 100px 1fr;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      margin-bottom: 16px;
    }

    .letter-ministry,
    .letter-ar {
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
      font-size: 22px;
      min-height: 72px;
    }

    .letter-title-row {
      display: grid;
      grid-template-columns: 1fr 230px;
      border: 1px solid #64748b;
      margin-bottom: 28px;
    }

    .letter-title-box,
    .letter-ref-box {
      padding: 14px 16px;
      font-size: 14px;
      font-weight: 700;
    }

    .letter-title-box {
      border-right: 1px solid #64748b;
      text-align: center;
      background: #e5e7eb;
    }

    .letter-ref-box {
      line-height: 1.5;
      font-size: 13px;
    }

    .letter-body {
      font-size: 15px;
      line-height: 1.75;
      color: #111827;
    }

    .letter-target {
      text-align: center;
      margin: 20px 0 28px;
    }

    .letter-signature {
      margin-top: 48px;
      text-align: center;
      font-size: 16px;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }

    @media (max-width: 1024px) {
      .profil-layout { grid-template-columns: 1fr; }
      .skills-grid { grid-template-columns: 1fr;
      }

      .modal-layout { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .tab-btn { padding: 10px 12px; font-size: 13px; }
      .profile-avatar-large { width: 72px; height: 72px; font-size: 24px; }
      .modal-overlay { padding: 8px; align-items: flex-end; }
      .modal-card { border-radius: 16px 16px 0 0; max-height: 95vh; }
      .modal-header h3 { font-size: 18px; }
      .form-grid { grid-template-columns: 1fr; }
      .letter-preview { display: none; }
      .modal-actions { flex-wrap: wrap; }
      .modal-actions button { flex: 1; justify-content: center; }
      .actions-bar { flex-wrap: wrap; }
    }

    @media (max-width: 480px) {
      .tabs { overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
      .tab-btn { white-space: nowrap; flex-shrink: 0; }
      .skills-grid { grid-template-columns: 1fr; }
      .profil-layout { gap: var(--spacing-md); }
    }
  `]
})
export class ProfilComponent implements OnInit {
  candidate: Candidate | undefined;
  activeTab = 'resume';
  showAssignmentModal = false;
  todayLabel = new Date().toLocaleDateString('fr-FR');

  assignmentForm = {
    instituteNameFr: '',
    instituteNameAr: '',
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
    { id: 'resume', label: 'Resume' },
    { id: 'skills', label: 'Competences' },
    { id: 'experiences', label: 'Experiences' },
    { id: 'projects', label: 'Projets' },
    { id: 'documents', label: 'Documents RH' },
    { id: 'notes', label: 'Notes' }
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
    });
  }

  getInitials(): string {
    if (!this.candidate) return '';
    return `${this.candidate.firstName[0]}${this.candidate.lastName[0]}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getDocTypeLabel(type: any): string {
    const labels: Record<string, string> = {
      cv: 'CV',
      lettre_motivation: 'Lettre de motivation',
      demande_stage: 'Demande de stage',
      convention_stage: 'Convention de stage',
      convention_signee: 'Convention signee',
      attestation: 'Lettre d affectation',
      autre: 'Autre'
    };
    return labels[type || 'autre'] || (type || 'Document');
  }

  getDocumentType(doc: any): string {
    return doc?.type || 'autre';
  }

  getDocumentStatus(doc: any): string {
    return doc?.status || 'soumis';
  }

  isInternshipRequest(doc: any): boolean {
    return this.getDocumentType(doc) === 'demande_stage';
  }

  getDocumentStatusLabel(status: any): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      soumis: 'Soumis',
      valide: 'Valide',
      rejete: 'Rejete',
      signe: 'Signe'
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
      alert('La demande de stage signee a ete generee et renvoyee au candidat.');
    });
  }

  openAssignmentLetterModal(): void {
    if (!this.candidate || !this.canGenerateAssignmentLetter()) return;
    this.assignmentForm = {
      instituteNameFr: 'Institut Superieur de Gestion Industrielle de Sfax',
      instituteNameAr: 'المعهد العالي للتصرف الصناعي بصفاقس',
      letterDate: this.todayLabel,
      companyName: 'Informatique net',
      directorName: 'Directeur societe',
      internshipTitle: 'Stage obligatoire',
      specialty: this.candidate.expectedDegree || this.candidate.level || '',
      startDate: '',
      endDate: '',
      signatoryName: 'Direction des stages',
      signatoryTitle: 'La Direction des Stages'
    };
    this.showAssignmentModal = true;
  }

  closeAssignmentLetterModal(): void {
    this.showAssignmentModal = false;
  }

  submitAssignmentLetter(): void {
    if (!this.candidate || !this.canGenerateAssignmentLetter()) return;

    this.candidateService.generateAssignmentLetter(this.candidate.id, this.assignmentForm).subscribe(() => {
      this.loadCandidate(this.candidate!.id);
      this.closeAssignmentLetterModal();
      alert('La lettre d affectation a ete generee.');
    });
  }

  canGenerateAssignmentLetter(): boolean {
    if (!this.candidate) return false;
    return ['preselectionne', 'offre_acceptee'].includes(this.candidate.status as string);
  }

  shouldHideRhDocuments(): boolean {
    if (!this.candidate) return false;
    return this.candidate.status === 'nouveau';
  }
}
