import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config/env';
import apiRoutes from './routes/api';
import { initDb } from './db';

const app = express();

app.use(cors());
app.use(express.json());

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
                url: `http://localhost:${config.port}`,
            },
        ],
    },
    apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api', apiRoutes);

// Start Server
const start = async () => {
    await initDb();
    app.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
        console.log(`Swagger docs available at http://localhost:${config.port}/api-docs`);
    });
};

if (require.main === module) {
    start();
}

export default app;
