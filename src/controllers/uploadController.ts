import { Request, Response } from 'express';
import { ExtractionService } from '../services/extractionService';

const extractionService = new ExtractionService();

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result = await extractionService.processFile(req.file);
        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
