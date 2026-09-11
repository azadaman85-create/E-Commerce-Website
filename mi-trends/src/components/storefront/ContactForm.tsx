"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export function ContactForm() {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (form.message.trim().length < 10) {
      next.message = "Tell us a little more — at least 10 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Couldn't send your message", data.error ?? "Please try again.");
        return;
      }

      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent", "We'll reply within one business day.");
    } catch {
      toast.error("Couldn't send your message", "Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Input
        label="Your name"
        required
        value={form.name}
        error={errors.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        label="Email address"
        type="email"
        required
        value={form.email}
        error={errors.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Subject"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
      />
      <Textarea
        label="Message"
        required
        rows={6}
        value={form.message}
        error={errors.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />
      <Button type="submit" loading={sending} size="lg" fullWidth>
        Send message
      </Button>
    </form>
  );
}
