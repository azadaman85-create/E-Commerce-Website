import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isEmailConfigured, sendEmail, sendEmailSafely } from "@/lib/email/send";
import {
  orderConfirmationEmail,
  returnReceivedEmail,
  shippingNotificationEmail,
} from "@/lib/email/templates";
import type { OrderWithItems, ReturnRequest, SiteSettings } from "@/types";

const settings = {
  site_name: "MI TRENDS",
  currency_symbol: "₹",
  currency_code: "INR",
  contact_email: "hello@mitrends.com",
  logo_url: null,
  logo_inverted_url: null,
  business_address: "Bengaluru",
} as unknown as SiteSettings;

const order = {
  id: "o1",
  order_number: "ORD-10001",
  email: "customer@example.com",
  created_at: "2026-01-10T10:00:00Z",
  subtotal: 3000,
  discount_amount: 300,
  shipping_cost: 0,
  tax_amount: 486,
  total: 3186,
  coupon_code: "WELCOME10",
  shipping_method: "Standard",
  tracking_number: "TRK123",
  tracking_carrier: "BlueDart",
  shipping_address: {
    full_name: "Test Person",
    address_line1: "12 MG Road",
    address_line2: null,
    city: "Bengaluru",
    state: "Karnataka",
    zip: "560001",
    country: "India",
  },
  order_items: [
    {
      id: "i1",
      title: "Silk Slip Dress",
      image_url: "https://example.com/a.jpg",
      variant_info: [{ option_name: "Size", value: "M" }],
      quantity: 2,
      unit_price: 1500,
      line_total: 3000,
    },
  ],
} as unknown as OrderWithItems;

const SITE = "https://shop.example.com";

describe("isEmailConfigured", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("is false when the key is missing", () => {
    delete process.env.RESEND_API_KEY;
    process.env.EMAIL_FROM = "a@b.com";
    expect(isEmailConfigured()).toBe(false);
  });

  it("is false when the from address is missing", () => {
    process.env.RESEND_API_KEY = "re_x";
    delete process.env.EMAIL_FROM;
    expect(isEmailConfigured()).toBe(false);
  });

  it("is true when both are set", () => {
    process.env.RESEND_API_KEY = "re_x";
    process.env.EMAIL_FROM = "a@b.com";
    expect(isEmailConfigured()).toBe(true);
  });
});

describe("sendEmail", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("skips without throwing when not configured", async () => {
    delete process.env.RESEND_API_KEY;
    vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendEmail({ to: "a@b.com", subject: "s", html: "<p>h</p>" });
    expect(result).toMatchObject({ sent: false, skipped: "not-configured" });
  });

  it("reports failure rather than throwing when the API errors", async () => {
    process.env.RESEND_API_KEY = "re_x";
    process.env.EMAIL_FROM = "a@b.com";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 422 })),
    );

    const result = await sendEmail({ to: "a@b.com", subject: "s", html: "<p>h</p>" });
    expect(result.sent).toBe(false);
    expect(result.error).toContain("422");
  });

  it("never throws even when fetch itself rejects", async () => {
    process.env.RESEND_API_KEY = "re_x";
    process.env.EMAIL_FROM = "a@b.com";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );

    // A failed email must never take down the payment path that called it.
    await expect(
      sendEmailSafely({ to: "a@b.com", subject: "s", html: "<p>h</p>" }),
    ).resolves.toMatchObject({ sent: false });
  });
});

describe("order confirmation template", () => {
  const mail = orderConfirmationEmail(order, settings, SITE);

  it("puts the order number in the subject", () => {
    expect(mail.subject).toContain("ORD-10001");
  });

  it("lists the item, quantity and total", () => {
    expect(mail.html).toContain("Silk Slip Dress");
    expect(mail.html).toContain("Qty 2");
    expect(mail.html).toContain("3,186.00");
  });

  it("shows the discount and coupon code when one was used", () => {
    expect(mail.html).toContain("WELCOME10");
    expect(mail.html).toContain("300.00");
  });

  it("shows free shipping as a word, not as zero", () => {
    expect(mail.html).toContain("Free");
  });

  it("includes the delivery address", () => {
    expect(mail.html).toContain("12 MG Road");
    expect(mail.html).toContain("560001");
  });

  it("carries a plain-text alternative", () => {
    expect(mail.text).toContain("ORD-10001");
  });

  it("escapes HTML so a product title cannot inject markup", () => {
    const hostile = {
      ...order,
      order_items: [{ ...order.order_items[0], title: '<img src=x onerror="alert(1)">' }],
    } as unknown as OrderWithItems;

    const out = orderConfirmationEmail(hostile, settings, SITE).html;
    expect(out).not.toContain('onerror="alert(1)"');
    expect(out).toContain("&lt;img");
  });
});

describe("shipping notification template", () => {
  const mail = shippingNotificationEmail(order, settings, SITE);

  it("names the carrier and tracking number", () => {
    expect(mail.html).toContain("BlueDart");
    expect(mail.html).toContain("TRK123");
  });

  it("omits the tracking block entirely when there is none", () => {
    const untracked = { ...order, tracking_number: null } as unknown as OrderWithItems;
    expect(shippingNotificationEmail(untracked, settings, SITE).html).not.toContain(
      "Tracking number",
    );
  });
});

describe("return acknowledgement template", () => {
  const request = {
    order_number: "ORD-10001",
    email: "customer@example.com",
    reason: "Doesn't fit",
    refund_amount: 1500,
    items: [{ order_item_id: "i1", title: "Silk Slip Dress", variant_info: null, quantity: 1 }],
  } as unknown as ReturnRequest;

  const mail = returnReceivedEmail(request, settings, SITE);

  it("states the refund estimate and the reason", () => {
    expect(mail.html).toContain("1,500.00");
    expect(mail.html).toContain("Doesn&#039;t fit".replace("&#039;", "'"));
  });

  it("references the order", () => {
    expect(mail.subject).toContain("ORD-10001");
  });
});
