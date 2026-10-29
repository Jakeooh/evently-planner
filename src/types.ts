import { z } from 'zod';

/** One category in the event budget. */
export const budgetCategorySchema = z.object({ id: z.string(), label: z.string(), amount: z.number().nonnegative(), color: z.string() });
/** A task in the event countdown. */
export const taskSchema = z.object({ id: z.string(), title: z.string(), detail: z.string(), weeksBefore: z.number().nonnegative(), done: z.boolean() });
/** A recommended event vendor. */
export const vendorSchema = z.object({ id: z.string(), category: z.string(), ask: z.string(), status: z.enum(['To contact', 'Contacted', 'Booked']), cost: z.number().nonnegative(), icon: z.string() });
/** The structured plan returned by the model. */
export const planSchema = z.object({ budget: z.array(budgetCategorySchema), tasks: z.array(taskSchema), vendors: z.array(vendorSchema), ideas: z.object({ theme: z.string(), menu: z.array(z.string()), decor: z.array(z.string()), playlist: z.array(z.string()), activities: z.array(z.string()) }) });
export type Plan = z.infer<typeof planSchema>;
export type EventType = 'Wedding' | 'Birthday' | 'Community';
/** Event details used to generate a plan. */
export interface EventInput { type: EventType; date: string; guests: number; budget: number; city: string; vibe: string; mustHaves: string }
/** Navigation tabs available in the planner. */
export type TabId = 'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas';
