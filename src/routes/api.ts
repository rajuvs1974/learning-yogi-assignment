import { Router } from 'express';
import multer from 'multer';
import { uploadFile } from '../controllers/uploadController';

const router = Router();

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPG, PNG, and DOCX are allowed.'));
        }
    },
});

/**
 * @swagger
 * /api/process:
 *   post:
 *     summary: Upload a file to extract timetable
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: file
 *         type: file
 *         description: The file to upload (PDF, Image, DOCX)
 *     responses:
 *       200:
 *         description: Successful extraction
 *       400:
 *         description: Invalid file
 *       500:
 *         description: Server error
 */
const uploadMiddleware = (req: any, res: any, next: any) => {
    upload.single('file')(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
};

router.post('/process', uploadMiddleware, uploadFile);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API and Database health
 *     responses:
 *       200:
 *         description: System is healthy
 *       500:
 *         description: System is unhealthy
 */
import { checkHealth } from '../controllers/healthController';
router.get('/health', checkHealth);

export default router;
