import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface DeptOffer {
  _id: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  type: string;
  positions?: number;
}

interface Department {
  name: string;
  icon: string;
  offers: DeptOffer[];
  expanded: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-page">
      <!-- Animated Background -->
      <div class="animated-bg">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>

      <!-- Navigation Header -->
      <header class="navbar">
        <div class="container">
          <div class="nav-brand">
            <img src="assets/logo-inet.png" alt="I.NET" class="logo logo-animate">
            <span class="brand-name">I.NET</span>
          </div>
          <div class="nav-actions">
            <button class="btn btn-outline btn-animated" type="button" (click)="showLoginModal()">
              <span>Connexion</span>
              <i class="arrow">→</i>
            </button>
            <div class="cta-with-copy">
              <button class="btn btn-primary btn-animated" type="button" (click)="goToRegister($event)">
                <span>Commencez</span>
                <i class="arrow">→</i>
              </button>
              <p class="micro-copy">Complétez votre profil pour recevoir des offres adaptées.</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Secondary Nav (UNILOG style) -->
      <nav class="secondary-nav">
        <div class="container secondary-nav-container">
          <ul class="snav-list">
            <li class="snav-item">
              <a class="snav-link" (click)="scrollToSection('accueil')">Bienvenu</a>
            </li>
            <li class="snav-item has-dropdown"
                (mouseenter)="showDeptDropdown = true"
                (mouseleave)="showDeptDropdown = false"
                (click)="showDeptDropdown = !showDeptDropdown">
              <a class="snav-link">
                Nos Départements
                <svg class="snav-chevron" [class.open]="showDeptDropdown"
                     width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </a>
              <div class="dept-dropdown" [class.visible]="showDeptDropdown">
                <ul class="dept-dropdown-list">
                  <li *ngFor="let dept of departments"
                      class="dept-dropdown-item"
                      (click)="openDeptModal(dept)">
                    <span class="dept-dropdown-icon">{{ dept.icon }}</span>
                    <span class="dept-dropdown-name">{{ dept.name }}</span>
                    <span class="dept-dropdown-count" [class.empty]="dept.offers.length === 0">
                      {{ dept.offers.length }} offre{{ dept.offers.length !== 1 ? 's' : '' }}
                    </span>
                  </li>
                </ul>
              </div>
            </li>
            <li class="snav-item">
              <a class="snav-link" (click)="scrollToSection('contact')">Contact</a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero" id="accueil">
        <div class="container hero-container">
          <div class="hero-content fade-in-up">
            <h1 class="hero-title gradient-text">
              Rejoignez l'équipe I.NET — Trouvez le stage qui correspond à votre profil
            </h1>
            <p class="hero-subtitle">
              Déposez votre candidature en quelques minutes et découvrez les offres adaptées à vos compétences
            </p>
            <button class="btn btn-large btn-primary btn-pulse" type="button" (click)="goToRegister($event)">
              <span>Postuler maintenant</span>
              <i class="sparkle">📝</i>
            </button>
          </div>
          <div class="hero-image fade-in-up">
            <img src="assets/hero-image.png" alt="Candidat I.NET" class="hero-img">
          </div>
        </div>
      </section>

