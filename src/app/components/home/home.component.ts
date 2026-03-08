import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-page">
      <!-- Navigation Header -->
      <header class="navbar">
        <div class="container">
          <div class="nav-brand">
            <img src="assets/logo-unilog.png" alt="Unilog" class="logo">
            <span class="brand-name">Unilog</span>
          </div>
          
          <nav class="nav-menu">
            <a href="#accueil" class="nav-link active">Accueil</a>
            <a href="#secteurs" class="nav-link">Secteurs</a>
            <a href="#solutions" class="nav-link">Solutions</a>
            <a href="#contact" class="nav-link">Contact</a>
          </nav>

          <div class="nav-actions">
            <button class="btn btn-outline" (click)="showLoginModal()">
              Connexion
            </button>
            <button class="btn btn-primary" (click)="goToRegister()">
              S'inscrire
            </button>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero" id="accueil">
        <div class="container">
          <div class="hero-content">
            <h1 class="hero-title">
              Avec L'ERP Uniges, 
              <span class="highlight">centralisez</span> vos processus
            </h1>
            <p class="hero-subtitle">
              Nous vous accompagnons dans vos projets de mise en place d'un ERP pour 
              structurer et simplifier vos processus de gestion à l'aide de l'ERP Uniges, 
              connecté à vos outils préférés.
            </p>
            <button class="btn btn-large btn-primary" (click)="goToRegister()">
              Commencez maintenant (sans engagement)
            </button>
          </div>
          <div class="hero-image">
            <div class="video-placeholder">
              <div class="play-button">▶</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Secteurs Section -->
      <section class="secteurs" id="secteurs">
        <div class="container">
          <h2 class="section-title">Nos Secteurs</h2>
          <div class="secteurs-grid">
            <div class="secteur-card">
              <div class="secteur-icon">💊</div>
              <h3>Pharmaceutique Et Cosmétique</h3>
            </div>
            <div class="secteur-card">
              <div class="secteur-icon">⚙️</div>
              <h3>Mécanique</h3>
            </div>
            <div class="secteur-card">
              <div class="secteur-icon">🌾</div>
              <h3>Agroalimentaire</h3>
            </div>
            <div class="secteur-card">
              <div class="secteur-icon">🏪</div>
              <h3>Distribution Et Commerce</h3>
            </div>
            <div class="secteur-card">
              <div class="secteur-icon">🏗️</div>
              <h3>Bâtiment Et Travaux Publics</h3>
            </div>
            <div class="secteur-card">
              <div class="secteur-icon">🍰</div>
              <h3>Pâtisserie</h3>
            </div>
            <div class="secteur-card">
              <div class="secteur-icon">🔧</div>
              <h3>Services</h3>
            </div>
            <div class="secteur-card">
              <div class="secteur-icon">📊</div>
              <h3>Expertise Et Comptabilité</h3>
            </div>
          </div>
        </div>
      </section>

      <!-- Solutions Section -->
      <section class="solutions" id="solutions">
        <div class="container">
          <h2 class="section-title">Nos Solutions</h2>
          <div class="solutions-grid">
            <div class="solution-card">
              <h3>Gestion de Production</h3>
              <p>Optimisez vos processus de fabrication</p>
            </div>
            <div class="solution-card">
              <h3>Gestion Commerciale</h3>
              <p>Pilotez vos ventes et achats</p>
            </div>
            <div class="solution-card">
              <h3>Gestion des Stocks</h3>
              <p>Maîtrisez votre inventaire</p>
            </div>
            <div class="solution-card">
              <h3>Comptabilité</h3>
              <p>Gérez vos finances efficacement</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact Section -->
      <section class="contact" id="contact">
        <div class="container">
          <h2 class="section-title">Contactez-nous</h2>
          <div class="contact-info">
            <p>📧 contact&#64;unilog.tn</p>
            <p>📞 +216 XX XXX XXX</p>
            <p>📍 Sfax, Tunisie</p>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="container">
          <p>&copy; 2026 Unilog - Univers du logiciel. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .home-page {
      min-height: 100vh;
      background: white;
    }

    /* Navbar */
    .navbar {
      background: white;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 1rem 0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo {
      height: 40px;
      width: 40px;
      object-fit: contain;
    }

    .brand-name {
      font-size: 24px;
      font-weight: 700;
      color: #0ea5e9;
    }

    .nav-menu {
      display: flex;
      gap: 2rem;
      flex: 1;
      justify-content: center;
    }

    .nav-link {
      color: #1f2937;
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 0;
      border-bottom: 2px solid transparent;
      transition: all 0.3s;
    }

    .nav-link:hover,
    .nav-link.active {
      color: #0ea5e9;
      border-bottom-color: #0ea5e9;
    }

    .nav-actions {
      display: flex;
      gap: 1rem;
    }

    /* Hero Section */
    .hero {
      padding: 5rem 0;
      background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
      color: white;
    }

    .hero .container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 800;
      margin: 0 0 1.5rem 0;
      line-height: 1.2;
    }

    .highlight {
      color: #fbbf24;
    }

    .hero-subtitle {
      font-size: 1.125rem;
      line-height: 1.7;
      margin-bottom: 2rem;
      opacity: 0.95;
    }

    .video-placeholder {
      background: white;
      border-radius: 16px;
      aspect-ratio: 16/9;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.2);
    }

    .play-button {
      width: 80px;
      height: 80px;
      background: #0ea5e9;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      color: white;
      cursor: pointer;
      transition: transform 0.3s;
    }

    .play-button:hover {
      transform: scale(1.1);
    }

    /* Sections */
    .secteurs, .solutions, .contact {
      padding: 5rem 0;
    }

    .secteurs {
      background: #f9fafb;
    }

    .section-title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 3rem;
      color: #1f2937;
    }

    .secteurs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .secteur-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      transition: transform 0.3s, box-shadow 0.3s;
      cursor: pointer;
    }

    .secteur-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    }

    .secteur-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .secteur-card h3 {
      font-size: 1.125rem;
      color: #1f2937;
      margin: 0;
    }

    .solutions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .solution-card {
      background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
      color: white;
      padding: 2.5rem;
      border-radius: 12px;
      transition: transform 0.3s;
    }

    .solution-card:hover {
      transform: translateY(-5px);
    }

    .solution-card h3 {
      font-size: 1.5rem;
      margin: 0 0 1rem 0;
    }

    .solution-card p {
      margin: 0;
      opacity: 0.9;
    }

    /* Contact */
    .contact-info {
      text-align: center;
      font-size: 1.25rem;
    }

    .contact-info p {
      margin: 1rem 0;
    }

    /* Footer */
    .footer {
      background: #1f2937;
      color: white;
      padding: 2rem 0;
      text-align: center;
    }

    /* Buttons */
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.3s;
      font-size: 1rem;
    }

    .btn-outline {
      background: white;
      color: #0ea5e9;
      border: 2px solid #0ea5e9;
    }

    .btn-outline:hover {
      background: #0ea5e9;
      color: white;
    }

    .btn-primary {
      background: #0ea5e9;
      color: white;
    }

    .btn-primary:hover {
      background: #0284c7;
    }

    .btn-large {
      padding: 1rem 2rem;
      font-size: 1.125rem;
    }

    .btn-block {
      width: 100%;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-menu {
        display: none;
      }

      .hero .container {
        grid-template-columns: 1fr;
      }

      .hero-title {
        font-size: 2rem;
      }

      .secteurs-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent {
  constructor(private router: Router) {}

  showLoginModal(): void {
    // Redirect directly to login page for RH
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    // Redirect to candidate profile completion page directly
    this.router.navigate(['/candidate/complete-profile']);
  }
}
