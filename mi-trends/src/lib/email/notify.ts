import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmailSafely } from "@/lib/email/send";
import {
  orderConfirmationEmail,
  returnReceivedEmail,
  shippingNotificationEmail,
} from "@/lib/email/templates";
import { absoluteUrl } from "@/lib/utils";
import type { OrderWithItems, ReturnRequest, SiteSettings } from "@/types";

/**
 * Loads the order and settings an email needs, then sends it.
 *
 * Every function here is fire-and-forget from the caller's perspective: they
 * run inside payment and fulfilment paths where a mail failure must not undo
 * work that already succeeded, so nothing throws.
 */
async function loadContext(orderId: string): Promise<{
  order: OrderWithItems | null;
  settings: SiteSettings | null;
}> {
  const admin = createAdminClient();

  const [{ data: orderRow }, { data: settingsRow }] = await Promise.all([
    admin.from("orders").select("*, order_items(*)").eq("id", orderId).maybeSingle(),
    admin.from("site_settings").select("*").limit(1).maybeSingle(),
  ]);

  return {
    order: (orderRow as OrderWithItems) ?? null,
    settings: (settingsRow as SiteSettings) ?? null,
  };
}

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  try {
    const { order, settings } = await loadContext(orderId);
    if (!order) return;

    const mail = orderConfirmationEmail(order, settings, absoluteUrl());
    await sendEmailSafely({
      to: order.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: settings?.contact_email ?? undefined,
    });
  } catch (error) {
    console.error("[email] order confirmation failed", error);
  }
}

export async function sendShippingNotification(orderId: string): Promise<void> {
  try {
    const { order, settings } = await loadContext(orderId);
    if (!order) return;

    const mail = shippingNotificationEmail(order, settings, absoluteUrl());
    await sendEmailSafely({
      to: order.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: settings?.contact_email ?? undefined,
    });
  } catch (error) {
    console.error("[email] shipping notification failed", error);
  }
}

export async function sendReturnReceived(request: ReturnRequest): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("site_settings").select("*").limit(1).maybeSingle();
    const settings = (data as SiteSettings) ?? null;

    const mail = returnReceivedEmail(request, settings, absoluteUrl());
    await sendEmailSafely({
      to: request.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: settings?.contact_email ?? undefined,
    });
  } catch (error) {
    console.error("[email] return acknowledgement failed", error);
  }
}