      <!-- Pourquoi nous rejoindre -->
      <section class="why-join">
        <div class="container">
          <h2 class="section-title-sm slide-in">Pourquoi nous rejoindre ?</h2>
          <div class="benefits-row">
            <div class="benefit-card-sm card-hover">
              <div class="benefit-icon-sm rotate-on-hover">🎯</div>
              <h3>Offres adaptées à votre profil</h3>
              <p>Des opportunités de stage sélectionnées selon vos compétences et aspirations</p>
            </div>
            <div class="benefit-card-sm card-hover">
              <div class="benefit-icon-sm rotate-on-hover">💡</div>
              <h3>Scoring intelligent</h3>
              <p>Un algorithme de matching pour vous proposer les meilleures offres</p>
            </div>
            <div class="benefit-card-sm card-hover">
              <div class="benefit-icon-sm rotate-on-hover">📄</div>
              <h3>Suivi en temps réel</h3>
              <p>Suivez l'évolution de vos candidatures directement depuis votre espace</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Comment ça marche -->
      <section class="how-it-works">
        <div class="container">
          <h2 class="section-title-sm slide-in">Comment ça marche ?</h2>
          <div class="steps-row">
            <div class="step-mini step-animate">
              <div class="step-number-sm pulse">①</div>
              <h3>Remplissez le formulaire</h3>
              <p>Complétez votre profil en quelques minutes</p>
            </div>
            <div class="step-arrow-h bounce">→</div>
            <div class="step-mini step-animate">
              <div class="step-number-sm pulse">②</div>
              <h3>Recevez les offres compatibles</h3>
              <p>Notre système vous propose les meilleures opportunités</p>
            </div>
            <div class="step-arrow-h bounce">→</div>
            <div class="step-mini step-animate">
              <div class="step-number-sm pulse">③</div>
              <h3>Postulez en un clic</h3>
              <p>Candidatez directement aux offres qui vous intéressent</p>
            </div>
            <div class="step-arrow-h bounce">→</div>
            <div class="step-mini step-animate">
              <div class="step-number-sm pulse">④</div>
              <h3>Suivez votre candidature</h3>
              <p>Recevez des notifications par email à chaque étape</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer" id="contact">
        <div class="container footer-container">
          <div class="footer-content">
            <div class="footer-section">
              <h4>🏢 I.NET</h4>
              <p>Plateforme de gestion des stages</p>
            </div>
            <div class="footer-section">
              <h4>Contact</h4>
              <p>📍 Sfax, Tunisie</p>
              <p>📧 contact&#64;inet.tn</p>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2026 I.NET. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>

    <!-- Department Offers Modal -->
    <div class="modal-overlay" [class.active]="showModal" (click)="closeDeptModal()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title-row">
            <span class="modal-dept-icon">{{ selectedDept?.icon }}</span>
            <h2 class="modal-title">{{ selectedDept?.name }}</h2>
          </div>
          <button class="modal-close" (click)="closeDeptModal()">✕</button>
        </div>
        <div class="modal-body">
          <div *ngIf="selectedDept && selectedDept.offers.length === 0" class="modal-empty">
            <div class="modal-empty-icon">📭</div>
            <p>Aucune offre active pour ce département pour le moment.</p>
            <p class="modal-empty-sub">Revenez bientôt !</p>
          </div>
          <div *ngIf="selectedDept && selectedDept.offers.length > 0" class="modal-offers-grid">
            <div *ngFor="let offer of selectedDept.offers; let i = index"
                 class="modal-offer-card"
                 [style.animation-delay]="(i * 0.07) + 's'">
              <div class="moc-header">
                <h3 class="moc-title">{{ offer.title }}</h3>
                <span class="moc-type" [attr.data-type]="offer.type">{{ offer.type }}</span>
              </div>
              <div class="moc-meta">
                <span *ngIf="offer.location">📍 {{ offer.location }}</span>
                <span *ngIf="offer.duration">🕐 {{ offer.duration }}</span>
                <span *ngIf="offer.positions">👥 {{ offer.positions }} place{{ offer.positions > 1 ? 's' : '' }}</span>
              </div>
              <p class="moc-desc" [class.expanded]="expandedOffers.has(offer._id)">{{ offer.description }}</p>
              <button class="moc-toggle" (click)="toggleOfferDesc(offer._id)">
                {{ expandedOffers.has(offer._id) ? 'Voir moins ▲' : 'Voir plus ▼' }}
              </button>
              <button class="moc-btn" (click)="goToRegister()">Postuler →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cta-with-copy { display: inline-block; text-align: center; position: relative; }
    .micro-copy { margin: 0; font-size: 0.875rem; color: #6b7280; opacity: 0; transform: translateY(-4px) translateX(-50%); transition: opacity 160ms ease, transform 160ms ease; visibility: hidden; pointer-events: none; position: absolute; left: 50%; top: calc(100% + 8px); width: max-content; max-width: 320px; white-space: nowrap; padding: 4px 8px; background: transparent; }
    .cta-with-copy:hover .micro-copy, .cta-with-copy:focus-within .micro-copy { opacity: 1; transform: translateY(0) translateX(-50%); visibility: visible; pointer-events: auto; }
    @media (max-width: 640px) { .micro-copy { position: static; opacity: 1; visibility: visible; transform: none; margin-top: 8px; max-width: 100%; padding: 0; } }

    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }

