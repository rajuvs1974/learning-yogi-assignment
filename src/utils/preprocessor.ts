/**
 * Preprocessing utility for timetable text extraction
 * Handles format detection and text cleaning for various timetable layouts
 */

export interface CommonActivity {
    type: 'registration' | 'break' | 'lunch' | 'storytime' | 'assembly';
    pattern: string;
    occurrences: number;
}

export interface FormatDetectionResult {
    formatType: 'grid' | 'list' | 'mixed' | 'unknown';
    layoutType?: 'horizontal-days' | 'vertical-days' | 'daily-schedules' | 'fixed-columns';
    hasMetadata: boolean;
    dayFormat: 'full' | 'abbreviated' | 'single' | 'mixed';
    timeFormat: '12hour' | '24hour' | 'period' | 'mixed';
    confidence: number;
    commonActivities: CommonActivity[];
    hasSequentialPattern: boolean;
    hasEmbeddedTimes: boolean;
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
            /^(Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|Sat|Sun)\s+.*\d{1,2}[:.]\d{2}/im, // Abbreviated day followed by time
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
            /^Daily Schedule/im, // Daily schedule headers
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

        // Detect layout type
        const layoutType = this.detectLayoutType(text);

        // Detect day format
        const dayFormat = this.detectDayFormat(text);

        // Detect time format
        const timeFormat = this.detectTimeFormat(text);

        // Detect common activities
        const commonActivities = this.detectCommonActivities(text);

        // Check for sequential pattern
        const hasSequentialPattern = this.detectSequentialPattern(commonActivities);

        // Check for embedded times
        const hasEmbeddedTimes = this.detectEmbeddedTimes(text);

