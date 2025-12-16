# Usage Guide: Enhanced Timetable Extraction System

## Quick Start

The system now automatically handles various timetable formats. No configuration changes are required!

## Supported File Formats

Upload any of these file types:
- **Images**: PNG, JPEG (using OCR)
- **Documents**: PDF, DOCX, DOC

## Supported Timetable Formats

### 1. Grid-Based Timetables ✅
Traditional school timetables with days in rows and time slots in columns.

**Example:**
```
Little Thurrock Primary School
Class: 2EJ    Term: Autumn 2024    Teacher: Miss Joynes

         9:00-10:00    10:00-11:00    11:00-12:00
Monday   Maths         English        Science
Tuesday  English       Maths          History
```

**What's extracted:**
- School name: "Little Thurrock Primary School"
- Class: "2EJ"
- Term: "Autumn 2024"
- Teacher: "Miss Joynes"
- All schedule entries with day, time, and subject

### 2. List-Based Schedules ✅
Sequential lists of activities with times.

**Example:**
```
Daily Schedule - Monday
1. 9:00 AM - Morning Meeting
2. 9:30 AM - Reading Workshop
3. 10:30 AM - Math
```

**What's extracted:**
- All time slots and activities in order
- Day information
- Activity names

### 3. Mixed Format Timetables ✅
Combination of grid and list elements.

**Example:**
```
Reception Timetable

Daily routine:
8:40 - Registration
9:00 - Story time

     9:15-10:45    11:00-11:30
M    Readers       Outside Play
Tu   Reading       PE
```

**What's extracted:**
- Both list and grid components
- All time slots and activities
- Day abbreviations handled automatically

## Time Format Support

The system preserves your original time format:

### 12-Hour Format
- `9:00 AM`, `2:30 PM`
- `9:00am`, `2:30pm`
- `9:00 a.m.`, `2:30 p.m.`

### 24-Hour Format
- `09:00`, `14:30`
- `9:00`, `14:30`

### Time Ranges
- `9:00-10:00`
- `9:00 - 10:00`
- `9:00-10:00 AM`
- `9:00 AM - 10:00 AM`

### Period Format
- `Period 1`, `P1`

## Day Format Support

The system recognizes all these day formats:

### Full Names
`Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`

### Abbreviations
`Mon`, `Tue`, `Wed`, `Thu`, `Fri`

### Single Letters
`M`, `T`, `W`, `Th`, `F`

## API Usage

### Upload and Extract Timetable

**Endpoint:** `POST /api/process`

**Request:**
```bash
curl -X POST http://localhost:3000/api/process \
  -F "file=@timetable.pdf"
```

**Response:**
```json
{
  "id": 1,
  "filename": "timetable.pdf",
  "file_type": "application/pdf",
  "extracted_data": {
    "title": "Class Timetable",
    "metadata": {
      "schoolName": "Little Thurrock Primary School",
      "className": "2EJ",
      "term": "Autumn 2024",
      "teacher": "Miss Joynes"
    },
    "entries": [
      {
        "day": "Monday",
        "time": "9:00-10:00",
        "subject": "Maths",
        "room": "Room 5",
        "instructor": "Mr. Smith",
        "notes": "Bring calculator"
      },
      {
        "day": "Monday",
        "time": "10:00-11:00",
        "subject": "English",
        "room": "Room 3"
      }
    ]
  },
  "confidence_score": 92,
  "verification_status": "VERIFIED",
  "created_at": "2024-01-01T10:00:00Z"
}
```

## Response Fields Explained

### Root Level
- `id`: Database record ID
- `filename`: Original uploaded filename
- `file_type`: MIME type of uploaded file
- `extracted_data`: Parsed timetable (see below)
- `confidence_score`: Extraction confidence (0-100)
- `verification_status`: "VERIFIED" or "FAILED"
- `created_at`: Timestamp of extraction

### Extracted Data
- `title`: Timetable title (optional)
- `metadata`: Header information (optional)
  - `schoolName`: School/institution name
  - `className`: Class/grade identifier
  - `term`: Term/semester
  - `week`: Week number
  - `teacher`: Teacher name
  - `academicYear`: Academic year
- `entries`: Array of timetable entries

### Entry Fields
- `day`: Day of the week (required)
- `time`: Time or time range (required)
- `subject`: Subject/activity name (required)
- `room`: Room number/location (optional)
- `instructor`: Teacher/instructor name (optional)
- `notes`: Additional details (optional)
- `duration`: Duration in minutes (optional)

## Examples from Provided Files

### Example 1: Little Thurrock Primary School (Images 1.1, 1.2)

**Format:** Grid-based with colored cells

**Extracted Structure:**
```json
{
  "metadata": {
    "schoolName": "Little Thurrock Primary School",
    "className": "2EJ",
    "term": "Autumn 2 2024",
    "teacher": "Miss Joynes"
  },
  "entries": [
    {
      "day": "Monday",
      "time": "8:30-9:00",
      "subject": "Registration and Early Work"
    },
    {
      "day": "Monday",
      "time": "9:30-10:30",
      "subject": "Maths"
    },
    {
      "day": "Monday",
      "time": "1:15-2:00",
      "subject": "Lunch"
    },
    {
      "day": "Monday",
      "time": "2:00-3:00",
      "subject": "Computing"
    }
  ]
}
```

### Example 2: Daily Schedule (PDF)

**Format:** List-based with three columns

