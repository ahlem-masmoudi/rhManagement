import { Component, OnInit, inject } from '@angular/core';
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
            <img src="assets/logo-inet.png" alt="INET" class="logo logo-animate">
            <span class="brand-name">INET</span>
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

      <!-- Hero Section -->
      <section class="hero" id="accueil">
        <div class="container hero-container">
          <div class="hero-content fade-in-up">
            <h1 class="hero-title gradient-text">
              Rejoignez l'équipe INET — Trouvez le stage qui correspond à votre profil
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
            <img src="assets/hero-image.png" alt="Candidat INET" class="hero-img">
          </div>
        </div>
      </section>

      <!-- Pourquoi nous rejoindre -->
      <section class="why-join">
        <div class="container">
          <h2 class="section-title slide-in">Pourquoi nous rejoindre ?</h2>
          <div class="benefits-grid">
            <div class="benefit-card card-hover">
              <div class="benefit-icon rotate-on-hover">🎯</div>
              <h3>Offres adaptées à votre profil</h3>
              <p>Des opportunités de stage sélectionnées selon vos compétences et aspirations</p>
            </div>
            <div class="benefit-card card-hover">
              <div class="benefit-icon rotate-on-hover">💡</div>
              <h3>Scoring intelligent</h3>
              <p>Un algorithme de matching pour vous proposer les meilleures offres</p>
            </div>
            <div class="benefit-card card-hover">
              <div class="benefit-icon rotate-on-hover">📄</div>
              <h3>Suivi en temps réel</h3>
              <p>Suivez l'évolution de vos candidatures directement depuis votre espace</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Comment ça marche -->
      <section class="how-it-works">
        <div class="container">
          <h2 class="section-title slide-in">Comment ça marche ?</h2>
          <div class="steps">
            <div class="step step-animate">
              <div class="step-number pulse">①</div>
              <h3>Remplissez le formulaire</h3>
              <p>Complétez votre profil en quelques minutes</p>
            </div>
            <div class="step-arrow bounce">↓</div>
            <div class="step step-animate">
              <div class="step-number pulse">②</div>
              <h3>Recevez les offres compatibles</h3>
              <p>Notre système vous propose les meilleures opportunités</p>
            </div>
            <div class="step-arrow bounce">↓</div>
            <div class="step step-animate">
              <div class="step-number pulse">③</div>
              <h3>Postulez en un clic</h3>
              <p>Candidatez directement aux offres qui vous intéressent</p>
            </div>
            <div class="step-arrow bounce">↓</div>
            <div class="step step-animate">
              <div class="step-number pulse">④</div>
              <h3>Suivez votre candidature</h3>
              <p>Recevez des notifications par email à chaque étape</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Départements -->
      <section class="departments" id="secteurs">
        <div class="container">
          <h2 class="section-title">Nos départements qui recrutent</h2>

          <div *ngIf="loading" class="loading-row">
            <div class="spinner"></div>
            <span>Chargement des offres...</span>
          </div>

          <div class="departments-grid" *ngIf="!loading">
            <div
              *ngFor="let dept of departments; let i = index"
              class="department-card"
              [class.expanded]="dept.expanded"
              [style.animation-delay]="(i * 0.1) + 's'">

              <!-- Card Header (always visible) -->
              <div class="dept-header" (click)="toggleDept(dept)">
                <div class="dept-top">
                  <span class="dept-icon">{{ dept.icon }}</span>
                  <div class="dept-badge" [class.badge-empty]="dept.offers.length === 0">
                    {{ dept.offers.length }} offre{{ dept.offers.length !== 1 ? 's' : '' }}
                  </div>
                </div>
                <h3 class="dept-name">{{ dept.name }}</h3>
                <div class="dept-footer-row">
                  <span class="dept-cta" *ngIf="dept.offers.length > 0">
                    {{ dept.expanded ? 'Masquer les offres' : 'Voir les offres' }}
                    <span class="chevron" [class.open]="dept.expanded">›</span>
                  </span>
                  <span class="dept-empty-label" *ngIf="dept.offers.length === 0">Aucune offre active</span>
                </div>
              </div>

              <!-- Offers List (expanded) -->
              <div class="offers-list" [class.visible]="dept.expanded">
                <div
                  *ngFor="let offer of dept.offers; let j = index"
                  class="offer-row"
                  [style.animation-delay]="(j * 0.07) + 's'">
                  <div class="offer-row-top">
                    <span class="offer-title">{{ offer.title }}</span>
                    <button class="postuler-btn" (click)="goToRegister()">Postuler</button>
                  </div>
                  <div class="offer-row-left">
                    <p class="offer-description">{{ offer.description }}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer" id="contact">
        <div class="container footer-container">
          <div class="footer-content">
            <div class="footer-section">
              <h4>🏢 INET</h4>
              <p>Plateforme de gestion des stages</p>
            </div>
            <div class="footer-section">
              <h4>Contact</h4>
              <p>📍 Sfax, Tunisie</p>
              <p>📧 contact&#64;inet.tn</p>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2026 INET. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .cta-with-copy {
      display: inline-block;
      text-align: center;
      position: relative;
    }
    .micro-copy {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      opacity: 0;
      transform: translateY(-4px) translateX(-50%);
      transition: opacity 160ms ease, transform 160ms ease;
      visibility: hidden;
      pointer-events: none;
      position: absolute;
      left: 50%;
      top: calc(100% + 8px);
      width: max-content;
      max-width: 320px;
      white-space: normal;
      padding: 4px 8px;
      background: transparent;
    }
    .cta-with-copy:hover .micro-copy,
    .cta-with-copy:focus-within .micro-copy {
      opacity: 1;
      transform: translateY(0) translateX(-50%);
      visibility: visible;
      pointer-events: auto;
    }
    @media (max-width: 640px) {
      .micro-copy { position: static; opacity: 1; visibility: visible; transform: none; margin-top: 8px; max-width: 100%; padding: 0; }
    }

    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }

    .home-page { min-height: 100vh; background: #f8f9fa; font-family: 'Poppins', sans-serif; position: relative; overflow-x: hidden; }

    .animated-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; overflow: hidden; }
    .circle { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(0,160,220,0.1) 0%, transparent 70%); animation: float 20s infinite ease-in-out; }
    .circle-1 { width: 500px; height: 500px; top: -200px; left: -200px; animation-delay: 0s; }
    .circle-2 { width: 400px; height: 400px; top: 50%; right: -150px; animation-delay: 5s; }
    .circle-3 { width: 600px; height: 600px; bottom: -300px; left: 30%; animation-delay: 10s; }
    @keyframes float { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,-50px) scale(1.1)} 66%{transform:translate(-50px,50px) scale(0.9)} }

    .navbar { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); padding: 1rem 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(0,160,220,0.1); }
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

    .hero { background: linear-gradient(135deg,#00A0DC 0%,#0074BC 100%); color: white; padding: 4rem 0; position: relative; overflow: hidden; }
    .hero::before { content:''; position:absolute; inset:0; background: radial-gradient(circle at 20% 50%,rgba(255,255,255,0.1) 0%,transparent 50%), radial-gradient(circle at 80% 80%,rgba(255,255,255,0.1) 0%,transparent 50%); animation: heroShine 10s infinite ease-in-out; }
    @keyframes heroShine { 0%,100%{opacity:0.5} 50%{opacity:1} }
    .hero-container { display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; }
    .hero-content { position:relative; z-index:1; }
    .hero-image { position:relative; z-index:1; display:flex; align-items:center; justify-content:center; background:white; padding:3rem; border-radius:24px; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
    .hero-img { width:100%; max-width:500px; height:auto; animation:floatImage 6s ease-in-out infinite; }
    @keyframes floatImage { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
    .fade-in-up { animation: fadeInUp 1s ease-out; }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
    .hero-title { font-size:3rem; margin-bottom:1.5rem; line-height:1.2; font-weight:800; }
    .gradient-text { background:linear-gradient(to right,#ffffff,#e0f2fe,#ffffff); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:gradientShift 3s ease infinite; }
    @keyframes gradientShift { 0%,100%{background-position:0% center} 50%{background-position:100% center} }
    .hero-subtitle { font-size:1.2rem; margin-bottom:2.5rem; opacity:0.95; line-height:1.6; }

    .section-title { font-size:2.8rem; text-align:center; margin-bottom:3.5rem; color:#1f2937; font-weight:800; position:relative; display:inline-block; width:100%; }
    .section-title::after { content:''; position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); width:80px; height:4px; background:linear-gradient(90deg,#00A0DC,#0074BC); border-radius:2px; }
    .slide-in { animation:slideIn 0.8s ease-out; }
    @keyframes slideIn { from{opacity:0;transform:translateX(-50px)} to{opacity:1;transform:translateX(0)} }

    .why-join { padding:6rem 0; background:white; }
    .benefits-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:2.5rem; }
    .benefit-card { text-align:center; padding:2.5rem; border-radius:20px; background:linear-gradient(145deg,#ffffff,#f8f9fa); box-shadow:0 10px 30px rgba(0,0,0,0.08); transition:all 0.4s cubic-bezier(0.175,0.885,0.32,1.275); border:1px solid rgba(0,160,220,0.1); }
    .card-hover:hover { transform:translateY(-15px) scale(1.02); box-shadow:0 20px 40px rgba(0,160,220,0.2); border-color:#00A0DC; }
    .benefit-icon { font-size:3.5rem; margin-bottom:1.5rem; transition:transform 0.5s ease; display:inline-block; }
    .rotate-on-hover:hover { transform:rotate(360deg) scale(1.2); }
    .benefit-card h3 { font-size:1.35rem; margin-bottom:1rem; color:#1f2937; font-weight:700; }
    .benefit-card p { color:#6b7280; line-height:1.7; }

    .how-it-works { padding:6rem 0; background:linear-gradient(180deg,#f8f9fa 0%,#ffffff 100%); }
    .steps { display:flex; flex-direction:column; align-items:center; gap:1.5rem; max-width:700px; margin:0 auto; }
    .step { background:white; padding:2.5rem; border-radius:20px; width:100%; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.08); border:2px solid transparent; transition:all 0.4s ease; }
    .step-animate:hover { border-color:#00A0DC; box-shadow:0 15px 40px rgba(0,160,220,0.15); transform:scale(1.03); }
    .step-number { font-size:2.5rem; color:#00A0DC; font-weight:800; margin-bottom:1.2rem; display:inline-block; width:70px; height:70px; line-height:70px; border-radius:50%; background:linear-gradient(135deg,rgba(0,160,220,0.1),rgba(0,116,188,0.1)); border:3px solid #00A0DC; }
    .pulse { animation:pulse-ring 2s ease-out infinite; }
    @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(0,160,220,0.5)} 50%{box-shadow:0 0 0 15px rgba(0,160,220,0)} 100%{box-shadow:0 0 0 0 rgba(0,160,220,0)} }
    .step h3 { font-size:1.35rem; margin-bottom:0.75rem; color:#1f2937; font-weight:700; }
    .step p { color:#6b7280; font-size:1.05rem; line-height:1.6; }
    .step-arrow { font-size:2.5rem; color:#00A0DC; font-weight:bold; }
    .bounce { animation:bounce 2s infinite; }
    @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

    /* ── Departments ── */
    .departments { padding: 6rem 0; background: white; }

    .loading-row {
      display: flex; align-items: center; justify-content: center; gap: 12px;
      color: #6b7280; font-size: 1rem; padding: 40px 0;
    }
    .spinner {
      width: 24px; height: 24px; border: 3px solid #e5e7eb;
      border-top-color: #00A0DC; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .departments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 2rem;
      align-items: start;
    }

    /* Department card */
    .department-card {
      background: linear-gradient(135deg, #00A0DC 0%, #0074BC 100%);
      color: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,160,220,0.3);
      transition: box-shadow 0.4s ease, transform 0.4s ease;
      animation: cardFadeIn 0.6s ease-out both;
      align-self: start;
      height: fit-content;
    }
    @keyframes cardFadeIn {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .department-card:hover {
      box-shadow: 0 20px 50px rgba(0,160,220,0.45);
      transform: translateY(-6px);
    }
    .department-card.expanded {
      box-shadow: 0 24px 60px rgba(0,160,220,0.5);
    }

    /* Header clickable zone */
    .dept-header {
      padding: 2rem 2rem 1.5rem;
      cursor: pointer;
      user-select: none;
      position: relative;
    }
    .dept-header::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0);
      transition: background 0.2s;
      border-radius: 24px 24px 0 0;
    }
    .dept-header:hover::after { background: rgba(255,255,255,0.06); }

    .dept-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .dept-icon { font-size: 2.8rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); }

    .dept-badge {
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(4px);
      color: white;
      font-size: 0.85rem;
      font-weight: 700;
      padding: 4px 14px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.3);
      white-space: nowrap;
    }
    .dept-badge.badge-empty { background: rgba(255,255,255,0.12); opacity: 0.7; }

    .dept-name {
      font-size: 1.25rem;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 0.8rem;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .dept-footer-row { display: flex; align-items: center; }

    .dept-cta {
      font-size: 0.9rem;
      font-weight: 600;
      opacity: 0.9;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.2s;
    }
    .dept-header:hover .dept-cta { opacity: 1; }

    .chevron {
      font-size: 1.2rem;
      font-style: normal;
      display: inline-block;
      transition: transform 0.3s ease;
      line-height: 1;
    }
    .chevron.open { transform: rotate(90deg); }

    .dept-empty-label { font-size: 0.85rem; opacity: 0.65; font-style: italic; }

    /* Offers list */
    .offers-list {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1),
                  padding 0.3s ease;
      background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(224,242,254,0.14));
    }
    .offers-list.visible {
      max-height: 2200px;
      padding: 14px 14px 18px;
      display: flex;
      gap: 14px;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.45) transparent;
    }
    .offers-list.visible::-webkit-scrollbar { height: 8px; }
    .offers-list.visible::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.4);
      border-radius: 999px;
    }
    .offers-list.visible::-webkit-scrollbar-track { background: transparent; }

    .offer-row {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      flex: 0 0 360px;
      min-height: 100%;
      padding: 16px 18px;
      margin: 0;
      background: linear-gradient(145deg, rgba(255,255,255,0.28), rgba(224,242,254,0.2));
      border-radius: 18px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.3);
      animation: rowSlide 0.3s ease-out both;
      transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 14px 28px rgba(0,0,0,0.1);
    }
    @keyframes rowSlide {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .offer-row:hover {
      background: linear-gradient(145deg, rgba(255,255,255,0.36), rgba(224,242,254,0.26));
      transform: translateY(-3px);
      box-shadow: 0 18px 34px rgba(0,0,0,0.12);
    }

    .offer-row-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .offer-row-left { min-width: 0; }
    .offer-title {
      display: block;
      flex: 1;
      font-size: 0.94rem;
      font-weight: 600;
      color: white;
      margin-bottom: 0;
      line-height: 1.4;
      white-space: normal;
      word-break: break-word;
    }
    .offer-description {
      margin: 0;
      font-size: 0.82rem;
      line-height: 1.55;
      color: rgba(255,255,255,0.9);
      white-space: normal;
      word-break: break-word;
      overflow: visible;
    }

    .postuler-btn {
      flex-shrink: 0;
      background: white;
      color: #0074BC;
      border: none;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      font-family: 'Inter', sans-serif;
    }
    .postuler-btn:hover {
      background: #f0f9ff;
      transform: scale(1.06);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    /* Footer */
    .footer { background:linear-gradient(135deg,#1f2937 0%,#111827 100%); color:white; padding:4rem 0 1.5rem; position:relative; overflow:hidden; }
    .footer::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,#00A0DC,transparent); }
    .footer-container { padding: 0 2rem; }
    .footer-content { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:3rem; margin-bottom:2.5rem; }
    .footer-section h4 { font-size:1.4rem; margin-bottom:1.2rem; color:#00A0DC; font-weight:700; }
    .footer-section p { margin-bottom:0.75rem; opacity:0.9; font-size:1.05rem; transition:all 0.3s; }
    .footer-section p:hover { opacity:1; color:#00A0DC; transform:translateX(5px); }
    .footer-bottom { text-align:center; padding-top:2rem; border-top:1px solid rgba(255,255,255,0.1); opacity:0.8; font-size:0.95rem; }

    @media (max-width: 768px) {
      .hero-container { grid-template-columns:1fr; gap:2rem; }
      .hero-content { text-align:center; }
      .offers-list.visible {
        flex-direction: column;
        overflow-x: hidden;
        overflow-y: visible;
      }
      .offer-row { flex-basis: auto; width: 100%; }
      .offer-row-top { flex-direction: column; }
      .postuler-btn { align-self: flex-start; }
      .hero-image { order:-1; }
      .hero-img { max-width:350px; }
      .hero-title { font-size:2.2rem; }
      .section-title { font-size:2.2rem; }
      .benefits-grid, .departments-grid { grid-template-columns:1fr; }
      .logo { height:50px; width:50px; }
      .brand-name { font-size:1.4rem; }
      .nav-actions { flex-direction:column; gap:0.5rem; }
      .btn { padding:0.6rem 1.2rem; font-size:0.9rem; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = true;

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
            name: cfg.name,
            icon: cfg.icon,
            expanded: false,
            offers: active
              .filter(o => o.department === cfg.name)
              .map(o => ({
                _id:      o._id,
                title:    o.title,
                description: o.description,
                location: o.location,
                duration: o.duration,
                type:     o.type
              }))
          }));
          this.loading = false;
        },
        error: () => {
          // If API unreachable, show empty departments gracefully
          this.departments = this.DEPT_CONFIG.map(cfg => ({
            ...cfg, offers: [], expanded: false
          }));
          this.loading = false;
        }
      });
  }

  toggleDept(dept: Department): void {
    if (dept.offers.length === 0) return;
    dept.expanded = !dept.expanded;
  }

  showLoginModal(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(event?: Event): void {
    event?.preventDefault();
    this.authService.logout();
    this.router.navigateByUrl('/candidate/complete-profile').catch(() => {
      window.location.href = '/candidate/complete-profile';
    });
  }
}
