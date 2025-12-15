import { Request, Response } from 'express';
import { query } from '../db';

export const checkHealth = async (req: Request, res: Response) => {
    try {
        const start = Date.now();
        await query('SELECT 1');
        const duration = Date.now() - start;

        res.json({
            status: 'ok',
            database: 'connected',
            latency: `${duration}ms`,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
