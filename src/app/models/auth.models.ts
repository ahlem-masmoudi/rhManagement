export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileComplete: boolean;
  createdAt: Date;
}

export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CandidateProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  school: string;
  level: string;
  expectedDegree: string;
  expectedGraduation: string;
  availability: string;
  skills: string[];
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  cv?: File | string;
}
