import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateRecommendation } from './src/services/ai.service';
import { Finding } from './src/models/Finding';

dotenv.config();

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const finding = await Finding.findOne({});
    if (!finding) {
      console.log('No finding found');
      process.exit(0);
    }

    console.log(`Testing with finding: ${finding._id}`);
    const result = await generateRecommendation(finding);
    console.log('AI Analysis Result:', result);
    
    process.exit(0);
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
};

runTest();
