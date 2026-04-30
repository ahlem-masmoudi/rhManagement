const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rh-management');
  console.log('✅ MongoDB Connected');
};

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, default: 'candidate' },
  profileComplete: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const candidateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: String, location: String, school: String,
  educationLevel: String, expectedDegree: String,
  expectedGraduation: Date, availability: Date,
  skills: [String], linkedin: String, github: String,
  createdAt: { type: Date, default: Date.now }
});
const Candidate = mongoose.model('Candidate', candidateSchema);

const applicationSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
  status: { type: String, default: 'nouveau' },
  appliedAt: { type: Date, default: Date.now },
  matchingScore: Number,
  matchedSkills: [String],
  notes: String
});
const Application = mongoose.model('Application', applicationSchema);

const Offer = mongoose.model('Offer', new mongoose.Schema({
  title: String, skills: [String], status: String
}));

const candidates = [
  { firstName: 'Amine',    lastName: 'Belhaj',    school: 'ESPRIT Tunis',         skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'], location: 'Tunis', status: 'nouveau' },
  { firstName: 'Sarra',    lastName: 'Mansouri',  school: 'INSAT',                skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],   location: 'Tunis', status: 'preselectionne' },
  { firstName: 'Mohamed',  lastName: 'Trabelsi',  school: 'FST Sfax',             skills: ['Java', 'Spring Boot', 'MySQL', 'Angular'],    location: 'Sfax',  status: 'nouveau' },
  { firstName: 'Yasmine',  lastName: 'Chaabane',  school: 'ISI Ariana',           skills: ['Angular', 'TypeScript', 'Node.js', 'CSS'],    location: 'Ariana', status: 'entretien_programme' },
  { firstName: 'Khalil',   lastName: 'Mrad',      school: 'ENSI',                 skills: ['Python', 'Machine Learning', 'TensorFlow'],   location: 'Manouba', status: 'nouveau' },
  { firstName: 'Nour',     lastName: 'Bouazizi',  school: 'Université Sfax',      skills: ['PHP', 'Laravel', 'MySQL', 'Vue.js'],          location: 'Sfax',  status: 'preselectionne' },
  { firstName: 'Rami',     lastName: 'Gharbi',    school: 'ISET Sousse',          skills: ['React', 'Redux', 'JavaScript', 'REST API'],   location: 'Sousse', status: 'nouveau' },
  { firstName: 'Malek',    lastName: 'Jebali',    school: 'SUP\'COM',             skills: ['DevOps', 'Docker', 'Kubernetes', 'CI/CD'],    location: 'Tunis', status: 'test_technique' },
  { firstName: 'Houda',    lastName: 'Riahi',     school: 'ESPRIT Tunis',         skills: ['Flutter', 'Dart', 'Firebase', 'Android'],     location: 'Tunis', status: 'nouveau' },
  { firstName: 'Aziz',     lastName: 'Karoui',    school: 'FSB Bizerte',          skills: ['C#', '.NET', 'SQL Server', 'Azure'],          location: 'Bizerte', status: 'nouveau' },
  { firstName: 'Meriem',   lastName: 'Hamdi',     school: 'ENIT',                 skills: ['Embedded Systems', 'C', 'RTOS', 'IoT'],       location: 'Tunis', status: 'preselectionne' },
  { firstName: 'Yassine',  lastName: 'Sfar',      school: 'Polytechnique Sousse', skills: ['Data Science', 'Python', 'Pandas', 'Power BI'], location: 'Sousse', status: 'nouveau' },
  { firstName: 'Chaima',   lastName: 'Boughanmi', school: 'IHEC Carthage',        skills: ['Marketing Digital', 'SEO', 'Google Ads', 'Analytics'], location: 'Tunis', status: 'entretien_programme' },
  { firstName: 'Fares',    lastName: 'Tlili',     school: 'ISET Jendouba',        skills: ['React Native', 'JavaScript', 'GraphQL', 'AWS'], location: 'Tunis', status: 'nouveau' },
  { firstName: 'Amel',     lastName: 'Dridi',     school: 'FST Tunis',            skills: ['Cybersecurity', 'Network', 'Linux', 'Python'], location: 'Tunis', status: 'nouveau' },
  { firstName: 'Seifeddine', lastName: 'Hadj',   school: 'ENSI',                 skills: ['Blockchain', 'Solidity', 'Web3', 'Node.js'],  location: 'Manouba', status: 'preselectionne' },
  { firstName: 'Ines',     lastName: 'Ferchichi', school: 'ESPRIT Tunis',         skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'CSS'],   location: 'Tunis', status: 'nouveau' },
  { firstName: 'Bilel',    lastName: 'Marzouki',  school: 'Université Carthage',  skills: ['SAP', 'ERP', 'Business Analysis', 'SQL'],     location: 'Tunis', status: 'nouveau' },
  { firstName: 'Sana',     lastName: 'Zouari',    school: 'ISI Ariana',           skills: ['Angular', 'Java', 'Spring', 'Agile'],         location: 'Ariana', status: 'test_technique' },
  { firstName: 'Tarek',    lastName: 'Souissi',   school: 'ISET Bizerte',         skills: ['Android', 'Kotlin', 'Firebase', 'REST API'],  location: 'Bizerte', status: 'nouveau' },
  { firstName: 'Lina',     lastName: 'Azzabi',    school: 'SUP\'COM',             skills: ['5G', 'Telecom', 'Python', 'Signal Processing'], location: 'Tunis', status: 'nouveau' },
  { firstName: 'Omar',     lastName: 'Chebbi',    school: 'ESPRIT Tunis',         skills: ['Vue.js', 'Node.js', 'PostgreSQL', 'Docker'],   location: 'Tunis', status: 'preselectionne' },
  { firstName: 'Dorra',    lastName: 'Khelifi',   school: 'ISTIC Manouba',        skills: ['QA Testing', 'Selenium', 'Jest', 'Cypress'],   location: 'Manouba', status: 'nouveau' },
  { firstName: 'Walid',    lastName: 'Baccouche', school: 'ISET Sfax',            skills: ['PHP', 'Symfony', 'MySQL', 'Linux'],           location: 'Sfax',  status: 'nouveau' },
  { firstName: 'Emna',     lastName: 'Ghannouchi', school: 'ESPRIT Tunis',        skills: ['Data Analysis', 'SQL', 'Tableau', 'Excel'],   location: 'Tunis', status: 'entretien_programme' },
  { firstName: 'Hamza',    lastName: 'Nasri',     school: 'ENET\'Com Sousse',     skills: ['Cloud', 'AWS', 'Terraform', 'Jenkins'],       location: 'Sousse', status: 'nouveau' },
];

