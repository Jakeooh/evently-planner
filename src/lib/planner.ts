import type { EventInput, Plan } from "../types";

export const CATEGORIES = [
  { id: "venue", label: "Venue", share: 0.28, color: "#7762e8", icon: "⌂" },
  {
    id: "food",
    label: "Food & drink",
    share: 0.3,
    color: "#f4a26a",
    icon: "✳",
  },
  { id: "decor", label: "Decor", share: 0.12, color: "#e985a8", icon: "✿" },
  {
    id: "entertainment",
    label: "Entertainment",
    share: 0.12,
    color: "#74a99a",
    icon: "♫",
  },
  {
    id: "photography",
    label: "Photography",
    share: 0.1,
    color: "#91a2d8",
    icon: "◉",
  },
  {
    id: "misc",
    label: "Little extras",
    share: 0.08,
    color: "#d6b85c",
    icon: "✧",
  },
] as const;
export const MAX_BUDGET = 10_000_000;
/** Removes control characters and limits user supplied text. */
export function sanitizeText(value: string, maxLength = 120): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}
/** Checks required planning fields and numeric bounds. */
export function validateEvent(input: EventInput): string | null {
  if (
    !input.date ||
    new Date(`${input.date}T00:00:00`) < new Date(new Date().toDateString())
  )
    return "Choose a date today or later.";
  if (
    !Number.isInteger(input.guests) ||
    input.guests < 1 ||
    input.guests > 5000
  )
    return "Guest count must be between 1 and 5,000.";
  if (
    !Number.isFinite(input.budget) ||
    input.budget <= 0 ||
    input.budget > MAX_BUDGET
  )
    return "Add a budget greater than zero.";
  if (!sanitizeText(input.city, 80)) return "Add a city to keep ideas local.";
  return null;
}
/** Creates deterministic allocations that sum exactly to the entered budget. */
export function createAllocations(total: number): Plan["budget"] {
  let remaining = Math.round(total);
  return CATEGORIES.map((category, index) => {
    const amount =
      index === CATEGORIES.length - 1
        ? remaining
        : Math.round(total * category.share);
    remaining -= amount;
    return {
      id: category.id,
      label: category.label,
      amount,
      color: category.color,
    };
  });
}
/** Normalizes Gemini's suggested category weights to the exact entered budget. */
export function normalizeAllocations(
  suggestions: Plan["budget"],
  total: number,
): Plan["budget"] {
  const fallback = createAllocations(total);
  const weights = CATEGORIES.map((category) =>
    Math.max(
      0,
      suggestions.find((item) => item.id === category.id)?.amount ??
        fallback.find((item) => item.id === category.id)!.amount,
    ),
  );
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  if (!weightTotal) return fallback;
  let remaining = Math.round(total);
  return CATEGORIES.map((category, index) => {
    const amount =
      index === CATEGORIES.length - 1
        ? remaining
        : Math.round((total * weights[index]!) / weightTotal);
    remaining -= amount;
    return {
      id: category.id,
      label: category.label,
      amount,
      color: category.color,
    };
  });
}
/** Rebalances the other categories proportionally after an edit. */
export function rebalanceBudget(
  budget: Plan["budget"],
  changedId: string,
  amount: number,
  total: number,
): Plan["budget"] {
  const safeAmount = Math.max(
    0,
    Math.min(Math.round(amount), Math.round(total)),
  );
  const others = budget.filter((item) => item.id !== changedId);
  const available = Math.round(total) - safeAmount;
  const weights = others.reduce(
    (sum, item) => sum + Math.max(item.amount, 1),
    0,
  );
  let remaining = available;
  const nextOthers = others.map((item, index) => {
    const value =
      index === others.length - 1
        ? remaining
        : Math.round((available * Math.max(item.amount, 1)) / weights);
    remaining -= value;
    return { ...item, amount: value };
  });
  return budget.map((item) =>
    item.id === changedId
      ? { ...item, amount: safeAmount }
      : (nextOthers.find((other) => other.id === item.id) ?? item),
  );
}
/** Makes a helpful fallback plan when Gemini is unavailable. */
export function createFallbackPlan(input: EventInput): Plan {
  const weeks = Math.max(
    1,
    Math.ceil(
      (new Date(`${input.date}T12:00:00`).getTime() - Date.now()) / 604800000,
    ),
  );
  const title =
    input.type === "Wedding"
      ? "your wedding"
      : input.type === "Birthday"
        ? "your birthday"
        : "the community get-together";
  return {
    budget: createAllocations(input.budget),
    tasks: [
      {
        id: "venue",
        title: "Find your place",
        detail: "Shortlist spots and lock in a date.",
        weeksBefore: Math.min(weeks, 12),
        done: false,
      },
      {
        id: "people",
        title: "Send the invite",
        detail: "Share the details with your people.",
        weeksBefore: Math.min(weeks, 8),
        done: false,
      },
      {
        id: "food",
        title: "Plan the good stuff",
        detail: "Confirm food, drinks, and dietary needs.",
        weeksBefore: Math.min(weeks, 4),
        done: false,
      },
      {
        id: "final",
        title: "Final little checks",
        detail: "Check your run sheet and vendor arrivals.",
        weeksBefore: 1,
        done: false,
      },
    ],
    vendors: [
      {
        id: "venue",
        category: "Venue",
        ask: "What is included, and when can we set up?",
        status: "To contact",
        cost: Math.round(input.budget * 0.28),
        icon: "⌂",
      },
      {
        id: "catering",
        category: "Food & drink",
        ask: "Can you handle our guest count and dietary needs?",
        status: "To contact",
        cost: Math.round(input.budget * 0.3),
        icon: "✳",
      },
      {
        id: "photo",
        category: "Photography",
        ask: "Can we see a full event gallery?",
        status: "To contact",
        cost: Math.round(input.budget * 0.1),
        icon: "◉",
      },
      {
        id: "music",
        category: "Music & sound",
        ask: "What is your setup and overtime policy?",
        status: "To contact",
        cost: Math.round(input.budget * 0.12),
        icon: "♫",
      },
    ],
    ideas: {
      theme: `${input.vibe || "warm and welcoming"} vibes for ${title}`,
      menu: [
        "A seasonal share-plate spread",
        "One easy vegetarian favorite",
        "A little dessert table",
      ],
      decor: [
        "Soft candlelight and gathered flowers",
        "A welcome sign with a personal note",
        "Colorful table details",
      ],
      playlist: [
        "A feel-good opener",
        "Songs everyone knows by heart",
        "A last-song singalong",
      ],
      activities: [
        "A photo corner with a simple backdrop",
        "A short toast or story moment",
        "A low-pressure group game",
      ],
    },
  };
}
