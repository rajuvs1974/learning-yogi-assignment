/**
 * Preprocessing utility for timetable text extraction
 * Handles format detection and text cleaning for various timetable layouts
 */

export interface FormatDetectionResult {
    formatType: 'grid' | 'list' | 'mixed' | 'unknown';
    hasMetadata: boolean;
    dayFormat: 'full' | 'abbreviated' | 'single' | 'mixed';
    timeFormat: '12hour' | '24hour' | 'period' | 'mixed';
    confidence: number;
}

export class TimetablePreprocessor {
    /**
     * Detect the format type of the timetable
     */
    static detectFormat(text: string): FormatDetectionResult {
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        // Patterns for detection
        const gridIndicators = [
            // Horizontal day layout (days on same line)
            /\bMonday\b.*\bTuesday\b.*\bWednesday\b/i,
            /\bMon\b.*\bTue\b.*\bWed\b/i,
            /\|\s*Mon\s*\||\|\s*Monday\s*\|/i, // Table borders

            // Vertical day layout (days in rows with times in columns)
            /^[MTWThF]\s+.*\d{1,2}[:.]\d{2}/m, // Single letter day followed by time
            /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+.*\d{1,2}[:.]\d{2}/im, // Abbreviated day followed by time
            /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+.*\d{1,2}[:.]\d{2}/im, // Full day followed by time

            // Time slots arranged horizontally (multiple times on same line)
            /\d{1,2}[:.]\d{2}\s*-?\s*\d{1,2}[:.]\d{2}.*\d{1,2}[:.]\d{2}\s*-?\s*\d{1,2}[:.]\d{2}/, // Multiple time ranges on same line
            /\d{1,2}[:.]\d{2}.*\d{1,2}[:.]\d{2}.*\d{1,2}[:.]\d{2}/, // Three or more times on same line

            // Timetable/schedule specific patterns
            /\btimetable\b/i,
            /\bschedule\b/i,
            /\breception.*timetable/i,
        ];

        const listIndicators = [
            /^\d+\s+\d{1,2}:\d{2}/m, // Numbered list with times
            /^[•\-*]\s+\d{1,2}:\d{2}/m, // Bulleted list with times
            /^\d+\.\s+/m, // Numbered list
        ];

        const metadataIndicators = [
            /\b(School|Class|Term|Teacher|Week|Year|Reception):\s*\w+/i,
            /\bClass:\s*\w+/i,
            /\bTerm:\s*\w+/i,
            /\bTeacher:\s*\w+/i,
            /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i, // Month and year
        ];

        // Count how many grid indicators match
        let gridIndicatorCount = 0;
        for (const pattern of gridIndicators) {
            if (pattern.test(text)) {
                gridIndicatorCount++;
            }
        }

        // Check for list format
        const hasListIndicators = listIndicators.some(pattern => pattern.test(text));

        // Check for metadata
        const hasMetadata = metadataIndicators.some(pattern => pattern.test(text));

        // Determine format type with improved confidence scoring
        let formatType: 'grid' | 'list' | 'mixed' | 'unknown' = 'unknown';
        let confidence = 0.5;

        if (gridIndicatorCount > 0 && hasListIndicators) {
            formatType = 'mixed';
            confidence = 0.7;
        } else if (gridIndicatorCount >= 3) {
            // Strong evidence of grid format
            formatType = 'grid';
            confidence = 0.9;
        } else if (gridIndicatorCount >= 2) {
            // Moderate evidence of grid format
            formatType = 'grid';
            confidence = 0.8;
        } else if (gridIndicatorCount >= 1) {
            // Some evidence of grid format
            formatType = 'grid';
            confidence = 0.7;
        } else if (hasListIndicators) {
            formatType = 'list';
            confidence = 0.8;
        }

        // Boost confidence if we have metadata (indicates structured document)
        if (hasMetadata && formatType !== 'unknown') {
            confidence = Math.min(confidence + 0.1, 1.0);
        }

        // Detect day format
        const dayFormat = this.detectDayFormat(text);

        // Detect time format
        const timeFormat = this.detectTimeFormat(text);

        return {
            formatType,
            hasMetadata,
            dayFormat,
            timeFormat,
            confidence,
        };
    }

