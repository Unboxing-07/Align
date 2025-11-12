import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspace';
import memberRoutes from './routes/member';
import taskRoutes from './routes/task';
import workflowRoutes from './routes/workflow';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Align Backend is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces', memberRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/workflows', workflowRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Prisma Studio: http://localhost:5555`);
  console.log(`🌐 CORS enabled for: ${FRONTEND_URL}`);
});
