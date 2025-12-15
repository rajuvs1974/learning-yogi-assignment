# Timetable Extraction API

Node.js backend to extract timetable data from PDF, Images, and DOCX files using LLMs.

## Features
- **File Upload**: Supports PDF, JPG, PNG, DOCX (max 5MB).
- **Text Extraction**: Uses `pdf-parse`, `tesseract.js`, and `mammoth`.
- **LLM Processing**: Extracts structured timetable data using OpenAI or DeepSeek (configurable).
- **Verification**: Validates extraction confidence using Claude (Anthropic).
- **Database**: Stores results in PostgreSQL.
- **Validation**: Uses Zod for schema validation.
- **Documentation**: Swagger UI available at `/api-docs`.

## Prerequisites
- Node.js (v18+)
- PostgreSQL
- OpenAI API Key
- Anthropic API Key
- DeepSeek API Key

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    DATABASE_URL=postgresql://user:password@localhost:5432/timetable_db
    OPENAI_API_KEY=your_openai_key
    ANTHROPIC_API_KEY=your_anthropic_key
    DEEPSEEK_API_KEY=your_deepseek_key
    ```

3.  **Build**
    ```bash
    npm run build
    ```

4.  **Run**
    ```bash
    npm start
    # OR for development
    npx ts-node src/app.ts
    ```

## Testing
To run the unit tests for file validation:
```bash
npm test
```

## API Endpoints

### POST /api/process
Upload a file to extract timetable.

**Body:** `multipart/form-data`
- `file`: The file to upload.

**Response:**
```json
{
  "id": 1,
  "filename": "timetable.pdf",
  "extracted_data": { ... },
  "confidence_score": 85,
  "verification_status": "VERIFIED"
}
```

### GET /api/health
Check API and Database health.

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "latency": "15ms",
  "timestamp": "2023-10-27T10:00:00.000Z"
}
```

## Architecture
- **Controllers**: Handle HTTP requests.
- **Services**: Business logic (Extraction, Verification).
- **Factories**: LLM Provider selection.
- **Schemas**: Zod validation.
