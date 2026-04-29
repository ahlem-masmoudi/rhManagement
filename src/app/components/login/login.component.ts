import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type AuthView = 'login' | 'forgot' | 'reset';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <!-- Animated background blobs -->
      <div class="bg-blob blob-1"></div>
      <div class="bg-blob blob-2"></div>
      <div class="bg-blob blob-3"></div>

      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="logo-wrap">
              <div class="logo-ring">
                <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="white" fill-opacity="0.15"/>
                  <path d="M16 8a5 5 0 0 1 5 5v1h1.5A1.5 1.5 0 0 1 24 15.5v7A1.5 1.5 0 0 1 22.5 24h-13A1.5 1.5 0 0 1 8 22.5v-7A1.5 1.5 0 0 1 9.5 14H11v-1a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v1h6v-1a3 3 0 0 0-3-3zm0 6a2 2 0 0 1 1 3.73V21h-2v-1.27A2 2 0 0 1 16 16z" fill="white"/>
                </svg>
              </div>
            </div>
            <h1>{{ getTitle() }}</h1>
            <p class="login-subtitle" *ngIf="currentView === 'login' && !showRegister && loginStep === 'credentials'">Espace sécurisé Ressources Humaines</p>
          </div>

          <form *ngIf="!showRegister && currentView === 'login' && loginStep === 'credentials'" (ngSubmit)="onLogin()" class="login-form">
            <div *ngIf="successMessage" class="alert alert-success">
              {{ successMessage }}
            </div>

            <div *ngIf="infoMessage" class="alert alert-info">
              {{ infoMessage }}
            </div>

            <div *ngIf="errorMessage" class="alert alert-error">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ errorMessage }}
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <div class="field-input-row">
                <div class="input-with-icon">
                  <input
                    type="email"
                    id="email"
                    [(ngModel)]="credentials.email"
                    name="email"
                    placeholder="exemple@email.com"
                    required
                    autocomplete="email"
                    [class.input-invalid]="errorField === 'email'"
                    [disabled]="isAccountTemporarilyLocked()">
                  <span class="input-icon svg-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <rect x="4" y="6.5" width="16" height="11" rx="2"></rect>
                      <path d="M5.5 8 12 13l6.5-5"></path>
                    </svg>
                  </span>
                </div>
                <span class="field-error-marker" *ngIf="errorField === 'email'" aria-hidden="true">!</span>
              </div>
            </div>

            <div class="form-group">
              <label for="password">Mot de passe</label>
              <div class="field-input-row">
                <div class="input-with-icon">
                  <input
                    [type]="showLoginPassword ? 'text' : 'password'"
                    id="password"
                    [(ngModel)]="credentials.password"
                    name="password"
                    placeholder="........"
                    required
                    autocomplete="current-password"
                    [class.input-invalid]="errorField === 'password'"
                    [disabled]="isAccountTemporarilyLocked()">
                  <button type="button" class="password-toggle inside-input" (click)="showLoginPassword = !showLoginPassword" [attr.aria-label]="showLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" [title]="showLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                    <svg *ngIf="!showLoginPassword" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"></path>
                      <circle cx="12" cy="12" r="3.2"></circle>
                    </svg>
                    <svg *ngIf="showLoginPassword" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 3l18 18"></path>
                      <path d="M10.6 10.7a2.9 2.9 0 0 0 4 4"></path>
                      <path d="M9.9 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-4 4.8"></path>
                      <path d="M6.6 6.7C3.8 8.5 2 12 2 12a17.8 17.8 0 0 0 6.2 5.4"></path>
                    </svg>
                  </button>
                </div>
                <span class="field-error-marker" *ngIf="errorField === 'password'" aria-hidden="true">!</span>
              </div>
              <small class="help-text lockout-help" *ngIf="lockoutCountdownLabel">
                Nouveau test possible dans {{ lockoutCountdownLabel }}.
              </small>
            </div>

            <button type="button" class="link-button align-right" (click)="openForgotPassword()" [disabled]="isAccountTemporarilyLocked()">
              Mot de passe oublié ?
            </button>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading || isAccountTemporarilyLocked()">
              <span *ngIf="!isLoading">Se connecter</span>
              <span *ngIf="isLoading">Connexion...</span>
            </button>

            <div *ngIf="isFingerprintSupported" class="divider-or">
              <span>ou</span>
            </div>

            <button *ngIf="isFingerprintSupported" type="button" class="btn btn-fingerprint btn-block"
              [disabled]="isLoading || isAccountTemporarilyLocked() || !credentials.email"
              (click)="onFingerprintLogin()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                <path d="M2 12a10 10 0 0 1 18-6"/>
                <path d="M2 16h.01"/>
                <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/>
                <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
              </svg>
              <span>Empreinte digitale</span>
            </button>

          </form>

          <form *ngIf="!showRegister && currentView === 'forgot'" (ngSubmit)="onForgotPassword()" class="login-form">
            <div *ngIf="successMessage" class="alert alert-success">
              {{ successMessage }}
              <span *ngIf="devResetUrl" class="dev-link">
                <a [href]="devResetUrl">Ouvrir le lien de réinitialisation</a>
              </span>
            </div>

            <div *ngIf="errorMessage" class="alert alert-error">
              {{ errorMessage }}
            </div>

            <div class="form-group">
              <label for="forgotEmail">Email</label>
              <input
                type="email"
                id="forgotEmail"
                [(ngModel)]="forgotPasswordData.email"
                name="forgotEmail"
                placeholder="exemple@email.com"
                required
                autocomplete="email">
              <small class="help-text">Nous vous enverrons un lien pour choisir un nouveau mot de passe.</small>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
              <span *ngIf="!isLoading">Envoyer le lien</span>
              <span *ngIf="isLoading">Envoi...</span>
            </button>

            <div class="login-footer">
              <p><a href="javascript:void(0)" (click)="backToLogin()">Retour à la connexion</a></p>
            </div>
          </form>

          <form *ngIf="!showRegister && currentView === 'reset'" (ngSubmit)="onResetPassword()" class="login-form">
            <div *ngIf="successMessage" class="alert alert-success">
              {{ successMessage }}
            </div>

            <div *ngIf="errorMessage" class="alert alert-error">
              {{ errorMessage }}
            </div>

            <div class="form-group">
              <label for="newPassword">Nouveau mot de passe</label>
              <div class="field-input-row password-row">
                <input
                  [type]="showResetPassword ? 'text' : 'password'"
                  id="newPassword"
                  [(ngModel)]="resetPasswordData.password"
                  name="newPassword"
                  placeholder="Minimum 6 caractères"
                  required
                  autocomplete="new-password">
                <button type="button" class="password-toggle" (click)="showResetPassword = !showResetPassword" [attr.aria-label]="showResetPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" [title]="showResetPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                  <svg *ngIf="!showResetPassword" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"></path>
                    <circle cx="12" cy="12" r="3.2"></circle>
                  </svg>
                  <svg *ngIf="showResetPassword" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18"></path>
                    <path d="M10.6 10.7a2.9 2.9 0 0 0 4 4"></path>
                    <path d="M9.9 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-4 4.8"></path>
                    <path d="M6.6 6.7C3.8 8.5 2 12 2 12a17.8 17.8 0 0 0 6.2 5.4"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmer le mot de passe</label>
              <div class="field-input-row password-row">
                <input
                  [type]="showResetConfirmPassword ? 'text' : 'password'"
                  id="confirmPassword"
                  [(ngModel)]="resetPasswordData.confirmPassword"
                  name="confirmPassword"
                  placeholder="Retapez le mot de passe"
                  required
                  autocomplete="new-password">
                <button type="button" class="password-toggle" (click)="showResetConfirmPassword = !showResetConfirmPassword" [attr.aria-label]="showResetConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" [title]="showResetConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                  <svg *ngIf="!showResetConfirmPassword" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"></path>
                    <circle cx="12" cy="12" r="3.2"></circle>
                  </svg>
                  <svg *ngIf="showResetConfirmPassword" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18"></path>
                    <path d="M10.6 10.7a2.9 2.9 0 0 0 4 4"></path>
                    <path d="M9.9 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-4 4.8"></path>
                    <path d="M6.6 6.7C3.8 8.5 2 12 2 12a17.8 17.8 0 0 0 6.2 5.4"></path>
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading || !resetToken">
              <span *ngIf="!isLoading">Réinitialiser le mot de passe</span>
              <span *ngIf="isLoading">Réinitialisation...</span>
            </button>

            <div class="login-footer">
              <p><a href="javascript:void(0)" (click)="backToLogin()">Retour à la connexion</a></p>
            </div>
          </form>

          <form *ngIf="!showRegister && currentView === 'login' && loginStep === 'otp'" (ngSubmit)="onVerifyOtp()" class="login-form">
            <div *ngIf="errorMessage" class="alert alert-error">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ errorMessage }}
            </div>

            <div class="form-group">
              <label for="otp">Code de vérification</label>
              <input
                type="text"
                id="otp"
                [(ngModel)]="otpCode"
                name="otp"
                placeholder="123456"
                inputmode="numeric"
                autocomplete="one-time-code"
                required>
              <small class="help-text">{{ otpHint }}</small>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
              <span *ngIf="!isLoading">Vérifier</span>
              <span *ngIf="isLoading">Vérification...</span>
            </button>

            <div class="login-footer">
              <p>
                <a href="javascript:void(0)" (click)="restartLogin()">Revenir</a>
              </p>
            </div>
          </form>

          <form *ngIf="showRegister" (ngSubmit)="onRegister()" class="login-form">
            <div *ngIf="errorMessage" class="alert alert-error">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ errorMessage }}
            </div>

            <div class="form-group">
              <label for="firstName">Prénom</label>
              <input
                type="text"
                id="firstName"
                [(ngModel)]="registerData.firstName"
                name="firstName"
                placeholder="Jean"
                required>
            </div>

            <div class="form-group">
              <label for="lastName">Nom</label>
              <input
                type="text"
                id="lastName"
                [(ngModel)]="registerData.lastName"
                name="lastName"
                placeholder="Dupont"
                required>
            </div>

            <div class="form-group">
              <label for="registerEmail">Email</label>
              <input
                type="email"
                id="registerEmail"
                [(ngModel)]="registerData.email"
                name="registerEmail"
                placeholder="jean.dupont@email.com"
                required>
            </div>

            <div class="form-group">
              <label for="registerPassword">Mot de passe</label>
              <div class="field-input-row password-row">
                <input
                  [type]="showRegisterPassword ? 'text' : 'password'"
                  id="registerPassword"
                  [(ngModel)]="registerData.password"
                  name="registerPassword"
                  placeholder="........"
                  required>
                <button type="button" class="password-toggle" (click)="showRegisterPassword = !showRegisterPassword" [attr.aria-label]="showRegisterPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" [title]="showRegisterPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                  <svg *ngIf="!showRegisterPassword" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"></path>
                    <circle cx="12" cy="12" r="3.2"></circle>
                  </svg>
                  <svg *ngIf="showRegisterPassword" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18"></path>
                    <path d="M10.6 10.7a2.9 2.9 0 0 0 4 4"></path>
                    <path d="M9.9 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-4 4.8"></path>
                    <path d="M6.6 6.7C3.8 8.5 2 12 2 12a17.8 17.8 0 0 0 6.2 5.4"></path>
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
              <span *ngIf="!isLoading">Créer mon compte</span>
              <span *ngIf="isLoading">Création...</span>
            </button>

            <div class="login-footer">
              <p>Déjà un compte ?
                <a href="javascript:void(0)" (click)="showRegister = false; resetMessages(); setView('login')">Se connecter</a>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ── Page & background ── */
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f0c29;
      background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .bg-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.35;
      animation: float 8s ease-in-out infinite;
    }
    .blob-1 { width: 400px; height: 400px; background: #4F46E5; top: -100px; left: -100px; animation-delay: 0s; }
    .blob-2 { width: 300px; height: 300px; background: #7C3AED; bottom: -80px; right: -60px; animation-delay: 3s; }
    .blob-3 { width: 250px; height: 250px; background: #2563EB; top: 40%; left: 60%; animation-delay: 5s; }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(20px, -20px) scale(1.05); }
    }

    /* ── Card ── */
    .login-container { width: 100%; max-width: 420px; position: relative; z-index: 1; }

    .login-card {
      background: rgba(255, 255, 255, 0.07);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      padding: 44px 40px;
      box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
    }

    /* ── Header ── */
    .login-header { text-align: center; margin-bottom: 36px; }

    .logo-wrap { display: flex; justify-content: center; margin-bottom: 20px; }

    .logo-ring {
      width: 72px; height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 8px rgba(79, 70, 229, 0.2), 0 0 32px rgba(79, 70, 229, 0.4);
      animation: pulse-ring 3s ease-in-out infinite;
    }

    @keyframes pulse-ring {
      0%, 100% { box-shadow: 0 0 0 8px rgba(79,70,229,0.2), 0 0 32px rgba(79,70,229,0.4); }
      50% { box-shadow: 0 0 0 14px rgba(79,70,229,0.1), 0 0 48px rgba(79,70,229,0.6); }
    }

    .login-header h1 {
      font-size: 26px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: white;
      letter-spacing: -0.3px;
    }

    .login-subtitle {
      font-size: 13px;
      color: rgba(255,255,255,0.5);
      margin: 0;
      letter-spacing: 0.3px;
    }

    /* ── Form ── */
    .login-form { display: flex; flex-direction: column; gap: 18px; }

    /* ── Alerts ── */
    .alert {
      display: flex;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
    }
    .alert-error  { background: rgba(239,68,68,0.15);  color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
    .alert-success{ background: rgba(16,185,129,0.15); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); flex-direction: column; }
    .alert-info   { background: rgba(59,130,246,0.15); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }

    /* ── Labels ── */
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: rgba(255,255,255,0.6);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    /* ── Inputs ── */
    .field-input-row { display: flex; align-items: center; gap: 8px; width: 100%; }
    .field-input-row > .input-with-icon,
    .field-input-row > input { flex: 1 1 auto; min-width: 0; }

    .input-with-icon { position: relative; width: 100%; }
    .input-with-icon input { width: 100%; padding-right: 48px; }

    input[type="email"],
    input[type="password"],
    input[type="text"],
    input[type="number"] {
      background: rgba(255,255,255,0.08) !important;
      border: 1px solid rgba(255,255,255,0.12) !important;
      color: white !important;
      border-radius: 12px !important;
      padding: 13px 16px !important;
      font-size: 14px !important;
      transition: all 0.25s !important;
    }
    input::placeholder { color: rgba(255,255,255,0.3) !important; }
    input:focus {
      outline: none !important;
      border-color: #4F46E5 !important;
      background: rgba(79,70,229,0.1) !important;
      box-shadow: 0 0 0 3px rgba(79,70,229,0.25) !important;
    }
    input:disabled { opacity: 0.4 !important; cursor: not-allowed !important; }
    input.input-invalid { border-color: rgba(239,68,68,0.7) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.15) !important; }

    .input-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; }
    .svg-icon svg { width: 18px; height: 18px; display: block; stroke: #4F46E5; stroke-width: 1.8; fill: none; stroke-linecap: round; stroke-linejoin: round; }

    .field-error-marker { flex: 0 0 auto; width: 18px; text-align: center; font-size: 20px; font-weight: 800; color: #f87171; }

    /* ── Password toggle ── */
    .password-toggle {
      border: none; background: transparent; color: #4F46E5;
      border-radius: 999px; min-width: 34px; height: 34px;
      padding: 0; cursor: pointer; white-space: nowrap; transition: color 0.2s;
    }
    .inside-input { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); z-index: 1; }
    .password-toggle svg { width: 18px; height: 18px; display: block; stroke: currentColor; stroke-width: 1.8; fill: none; stroke-linecap: round; stroke-linejoin: round; margin: 0 auto; }
    .password-toggle:hover { color: #4338CA; }
    .password-toggle:disabled { cursor: not-allowed; opacity: 0.4; }

    /* ── Help / lockout ── */
    .help-text { display: block; margin-top: 6px; color: rgba(255,255,255,0.4); font-size: 12px; }
    .lockout-help { color: #fbbf24; font-weight: 600; }

    /* ── Forgot button ── */
    .link-button {
      background: none; border: none; padding: 0;
      color: rgba(255,255,255,0.5); font-weight: 500;
      font-size: 13px; cursor: pointer; transition: color 0.2s;
    }
    .link-button:hover { color: white; }
    .align-right { align-self: center; margin-top: -6px; }
    .link-button:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Primary button ── */
    .btn-block { width: 100%; justify-content: center; }

    .btn-primary {
      background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%) !important;
      color: white !important;
      border: none !important;
      border-radius: 12px !important;
      padding: 14px 20px !important;
      font-size: 15px !important;
      font-weight: 600 !important;
      letter-spacing: 0.2px !important;
      box-shadow: 0 8px 24px rgba(79,70,229,0.4) !important;
      transition: all 0.25s !important;
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px) !important;
      box-shadow: 0 12px 32px rgba(79,70,229,0.55) !important;
    }
    .btn-primary:disabled { opacity: 0.5 !important; cursor: not-allowed !important; transform: none !important; }

    /* ── Divider ── */
    .divider-or { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.25); font-size: 12px; }
    .divider-or::before, .divider-or::after { content: ''; flex: 1; border-top: 1px solid rgba(255,255,255,0.1); }

    /* ── Fingerprint button ── */
    .btn-fingerprint {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      background: rgba(255,255,255,0.05);
      border: 1.5px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.7);
      font-weight: 500;
      padding: 13px 20px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.25s;
      font-size: 14px;
    }
    .btn-fingerprint:hover:not(:disabled) {
      border-color: #4F46E5;
      color: white;
      background: rgba(79,70,229,0.15);
      box-shadow: 0 0 20px rgba(79,70,229,0.2);
    }
    .btn-fingerprint:disabled { opacity: 0.35; cursor: not-allowed; }
    .btn-fingerprint svg { flex-shrink: 0; }

    /* ── Footer ── */
    .login-footer { text-align: center; padding-top: 4px; }
    .login-footer p { color: rgba(255,255,255,0.4); font-size: 13px; margin: 0; }
    .login-footer a { color: #818CF8; font-weight: 600; text-decoration: none; }
    .login-footer a:hover { color: white; text-decoration: underline; }

    .dev-link a { color: inherit; font-weight: 600; text-decoration: underline; }

    /* ── Mobile ── */
    @media (max-width: 480px) {
      .login-card { padding: 28px 24px; border-radius: 20px; }
      .login-header h1 { font-size: 22px; }
      .logo-ring { width: 60px; height: 60px; }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  credentials = {
    email: '',
    password: ''
  };

  registerData = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  forgotPasswordData = {
    email: ''
  };

  resetPasswordData = {
    password: '',
    confirmPassword: ''
  };

  showRegister = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  infoMessage = '';
  devResetUrl = '';
  errorField: 'email' | 'password' | null = null;
  currentView: AuthView = 'login';
  resetToken = '';
  showLoginPassword = false;
  showRegisterPassword = false;
  showResetPassword = false;
  showResetConfirmPassword = false;
  blockedUntilTimestamp: number | null = null;
  lockoutCountdownLabel = '';
  private lockoutTimerId: ReturnType<typeof setInterval> | null = null;

  loginStep: 'credentials' | 'otp' = 'credentials';
  riskToken = '';
  otpCode = '';
  otpHint = 'Saisissez le code reçu pour finaliser la connexion.';
  isFingerprintSupported = typeof PublicKeyCredential !== 'undefined';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const mode = params.get('mode');
      const token = params.get('token') || '';

      this.resetToken = token;

      if (mode === 'reset' && token) {
        this.showRegister = false;
        this.currentView = 'reset';
        this.resetMessages();
        return;
      }

      if (this.authService.isAuthenticated()) {
        const user = this.authService.getCurrentUser();
        if (user?.role !== 'candidate') {
          this.router.navigate(['/rh']);
        }
        // Candidates don't use this login page — stay here or go home
        return;
      }

      if (!this.showRegister) {
        this.currentView = 'login';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.lockoutTimerId) {
      clearInterval(this.lockoutTimerId);
    }
  }

  getTitle(): string {
    if (this.showRegister) return 'Créer un compte Admin RH';
    if (this.currentView === 'forgot') return 'Mot de passe oublié';
    if (this.currentView === 'reset') return 'Choisir un nouveau mot de passe';
    if (this.loginStep === 'otp') return 'Vérification';
    return 'Authentification';
  }

  resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.infoMessage = '';
    this.devResetUrl = '';
    this.errorField = null;
  }

  setView(view: AuthView): void {
    this.currentView = view;
    this.loginStep = 'credentials';
    this.riskToken = '';
    this.otpCode = '';
    this.resetMessages();
  }

  onLogin(): void {
    if (this.isAccountTemporarilyLocked()) {
      this.errorMessage = `Compte temporairement bloqué. Réessayez dans ${this.lockoutCountdownLabel}.`;
      return;
    }

    this.isLoading = true;
    this.resetMessages();

    this.authService.login(this.credentials).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        if (response && response.riskToken) {
          this.loginStep = 'otp';
          this.riskToken = response.riskToken;
          this.otpCode = response.devOtp || '';
          const delivery = response.delivery;
          if (delivery === 'email') {
            this.otpHint = 'Un code a été envoyé par email. Saisissez-le pour finaliser la connexion.';
          } else if (delivery === 'dev') {
            this.otpHint = 'Mode démo : saisissez le code fourni.';
          } else {
            this.otpHint = 'Si aucun email n arrive, vérifiez la configuration SMTP ou utilisez le mode dev.';
          }
          return;
        }

        if (response.user.role === 'candidate') {
          // Candidates don't use this login — block and inform
          this.authService.logout();
          this.isLoading = false;
          this.errorMessage = 'Cette connexion est réservée à l\'équipe RH. Les candidats accèdent via le formulaire de candidature sur la page d\'accueil.';
          return;
        }
        this.router.navigate(['/rh']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorField = null;
        const code = error?.error?.code;
        const message = error?.error?.message;

        if (code === 'EMAIL_INCORRECT') {
          this.errorMessage = 'Email ou mot de passe incorrect';
          this.errorField = 'email';
          return;
        }
        if (code === 'PASSWORD_INCORRECT') {
          this.errorMessage = 'Email ou mot de passe incorrect';
          this.errorField = 'password';
          return;
        }
        if (code === 'ACCOUNT_LOCKED') {
          this.errorMessage = message || 'Compte temporairement bloqué. Réessayez plus tard.';
          this.startLockoutTimer(error?.error?.retryAfterSeconds);
          return;
        }
        if (code === 'RATE_LIMITED') {
          this.errorMessage = message || 'Trop de tentatives. Réessayez plus tard.';
          return;
        }

        if (code === 'RISK_CHALLENGE_REQUIRED') {
          this.errorMessage = 'Vérification supplémentaire requise.';
          return;
        }

        this.errorMessage = message || 'Email ou mot de passe incorrect';
      }
    });
  }

  onForgotPassword(): void {
    if (!this.forgotPasswordData.email) {
      this.errorMessage = 'Veuillez saisir votre email.';
      return;
    }

    this.isLoading = true;
    this.resetMessages();

    this.authService.forgotPassword(this.forgotPasswordData.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.';
        this.devResetUrl = response.resetUrl || '';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Impossible d envoyer le lien de réinitialisation.';
      }
    });
  }

  onResetPassword(): void {
    if (!this.resetToken) {
      this.errorMessage = 'Le lien de réinitialisation est invalide.';
      return;
    }

    if (!this.resetPasswordData.password || !this.resetPasswordData.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs.';
      return;
    }

    if (this.resetPasswordData.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    if (this.resetPasswordData.password !== this.resetPasswordData.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.isLoading = true;
    this.resetMessages();

    this.authService.resetPassword(this.resetToken, this.resetPasswordData.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.resetPasswordData.password = '';
        this.resetPasswordData.confirmPassword = '';
        this.successMessage = 'Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter.';
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
        this.currentView = 'login';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error?.error?.message || 'Le lien de réinitialisation est invalide ou expiré.';
      }
    });
  }

  onVerifyOtp(): void {
    if (!this.riskToken || !this.otpCode) {
      this.errorMessage = 'Veuillez saisir le code de vérification.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyRisk(this.riskToken, this.otpCode).subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.user.role === 'candidate') {
          this.authService.logout();
          this.isLoading = false;
          this.errorMessage = 'Cette connexion est réservée à l\'équipe RH. Les candidats accèdent via le formulaire de candidature sur la page d\'accueil.';
          return;
        }
        this.router.navigate(['/rh']);
      },
      error: (error) => {
        this.isLoading = false;
        const code = error?.error?.code;
        const message = error?.error?.message;

        if (code === 'RISK_OTP_INVALID') {
          this.errorMessage = message || 'Code invalide.';
          return;
        }
        if (code === 'RISK_CHALLENGE_EXPIRED') {
          this.errorMessage = message || 'Code expiré. Veuillez vous reconnecter.';
          this.restartLogin();
          return;
        }
        if (code === 'RISK_CONTEXT_CHANGED' || code === 'RISK_TOKEN_INVALID' || code === 'RISK_CHALLENGE_INVALID') {
          this.errorMessage = message || 'Session invalide. Veuillez vous reconnecter.';
          this.restartLogin();
          return;
        }
        if (code === 'RISK_OTP_TOO_MANY_ATTEMPTS') {
          this.errorMessage = message || 'Trop de tentatives. Veuillez vous reconnecter.';
          this.restartLogin();
          return;
        }
        if (code === 'RATE_LIMITED') {
          this.errorMessage = message || 'Trop de tentatives. Réessayez plus tard.';
          return;
        }

        this.errorMessage = message || 'Erreur lors de la vérification.';
      }
    });
  }

  onFingerprintLogin(): void {
    if (!this.credentials.email) {
      this.errorMessage = 'Veuillez saisir votre email.';
      return;
    }

    this.isLoading = true;
    this.resetMessages();

    this.authService.loginWithFingerprint(this.credentials.email.trim().toLowerCase())
      .then(() => {
        this.isLoading = false;
        const user = this.authService.getCurrentUser();
        if (user?.role === 'candidate') {
          this.authService.logout();
          this.errorMessage = 'Cette connexion est réservée à l\'équipe RH.';
          return;
        }
        this.router.navigate(['/rh']);
      })
      .catch(err => {
        this.isLoading = false;
        const code = err?.error?.code;
        if (code === 'NO_CREDENTIAL') {
          this.errorMessage = 'Aucune empreinte configurée pour ce compte. Connectez-vous avec email/mot de passe.';
        } else if (err?.name === 'NotAllowedError') {
          this.errorMessage = 'Authentification par empreinte annulée ou refusée.';
        } else {
          this.errorMessage = err?.error?.message || err?.message || 'Authentification par empreinte échouée.';
        }
      });
  }

  restartLogin(): void {
    this.loginStep = 'credentials';
    this.riskToken = '';
    this.otpCode = '';
    this.otpHint = 'Saisissez le code reçu pour finaliser la connexion.';
    this.currentView = 'login';
  }

  onRegister(): void {
    if (!this.registerData.firstName || !this.registerData.lastName ||
        !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(
      this.registerData.email,
      this.registerData.password,
      this.registerData.firstName,
      this.registerData.lastName,
      'rh'
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/rh']);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors de la création du compte';
      }
    });
  }

  openForgotPassword(): void {
    this.showRegister = false;
    this.forgotPasswordData.email = this.credentials.email || '';
    this.setView('forgot');
  }

  backToLogin(): void {
    this.showRegister = false;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
    this.setView('login');
  }

  goToRegister(): void {
    this.showRegister = true;
    this.resetMessages();
  }

  isAccountTemporarilyLocked(): boolean {
    return !!(this.blockedUntilTimestamp && this.blockedUntilTimestamp > Date.now());
  }

  private startLockoutTimer(retryAfterSeconds?: number): void {
    const seconds = Math.max(1, Number(retryAfterSeconds || 300));
    this.blockedUntilTimestamp = Date.now() + seconds * 1000;
    this.updateLockoutState();

    if (this.lockoutTimerId) {
      clearInterval(this.lockoutTimerId);
    }

    this.infoMessage = 'Le formulaire est temporairement désactivé pour protéger le compte.';
    this.lockoutTimerId = setInterval(() => this.updateLockoutState(), 1000);
  }

  private updateLockoutState(): void {
    if (!this.blockedUntilTimestamp) {
      this.lockoutCountdownLabel = '';
      return;
    }

    const remainingMs = this.blockedUntilTimestamp - Date.now();
    if (remainingMs <= 0) {
      this.blockedUntilTimestamp = null;
      this.lockoutCountdownLabel = '';
      this.infoMessage = '';
      if (this.lockoutTimerId) {
        clearInterval(this.lockoutTimerId);
        this.lockoutTimerId = null;
      }
      return;
    }

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    this.lockoutCountdownLabel = minutes > 0
      ? `${minutes} min ${seconds.toString().padStart(2, '0')} s`
      : `${seconds} s`;
  }
}
