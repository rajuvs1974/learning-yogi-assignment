# Timetable Extraction API

A Node.js/TypeScript backend API that extracts structured timetable data from PDF, Images, and DOCX files using multiple LLM providers with intelligent preprocessing and dual verification.

## Features

### File Processing
- **Multi-format Support**: PDF, JPG, PNG, DOC, DOCX (max 5MB)
- **Text Extraction**:
  - `pdf-parse` for standard PDFs
  - `mammoth` for DOCX files
  - `word-extractor` for DOC files
- **OCR for Scanned Documents**:
  - Automatically detects scanned PDFs with minimal text
  - Uses OpenAI Vision API (GPT-4o) for OCR on scanned PDFs and images
  - Preserves table structure and layout during transcription

### Intelligent Preprocessing
- **Format Detection**: Automatically identifies timetable structure
  - Grid-based layouts (horizontal/vertical days)
  - List formats
  - Mixed formats
  - Daily schedules
- **Layout Analysis**: Detects day format (full/abbreviated/single letter) and time format (12h/24h/period)
- **Common Activity Detection**: Identifies recurring patterns like Registration → Break → Lunch → Story time
- **Text Cleaning**: Normalizes whitespace, line breaks, and OCR artifacts

### LLM Processing
- **Multiple Provider Support**:
  - **OpenAI**: GPT-4o for extraction and OCR
  - **DeepSeek**: deepseek-chat model
  - **Gemini**: gemini-2.5-flash with automatic fallback to OpenAI
  - **Claude**: claude-3-opus for verification
  - **Mock**: For testing without API keys
- **Automatic Fallback**: Gemini provider automatically falls back to OpenAI if extraction fails
- **Provider Selection**: Configurable via `LLM_PROVIDER` environment variable

### Dual Verification System
- Uses a different LLM provider for verification to ensure accuracy
- If primary provider is Claude, uses Gemini for verification; otherwise uses Claude
- Confidence threshold validation (minimum 70%)

### Data Storage
- **PostgreSQL Database**: Stores extraction results with metadata
- **Automatic Schema Initialization**: Creates tables on first run
- **JSONB Storage**: Flexible storage for extracted timetable data

### API Documentation
- **Swagger UI**: Interactive API documentation at `/api-docs`
- **OpenAPI 3.0 Specification**: Fully documented endpoints

## Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (running instance)
- **API Keys** (at least one required):
  - OpenAI API Key (recommended - required for OCR)
  - Anthropic API Key (optional - for verification)
  - DeepSeek API Key (optional)
  - Google Gemini API Key (optional)

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/timetable_db

# LLM Provider Selection (openai | claude | deepseek | gemini)
LLM_PROVIDER=gemini

# API Keys (provide at least one)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
GEMINI_API_KEY=your_gemini_key_here
```

**Note**: When using `LLM_PROVIDER=gemini`, both `GEMINI_API_KEY` and `OPENAI_API_KEY` are recommended to enable the fallback mechanism.

### 3. Database Setup
The application automatically creates the required database schema on startup. Ensure your PostgreSQL instance is running and accessible via the `DATABASE_URL`.

### 4. Build the Project
```bash
npm run build
```

### 5. Run the Application

**Development mode:**
```bash
npx ts-node src/app.ts
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## Testing

Run the test suite:
```bash
npm test
```

## API Endpoints

### POST /api/process
Uploads a file and extracts timetable data.

**Request:**
- **Method**: POST
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `file`: The file to upload (PDF, JPG, PNG, DOC, DOCX)

