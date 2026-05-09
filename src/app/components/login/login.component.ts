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
    <div class="auth-page">

      <!-- ══ LEFT PANEL ══ -->
      <div class="auth-left">
        <!-- Animated orbs -->
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>

        <!-- Floating particles -->
        <div class="particle p1"></div>
        <div class="particle p2"></div>
        <div class="particle p3"></div>
        <div class="particle p4"></div>
        <div class="particle p5"></div>
        <div class="particle p6"></div>

        <!-- Grid overlay -->
        <div class="grid-overlay"></div>

        <!-- Brand -->
        <div class="brand-wrap">
          <div class="brand-icon">
            <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="14" fill="rgba(255,255,255,0.12)"/>
              <path d="M24 12a7 7 0 0 1 7 7v2h2.5A2.5 2.5 0 0 1 36 23.5v11A2.5 2.5 0 0 1 33.5 37h-19A2.5 2.5 0 0 1 12 34.5v-11A2.5 2.5 0 0 1 14.5 21H17v-2a7 7 0 0 1 7-7zm0 3a4 4 0 0 0-4 4v2h8v-2a4 4 0 0 0-4-4zm0 9a3 3 0 0 1 1.5 5.6V32h-3v-2.4A3 3 0 0 1 24 24z" fill="white"/>
            </svg>
          </div>
          <div class="brand-text">
            <h1 class="brand-name">INET<span class="brand-dot">.</span></h1>
            <p class="brand-tagline">Gestion des Ressources Humaines</p>
          </div>
          <div class="brand-divider"></div>
          <p class="brand-desc">
            Plateforme sécurisée de gestion des candidatures et des stages universitaires.
          </p>

          <!-- Feature pills -->
          <div class="feature-pills">
            <div class="pill">
              <span class="pill-icon">🎓</span>
              <span>Gestion des stages</span>
            </div>
            <div class="pill">
              <span class="pill-icon">📋</span>
              <span>Suivi des candidatures</span>
            </div>
            <div class="pill">
              <span class="pill-icon">🔒</span>
              <span>Espace sécurisé</span>
            </div>
          </div>
        </div>

        <!-- Bottom wave -->
        <svg class="left-wave" viewBox="0 0 200 40" preserveAspectRatio="none">
          <path d="M0 20 Q50 0 100 20 Q150 40 200 20 L200 40 L0 40 Z" fill="rgba(255,255,255,0.04)"/>
          <path d="M0 28 Q50 12 100 28 Q150 44 200 28 L200 40 L0 40 Z" fill="rgba(255,255,255,0.04)"/>
        </svg>
      </div>

      <!-- ══ RIGHT PANEL ══ -->
      <div class="auth-right">
        <!-- Back to home -->
        <a class="back-home" (click)="goHome()" href="javascript:void(0)">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Accueil
        </a>

        <div class="form-wrap">

          <!-- Form header -->
          <div class="form-header">
            <div class="form-icon-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 class="form-title">{{ getTitle() }}</h2>
            <p class="form-subtitle" *ngIf="currentView === 'login' && !showRegister && loginStep === 'credentials'">
              Connectez-vous à votre espace RH
            </p>
          </div>

          <!-- ── Login form ── -->
          <form *ngIf="!showRegister && currentView === 'login' && loginStep === 'credentials'" (ngSubmit)="onLogin()" class="login-form">
            <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>
            <div *ngIf="infoMessage" class="alert alert-info">{{ infoMessage }}</div>
            <div *ngIf="errorMessage" class="alert alert-error">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ errorMessage }}
            </div>

            <div class="form-group">
              <label for="email">Adresse email</label>
              <div class="field-input-row">
                <div class="input-with-icon">
                  <span class="input-prefix-icon">
                    <svg viewBox="0 0 24 24"><rect x="4" y="6.5" width="16" height="11" rx="2"/><path d="M5.5 8 12 13l6.5-5"/></svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    [(ngModel)]="credentials.email"
                    name="email"
                    placeholder="exemple@inet.tn"
                    required
                    autocomplete="email"
                    [class.input-invalid]="errorField === 'email'"
                    [disabled]="isAccountTemporarilyLocked()">
                </div>
                <span class="field-error-marker" *ngIf="errorField === 'email'">!</span>
              </div>
            </div>

            <div class="form-group">
              <div class="label-row">
                <label for="password">Mot de passe</label>
                <button type="button" class="link-button" (click)="openForgotPassword()" [disabled]="isAccountTemporarilyLocked()">
                  Mot de passe oublié ?
                </button>
              </div>
              <div class="field-input-row">
                <div class="input-with-icon has-toggle">
                  <span class="input-prefix-icon">
                    <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <input
                    [type]="showLoginPassword ? 'text' : 'password'"
                    id="password"
                    [(ngModel)]="credentials.password"
                    name="password"
                    placeholder="••••••••"
                    required
                    autocomplete="current-password"
                    [class.input-invalid]="errorField === 'password'"
                    [disabled]="isAccountTemporarilyLocked()">
                  <button type="button" class="password-toggle inside-input"
                    (click)="showLoginPassword = !showLoginPassword"
                    [attr.aria-label]="showLoginPassword ? 'Masquer' : 'Afficher'">
                    <svg *ngIf="!showLoginPassword" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3.2"/></svg>
                    <svg *ngIf="showLoginPassword" viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 10.7a2.9 2.9 0 0 0 4 4"/><path d="M9.9 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-4 4.8"/><path d="M6.6 6.7C3.8 8.5 2 12 2 12a17.8 17.8 0 0 0 6.2 5.4"/></svg>
                  </button>
                </div>
                <span class="field-error-marker" *ngIf="errorField === 'password'">!</span>
              </div>
              <small class="lockout-help" *ngIf="lockoutCountdownLabel">Nouveau test dans {{ lockoutCountdownLabel }}</small>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading || isAccountTemporarilyLocked()">
              <span class="btn-spinner" *ngIf="isLoading"></span>
              <span>{{ isLoading ? 'Connexion...' : 'Se connecter' }}</span>
            </button>

            <div *ngIf="isFingerprintSupported" class="divider-or"><span>ou</span></div>

            <button *ngIf="isFingerprintSupported" type="button" class="btn btn-biometric btn-block"
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
              Empreinte digitale
            </button>
          </form>

          <!-- ── Forgot password ── -->
          <form *ngIf="!showRegister && currentView === 'forgot'" (ngSubmit)="onForgotPassword()" class="login-form">
            <div *ngIf="successMessage" class="alert alert-success">
              {{ successMessage }}
              <span *ngIf="devResetUrl" class="dev-link"><a [href]="devResetUrl">Ouvrir le lien</a></span>
            </div>
            <div *ngIf="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
            <div class="form-group">
              <label for="forgotEmail">Votre email</label>
              <div class="input-with-icon">
                <span class="input-prefix-icon">
                  <svg viewBox="0 0 24 24"><rect x="4" y="6.5" width="16" height="11" rx="2"/><path d="M5.5 8 12 13l6.5-5"/></svg>
                </span>
                <input type="email" id="forgotEmail" [(ngModel)]="forgotPasswordData.email" name="forgotEmail"
                  placeholder="exemple@inet.tn" required autocomplete="email">
              </div>
              <small class="help-text">Un lien de réinitialisation vous sera envoyé.</small>
            </div>
            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
              <span class="btn-spinner" *ngIf="isLoading"></span>
              <span>{{ isLoading ? 'Envoi...' : 'Envoyer le lien' }}</span>
            </button>
            <div class="login-footer"><p><a href="javascript:void(0)" (click)="backToLogin()">← Retour à la connexion</a></p></div>
          </form>

          <!-- ── Reset password ── -->
          <form *ngIf="!showRegister && currentView === 'reset'" (ngSubmit)="onResetPassword()" class="login-form">
            <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>
            <div *ngIf="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
            <div class="form-group">
              <label for="newPassword">Nouveau mot de passe</label>
              <div class="field-input-row password-row">
                <div class="input-with-icon has-toggle">
                  <span class="input-prefix-icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                  <input [type]="showResetPassword ? 'text' : 'password'" id="newPassword" [(ngModel)]="resetPasswordData.password"
                    name="newPassword" placeholder="Minimum 6 caractères" required autocomplete="new-password">
                  <button type="button" class="password-toggle inside-input" (click)="showResetPassword = !showResetPassword">
                    <svg *ngIf="!showResetPassword" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3.2"/></svg>
                    <svg *ngIf="showResetPassword" viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 10.7a2.9 2.9 0 0 0 4 4"/><path d="M9.9 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-4 4.8"/><path d="M6.6 6.7C3.8 8.5 2 12 2 12a17.8 17.8 0 0 0 6.2 5.4"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirmer le mot de passe</label>
              <div class="field-input-row password-row">
                <div class="input-with-icon has-toggle">
                  <span class="input-prefix-icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                  <input [type]="showResetConfirmPassword ? 'text' : 'password'" id="confirmPassword" [(ngModel)]="resetPasswordData.confirmPassword"
                    name="confirmPassword" placeholder="Retapez le mot de passe" required autocomplete="new-password">
                  <button type="button" class="password-toggle inside-input" (click)="showResetConfirmPassword = !showResetConfirmPassword">
                    <svg *ngIf="!showResetConfirmPassword" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3.2"/></svg>
                    <svg *ngIf="showResetConfirmPassword" viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 10.7a2.9 2.9 0 0 0 4 4"/><path d="M9.9 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-4 4.8"/><path d="M6.6 6.7C3.8 8.5 2 12 2 12a17.8 17.8 0 0 0 6.2 5.4"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading || !resetToken">
              <span class="btn-spinner" *ngIf="isLoading"></span>
              <span>{{ isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe' }}</span>
            </button>
            <div class="login-footer"><p><a href="javascript:void(0)" (click)="backToLogin()">← Retour à la connexion</a></p></div>
          </form>

          <!-- ── OTP step ── -->
          <form *ngIf="!showRegister && currentView === 'login' && loginStep === 'otp'" (ngSubmit)="onVerifyOtp()" class="login-form">
            <div *ngIf="errorMessage" class="alert alert-error">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ errorMessage }}
            </div>
            <div class="form-group">
              <label for="otp">Code de vérification</label>
              <div class="input-with-icon">
                <span class="input-prefix-icon">
                  <svg viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4"/><path d="M9 21H5a2 2 0 0 1-2-2v-4"/><path d="M15 3h4a2 2 0 0 1 2 2v4"/><path d="M15 21h4a2 2 0 0 0 2-2v-4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </span>
                <input type="text" id="otp" [(ngModel)]="otpCode" name="otp"
                  placeholder="123456" inputmode="numeric" autocomplete="one-time-code" required>
              </div>
              <small class="help-text">{{ otpHint }}</small>
            </div>
            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
              <span class="btn-spinner" *ngIf="isLoading"></span>
              <span>{{ isLoading ? 'Vérification...' : 'Vérifier' }}</span>
            </button>
            <div class="login-footer"><p><a href="javascript:void(0)" (click)="restartLogin()">← Revenir</a></p></div>
          </form>

          <!-- ── Register ── -->
          <form *ngIf="showRegister" (ngSubmit)="onRegister()" class="login-form">
            <div *ngIf="errorMessage" class="alert alert-error">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ errorMessage }}
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label for="firstName">Prénom</label>
                <input type="text" id="firstName" [(ngModel)]="registerData.firstName" name="firstName" placeholder="Jean" required>
              </div>
              <div class="form-group">
                <label for="lastName">Nom</label>
                <input type="text" id="lastName" [(ngModel)]="registerData.lastName" name="lastName" placeholder="Dupont" required>
              </div>
            </div>
            <div class="form-group">
              <label for="registerEmail">Email</label>
              <div class="input-with-icon">
                <span class="input-prefix-icon"><svg viewBox="0 0 24 24"><rect x="4" y="6.5" width="16" height="11" rx="2"/><path d="M5.5 8 12 13l6.5-5"/></svg></span>
                <input type="email" id="registerEmail" [(ngModel)]="registerData.email" name="registerEmail" placeholder="jean.dupont@email.com" required>
              </div>
            </div>
            <div class="form-group">
              <label for="registerPassword">Mot de passe</label>
              <div class="input-with-icon has-toggle">
                <span class="input-prefix-icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input [type]="showRegisterPassword ? 'text' : 'password'" id="registerPassword" [(ngModel)]="registerData.password"
                  name="registerPassword" placeholder="••••••••" required>
                <button type="button" class="password-toggle inside-input" (click)="showRegisterPassword = !showRegisterPassword">
                  <svg *ngIf="!showRegisterPassword" viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3.2"/></svg>
                  <svg *ngIf="showRegisterPassword" viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 10.7a2.9 2.9 0 0 0 4 4"/><path d="M9.9 5.2A12 12 0 0 1 12 5c6.5 0 10 7 10 7a17.3 17.3 0 0 1-4 4.8"/><path d="M6.6 6.7C3.8 8.5 2 12 2 12a17.8 17.8 0 0 0 6.2 5.4"/></svg>
                </button>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
              <span class="btn-spinner" *ngIf="isLoading"></span>
              <span>{{ isLoading ? 'Création...' : 'Créer mon compte' }}</span>
            </button>
            <div class="login-footer">
              <p>Déjà un compte ? <a href="javascript:void(0)" (click)="showRegister = false; resetMessages(); setView('login')">Se connecter</a></p>
            </div>
          </form>

        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ══════════════════════════════════════════
       ROOT LAYOUT
    ══════════════════════════════════════════ */
    :host { display: block; }

    .auth-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    /* ══════════════════════════════════════════
       LEFT PANEL
    ══════════════════════════════════════════ */
    .auth-left {
      position: relative;
      overflow: hidden;
      background: linear-gradient(145deg, #130e3a 0%, #1e1660 35%, #2b2080 70%, #120d3a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 60px 56px;
    }

    /* Animated orbs */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      pointer-events: none;
    }
    .orb-1 {
      width: 420px; height: 420px;
      background: radial-gradient(circle, rgba(107,94,197,0.45) 0%, transparent 70%);
      top: -120px; left: -100px;
      animation: drift1 12s ease-in-out infinite;
    }
    .orb-2 {
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(155,149,224,0.3) 0%, transparent 70%);
      bottom: -80px; right: -60px;
      animation: drift2 15s ease-in-out infinite;
    }
    .orb-3 {
      width: 260px; height: 260px;
      background: radial-gradient(circle, rgba(155,149,224,0.35) 0%, transparent 70%);
      top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      animation: drift3 10s ease-in-out infinite;
    }

    @keyframes drift1 {
      0%,100% { transform: translate(0,0); }
      50% { transform: translate(40px, 30px); }
    }
    @keyframes drift2 {
      0%,100% { transform: translate(0,0); }
      50% { transform: translate(-30px,-40px); }
    }
    @keyframes drift3 {
      0%,100% { transform: translate(-50%,-50%) scale(1); }
      50% { transform: translate(-50%,-50%) scale(1.2); }
    }

    /* Floating particles */
    .particle {
      position: absolute;
      border-radius: 50%;
      animation: floatUp linear infinite;
      pointer-events: none;
    }
    .p1 { width: 6px; height: 6px; background: rgba(107,94,197,0.6); left: 15%; bottom: -10px; animation-duration: 8s; animation-delay: 0s; }
    .p2 { width: 4px; height: 4px; background: rgba(155,149,224,0.5); left: 30%; bottom: -10px; animation-duration: 11s; animation-delay: 2s; }
    .p3 { width: 8px; height: 8px; background: rgba(155,149,224,0.4); left: 50%; bottom: -10px; animation-duration: 9s; animation-delay: 4s; }
    .p4 { width: 5px; height: 5px; background: rgba(107,94,197,0.5); left: 65%; bottom: -10px; animation-duration: 13s; animation-delay: 1s; }
    .p5 { width: 7px; height: 7px; background: rgba(155,149,224,0.6); left: 80%; bottom: -10px; animation-duration: 7s; animation-delay: 3s; }
    .p6 { width: 4px; height: 4px; background: rgba(255,255,255,0.3); left: 92%; bottom: -10px; animation-duration: 10s; animation-delay: 5s; }

    @keyframes floatUp {
      0% { transform: translateY(0) rotate(0deg); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 0.5; }
      100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
    }

    /* Grid overlay */
    .grid-overlay {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
    }

    /* Brand content */
    .brand-wrap {
      position: relative; z-index: 2;
      display: flex; flex-direction: column; align-items: flex-start; gap: 0;
      animation: slideInLeft 0.8s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-40px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .brand-icon {
      width: 80px; height: 80px;
      background: linear-gradient(135deg, rgba(107,94,197,0.3), rgba(155,149,224,0.2));
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 22px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 28px;
      box-shadow: 0 0 40px rgba(107,94,197,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
      animation: iconPulse 3s ease-in-out infinite;
    }
    @keyframes iconPulse {
      0%,100% { box-shadow: 0 0 40px rgba(107,94,197,0.3), inset 0 1px 0 rgba(255,255,255,0.1); }
      50% { box-shadow: 0 0 60px rgba(107,94,197,0.5), 0 0 100px rgba(155,149,224,0.15), inset 0 1px 0 rgba(255,255,255,0.1); }
    }

    .brand-text { margin-bottom: 20px; }
    .brand-name {
      font-size: 52px; font-weight: 900;
      color: white; letter-spacing: -2px; margin: 0; line-height: 1;
      text-shadow: 0 0 60px rgba(107,94,197,0.4);
    }
    .brand-dot { color: #9B95E0; }
    .brand-tagline {
      font-size: 14px; color: rgba(255,255,255,0.5);
      letter-spacing: 2px; text-transform: uppercase;
      margin: 8px 0 0 2px; font-weight: 500;
    }

    .brand-divider {
      width: 48px; height: 3px;
      background: linear-gradient(90deg, #7B6FD0, #9B95E0);
      border-radius: 2px;
      margin: 20px 0;
    }

    .brand-desc {
      font-size: 15px; color: rgba(255,255,255,0.55); line-height: 1.7;
      margin: 0 0 32px 0; max-width: 320px;
    }

    /* Feature pills */
    .feature-pills { display: flex; flex-direction: column; gap: 12px; }
    .pill {
      display: flex; align-items: center; gap: 12px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 12px 16px;
      color: rgba(255,255,255,0.75);
      font-size: 14px; font-weight: 500;
      backdrop-filter: blur(8px);
      transition: all 0.3s;
      animation: fadeSlideIn 0.6s ease both;
    }
    .pill:nth-child(1) { animation-delay: 0.3s; }
    .pill:nth-child(2) { animation-delay: 0.45s; }
    .pill:nth-child(3) { animation-delay: 0.6s; }
    .pill:hover { background: rgba(255,255,255,0.09); border-color: rgba(107,94,197,0.3); color: white; transform: translateX(4px); }
    .pill-icon { font-size: 18px; }

    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* Wave bottom */
    .left-wave {
      position: absolute; bottom: 0; left: 0; right: 0;
      width: 100%; height: 40px; pointer-events: none;
    }

    /* ══════════════════════════════════════════
       RIGHT PANEL
    ══════════════════════════════════════════ */
    .auth-right {
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 48px 40px;
      position: relative;
      overflow: hidden;
    }

    .auth-right::before {
      content: '';
      position: absolute; inset: 0;
      background-image: radial-gradient(circle at 20% 80%, rgba(107,94,197,0.05) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(107,94,197,0.04) 0%, transparent 50%);
      pointer-events: none;
    }

    .back-home {
      position: absolute; top: 24px; left: 24px;
      display: flex; align-items: center; gap: 6px;
      color: #6b7280; font-size: 13px; font-weight: 500;
      text-decoration: none; transition: all 0.2s;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 7px 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .back-home:hover { color: #6B5EC5; border-color: #d4d0f5; }

    .form-wrap {
      width: 100%; max-width: 400px; position: relative; z-index: 1;
      animation: slideInRight 0.7s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(30px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* Form header */
    .form-header { margin-bottom: 32px; }

    .form-icon-badge {
      width: 52px; height: 52px;
      background: linear-gradient(135deg, #2b2080 0%, #1e1660 100%);
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 8px 24px rgba(43,32,128,0.4);
      color: white;
    }

    .form-title {
      font-size: 28px; font-weight: 800;
      color: #111827; letter-spacing: -0.5px;
      margin: 0 0 6px 0;
    }
    .form-subtitle { font-size: 14px; color: #6b7280; margin: 0; }

    /* ── Form ── */
    .login-form { display: flex; flex-direction: column; gap: 20px; }

    /* ── Alerts ── */
    .alert {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 12px 14px; border-radius: 10px; font-size: 13px; line-height: 1.5;
    }
    .alert-error  { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
    .alert-success{ background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; flex-direction: column; }
    .alert-info   { background: #f5f3ff; color: #5b21b6; border: 1px solid #ddd6fe; }

    /* ── Labels ── */
    label {
      display: block; font-size: 13px; font-weight: 600;
      color: #374151; margin-bottom: 6px;
    }
    .label-row {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 6px;
    }
    .label-row label { margin-bottom: 0; }

    /* ── Inputs ── */
    .form-group { display: flex; flex-direction: column; }

    .field-input-row { display: flex; align-items: center; gap: 8px; }
    .field-input-row > .input-with-icon { flex: 1; }

    .input-with-icon { position: relative; }
    .input-with-icon input { padding-left: 44px !important; }
    .input-with-icon.has-toggle input { padding-right: 44px !important; }

    .input-prefix-icon {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      pointer-events: none; width: 18px; height: 18px;
    }
    .input-prefix-icon svg {
      width: 18px; height: 18px; stroke: #9ca3af; fill: none;
      stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
    }

    input[type="email"],
    input[type="password"],
    input[type="text"],
    input[type="number"] {
      width: 100%;
      background: white !important;
      border: 1.5px solid #e5e7eb !important;
      color: #111827 !important;
      border-radius: 11px !important;
      padding: 13px 16px !important;
      font-size: 14px !important;
      transition: all 0.2s !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;
    }
    input::placeholder { color: #9ca3af !important; }
    input:focus {
      outline: none !important;
      border-color: #6B5EC5 !important;
      box-shadow: 0 0 0 3px rgba(107,94,197,0.15) !important;
    }
    input:disabled { opacity: 0.45 !important; cursor: not-allowed !important; }
    input.input-invalid { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }

    .field-error-marker {
      flex-shrink: 0; width: 22px; height: 22px;
      background: #ef4444; color: white;
      border-radius: 50%; font-size: 12px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }

    /* ── Password toggle ── */
    .password-toggle {
      border: none; background: transparent; cursor: pointer;
      color: #9ca3af; padding: 0; transition: color 0.2s;
    }
    .inside-input {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%); z-index: 1;
    }
    .password-toggle svg {
      width: 18px; height: 18px; display: block;
      stroke: currentColor; fill: none; stroke-width: 1.8;
      stroke-linecap: round; stroke-linejoin: round;
    }
    .password-toggle:hover { color: #6B5EC5; }
    .password-toggle:disabled { cursor: not-allowed; opacity: 0.4; }

    /* ── Help text ── */
    .help-text { margin-top: 6px; color: #9ca3af; font-size: 12px; }
    .lockout-help { margin-top: 6px; color: #d97706; font-size: 12px; font-weight: 600; }

    /* ── Forgot link ── */
    .link-button {
      background: none; border: none; padding: 0;
      color: #6B5EC5; font-size: 12px; font-weight: 600; cursor: pointer;
      transition: color 0.2s;
    }
    .link-button:hover { color: #4A40A0; text-decoration: underline; }
    .link-button:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Buttons ── */
    .btn-block { width: 100%; }

    .btn-primary {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: linear-gradient(135deg, #2b2080 0%, #1e1660 100%) !important;
      color: white !important; border: none !important;
      border-radius: 11px !important; padding: 14px 20px !important;
      font-size: 15px !important; font-weight: 700 !important;
      letter-spacing: 0.1px !important;
      box-shadow: 0 6px 20px rgba(43,32,128,0.45), 0 2px 6px rgba(43,32,128,0.3) !important;
      transition: all 0.25s !important; cursor: pointer;
      position: relative; overflow: hidden;
    }
    .btn-primary::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
      pointer-events: none;
    }
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px) !important;
      box-shadow: 0 10px 28px rgba(43,32,128,0.55), 0 4px 10px rgba(43,32,128,0.4) !important;
    }
    .btn-primary:active:not(:disabled) { transform: translateY(0) !important; }
    .btn-primary:disabled { opacity: 0.55 !important; cursor: not-allowed !important; transform: none !important; }

    /* Spinner */
    .btn-spinner {
      width: 16px; height: 16px; flex-shrink: 0;
      border: 2.5px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Biometric */
    .btn-biometric {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      background: white;
      border: 1.5px solid #e5e7eb !important;
      color: #374151;
      font-size: 14px; font-weight: 500;
      padding: 13px 20px; border-radius: 11px;
      cursor: pointer; transition: all 0.25s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .btn-biometric:hover:not(:disabled) {
      border-color: #6B5EC5 !important;
      color: #6B5EC5;
      box-shadow: 0 4px 12px rgba(107,94,197,0.12);
    }
    .btn-biometric:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Divider ── */
    .divider-or {
      display: flex; align-items: center; gap: 12px;
      color: #d1d5db; font-size: 12px; font-weight: 500;
    }
    .divider-or::before, .divider-or::after { content: ''; flex: 1; border-top: 1px solid #e5e7eb; }

    /* ── Register 2-col ── */
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    /* ── Footer ── */
    .login-footer { text-align: center; }
    .login-footer p { color: #6b7280; font-size: 13px; margin: 0; }
    .login-footer a { color: #6B5EC5; font-weight: 600; text-decoration: none; }
    .login-footer a:hover { color: #4A40A0; text-decoration: underline; }
    .dev-link a { color: inherit; font-weight: 600; text-decoration: underline; }

    /* ══════════════════════════════════════════
       RESPONSIVE
    ══════════════════════════════════════════ */
    @media (max-width: 900px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-left { display: none; }
      .auth-right { min-height: 100vh; background: #f8fafc; }
    }

    @media (max-width: 480px) {
      .auth-right { padding: 48px 20px 32px; }
      .form-row-2 { grid-template-columns: 1fr; }
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

  goHome(): void {
    this.router.navigate(['/']);
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
