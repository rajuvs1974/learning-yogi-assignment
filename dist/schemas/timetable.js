"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimetableSchema = exports.TimetableEntrySchema = void 0;
const zod_1 = require("zod");
exports.TimetableEntrySchema = zod_1.z.object({
    day: zod_1.z.string(),
    time: zod_1.z.string(),
    subject: zod_1.z.string(),
    room: zod_1.z.string().optional(),
    instructor: zod_1.z.string().optional(),
});
exports.TimetableSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    entries: zod_1.z.array(exports.TimetableEntrySchema),
});
