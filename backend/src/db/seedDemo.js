const db = require('../config/db');
const { runSeeding } = require('./seeder');

async function seed() {
  try {
    await runSeeding(db);
    console.log('====================================================');
    console.log('   Demo seeding complete successfully!');
    console.log('   Demo Login Credentials:');
    console.log('   Username / Email: demo@brushiq.com');
    console.log('   Password: password123');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding demo data:', err);
    process.exit(1);
  }
}

seed();
