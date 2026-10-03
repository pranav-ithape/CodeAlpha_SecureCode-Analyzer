import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes';
import scanRoutes from './routes/scan.routes';
import projectRoutes from './routes/project.routes';
import { authenticate } from './middlewares/auth.middleware';

const app = express();

app.use(cors());
// 10MB limit for JSON parsing (to accept large code payloads)
app.use(express.json({ limit: '10mb' }));

import dashboardRoutes from './routes/dashboard.routes';
import findingRoutes from './routes/finding.routes';
import ruleRoutes from './routes/rule.routes';

app.use('/api/auth', authRoutes);
app.use('/api/scans', authenticate, scanRoutes);
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/findings', authenticate, findingRoutes);
app.use('/api/rules', authenticate, ruleRoutes);

// Basic health check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(200).json({
    status: 'ok',
    database: states[dbState as keyof typeof states] || 'unknown'
  });
});

export default app;