const seed = async () => {
  try {
    await connectDB();

    const offers = await Offer.find({ status: 'publiee' }).limit(19);
    if (offers.length === 0) {
      console.log('⚠️  No published offers found — creating applications without offer link');
    }

    let created = 0, skipped = 0;

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const email = `${c.firstName.toLowerCase()}.${c.lastName.toLowerCase()}@test.inet.tn`;

      const existing = await User.findOne({ email });
      if (existing) { console.log(`⚠️  ${email} already exists — skipping`); skipped++; continue; }

      const hash = await bcrypt.hash('Test1234!', 10);
      const user = await User.create({
        email, password: hash,
        firstName: c.firstName, lastName: c.lastName,
        role: 'candidate', profileComplete: true
      });

      const candidate = await Candidate.create({
        userId: user._id,
        phone: `+216 ${Math.floor(20000000 + Math.random() * 79999999)}`,
        location: c.location + ', Tunisie',
        school: c.school,
        educationLevel: 'Licence',
        expectedDegree: 'Licence en Informatique',
        expectedGraduation: new Date('2026-06-30'),
        availability: new Date('2026-07-01'),
        skills: c.skills
      });

      // Assign to an offer (cycle through available offers)
      if (offers.length > 0) {
        const offer = offers[i % offers.length];
        const matched = c.skills.filter(s => (offer.skills || []).some(os => os.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(os.toLowerCase())));

        await Application.create({
          candidate: candidate._id,
          offer: offer._id,
          status: c.status,
          appliedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          matchingScore: Math.floor(40 + Math.random() * 55),
          matchedSkills: matched,
          notes: ''
        });
      }

      console.log(`✅ ${c.firstName} ${c.lastName} (${email})`);
      created++;
    }

    console.log(`\n✅ Created: ${created} | ⚠️  Skipped: ${skipped}`);
    console.log('All passwords: Test1234!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seed();