    /**
     * Detect the day name format used
     */
    private static detectDayFormat(text: string): 'full' | 'abbreviated' | 'single' | 'mixed' {
        const fullDays = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi;
        const abbreviatedDays = /\b(Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|Sat|Sun|Tu|Th)\b/gi;
        const singleLetterDays = /\b[MTWFS]\b(?!\w)/g; // M, T, W, F, S (not part of a word)

        const hasFullDays = fullDays.test(text);
        const hasAbbreviated = abbreviatedDays.test(text);
        const hasSingleLetter = singleLetterDays.test(text);

        const count = [hasFullDays, hasAbbreviated, hasSingleLetter].filter(Boolean).length;

        if (count > 1) return 'mixed';
        if (hasFullDays) return 'full';
        if (hasAbbreviated) return 'abbreviated';
        if (hasSingleLetter) return 'single';
        return 'full'; // default
    }

    /**
     * Detect the time format used
     */
    private static detectTimeFormat(text: string): '12hour' | '24hour' | 'period' | 'mixed' {
        const time12hour = /\d{1,2}[:.]\d{2}\s*(AM|PM|am|pm|a\.m\.|p\.m\.)/gi;
        const time24hour = /\b([01]?\d|2[0-3])[:.][0-5]\d\b/g;
        const periodFormat = /\b(Period|P)\s*\d+\b/gi;

        const has12hour = time12hour.test(text);
        const has24hour = time24hour.test(text) && !has12hour; // Only count as 24h if no AM/PM
        const hasPeriod = periodFormat.test(text);

        const count = [has12hour, has24hour, hasPeriod].filter(Boolean).length;

        if (count > 1) return 'mixed';
        if (has12hour) return '12hour';
        if (has24hour) return '24hour';
        if (hasPeriod) return 'period';
        return 'mixed'; // default
    }

    /**
     * Clean and normalize the extracted text
     */
    static cleanText(text: string): string {
        let cleaned = text;

        // Remove excessive whitespace
        cleaned = cleaned.replace(/\s+/g, ' ');

        // Normalize line breaks
        cleaned = cleaned.replace(/\r\n/g, '\n');
        cleaned = cleaned.replace(/\r/g, '\n');

        // Remove multiple consecutive line breaks
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

        // Remove common OCR artifacts
        cleaned = cleaned.replace(/[|│]/g, '|'); // Normalize vertical bars
        cleaned = cleaned.replace(/[—–-]{2,}/g, '-'); // Normalize dashes

        // Remove page numbers (common in PDFs)
        cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '');

        // Trim each line
        cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');

        return cleaned.trim();
    }

    /**
     * Enhance text with format hints for better LLM extraction
     */
    static addFormatHints(text: string, format: FormatDetectionResult): string {
        let hints = `[TIMETABLE FORMAT DETECTION]\n`;
        hints += `Format Type: ${format.formatType}\n`;
        hints += `Day Format: ${format.dayFormat}\n`;
        hints += `Time Format: ${format.timeFormat}\n`;
        hints += `Has Metadata: ${format.hasMetadata ? 'Yes' : 'No'}\n`;
        hints += `Confidence: ${(format.confidence * 100).toFixed(0)}%\n\n`;
        hints += `[EXTRACTED TEXT]\n`;
        hints += text;

        return hints;
    }

    /**
     * Full preprocessing pipeline
     */
    static preprocess(text: string, addHints: boolean = true): {
        processedText: string;
        format: FormatDetectionResult
    } {
        // Clean the text first
        const cleaned = this.cleanText(text);

        // Detect format
        const format = this.detectFormat(cleaned);

        // Optionally add format hints
        const processedText = addHints
            ? this.addFormatHints(cleaned, format)
            : cleaned;

        return {
            processedText,
            format,
        };
    }
}
