import { z } from 'zod';

export const TimetableEntrySchema = z.object({
    day: z.string(),
    time: z.string(),
    subject: z.string(),
    room: z.string().optional(),
    instructor: z.string().optional(),
});

export const TimetableSchema = z.object({
    title: z.string().optional(),
    entries: z.array(TimetableEntrySchema),
});

export type Timetable = z.infer<typeof TimetableSchema>;
