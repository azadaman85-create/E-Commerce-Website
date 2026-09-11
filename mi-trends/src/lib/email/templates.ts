import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderWithItems, ReturnRequest, SiteSettings } from "@/types";

/**
 * Email templates.
 *
 * Written as table-based HTML with inline styles on purpose. Email clients —
 * Outlook especially — have no reliable flexbox, no grid, and strip <style>
 * blocks, so the layout techniques used on the site do not survive here.
 * Colours match the brand: near-black ground, muted gold (#b39b66).
 */

const INK = "#1a1a1a";
const GOLD = "#b39b66";
const MUTED = "#6b6b6b";
const HAIRLINE = "#e8e6e1";
const CREAM = "#f5f5f0";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface ShellOptions {
  settings: SiteSettings | null;
  preheader: string;
  heading: string;
  body: string;
  siteUrl: string;
}

/** Outer chrome shared by every message. */
function shell({ settings, preheader, heading, body, siteUrl }: ShellOptions): string {
  const siteName = escapeHtml(settings?.site_name ?? "MI TRENDS");
  const logo = settings?.logo_url ?? settings?.logo_inverted_url ?? null;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <!-- Preheader: the grey line clients show next to the subject. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${HAIRLINE};border-radius:2px;">

        <tr><td style="background:${INK};padding:28px 32px;text-align:center;">
          ${
            logo
              ? `<img src="${escapeHtml(logo)}" width="56" height="56" alt="" style="display:block;margin:0 auto 12px;border-radius:50%;">`
              : ""
          }
          <div style="color:${GOLD};font-size:20px;letter-spacing:0.08em;font-family:Georgia,'Times New Roman',serif;">${siteName}</div>
        </td></tr>

        <tr><td style="padding:36px 32px 8px;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;color:${INK};font-weight:400;">${escapeHtml(heading)}</h1>
        </td></tr>

        <tr><td style="padding:0 32px 32px;">${body}</td></tr>

        <tr><td style="background:${CREAM};padding:24px 32px;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;color:${MUTED};line-height:1.6;">
            Questions? Reply to this email${
              settings?.contact_email
                ? ` or write to <a href="mailto:${escapeHtml(settings.contact_email)}" style="color:${INK};">${escapeHtml(settings.contact_email)}</a>`
                : ""
            }.
          </p>
          <p style="margin:0;font-size:12px;color:${MUTED};">
            <a href="${escapeHtml(siteUrl)}" style="color:${MUTED};">${escapeHtml(siteName)}</a>
            ${settings?.business_address ? ` &middot; ${escapeHtml(settings.business_address)}` : ""}
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;">
    <tr><td style="background:${INK};border-radius:2px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
}

function itemRows(order: OrderWithItems, money: (n: number) => string): string {
  return order.order_items
    .map(
      (item) => `<tr>
      <td style="padding:12px 0;border-bottom:1px solid ${HAIRLINE};">
        ${
          item.image_url
            ? `<img src="${escapeHtml(item.image_url)}" width="56" alt="" style="display:block;border-radius:2px;">`
            : ""
        }
      </td>
      <td style="padding:12px;border-bottom:1px solid ${HAIRLINE};vertical-align:top;">
        <div style="font-size:15px;color:${INK};">${escapeHtml(item.title)}</div>
        ${
          item.variant_info?.length
            ? `<div style="font-size:12px;color:${MUTED};margin-top:2px;">${escapeHtml(item.variant_info.map((v) => v.value).join(" / "))}</div>`
            : ""
        }
        <div style="font-size:12px;color:${MUTED};margin-top:2px;">Qty ${item.quantity}</div>
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid ${HAIRLINE};font-size:14px;color:${INK};vertical-align:top;">
        ${money(Number(item.line_total))}
      </td>
    </tr>`,
    )
    .join("");
}

function totalsRows(order: OrderWithItems, money: (n: number) => string): string {
  const row = (label: string, value: string, bold = false) =>
    `<tr>
      <td style="padding:6px 0;font-size:${bold ? 15 : 14}px;color:${bold ? INK : MUTED};">${label}</td>
      <td align="right" style="padding:6px 0;font-size:${bold ? 18 : 14}px;color:${INK};${bold ? "font-family:Georgia,serif;" : ""}">${value}</td>
    </tr>`;

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
    ${row("Subtotal", money(Number(order.subtotal)))}
    ${Number(order.discount_amount) > 0 ? row(`Discount${order.coupon_code ? ` (${escapeHtml(order.coupon_code)})` : ""}`, `−${money(Number(order.discount_amount))}`) : ""}
    ${row(`Shipping${order.shipping_method ? ` · ${escapeHtml(order.shipping_method)}` : ""}`, Number(order.shipping_cost) === 0 ? "Free" : money(Number(order.shipping_cost)))}
    ${row("Tax", money(Number(order.tax_amount)))}
    <tr><td colspan="2" style="border-top:1px solid ${HAIRLINE};padding-top:8px;"></td></tr>
    ${row("Total", money(Number(order.total)), true)}
  </table>`;
}

function addressBlock(order: OrderWithItems): string {
  const a = order.shipping_address;
  return `<div style="font-size:14px;color:${MUTED};line-height:1.7;">
    ${escapeHtml(a.full_name)}<br>
    ${escapeHtml(a.address_line1)}<br>
    ${a.address_line2 ? `${escapeHtml(a.address_line2)}<br>` : ""}
    ${escapeHtml(a.city)}, ${escapeHtml(a.state)} ${escapeHtml(a.zip)}<br>
    ${escapeHtml(a.country)}
  </div>`;
}

const sectionLabel = (text: string) =>
  `<div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};margin:28px 0 8px;">${text}</div>`;

