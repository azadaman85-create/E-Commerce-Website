/**
 * Transactional email.
 *
 * Deliberately a plain fetch against Resend's HTTP API rather than an SDK:
 * it is one POST, and it keeps the dependency tree (and the peer-version
 * surface) unchanged.
 *
 * With no RESEND_API_KEY set, sending is a no-op that logs what it would have
 * sent. A missing key must never fail a payment — the order is already taken
 * and the customer is already charged.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** Plain-text fallback for clients that refuse HTML. */
  text?: string;
  replyTo?: string;
}

export interface EmailResult {
  sent: boolean;
  skipped?: "not-configured";
  id?: string;
  error?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.log(
      `[email] not configured — would have sent "${message.subject}" to ${message.to}`,
    );
    return { sent: false, skipped: "not-configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        ...(message.text ? { text: message.text } : {}),
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error(`[email] send failed (${res.status}): ${detail}`);
      return { sent: false, error: `${res.status}: ${detail.slice(0, 200)}` };
    }

    const data = (await res.json()) as { id?: string };
    return { sent: true, id: data.id };
  } catch (error) {
    console.error("[email] send threw", error);
    return {
      sent: false,
      error: error instanceof Error ? error.message : "unknown",
    };
  }
}

/**
 * Sends without ever throwing.
 *
 * Every caller here runs inside a payment or fulfilment path, where a failed
 * email must not roll back work that already succeeded. Failures are logged
 * and swallowed by design.
 */
export async function sendEmailSafely(message: EmailMessage): Promise<EmailResult> {
  try {
    return await sendEmail(message);
  } catch (error) {
    console.error("[email] unexpected failure", error);
    return { sent: false, error: "unexpected" };
  }
}
