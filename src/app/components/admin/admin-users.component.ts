import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

interface RhUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'recruiter' | 'rh_offres' | 'rh_candidatures';
  createdAt: string;
  lastLoginAt?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestion des utilisateurs RH</h1>
          <p class="page-sub">Créez et gérez les comptes de l'équipe recrutement</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
          Ajouter un utilisateur
        </button>
      </div>

      <!-- Role legend -->
      <div class="role-cards">
        <div class="role-card role-card-recruiter">
          <div class="role-card-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg>
          </div>
          <div>
            <div class="role-card-name">Recruteur</div>
            <div class="role-card-desc">Accès complet à toute la plateforme</div>
          </div>
        </div>
        <div class="role-card role-card-offres">
          <div class="role-card-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clip-rule="evenodd"/><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/></svg>
          </div>
          <div>
            <div class="role-card-name">Resp. Offres</div>
            <div class="role-card-desc">Gestion des offres de stage uniquement</div>
          </div>
        </div>
        <div class="role-card role-card-candidatures">
          <div class="role-card-icon">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg>
          </div>
          <div>
            <div class="role-card-name">Resp. Candidatures</div>
            <div class="role-card-desc">Gestion des candidatures et dossiers</div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div class="alert-error" *ngIf="error">{{ error }}</div>

      <!-- Table -->
      <div class="table-card">
        <div class="table-wrap">
          <div class="loading-row" *ngIf="loading">
            <div class="spinner"></div>
            <span>Chargement...</span>
          </div>

          <table *ngIf="!loading" class="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Créé le</th>
                <th>Dernière connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="users.length === 0">
                <td colspan="6" class="empty-cell">Aucun utilisateur RH trouvé</td>
              </tr>
              <tr *ngFor="let u of users" class="user-row">
                <td>
                  <div class="user-cell">
                    <div class="avatar" [ngClass]="'avatar-' + u.role">{{ initials(u) }}</div>
                    <span class="user-fullname">{{ u.firstName }} {{ u.lastName }}</span>
                  </div>
                </td>
                <td class="email-cell">{{ u.email }}</td>
                <td>
                  <span class="role-badge" [ngClass]="'badge-' + u.role">{{ roleLabel(u.role) }}</span>
                </td>
                <td class="date-cell">{{ formatDate(u.createdAt) }}</td>
                <td class="date-cell">{{ u.lastLoginAt ? formatDate(u.lastLoginAt) : '—' }}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon btn-edit" (click)="openEdit(u)" title="Modifier le rôle">
                      <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                    </button>
                    <button class="btn-icon btn-delete" (click)="confirmDelete(u)" title="Supprimer">
                      <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal backdrop -->
    <div class="modal-backdrop" *ngIf="showModal" (click)="closeModal()"></div>

    <!-- Create / Edit Modal -->
    <div class="modal" *ngIf="showModal">
      <div class="modal-header">
        <h2 class="modal-title">{{ modalTitle }}</h2>
        <button class="modal-close" (click)="closeModal()">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
        </button>
      </div>

      <div class="modal-body">
        <div class="modal-error" *ngIf="modalError">{{ modalError }}</div>

        <div class="form-row">
          <div class="form-group">
            <label>Prénom</label>
            <input type="text" [(ngModel)]="form.firstName" placeholder="Prénom">
          </div>
          <div class="form-group">
            <label>Nom</label>
            <input type="text" [(ngModel)]="form.lastName" placeholder="Nom">
          </div>
        </div>

        <div class="form-group">
          <label>Email</label>
          <input type="email" [(ngModel)]="form.email" placeholder="email@example.com">
        </div>

        <div class="form-group">
          <label>{{ editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe' }}</label>
          <input type="password" [(ngModel)]="form.password" [placeholder]="editingUser ? 'Laisser vide pour conserver' : 'Minimum 6 caractères'">
        </div>

        <div class="form-group">
          <label>Rôle</label>
          <div class="role-selector">
            <label class="role-option" *ngFor="let r of roleOptions" [class.selected]="form.role === r.value">
              <input type="radio" [(ngModel)]="form.role" [value]="r.value" name="role">
              <div class="role-option-content">
                <span class="role-option-name">{{ r.label }}</span>
                <span class="role-option-desc">{{ r.desc }}</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" (click)="closeModal()" [disabled]="saving">Annuler</button>
        <button class="btn-save" (click)="save()" [disabled]="saving">
          <span *ngIf="saving" class="btn-spinner"></span>
          {{ editingUser ? 'Enregistrer' : 'Créer le compte' }}
        </button>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <div class="modal-backdrop" *ngIf="deletingUser" (click)="deletingUser = null"></div>
    <div class="modal modal-sm" *ngIf="deletingUser">
      <div class="modal-header">
        <h2 class="modal-title">Confirmer la suppression</h2>
      </div>
      <div class="modal-body">
        <p class="confirm-text">
          Supprimer le compte de <strong>{{ deletingUser.firstName }} {{ deletingUser.lastName }}</strong> ?<br>
          Cette action est irréversible.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" (click)="deletingUser = null">Annuler</button>
        <button class="btn-danger" (click)="deleteUser()" [disabled]="saving">
          <span *ngIf="saving" class="btn-spinner"></span>
          Supprimer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .admin-page { max-width: 1100px; margin: 0 auto; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
    }
    .page-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-sub   { font-size: 13.5px; color: #64748b; margin: 0; }

    .btn-primary {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 18px; background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white; border: none; border-radius: 12px; font-size: 14px;
      font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;
      box-shadow: 0 4px 14px rgba(37,99,235,0.3);
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }

    /* Role legend cards */
    .role-cards { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .role-card {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 18px; border-radius: 14px; flex: 1; min-width: 200px;
      border: 1.5px solid;
    }
    .role-card-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .role-card-recruiter { background: #eff6ff; border-color: #bfdbfe; }
    .role-card-recruiter .role-card-icon { background: #dbeafe; color: #2563eb; }
    .role-card-offres    { background: #f0fdf4; border-color: #bbf7d0; }
    .role-card-offres .role-card-icon    { background: #dcfce7; color: #059669; }
    .role-card-candidatures { background: #faf5ff; border-color: #e9d5ff; }
    .role-card-candidatures .role-card-icon { background: #f3e8ff; color: #7c3aed; }
    .role-card-name { font-size: 13px; font-weight: 700; color: #1e293b; }
    .role-card-desc { font-size: 11.5px; color: #64748b; margin-top: 2px; }

    .alert-error {
      background: #fef2f2; border: 1.5px solid #fecaca; color: #dc2626;
      padding: 12px 16px; border-radius: 10px; font-size: 13.5px; margin-bottom: 16px;
    }

    /* Table */
    .table-card {
      background: white; border-radius: 16px;
      border: 1px solid #e2e8f0; overflow: hidden;
      box-shadow: 0 1px 8px rgba(0,0,0,0.04);
    }
    .table-wrap { overflow-x: auto; }
    .loading-row {
      display: flex; align-items: center; gap: 12px;
      padding: 40px; justify-content: center; color: #64748b;
    }
    .spinner {
      width: 22px; height: 22px; border: 3px solid #e2e8f0;
      border-top-color: #6366f1; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .users-table { width: 100%; border-collapse: collapse; }
    .users-table th {
      font-size: 11.5px; font-weight: 600; color: #64748b; text-transform: uppercase;
      letter-spacing: 0.6px; padding: 14px 20px; text-align: left;
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }
    .users-table td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; }
    .user-row:last-child td { border-bottom: none; }
    .user-row:hover td { background: #f8fafc; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
    }
    .avatar-recruiter       { background: linear-gradient(135deg, #2563eb, #3b82f6); }
    .avatar-rh_offres       { background: linear-gradient(135deg, #059669, #10b981); }
    .avatar-rh_candidatures { background: linear-gradient(135deg, #7c3aed, #a855f7); }
    .user-fullname { font-size: 14px; font-weight: 600; color: #1e293b; }

    .email-cell  { font-size: 13.5px; color: #475569; }
    .date-cell   { font-size: 12.5px; color: #94a3b8; }
    .empty-cell  { text-align: center; color: #94a3b8; font-size: 14px; padding: 48px; }

    .role-badge {
      display: inline-block; padding: 4px 10px; border-radius: 999px;
      font-size: 12px; font-weight: 600;
    }
    .badge-recruiter       { background: #dbeafe; color: #1d4ed8; }
    .badge-rh_offres       { background: #dcfce7; color: #15803d; }
    .badge-rh_candidatures { background: #f3e8ff; color: #6d28d9; }

    .action-btns { display: flex; gap: 6px; }
    .btn-icon {
      width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; background: transparent;
    }
    .btn-edit   { border-color: #bfdbfe; color: #2563eb; }
    .btn-edit:hover   { background: #dbeafe; }
    .btn-delete { border-color: #fecaca; color: #dc2626; }
    .btn-delete:hover { background: #fee2e2; }

    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      backdrop-filter: blur(3px); z-index: 300;
    }
    .modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 90%; max-width: 520px; background: white; border-radius: 20px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.2); z-index: 301;
      animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    .modal-sm { max-width: 400px; }
    @keyframes modalIn {
      from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
      to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9;
    }
    .modal-title { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0; }
    .modal-close {
      width: 32px; height: 32px; border-radius: 8px; border: none;
      background: #f1f5f9; color: #64748b; cursor: pointer; display: flex;
      align-items: center; justify-content: center; transition: all 0.2s;
    }
    .modal-close:hover { background: #e2e8f0; }
    .modal-body  { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px; border-top: 1px solid #f1f5f9;
    }

    .modal-error {
      background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
      padding: 10px 14px; border-radius: 8px; font-size: 13px;
    }

    .form-row { display: flex; gap: 12px; }
    .form-row .form-group { flex: 1; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #374151; }
    .form-group input {
      padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 14px; color: #1e293b; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .form-group input:focus {
      border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    }

    /* Role selector */
    .role-selector { display: flex; flex-direction: column; gap: 8px; }
    .role-option {
      display: flex; align-items: center; gap: 12px; padding: 12px 14px;
      border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer;
      transition: all 0.2s;
    }
    .role-option input[type="radio"] { display: none; }
    .role-option.selected { border-color: #6366f1; background: #eef2ff; }
    .role-option-name { font-size: 13.5px; font-weight: 600; color: #1e293b; display: block; }
    .role-option-desc { font-size: 12px; color: #64748b; display: block; margin-top: 1px; }

    .btn-cancel {
      padding: 9px 18px; border: 1.5px solid #e2e8f0; border-radius: 10px;
      background: white; color: #64748b; font-size: 14px; font-weight: 500;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-cancel:hover { background: #f8fafc; }
    .btn-save {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 20px; background: linear-gradient(135deg, #2563eb, #7c3aed);
      color: white; border: none; border-radius: 10px; font-size: 14px;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-danger {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 20px; background: #dc2626; color: white; border: none;
      border-radius: 10px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite; display: inline-block;
    }
    .confirm-text { font-size: 14px; color: #374151; line-height: 1.6; margin: 0; }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: RhUser[] = [];
  loading = true;
  error = '';

  showModal = false;
  editingUser: RhUser | null = null;
  deletingUser: RhUser | null = null;
  saving = false;
  modalError = '';

  form = { firstName: '', lastName: '', email: '', password: '', role: 'rh_offres' as string };

  roleOptions = [
    { value: 'recruiter',       label: 'Recruteur',          desc: 'Accès complet à toute la plateforme' },
    { value: 'rh_offres',       label: 'Resp. Offres',        desc: 'Gestion des offres de stage uniquement' },
    { value: 'rh_candidatures', label: 'Resp. Candidatures',  desc: 'Gestion des candidatures et dossiers' },
  ];

  get modalTitle(): string {
    return this.editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur RH';
  }

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() { this.load(); }

  private get headers() {
    return { headers: this.auth.getAuthHeaders() };
  }

  private load() {
    this.loading = true;
    this.error = '';
    this.http.get<any>(`${environment.apiUrl}/admin/users`, this.headers).subscribe({
      next: r => { this.users = r.data; this.loading = false; },
      error: e => { this.error = e?.error?.message || 'Erreur de chargement.'; this.loading = false; }
    });
  }

  openCreate() {
    this.editingUser = null;
    this.form = { firstName: '', lastName: '', email: '', password: '', role: 'rh_offres' };
    this.modalError = '';
    this.showModal = true;
  }

  openEdit(u: RhUser) {
    this.editingUser = u;
    this.form = { firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role };
    this.modalError = '';
    this.showModal = true;
  }

  closeModal() {
    if (this.saving) return;
    this.showModal = false;
    this.editingUser = null;
  }

  save() {
    this.modalError = '';
    if (!this.form.firstName || !this.form.lastName || !this.form.email) {
      this.modalError = 'Prénom, nom et email sont requis.'; return;
    }
    if (!this.editingUser && !this.form.password) {
      this.modalError = 'Le mot de passe est requis pour un nouveau compte.'; return;
    }

    const payload: any = {
      firstName: this.form.firstName,
      lastName:  this.form.lastName,
      email:     this.form.email,
      role:      this.form.role,
    };
    if (this.form.password) payload.password = this.form.password;

    this.saving = true;
    if (this.editingUser) {
      const roleChanged = this.editingUser.role !== this.form.role;
      this.http.put<any>(`${environment.apiUrl}/admin/users/${this.editingUser._id}`, payload, this.headers).subscribe({
        next: r => {
          const idx = this.users.findIndex(u => u._id === this.editingUser!._id);
          if (idx > -1) this.users[idx] = r.data;
          this.saving = false;
          this.showModal = false;
          if (roleChanged) {
            this.error = `Rôle modifié. L'utilisateur doit se reconnecter pour que le changement prenne effet.`;
            setTimeout(() => this.error = '', 6000);
          }
        },
        error: e => { this.modalError = e?.error?.message || 'Erreur.'; this.saving = false; }
      });
    } else {
      this.http.post<any>(`${environment.apiUrl}/admin/users`, payload, this.headers).subscribe({
        next: r => { this.users.unshift(r.data); this.saving = false; this.showModal = false; },
        error: e => { this.modalError = e?.error?.message || 'Erreur.'; this.saving = false; }
      });
    }
  }

  confirmDelete(u: RhUser) { this.deletingUser = u; }

  deleteUser() {
    if (!this.deletingUser) return;
    this.saving = true;
    this.http.delete<any>(`${environment.apiUrl}/admin/users/${this.deletingUser._id}`, this.headers).subscribe({
      next: () => {
        this.users = this.users.filter(u => u._id !== this.deletingUser!._id);
        this.deletingUser = null;
        this.saving = false;
      },
      error: e => { this.error = e?.error?.message || 'Erreur.'; this.deletingUser = null; this.saving = false; }
    });
  }

  initials(u: RhUser) { return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase(); }

  roleLabel(role: string) {
    return { recruiter: 'Recruteur', rh_offres: 'Resp. Offres', rh_candidatures: 'Resp. Candidatures' }[role] ?? role;
  }

  formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