**Extracted Structure:**
```json
{
  "title": "Daily Schedule",
  "entries": [
    {
      "day": "Monday",
      "time": "8:30",
      "subject": "Students are allowed inside"
    },
    {
      "day": "Monday",
      "time": "9:00-9:45",
      "subject": "Morning Work"
    },
    {
      "day": "Wednesday",
      "time": "9:00",
      "subject": "Late Bell Rings"
    }
  ]
}
```

### Example 3: Reception Timetable (Image)

**Format:** Mixed format with single-letter days

**Extracted Structure:**
```json
{
  "title": "Reception timetable January 2025",
  "entries": [
    {
      "day": "M",
      "time": "9:15-10:45",
      "subject": "Readers and reading champions"
    },
    {
      "day": "M",
      "time": "11:00-11:30",
      "subject": "Outside Play"
    },
    {
      "day": "M",
      "time": "1:15",
      "subject": "Jigsaw"
    }
  ]
}
```

### Example 4: 4M Class Timetable (PDF)

**Format:** Grid with abbreviated days

**Extracted Structure:**
```json
{
  "metadata": {
    "className": "4M"
  },
  "entries": [
    {
      "day": "Mon",
      "time": "8.45-8.55",
      "subject": "Register"
    },
    {
      "day": "Mon",
      "time": "8.55-10.10",
      "subject": "Spellings/English"
    },
    {
      "day": "Mon",
      "time": "1.40-2.30",
      "subject": "Swimming / Bedrock & TTRS",
      "notes": "1.15-3PM"
    }
  ]
}
```

## Best Practices

### For Best Results

1. **Use High-Quality Images**
   - 300 DPI or higher recommended
   - Clear, well-lit photos
   - Avoid shadows and glare

2. **Prefer Text-Based PDFs**
   - Text PDFs extract more accurately than scanned images
   - Original digital files work best

3. **Include Metadata**
   - Add school name, class, term at the top
   - System automatically extracts this information

4. **Consistent Formatting**
   - While system handles various formats, consistency helps
   - Clear time slot labels improve accuracy

### File Size Limits

- Maximum file size: **5MB**
- Supported types: PDF, PNG, JPEG, DOCX, DOC

## Confidence Scores

The system provides a confidence score (0-100) for each extraction:

- **90-100**: Excellent - Highly accurate extraction
- **80-89**: Good - Reliable extraction with minor potential issues
- **70-79**: Fair - Acceptable but may need review
- **Below 70**: Poor - Extraction rejected, needs manual review

**Note:** Extractions with confidence below 70% are automatically rejected.

## Error Handling

### Common Issues and Solutions

**Error: "Confidence score too low"**
- **Cause:** Poor image quality or unclear text
- **Solution:** Use higher quality image or better lighting

**Error: "Unsupported file type"**
- **Cause:** File format not supported
- **Solution:** Convert to PDF, PNG, or JPEG

**Error: "File too large"**
- **Cause:** File exceeds 5MB limit
- **Solution:** Compress image or split into multiple files

## Testing the System

Run the format detection test:

```bash
npx ts-node test-format-detection.ts
```

This demonstrates:
- Format detection (grid/list/mixed)
- Day format detection (full/abbreviated/single)
- Time format detection (12h/24h/period)
- Text cleaning capabilities

## Integration Examples

### JavaScript/TypeScript
```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/process', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Extracted timetable:', result.extracted_data);
```

### Python
```python
import requests

files = {'file': open('timetable.pdf', 'rb')}
response = requests.post('http://localhost:3000/api/process', files=files)
result = response.json()
print('Extracted timetable:', result['extracted_data'])
```

### cURL
```bash
curl -X POST http://localhost:3000/api/process \
  -F "file=@/path/to/timetable.pdf" \
  | jq '.extracted_data'
```

## Advanced Features

### Format Detection

The system automatically:
1. Detects timetable format (grid/list/mixed)
2. Identifies day format (full/abbreviated/single letter)
3. Identifies time format (12h/24h/period)
4. Extracts metadata (school, class, term, teacher)
5. Cleans and preprocesses text for better accuracy

You can see detection results in the server console logs:

```
Format detected: {
  formatType: 'grid',
  hasMetadata: true,
  dayFormat: 'full',
  timeFormat: '12hour',
  confidence: 0.8
}
```

## Troubleshooting

### Low Confidence Scores

If you consistently get low confidence scores:

1. Check image quality
2. Ensure text is readable
3. Verify file format is supported
4. Check for proper metadata headers
5. Review API response for specific issues

### Missing Metadata

If metadata isn't extracted:

1. Ensure headers are at the top of the document
2. Use standard labels: "School:", "Class:", "Term:", "Teacher:"
3. Check that text is clear and readable

### Incorrect Time Parsing

The system preserves original time formats. If times appear incorrect:

1. Verify source document has correct times
2. Check for OCR errors in image-based uploads
3. Use clearer time format (e.g., "9:00-10:00")

## Support

For issues or questions:
1. Check `/TIMETABLE_FORMATS.md` for format details
2. Review `/ENHANCEMENT_SUMMARY.md` for technical details
3. Run test script to verify system functionality
4. Check server logs for detailed error messages

## What's Next?

The system is ready to handle the example timetable formats you provided. Simply:

1. Start the server: `npm start` (or your start command)
2. Upload any timetable file
3. Receive structured JSON data
4. Integrate into your application

The enhanced system will automatically detect and handle various formats without any additional configuration!
