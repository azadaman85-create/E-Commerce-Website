"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { EASE_TACTILE } from "@/lib/motion";

type Mode = "signin" | "signup";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.1 7.1 0 0 1 0-4.6v-3H1.3a12 12 0 0 0 0 10.6l4-3Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.3 6.7l4 3A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  );
}

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextParam = searchParams.get("next");
  const nextPath = nextParam?.startsWith("/") ? nextParam : "/account";

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (password.length < 8) {
      next.password = "Use at least 8 characters.";
    }
    if (mode === "signup" && !fullName.trim()) {
      next.fullName = "Tell us your name.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          toast.error("Couldn't sign you in", error.message);
          return;
        }
        toast.success("Welcome back");
        router.push(nextPath);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (error) {
          toast.error("Couldn't create your account", error.message);
          return;
        }

        // With email confirmation on, no session comes back immediately.
        if (data.session) {
          toast.success("Account created", "Welcome to MI TRENDS.");
          router.push(nextPath);
          router.refresh();
        } else {
          toast.success("Check your inbox", "Confirm your email to finish signing up.");
          setMode("signin");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (error) {
      toast.error("Google sign-in unavailable", error.message);
      setOauthLoading(false);
    }
  }

  return (
    <div>
      <div className="text-center">
        <h1 className="font-serif text-section-sm leading-tight text-ink">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-3 text-body-sm text-muted">
          {mode === "signin"
            ? "Sign in to track orders and sync your wishlist."
            : "One account for orders, addresses and saved items."}
        </p>
      </div>

      <div
        className="mt-10 grid grid-cols-2 rounded-sm bg-cream p-1"
        role="tablist"
        aria-label="Authentication mode"
      >
        {(["signin", "signup"] as Mode[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setErrors({});
            }}
            className={cn(
              "relative h-11 cursor-pointer rounded-sm text-caption uppercase tracking-[0.1em] transition-colors",
              mode === value ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {mode === value && (
              <motion.span
                layoutId="auth-tab"
                className="absolute inset-0 rounded-sm bg-white shadow-card"
                transition={{ duration: 0.28, ease: EASE_TACTILE }}
              />
            )}
            <span className="relative">
              {value === "signin" ? "Sign in" : "Sign up"}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <AnimatePresence initial={false} mode="popLayout">
          {mode === "signup" && (
            <motion.div
              key="name"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE_TACTILE }}
            >
              <Input
                label="Full name"
                required
                autoComplete="name"
                value={fullName}
                error={errors.fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Password"
          type="password"
          required
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          error={errors.password}
          hint={mode === "signup" ? "At least 8 characters." : undefined}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button type="submit" loading={loading} fullWidth size="lg">
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <span className="h-px flex-1 bg-hairline" />
        <span className="text-caption uppercase tracking-[0.1em] text-muted">or</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <Button
        type="button"
        variant="secondary"
        fullWidth
        size="lg"
        loading={oauthLoading}
        onClick={signInWithGoogle}
      >
        <GoogleMark />
        Continue with Google
      </Button>

      <p className="mt-8 text-center text-caption normal-case tracking-normal text-muted">
        By continuing you agree to our{" "}
        <a href="/terms" className="text-accent underline underline-offset-4">
          terms
        </a>{" "}
        and{" "}
        <a href="/privacy-policy" className="text-accent underline underline-offset-4">
          privacy policy
        </a>
        .
      </p>
    </div>
  );
}
