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

// Import Offer model
const Offer = require('../models/Offer');

const checkOffers = async () => {
  try {
    await connectDB();

    console.log('🔍 Vérification des offres dans la base de données...\n');

    const offers = await Offer.find({});

    console.log(`📊 Total offres trouvées: ${offers.length}\n`);

    if (offers.length === 0) {
      console.log('⚠️  Aucune offre dans la base de données !');
      process.exit(0);
    }

    // Group by department
    const departments = {};
    offers.forEach(offer => {
      const dept = offer.department || 'UNDEFINED';
      if (!departments[dept]) {
        departments[dept] = [];
      }
      departments[dept].push(offer);
    });

    console.log('═══════════════════════════════════════');
    console.log('📁 OFFRES PAR DÉPARTEMENT:');
    console.log('═══════════════════════════════════════\n');

    Object.keys(departments).forEach(dept => {
      console.log(`\n📁 ${dept}: ${departments[dept].length} offres`);
      console.log(`   Valeur brute du département: "${dept}"`);
      console.log(`   Longueur: ${dept.length} caractères`);
      console.log(`   Code ASCII premier char: ${dept.charCodeAt(0)}`);
      
      departments[dept].forEach(offer => {
        console.log(`   • ${offer.title}`);
        console.log(`     Status: ${offer.status}`);
        console.log(`     Location: ${offer.location}`);
      });
    });

    console.log('\n═══════════════════════════════════════');
    console.log('🔍 DÉTAILS PREMIÈRE OFFRE:');
    console.log('═══════════════════════════════════════');
    const firstOffer = offers[0];
    console.log(JSON.stringify({
      title: firstOffer.title,
      department: firstOffer.department,
      status: firstOffer.status,
      location: firstOffer.location,
      duration: firstOffer.duration
    }, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

checkOffers();
