import request from 'supertest';
import app from '../src/app';
import path from 'path';
import fs from 'fs';

// Mock the ExtractionService
jest.mock('../src/services/extractionService', () => {
    return {
        ExtractionService: jest.fn().mockImplementation(() => {
            return {
                processFile: jest.fn().mockResolvedValue({
                    id: 1,
                    filename: 'test.pdf',
                    extracted_data: {},
                    confidence_score: 90,
                    verification_status: 'VERIFIED'
                })
            };
        })
    };
});

describe('POST /api/process - File Validation', () => {
    const testFilesDir = path.join(__dirname, 'test_files');

    beforeAll(() => {
        if (!fs.existsSync(testFilesDir)) {
            fs.mkdirSync(testFilesDir);
        }
        // Create dummy files
        fs.writeFileSync(path.join(testFilesDir, 'test.pdf'), 'dummy pdf content');
        fs.writeFileSync(path.join(testFilesDir, 'test.png'), 'dummy png content');
        fs.writeFileSync(path.join(testFilesDir, 'test.jpg'), 'dummy jpg content');
        fs.writeFileSync(path.join(testFilesDir, 'test.docx'), 'dummy docx content');
        fs.writeFileSync(path.join(testFilesDir, 'test.txt'), 'dummy txt content');

        // Create large file (> 5MB)
        const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
        fs.writeFileSync(path.join(testFilesDir, 'large.pdf'), largeBuffer);
    });

    afterAll(() => {
        // Cleanup
        if (fs.existsSync(testFilesDir)) {
            fs.rmSync(testFilesDir, { recursive: true, force: true });
        }
    });

    it('should accept PDF file', async () => {
        const res = await request(app)
            .post('/api/process')
            .attach('file', path.join(testFilesDir, 'test.pdf'));

        // Note: It might fail later in processing because content is dummy, 
        // but we are testing multer validation here. 
        // If it passes multer, it goes to controller.
        // If it fails multer, it returns 500 or 400 depending on error handling.
        // Our current error handling in api.ts returns 500 for multer errors usually unless handled.
        // But wait, the fileFilter callback returns an error.
        // Express default error handler might catch it.

        // Actually, since we are mocking the file content, the extraction service will likely fail.
        // But we want to ensure it *passed* the file type check.
        // If it failed file type check, we'd get a specific error message.

        expect(res.status).not.toBe(400); // Should not be 400 Bad Request due to file type
    });

    it('should accept PNG file', async () => {
        const res = await request(app)
            .post('/api/process')
            .attach('file', path.join(testFilesDir, 'test.png'));
        expect(res.status).not.toBe(400);
    });

    it('should accept JPG file', async () => {
        const res = await request(app)
            .post('/api/process')
            .attach('file', path.join(testFilesDir, 'test.jpg'));
        expect(res.status).not.toBe(400);
    });

    it('should accept DOCX file', async () => {
        const res = await request(app)
            .post('/api/process')
            .attach('file', path.join(testFilesDir, 'test.docx'));
        expect(res.status).not.toBe(400);
    });

    it('should reject TXT file', async () => {
        const res = await request(app)
            .post('/api/process')
            .attach('file', path.join(testFilesDir, 'test.txt'));

        // Expecting 500 because the error from multer fileFilter is passed to next(err)
        // and our global error handler in uploadController (or app.ts default) handles it.
        // Let's check the error message.
        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid file type');
    });

    it('should reject file larger than 5MB', async () => {
        const res = await request(app)
            .post('/api/process')
            .attach('file', path.join(testFilesDir, 'large.pdf'));

        // Multer throws error for size limit
        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
        // Exact message depends on multer, usually "File too large"
    });
});
