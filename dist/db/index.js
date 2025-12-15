"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = exports.query = void 0;
const pg_1 = require("pg");
const env_1 = require("../config/env");
const pool = new pg_1.Pool({
    connectionString: env_1.config.postgresUrl,
});
const query = (text, params) => pool.query(text, params);
exports.query = query;
const initDb = async () => {
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
    }
    catch (err) {
        console.error('Error initializing database', err);
    }
};
exports.initDb = initDb;
