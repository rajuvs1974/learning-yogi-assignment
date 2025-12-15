# Timetable Format Support Documentation

## Overview

The system has been enhanced to handle various timetable formats commonly found in educational institutions. The enhancements support multiple layout styles, time formats, day representations, and metadata structures.

## Supported Timetable Formats

### 1. Grid-Based Timetables (Format Type: `grid`)

**Description:** Traditional timetable layout with days in rows and time slots in columns (or vice versa).

**Examples:**
- Little Thurrock Primary School format (Examples 1.1, 1.2)
- 4M Class timetable format (Example from PDF)

**Characteristics:**
- Days organized in rows/columns
- Time slots in headers or cells
- Subjects placed in grid cells
- May include colored cells
- Often contains metadata header (school name, class, term, teacher)

**Supported Elements:**
- School name
- Class/Grade identifier
- Term/Semester information
- Week number
- Teacher name
- Time ranges in cells
- Subject names with additional details
- Break/lunch/assembly periods
- Registration times

### 2. List-Based Timetables (Format Type: `list`)

**Description:** Sequential list of activities with times.

**Examples:**
- Daily Schedule format (Example 2 - three-column layout)

**Characteristics:**
- Numbered or bulleted items
- Time followed by activity description
- Linear, sequential layout
- May have multiple columns for different days

**Supported Elements:**
- Time slots
- Activity/subject names
- Sequential ordering
- Multiple day columns

### 3. Mixed Format Timetables (Format Type: `mixed`)

**Description:** Combination of grid and list elements.

**Examples:**
- Reception timetable (Example 3)

**Characteristics:**
- Grid structure with some list-like elements
- May contain handwritten notes
- Flexible cell content
- Irregular time slots

**Supported Elements:**
- All grid elements
- All list elements
- Free-form notes
- Irregular schedules

## Time Format Support

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
- `Period 1-2`

## Day Format Support

### Full Day Names
- `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`, `Sunday`

### 3-Letter Abbreviations
- `Mon`, `Tue`/`Tues`, `Wed`, `Thu`/`Thur`/`Thurs`, `Fri`, `Sat`, `Sun`

### Single Letter
- `M`, `T`, `W`, `Th`, `F`

### Day Ranges
- `Monday-Friday`
- `Mon-Fri`

## Enhanced Data Schema

### Timetable Entry Structure

```typescript
{
  day: string,              // Day of week (any format)
  time: string,             // Time or time range (any format)
  subject: string,          // Subject/activity name
  room?: string,            // Optional room/location
  instructor?: string,      // Optional teacher name
  notes?: string,           // Optional additional details
  duration?: string         // Optional duration
}
```

### Metadata Structure

```typescript
{
  schoolName?: string,      // School/institution name
  className?: string,       // Class/grade identifier
  term?: string,            // Term/semester info
  week?: string,            // Week number
  teacher?: string,         // Teacher name
  academicYear?: string     // Academic year
}
```

### Complete Timetable Structure

```typescript
{
  title?: string,           // Timetable title
  metadata?: {              // Metadata object
    schoolName?: string,
    className?: string,
    term?: string,
    week?: string,
    teacher?: string,
    academicYear?: string
  },
  entries: [                // Array of timetable entries
    {
      day: string,
      time: string,
      subject: string,
      room?: string,
      instructor?: string,
      notes?: string,
      duration?: string
    }
  ]
}
```

## Format Detection System

The system includes an intelligent preprocessing pipeline that:

1. **Detects Format Type**
   - Identifies grid, list, or mixed layouts
   - Analyzes text patterns and structure
   - Returns confidence score

2. **Identifies Day Format**
   - Full names, abbreviations, or single letters
   - Handles mixed formats

3. **Identifies Time Format**
   - 12-hour, 24-hour, or period-based
   - Handles mixed formats

4. **Cleans Text**
   - Removes excessive whitespace
   - Normalizes line breaks
   - Removes OCR artifacts
   - Removes page numbers

5. **Adds Format Hints**
   - Provides context to LLM
   - Improves extraction accuracy

## Enhanced LLM Extraction

### Key Improvements

1. **Comprehensive Instructions**: The LLM receives detailed instructions on handling multiple formats
2. **Format Context**: Detected format information is provided as context
3. **Flexible Schema**: Supports optional fields for various data elements
4. **Metadata Extraction**: Automatically extracts header information
5. **Robust Time Handling**: Preserves original time formats
6. **Complete Coverage**: Extracts ALL entries including breaks, registration, etc.

### Extraction Providers

- **Primary**: OpenAI GPT-4o
- **Alternative**: DeepSeek
- **Verification**: Claude (Anthropic)
- **Testing**: Mock Provider

## File Format Support

### Images
- **PNG** (`.png`)
- **JPEG** (`.jpg`, `.jpeg`)
- **Processing**: Tesseract.js OCR with enhanced configuration

### Documents
- **PDF** (`.pdf`) - Using pdf-parse
- **DOCX** (`.docx`) - Using mammoth
- **DOC** (`.doc`) - Using word-extractor

## Usage Examples

### Example 1: Grid-Based Timetable
**Input**: Image of Little Thurrock Primary School timetable

**Extracted Data**:
```json
{
  "title": "Little Thurrock Primary School Timetable",
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
    ...
  ]
}
```

### Example 2: List-Based Timetable
**Input**: PDF with daily schedule list

**Extracted Data**:
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
    ...
  ]
}
```

## Configuration

No additional configuration required. The system automatically:
- Detects format
- Selects appropriate processing pipeline
- Applies format-specific enhancements
- Validates extracted data

## API Response

The API returns the extracted timetable data along with:
- Confidence score (0-100)
- Verification status (VERIFIED/FAILED)
- Original filename and file type
- Extraction timestamp

## Error Handling

### Low Confidence
If confidence score is below 70%, the extraction is rejected with an error message indicating the score.

### Format Detection
If format cannot be detected with high confidence, the system still attempts extraction but may have reduced accuracy.

### OCR Issues
For images with poor quality, OCR may produce incomplete text. Enhanced preprocessing helps mitigate this.

## Best Practices

1. **Image Quality**: Use high-resolution images for better OCR results
2. **PDF Format**: Prefer text-based PDFs over scanned images when possible
3. **Consistent Formatting**: While the system handles various formats, consistent formatting improves accuracy
4. **Metadata**: Include header information (school, class, teacher) in the document

## Testing

The system has been designed to handle the following example formats:
- ✓ Grid timetables with colored cells
- ✓ Multi-week timetables
- ✓ List-based schedules
- ✓ Mixed format timetables
- ✓ Various time formats (12h, 24h, ranges)
- ✓ Various day formats (full, abbreviated, single letter)
- ✓ Metadata extraction (school, class, term, teacher)
- ✓ Special activities (breaks, assembly, registration)

## Future Enhancements

Potential improvements for future versions:
- Multi-page timetable support
- Term/semester scheduling
- Teacher assignment tracking
- Room allocation management
- Conflict detection
- Timetable validation rules
- Export to various formats (iCal, CSV, Excel)