        return {
            formatType,
            layoutType,
            hasMetadata,
            dayFormat,
            timeFormat,
            confidence,
            commonActivities,
            hasSequentialPattern,
            hasEmbeddedTimes,
        };
    }

    /**
     * Detect the layout type of the timetable
     */
    private static detectLayoutType(text: string): 'horizontal-days' | 'vertical-days' | 'daily-schedules' | 'fixed-columns' | undefined {
        // Horizontal days: Monday Tuesday Wednesday on same line
        const horizontalDays = /\b(Monday|Mon|M)\b.*\b(Tuesday|Tue|Tu)\b.*\b(Wednesday|Wed|W)\b/i;

        // Vertical days with times in columns: Day at start of line, multiple times on same line
        const verticalDaysPattern1 = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Wed|Thu|Fri|M|Tu|W|Th|F)\b.*\d{1,2}[:.]\d{2}.*\d{1,2}[:.]\d{2}/im;

        // Multiple day lines in sequence (vertical layout)
        const dayLines = text.split('\n').filter(line =>
            /^(Monday|Tuesday|Wednesday|Thursday|Friday|Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|M\s|Tu\s|W\s|Th\s|F\s)/i.test(line.trim())
        );

        // Daily schedule pattern: "Daily Schedule" header with numbered items
        const dailySchedule = /Daily Schedule/i.test(text) && /^\d+\s+\d{1,2}:\d{2}/m.test(text);

        // Fixed columns: Activities like "Reading", "Story time", etc. in column headers
        const fixedColumnActivities = [
            /Reading.*and.*register/i,
            /Story.*time/i,
            /Indoor.*continuous.*provision/i,
            /Outside.*Play/i,
            /Continuous.*provision/i
        ];
        const hasFixedColumns = fixedColumnActivities.filter(pattern => pattern.test(text)).length >= 2;

        if (dailySchedule) {
            return 'daily-schedules';
        } else if (hasFixedColumns && dayLines.length >= 3) {
            return 'fixed-columns';
        } else if (horizontalDays.test(text)) {
            return 'horizontal-days';
        } else if (dayLines.length >= 3 && verticalDaysPattern1.test(text)) {
            return 'vertical-days';
        }

        return undefined;
    }

    /**
     * Detect common recurring activities in timetables
     */
    private static detectCommonActivities(text: string): CommonActivity[] {
        const activities: CommonActivity[] = [];

        // Registration patterns
        const registrationPatterns = [
            /\bRegister\b/gi,
            /\bRegistration\b/gi,
            /\bReg\b(?!\w)/gi, // Reg not followed by word character
        ];
        let registrationCount = 0;
        registrationPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) registrationCount += matches.length;
        });
        if (registrationCount > 0) {
            activities.push({ type: 'registration', pattern: 'Register/Registration', occurrences: registrationCount });
        }

        // Break patterns (including B-R-E-A-K spread across cells)
        const breakPatterns = [
            /\bBreak\b/gi,
            /\bRecess\b/gi,
            /\bMorning\s+Break/gi,
            /\bB\s+R\s+E\s+A\s+K/gi, // Spread out letters
            /\bB\b.*\bR\b.*\bE\b.*\bA\b.*\bK\b/i, // BREAK pattern in grid
        ];
        let breakCount = 0;
        breakPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) breakCount += matches.length;
        });
        if (breakCount > 0) {
            activities.push({ type: 'break', pattern: 'Break/Recess', occurrences: breakCount });
        }

        // Lunch patterns (including L-U-N-C-H spread across cells)
        const lunchPatterns = [
            /\bLunch\b/gi,
            /\bL\s+U\s+N\s+C\s+H/gi, // Spread out letters
            /\bL\b.*\bU\b.*\bN\b.*\bC\b.*\bH\b/i, // LUNCH pattern in grid
        ];
        let lunchCount = 0;
        lunchPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) lunchCount += matches.length;
        });
        if (lunchCount > 0) {
            activities.push({ type: 'lunch', pattern: 'Lunch', occurrences: lunchCount });
        }

        // Story time patterns
        const storyTimePatterns = [
            /\bStory\s*time\b/gi,
            /\bStorytime\b/gi,
            /\bStory\b/gi,
            /\bTTRS.*Story/gi, // TTRS/Story pattern
        ];
        let storyTimeCount = 0;
        storyTimePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) storyTimeCount += matches.length;
        });
        if (storyTimeCount > 0) {
            activities.push({ type: 'storytime', pattern: 'Story time/Story', occurrences: storyTimeCount });
        }

        // Assembly patterns
        const assemblyPatterns = [
            /\bAssembly\b/gi,
            /\bKS[12]\s+Assembly/gi,
        ];
        let assemblyCount = 0;
        assemblyPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) assemblyCount += matches.length;
        });
        if (assemblyCount > 0) {
            activities.push({ type: 'assembly', pattern: 'Assembly', occurrences: assemblyCount });
        }

        return activities;
    }

    /**
     * Detect if timetable follows the sequential pattern: Registration → Break → Lunch → Story time
     */
    private static detectSequentialPattern(activities: CommonActivity[]): boolean {
        const hasRegistration = activities.some(a => a.type === 'registration');
        const hasBreak = activities.some(a => a.type === 'break');
        const hasLunch = activities.some(a => a.type === 'lunch');
        const hasStoryTime = activities.some(a => a.type === 'storytime');

        // Pattern is detected if at least 3 of the 4 key activities are present
        const count = [hasRegistration, hasBreak, hasLunch, hasStoryTime].filter(Boolean).length;
        return count >= 3;
    }

    /**
     * Detect if timetable has embedded time ranges within cells
     */
    private static detectEmbeddedTimes(text: string): boolean {
        // Pattern for time ranges within text (like "1:15-2:30 Science")
        // Look for activity names followed by or preceded by time ranges
        const embeddedTimePatterns = [
            /\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}\s+[A-Za-z]/i, // Time range followed by word
            /[A-Za-z]+\s+\d{1,2}[:.]\d{2}\s*-\s*\d{1,2}[:.]\d{2}/i, // Word followed by time range
            /\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}[APM]{2}/i, // Time range with AM/PM
        ];

        return embeddedTimePatterns.some(pattern => pattern.test(text));
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

        if (format.layoutType) {
            hints += `Layout Type: ${format.layoutType}\n`;
        }

        hints += `Day Format: ${format.dayFormat}\n`;
        hints += `Time Format: ${format.timeFormat}\n`;
        hints += `Has Metadata: ${format.hasMetadata ? 'Yes' : 'No'}\n`;
        hints += `Has Embedded Times: ${format.hasEmbeddedTimes ? 'Yes' : 'No'}\n`;
        hints += `Confidence: ${(format.confidence * 100).toFixed(0)}%\n`;

        // Add common activities information
        if (format.commonActivities.length > 0) {
            hints += `\n[COMMON ACTIVITIES DETECTED]\n`;
            format.commonActivities.forEach(activity => {
                hints += `- ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}: ${activity.occurrences} occurrence(s)\n`;
            });
        }

        // Add sequential pattern information
        if (format.hasSequentialPattern) {
            hints += `\n[SEQUENTIAL PATTERN]\n`;
            hints += `This timetable follows the common daily pattern:\n`;
            hints += `Registration → Break → Lunch → Story time\n`;
            hints += `Use this pattern to help structure and validate the extracted schedule.\n`;
        }

        hints += `\n[EXTRACTED TEXT]\n`;
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
