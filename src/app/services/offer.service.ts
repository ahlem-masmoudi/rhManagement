import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Offer, OfferStatus } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private offersSubject = new BehaviorSubject<Offer[]>([]);
  public offers$: Observable<Offer[]> = this.offersSubject.asObservable();

  constructor() {
    this.loadDemoData();
  }

  getOffers(): Observable<Offer[]> {
    return this.offers$;
  }

  getOfferById(id: string): Offer | undefined {
    return this.offersSubject.value.find(o => o.id === id);
  }

  createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'updatedAt' | 'applicationsCount' | 'viewsCount'>): void {
    const newOffer: Offer = {
      ...offer,
      id: Date.now().toString(),
      applicationsCount: 0,
      viewsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.offersSubject.next([...this.offersSubject.value, newOffer]);
  }

  updateOffer(id: string, updates: Partial<Offer>): void {
    const offers = this.offersSubject.value;
    const index = offers.findIndex(o => o.id === id);
    
    if (index !== -1) {
      offers[index] = {
        ...offers[index],
        ...updates,
        updatedAt: new Date()
      };
      this.offersSubject.next([...offers]);
    }
  }

  deleteOffer(id: string): void {
    const offers = this.offersSubject.value.filter(o => o.id !== id);
    this.offersSubject.next(offers);
  }

  private loadDemoData(): void {
    const demoData: Offer[] = [
      {
        id: '1',
        title: 'Stage Développeur Full-Stack React/Node.js',
        department: 'Engineering',
        location: 'Paris',
        type: 'stage',
        duration: '6 mois',
        startDate: '2024-07-01',
        description: 'Rejoignez notre équipe pour développer des applications web modernes.',
        requirements: ['React', 'Node.js', 'TypeScript', 'Git'],
        benefits: ['Tickets restaurant', 'Télétravail partiel', 'Encadrement'],
        status: 'publiee',
        matchingCriteria: {
          requiredSkills: [
            { name: 'React', level: 3 },
            { name: 'TypeScript', level: 3 }
          ],
          preferredSkills: [
            { name: 'Node.js', level: 2 }
          ],
          experienceYears: 0,
          educationLevel: ['Master 1', 'Master 2'],
          weights: {
            skills: 40,
            experience: 20,
            education: 20,
            projects: 20
          }
        },
        applicationsCount: 24,
        viewsCount: 156,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05')
      },
      {
        id: '2',
        title: 'Stage Data Scientist Python/ML',
        department: 'Data Science',
        location: 'Lyon',
        type: 'stage',
        duration: '4-6 mois',
        startDate: '2024-06-01',
        description: 'Participez à des projets de machine learning et d\'analyse de données.',
        requirements: ['Python', 'Machine Learning', 'Pandas', 'Scikit-learn'],
        benefits: ['Formation continue', 'Mentorat', 'Matériel fourni'],
        status: 'publiee',
        matchingCriteria: {
          requiredSkills: [
            { name: 'Python', level: 4 },
            { name: 'Machine Learning', level: 3 }
          ],
          preferredSkills: [
            { name: 'TensorFlow', level: 2 }
          ],
          experienceYears: 1,
          educationLevel: ['Master 1', 'Master 2'],
          weights: {
            skills: 50,
            experience: 15,
            education: 20,
            projects: 15
          }
        },
        applicationsCount: 18,
        viewsCount: 98,
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08')
      }
    ];

    this.offersSubject.next(demoData);
  }
}
