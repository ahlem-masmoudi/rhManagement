import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CandidateService } from '../../../services/candidate.service';
import { CandidateProfile } from '../../../models/auth.models';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="complete-profile-page">
      <div class="profile-container">
        <div class="profile-card">
          <div class="profile-header">
            <div class="progress-indicator">
              <div class="progress-step" [class.active]="currentStep >= 1" [class.complete]="currentStep > 1">1</div>
              <div class="progress-line" [class.complete]="currentStep > 1"></div>
              <div class="progress-step" [class.active]="currentStep >= 2" [class.complete]="currentStep > 2">2</div>
              <div class="progress-line" [class.complete]="currentStep > 2"></div>
              <div class="progress-step" [class.active]="currentStep >= 3" [class.complete]="currentStep > 3">3</div>
            </div>
            <h1>Complétez votre profil</h1>
            <p class="text-muted">Cette information aidera les recruteurs à mieux vous connaître</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="profile-form">
            <!-- Step 1: Personal Info -->
            <div *ngIf="currentStep === 1" class="form-step">
              <h2>Informations personnelles</h2>
              
              <div class="grid-2">
                <div class="form-group">
                  <label>Prénom *</label>
                  <input type="text" [(ngModel)]="profile.firstName" name="firstName" required>
                </div>
                <div class="form-group">
                  <label>Nom *</label>
                  <input type="text" [(ngModel)]="profile.lastName" name="lastName" required>
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Email *</label>
                  <input type="email" [(ngModel)]="profile.email" name="email" required>
                </div>
                <div class="form-group">
                  <label>Téléphone *</label>
                  <input type="tel" [(ngModel)]="profile.phone" name="phone" placeholder="+33 6 12 34 56 78" required>
                </div>
              </div>

              <div class="form-group">
                <label>Mot de passe *</label>
                <input type="password" [(ngModel)]="password" name="password" placeholder="Minimum 6 caractères" required>
              </div>

              <div class="form-group">
                <label>Localisation *</label>
                <input type="text" [(ngModel)]="profile.location" name="location" placeholder="Paris, France" required>
              </div>
            </div>

            <!-- Step 2: Education -->
            <div *ngIf="currentStep === 2" class="form-step">
              <h2>Formation</h2>

              <div class="form-group">
                <label>École / Université *</label>
                <input type="text" [(ngModel)]="profile.school" name="school" placeholder="EPITECH Paris" required>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Niveau d'études *</label>
                  <select [(ngModel)]="profile.level" name="level" required>
                    <option value="">Sélectionner...</option>
                    <option value="Licence 1">Licence 1</option>
                    <option value="Licence 2">Licence 2</option>
                    <option value="Licence 3">Licence 3</option>
                    <option value="Master 1">Master 1</option>
                    <option value="Master 2">Master 2</option>
                    <option value="Doctorat">Doctorat</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Diplôme préparé *</label>
                  <input type="text" [(ngModel)]="profile.expectedDegree" name="expectedDegree" placeholder="Expert en Informatique" required>
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Date d'obtention prévue *</label>
                  <input type="text" [(ngModel)]="profile.expectedGraduation" name="expectedGraduation" placeholder="Septembre 2024" required>
                </div>

                <div class="form-group">
                  <label>Disponibilité *</label>
                  <input type="text" [(ngModel)]="profile.availability" name="availability" placeholder="Juin 2024 - 6 mois" required>
                </div>
              </div>
            </div>

            <!-- Step 3: Skills & Links -->
            <div *ngIf="currentStep === 3" class="form-step">
              <h2>Compétences et liens</h2>

              <div class="form-group">
                <label>Compétences principales *</label>
                <div class="skills-input">
                  <input 
                    type="text" 
                    [(ngModel)]="newSkill" 
                    name="newSkill"
                    placeholder="Ex: React, Python, etc."
                    (keyup.enter)="addSkill()">
                  <button type="button" class="btn btn-secondary" (click)="addSkill()">Ajouter</button>
                </div>
                <div class="skills-list" *ngIf="profile.skills.length > 0">
                  <span *ngFor="let skill of profile.skills; let i = index" class="skill-tag">
                    {{ skill }}
                    <button type="button" (click)="removeSkill(i)" class="remove-skill">×</button>
                  </span>
                </div>
                <p class="text-sm text-muted">Ajoutez au moins 3 compétences</p>
              </div>

              <div class="form-group">
                <label>LinkedIn</label>
                <input type="url" [(ngModel)]="profile.linkedIn" name="linkedIn" placeholder="https://linkedin.com/in/votre-profil">
              </div>

              <div class="form-group">
                <label>GitHub</label>
                <input type="url" [(ngModel)]="profile.github" name="github" placeholder="https://github.com/votre-username">
              </div>

              <div class="form-group">
                <label>Portfolio</label>
                <input type="url" [(ngModel)]="profile.portfolio" name="portfolio" placeholder="https://votre-portfolio.com">
              </div>
            </div>

            <!-- Navigation Buttons -->
            <div class="form-actions">
              <button 
                type="button" 
                class="btn btn-secondary" 
                *ngIf="currentStep > 1"
                (click)="previousStep()">
                Précédent
              </button>
              
              <button 
                type="button" 
                class="btn btn-primary" 
                *ngIf="currentStep < 3"
                (click)="nextStep()">
                Suivant
              </button>

              <button 
                type="submit" 
                class="btn btn-success" 
                *ngIf="currentStep === 3"
                [disabled]="!isFormValid()">
                Terminer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .complete-profile-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--gray-50);
      padding: 40px 20px;
    }

    .profile-container {
      width: 100%;
      max-width: 800px;
    }

    .profile-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 40px;
      box-shadow: var(--shadow-lg);
    }

    .profile-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .progress-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
    }

    .progress-step {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--gray-200);
      color: var(--gray-500);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      transition: all 0.3s;
    }

    .progress-step.active {
      background: var(--primary-color);
      color: white;
    }

    .progress-step.complete {
      background: var(--success);
      color: white;
    }

    .progress-line {
      width: 80px;
      height: 2px;
      background: var(--gray-200);
      transition: all 0.3s;
    }

    .progress-line.complete {
      background: var(--success);
    }

    .profile-header h1 {
      font-size: 28px;
      margin: 0 0 8px 0;
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .form-step h2 {
      font-size: 20px;
      margin: 0 0 24px 0;
      color: var(--gray-900);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .skills-input {
      display: flex;
      gap: 12px;
    }

    .skills-input input {
      flex: 1;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .skill-tag {
      background: #EEF2FF;
      color: var(--primary-color);
      padding: 6px 12px;
      border-radius: var(--radius-full);
      font-size: 14px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .remove-skill {
      background: none;
      border: none;
      color: var(--primary-color);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    }

    .remove-skill:hover {
      background: rgba(79, 70, 229, 0.1);
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding-top: 24px;
      border-top: 1px solid var(--gray-200);
    }

    .form-actions .btn {
      min-width: 120px;
    }

    @media (max-width: 768px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }

      .profile-card {
        padding: 24px;
      }
    }
  `]
})
export class CompleteProfileComponent implements OnInit {
  currentStep = 1;
  newSkill = '';
  password = '';
  
  profile: CandidateProfile = {
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    school: '',
    level: '',
    expectedDegree: '',
    expectedGraduation: '',
    availability: '',
    skills: [],
    linkedIn: '',
    github: '',
    portfolio: ''
  };

  constructor(
    private authService: AuthService,
    private candidateService: CandidateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.profile.userId = user.id;
      this.profile.firstName = user.firstName;
      this.profile.lastName = user.lastName;
      this.profile.email = user.email;

      // If profile already complete, redirect to dashboard
      if (user.profileComplete) {
        this.router.navigate(['/candidate']);
      }
    }
    // Allow non-authenticated users to fill the form
    // They will be registered when they submit
  }

  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addSkill(): void {
    const skillsToAdd = this.newSkill.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    skillsToAdd.forEach(skill => {
      if (!this.profile.skills.includes(skill)) {
        this.profile.skills.push(skill);
      }
    });
    
    this.newSkill = '';
  }

  removeSkill(index: number): void {
    this.profile.skills.splice(index, 1);
  }

  isFormValid(): boolean {
    return (
      this.profile.firstName.trim() !== '' &&
      this.profile.lastName.trim() !== '' &&
      this.profile.email.trim() !== '' &&
      this.password.trim() !== '' &&
      this.password.length >= 6 &&
      this.profile.phone.trim() !== '' &&
      this.profile.location.trim() !== '' &&
      this.profile.school.trim() !== '' &&
      this.profile.level.trim() !== '' &&
      this.profile.expectedDegree.trim() !== '' &&
      this.profile.expectedGraduation.trim() !== '' &&
      this.profile.availability.trim() !== '' &&
      this.profile.skills.length >= 3
    );
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }

    const user = this.authService.getCurrentUser();
    
    // If user is not logged in, create account first
    if (!user) {
      // Use the password entered by the user
      this.authService.register(
        this.profile.email,
        this.password,
        this.profile.firstName,
        this.profile.lastName
      ).subscribe({
        next: (response) => {
          // Now continue with profile creation
          this.createCandidateProfile(response.user.id);
        },
        error: (error) => {
          console.error('Erreur lors de la création du compte', error);
          // If email already exists, try to get that user
          const existingUser = this.authService.getCurrentUser();
          if (existingUser) {
            this.createCandidateProfile(existingUser.id);
          }
        }
      });
    } else {
      this.createCandidateProfile(user.id);
    }
  }

  private createCandidateProfile(userId: string): void {
    // Create candidate in the system
    const newCandidate = {
      id: userId,
      firstName: this.profile.firstName,
      lastName: this.profile.lastName,
      email: this.profile.email,
      phone: this.profile.phone,
      status: 'nouveau' as const,
      school: this.profile.school,
      level: this.profile.level,
      expectedDegree: this.profile.expectedDegree,
      expectedGraduation: this.profile.expectedGraduation,
      location: this.profile.location,
      availability: this.profile.availability,
      skills: this.profile.skills.map((s: string) => ({ name: s, level: 3, years: 1 })),
      experiences: [],
      projects: [],
      languages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update profile complete status
    this.authService.updateProfileComplete(userId);

    // Redirect to candidate dashboard
    this.router.navigate(['/candidate']);
  }
}
