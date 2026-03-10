const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rh-management');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Offer Schema
const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  department: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [String],
  skills: [String],
  duration: { type: String, required: true },
  location: { type: String, required: true },
  startDate: Date,
  salary: String,
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'published' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  applications: [],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Offer = mongoose.model('Offer', offerSchema);

// Unilog Offers Data
const unilogOffers = [
  // ==================== CONSULTING ERP ====================
  {
    title: 'ERP01 : Paramétrage d\'un flux commercial ERP',
    department: 'Consulting ERP',
    description: 'Stage dans le domaine du conseil ERP avec pour mission le paramétrage et l\'optimisation d\'un flux commercial. Vous travaillerez sur l\'analyse des besoins métier, la configuration des modules ERP et l\'accompagnement des utilisateurs.',
    requirements: [
      'Bac+4/5 en Informatique ou Systèmes d\'Information',
      'Connaissance des processus commerciaux',
      'Notions en ERP (SAP, Oracle, Microsoft Dynamics)',
      'Capacité d\'analyse et esprit de synthèse'
    ],
    skills: ['ERP', 'Processus métier', 'Paramétrage', 'Analyse fonctionnelle', 'SQL'],
    duration: '4-6 mois',
    location: 'Paris',
    startDate: new Date('2026-06-01'),
    salary: '1000-1200€/mois',
    status: 'published'
  },
  {
    title: 'ERP02 : Paramétrage d\'un flux production pour une entreprise industrielle',
    department: 'Consulting ERP',
    description: 'Participez à la mise en place et au paramétrage d\'un flux de production complet dans un environnement industriel. Mission stratégique alliant conseil, technique et gestion de projet.',
    requirements: [
      'Bac+5 Ingénieur ou Master en Systèmes d\'Information',
      'Connaissance des processus industriels (MRP, MES)',
      'Expérience avec un ERP industriel appréciée',
      'Rigueur et sens de l\'organisation'
    ],
    skills: ['ERP industriel', 'Gestion de production', 'MRP', 'Lean Manufacturing', 'Paramétrage'],
    duration: '6 mois',
    location: 'Lyon',
    startDate: new Date('2026-07-01'),
    salary: '1100-1300€/mois',
    status: 'published'
  },
  {
    title: 'ERP03 : Mise en place du module « Finance » dans l\'ERP',
    department: 'Consulting ERP',
    description: 'Intégration et paramétrage du module Finance dans un ERP d\'entreprise. Vous travaillerez en étroite collaboration avec les équipes comptables et financières pour adapter la solution aux besoins métier.',
    requirements: [
      'Bac+5 Finance, Comptabilité ou Systèmes d\'Information',
      'Connaissance des normes comptables (IFRS, PCG)',
      'Maîtrise d\'Excel avancée',
      'Anglais professionnel'
    ],
    skills: ['ERP Finance', 'Comptabilité', 'SAP FI/CO', 'Oracle Financials', 'Reporting financier'],
    duration: '5-6 mois',
    location: 'Paris',
    startDate: new Date('2026-09-01'),
    salary: '1200-1400€/mois',
    status: 'published'
  },
  {
    title: 'ERP04 : Mise en place GMAO',
    department: 'Consulting ERP',
    description: 'Déploiement d\'une solution de Gestion de Maintenance Assistée par Ordinateur (GMAO). Analyse des besoins, paramétrage, tests et formation des utilisateurs.',
    requirements: [
      'Bac+4/5 Informatique ou Génie Industriel',
      'Connaissance des processus de maintenance',
      'Notions en ERP et GMAO',
      'Bon relationnel pour la conduite du changement'
    ],
    skills: ['GMAO', 'ERP', 'Maintenance industrielle', 'Gestion d\'actifs', 'Formation utilisateurs'],
    duration: '4-6 mois',
    location: 'Toulouse',
    startDate: new Date('2026-06-15'),
    salary: '1000-1200€/mois',
    status: 'published'
  },
  {
    title: 'ERP05 : Mise en place du module « Qualité » dans l\'ERP',
    department: 'Consulting ERP',
    description: 'Implémentation du module Qualité pour garantir la conformité et la traçabilité des processus. Travail sur les indicateurs qualité, les non-conformités et les actions correctives.',
    requirements: [
      'Bac+5 Qualité, Ingénieur ou Systèmes d\'Information',
      'Connaissance des normes ISO 9001',
      'Expérience en gestion de la qualité',
      'Esprit d\'analyse et rigueur'
    ],
    skills: ['ERP Qualité', 'ISO 9001', 'Gestion de la qualité', 'Traçabilité', 'Audit'],
    duration: '5-6 mois',
    location: 'Nantes',
    startDate: new Date('2026-08-01'),
    salary: '1100-1300€/mois',
    status: 'published'
  },
  {
    title: 'ERP06 : Développement d\'un module d\'ordonnancement d\'un job shop flexible (FJS)',
    department: 'Consulting ERP',
    description: 'Développement d\'un module d\'ordonnancement avancé pour optimiser la planification des ressources dans un atelier flexible. Projet technique combinant algorithmique et développement.',
    requirements: [
      'Bac+5 Ingénieur Informatique ou Recherche Opérationnelle',
      'Compétences en algorithmique et optimisation',
      'Maîtrise d\'un langage de programmation (Java, Python, C#)',
      'Connaissance des problèmes d\'ordonnancement'
    ],
    skills: ['Algorithmique', 'Optimisation', 'Job Shop Scheduling', 'Java/Python', 'Développement ERP'],
    duration: '6 mois',
    location: 'Paris',
    startDate: new Date('2026-09-01'),
    salary: '1200-1400€/mois',
    status: 'published'
  },

  // ==================== SYSTÈME MANAGEMENT QUALITÉ ====================
  {
    title: 'SMQ01 : Implémentation d\'un SMQ et des principes Lean dans un contexte IT',
    department: 'Système management Qualité',
    description: 'Mise en place d\'un Système de Management de la Qualité (SMQ) intégrant les principes Lean dans un environnement IT. Accompagnement des équipes vers l\'amélioration continue.',
    requirements: [
      'Bac+5 Qualité, Management ou Ingénieur',
      'Connaissance des normes ISO 9001 et méthodologies Lean',
      'Expérience en gestion de projet appréciée',
      'Excellent sens de la communication'
    ],
    skills: ['SMQ', 'ISO 9001', 'Lean Management', 'Amélioration continue', 'Conduite du changement'],
    duration: '6 mois',
    location: 'Paris',
    startDate: new Date('2026-06-01'),
    salary: '1100-1300€/mois',
    status: 'published'
  },
  {
    title: 'SMQ02 : Conception des workflow des SMQ',
    department: 'Système management Qualité',
    description: 'Conception et modélisation des workflows de processus qualité. Digitalisation des processus et mise en place d\'outils de suivi et de reporting.',
    requirements: [
      'Bac+4/5 Qualité ou Systèmes d\'Information',
      'Maîtrise des outils de modélisation (BPMN, UML)',
      'Connaissance des SMQ et processus qualité',
      'Capacité à formaliser et documenter'
    ],
    skills: ['Modélisation de processus', 'BPMN', 'Workflow', 'Qualité', 'Documentation'],
    duration: '4-6 mois',
    location: 'Lyon',
    startDate: new Date('2026-07-01'),
    salary: '1000-1200€/mois',
    status: 'published'
  },

  // ==================== INTELLIGENCE ARTIFICIELLE ====================
  {
    title: 'AI01 : Développement d\'un système de reconnaissance optiques des documents commerciales',
    department: 'Intelligence artificielle',
    description: 'Développement d\'une solution d\'OCR et de traitement intelligent de documents commerciaux (factures, bons de commande, devis). Utilisation de techniques de Machine Learning et de Computer Vision.',
    requirements: [
      'Bac+5 Data Science, IA ou Informatique',
      'Maîtrise du Machine Learning et Computer Vision',
      'Expérience avec TensorFlow, PyTorch ou OpenCV',
      'Compétences en Python et traitement d\'images'
    ],
    skills: ['Machine Learning', 'Computer Vision', 'OCR', 'Python', 'TensorFlow', 'PyTorch', 'OpenCV'],
    duration: '6 mois',
    location: 'Paris',
    startDate: new Date('2026-09-01'),
    salary: '1300-1500€/mois',
    status: 'published'
  },
  {
    title: 'AI02 : Mise en place d\'un système Text to SQL basé sur LLM',
    department: 'Intelligence artificielle',
    description: 'Développement d\'un système permettant de traduire des questions en langage naturel vers des requêtes SQL en utilisant des Large Language Models (LLM). Projet innovant combinant NLP et bases de données.',
    requirements: [
      'Bac+5 IA, NLP ou Data Science',
      'Expérience avec les LLM (GPT, BERT, T5)',
      'Maîtrise de SQL et des bases de données',
      'Compétences en Python et frameworks NLP'
    ],
    skills: ['NLP', 'LLM', 'SQL', 'Python', 'Transformers', 'Prompt Engineering', 'Bases de données'],
    duration: '6 mois',
    location: 'Paris',
    startDate: new Date('2026-09-01'),
    salary: '1300-1500€/mois',
    status: 'published'
  },
  {
    title: 'AI03 : Mise en place d\'un système de documentation d\'un code basé sur LLM',
    department: 'Intelligence artificielle',
    description: 'Création d\'un outil automatique de documentation de code source utilisant les LLM. Génération automatique de commentaires, docstrings et documentation technique.',
    requirements: [
      'Bac+5 IA ou Génie Logiciel',
      'Maîtrise des LLM et techniques de génération de texte',
      'Excellente compréhension du code et de la documentation',
      'Compétences en Python et analyse statique de code'
    ],
    skills: ['LLM', 'NLP', 'Code Analysis', 'Python', 'Documentation', 'AST', 'Transformers'],
    duration: '5-6 mois',
    location: 'Paris',
    startDate: new Date('2026-09-01'),
    salary: '1300-1500€/mois',
    status: 'published'
  },

  // ==================== DATA ANALYTICS / BUSINESS INTELLIGENCE ====================
  {
    title: 'BI01 : Conception et réalisation d\'un tableau de bord pour les gestionnaires RH',
    department: 'Data Analytics / Business Intelligence',
    description: 'Création d\'un tableau de bord RH complet avec KPIs de recrutement, turnover, absentéisme, formation. Utilisation d\'outils BI modernes pour faciliter la prise de décision.',
    requirements: [
      'Bac+4/5 Data Analytics, BI ou Informatique',
      'Maîtrise des outils BI (Power BI, Tableau, Qlik)',
      'Compétences en SQL et modélisation de données',
      'Connaissance des processus RH appréciée'
    ],
    skills: ['Power BI', 'Tableau', 'SQL', 'Data Visualization', 'KPI', 'ETL', 'RH Analytics'],
    duration: '4-6 mois',
    location: 'Paris',
    startDate: new Date('2026-06-01'),
    salary: '1100-1300€/mois',
    status: 'published'
  },
  {
    title: 'BI02 : Conception et réalisation d\'un tableau de bord pour une usine de production',
    department: 'Data Analytics / Business Intelligence',
    description: 'Développement d\'un tableau de bord industriel pour suivre la performance de production : TRS, cadences, qualité, maintenance. Intégration avec les systèmes MES et ERP.',
    requirements: [
      'Bac+5 Data Analytics, Ingénieur ou BI',
      'Connaissance des indicateurs industriels (TRS, OEE)',
      'Maîtrise des outils BI et bases de données',
      'Expérience en environnement industriel appréciée'
    ],
    skills: ['Power BI', 'Tableau', 'SQL', 'KPI Industriels', 'TRS/OEE', 'MES', 'Production Analytics'],
    duration: '5-6 mois',
    location: 'Lyon',
    startDate: new Date('2026-07-01'),
    salary: '1100-1300€/mois',
    status: 'published'
  },
  {
    title: 'BI03 : Conception et réalisation d\'un tableau de bord financier',
    department: 'Data Analytics / Business Intelligence',
    description: 'Création d\'un dashboard financier avec suivi du CA, marges, trésorerie, budget vs réalisé. Automatisation des reportings financiers mensuels.',
    requirements: [
      'Bac+5 Finance, Data Analytics ou BI',
      'Connaissance des indicateurs financiers',
      'Maîtrise de Power BI ou Tableau',
      'Compétences en SQL et modélisation financière'
    ],
    skills: ['Power BI', 'Tableau', 'SQL', 'Finance', 'Reporting financier', 'DAX', 'Excel avancé'],
    duration: '4-6 mois',
    location: 'Paris',
    startDate: new Date('2026-06-15'),
    salary: '1200-1400€/mois',
    status: 'published'
  },

  // ==================== DÉVELOPPEMENT INFORMATIQUE ====================
  {
    title: 'DEV01 : Développement d\'une plateforme BI',
    department: 'Développement informatique',
    description: 'Développement d\'une plateforme complète de Business Intelligence avec collecte de données, ETL, dashboards interactifs et API REST. Stack moderne : React, Node.js, PostgreSQL.',
    requirements: [
      'Bac+5 Informatique ou Ingénieur',
      'Maîtrise du développement Full Stack',
      'Expérience avec React, Node.js',
      'Connaissance en BI et Data Warehouse'
    ],
    skills: ['React', 'Node.js', 'PostgreSQL', 'ETL', 'REST API', 'TypeScript', 'Data Visualization'],
    duration: '6 mois',
    location: 'Paris',
    startDate: new Date('2026-09-01'),
    salary: '1200-1400€/mois',
    status: 'published'
  },
  {
    title: 'DEV02 : Développement d\'une application web pour la gestion de la maintenance (GMAO)',
    department: 'Développement informatique',
    description: 'Création d\'une application web de GMAO avec gestion des équipements, planification des interventions, suivi des coûts et historique de maintenance.',
    requirements: [
      'Bac+5 Informatique',
      'Maîtrise du développement web (Angular/React + Node.js)',
      'Expérience en développement d\'applications métier',
      'Connaissance des processus de maintenance appréciée'
    ],
    skills: ['Angular', 'Node.js', 'MongoDB', 'REST API', 'TypeScript', 'Express', 'GMAO'],
    duration: '6 mois',
    location: 'Toulouse',
    startDate: new Date('2026-07-01'),
    salary: '1200-1400€/mois',
    status: 'published'
  },
  {
    title: 'DEV03 : Développement d\'une application web pour la gestion des ressources humaines',
    department: 'Développement informatique',
    description: 'Développement d\'un SIRH complet : gestion des congés, notes de frais, évaluations, recrutement. Interface moderne et intuitive.',
    requirements: [
      'Bac+5 Informatique',
      'Expertise en développement Full Stack',
      'Maîtrise d\'Angular ou React + Backend',
      'Sensibilité UX/UI'
    ],
    skills: ['Angular', 'React', 'Node.js', 'PostgreSQL', 'REST API', 'TypeScript', 'SIRH'],
    duration: '6 mois',
    location: 'Paris',
    startDate: new Date('2026-09-01'),
    salary: '1200-1400€/mois',
    status: 'published'
  },

  // ==================== MARKETING & COMMERCIAL ====================
  {
    title: 'MKT01 : Conception et réalisation d\'un siteweb',
    department: 'Marketing & Commercial',
    description: 'Création d\'un site web corporate moderne et responsive avec CMS pour faciliter la gestion de contenu. Optimisation SEO et performance.',
    requirements: [
      'Bac+3/5 Informatique, Web ou Marketing Digital',
      'Maîtrise du développement web (HTML, CSS, JavaScript)',
      'Expérience avec un CMS (WordPress, Strapi)',
      'Notions en SEO et webdesign'
    ],
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'WordPress', 'SEO', 'Responsive Design', 'Figma'],
    duration: '3-4 mois',
    location: 'Paris',
    startDate: new Date('2026-06-01'),
    salary: '900-1100€/mois',
    status: 'published'
  },
  {
    title: 'MKT02 : Marketing digital et communication commerciale',
    department: 'Marketing & Commercial',
    description: 'Élaboration et mise en œuvre de la stratégie de marketing digital : campagnes Google Ads, réseaux sociaux, email marketing, création de contenu.',
    requirements: [
      'Bac+3/5 Marketing Digital ou Communication',
      'Connaissance des outils marketing (Google Ads, Analytics)',
      'Maîtrise des réseaux sociaux professionnels',
      'Excellent rédactionnel et créativité'
    ],
    skills: ['Marketing Digital', 'Google Ads', 'SEO/SEA', 'Social Media', 'Email Marketing', 'Analytics', 'Content Marketing'],
    duration: '4-6 mois',
    location: 'Paris',
    startDate: new Date('2026-06-15'),
    salary: '900-1100€/mois',
    status: 'published'
  }
];

