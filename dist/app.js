"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const env_1 = require("./config/env");
const api_1 = __importDefault(require("./routes/api"));
const db_1 = require("./db");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Swagger Setup
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Timetable Extraction API',
            version: '1.0.0',
            description: 'API to extract timetable from PDF/Image/DOCX',
        },
        servers: [
            {
                url: `http://localhost:${env_1.config.port}`,
            },
        ],
    },
    apis: ['./src/routes/*.ts'],
};
const specs = (0, swagger_jsdoc_1.default)(options);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
// Routes
app.use('/api', api_1.default);
// Start Server
const start = async () => {
    await (0, db_1.initDb)();
    app.listen(env_1.config.port, () => {
        console.log(`Server running on port ${env_1.config.port}`);
        console.log(`Swagger docs available at http://localhost:${env_1.config.port}/api-docs`);
    });
};
start();
