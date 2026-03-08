import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CandidateDocument, ApplicationDocument, DocumentType, DocumentStatus } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private documentsSubject = new BehaviorSubject<Map<string, CandidateDocument[]>>(new Map());
  public documents$: Observable<Map<string, CandidateDocument[]>> = this.documentsSubject.asObservable();

  constructor() {}

  /**
   * Upload un document pour un candidat
   */
  uploadDocument(
    candidateId: string, 
    file: File, 
    type: DocumentType, 
    uploadedBy: string
  ): Observable<CandidateDocument> {
    return new Observable(observer => {
      // Simulation d'upload - Dans la vraie app, utiliser FormData et API backend
      const fileUrl = URL.createObjectURL(file);
      
      const document: CandidateDocument = {
        id: this.generateId(),
        name: file.name,
        type,
        fileUrl,
        uploadedBy,
        uploadedAt: new Date(),
        status: 'soumis',
        isSigned: false
      };

      // Ajouter le document à la liste
      const currentDocs = this.documentsSubject.value;
      const candidateDocs = currentDocs.get(candidateId) || [];
      candidateDocs.push(document);
      currentDocs.set(candidateId, candidateDocs);
      this.documentsSubject.next(new Map(currentDocs));

      observer.next(document);
      observer.complete();
    });
  }

  /**
   * Récupère les documents d'un candidat
   */
  getCandidateDocuments(candidateId: string): CandidateDocument[] {
    return this.documentsSubject.value.get(candidateId) || [];
  }

  /**
   * Marque un document comme signé
   */
  signDocument(candidateId: string, documentId: string, signedBy: string): void {
    const currentDocs = this.documentsSubject.value;
    const candidateDocs = currentDocs.get(candidateId) || [];
    
    const docIndex = candidateDocs.findIndex(d => d.id === documentId);
    if (docIndex !== -1) {
      candidateDocs[docIndex] = {
        ...candidateDocs[docIndex],
        isSigned: true,
        signedBy,
        signedAt: new Date(),
        status: 'signe'
      };
      currentDocs.set(candidateId, candidateDocs);
      this.documentsSubject.next(new Map(currentDocs));
    }
  }

  /**
   * Valide un document
   */
  validateDocument(candidateId: string, documentId: string): void {
    this.updateDocumentStatus(candidateId, documentId, 'valide');
  }

  /**
   * Rejette un document
   */
  rejectDocument(candidateId: string, documentId: string): void {
    this.updateDocumentStatus(candidateId, documentId, 'rejete');
  }

  /**
   * Met à jour le statut d'un document
   */
  private updateDocumentStatus(candidateId: string, documentId: string, status: DocumentStatus): void {
    const currentDocs = this.documentsSubject.value;
    const candidateDocs = currentDocs.get(candidateId) || [];
    
    const docIndex = candidateDocs.findIndex(d => d.id === documentId);
    if (docIndex !== -1) {
      candidateDocs[docIndex] = {
        ...candidateDocs[docIndex],
        status
      };
      currentDocs.set(candidateId, candidateDocs);
      this.documentsSubject.next(new Map(currentDocs));
    }
  }

  /**
   * Supprime un document
   */
  deleteDocument(candidateId: string, documentId: string): void {
    const currentDocs = this.documentsSubject.value;
    const candidateDocs = currentDocs.get(candidateId) || [];
    
    const filteredDocs = candidateDocs.filter(d => d.id !== documentId);
    currentDocs.set(candidateId, filteredDocs);
    this.documentsSubject.next(new Map(currentDocs));
  }

  /**
   * Télécharge un document
   */
  downloadDocument(doc: CandidateDocument): void {
    const link = window.document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.name;
    link.click();
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
