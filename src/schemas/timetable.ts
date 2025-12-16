import { z } from 'zod';

export const TimetableEntrySchema = z.object({
    day: z.string(), // Can be "Monday", "Mon", "M", etc.
    time: z.string(), // Can be "9:00-10:00", "9:00 AM", "09:00", etc.
    subject: z.string(),
    room: z.string().optional(),
    instructor: z.string().optional(),
    notes: z.string().optional(), // Additional details or notes
    duration: z.string().optional(), // Duration in minutes or as a string
});

export const TimetableMetadataSchema = z.object({
    schoolName: z.string().optional(),
    className: z.string().optional(),
    term: z.string().optional(),
    week: z.string().optional(),
    teacher: z.string().optional(),
    academicYear: z.string().optional(),
});

export const TimetableSchema = z.object({
    title: z.string().optional(),
    metadata: TimetableMetadataSchema.optional(),
    entries: z.array(TimetableEntrySchema),
});

export type Timetable = z.infer<typeof TimetableSchema>;
export type TimetableEntry = z.infer<typeof TimetableEntrySchema>;
export type TimetableMetadata = z.infer<typeof TimetableMetadataSchema>;
