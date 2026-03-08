import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { Candidate } from '../../models';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profil-page" *ngIf="candidate">
      <div class="profil-layout">
        <!-- Sidebar -->
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
                <div class="info-label">Diplôme attendu</div>
                <div class="info-value">{{ candidate.expectedDegree }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Disponibilité</div>
                <div class="info-value">{{ candidate.availability }}</div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="profil-main">
          <!-- Tabs -->
          <div class="tabs">
            <button 
              *ngFor="let tab of tabs" 
              class="tab-btn" 
              [class.active]="activeTab === tab.id"
              (click)="activeTab = tab.id">
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab Content -->
          <div class="tab-content card">
            <!-- Resume Tab -->
            <div *ngIf="activeTab === 'resume'">
              <h3>Résumé du profil</h3>
              <div class="resume-section">
                <h4>Formation</h4>
                <p><strong>{{ candidate.school }}</strong></p>
                <p>{{ candidate.level }} - {{ candidate.expectedDegree }}</p>
                <p class="text-muted">Diplôme prévu: {{ candidate.expectedGraduation }}</p>
              </div>

              <div class="resume-section">
                <h4>Langues</h4>
                <div class="languages-list">
                  <div *ngFor="let language of candidate.languages" class="language-item">
                    <span class="language-name">{{ language.name }}</span>
                    <span class="badge badge-primary">{{ language.level }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Skills Tab -->
            <div *ngIf="activeTab === 'skills'">
              <h3>Compétences techniques</h3>
              <div class="skills-grid">
                <div *ngFor="let skill of candidate.skills" class="skill-item-large">
                  <div class="skill-header">
                    <span class="skill-name">{{ skill.name }}</span>
                    <span class="skill-level">{{ skill.level }}/5</span>
                  </div>
                  <div class="skill-bar">
                    <div class="skill-progress" [style.width.%]="(skill.level! / 5) * 100"></div>
                  </div>
                  <div class="skill-meta" *ngIf="skill.years">
                    {{ skill.years }} an(s) d'expérience
                  </div>
                </div>
              </div>
            </div>

            <!-- Experiences Tab -->
            <div *ngIf="activeTab === 'experiences'">
              <h3>Expériences professionnelles</h3>
              <div class="experiences-list">
                <div *ngIf="candidate.experiences.length === 0" class="empty-message">
                  Aucune expérience professionnelle renseignée.
                </div>
                <div *ngFor="let exp of candidate.experiences" class="experience-card">
                  <h4>{{ exp.position }}</h4>
                  <p class="experience-company">{{ exp.company }} - {{ exp.location }}</p>
                  <p class="experience-dates text-muted">
                    {{ exp.startDate }} - {{ exp.current ? 'Présent' : exp.endDate }}
                  </p>
                  <p class="experience-description">{{ exp.description }}</p>
                  <div class="experience-skills">
                    <span *ngFor="let skill of exp.skills" class="skill-tag">{{ skill }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Projects Tab -->
            <div *ngIf="activeTab === 'projects'">
              <h3>Projets</h3>
              <div class="projects-list">
                <div *ngIf="candidate.projects.length === 0" class="empty-message">
                  Aucun projet renseigné.
                </div>
                <div *ngFor="let project of candidate.projects" class="project-card">
                  <h4>{{ project.name }}</h4>
                  <p class="project-description">{{ project.description }}</p>
                  <div class="project-technologies">
                    <span *ngFor="let tech of project.technologies" class="skill-tag">{{ tech }}</span>
                  </div>
                  <a *ngIf="project.url" [href]="project.url" target="_blank" class="project-link">
                    Voir le projet →
                  </a>
                </div>
              </div>
            </div>

            <!-- Notes Tab -->
            <div *ngIf="activeTab === 'notes'">
              <h3>Notes internes</h3>
              <div class="notes-list">
                <div *ngIf="!candidate.notes || candidate.notes.length === 0" class="empty-message">
                  Aucune note pour le moment.
                </div>
                <div *ngFor="let note of candidate.notes" class="note-card">
                  <div class="note-header">
                    <strong>{{ note.authorName }}</strong>
                    <span class="text-muted text-sm">{{ formatDate(note.createdAt) }}</span>
                  </div>
                  <p class="note-content">{{ note.content }}</p>
                </div>
              </div>

              <div class="add-note-form">
                <textarea placeholder="Ajouter une note..." class="note-textarea"></textarea>
                <button class="btn btn-primary">Ajouter la note</button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="actions-bar card">
            <button class="btn btn-secondary">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              Refuser
            </button>
            <button class="btn btn-primary">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              Accepter
            </button>
            <button class="btn btn-success">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              Envoyer un email
            </button>
          </div>
        </main>
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

    /* Sidebar */
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

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--gray-200);
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

    .tab-btn:hover {
      color: var(--gray-900);
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

    /* Resume */
    .resume-section {
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-lg);
      border-bottom: 1px solid var(--gray-200);
    }

    .resume-section:last-child {
      border-bottom: none;
    }

    .resume-section h4 {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--gray-700);
    }

    .languages-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .language-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .language-name {
      font-weight: 500;
    }

    /* Skills */
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
      transition: width 0.3s;
    }

    .skill-meta {
      font-size: 12px;
      color: var(--gray-500);
    }

    /* Experiences & Projects */
    .experiences-list,
    .projects-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    .experience-card,
    .project-card {
      padding: var(--spacing-lg);
      background: var(--gray-50);
      border-radius: var(--radius-md);
    }

    .experience-card h4,
    .project-card h4 {
      margin: 0 0 8px 0;
    }

    .experience-company,
    .experience-dates {
      font-size: 14px;
      margin-bottom: 4px;
    }

    .experience-description,
    .project-description {
      color: var(--gray-700);
      line-height: 1.5;
      margin-bottom: var(--spacing-md);
    }

    .experience-skills,
    .project-technologies {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-tag {
      background: white;
      border: 1px solid var(--gray-300);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 500;
    }

    .project-link {
      display: inline-block;
      margin-top: var(--spacing-sm);
      color: var(--primary-color);
      font-weight: 500;
    }

    /* Notes */
    .notes-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
    }

    .note-card {
      padding: var(--spacing-md);
      background: var(--gray-50);
      border-radius: var(--radius-md);
    }

    .note-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .note-content {
      color: var(--gray-700);
      line-height: 1.5;
      margin: 0;
    }

    .add-note-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .note-textarea {
      min-height: 100px;
      resize: vertical;
    }

    /* Actions Bar */
    .actions-bar {
      display: flex;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
    }

    .empty-message {
      text-align: center;
      padding: var(--spacing-xl);
      color: var(--gray-500);
    }

    @media (max-width: 1024px) {
      .profil-layout {
        grid-template-columns: 1fr;
      }

      .skills-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProfilComponent implements OnInit {
  candidate: Candidate | undefined;
  activeTab = 'resume';
  
  tabs = [
    { id: 'resume', label: 'Résumé' },
    { id: 'skills', label: 'Compétences' },
    { id: 'experiences', label: 'Expériences' },
    { id: 'projects', label: 'Projets' },
    { id: 'notes', label: 'Notes' }
  ];

  constructor(
    private route: ActivatedRoute,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.candidate = this.candidateService.getCandidateById(id);
    }
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
}
