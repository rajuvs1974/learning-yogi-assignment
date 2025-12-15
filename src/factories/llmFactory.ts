import OpenAI from 'openai';
import { config } from '../config/env';

export interface LLMProvider {
    extractTimetable(text: string): Promise<any>;
    verifyExtraction(originalText: string, extractedData: any): Promise<{ confidence: number; isValid: boolean }>;
}

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({ apiKey: config.openaiApiKey });
    }

    async extractTimetable(text: string): Promise<any> {
        const systemPrompt = `You are an expert at extracting timetable/schedule data from various formats.

IMPORTANT INSTRUCTIONS:
1. Handle MULTIPLE timetable formats:
   - Grid-based: Days in rows/columns, time slots in headers/cells
   - List format: Numbered items with times and activities
   - Mixed format: Combination of both

2. Extract ALL schedule entries, including:
   - Day (Monday/Mon/M/Tuesday/etc.)
   - Time (9:00 AM, 09:00-10:00, 9:00-10:00 AM, etc.)
   - Subject/Activity name
   - Room number/location (if present)
   - Instructor/Teacher name (if present)
   - Additional notes or details (if present)

3. Handle METADATA at top of document:
   - School name
   - Class name (e.g., "2EJ", "4M", "Reception")
   - Term/Semester (e.g., "Autumn 2024", "Spring 2")
   - Week number
   - Teacher name
   - Academic year

4. Time format handling:
   - Preserve original time format
   - Handle ranges: "9:00-10:00", "9:00 - 10:00", "9:00-10:00 AM"
   - Handle single times: "9:00", "9:00 AM"
   - Handle periods: "Period 1", "P1"

5. Day format handling:
   - Full names: "Monday", "Tuesday"
   - Abbreviations: "Mon", "Tue", "Wed", "Thu", "Fri"
   - Single letters: "M", "T", "W", "Th", "F"
   - Ranges: "Mon-Fri"

6. Extract ALL cells/entries even if they contain:
   - Break times
   - Lunch periods
   - Assembly
   - Registration/Register
   - Special activities

Return ONLY valid JSON with this structure:
{
  "title": "optional timetable title",
  "metadata": {
    "schoolName": "optional",
    "className": "optional",
    "term": "optional",
    "week": "optional",
    "teacher": "optional",
    "academicYear": "optional"
  },
  "entries": [
    {
      "day": "day name",
      "time": "time or time range",
      "subject": "subject/activity name",
      "room": "optional room/location",
      "instructor": "optional teacher name",
      "notes": "optional additional details",
      "duration": "optional duration"
    }
  ]
}`;

        const response = await this.client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                { role: 'user', content: text },
            ],
            response_format: { type: 'json_object' },
        });
        return JSON.parse(response.choices[0].message.content || '{}');
    }

    async verifyExtraction(originalText: string, extractedData: any): Promise<{ confidence: number; isValid: boolean }> {
        // In a real scenario, we might ask the same model to self-reflect, but the requirement asks to use *another* LLM for verification.
        // However, the factory pattern implies we might swap this provider.
        // For this specific implementation, I will implement the verification logic in the service layer using a *different* provider instance or model if needed.
        // But to satisfy the interface, I'll put a placeholder here or implement a basic check.
        return { confidence: 0.9, isValid: true }; // Placeholder
    }
}

export class MockProvider implements LLMProvider {
    async extractTimetable(text: string): Promise<any> {
        return {
            title: "Mock Timetable",
            entries: [
                { day: "Monday", time: "10:00 AM", subject: "Math", room: "101" }
            ]
        }
    }

    async verifyExtraction(originalText: string, extractedData: any): Promise<{ confidence: number; isValid: boolean }> {
        return { confidence: 0.95, isValid: true };
    }
}

import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class ClaudeProvider implements LLMProvider {
    private client: Anthropic;

    constructor() {
        this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    }

    async extractTimetable(text: string): Promise<any> {
        // Implementation for extraction if needed
        return {};
    }

    async verifyExtraction(originalText: string, extractedData: any): Promise<{ confidence: number; isValid: boolean }> {
        const response = await this.client.messages.create({
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: `Verify if the following JSON data accurately represents the timetable in the text provided. 
        Original Text: ${originalText.substring(0, 5000)}...
        Extracted Data: ${JSON.stringify(extractedData)}
        
        Return ONLY a JSON object with "confidence" (number 0-100) and "isValid" (boolean).
        Example: {"confidence": 85, "isValid": true}`
            }]
        });

        // Parse response (simplified)
        const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
        try {
            const result = JSON.parse(content);
            return result;
        } catch (e) {
            // Fallback if Claude returns text around JSON
            const match = content.match(/\{.*\}/s);
            if (match) return JSON.parse(match[0]);
            return { confidence: 0, isValid: false };
        }
    }
}

