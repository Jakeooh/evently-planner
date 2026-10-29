import { CATEGORIES } from "../lib/planner";
import type { EventInput, Plan, TabId } from "../types";

export function Overview({
  input,
  plan,
  days,
  onTab,
  onTask,
  spent,
}: {
  input: EventInput;
  plan: Plan;
  days: number;
  onTab: (tab: TabId) => void;
  onTask: (id: string) => void;
  spent: number;
}) {
  const done = plan.tasks.filter((task) => task.done).length;
  const progress = plan.tasks.length
    ? Math.round((done / plan.tasks.length) * 100)
    : 0;
  return (
    <div className="overview-grid">
      <section className="card budget-preview">
        <CardHead
          kicker="THE MONEY BIT"
          title="A budget that makes sense"
          action="see budget ↗"
          onAction={() => onTab("budget")}
        />
        <div className="budget-overview-row">
          <div
            className="donut"
            style={
              {
                "--progress": `${Math.min(100, (spent / input.budget) * 100)}%`,
              } as React.CSSProperties
            }
          >
            <div>
              <strong>{Math.round((spent / input.budget) * 100)}%</strong>
              <small>planned</small>
            </div>
          </div>
          <div className="budget-breakdown">
            <strong>{input.budget.toLocaleString()}</strong>
            <span>total budget</span>
            <div className="mini-bars">
              {plan.budget.map((item) => (
                <i
                  key={item.id}
                  title={`${item.label}: ${item.amount}`}
                  style={{
                    width: `${(item.amount / input.budget) * 100}%`,
                    background: item.color,
                  }}
                />
              ))}
            </div>
            <small>
              {plan.budget
                .slice(0, 3)
                .map((item) => item.label)
                .join(" · ")}{" "}
              · +3 more
            </small>
          </div>
        </div>
      </section>
      <section className="card timeline-preview">
        <CardHead
          kicker="UP NEXT"
          title="Your little to-do list"
          action="see timeline ↗"
          onAction={() => onTab("timeline")}
        />
        <div className="progress-row">
          <span
            className="progress-ring"
            style={{ "--progress": `${progress}%` } as React.CSSProperties}
          >
            <span>{progress}%</span>
          </span>
          <div>
            <strong>
              {done} of {plan.tasks.length} done
            </strong>
            <small>{days} days left to go</small>
          </div>
        </div>
        <div className="task-preview">
          {plan.tasks.slice(0, 3).map((task) => (
            <button
              className="task-row"
              key={task.id}
              onClick={() => onTask(task.id)}
            >
              <span className={`check-dot ${task.done ? "checked" : ""}`}>
                {task.done ? "✓" : ""}
              </span>
              <span>
                {task.title}
                <small>{task.weeksBefore} weeks before</small>
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="card vendors-preview">
        <CardHead
          kicker="GOOD PEOPLE TO KNOW"
          title="Your vendor shortlist"
          action="see vendors ↗"
          onAction={() => onTab("vendors")}
        />
        {plan.vendors.slice(0, 3).map((vendor) => (
          <div className="vendor-short-row" key={vendor.id}>
            <span className="vendor-icon">{vendor.icon}</span>
            <span>
              <strong>{vendor.category}</strong>
              <small>{vendor.status}</small>
            </span>
            <b>{vendor.cost.toLocaleString()}</b>
          </div>
        ))}
      </section>
      <section className="card idea-preview">
        <CardHead
          kicker="A LITTLE SPARK"
          title="The feeling we’re going for"
          action="get ideas ↗"
          onAction={() => onTab("ideas")}
        />
        <div className="idea-quote">“{plan.ideas.theme}”</div>
        <div className="tag-row">
          <span>{input.vibe || "your kind of magic"}</span>
          <span>{input.guests} guests</span>
        </div>
      </section>
    </div>
  );
}
export function CardHead({
  kicker,
  title,
  action,
  onAction,
}: {
  kicker: string;
  title: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="card-head">
      <div>
        <span className="eyebrow">{kicker}</span>
        <h2>{title}</h2>
      </div>
      <button className="card-link" onClick={onAction}>
        {action}
      </button>
    </div>
  );
}
export function Budget({
  plan,
  total,
  onChange,
}: {
  plan: Plan;
  total: number;
  onChange: (id: string, amount: number) => void;
}) {
  const current = plan.budget.reduce((sum, item) => sum + item.amount, 0);
  const over = current > total;
  return (
    <section className="card full-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">THE MONEY BIT</span>
          <h2>Give every dollar a little job.</h2>
          <p>Move a slider — the rest will rebalance to keep you on track.</p>
        </div>
        <div className={`remaining ${over ? "over" : ""}`}>
          <small>{over ? "over budget" : "left to assign"}</small>
          <strong>{(total - current).toLocaleString()}</strong>
        </div>
      </div>
      <div className="budget-layout">
        <div className="category-list">
          {plan.budget.map((item, index) => {
            const meta = CATEGORIES[index]!;
            return (
              <div className="category-row" key={item.id}>
                <span
                  className="category-icon"
                  style={{ background: `${item.color}20`, color: item.color }}
                >
                  {meta.icon}
                </span>
                <div className="category-control">
                  <div className="category-label">
                    <strong>{item.label}</strong>
                    <label>
                      <span className="currency-label">$</span>
                      <input
                        aria-label={`${item.label} budget`}
                        type="number"
                        min="0"
                        max={total}
                        value={item.amount}
                        onChange={(event) =>
                          onChange(item.id, Number(event.target.value))
                        }
                      />
                    </label>
                  </div>
                  <input
                    className="budget-slider"
                    aria-label={`${item.label} allocation slider`}
                    type="range"
                    min="0"
                    max={total}
                    step={Math.max(1, Math.round(total / 100))}
                    value={item.amount}
                    onChange={(event) =>
                      onChange(item.id, Number(event.target.value))
                    }
                    style={
                      { "--range-color": item.color } as React.CSSProperties
                    }
                  />
                </div>
                <span className="category-percent">
                  {Math.round((item.amount / total) * 100)}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="chart-card">
          <BudgetDonut plan={plan} total={total} />
          <p>every piece has a place</p>
        </div>
      </div>
      {over && (
        <p className="budget-warning" role="status">
          ⚠ A little over your total — bring one category down to balance it.
        </p>
      )}
    </section>
  );
}
export function BudgetDonut({ plan, total }: { plan: Plan; total: number }) {
  let offset = 0;
  const arcs = plan.budget.map((item) => {
    const start = offset;
    const amount = (item.amount / total) * 100;
    offset += amount;
    return { ...item, start, amount };
  });
  return (
    <svg
      viewBox="0 0 120 120"
      className="donut-chart"
      role="img"
      aria-label={`Budget chart totaling ${total.toLocaleString()}`}
    >
      <circle
        cx="60"
        cy="60"
        r="44"
        fill="none"
        stroke="var(--line)"
        strokeWidth="14"
      />
      {arcs.map((item) => (
        <circle
          key={item.id}
          cx="60"
          cy="60"
          r="44"
          fill="none"
          stroke={item.color}
          strokeWidth="14"
          strokeDasharray={`${item.amount * 2.765} 276.5`}
          strokeDashoffset={-item.start * 2.765}
          transform="rotate(-90 60 60)"
        />
      ))}
      <text x="60" y="57" className="donut-total">
        ${Math.round(total / 1000)}k
      </text>
      <text x="60" y="72" className="donut-caption">
        total plan
      </text>
    </svg>
  );
}
export function Timeline({
  plan,
  days,
  onTask,
}: {
  plan: Plan;
  days: number;
  onTask: (id: string) => void;
}) {
  const done = plan.tasks.filter((task) => task.done).length;
  const progress = plan.tasks.length
    ? Math.round((done / plan.tasks.length) * 100)
    : 0;
  return (
    <section className="card full-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ONE THING AT A TIME</span>
          <h2>The countdown, without the chaos.</h2>
          <p>{days} days until the big day. You’ve got this.</p>
        </div>
        <div
          className="progress-ring large"
          style={{ "--progress": `${progress}%` } as React.CSSProperties}
        >
          <span>{progress}%</span>
        </div>
      </div>
      <div className="timeline-list">
        {plan.tasks.map((task, index) => (
          <div
            className={`timeline-item ${task.done ? "completed" : ""}`}
            key={task.id}
          >
            <button
              className="timeline-check"
              aria-label={`${task.done ? "Uncheck" : "Complete"} ${task.title}`}
              onClick={() => onTask(task.id)}
            >
              {task.done ? "✓" : ""}
            </button>
            <div className="timeline-stem">
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="timeline-text">
              <span className="eyebrow">
                {task.weeksBefore === 0
                  ? "EVENT DAY"
                  : `${task.weeksBefore} WEEKS BEFORE`}
              </span>
              <h3>{task.title}</h3>
              <p>{task.detail}</p>
            </div>
            <span className="timeline-date">
              {task.weeksBefore === 0
                ? "the day!"
                : task.weeksBefore === 1
                  ? "1 week out"
                  : `${task.weeksBefore} weeks out`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
export function Vendors({
  plan,
  onStatus,
}: {
  plan: Plan;
  onStatus: (id: string, status: "To contact" | "Contacted" | "Booked") => void;
}) {
  return (
    <section className="card full-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR DREAM TEAM</span>
          <h2>Find your people.</h2>
          <p>Good questions now make the day easier later.</p>
        </div>
        <span className="vendor-count">
          {plan.vendors.length} vendors to explore
        </span>
      </div>
      <div className="vendors-grid">
        {plan.vendors.map((vendor) => (
          <article className="vendor-card" key={vendor.id}>
            <div className="vendor-card-top">
              <span className="vendor-icon large-icon">{vendor.icon}</span>
              <span
                className={`status-pill ${vendor.status.toLowerCase().replace(" ", "-")}`}
              >
                {vendor.status}
              </span>
            </div>
            <h3>{vendor.category}</h3>
            <p className="vendor-question">“{vendor.ask}”</p>
            <div className="vendor-card-bottom">
              <span>
                EST. COST <strong>{vendor.cost.toLocaleString()}</strong>
              </span>
              <label
                className="visually-hidden"
                htmlFor={`vendor-${vendor.id}`}
              >
                Update {vendor.category} status
              </label>
              <select
                id={`vendor-${vendor.id}`}
                value={vendor.status}
                onChange={(event) =>
                  onStatus(
                    vendor.id,
                    event.target.value as "To contact" | "Contacted" | "Booked",
                  )
                }
              >
                <option>To contact</option>
                <option>Contacted</option>
                <option>Booked</option>
              </select>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export function Ideas({
  plan,
  onRegenerate,
  onSurprise,
  loading,
}: {
  plan: Plan;
  onRegenerate: () => void;
  onSurprise: () => void;
  loading: boolean;
}) {
  const groups = [
    ["on the menu", "menu", "food"],
    ["set the scene", "decor", "decor"],
    ["set the mood", "playlist", "music"],
    ["make it a moment", "activities", "moments"],
  ] as const;
  return (
    <section className="ideas-view">
      <div className="idea-hero card">
        <div>
          <span className="eyebrow">A FEW THOUGHTFUL DETAILS</span>
          <h2>
            Make it feel like <span>you.</span>
          </h2>
          <p>{plan.ideas.theme}</p>
        </div>
        <div className="idea-actions">
          <button className="button button-outline" onClick={onSurprise}>
            ✧ surprise me
          </button>
          <button
            className="button button-primary"
            onClick={onRegenerate}
            disabled={loading}
          >
            ↻ {loading ? "thinking…" : "fresh ideas"}
          </button>
        </div>
        <div className="idea-decoration">✳</div>
      </div>
      <div className="ideas-grid">
        {groups.map(([title, key, icon], index) => (
          <article className="card ideas-card" key={key}>
            <span className="idea-number">
              0{index + 1} <i>{icon}</i>
            </span>
            <h3>{title}</h3>
            <ul>
              {plan.ideas[key].map((idea, item) => (
                <li key={`${item}-${idea}`}>
                  <span>✦</span>
                  {idea}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
