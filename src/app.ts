import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from "express";
import swaggerUi from 'swagger-ui-express';
import { toNodeHandler } from "better-auth/node";
import { swaggerSpec } from "./swagger";
import conversationRoutes from './modules/conversation/conversation.routes';
import friendRoutes from './modules/friend/friend.routes';
import collaborationRoutes from './modules/collaboration/collaboration.routes';
import transactionRoutes from './modules/transaction/transaction.routes';
import { auth } from "./lib/auth";
import prisma from "./config/prisma";
import cors from "cors";

const app = express();

app.set('trust proxy', 1);

app.use(
  cors({    
    origin: [
      "https://api.sahabattuli.com",
      /^http:\/\/localhost:\d+$/,
    ],
    credentials: true,
  })
);

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

app.get('/', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'SahabatTuli API is running',
    });
});

app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
});

app.get('/test-supabase', async (_req: Request, res: Response) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({
            success: true,
            message: 'Berhasil terhubung ke Supabase PostgreSQL via Prisma',
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal terhubung ke Supabase PostgreSQL',
        });
    }
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/conversations', conversationRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/transactions', transactionRoutes);

export default app;