const mongoose = require('mongoose');
require('dotenv').config();

const Offer = require('../models/Offer');

const checkOffers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rh-management');
    console.log('✅ Connected to MongoDB\n');

    const offers = await Offer.find({});
    
    console.log(`📊 Total des offres dans la base: ${offers.length}\n`);
    
    if (offers.length === 0) {
      console.log('❌ Aucune offre trouvée dans la base de données!');
      console.log('💡 Exécutez: node scripts/createUnilogOffers.js\n');
    } else {
      const byStatus = {};
      offers.forEach(offer => {
        byStatus[offer.status] = (byStatus[offer.status] || 0) + 1;
        console.log(`- ${offer.title}`);
        console.log(`  Département: ${offer.department}`);
        console.log(`  Statut: ${offer.status}`);
        console.log(`  Localisation: ${offer.location}`);
        console.log(`  Durée: ${offer.duration}\n`);
      });
      
      console.log('\n📈 Résumé par statut:');
      Object.entries(byStatus).forEach(([status, count]) => {
        console.log(`  ${status}: ${count} offre(s)`);
      });
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

checkOffers();
