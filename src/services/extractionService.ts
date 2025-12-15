import fs from 'fs';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
const WordExtractor = require('word-extractor');
import { LLMFactory } from '../factories/llmFactory';
import { query } from '../db';

export class ExtractionService {
    async processFile(file: Express.Multer.File) {
        let text = '';

        // 1. Extract Text
        if (file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            const data = await pdfParse(dataBuffer);
            text = data.text;
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ path: file.path });
            text = result.value;
        } else if (file.mimetype === 'application/msword') {
            const extractor = new WordExtractor();
            const extracted = await extractor.extract(file.path);
            text = extracted.getBody();
        } else if (file.mimetype.startsWith('image/')) {
            const result = await Tesseract.recognize(file.path, 'eng');
            text = result.data.text;
        } else {
            throw new Error('Unsupported file type');
        }

        // 2. Extract Timetable using OpenAI (or primary LLM)
        const extractor = LLMFactory.getProvider('openai');
        const extractedData = await extractor.extractTimetable(text);

        // 3. Verify using Claude (or secondary LLM)
        const verifier = LLMFactory.getProvider('claude');
        const verification = await verifier.verifyExtraction(text, extractedData);

        // 4. Check Confidence
        if (verification.confidence < 0.7) {
            throw new Error(`Confidence score too low: ${verification.confidence}%`);
        }

        // 5. Save to DB
        const result = await query(
            'INSERT INTO extractions (filename, file_type, extracted_data, confidence_score, verification_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [file.originalname, file.mimetype, extractedData, verification.confidence, 'VERIFIED']
        );

        return result.rows[0];
    }
}
