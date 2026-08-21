import { z } from "zod";
import { EMPLOYERS, SOURCES, WORK_MODES } from "@/lib/employers";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const timeSchema = z
  .string()
  .regex(timeRegex, "Time must be HH:mm or HH:mm:ss")
  .nullable()
  .optional()
  .transform((v) => {
    if (!v) return null;
    // Normalise to HH:mm:ss for Postgres time
    const parts = v.split(":");
    if (parts.length === 2) return `${v}:00`;
    return v;
  });

export const optionalTrimmed = z
  .string()
  .optional()
  .nullable()
  .transform((v) => {
    if (v == null) return null;
    const t = v.trim();
    return t.length ? t : null;
  });

export const scheduleEntryInputSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string().regex(dateRegex, "date must be YYYY-MM-DD"),
  employer: z.union([
    z.enum(EMPLOYERS),
    z.string().min(1).max(80),
  ]),
  work_mode: z.enum(WORK_MODES),
  location: optionalTrimmed,
  start_time: timeSchema,
  end_time: timeSchema,
  expected_home_time: timeSchema,
  household_note: optionalTrimmed,
  source: z.enum(SOURCES).default("manual"),
  source_reference: optionalTrimmed,
  priority: z.number().int().min(0).max(100).optional().default(0),
  is_all_day: z.boolean().optional().default(false),
  manual_override: z.boolean().optional().default(false),
  /** Soft-delete / cancel imported entries */
  cancelled: z.boolean().optional().default(false),
});

export const schedulePayloadSchema = z.union([
  scheduleEntryInputSchema,
  z.array(scheduleEntryInputSchema).min(1).max(100),
]);

export const scheduleQuerySchema = z.object({
  from: z.string().regex(dateRegex).optional(),
  to: z.string().regex(dateRegex).optional(),
  week: z.string().regex(dateRegex).optional(),
});

export type ScheduleEntryInput = z.infer<typeof scheduleEntryInputSchema>;

export type ScheduleEntry = {
  id: string;
  date: string;
  employer: string;
  work_mode: string;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  expected_home_time: string | null;
  household_note: string | null;
  source: string;
  source_reference: string | null;
  priority: number;
  is_all_day: boolean;
  manual_override: boolean;
  created_at: string;
  updated_at: string;
};
