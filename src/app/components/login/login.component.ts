import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
            <h1>Authentification</h1>
          </div>

          <!-- Login Form -->
          <form *ngIf="!showRegister && loginStep === 'credentials'" (ngSubmit)="onLogin()" class="login-form">
            <div *ngIf="errorMessage" class="alert alert-error">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              {{ errorMessage }}
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <div class="field-input-row">
                <input 
                  type="email" 
                  id="email" 
                  [(ngModel)]="credentials.email" 
                  name="email"
                  placeholder="exemple@email.com"
                  required
                  autocomplete="email">
                <span class="field-error-emoji-inline-right" *ngIf="errorField === 'email'">⚠️</span>
              </div>
            </div>

            <div class="form-group">
              <label for="password">Mot de passe</label>
              <div class="field-input-row">
                <input 
                  type="password" 
                  id="password" 
                  [(ngModel)]="credentials.password" 
                  name="password"
                  placeholder="••••••••"
                  required
                  autocomplete="current-password">
                <span class="field-error-emoji-inline-right" *ngIf="errorField === 'password'">⚠️</span>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
              <span *ngIf="!isLoading">Se connecter</span>
              <span *ngIf="isLoading">Connexion...</span>
            </button>

            <div class="login-footer">
              <p>Pas encore de compte ? 
                <a href="javascript:void(0)" (click)="goToRegister()">Créer un compte candidat</a>
              </p>
            </div>
          </form>

          <!-- Risk Step-up (OTP) -->
          <form *ngIf="!showRegister && loginStep === 'otp'" (ngSubmit)="onVerifyOtp()" class="login-form">
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
              <small class="help-text">Vérification supplémentaire requise. {{ otpHint }}</small>
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

          <!-- Register Form -->
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
              <input 
                type="password" 
                id="registerPassword" 
                [(ngModel)]="registerData.password" 
                name="registerPassword"
                placeholder="••••••••"
                required>
            </div>

            <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
              <span *ngIf="!isLoading">Créer mon compte</span>
              <span *ngIf="isLoading">Création...</span>
            </button>

            <div class="login-footer">
              <p>Déjà un compte ? 
                <a href="javascript:void(0)" (click)="showRegister = false; errorMessage = ''">Se connecter</a>
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

    .login-header p {
      color: var(--gray-500);
      margin: 0;
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
    }

    .alert-error {
      background: #FEE2E2;
      color: #991B1B;
      border: 1px solid #FCA5A5;
    }

    .field-error-emoji-inline-right {
      margin-left: 8px;
      font-size: 16px;
      vertical-align: middle;
      display: inline-block;
    }

    .field-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .field-input-row input {
      flex: 1 1 auto;
      min-width: 0;
    }

    .help-text {
      display: block;
      margin-top: 8px;
      color: var(--gray-600);
      font-size: 12px;
    }

    .btn-block {
      width: 100%;
      justify-content: center;
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

    .login-footer a:hover {
      text-decoration: underline;
    }

    .demo-credentials {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--gray-200);
    }

    .demo-credentials p {
      text-align: center;
      margin-bottom: 12px;
    }

    .demo-grid {
      display: grid;
      gap: 8px;
    }

    .demo-grid .btn {
      text-align: left;
      justify-content: flex-start;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 24px;
      }
    }
  `]
})
export class LoginComponent {
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

  showRegister = false;
  isLoading = false;
  errorMessage = '';
  errorField: 'email' | 'password' | null = null;

  loginStep: 'credentials' | 'otp' = 'credentials';
  riskToken = '';
  otpCode = '';
  otpHint = 'Saisissez le code reçu pour finaliser la connexion.';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user?.role === 'candidate') {
        this.router.navigate(['/candidate']);
      } else {
        this.router.navigate(['/rh']);
      }
    }
  }

  onLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.errorField = null;

    this.authService.login(this.credentials).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        // Risk-based step-up required
        if (response && response.riskToken) {
          this.loginStep = 'otp';
          this.riskToken = response.riskToken;
          this.otpCode = response.devOtp || '';
          const delivery = response.delivery;
          if (delivery === 'email') {
            this.otpHint = 'Un code a été envoyé par email. Saisissez-le pour finaliser la connexion.';
          } else if (delivery === 'dev') {
            this.otpHint = 'Mode démo : saisissez le code fourni (dev).';
          } else {
            this.otpHint = 'Si aucun email n\'arrive, récupérez le code depuis la console du backend (mode dev) ou configurez le SMTP.';
          }
          return;
        }
        
        // Redirect based on role
        if (response.user.role === 'candidate') {
          // Check if profile is complete
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
          return;
        }
        if (code === 'RATE_LIMITED') {
          this.errorMessage = message || 'Trop de tentatives. Réessayez plus tard.';
          return;
        }

        if (code === 'RISK_CHALLENGE_REQUIRED') {
          // Should normally be a 202 success, but keep a safe fallback
          this.errorMessage = 'Vérification supplémentaire requise.';
          return;
        }

        // Fallback
        this.errorMessage = message || 'Email ou mot de passe incorrect';
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
      next: (response) => {
        this.isLoading = false;
        // Redirect to profile completion
        this.router.navigate(['/candidate/complete-profile']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors de la création du compte';
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/candidate/complete-profile']);
  }
}
