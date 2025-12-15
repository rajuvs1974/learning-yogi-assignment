import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    llmProvider: (process.env.LLM_PROVIDER || 'openai') as 'openai' | 'claude' | 'deepseek' | 'gemini' | 'mock',
    openaiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    postgresUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
};
