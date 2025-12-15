import fs from 'fs';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
const WordExtractor = require('word-extractor');
import { LLMFactory } from '../factories/llmFactory';
import { query } from '../db';
import { TimetablePreprocessor } from '../utils/preprocessor';
import OpenAI from 'openai';
import { config } from '../config/env';

export class ExtractionService {
    async processFile(file: Express.Multer.File) {
        let text = '';

        // 1. Extract Text
        if (file.mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            const data = await pdfParse(dataBuffer);
            text = data.text;

            // If PDF has no text (scanned PDF), use OpenAI vision API for OCR
            if (!text || text.trim().length < 50) {
                console.log('PDF appears to be scanned or has minimal text. Using OpenAI OCR...');

                const openaiClient = new OpenAI({
                    apiKey: config.openaiApiKey
                });

                // Convert PDF to base64
                const base64Pdf = dataBuffer.toString('base64');
                const pdfUrl = `data:application/pdf;base64,${base64Pdf}`;

                const response = await openaiClient.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'You are viewing a PDF document containing a timetable/schedule. Please read all the text visible in this document and transcribe it exactly as shown, including headers, time slots, day names, subject names, and any other text. Preserve the table structure and layout in your transcription. Do not provide instructions on how to extract text - just transcribe what you see.'
                                },
                                {
                                    type: 'image_url',
                                    image_url: { url: pdfUrl }
                                }
                            ]
                        }
                    ]
                });

                text = response.choices[0].message.content || '';
            }
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ path: file.path });
            text = result.value;
        } else if (file.mimetype === 'application/msword') {
            const extractor = new WordExtractor();
            const extracted = await extractor.extract(file.path);
            text = extracted.getBody();
        } else if (file.mimetype.startsWith('image/')) {
            // Use OpenAI vision API for OCR
            const openaiClient = new OpenAI({
                apiKey: config.openaiApiKey
            });

            // Read image and convert to base64
            const imageBuffer = fs.readFileSync(file.path);
            const base64Image = imageBuffer.toString('base64');
            const imageUrl = `data:${file.mimetype};base64,${base64Image}`;

            const response = await openaiClient.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'You are viewing an image containing a timetable/schedule. Please read all the text visible in this image and transcribe it exactly as shown, including headers, time slots, day names, subject names, and any other text. Preserve the table structure and layout in your transcription. Do not provide instructions on how to extract text - just transcribe what you see.'
                            },
                            {
                                type: 'image_url',
                                image_url: { url: imageUrl }
                            }
                        ]
                    }
                ]
            });

            text = response.choices[0].message.content || '';
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
