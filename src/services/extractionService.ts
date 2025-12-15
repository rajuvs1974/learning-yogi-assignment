import fs from 'fs';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
const WordExtractor = require('word-extractor');
import { LLMFactory } from '../factories/llmFactory';
import { query } from '../db';
import { TimetablePreprocessor } from '../utils/preprocessor';

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
            // Enhanced OCR configuration for better table detection
            const result = await Tesseract.recognize(file.path, 'eng', {
                logger: undefined, // Disable logging for cleaner output
            });
            text = result.data.text;
        } else {
            throw new Error('Unsupported file type');
        }

        // 2. Preprocess the extracted text
        const { processedText, format } = TimetablePreprocessor.preprocess(text, true);

        console.log('Format detected:', format);

        // 3. Extract Timetable using OpenAI (or primary LLM)
        const extractor = LLMFactory.getProvider('openai');
        const extractedData = await extractor.extractTimetable(processedText);

        // 4. Verify using Claude (or secondary LLM)
        const verifier = LLMFactory.getProvider('claude');
        const verification = await verifier.verifyExtraction(text, extractedData);

        // 5. Check Confidence
        if (verification.confidence < 0.7) {
            throw new Error(`Confidence score too low: ${verification.confidence}%`);
        }

        // 6. Save to DB with format metadata
        const result = await query(
            'INSERT INTO extractions (filename, file_type, extracted_data, confidence_score, verification_status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [file.originalname, file.mimetype, extractedData, verification.confidence, 'VERIFIED']
        );

        return result.rows[0];
    }
}
