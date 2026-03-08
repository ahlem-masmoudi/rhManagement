import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="register-page">
      <div class="register-container">
        <div class="register-card">
          <div class="back-link">
            <button class="btn-back" (click)="goBack()">
              ← Retour à l'accueil
            </button>
          </div>

          <div class="register-header">
            <img src="assets/logo-unilog.png" alt="Unilog" class="logo">
            <h1>Créer un compte candidat</h1>
            <p>Rejoignez notre plateforme de stages</p>
          </div>

          <form (ngSubmit)="onRegister()" class="register-form">
            <div *ngIf="errorMessage" class="alert alert-error">
              {{ errorMessage }}
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Prénom *</label>
                <input 
                  type="text" 
                  [(ngModel)]="registerData.firstName" 
                  name="firstName"
                  placeholder="Votre prénom"
                  required>
              </div>

              <div class="form-group">
                <label>Nom *</label>
                <input 
                  type="text" 
                  [(ngModel)]="registerData.lastName" 
                  name="lastName"
                  placeholder="Votre nom"
                  required>
              </div>
            </div>

            <div class="form-group">
              <label>Email *</label>
              <input 
                type="email" 
                [(ngModel)]="registerData.email" 
                name="email"
                placeholder="votre.email@example.com"
                required>
            </div>

            <div class="form-group">
              <label>Mot de passe *</label>
              <input 
                type="password" 
                [(ngModel)]="registerData.password" 
                name="password"
                placeholder="••••••••"
                required>
            </div>

            <div class="form-group">
              <label>Confirmer le mot de passe *</label>
              <input 
                type="password" 
                [(ngModel)]="confirmPassword" 
                name="confirmPassword"
                placeholder="••••••••"
                required>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              S'inscrire
            </button>

            <div class="login-link">
              <p>Vous avez déjà un compte ? 
                <a (click)="goToLogin()" style="cursor: pointer">Se connecter</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
      padding: 2rem;
    }

    .register-container {
      width: 100%;
      max-width: 500px;
    }

    .register-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 20px 50px rgba(0,0,0,0.2);
    }

    .back-link {
      margin-bottom: 1.5rem;
    }

    .btn-back {
      background: none;
      border: none;
      color: #6b7280;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0;
      transition: color 0.3s;
    }

    .btn-back:hover {
      color: #0ea5e9;
    }

    .register-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      height: 60px;
      width: 60px;
      object-fit: contain;
      margin-bottom: 1rem;
    }

    .register-header h1 {
      font-size: 1.875rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      color: #1f2937;
    }

    .register-header p {
      color: #6b7280;
      margin: 0;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      font-size: 0.875rem;
    }

    .form-group input {
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-group input:focus {
      outline: none;
      border-color: #0ea5e9;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
    }

    .alert-error {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .btn {
      padding: 0.875rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.3s;
      font-size: 1rem;
    }

    .btn-primary {
      background: #0ea5e9;
      color: white;
    }

    .btn-primary:hover {
      background: #0284c7;
    }

    .btn-block {
      width: 100%;
    }

    .login-link {
      text-align: center;
      margin-top: 0.5rem;
    }

    .login-link p {
      color: #6b7280;
      font-size: 0.875rem;
      margin: 0;
    }

    .login-link a {
      color: #0ea5e9;
      text-decoration: none;
      font-weight: 600;
    }

    .login-link a:hover {
      text-decoration: underline;
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RegisterComponent {
  registerData = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };
  confirmPassword = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onRegister(): void {
    this.errorMessage = '';

    // Validation
    if (!this.registerData.firstName || !this.registerData.lastName || 
        !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (this.registerData.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    // Register
    this.authService.register(
      this.registerData.email,
      this.registerData.password,
      this.registerData.firstName,
      this.registerData.lastName
    ).subscribe({
      next: (response) => {
        // Redirect to complete profile
        this.router.navigate(['/candidate/complete-profile']);
      },
      error: (error) => {
        this.errorMessage = 'Cette adresse email est déjà utilisée';
      }
    });
  }
}
