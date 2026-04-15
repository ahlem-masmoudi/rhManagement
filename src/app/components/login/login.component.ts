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
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="logo-large">
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#4F46E5"/>
                <path d="M12 10h8v2h-8v-2zm0 5h8v2h-8v-2zm0 5h5v2h-5v-2z" fill="white"/>
              </svg>
            </div>
            <h1>{{ getTitle() }}</h1>
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
              <div class="field-input-row input-with-icon">
                <input
                  type="email"
                  id="email"
                  [(ngModel)]="credentials.email"
                  name="email"
                  placeholder="exemple@email.com"
                  required
                  autocomplete="email"
                  [disabled]="isAccountTemporarilyLocked()">
                <span class="input-icon svg-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 7h16v10H4z"></path>
                    <path d="m4 8 8 6 8-6"></path>
                  </svg>
                </span>
                <span class="field-error-emoji-inline-right" *ngIf="errorField === 'email'">!</span>
              </div>
            </div>

            <div class="form-group">
              <label for="password">Mot de passe</label>
              <div class="field-input-row input-with-icon">
                <input
                  [type]="showLoginPassword ? 'text' : 'password'"
                  id="password"
                  [(ngModel)]="credentials.password"
                  name="password"
                  placeholder="........"
                  required
                  autocomplete="current-password"
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
                <span class="field-error-emoji-inline-right" *ngIf="errorField === 'password'">!</span>
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

            <div class="login-footer">
              <p>Pas encore de compte ?
                <a href="javascript:void(0)" (click)="goToRegister()">Créer un compte candidat</a>
              </p>
            </div>
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
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-container {
      width: 100%;
      max-width: 450px;
    }

    .login-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo-large {
      display: inline-block;
      margin-bottom: 16px;
    }

    .login-header h1 {
      font-size: 28px;
      margin: 0 0 8px 0;
      color: var(--gray-900);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .alert {
      display: flex;
      gap: 12px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      font-size: 14px;
      line-height: 1.5;
    }

    .alert-error {
      background: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FCA5A5;
    }

    .alert-success {
      background: #DCFCE7;
      color: #166534;
      border: 1px solid #86EFAC;
      flex-direction: column;
    }

    .alert-info {
      background: #DBEAFE;
      color: #1D4ED8;
      border: 1px solid #93C5FD;
    }

    .field-error-emoji-inline-right {
      margin-left: 8px;
      font-size: 16px;
      vertical-align: middle;
      display: inline-block;
      font-weight: 700;
      color: #991B1B;
    }

    .field-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .field-input-row input {
      flex: 1 1 auto;
      min-width: 0;
    }

    .input-with-icon {
      position: relative;
      align-items: stretch;
      width: 100%;
    }

    .input-with-icon input {
      width: 100%;
      padding-right: 52px;
    }

    .input-icon {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      line-height: 1;
    }

    .svg-icon svg {
      width: 20px;
      height: 20px;
      display: block;
      stroke: #4338CA;
      stroke-width: 1.8;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .password-toggle {
      border: none;
      background: transparent;
      color: #4338CA;
      border-radius: 999px;
      min-width: 36px;
      height: 36px;
      padding: 0;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .inside-input {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 1;
    }

    .password-toggle svg {
      width: 20px;
      height: 20px;
      display: block;
      stroke: currentColor;
      stroke-width: 1.8;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      margin: 0 auto;
    }

    .password-toggle:hover {
      background: rgba(79, 70, 229, 0.1);
    }

    .password-toggle:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    .help-text {
      display: block;
      margin-top: 8px;
      color: var(--gray-600);
      font-size: 12px;
    }

    .lockout-help {
      color: #B45309;
      font-weight: 600;
    }

    .btn-block {
      width: 100%;
      justify-content: center;
    }

    .link-button {
      background: none;
      border: none;
      padding: 0;
      color: var(--primary-color);
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
    }

    .align-right {
      align-self: center;
      margin-top: -8px;
    }

    .dev-link a {
      color: inherit;
      font-weight: 600;
      text-decoration: underline;
    }

    .login-footer {
      text-align: center;
      padding-top: 8px;
    }

    .login-footer p {
      color: var(--gray-600);
      font-size: 14px;
      margin: 0;
    }

    .login-footer a {
      color: var(--primary-color);
      font-weight: 600;
      text-decoration: none;
    }

    .login-footer a:hover,
    .link-button:hover {
      text-decoration: underline;
    }

    .link-button:disabled,
    .btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 24px;
      }

      .password-toggle {
        min-width: 36px;
      }
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
        if (user?.role === 'candidate') {
          this.router.navigate(['/candidate']);
        } else {
          this.router.navigate(['/rh']);
        }
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
    if (this.showRegister) return 'Créer un compte candidat';
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
          if (!response.user.profileComplete) {
            this.router.navigate(['/candidate/complete-profile']);
          } else {
            this.router.navigate(['/candidate']);
          }
        } else {
          this.router.navigate(['/rh']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorField = null;
        const code = error?.error?.code;
        const message = error?.error?.message;

        if (code === 'EMAIL_INCORRECT') {
          this.errorMessage = 'Email incorrect';
          this.errorField = 'email';
          return;
        }
        if (code === 'PASSWORD_INCORRECT') {
          this.errorMessage = 'Mot de passe incorrect';
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
          if (!response.user.profileComplete) {
            this.router.navigate(['/candidate/complete-profile']);
          } else {
            this.router.navigate(['/candidate']);
          }
        } else {
          this.router.navigate(['/rh']);
        }
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
      this.registerData.lastName
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/candidate/complete-profile']);
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
    this.router.navigate(['/candidate/complete-profile']);
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