export function orderConfirmationEmail(
  order: OrderWithItems,
  settings: SiteSettings | null,
  siteUrl: string,
) {
  const money = (n: number) =>
    formatCurrency(n, settings?.currency_symbol ?? "₹", settings?.currency_code ?? "INR");

  const delivery = new Date(order.created_at);
  delivery.setDate(delivery.getDate() + 6);

  const body = `
    <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${MUTED};">
      Thanks — we've got your order and we're getting it ready. You'll hear from
      us again the moment it ships.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;background:${CREAM};border-radius:2px;width:100%;">
      <tr><td style="padding:16px 20px;">
        <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};">Order number</div>
        <div style="font-family:Georgia,serif;font-size:20px;color:${INK};margin-top:4px;">${escapeHtml(order.order_number)}</div>
        <div style="font-size:13px;color:${MUTED};margin-top:8px;">Estimated delivery ${formatDate(delivery.toISOString())}</div>
      </td></tr>
    </table>

    ${sectionLabel("Your order")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(order, money)}</table>
    ${totalsRows(order, money)}

    ${sectionLabel("Delivering to")}
    ${addressBlock(order)}

    ${button("View your order", `${siteUrl}/account/orders`)}
  `;

  return {
    subject: `Order ${order.order_number} confirmed`,
    html: shell({
      settings,
      preheader: `We've received order ${order.order_number}. Estimated delivery ${formatDate(delivery.toISOString())}.`,
      heading: "Thanks for your order",
      body,
      siteUrl,
    }),
    text:
      `Thanks for your order.\n\n` +
      `Order ${order.order_number}\n` +
      `Total ${money(Number(order.total))}\n` +
      `Estimated delivery ${formatDate(delivery.toISOString())}\n\n` +
      `View it at ${siteUrl}/account/orders`,
  };
}

export function shippingNotificationEmail(
  order: OrderWithItems,
  settings: SiteSettings | null,
  siteUrl: string,
) {
  const carrier = order.tracking_carrier ?? "our carrier";

  const body = `
    <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${MUTED};">
      Order ${escapeHtml(order.order_number)} has left us and is on its way with
      ${escapeHtml(carrier)}.
    </p>

    ${
      order.tracking_number
        ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;background:${CREAM};border-radius:2px;width:100%;">
            <tr><td style="padding:16px 20px;">
              <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};">Tracking number</div>
              <div style="font-family:Georgia,serif;font-size:18px;color:${INK};margin-top:4px;">${escapeHtml(order.tracking_number)}</div>
            </td></tr>
          </table>`
        : ""
    }

    ${sectionLabel("In this parcel")}
    <div style="font-size:14px;color:${MUTED};line-height:1.8;">
      ${order.order_items.map((i) => `${i.quantity} × ${escapeHtml(i.title)}`).join("<br>")}
    </div>

    ${sectionLabel("Delivering to")}
    ${addressBlock(order)}

    ${button("Track your order", `${siteUrl}/account/orders`)}
  `;

  return {
    subject: `Order ${order.order_number} is on its way`,
    html: shell({
      settings,
      preheader: `Your order has shipped${order.tracking_number ? ` — tracking ${order.tracking_number}` : ""}.`,
      heading: "Your order has shipped",
      body,
      siteUrl,
    }),
    text:
      `Order ${order.order_number} has shipped with ${carrier}.\n` +
      (order.tracking_number ? `Tracking: ${order.tracking_number}\n` : "") +
      `\nTrack it at ${siteUrl}/account/orders`,
  };
}

export function returnReceivedEmail(
  request: ReturnRequest,
  settings: SiteSettings | null,
  siteUrl: string,
) {
  const money = (n: number) =>
    formatCurrency(n, settings?.currency_symbol ?? "₹", settings?.currency_code ?? "INR");

  const body = `
    <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:${MUTED};">
      We've received your return request for order
      ${escapeHtml(request.order_number)}. We'll review it and email a prepaid
      label within one business day.
    </p>

    ${sectionLabel("Returning")}
    <div style="font-size:14px;color:${MUTED};line-height:1.8;">
      ${request.items.map((i) => `${i.quantity} × ${escapeHtml(i.title)}`).join("<br>")}
    </div>

    ${sectionLabel("Reason")}
    <div style="font-size:14px;color:${INK};">${escapeHtml(request.reason)}</div>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;background:${CREAM};border-radius:2px;width:100%;">
      <tr><td style="padding:16px 20px;">
        <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};">Estimated refund</div>
        <div style="font-family:Georgia,serif;font-size:20px;color:${INK};margin-top:4px;">${money(Number(request.refund_amount))}</div>
      </td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.7;">
      Items must be unworn with tags attached. Refunds are issued to the
      original payment method within two business days of the parcel arriving.
    </p>

    ${button("View your order", `${siteUrl}/account/orders`)}
  `;

  return {
    subject: `Return requested for ${request.order_number}`,
    html: shell({
      settings,
      preheader: `We've received your return request for ${request.order_number}.`,
      heading: "Return request received",
      body,
      siteUrl,
    }),
    text:
      `We've received your return request for order ${request.order_number}.\n` +
      `Estimated refund ${money(Number(request.refund_amount))}.\n\n` +
      `We'll email a prepaid label within one business day.`,
  };
}
