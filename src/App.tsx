import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Onboarding from "./components/Onboarding";
import { generatePlan } from "./services/gemini";
import { createFallbackPlan, rebalanceBudget } from "./lib/planner";
import {
  eventInputSchema,
  planSchema,
  type EventInput,
  type Plan,
  type TabId,
} from "./types";
import {
  Budget,
  Ideas,
  Overview,
  Timeline,
  Vendors,
} from "./components/PlanViews";

const ChatPanel = lazy(() => import("./components/ChatPanel"));
const tabItems: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "✳" },
  { id: "budget", label: "Budget", icon: "◒" },
  { id: "timeline", label: "Timeline", icon: "↗" },
  { id: "vendors", label: "Vendors", icon: "✿" },
  { id: "ideas", label: "Ideas", icon: "✧" },
];
const cacheKey = "evently.plan.v1";

/** Storage can be unavailable or disabled in private browsing contexts. */
function clearSavedPlan() {
  try {
    localStorage.removeItem(cacheKey);
  } catch {
    // The in-memory planner remains usable without persistent storage.
  }
}

/** Root application and persisted event planner state. */
export default function App() {
  const [input, setInput] = useState<EventInput | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [dark, setDark] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const saved: unknown = JSON.parse(raw);
        if (typeof saved === "object" && saved !== null) {
          const record = saved as Record<string, unknown>;
          const validInput = eventInputSchema.safeParse(record.input);
          const validPlan = planSchema.safeParse(record.plan);
          if (validInput.success && validPlan.success) {
            setInput(validInput.data);
            setPlan(validPlan.data);
          } else {
            clearSavedPlan();
          }
        }
      }
    } catch {
      clearSavedPlan();
    }
  }, []);
  useEffect(() => {
    if (input && plan) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ input, plan }));
      } catch {
        /* Storage can be unavailable in private browsing. */
      }
    }
  }, [input, plan]);
  const makePlan = useCallback(async (eventInput: EventInput) => {
    setInput(eventInput);
    setLoading(true);
    setNotice("");
    try {
      const result = await generatePlan(eventInput);
      setPlan(result.plan);
      setNotice(result.notice ?? "");
    } catch {
      setPlan(createFallbackPlan(eventInput));
      setNotice("your starter plan is ready.");
    } finally {
      setLoading(false);
      setTab("overview");
    }
  }, []);
  const changeBudget = useCallback(
    (id: string, amount: number) =>
      setPlan((previous) => {
        if (!previous || !input) return previous;
        const budget = rebalanceBudget(
          previous.budget,
          id,
          amount,
          input.budget,
        );
        const matchingCategory = budget.find((category) => category.id === id);
        if (!matchingCategory) return { ...previous, budget };
        const vendorMatches: Record<string, string[]> = {
          venue: ["venue"],
          food: ["food", "catering"],
          decor: ["decor", "florist"],
          entertainment: ["music", "entertainment", "dj"],
          photography: ["photo", "photograph"],
          misc: ["misc", "rental"],
        };
        const terms = vendorMatches[id] ?? [];
        return {
          ...previous,
          budget,
          vendors: previous.vendors.map((vendor) =>
            terms.some((term) => vendor.category.toLowerCase().includes(term))
              ? { ...vendor, cost: matchingCategory.amount }
              : vendor,
          ),
        };
      }),
    [input],
  );
  const spent = useMemo(
    () => plan?.budget.reduce((sum, item) => sum + item.amount, 0) ?? 0,
    [plan],
  );
  const days = useMemo(
    () =>
      input
        ? Math.max(
            0,
            Math.ceil(
              (new Date(`${input.date}T12:00:00`).getTime() -
                new Date().setHours(12, 0, 0, 0)) /
                86400000,
            ),
          )
        : 0,
    [input],
  );
  const exportSummary = async () => {
    if (!input || !plan) return;
    const content = `EVENTLY PLAN · ${input.type}\n${input.date} · ${input.city} · ${input.guests} guests\nBudget: ${input.budget.toLocaleString()}\n\nBUDGET\n${plan.budget.map((item) => `${item.label}: ${item.amount.toLocaleString()}`).join("\n")}\n\nTIMELINE\n${plan.tasks.map((task) => `${task.done ? "[x]" : "[ ]"} ${task.title} · ${task.weeksBefore} weeks out`).join("\n")}\n\nVENDORS\n${plan.vendors.map((vendor) => `${vendor.category}: ${vendor.status} · ${vendor.cost.toLocaleString()}`).join("\n")}\n\nIDEAS\n${plan.ideas.theme}`;
    try {
      await navigator.clipboard.writeText(content);
      setNotice("plan copied to your clipboard ✨");
    } catch {
      setNotice("clipboard access is unavailable in this browser.");
    }
  };
  const keyTabs = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const index = tabItems.findIndex((item) => item.id === tab);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabItems.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabItems.length) %
            tabItems.length;
    setTab(tabItems[next]!.id);
    document.getElementById(`tab-${tabItems[next]!.id}`)?.focus();
  };
  const toggleTask = (id: string) =>
    setPlan(
      (previous) =>
        previous && {
          ...previous,
          tasks: previous.tasks.map((task) =>
            task.id === id ? { ...task, done: !task.done } : task,
          ),
        },
    );
  const updateVendor = (
    id: string,
    status: "To contact" | "Contacted" | "Booked",
  ) =>
    setPlan(
      (previous) =>
        previous && {
          ...previous,
          vendors: previous.vendors.map((vendor) =>
            vendor.id === id ? { ...vendor, status } : vendor,
          ),
        },
    );
  const regenerate = async () => {
    if (!input || loading) return;
    setLoading(true);
    try {
      const result = await generatePlan(input);
      setPlan(result.plan);
      setNotice(result.notice ?? "fresh ideas, coming right up ✨");
      setRefresh((previous) => previous + 1);
    } catch {
      setNotice(
        "we could not refresh your ideas just now. try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  };
  const surprise = () => {
    if (!plan) return;
    const extras = [
      "A tiny handwritten note at every place setting",
      "A disposable camera for each table",
      "A signature drink with a story",
      "A late-night snack cart",
      "A five-minute open mic for favorite memories",
    ];
    const pick = extras[Math.floor(Math.random() * extras.length)]!;
    setPlan((previous) =>
      previous
        ? {
            ...previous,
            ideas: {
              ...previous.ideas,
              activities: [pick, ...previous.ideas.activities.slice(1)],
            },
          }
        : previous,
    );
  };
  return (
    <div data-theme={dark ? "dark" : "light"}>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="Evently home">
          <span className="brand-mark">
            e<span>✳</span>
          </span>
          evently<span className="brand-period">.</span>
        </a>
        <div className="header-right">
          <span className="header-note">less stress, more confetti</span>
          <button
            className="theme-toggle"
            onClick={() => setDark(!dark)}
            aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
          >
            {dark ? "☼" : "☾"}
          </button>
          {plan && (
            <button
              className="button button-outline new-plan"
              onClick={() => {
                setInput(null);
                setPlan(null);
                setNotice("");
                clearSavedPlan();
              }}
            >
              + new plan
            </button>
          )}
        </div>
      </header>
      <main id="main">
        <div className="page-shell">
          {!plan ? (
            <Onboarding onPlan={makePlan} loading={loading} />
          ) : (
            <>
              <section className="plan-hero">
                <div>
                  <span className="eyebrow">
                    <span className="live-dot" /> YOUR{" "}
                    {input?.type.toUpperCase()} PLAN
                  </span>
                  <h1>
                    It’s all coming <span>together.</span>
                  </h1>
                  <p>
                    {input?.city} <i>·</i> {input?.guests} lovely people{" "}
                    <i>·</i>{" "}
                    {new Date(`${input?.date}T12:00:00`).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" },
                    )}
                  </p>
                </div>
                <div className="hero-count">
                  <strong>{days}</strong>
                  <span>days to the good stuff</span>
                </div>
              </section>
              <div className="plan-toolbar">
                <div
                  className="tab-list"
                  role="tablist"
                  aria-label="Plan sections"
                  onKeyDown={keyTabs}
                >
                  {tabItems.map((item) => (
                    <button
                      role="tab"
                      aria-selected={tab === item.id}
                      aria-controls={`panel-${item.id}`}
                      id={`tab-${item.id}`}
                      tabIndex={tab === item.id ? 0 : -1}
                      className={`tab-button ${tab === item.id ? "active" : ""}`}
                      key={item.id}
                      onClick={() => setTab(item.id)}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="toolbar-actions">
                  <button
                    className="text-action"
                    onClick={() => void exportSummary()}
                  >
                    ▣ <span>copy plan</span>
                  </button>
                  <button
                    className="text-action"
                    onClick={() => window.print()}
                  >
                    ↗ <span>print</span>
                  </button>
                </div>
              </div>
              {!!notice && (
                <p className="notice" role="status">
                  ✧ &nbsp; {notice}
                  <button
                    aria-label="Dismiss message"
                    onClick={() => setNotice("")}
                  >
                    ×
                  </button>
                </p>
              )}
              {loading && (
                <div role="status" className="loading-banner">
                  <span className="spinner" /> putting all the little pieces
                  together…
                </div>
              )}
              <div
                id={`panel-${tab}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab}`}
                className="tab-panel"
                key={`${tab}-${refresh}`}
              >
                {tab === "overview" && (
                  <Overview
                    input={input!}
                    plan={plan}
                    days={days}
                    onTab={setTab}
                    onTask={toggleTask}
                    spent={spent}
                  />
                )}
                {tab === "budget" && (
                  <Budget
                    plan={plan}
                    total={input!.budget}
                    onChange={changeBudget}
                  />
                )}
                {tab === "timeline" && (
                  <Timeline plan={plan} days={days} onTask={toggleTask} />
                )}
                {tab === "vendors" && (
                  <Vendors plan={plan} onStatus={updateVendor} />
                )}
                {tab === "ideas" && (
                  <Ideas
                    plan={plan}
                    onRegenerate={() => void regenerate()}
                    onSurprise={surprise}
                    loading={loading}
                  />
                )}
              </div>
              <footer className="planner-footer">
                <span>made with care for your big little moments ✳</span>
                <button
                  onClick={() => {
                    setInput(null);
                    setPlan(null);
                    clearSavedPlan();
                    setNotice("");
                  }}
                >
                  clear my data
                </button>
              </footer>
              <Suspense fallback={null}>
                <ChatPanel context={JSON.stringify({ event: input, plan })} />
              </Suspense>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
