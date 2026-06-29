import "./styles/FeedbackFormModal.css"

import React from "react";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

function getAnonymousId() {
  const storageKey = "vantage_anonymous_id";

  let anonymousId = localStorage.getItem(storageKey);

  if (!anonymousId) {
    anonymousId = crypto.randomUUID();
    localStorage.setItem(storageKey, anonymousId);
  }

  return anonymousId;
}

export default function FeedbackFormModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [rating, setRating] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const feedbackRow = {
      satisfaction: Number(rating),
      category,
      message,
      email: email || null,
      anonymous_id: getAnonymousId(),
      page_url: window.location.href,
      path: window.location.pathname,
      browser_and_os: navigator.userAgent,
      referral_source: document.referrer || null,
      utm_params: Object.fromEntries(new URLSearchParams(window.location.search).entries()),
    };

    const { error } = await getSupabaseClient().from("feedback_submissions").insert(feedbackRow);
    console.log("success insert to feedback submissions")
    
    setIsSubmitting(false);

    if (error) {
      console.error("Feedback insert failed:", error);
      setSubmitError("Something went wrong submitting your feedback. Please try again.");
      return;
    }

    setRating("");
    setCategory("General");
    setMessage("");
    setEmail("");

    onClose();
  }

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(event) => event.stopPropagation()}>
        <div className="feedback-header">
          <div>
            <h2 className="feedback-title">Leave Feedback</h2>
            <p className="feedback-desc">We’re a small team building quickly, and we’d genuinely appreciate any feedback that could help us improve.</p>
          </div>

          <button type="button" className="feedback-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          <label className="feedback-label">
            Satisfaction Rating
            <select value={rating} onChange={(event) => setRating(event.target.value)} required className="feedback-input">
              <option value="">Select a rating</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
                <option key={number} value={number}>
                  {number}
                </option>
              ))}
            </select>
          </label>

          <label className="feedback-label">
            Feedback Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="feedback-input">
              <option>Bug</option>
              <option>Feature Request</option>
              <option>UX Confusion</option>
              <option>Questions</option>
              <option>General</option>
            </select>
          </label>

          <label className="feedback-label">
            Feedback / Questions
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your feedback or questions..." rows={5} required className="feedback-input" />
          </label>

          <label className="feedback-label">
            Email (Optional)
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Only if you want a follow-up" className="feedback-input" />
          </label>

          <div className="feedback-actions">
            <button type="button" className="feedback-btn-secondary" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="feedback-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>

          {submitError && <p className="feedback-error">{submitError}</p>}
        </form>
      </div>
    </div>
  );
}