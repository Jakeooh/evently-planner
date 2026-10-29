import { z } from "zod";

/** One category in the event budget. */
export const budgetCategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  amount: z.number().nonnegative(),
  color: z.string(),
});
/** A task in the event countdown. */
export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  weeksBefore: z.number().nonnegative(),
  done: z.boolean(),
});
/** A recommended event vendor. */
export const vendorSchema = z.object({
  id: z.string(),
  category: z.string(),
  ask: z.string(),
  status: z.enum(["To contact", "Contacted", "Booked"]),
  cost: z.number().nonnegative(),
  icon: z.string(),
});
/** The structured plan returned by the model. */
export const planSchema = z.object({
  budget: z.array(budgetCategorySchema),
  tasks: z.array(taskSchema),
  vendors: z.array(vendorSchema),
  ideas: z.object({
    theme: z.string(),
    menu: z.array(z.string()),
    decor: z.array(z.string()),
    playlist: z.array(z.string()),
    activities: z.array(z.string()),
  }),
});
/** Validates event details restored from browser storage before rendering. */
export const eventInputSchema = z.object({
  type: z.enum(["Wedding", "Birthday", "Community"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(5000),
  budget: z.number().finite().positive().max(10_000_000),
  city: z.string().min(1).max(80),
  vibe: z.string().max(80),
  mustHaves: z.string().max(240),
});
export type Plan = z.infer<typeof planSchema>;
export type EventType = "Wedding" | "Birthday" | "Community";
/** Event details used to generate a plan. */
export interface EventInput {
  type: EventType;
  date: string;
  guests: number;
  budget: number;
  city: string;
  vibe: string;
  mustHaves: string;
}
/** Navigation tabs available in the planner. */
export type TabId = "overview" | "budget" | "timeline" | "vendors" | "ideas";
