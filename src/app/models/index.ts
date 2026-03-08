export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  status: CandidateStatus;
  school: string;
  level: string;
  expectedDegree: string;
  expectedGraduation: string;
  location: string;
  availability: string;
  skills: Skill[];
  experiences: Experience[];
  projects: Project[];
  languages: Language[];
  notes?: Note[];
  trackingToken?: string; // Lien unique pour suivre la candidature
  documents?: CandidateDocument[];
  statusHistory?: StatusChange[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Offer {
  id: string;
  title: string;
  department: string;
  location: string;
  type: OfferType;
  duration: string;
  startDate: string;
  description: string;
  requirements: string[];
  benefits: string[];
  status: OfferStatus;
  matchingCriteria: MatchingCriteria;
  applicationsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  candidateId: string;
  offerId: string;
  status: CandidateStatus;
  appliedAt: Date;
  matchingScore?: MatchingScore;
  trackingToken?: string; // Lien unique pour cette candidature spécifique
  documents?: ApplicationDocument[];
  statusHistory?: StatusChange[];
}

// Gestion des documents pour les candidatures
export interface CandidateDocument {
  id: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  uploadedBy: string; // 'candidate' ou userId du RH
  uploadedAt: Date;
  status: DocumentStatus;
  isSigned?: boolean;
  signedBy?: string;
  signedAt?: Date;
}

export interface ApplicationDocument {
  id: string;
  applicationId: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  uploadedBy: string; // 'candidate' ou userId du RH
  uploadedAt: Date;
  status: DocumentStatus;
  isSigned?: boolean;
  signedBy?: string;
  signedAt?: Date;
}

export interface StatusChange {
  id: string;
  previousStatus: CandidateStatus | null;
  newStatus: CandidateStatus;
  changedBy: string;
  changedAt: Date;
  comment?: string;
  emailSent: boolean;
  emailSentAt?: Date;
}

// Action de masse pour changer les statuts
export interface BulkStatusChange {
  candidateIds: string[];
  newStatus: CandidateStatus;
  comment?: string;
  sendEmail: boolean;
}

// Email de notification
export interface StatusChangeEmail {
  to: string;
  candidateName: string;
  previousStatus: CandidateStatus | null;
  newStatus: CandidateStatus;
  trackingUrl?: string;
  comment?: string;
  documents?: CandidateDocument[];
}

export interface MatchingScore {
  global: number;
  semantic: number;
  rules: number;
  explanations: MatchingExplanation;
}

export interface MatchingExplanation {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface MatchingCriteria {
  requiredSkills: Skill[];
  preferredSkills: Skill[];
  experienceYears: number;
  educationLevel: string[];
  weights: {
    skills: number;
    experience: number;
    education: number;
    projects: number;
  };
}

export interface Skill {
  name: string;
  level?: number; // 1-5
  years?: number;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  skills: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  startDate: string;
  endDate?: string;
}

export interface Language {
  name: string;
  level: LanguageLevel;
}

export interface Note {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  type: NoteType;
}

export interface KPI {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  icon: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

export type CandidateStatus = 
  | 'nouveau'
  | 'preselectionne'
  | 'en_attente_documents'
  | 'documents_recus'
  | 'entretien_programme'
  | 'entretien_realise'
  | 'test_technique'
  | 'validation_finale'
  | 'offre_envoyee'
  | 'offre_acceptee'
  | 'offre_refusee'
  | 'rejete'
  | 'abandonne';

export type DocumentType =
  | 'cv'
  | 'lettre_motivation'
  | 'demande_stage'
  | 'convention_stage'
  | 'convention_signee'
  | 'attestation'
  | 'autre';

export type DocumentStatus =
  | 'en_attente'
  | 'soumis'
  | 'valide'
  | 'rejete'
  | 'signe';

export type OfferStatus = 
  | 'brouillon'
  | 'publiee'
  | 'archivee';

export type OfferType = 
  | 'stage'
  | 'alternance'
  | 'cdd'
  | 'cdi';

export type LanguageLevel = 
  | 'A1'
  | 'A2'
  | 'B1'
  | 'B2'
  | 'C1'
  | 'C2'
  | 'natif';

export type NoteType = 
  | 'general'
  | 'entretien'
  | 'technique'
  | 'decision';

export type ActivityType = 
  | 'application'
  | 'status_change'
  | 'interview'
  | 'offer_created'
  | 'note_added';
