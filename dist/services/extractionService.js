"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionService = void 0;
const fs_1 = __importDefault(require("fs"));
const pdfParse = require('pdf-parse');
const mammoth_1 = __importDefault(require("mammoth"));
const tesseract_js_1 = __importDefault(require("tesseract.js"));
const llmFactory_1 = require("../factories/llmFactory");
const db_1 = require("../db");
class ExtractionService {
    async processFile(file) {
        let text = '';
        // 1. Extract Text
        if (file.mimetype === 'application/pdf') {
            const dataBuffer = fs_1.default.readFileSync(file.path);
            const data = await pdfParse(dataBuffer);
            text = data.text;
        }
        else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth_1.default.extractRawText({ path: file.path });
            text = result.value;
        }
        else if (file.mimetype.startsWith('image/')) {
            const result = await tesseract_js_1.default.recognize(file.path, 'eng');
            text = result.data.text;
        }
        else {
            throw new Error('Unsupported file type');
        }
        // 2. Extract Timetable using OpenAI (or primary LLM)
        const extractor = llmFactory_1.LLMFactory.getProvider('openai');
        const extractedData = await extractor.extractTimetable(text);
        // 3. Verify using Claude (or secondary LLM)
        const verifier = llmFactory_1.LLMFactory.getProvider('claude');
        const verification = await verifier.verifyExtraction(text, extractedData);
        // 4. Check Confidence
        if (verification.confidence < 70) {
            throw new Error(`Confidence score too low: ${verification.confidence}%`);
        }
        // 5. Save to DB
        const result = await (0, db_1.query)('INSERT INTO extractions (filename, file_type, extracted_data, confidence_score, verification_status) VALUES ($1, $2, $3, $4, $5) RETURNING *', [file.originalname, file.mimetype, extractedData, verification.confidence, 'VERIFIED']);
        return result.rows[0];
    }
}
exports.ExtractionService = ExtractionService;
