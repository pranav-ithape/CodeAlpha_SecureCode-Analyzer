import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateReport } from './src/services/report.service';
import { Scan } from './src/models/Scan';
import fs from 'fs';
import path from 'path';

dotenv.config();

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    const scan = await Scan.findOne({});
    if (!scan) {
      console.log('No scan found');
      process.exit(0);
    }
    scan.uploadedFileName = 'vulnerable_app.py';
    await scan.save();

    console.log(`Generating HTML report for scan: ${scan._id}`);
    const reportHtml = await generateReport(scan._id.toString(), 'html');
    console.log(`HTML Report generated: ${reportHtml.filePath}`);

    console.log(`Generating PDF report for scan: ${scan._id}`);
    const reportPdf = await generateReport(scan._id.toString(), 'pdf');
    console.log(`PDF Report generated: ${reportPdf.filePath}`);

    process.exit(0);
  } catch (error) {
    console.error('Error during report generation:', error);
    process.exit(1);
  }
};

runTest();
