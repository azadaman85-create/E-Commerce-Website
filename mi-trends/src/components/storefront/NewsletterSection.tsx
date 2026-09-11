"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeUp, inViewOnce } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function NewsletterSection() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("You're on the list", "Welcome to MI TRENDS.");
        setEmail("");
      } else {
        toast.error("Couldn't subscribe", data.error ?? "Please try again.");
      }
    } catch {
      toast.error("Couldn't subscribe", "Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.section {...inViewOnce} variants={fadeUp} className="container-page">
      <div className="rounded-sm bg-cream px-8 py-16 text-center md:px-16 md:py-20">
        <span className="label-caps">Stay in the loop</span>
        <h2 className="mx-auto mt-4 max-w-xl font-serif text-section-sm leading-tight text-ink md:text-section">
          New arrivals, first access, no noise.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-body-sm text-muted">
          One considered email a month. Unsubscribe whenever you like.
        </p>

        <form
          onSubmit={submit}
          className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="newsletter-home" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-home"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-14 flex-1 rounded-sm border border-ink/15 bg-white px-4 text-body-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent"
          />
          <Button type="submit" loading={submitting} size="lg">
            Subscribe
          </Button>
        </form>
      </div>
    </motion.section>
  );
}
