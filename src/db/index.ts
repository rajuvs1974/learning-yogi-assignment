import { Pool } from 'pg';
import { config } from '../config/env';

const pool = new Pool({
    connectionString: config.postgresUrl,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export const initDb = async () => {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS extractions (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      extracted_data JSONB,
      confidence_score FLOAT,
      verification_status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
    try {
        await pool.query(createTableQuery);
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database', err);
    }
};