    .home-page { min-height: 100vh; background: #f8f9fa; font-family: 'Poppins', sans-serif; position: relative; overflow-x: hidden; }
    .animated-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; overflow: hidden; }
    .circle { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(0,160,220,0.1) 0%, transparent 70%); animation: float 20s infinite ease-in-out; }
    .circle-1 { width: 500px; height: 500px; top: -200px; left: -200px; animation-delay: 0s; }
    .circle-2 { width: 400px; height: 400px; top: 50%; right: -150px; animation-delay: 5s; }
    .circle-3 { width: 600px; height: 600px; bottom: -300px; left: 30%; animation-delay: 10s; }
    @keyframes float { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,-50px) scale(1.1)} 66%{transform:translate(-50px,50px) scale(0.9)} }

    /* ── Main Navbar ── */
    .navbar { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); padding: 1rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 200; border-bottom: 1px solid rgba(0,160,220,0.1); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; position: relative; z-index: 1; }
    .navbar .container { display: flex; justify-content: space-between; align-items: center; }
    .nav-brand { display: flex; align-items: center; gap: 1rem; }
    .logo { height: 90px; width: 90px; object-fit: contain; transition: all 0.3s ease; }
    .logo-animate:hover { transform: rotate(360deg) scale(1.1); }
    .brand-name { font-size: 3rem; font-weight: 700; color: #00A0DC; font-family: 'Poppins', sans-serif; }
    .nav-actions { display: flex; gap: 1rem; }
    .btn { padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.4s cubic-bezier(0.68,-0.55,0.265,1.55); border: none; position: relative; overflow: hidden; font-family: 'Inter', sans-serif; display: inline-flex; align-items: center; gap: 0.5rem; }
    .btn-animated .arrow { transition: transform 0.3s ease; font-style: normal; }
    .btn-animated:hover .arrow { transform: translateX(5px); }
    .btn-outline { background: white; color: #00A0DC; border: 2px solid #00A0DC; box-shadow: 0 4px 15px rgba(0,160,220,0.2); }
    .btn-outline:hover { background: #00A0DC; color: white; transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,160,220,0.4); }
    .btn-primary { background: linear-gradient(135deg,#00A0DC 0%,#0074BC 100%); color: white; border: 2px solid transparent; box-shadow: 0 4px 15px rgba(0,160,220,0.3); }
    .btn-primary:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 10px 30px rgba(0,160,220,0.5); }
    .btn-large { padding: 1.2rem 2.5rem; font-size: 1.15rem; border-radius: 50px; font-weight: 700; }
    .btn-pulse { animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{box-shadow:0 4px 15px rgba(0,160,220,0.3)} 50%{box-shadow:0 4px 30px rgba(0,160,220,0.6)} }
    .sparkle { font-style: normal; animation: sparkle 1.5s infinite; }
    @keyframes sparkle { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.3) rotate(180deg)} }

    /* ── Secondary Nav ── */
    .secondary-nav { background: #1e2a3a; position: sticky; top: 122px; z-index: 190; box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
    .secondary-nav-container { display: flex; align-items: stretch; padding: 0 2rem; }
    .snav-list { display: flex; list-style: none; margin: 0; padding: 0; gap: 0; }
    .snav-item { position: relative; }
    .snav-link { display: flex; align-items: center; gap: 6px; padding: 0 1.6rem; height: 52px; color: #e2e8f0; font-size: 0.95rem; font-weight: 500; font-family: 'Inter', sans-serif; cursor: pointer; white-space: nowrap; transition: background 0.2s, color 0.2s; user-select: none; letter-spacing: 0.01em; }
    .snav-link:hover, .snav-item.has-dropdown:hover .snav-link { background: rgba(255,255,255,0.1); color: #ffffff; }
    .snav-chevron { transition: transform 0.25s ease; flex-shrink: 0; }
    .snav-chevron.open { transform: rotate(180deg); }
    .dept-dropdown { position: absolute; top: 100%; left: 0; min-width: 320px; background: #1e2a3a; border-top: 3px solid #00A0DC; box-shadow: 0 12px 40px rgba(0,0,0,0.35); border-radius: 0 0 12px 12px; opacity: 0; visibility: hidden; transform: translateY(-8px); transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s; z-index: 300; overflow: hidden; }
    .dept-dropdown.visible { opacity: 1; visibility: visible; transform: translateY(0); }
    .dept-dropdown-list { list-style: none; margin: 0; padding: 8px 0; }
    .dept-dropdown-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; color: #cbd5e1; font-size: 0.92rem; font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.18s, color 0.18s, padding-left 0.18s; border-left: 3px solid transparent; }
    .dept-dropdown-item:hover { background: rgba(0,160,220,0.12); color: #ffffff; border-left-color: #00A0DC; padding-left: 24px; }
    .dept-dropdown-icon { font-size: 1.3rem; flex-shrink: 0; }
    .dept-dropdown-name { flex: 1; font-weight: 500; }
    .dept-dropdown-count { font-size: 0.78rem; font-weight: 700; background: rgba(0,160,220,0.25); color: #7dd3fc; padding: 2px 10px; border-radius: 20px; white-space: nowrap; }
    .dept-dropdown-count.empty { background: rgba(255,255,255,0.08); color: #64748b; }

    /* ── Hero ── */
    .hero { background: linear-gradient(135deg,#00A0DC 0%,#0074BC 100%); color: white; padding: 2rem 0; position: relative; overflow: hidden; min-height: calc(100vh - 120px); display: flex; align-items: center; }
    .hero::before { content:''; position:absolute; inset:0; background: radial-gradient(circle at 20% 50%,rgba(255,255,255,0.1) 0%,transparent 50%), radial-gradient(circle at 80% 80%,rgba(255,255,255,0.1) 0%,transparent 50%); animation: heroShine 10s infinite ease-in-out; }
    @keyframes heroShine { 0%,100%{opacity:0.5} 50%{opacity:1} }
    .hero-container { display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; width: 100%; }
    .hero-content { position:relative; z-index:1; }
    .hero-image { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; background:white; padding:3rem; border-radius:24px; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
    .hero-img { width:100%; max-width:500px; height:auto; animation:floatImage 6s ease-in-out infinite; }
    @keyframes floatImage { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
    .fade-in-up { animation: fadeInUp 1s ease-out; }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
    .hero-title { font-size:2.2rem; margin-bottom:1rem; line-height:1.25; font-weight:800; }
    .gradient-text { background:linear-gradient(to right,#ffffff,#e0f2fe,#ffffff); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:gradientShift 3s ease infinite; }
    @keyframes gradientShift { 0%,100%{background-position:0% center} 50%{background-position:100% center} }
    .hero-subtitle { font-size:1.1rem; margin-bottom:0.8rem; opacity:0.95; line-height:1.6; }

    /* ── Pourquoi nous rejoindre ── */
    .why-join { padding:2.5rem 0; background:white; }
    .section-title-sm { font-size:1.9rem; text-align:center; margin-bottom:1.8rem; color:#1f2937; font-weight:800; position:relative; display:inline-block; width:100%; }
    .section-title-sm::after { content:''; position:absolute; bottom:-8px; left:50%; transform:translateX(-50%); width:60px; height:3px; background:linear-gradient(90deg,#00A0DC,#0074BC); border-radius:2px; }
    .slide-in { animation:slideIn 0.8s ease-out; }
    @keyframes slideIn { from{opacity:0;transform:translateX(-50px)} to{opacity:1;transform:translateX(0)} }
    .benefits-row { display:flex; flex-direction:row; gap:1.25rem; justify-content:center; }
    .benefit-card-sm { flex:1; text-align:center; padding:1.4rem 1.2rem; border-radius:16px; background:linear-gradient(145deg,#ffffff,#f8f9fa); box-shadow:0 6px 18px rgba(0,0,0,0.07); transition:all 0.35s cubic-bezier(0.175,0.885,0.32,1.275); border:2px solid transparent; display:flex; flex-direction:column; align-items:center; gap:0.5rem; }
    .card-hover:hover { transform:translateY(-4px); box-shadow:0 12px 28px rgba(0,160,220,0.18); border-color:#00A0DC; }
    .benefit-icon-sm { font-size:2rem; transition:transform 0.5s ease; display:inline-block; }
    .rotate-on-hover:hover { transform:rotate(360deg) scale(1.2); }
    .benefit-card-sm h3 { font-size:0.95rem; color:#1f2937; font-weight:700; line-height:1.3; margin:0; }
    .benefit-card-sm p { color:#6b7280; font-size:0.82rem; line-height:1.5; margin:0; }
    @media (max-width: 768px) { .benefits-row { flex-direction:column; } }

    /* ── Comment ça marche ── */
    .how-it-works { padding:2.5rem 0; background:linear-gradient(180deg,#f8f9fa 0%,#ffffff 100%); }
    .steps-row { display:flex; flex-direction:row; align-items:stretch; justify-content:center; gap:0; max-width:1100px; margin:0 auto; }
    .step-mini { background:white; padding:1.4rem 1.2rem; border-radius:16px; flex:1; text-align:center; box-shadow:0 6px 18px rgba(0,0,0,0.07); border:2px solid transparent; transition:all 0.3s ease; display:flex; flex-direction:column; align-items:center; gap:0.5rem; }
    .step-animate:hover { border-color:#00A0DC; box-shadow:0 10px 28px rgba(0,160,220,0.15); transform:translateY(-4px); }
    .step-number-sm { font-size:1.5rem; color:#00A0DC; font-weight:800; display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,rgba(0,160,220,0.1),rgba(0,116,188,0.1)); border:2px solid #00A0DC; flex-shrink:0; }
    .pulse { animation:pulse-ring 2s ease-out infinite; }
    @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(0,160,220,0.5)} 50%{box-shadow:0 0 0 10px rgba(0,160,220,0)} 100%{box-shadow:0 0 0 0 rgba(0,160,220,0)} }
    .step-mini h3 { font-size:0.95rem; color:#1f2937; font-weight:700; line-height:1.3; margin:0; }
    .step-mini p { color:#6b7280; font-size:0.82rem; line-height:1.5; margin:0; }
    .step-arrow-h { font-size:1.6rem; color:#00A0DC; font-weight:bold; display:flex; align-items:center; padding:0 0.5rem; flex-shrink:0; }
    .bounce { animation:bounce 2s infinite; }
    @keyframes bounce { 0%,100%{transform:translateX(0)} 50%{transform:translateX(6px)} }
    @media (max-width: 768px) { .steps-row { flex-direction:column; gap:0.75rem; } .step-arrow-h { transform:rotate(90deg); align-self:center; } }

    /* ── Footer ── */
    .footer { background:linear-gradient(135deg,#1f2937 0%,#111827 100%); color:white; padding:4rem 0 1.5rem; position:relative; overflow:hidden; }
    .footer::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,#00A0DC,transparent); }
    .footer-container { padding: 0 2rem; }
    .footer-content { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:3rem; margin-bottom:2.5rem; }
    .footer-section h4 { font-size:1.4rem; margin-bottom:1.2rem; color:#00A0DC; font-weight:700; }
    .footer-section p { margin-bottom:0.75rem; opacity:0.9; font-size:1.05rem; transition:all 0.3s; }
    .footer-section p:hover { opacity:1; color:#00A0DC; transform:translateX(5px); }
    .footer-bottom { text-align:center; padding-top:2rem; border-top:1px solid rgba(255,255,255,0.1); opacity:0.8; font-size:0.95rem; }

    /* ── Modal ── */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.55); backdrop-filter:blur(4px); z-index:1000; display:flex; align-items:center; justify-content:center; padding:1.5rem; opacity:0; visibility:hidden; transition:opacity 0.28s ease,visibility 0.28s; }
    .modal-overlay.active { opacity:1; visibility:visible; }
    .modal-box { background:#ffffff; border-radius:20px; width:100%; max-width:860px; max-height:85vh; display:flex; flex-direction:column; box-shadow:0 24px 80px rgba(0,0,0,0.3); transform:translateY(20px) scale(0.97); transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1); overflow:hidden; }
    .modal-overlay.active .modal-box { transform:translateY(0) scale(1); }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:1.5rem 2rem; background:linear-gradient(135deg,#00A0DC 0%,#0074BC 100%); flex-shrink:0; }
    .modal-title-row { display:flex; align-items:center; gap:14px; }
    .modal-dept-icon { font-size:2rem; }
    .modal-title { font-size:1.35rem; font-weight:700; color:white; margin:0; font-family:'Poppins',sans-serif; }
    .modal-close { background:rgba(255,255,255,0.2); border:none; color:white; font-size:1.1rem; width:36px; height:36px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s; font-weight:700; flex-shrink:0; }
    .modal-close:hover { background:rgba(255,255,255,0.35); }
    .modal-body { padding:2rem; overflow-y:auto; flex:1; }
    .modal-empty { text-align:center; padding:3rem 1rem; color:#6b7280; }
    .modal-empty-icon { font-size:3rem; margin-bottom:1rem; }
    .modal-empty p { font-size:1rem; margin-bottom:0.4rem; }
    .modal-empty-sub { font-size:0.9rem; opacity:0.7; }
    .modal-offers-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1.25rem; }
    .modal-offer-card { background:linear-gradient(145deg,#f8faff,#eef4ff); border:1px solid rgba(0,160,220,0.15); border-radius:16px; padding:1.4rem; display:flex; flex-direction:column; gap:0.75rem; transition:transform 0.22s ease,box-shadow 0.22s ease; animation:cardFadeIn 0.4s ease-out both; }
    @keyframes cardFadeIn { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    .modal-offer-card:hover { transform:translateY(-4px); box-shadow:0 12px 30px rgba(0,160,220,0.2); border-color:#00A0DC; }
    .moc-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
    .moc-title { font-size:1rem; font-weight:700; color:#1f2937; line-height:1.35; flex:1; }
    .moc-type { font-size:0.72rem; font-weight:700; padding:3px 10px; border-radius:20px; white-space:nowrap; background:rgba(0,160,220,0.15); color:#0074BC; flex-shrink:0; }
    .moc-type[data-type="stage"]      { background:rgba(0,160,220,0.12); color:#0074BC; }
    .moc-type[data-type="alternance"] { background:rgba(124,58,237,0.12); color:#7c3aed; }
    .moc-type[data-type="emploi"]     { background:rgba(5,150,105,0.12);  color:#059669; }
    .moc-meta { display:flex; flex-wrap:wrap; gap:10px; margin:6px 0 8px; font-size:0.78rem; color:#6b7280; font-weight:500; }
    .moc-meta span { display:flex; align-items:center; gap:3px; }
    .moc-desc { font-size:0.85rem; color:#4b5563; line-height:1.55; margin:0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
    .moc-desc.expanded { display:block; -webkit-line-clamp:unset; overflow:visible; }
    .moc-toggle { background:none; border:none; color:#00A0DC; font-size:0.78rem; font-weight:600; cursor:pointer; padding:0; font-family:'Inter',sans-serif; align-self:flex-start; transition:color 0.2s; }
    .moc-toggle:hover { color:#0074BC; }
    .moc-btn { margin-top:auto; background:linear-gradient(135deg,#00A0DC,#0074BC); color:white; border:none; padding:0.6rem 1.2rem; border-radius:10px; font-size:0.88rem; font-weight:700; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.2s ease; align-self:flex-start; }
    .moc-btn:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,160,220,0.35); }

    @media (max-width: 768px) {
      .hero-container { grid-template-columns:1fr; gap:2rem; }
      .hero-content { text-align:center; }
      .hero-image { order:-1; }
      .hero-img { max-width:260px; }
      .hero-title { font-size:1.8rem; }
      .hero-subtitle { font-size:1rem; }
      .logo { height:50px; width:50px; }
      .brand-name { font-size:1.4rem; }
      .nav-actions { gap:0.5rem; }
      .btn { padding:0.6rem 1.1rem; font-size:0.88rem; }
      .snav-link { padding: 0 0.75rem; font-size: 0.82rem; }
      /* overflow:visible so dropdown is not clipped */
      .secondary-nav { top: 80px; overflow: visible; }
      /* On mobile, dropdown becomes fixed to avoid clipping by sticky parent */
      .dept-dropdown {
        position: fixed;
        top: 132px;
        left: 0;
        right: 0;
        min-width: unset;
        width: 100%;
        border-radius: 0 0 12px 12px;
        z-index: 500;
      }
      .modal-box { max-height:92vh; padding:0; border-radius: 16px; }
      .modal-offers-grid { grid-template-columns:1fr; }
      .moc-grid { grid-template-columns: 1fr !important; }
      .why-join { padding: 2rem 0; }
      .how-it-works { padding: 2rem 0; }
    }

    @media (max-width: 540px) {
      .micro-copy { display: none !important; }
      .cta-with-copy { display: inline-block; }
      .secondary-nav { top: 70px; }
      .dept-dropdown { top: 122px; }
      .logo { height: 40px; width: 40px; }
      .brand-name { font-size: 1.2rem; }
      .navbar { padding: 0.7rem 0; }
      .btn { padding: 0.5rem 0.85rem; font-size: 0.8rem; }
    }

    @media (max-width: 480px) {
      .hero-title { font-size:1.55rem; line-height: 1.3; }
      .hero-subtitle { font-size: 0.92rem; margin-bottom: 1.8rem; }
      .hero-img { max-width:200px; }
      .hero { padding: 2.5rem 0; }
      .hero-image { padding: 1.5rem; }
      .logo { height:36px; width:36px; }
      .brand-name { font-size:1.1rem; }
      .secondary-nav { top: 64px; }
      .dept-dropdown { top: 116px; }
      .modal-box { margin: 0; border-radius: 16px 16px 0 0; max-height: 95vh; }
      .footer-container { padding: 0 1rem; }
      .container { padding: 0 1rem; }
      .btn-large { padding: 0.9rem 1.8rem; font-size: 1rem; }
      .section-title-sm { font-size: 1.5rem; }
      .benefit-card-sm, .step-mini { padding: 1.1rem 1rem; }
    }

    @media (max-width: 360px) {
      .brand-name { display: none; }
      .hero-title { font-size: 1.35rem; }
      .container { padding: 0 0.75rem; }
      .secondary-nav { top: 60px; }
      .dept-dropdown { top: 108px; }
      .snav-link { padding: 0 0.55rem; font-size: 0.78rem; height: 44px; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = true;
  showDeptDropdown = false;
  showModal = false;
  selectedDept: Department | null = null;
  expandedOffers = new Set<string>();

  private readonly DEPT_CONFIG: { name: string; icon: string }[] = [
    { name: 'Consulting ERP',                          icon: '👨🏼‍💻' },
    { name: 'Système management Qualité',              icon: '⚙️'  },
    { name: 'Intelligence artificielle',               icon: '🤖'  },
    { name: 'Data Analytics / Business Intelligence',  icon: '📊'  },
    { name: 'Développement informatique',              icon: '💻'  },
    { name: 'Marketing & Commercial',                  icon: '📈'  },
  ];

  departments: Department[] = [];

  ngOnInit(): void {
    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/offers`)
      .subscribe({
        next: (res) => {
          const active = (res.data || []).filter(
            o => o.status === 'active' || o.status === 'publiee' || o.status === 'published'
          );
          this.departments = this.DEPT_CONFIG.map(cfg => ({
            name: cfg.name, icon: cfg.icon, expanded: false,
            offers: active.filter(o => o.department === cfg.name).map(o => ({
              _id: o._id, title: o.title, description: o.description,
              location: o.location, duration: o.duration, type: o.type, positions: o.positions
            }))
          }));
          this.loading = false;
        },
        error: () => {
          this.departments = this.DEPT_CONFIG.map(cfg => ({ ...cfg, offers: [], expanded: false }));
          this.loading = false;
        }
      });
  }

  scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  toggleOfferDesc(id: string): void {
    if (this.expandedOffers.has(id)) this.expandedOffers.delete(id);
    else this.expandedOffers.add(id);
  }

  openDeptModal(dept: Department): void {
    this.selectedDept = dept;
    this.showModal = true;
    this.showDeptDropdown = false;
    this.expandedOffers.clear();
    document.body.style.overflow = 'hidden';
  }

  closeDeptModal(): void {
    this.showModal = false;
    this.selectedDept = null;
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.closeDeptModal(); }

  showLoginModal(): void { this.router.navigate(['/login']); }

  goToRegister(event?: Event): void {
    event?.preventDefault();
    this.authService.logout();
    this.router.navigateByUrl('/candidate/complete-profile').catch(() => {
      window.location.href = '/candidate/complete-profile';
    });
  }
}
