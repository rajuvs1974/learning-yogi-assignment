import OpenAI from 'openai';
import fs from 'fs';
import { TimetablePreprocessor } from './src/utils/preprocessor';
import { config } from './src/config/env';

async function testTeacherTimetable() {
    const imagePath = '/Users/maverickai/Downloads/LearningYogi/TA Assignment Pack/Teacher Timetable Example 4.jpeg';

    console.log('Testing Teacher Timetable Example 4.jpeg...\n');

    // Step 1: Use OpenAI to extract text from the image
    const openaiClient = new OpenAI({
        apiKey: config.openaiApiKey
    });

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    console.log('Step 1: Extracting text from image using OpenAI OCR...');
    const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'You are viewing a timetable/schedule image. Please read all the text visible in this image and transcribe it exactly as shown, including the header, time slots, day names, subject names, and any other text. Preserve the table structure and layout in your transcription. Do not provide instructions on how to extract text - just transcribe what you see.'
                    },
                    {
                        type: 'image_url',
                        image_url: { url: imageUrl }
                    }
                ]
            }
        ]
    });

    const extractedText = response.choices[0].message.content || '';
    console.log('Extracted text length:', extractedText.length);
    console.log('\nExtracted text preview:');
    console.log(extractedText.substring(0, 500));
    console.log('...\n');

    // Step 2: Test format detection
    console.log('Step 2: Testing format detection...');
    const { processedText, format } = TimetablePreprocessor.preprocess(extractedText, true);

    console.log('\n=== FORMAT DETECTION RESULTS ===');
    console.log('Format Type:', format.formatType);
    console.log('Day Format:', format.dayFormat);
    console.log('Time Format:', format.timeFormat);
    console.log('Has Metadata:', format.hasMetadata);
    console.log('Confidence:', (format.confidence * 100).toFixed(0) + '%');
    console.log('================================\n');

    if (format.formatType === 'unknown' || format.confidence < 0.7) {
        console.log('❌ FAILED: Format type is unknown or confidence is too low');
        console.log('\nProcessed text with hints:');
        console.log(processedText);
    } else {
        console.log('✅ SUCCESS: Format detected correctly with good confidence');
    }
}

testTeacherTimetable().catch(console.error);
