/**
 * One-time migration: remove all generated assignment letters from candidates
 * and revert their status from offre_envoyee → offre_acceptee.
 *
 * Run from backend/ directory:
 *   node scripts/remove-assignment-letters.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function run() {
  await connectDB();
  const db = mongoose.connection;
  const col = db.collection('candidates');

  // 1. Remove all documents whose metadata.kind === 'assignment_letter'
  const pullResult = await col.updateMany(
    { 'documents.metadata.kind': 'assignment_letter' },
    { $pull: { documents: { 'metadata.kind': 'assignment_letter' } } }
  );
  console.log(`✅ Removed assignment letters from ${pullResult.modifiedCount} candidate(s).`);

  // 2. Revert status offre_envoyee → offre_acceptee
  const statusResult = await col.updateMany(
    { status: 'offre_envoyee' },
    { $set: { status: 'offre_acceptee' } }
  );
  console.log(`✅ Reverted status offre_envoyee → offre_acceptee for ${statusResult.modifiedCount} candidate(s).`);

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
