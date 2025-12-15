import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    postgresUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/Timetable',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
};
