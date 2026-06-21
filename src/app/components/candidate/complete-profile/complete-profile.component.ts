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
      <div class="ambient ambient-1"></div>
      <div class="ambient ambient-2"></div>
      <div class="ambient ambient-3"></div>
      <div class="profile-container">
        <div class="profile-card">
          <div class="profile-header">
            <div class="progress-indicator">
              <div class="progress-step" [class.active]="currentStep >= 1" [class.complete]="currentStep > 1">
                <span class="step-number">1</span>
                <span class="step-label">Profil</span>
              </div>
              <div class="progress-line" [class.complete]="currentStep > 1"></div>
              <div class="progress-step" [class.active]="currentStep >= 2" [class.complete]="currentStep > 2">
                <span class="step-number">2</span>
                <span class="step-label">Etudes</span>
              </div>
              <div class="progress-line" [class.complete]="currentStep > 2"></div>
              <div class="progress-step" [class.active]="currentStep >= 3" [class.complete]="currentStep > 3">
                <span class="step-number">3</span>
                <span class="step-label">Compétences</span>
              </div>
            </div>
            <h1>Complétez votre profil</h1>
            <p class="text-muted">Cette information aidera les recruteurs à mieux vous connaître</p>
            <div class="step-caption">
              <span class="caption-chip" [class.active]="currentStep === 1">PROFIL</span>
              <span class="caption-chip" [class.active]="currentStep === 2">ETUDES</span>
              <span class="caption-chip" [class.active]="currentStep === 3">COMPÉTENCES</span>
            </div>
          </div>

          <form (ngSubmit)="onSubmit()" class="profile-form">
            <div class="form-alert" *ngIf="submitErrorMessage">
              {{ submitErrorMessage }}
            </div>
            <!-- Step 1: Personal Info -->
            <div *ngIf="currentStep === 1" class="form-step">
              <div class="step-intro">
                <span class="step-icon">✦</span>
                <div>
                  <p class="step-kicker">Etape 1</p>
                </div>
              </div>
              <h2>Informations personnelles</h2>
              
              <div class="grid-2">
                <div class="form-group">
                  <label>Prénom *</label>
                  <input type="text" [(ngModel)]="profile.firstName" name="firstName" required>
                  <small class="field-error" *ngIf="shouldShowRequiredError(profile.firstName)">Ce champ est obligatoire.</small>
                  <small class="field-error" *ngIf="!shouldShowRequiredError(profile.firstName) && hasDigits(profile.firstName)">Ce champ ne doit pas contenir de chiffres.</small>
                </div>
                <div class="form-group">
                  <label>Nom *</label>
                  <input type="text" [(ngModel)]="profile.lastName" name="lastName" required>
                  <small class="field-error" *ngIf="shouldShowRequiredError(profile.lastName)">Ce champ est obligatoire.</small>
                  <small class="field-error" *ngIf="!shouldShowRequiredError(profile.lastName) && hasDigits(profile.lastName)">Ce champ ne doit pas contenir de chiffres.</small>
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Email *</label>
                  <input type="email" [(ngModel)]="profile.email" name="candidate-email" required autocomplete="new-password" [readonly]="emailReadonly" (focus)="emailReadonly=false" (click)="emailReadonly=false">
                  <small class="field-error" *ngIf="shouldShowRequiredError(profile.email)">Ce champ est obligatoire.</small>
                </div>
                <div class="form-group">
                  <label>Téléphone *</label>
                  <input type="tel" [(ngModel)]="profile.phone" name="phone" placeholder="+216 25 693 624" required>
                  <small class="field-error" *ngIf="shouldShowPhoneRequiredError()">Ce champ est obligatoire.</small>
                </div>
              </div>

              <div class="form-group" hidden>
                <input type="password" [(ngModel)]="password" name="password" placeholder="Minimum 6 caractères">
              </div>

              <div class="form-group">
                <label>Localisation *</label>
                <input type="text" [(ngModel)]="profile.location" name="location" placeholder="Tunis, Tunisie" required>
                <small class="field-error" *ngIf="shouldShowRequiredError(profile.location)">Ce champ est obligatoire.</small>
                <small class="field-error" *ngIf="!shouldShowRequiredError(profile.location) && hasDigits(profile.location)">Ce champ ne doit pas contenir de chiffres.</small>
              </div>
            </div>

            <!-- Step 2: Education -->
            <div *ngIf="currentStep === 2" class="form-step">
              <div class="step-intro">
                <span class="step-icon">◆</span>
                <div>
                  <p class="step-kicker">Etape 2</p>
                </div>
              </div>
              <h2>Formation</h2>

              <div class="form-group">
                <label>École / Université *</label>
                <input type="text" [(ngModel)]="profile.school" name="school" placeholder="INSAT Tunis" required>
                <small class="field-error" *ngIf="shouldShowRequiredError(profile.school)">Ce champ est obligatoire.</small>
                <small class="field-error" *ngIf="!shouldShowRequiredError(profile.school) && hasDigits(profile.school)">Ce champ ne doit pas contenir de chiffres.</small>
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
                    <option value="Cycle ingénieur 1">Cycle ingénieur 1</option>
                    <option value="Cycle ingénieur 2">Cycle ingénieur 2</option>
                    <option value="Cycle ingénieur 3">Cycle ingénieur 3</option>
                    <option value="Doctorat">Doctorat</option>
                  </select>
                  <small class="field-error" *ngIf="shouldShowRequiredError(profile.level)">Ce champ est obligatoire.</small>
                </div>

                <div class="form-group">
                  <label>Diplôme préparé *</label>
                  <input type="text" [(ngModel)]="profile.expectedDegree" name="expectedDegree" placeholder="Expert en Informatique" required>
                  <small class="field-error" *ngIf="shouldShowRequiredError(profile.expectedDegree)">Ce champ est obligatoire.</small>
                  <small class="field-error" *ngIf="!shouldShowRequiredError(profile.expectedDegree) && hasDigits(profile.expectedDegree)">Ce champ ne doit pas contenir de chiffres.</small>
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Date d'obtention prévue *</label>
                  <input type="date" [(ngModel)]="profile.expectedGraduation" name="expectedGraduation" required>
                  <small class="field-error" *ngIf="shouldShowRequiredError(profile.expectedGraduation)">Ce champ est obligatoire.</small>
                </div>

                <div class="form-group">
                  <label>Disponibilité *</label>
                  <input type="date" [(ngModel)]="profile.availability" name="availability" required>
                  <small class="field-error" *ngIf="shouldShowRequiredError(profile.availability)">Ce champ est obligatoire.</small>
                </div>
              </div>
            </div>

            <!-- Step 3: Skills & Links -->
            <div *ngIf="currentStep === 3" class="form-step">
              <div class="step-intro">
                <span class="step-icon">⚡</span>
                <div>
                  <p class="step-kicker">Etape 3</p>
                </div>
              </div>
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
                [disabled]="isSubmitting"
                (click)="onSubmit()">
                {{ isSubmitting ? 'Envoi...' : 'Terminer' }}
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
      background:
        radial-gradient(circle at 15% 18%, rgba(255, 255, 255, 0.22), transparent 22%),
        radial-gradient(circle at 82% 12%, rgba(224, 242, 254, 0.24), transparent 24%),
        radial-gradient(circle at 50% 78%, rgba(125, 211, 252, 0.22), transparent 26%),
        linear-gradient(135deg, #00A0DC 0%, #0093d3 30%, #0074BC 100%);
      padding: 12px 20px;
      position: relative;
      overflow: hidden;
    }

    .ambient {
      position: absolute;
      border-radius: 999px;
      filter: blur(18px);
      opacity: 0.55;
      pointer-events: none;
      animation: floatBlob 12s ease-in-out infinite;
    }

    .ambient-1 {
      width: 320px;
      height: 320px;
      background: rgba(255, 255, 255, 0.24);
      top: 8%;
      left: -60px;
    }

    .ambient-2 {
      width: 260px;
      height: 260px;
      background: rgba(224, 242, 254, 0.22);
      right: 4%;
      bottom: 14%;
      animation-delay: -4s;
    }

    .ambient-3 {
      width: 200px;
      height: 200px;
      background: rgba(191, 219, 254, 0.2);
      left: 18%;
      bottom: 6%;
      animation-delay: -7s;
    }

    .profile-container {
      width: 100%;
      max-width: 810px;
      position: relative;
      z-index: 1;
    }

    .profile-card {
      background:
        linear-gradient(155deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.86)),
        linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.08));
      border-radius: 28px;
      padding: 20px 24px;
      box-shadow: 0 20px 50px rgba(0, 60, 120, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.35);
      backdrop-filter: blur(18px);
      position: relative;
      overflow: hidden;
    }

    .profile-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(115deg, rgba(255,255,255,0.52), transparent 34%),
        radial-gradient(circle at top right, rgba(125, 211, 252, 0.18), transparent 24%),
        radial-gradient(circle at bottom left, rgba(196, 181, 253, 0.12), transparent 28%);
      pointer-events: none;
    }

    .profile-card::after {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 31px;
      border: 1px solid rgba(255,255,255,0.35);
      pointer-events: none;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.45);
    }

    .profile-header {
      text-align: center;
      margin-bottom: 14px;
      position: relative;
      z-index: 1;
    }

    .header-badge {
      display: inline-flex;
      align-items: center;
      padding: 10px 18px;
      margin-bottom: 18px;
      border-radius: 999px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.68), rgba(224, 242, 254, 0.68));
      color: #0074BC;
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border: 1px solid rgba(255, 255, 255, 0.45);
      box-shadow: 0 12px 30px rgba(0, 116, 188, 0.12);
    }

    .progress-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .progress-step {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.4);
      color: #64748b;
      display: flex;
      flex-direction: column;
      gap: 2px;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      transition: all 0.35s ease;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.4);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.4);
    }

    .step-number {
      font-size: 0.88rem;
      font-weight: 800;
    }

    .step-label {
      font-size: 0.47rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .progress-step.active:not(.complete) {
      background: linear-gradient(135deg, #00A0DC, #0074BC);
      color: white;
      transform: translateY(-4px);
      box-shadow: 0 18px 40px rgba(0, 160, 220, 0.28);
    }

    .progress-step.complete {
      background: linear-gradient(135deg, #a855f7, #ec4899);
      color: white;
      box-shadow: 0 14px 30px rgba(168, 85, 247, 0.24);
    }

    .progress-step.active.complete {
      background: linear-gradient(135deg, #a855f7, #ec4899);
      color: white;
      box-shadow: 0 14px 30px rgba(168, 85, 247, 0.24);
    }

    .progress-line {
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, rgba(191, 219, 254, 0.9), rgba(224, 242, 254, 0.95));
      transition: all 0.35s ease;
      border-radius: 999px;
    }

    .progress-line.complete {
      background: linear-gradient(90deg, #00A0DC, #0074BC);
    }

    .progress-step.complete + .progress-line.complete {
      background: linear-gradient(90deg, #a855f7, #ec4899);
    }

    .profile-header h1 {
      font-size: clamp(1.3rem, 2.5vw, 1.7rem);
      line-height: 1.1;
      margin: 0 0 4px 0;
      letter-spacing: -0.03em;
      color: #0f172a;
      text-shadow: none;
    }

    .text-muted {
      color: #475569;
      font-size: 0.82rem;
      max-width: 560px;
      margin: 0 auto;
    }

    .step-caption {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .caption-chip {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      color: #0f172a;
      background: rgba(255, 255, 255, 0.14);
      border: 1px solid rgba(255, 255, 255, 0.18);
      transition: all 0.25s ease;
    }

    .caption-chip.active {
      color: #0f172a;
      background: linear-gradient(135deg, rgba(0, 160, 220, 0.88), rgba(0, 116, 188, 0.84));
      border-color: rgba(125, 211, 252, 0.35);
      box-shadow: 0 10px 25px rgba(0, 116, 188, 0.18);
      transform: translateY(-2px);
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      z-index: 1;
    }

    .form-step {
      animation: revealStep 0.45s ease both;
    }

    .step-intro {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .step-icon {
      width: 36px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.74), rgba(224, 242, 254, 0.7));
      color: #0074BC;
      font-size: 1rem;
      border: 1px solid rgba(255,255,255,0.4);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 18px rgba(0, 60, 120, 0.1);
    }

    .step-kicker {
      margin: 0;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #c4b5fd;
    }

    .form-step h2 {
      font-size: 1.1rem;
      margin: 0 0 10px 0;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .skills-input {
      display: flex;
      gap: 12px;
    }

    .skills-input input {
      flex: 1;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      min-height: 38px;
      padding: 7px 12px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 12px;
      font-size: 14px;
      background: rgba(255, 255, 255, 0.92);
      color: #0F172A;
      box-sizing: border-box;
      transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease, background 0.25s ease;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 12px rgba(0, 116, 188, 0.06);
    }

    .form-group label {
      display: inline-block;
      margin-bottom: 5px;
      font-size: 0.82rem;
      font-weight: 700;
      color: #1e293b;
      letter-spacing: -0.01em;
    }

    .form-group {
      padding: 8px 10px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.08));
      border: 1px solid rgba(255, 255, 255, 0.18);
      transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
    }

    .form-group:hover {
      transform: translateY(-1px);
      border-color: rgba(255, 255, 255, 0.3);
      background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.1));
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: rgba(0, 160, 220, 0.45);
      box-shadow: 0 0 0 4px rgba(0, 160, 220, 0.12), 0 18px 34px rgba(0, 116, 188, 0.12);
      transform: translateY(-1px);
      background: #ffffff;
    }

    .form-group input::placeholder {
      color: #94a3b8;
    }

    .form-group select option {
      color: #0f172a;
      background: #ffffff;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .skill-tag {
      background: linear-gradient(135deg, rgba(224, 242, 254, 0.9), rgba(219, 234, 254, 0.92));
      color: #0074BC;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(125, 211, 252, 0.24);
      box-shadow: 0 4px 10px rgba(0, 116, 188, 0.06);
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
      background: rgba(255, 255, 255, 0.12);
    }

    .field-error {
      display: block;
      margin-top: 8px;
      color: #dc2626;
      font-size: 12px;
      font-weight: 700;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.22);
    }

    .form-actions .btn {
      min-width: 100px;
      min-height: 36px;
      border-radius: 12px;
      border: none;
      font-weight: 800;
      font-size: 0.88rem;
      letter-spacing: -0.01em;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
      transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
    }

    .form-actions .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 22px 38px rgba(15, 23, 42, 0.12);
      filter: saturate(1.05);
    }

    .form-actions .btn-primary {
      margin-left: auto;
      background: linear-gradient(135deg, #00A0DC, #0074BC);
      color: white;
    }

    .form-actions .btn-secondary {
      background: linear-gradient(135deg, rgba(255,255,255,0.68), rgba(224,242,254,0.75));
      color: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.4);
    }

    .form-actions .btn-success {
      background: linear-gradient(135deg, #00A0DC, #0074BC);
      color: white;
    }

    .form-alert {
      padding: 14px 16px;
      border: 1px solid rgba(248, 113, 113, 0.36);
      background: linear-gradient(135deg, rgba(255, 241, 242, 0.88), rgba(254, 226, 226, 0.84));
      color: #b91c1c;
      border-radius: 16px;
      font-size: 14px;
      box-shadow: 0 10px 22px rgba(239, 68, 68, 0.12);
    }

    .text-sm.text-muted {
      margin-top: 10px;
      font-size: 0.88rem;
      color: #64748b;
    }

    @keyframes revealStep {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes floatBlob {
      0%, 100% {
        transform: translate3d(0, 0, 0) scale(1);
      }
      50% {
        transform: translate3d(0, -12px, 0) scale(1.05);
      }
    }

    @media (max-width: 768px) {
      .complete-profile-page {
        padding: 20px 14px;
      }

      .grid-2 {
        grid-template-columns: 1fr;
      }

      .profile-card {
        padding: 26px 20px;
        border-radius: 24px;
      }

      .profile-header h1 {
        font-size: 2rem;
      }

      .progress-indicator {
        flex-wrap: wrap;
        gap: 10px;
      }

      .progress-line {
        width: 44px;
      }

      .progress-step {
        width: 52px;
        height: 52px;
        border-radius: 18px;
      }

      .step-label {
        font-size: 0.6rem;
      }

      .step-intro { align-items: flex-start; }
    }

    @media (max-width: 480px) {
      .complete-profile-page { padding: 16px 10px; }
      .profile-card { padding: 20px 14px; border-radius: 16px; }
      .profile-header h1 { font-size: 1.5rem; }
      .progress-indicator { justify-content: center; }
      .progress-step { width: 44px; height: 44px; border-radius: 14px; font-size: 1rem; }
      .progress-line { width: 28px; }
      .step-label { display: none; }
      .form-actions { flex-direction: column; gap: 8px; }
      .form-actions button { width: 100%; justify-content: center; }
    }
  `]
})
export class CompleteProfileComponent implements OnInit {
  currentStep = 1;
  newSkill = '';
  password = '';
  attemptedStepSubmit = false;
  submitErrorMessage = '';
  isSubmitting = false;
  emailReadonly = true;
  
  profile: CandidateProfile = {
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '+216 ',
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
      if (user.role === 'candidate') {
        // Pre-fill only for existing candidate sessions
        this.profile.userId = user.id;
        this.profile.firstName = user.firstName;
        this.profile.lastName = user.lastName;
        this.profile.email = user.email;

        if (user.profileComplete) {
          this.router.navigate(['/candidate/offers']);
        }
      } else {
        // Recruiter/admin should not see this form with their data — clear session
        this.authService.logout();
      }
    }

    if (!this.profile.phone || this.profile.phone.trim() === '') {
      this.profile.phone = '+216 ';
    }
  }

  nextStep(): void {
    this.attemptedStepSubmit = true;
    if (this.currentStep < 3 && this.isCurrentStepValid()) {
      this.currentStep++;
      this.attemptedStepSubmit = false;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.attemptedStepSubmit = false;
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
      !this.hasDigits(this.profile.firstName) &&
      !this.hasDigits(this.profile.lastName) &&
      !this.hasDigits(this.profile.location) &&
      !this.hasDigits(this.profile.school) &&
      !this.hasDigits(this.profile.expectedDegree) &&
      this.profile.firstName.trim() !== '' &&
      this.profile.lastName.trim() !== '' &&
      this.profile.email.trim() !== '' &&
      this.isPhoneValid() &&
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
    this.attemptedStepSubmit = true;
    this.submitErrorMessage = '';
    if (!this.isFormValid()) {
      this.submitErrorMessage = 'Veuillez corriger les champs obligatoires avant de terminer.';
      return;
    }

    const rawUser = this.authService.getCurrentUser();
    const user = rawUser?.role === 'candidate' ? rawUser : null;
    this.isSubmitting = true;

    // If user is not logged in (or is recruiter/admin), create account first
    if (!user) {
      // Register user. Password is optional for first-time candidate; if not provided backend will generate a secure one.
      this.authService.register(
        this.profile.email,
        undefined,
        this.profile.firstName,
        this.profile.lastName
      ).subscribe({
        next: (response) => {
          // Now continue with profile creation
          this.createCandidateProfile(response.user.id);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Erreur lors de la création du compte', error);
          if (error?.status === 0) {
            this.submitErrorMessage = 'Le serveur est inaccessible. Veuillez démarrer le backend et réessayer.';
          } else {
            this.submitErrorMessage = error?.error?.message || error?.message || 'Impossible de créer le compte. Veuillez réessayer.';
          }
        }
      });
    } else {
      this.createCandidateProfile(user.id);
    }
  }

  private createCandidateProfile(userId: string): void {
    // Prepare profile data for backend
    const profileData = {
      phone: this.profile.phone,
      location: this.profile.location,
      school: this.profile.school,
      educationLevel: this.profile.level,
      expectedDegree: this.profile.expectedDegree,
      expectedGraduation: this.profile.expectedGraduation,
      availability: this.profile.availability,
      skills: this.profile.skills,
      linkedin: this.profile.linkedIn || '',
      github: this.profile.github || '',
      portfolio: this.profile.portfolio || ''
    };

    // Save to backend
    this.candidateService.updateProfile(profileData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        console.log('Profile saved successfully:', response);
        
        // Update profile complete status
        this.authService.updateProfileComplete(userId);

        this.router.navigate(['/candidate/offers']);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error saving profile:', error);
        const msg = error?.error?.error || error?.error?.message || error?.message || 'Erreur inconnue';
        this.submitErrorMessage = `Erreur lors de la sauvegarde du profil : ${msg}`;
      }
    });
  }

  hasDigits(value: string): boolean {
    return /\d/.test((value || '').trim());
  }

  isTextFieldInvalid(value: string, required: boolean = true): boolean {
    const trimmed = (value || '').trim();
    if (required && this.attemptedStepSubmit && trimmed === '') {
      return true;
    }
    return trimmed !== '' && this.hasDigits(trimmed);
  }

  shouldShowRequiredError(value: string): boolean {
    return this.attemptedStepSubmit && (value || '').trim() === '';
  }

  private getPhoneDigits(): string {
    return (this.profile.phone || '').replace(/\D/g, '');
  }

  isPhoneValid(): boolean {
    const digits = this.getPhoneDigits();
    if (!digits || digits === '216') {
      return false;
    }

    return digits.length >= 11;
  }

  shouldShowPhoneRequiredError(): boolean {
    return this.attemptedStepSubmit && !this.isPhoneValid();
  }

  isCurrentStepValid(): boolean {
    if (this.currentStep === 1) {
      return (
        this.profile.firstName.trim() !== '' &&
        this.profile.lastName.trim() !== '' &&
        this.profile.email.trim() !== '' &&
        this.isPhoneValid() &&
        this.profile.location.trim() !== '' &&
        !this.hasDigits(this.profile.firstName) &&
        !this.hasDigits(this.profile.lastName) &&
        !this.hasDigits(this.profile.location)
      );
    }

    if (this.currentStep === 2) {
      return (
        this.profile.school.trim() !== '' &&
        this.profile.level.trim() !== '' &&
        this.profile.expectedDegree.trim() !== '' &&
        this.profile.expectedGraduation.trim() !== '' &&
        this.profile.availability.trim() !== '' &&
        !this.hasDigits(this.profile.school) &&
        !this.hasDigits(this.profile.expectedDegree)
      );
    }

    return this.profile.skills.length >= 3;
  }
}
