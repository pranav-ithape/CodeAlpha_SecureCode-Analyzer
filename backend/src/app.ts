import express from 'express';
import cors from 'cors';
import scanRoutes from './routes/scan.routes';
import projectRoutes from './routes/project.routes';
import mongoose from 'mongoose';

const app = express();

app.use(cors());
// 10MB limit for JSON parsing (to accept large code payloads)
app.use(express.json({ limit: '10mb' }));

app.use('/api/scans', scanRoutes);
app.use('/api/projects', projectRoutes);

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
