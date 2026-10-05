import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function clearData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const collectionsToDrop = [
      'projects',
      'scans',
      'findings',
      'aianalyses',
      'manualreviews',
      'reports',
      'auditlogs'
    ];

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('Database connection not established');
    }
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    for (const name of collectionsToDrop) {
      if (collectionNames.includes(name)) {
        console.log(`Dropping collection: ${name}...`);
        await db.collection(name).drop();
        console.log(`Dropped ${name}.`);
      } else {
        console.log(`Collection ${name} does not exist, skipping.`);
      }
    }

    console.log('Successfully cleared all testing data!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
}

clearData();
