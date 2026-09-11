"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { Stars, StarInput } from "@/components/ui/Stars";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { formatDate, initials } from "@/lib/utils";
import { EASE_TACTILE, fadeUp, inViewOnce, staggerList } from "@/lib/motion";
import type { Review } from "@/types";

const PER_PAGE = 5;

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  average: number;
  total: number;
  breakdown: Record<number, number>;
}

export function ProductReviews({
  productId,
  reviews: initialReviews,
  average: initialAverage,
  total: initialTotal,
  breakdown: initialBreakdown,
}: ProductReviewsProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [reviews, setReviews] = useState(initialReviews);
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const { average, total, breakdown } = useMemo(() => {
    if (reviews === initialReviews) {
      return {
        average: initialAverage,
        total: initialTotal,
        breakdown: initialBreakdown,
      };
    }
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of reviews) {
      counts[r.rating] = (counts[r.rating] ?? 0) + 1;
      sum += r.rating;
    }
    return {
      average: reviews.length ? sum / reviews.length : 0,
      total: reviews.length,
      breakdown: counts,
    };
  }, [reviews, initialReviews, initialAverage, initialTotal, initialBreakdown]);

  const pageCount = Math.max(1, Math.ceil(reviews.length / PER_PAGE));
  const visible = reviews.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      toast.info("Sign in to review", "Only verified buyers can leave a review.");
      return;
    }
    if (rating === 0) {
      toast.error("Choose a rating", "Tap a star to rate this product.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title: title.trim(), body: body.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Couldn't post your review", data.error ?? "Please try again.");
        return;
      }

      setReviews((prev) => [data.review as Review, ...prev]);
      setRating(0);
      setTitle("");
      setBody("");
      setFormOpen(false);
      setPage(1);
      toast.success("Thanks for your review", "It's live on the product page.");
    } catch {
      toast.error("Couldn't post your review", "Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" className="scroll-mt-24">
      <motion.div {...inViewOnce} variants={fadeUp}>
        <h2 className="font-serif text-section-sm leading-tight text-ink">
          Customer reviews
        </h2>
      </motion.div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[320px_1fr] lg:gap-16">
        <div>
          <div className="card-surface p-8">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-5xl text-ink">
                {average.toFixed(1)}
              </span>
              <span className="text-body-sm text-muted">out of 5</span>
            </div>
            <div className="mt-3">
              <Stars rating={average} size={18} />
            </div>
            <p className="mt-2 text-caption normal-case tracking-normal text-muted">
              Based on {total} review{total === 1 ? "" : "s"}
            </p>

            <div className="mt-8 flex flex-col gap-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] ?? 0;
                const percent = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-8 shrink-0 text-caption normal-case tracking-normal text-muted">
                      {star}★
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8">
                      <motion.div
                        className="h-full rounded-full bg-[#F59E0B]"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${percent}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: EASE_TACTILE, delay: 0.1 }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-caption normal-case tracking-normal tabular-nums text-muted">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setFormOpen((o) => !o)}
            >
              {formOpen ? "Cancel" : "Write a review"}
            </Button>
          </div>

          {formOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, ease: EASE_TACTILE }}
              onSubmit={submit}
              className="mt-6 flex flex-col gap-5 overflow-hidden"
            >
              <div>
                <span className="label-caps">Your rating</span>
                <div className="mt-2">
                  <StarInput value={rating} onChange={setRating} />
                </div>
              </div>

              <Input
                label="Review title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />

              <Textarea
                label="Your review"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                maxLength={2000}
                required
              />

              <Button type="submit" loading={submitting} fullWidth>
                Submit review
              </Button>

              {!user && (
                <p className="text-caption normal-case tracking-normal text-muted">
                  You&rsquo;ll need to sign in, and to have purchased this item.
                </p>
              )}
            </motion.form>
          )}
        </div>

        <div>
          {reviews.length === 0 ? (
            <div className="card-surface flex flex-col items-center justify-center p-16 text-center">
              <Stars rating={0} size={20} />
              <p className="mt-4 font-serif text-xl text-ink">No reviews yet</p>
              <p className="mt-2 text-body-sm text-muted">
                Bought this? Be the first to share your thoughts.
              </p>
            </div>
          ) : (
            <>
              <motion.ul
                variants={staggerList}
                initial="hidden"
                animate="visible"
                className="flex flex-col divide-y divide-hairline border-y border-hairline"
              >
                {visible.map((review) => (
                  <motion.li
                    key={review.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    className="py-8 first:pt-0"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-caption font-medium normal-case tracking-normal text-ink">
                        {initials(review.author_name ?? "Anonymous")}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-body-sm font-medium text-ink">
                            {review.author_name ?? "Verified customer"}
                          </span>
                          {review.is_verified && (
                            <span className="flex items-center gap-1 text-caption normal-case tracking-normal text-success">
                              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                              Verified purchase
                            </span>
                          )}
                          <span className="text-caption normal-case tracking-normal text-muted">
                            {formatDate(review.created_at)}
                          </span>
                        </div>

                        <div className="mt-2">
                          <Stars rating={review.rating} size={14} />
                        </div>

                        {review.title && (
                          <h3 className="mt-3 font-serif text-lg text-ink">
                            {review.title}
                          </h3>
                        )}
                        {review.body && (
                          <p className="mt-2 text-body-sm leading-relaxed text-muted">
                            {review.body}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>

              <Pagination
                page={page}
                pageCount={pageCount}
                onChange={setPage}
                className="mt-10"
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
