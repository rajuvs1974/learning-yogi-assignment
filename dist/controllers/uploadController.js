"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFile = void 0;
const extractionService_1 = require("../services/extractionService");
const extractionService = new extractionService_1.ExtractionService();
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const result = await extractionService.processFile(req.file);
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
exports.uploadFile = uploadFile;
