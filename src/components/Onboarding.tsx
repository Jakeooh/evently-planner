import { useState } from "react";
import type { EventInput, EventType } from "../types";
import { sanitizeText, validateEvent } from "../lib/planner";

const today = new Date().toISOString().slice(0, 10);
const initial: EventInput = {
  type: "Wedding",
  date: "",
  guests: 80,
  budget: 12000,
  city: "",
  vibe: "",
  mustHaves: "",
};
const steps = [
  "what are we celebrating?",
  "when’s the big day?",
  "who’s on the guest list?",
  "what’s your budget?",
  "where’s it happening?",
  "set the vibe",
  "your must-haves",
];
const samples: { name: string; data: EventInput; emoji: string }[] = [
  {
    name: "a little wedding",
    emoji: "♡",
    data: {
      type: "Wedding",
      date: "2027-06-12",
      guests: 90,
      budget: 18000,
      city: "Portland",
      vibe: "garden party, candlelit, relaxed",
      mustHaves: "great food, dancing, outdoor ceremony",
    },
  },
  {
    name: "birthday energy",
    emoji: "✳",
    data: {
      type: "Birthday",
      date: "2027-03-20",
      guests: 35,
      budget: 3500,
      city: "Austin",
      vibe: "colorful, disco, playful",
      mustHaves: "taco bar, good playlist, photo booth",
    },
  },
  {
    name: "community fundraiser",
    emoji: "✿",
    data: {
      type: "Community",
      date: "2027-05-01",
      guests: 180,
      budget: 9000,
      city: "Brooklyn",
      vibe: "neighborly, bright, welcoming",
      mustHaves: "local vendors, live music, donation table",
    },
  },
];

/** Friendly, one-question-at-a-time event setup. */
export default function Onboarding({
  onPlan,
  loading,
}: {
  onPlan: (data: EventInput) => void;
  loading: boolean;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) =>
    setData((previous) => ({ ...previous, [key]: value }));
  const next = () => {
    if (step === 1 && (!data.date || data.date < today)) {
      setError("Pick today or a date in the future.");
      return;
    }
    if (
      step === 2 &&
      (!Number.isInteger(data.guests) || data.guests < 1 || data.guests > 5000)
    ) {
      setError("Between 1 and 5,000 guests works best.");
      return;
    }
    if (
      step === 3 &&
      (!data.budget || data.budget < 1 || data.budget > 10_000_000)
    ) {
      setError("Add a budget between 1 and 10,000,000.");
      return;
    }
    if (step === 4 && !data.city.trim()) {
      setError("Add your city to keep ideas local.");
      return;
    }
    setError("");
    if (step < steps.length - 1) setStep(step + 1);
    else {
      const problem = validateEvent(data);
      if (problem) setError(problem);
      else
        onPlan({
          ...data,
          city: sanitizeText(data.city, 80),
          vibe: sanitizeText(data.vibe, 80),
          mustHaves: sanitizeText(data.mustHaves, 240),
        });
    }
  };
  const change = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    if (name === "date") set("date", value);
    else if (name === "guests") set("guests", Number(value));
    else if (name === "budget") set("budget", Number(value));
    else if (name === "city") set("city", value);
    else if (name === "vibe") set("vibe", value);
    else set("mustHaves", value);
  };
  return (
    <section className="welcome-grid" aria-label="Get started">
      <div className="welcome-copy">
        <span className="eyebrow">
          <span className="live-dot" /> YOUR PLANNING SIDEKICK
        </span>
        <h1>
          Plan any event
          <br />
          in minutes, <span>not months.</span>
        </h1>
        <p>
          Big day, big birthday, block party — we’ll help you figure out the
          little things, one step at a time.
        </p>
        <div className="sample-block">
          <p className="sample-title">just looking? peek at a plan</p>
          <div className="sample-list">
            {samples.map((sample) => (
              <button
                className="sample-button"
                key={sample.name}
                onClick={() => onPlan(sample.data)}
                disabled={loading}
              >
                <span className="sample-emoji">{sample.emoji}</span>
                <span>{sample.name}</span>
                <span className="arrow">↗</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="wizard-card">
        <div className="wizard-top">
          <span>LET’S GET THE BASICS</span>
          <span>
            0{step + 1} <span className="muted">/ 07</span>
          </span>
        </div>
        <div className="steps-line">
          {steps.map((_, index) => (
            <i key={index} className={index <= step ? "active" : ""} />
          ))}
        </div>
        <h2>{steps[step]}</h2>
        <div className="wizard-input">
          {step === 0 && (
            <div className="type-options">
              {(["Wedding", "Birthday", "Community"] as EventType[]).map(
                (type, index) => (
                  <button
                    key={type}
                    className={`type-choice ${data.type === type ? "selected" : ""}`}
                    onClick={() => set("type", type)}
                  >
                    <span>{["♡", "✳", "✿"][index]}</span>
                    {type}
                    <small>
                      {
                        ["the big yes", "your big day", "bring folks together"][
                          index
                        ]
                      }
                    </small>
                  </button>
                ),
              )}
            </div>
          )}
          {step === 1 && (
            <label className="field-label">
              date
              <input
                name="date"
                aria-label="Event date"
                type="date"
                min={today}
                value={data.date}
                onChange={change}
              />
            </label>
          )}
          {step === 2 && (
            <label className="field-label">
              rough headcount
              <input
                name="guests"
                aria-label="Guest count"
                type="number"
                min="1"
                max="5000"
                value={data.guests}
                onChange={change}
              />
              <small>It’s okay to estimate — you can change this later.</small>
            </label>
          )}
          {step === 3 && (
            <label className="field-label">
              total budget
              <input
                name="budget"
                aria-label="Total budget"
                type="number"
                min="1"
                max="10000000"
                value={data.budget}
                onChange={change}
              />
              <small>We’ll make every dollar count.</small>
            </label>
          )}
          {step === 4 && (
            <label className="field-label">
              city or neighborhood
              <input
                name="city"
                aria-label="City"
                value={data.city}
                maxLength={80}
                onChange={change}
                placeholder="e.g. Brooklyn, NY"
              />
            </label>
          )}
          {step === 5 && (
            <label className="field-label">
              describe your vibe
              <input
                name="vibe"
                aria-label="Vibe or theme"
                value={data.vibe}
                maxLength={80}
                onChange={change}
                placeholder="garden party, disco, cozy…"
              />
              <small>Pick a few words, or let Evently surprise you.</small>
            </label>
          )}
          {step === 6 && (
            <label className="field-label">
              anything that’s a must?
              <textarea
                name="mustHaves"
                aria-label="Must haves"
                value={data.mustHaves}
                maxLength={240}
                onChange={change}
                placeholder="Great food, a dance floor, grandma’s famous cake…"
                rows={3}
              />
              <small>Optional. The little details make it yours.</small>
            </label>
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="wizard-actions">
          {step > 0 && (
            <button
              className="button button-quiet"
              onClick={() => {
                setError("");
                setStep(step - 1);
              }}
            >
              back
            </button>
          )}
          <button
            className="button button-primary"
            onClick={next}
            disabled={loading}
          >
            {loading
              ? "making your plan…"
              : step === steps.length - 1
                ? "make my plan ↗"
                : "keep going ↗"}
          </button>
        </div>
        <p className="wizard-note">
          ✦ &nbsp; a good plan starts with a few good details
        </p>
      </div>
    </section>
  );
}