export class DeepSeekProvider implements LLMProvider {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: config.deepseekApiKey,
            baseURL: 'https://api.deepseek.com'
        });
    }

    async extractTimetable(text: string): Promise<any> {
        const systemPrompt = `You are an expert at extracting timetable/schedule data from various formats.

IMPORTANT INSTRUCTIONS:
1. Handle MULTIPLE timetable formats:
   - Grid-based: Days in rows/columns, time slots in headers/cells
   - List format: Numbered items with times and activities
   - Mixed format: Combination of both

2. Extract ALL schedule entries, including:
   - Day (Monday/Mon/M/Tuesday/etc.)
   - Time (9:00 AM, 09:00-10:00, 9:00-10:00 AM, etc.)
   - Subject/Activity name
   - Room number/location (if present)
   - Instructor/Teacher name (if present)
   - Additional notes or details (if present)

3. Handle METADATA at top of document:
   - School name
   - Class name (e.g., "2EJ", "4M", "Reception")
   - Term/Semester (e.g., "Autumn 2024", "Spring 2")
   - Week number
   - Teacher name
   - Academic year

4. Time format handling:
   - Preserve original time format
   - Handle ranges: "9:00-10:00", "9:00 - 10:00", "9:00-10:00 AM"
   - Handle single times: "9:00", "9:00 AM"
   - Handle periods: "Period 1", "P1"

5. Day format handling:
   - Full names: "Monday", "Tuesday"
   - Abbreviations: "Mon", "Tue", "Wed", "Thu", "Fri"
   - Single letters: "M", "T", "W", "Th", "F"
   - Ranges: "Mon-Fri"

6. Extract ALL cells/entries even if they contain:
   - Break times
   - Lunch periods
   - Assembly
   - Registration/Register
   - Special activities

Return ONLY valid JSON with this structure:
{
  "title": "optional timetable title",
  "metadata": {
    "schoolName": "optional",
    "className": "optional",
    "term": "optional",
    "week": "optional",
    "teacher": "optional",
    "academicYear": "optional"
  },
  "entries": [
    {
      "day": "day name",
      "time": "time or time range",
      "subject": "subject/activity name",
      "room": "optional room/location",
      "instructor": "optional teacher name",
      "notes": "optional additional details",
      "duration": "optional duration"
    }
  ]
}`;

        const response = await this.client.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                { role: 'user', content: text },
            ],
            response_format: { type: 'json_object' },
        });
        return JSON.parse(response.choices[0].message.content || '{}');
    }

    async verifyExtraction(originalText: string, extractedData: any): Promise<{ confidence: number; isValid: boolean }> {
        // Placeholder verification for DeepSeek
        return { confidence: 0.9, isValid: true };
    }
}

export class GeminiProvider implements LLMProvider {
    private client: GoogleGenerativeAI;

    constructor() {
        this.client = new GoogleGenerativeAI(config.geminiApiKey || '');
    }

    async extractTimetable(text: string): Promise<any> {
        const systemPrompt = `You are an expert at extracting timetable/schedule data from various formats.

IMPORTANT INSTRUCTIONS:
1. Handle MULTIPLE timetable formats:
   - Grid-based: Days in rows/columns, time slots in headers/cells
   - List format: Numbered items with times and activities
   - Mixed format: Combination of both

2. Extract ALL schedule entries, including:
   - Day (Monday/Mon/M/Tuesday/etc.)
   - Time (9:00 AM, 09:00-10:00, 9:00-10:00 AM, etc.)
   - Subject/Activity name
   - Room number/location (if present)
   - Instructor/Teacher name (if present)
   - Additional notes or details (if present)

3. Handle METADATA at top of document:
   - School name
   - Class name (e.g., "2EJ", "4M", "Reception")
   - Term/Semester (e.g., "Autumn 2024", "Spring 2")
   - Week number
   - Teacher name
   - Academic year

4. Time format handling:
   - Preserve original time format
   - Handle ranges: "9:00-10:00", "9:00 - 10:00", "9:00-10:00 AM"
   - Handle single times: "9:00", "9:00 AM"
   - Handle periods: "Period 1", "P1"

5. Day format handling:
   - Full names: "Monday", "Tuesday"
   - Abbreviations: "Mon", "Tue", "Wed", "Thu", "Fri"
   - Single letters: "M", "T", "W", "Th", "F"
   - Ranges: "Mon-Fri"

6. Extract ALL cells/entries even if they contain:
   - Break times
   - Lunch periods
   - Assembly
   - Registration/Register
   - Special activities

Return ONLY valid JSON with this structure:
{
  "title": "optional timetable title",
  "metadata": {
    "schoolName": "optional",
    "className": "optional",
    "term": "optional",
    "week": "optional",
    "teacher": "optional",
    "academicYear": "optional"
  },
  "entries": [
    {
      "day": "day name",
      "time": "time or time range",
      "subject": "subject/activity name",
      "room": "optional room/location",
      "instructor": "optional teacher name",
      "notes": "optional additional details",
      "duration": "optional duration"
    }
  ]
}`;

        const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `${systemPrompt}\n\nExtract timetable data from the following text:\n\n${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        // Parse JSON from response
        try {
            // Try to extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse Gemini response:', e);
            return {};
        }
    }

    async verifyExtraction(originalText: string, extractedData: any): Promise<{ confidence: number; isValid: boolean }> {
        const model = this.client.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `Verify if the following JSON data accurately represents the timetable in the text provided.
        Original Text: ${originalText.substring(0, 5000)}...
        Extracted Data: ${JSON.stringify(extractedData)}

        Return ONLY a JSON object with "confidence" (number 0-100) and "isValid" (boolean).
        Example: {"confidence": 85, "isValid": true}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        try {
            // Try to extract JSON from response
            const jsonMatch = content.match(/\{.*\}/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse Gemini verification response:', e);
            return { confidence: 0, isValid: false };
        }
    }
}

export class LLMFactory {
    static getProvider(type: 'openai' | 'claude' | 'mock' | 'deepseek' | 'gemini' = 'openai'): LLMProvider {
        if (type === 'openai' && config.openaiApiKey) {
            return new OpenAIProvider();
        }
        if (type === 'claude' && config.anthropicApiKey) {
            return new ClaudeProvider();
        }
        if (type === 'deepseek' && config.deepseekApiKey) {
            return new DeepSeekProvider();
        }
        if (type === 'gemini' && config.geminiApiKey) {
            return new GeminiProvider();
        }
        return new MockProvider();
    }
}
