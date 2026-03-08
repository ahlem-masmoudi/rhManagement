import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Home page (public - new landing page)
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
  },

  // Login route (public) - includes registration form
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },

  // Public candidate registration route (no auth required)
  {
    path: 'candidate/complete-profile',
    loadComponent: () => import('./components/candidate/complete-profile/complete-profile.component').then(m => m.CompleteProfileComponent)
  },

  // Candidate routes (protected by auth + role guard)
  {
    path: 'candidate',
    canActivate: [authGuard, roleGuard(['candidate'])],
    loadComponent: () => import('./components/candidate/candidate-dashboard-layout.component').then(m => m.CandidateDashboardLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./components/candidate/home/candidate-home.component').then(m => m.CandidateHomeComponent)
      },
      {
        path: 'offers',
        loadComponent: () => import('./components/candidate/offers/candidate-offers.component').then(m => m.CandidateOffersComponent)
      }
    ]
  },
  
  // Public candidate tracking route (no auth required)
  {
    path: 'candidat/suivi/:token',
    loadComponent: () => import('./components/candidate/tracking/candidate-tracking.component').then(m => m.CandidateTrackingComponent)
  },

  // RH routes (protected by auth + role guard) - wrapped in RH layout
  {
    path: 'rh',
    canActivate: [authGuard, roleGuard(['recruiter', 'admin'])],
    loadComponent: () => import('./components/rh-layout.component').then(m => m.RhLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'offres',
        loadComponent: () => import('./components/offres/offres.component').then(m => m.OffresComponent)
      },
      {
        path: 'candidatures',
        loadComponent: () => import('./components/candidatures/candidatures.component').then(m => m.CandidaturesComponent)
      },
      {
        path: 'matching',
        loadComponent: () => import('./components/matching/matching.component').then(m => m.MatchingComponent)
      },
      {
        path: 'profil/:id',
        loadComponent: () => import('./components/profil/profil.component').then(m => m.ProfilComponent)
      }
    ]
  },

  // Wildcard redirect
  {
    path: '**',
    redirectTo: 'login'
  }
];
