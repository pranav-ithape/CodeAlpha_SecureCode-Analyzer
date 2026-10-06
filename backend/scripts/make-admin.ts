import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/models/User';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/secops');
    console.log('Connected to MongoDB.');

    const result = await User.updateMany({}, { $set: { role: 'ADMIN' } });
    console.log(`Successfully elevated ${result.modifiedCount} user(s) to ADMIN.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
