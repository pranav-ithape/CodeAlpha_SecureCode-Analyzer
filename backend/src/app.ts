import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import scanRoutes from './routes/scan.routes';
import projectRoutes from './routes/project.routes';
import { authenticate } from './middlewares/auth.middleware';

const app = express();

app.use(helmet());

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased from 100 to 1000 for local development (Dashboard makes many requests)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 10MB limit for JSON parsing (to accept large code payloads)
app.use(express.json({ limit: '10mb' }));

import dashboardRoutes from './routes/dashboard.routes';
import findingRoutes from './routes/finding.routes';
import ruleRoutes from './routes/rule.routes';
import aiRoutes from './routes/ai.routes';
import manualReviewRoutes from './routes/manual-review.routes';
import reportRoutes from './routes/report.routes';
import settingsRoutes from './routes/settings.routes';
import profileRoutes from './routes/profile.routes';

app.use('/api/auth', authRoutes);
app.use('/api/scans', authenticate, scanRoutes);
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/findings', authenticate, findingRoutes);
app.use('/api/rules', authenticate, ruleRoutes);
app.use('/api/ai', authenticate, aiRoutes);
app.use('/api/manual-reviews', authenticate, manualReviewRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/profile', authenticate, profileRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  console.log(`Health check: GEMINI_API_KEY configured = ${!!process.env.GEMINI_API_KEY}`);
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(200).json({
    status: 'ok',
    database: states[dbState as keyof typeof states] || 'unknown'
  });
});

export default app;