**Response (Success - 200):**
```json
{
  "id": 1,
  "filename": "timetable.pdf",
  "file_type": "application/pdf",
  "extracted_data": {
    "title": "Weekly Timetable",
    "metadata": {
      "schoolName": "Example School",
      "className": "4M",
      "term": "Autumn 2024",
      "teacher": "Ms. Smith"
    },
    "entries": [
      {
        "day": "Monday",
        "time": "9:00-10:00",
        "subject": "Mathematics",
        "room": "Room 101",
        "instructor": "Ms. Smith",
        "notes": "Bring calculator"
      }
    ]
  },
  "confidence_score": 85.5,
  "verification_status": "VERIFIED",
  "created_at": "2024-01-27T10:00:00.000Z"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid file type or file too large
- **500 Internal Server Error**: Processing error or confidence score too low

### GET /api/health
Health check endpoint for monitoring.

**Response (Success - 200):**
```json
{
  "status": "ok",
  "database": "connected",
  "latency": "15ms",
  "timestamp": "2024-01-27T10:00:00.000Z"
}
```

## Architecture

### Project Structure
```
src/
├── app.ts                    # Application entry point
├── config/
│   └── env.ts               # Environment configuration
├── controllers/
│   ├── uploadController.ts  # File upload handling
│   └── healthController.ts  # Health check endpoint
├── services/
│   └── extractionService.ts # Core extraction logic
├── factories/
│   └── llmFactory.ts        # LLM provider factory and implementations
├── utils/
│   └── preprocessor.ts      # Format detection and text preprocessing
├── routes/
│   └── api.ts              # API route definitions
├── schemas/
│   └── timetable.ts        # Zod validation schemas
└── db/
    └── index.ts            # Database connection and initialization
```

### Key Components

**Controllers**: Handle HTTP requests, file validation, and response formatting

**ExtractionService**:
- Orchestrates the entire extraction pipeline
- Handles text extraction from various file formats
- Detects and processes scanned documents
- Coordinates LLM extraction and verification
- Manages database persistence

**LLMFactory**:
- Factory pattern for LLM provider selection
- Implements providers: OpenAI, Claude, DeepSeek, Gemini, Mock
- Handles provider-specific API calls and response parsing
- Manages fallback logic (Gemini → OpenAI)

**TimetablePreprocessor**:
- Detects timetable format and layout
- Identifies common activities and patterns
- Cleans and normalizes extracted text
- Adds helpful hints for LLM processing

**Database**: PostgreSQL with connection pooling and automatic schema management

## Supported Timetable Formats

The API intelligently handles various timetable formats:

1. **Grid-based (Horizontal Days)**: Days as column headers with time slots in rows
2. **Grid-based (Vertical Days)**: Days in rows with time slots as columns
3. **List Format**: Numbered or bulleted list with times and activities
4. **Daily Schedules**: Separate schedules for each day
5. **Mixed Formats**: Combination of the above

### Recognized Elements
- **Days**: Full names (Monday), abbreviations (Mon), single letters (M)
- **Times**: 12-hour (9:00 AM), 24-hour (09:00), periods (Period 1)
- **Metadata**: School name, class, term, teacher, academic year
- **Activities**: Subjects, breaks, lunch, registration, assembly, story time

## Recent Updates

- Implemented automatic fallback mechanism from Gemini to OpenAI when extraction fails
- Auto-select relevant API key based on configured LLM provider
- Enhanced prompts to handle complex timetable structures more efficiently
- Updated preprocessor with sequential pattern detection (Registration → Break → Lunch → Story time)
- Added support for Gemini 2.5 Flash model

## Swagger Documentation

Access interactive API documentation at:
```
http://localhost:3000/api-docs
```

## Troubleshooting

**Issue**: "Confidence score too low" error
- **Solution**: The extracted data didn't meet the 70% confidence threshold. Try using a clearer/higher quality image or PDF, or switch to a different LLM provider.

**Issue**: Database connection error
- **Solution**: Ensure PostgreSQL is running and `DATABASE_URL` is correctly configured.

**Issue**: API key errors
- **Solution**: Verify that the API keys in `.env` are valid and correspond to the selected `LLM_PROVIDER`.

**Issue**: Scanned PDF not processing
- **Solution**: Ensure `OPENAI_API_KEY` is configured, as the vision API is required for OCR.

## License

ISC

## Repository

[https://github.com/rajuvs1974/learning-yogi-assignment](https://github.com/rajuvs1974/learning-yogi-assignment)
