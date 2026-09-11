import { describe, expect, it } from "vitest";
import { checkReturnEligibility, RETURN_WINDOW_DAYS } from "@/lib/returns";
import type { FulfillmentStatus, PaymentStatus } from "@/types";

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();

const order = (over: {
  payment_status?: PaymentStatus;
  fulfillment_status?: FulfillmentStatus;
  created_at?: string;
  updated_at?: string;
} = {}) => ({
  payment_status: "paid" as PaymentStatus,
  fulfillment_status: "delivered" as FulfillmentStatus,
  created_at: daysAgo(5),
  updated_at: daysAgo(5),
  ...over,
});

describe("checkReturnEligibility", () => {
  it("allows a recently delivered paid order", () => {
    const r = checkReturnEligibility(order());
    expect(r.eligible).toBe(true);
    if (r.eligible) expect(r.daysLeft).toBe(RETURN_WINDOW_DAYS - 5);
  });

  it("refuses an unpaid order", () => {
    const r = checkReturnEligibility(order({ payment_status: "pending" }));
    expect(r).toMatchObject({ eligible: false });
  });

  it("refuses a cancelled order", () => {
    const r = checkReturnEligibility(order({ fulfillment_status: "cancelled" }));
    expect(r).toMatchObject({ eligible: false });
  });

  it("refuses when a return is already open", () => {
    const r = checkReturnEligibility(order(), true);
    expect(r).toMatchObject({ eligible: false });
    if (!r.eligible) expect(r.reason).toMatch(/already open/i);
  });

  it("refuses once the window has closed", () => {
    const stale = daysAgo(RETURN_WINDOW_DAYS + 1);
    const r = checkReturnEligibility(
      order({ created_at: stale, updated_at: stale }),
    );
    expect(r).toMatchObject({ eligible: false });
    if (!r.eligible) expect(r.reason).toMatch(/window has closed/i);
  });

  it("counts from delivery, not from when the order was placed", () => {
    // Ordered well outside the window, but only delivered two days ago.
    const r = checkReturnEligibility(
      order({
        created_at: daysAgo(60),
        updated_at: daysAgo(2),
        fulfillment_status: "delivered",
      }),
    );
    expect(r.eligible).toBe(true);
    if (r.eligible) expect(r.daysLeft).toBe(RETURN_WINDOW_DAYS - 2);
  });

  it("counts from the order date while still in transit", () => {
    // Not yet delivered, so updated_at is not a delivery date and must be
    // ignored — otherwise any admin edit would silently restart the clock.
    const r = checkReturnEligibility(
      order({
        fulfillment_status: "shipped",
        created_at: daysAgo(10),
        updated_at: daysAgo(1),
      }),
    );
    expect(r.eligible).toBe(true);
    if (r.eligible) expect(r.daysLeft).toBe(RETURN_WINDOW_DAYS - 10);
  });

  it("is still open on the final day", () => {
    const edge = daysAgo(RETURN_WINDOW_DAYS - 1);
    const r = checkReturnEligibility(
      order({ created_at: edge, updated_at: edge }),
    );
    expect(r.eligible).toBe(true);
  });

  it("closes exactly on the boundary day", () => {
    const edge = daysAgo(RETURN_WINDOW_DAYS);
    const r = checkReturnEligibility(
      order({ created_at: edge, updated_at: edge }),
    );
    expect(r.eligible).toBe(false);
  });
});