// Import User model
const User = require('../models/User');

// Main function
const createOffers = async () => {
  try {
    await connectDB();

    console.log('🚀 Creating Unilog internship offers...\n');

    // Get admin user to assign as creator
    const adminUser = await User.findOne({ email: 'admin@rh.com' });

    if (!adminUser) {
      console.error('❌ Admin user not found. Please run createTestUsers.js first.');
      process.exit(1);
    }

    // Clear existing offers
    const deleteResult = await Offer.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing offers\n`);

    // Add createdBy to all offers
    const offersWithCreator = unilogOffers.map(offer => ({
      ...offer,
      createdBy: adminUser._id
    }));

    // Insert offers
    const result = await Offer.insertMany(offersWithCreator);

    console.log(`✅ Successfully created ${result.length} internship offers!\n`);

    // Display summary by department
    console.log('═══════════════════════════════════════');
    console.log('📊 OFFERS SUMMARY BY DEPARTMENT:');
    console.log('═══════════════════════════════════════\n');

    const departments = [...new Set(unilogOffers.map(o => o.department))];
    
    departments.forEach(dept => {
      const deptOffers = result.filter(o => o.department === dept);
      console.log(`📁 ${dept}: ${deptOffers.length} offers`);
      deptOffers.forEach(offer => {
        console.log(`   • ${offer.title}`);
      });
      console.log('');
    });

    console.log('═══════════════════════════════════════');
    console.log(`✅ Total: ${result.length} offers created`);
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating offers:', error);
    process.exit(1);
  }
};

// Run the script
createOffers();
