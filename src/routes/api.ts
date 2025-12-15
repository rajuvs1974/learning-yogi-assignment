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
router.post('/process', upload.single('file'), uploadFile);

export default router;
