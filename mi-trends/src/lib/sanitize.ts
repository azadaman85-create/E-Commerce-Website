/**
 * Allow-list sanitiser for the rich text the admin panel produces.
 *
 * Product descriptions are written by admins in TipTap and rendered with
 * dangerouslySetInnerHTML, so the trust boundary is "anyone with an admin
 * account". That is a much smaller risk than public input, but an admin
 * account is also exactly what an attacker would target — and pasting from
 * an external page can carry markup nobody inspected. Sanitising on render
 * costs nothing and removes the question entirely.
 *
 * Deliberately allow-list based: anything not named here is dropped, so a
 * tag or attribute added to the editor later cannot silently become a hole.
 */
const ALLOWED_TAGS = new Set([
  "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "del",
  "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "span",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
};

/** Schemes that cannot execute. Blocks javascript:, data:, vbscript:. */
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";

  let html = dirty;

  // Drop whole elements whose content is executable or fetches remotely.
  html = html.replace(
    /<(script|style|iframe|object|embed|form|link|meta|base)\b[\s\S]*?<\/\1\s*>/gi,
    "",
  );
  html = html.replace(
    /<(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*\/?>/gi,
    "",
  );
  // Comments can hide conditional markup in older engines.
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  return html.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g,
    (_match, closing: string, rawName: string, rawAttrs: string) => {
      const tag = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";
      if (closing) return `</${tag}>`;

      const permitted = ALLOWED_ATTRS[tag];
      if (!permitted) return `<${tag}>`;

      const kept: string[] = [];
      const attrPattern = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g;
      let attr: RegExpExecArray | null;

      while ((attr = attrPattern.exec(rawAttrs)) !== null) {
        const name = attr[1].toLowerCase();
        if (!permitted.has(name)) continue;

        const value = attr[2].replace(/^["']|["']$/g, "");
        if (name === "href" && !SAFE_HREF.test(value.trim())) continue;
        // Never re-emit an inline event handler, belt and braces.
        if (name.startsWith("on")) continue;

        kept.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
      }

      // A link opening a new tab without noopener leaks window.opener.
      if (tag === "a" && kept.some((a) => a.startsWith('target="_blank"'))) {
        if (!kept.some((a) => a.startsWith("rel="))) {
          kept.push('rel="noopener noreferrer"');
        }
      }

      return kept.length > 0 ? `<${tag} ${kept.join(" ")}>` : `<${tag}>`;
    },
  );
}

/**
 * Serialises structured data for a <script type="application/ld+json"> block.
 *
 * Plain JSON.stringify is not enough: if any field contains the literal
 * "</script>" — a product title pasted from elsewhere, say — the browser ends
 * the script element early and treats the remainder as markup. Escaping "<"
 * as a unicode sequence keeps the JSON valid while making that impossible.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/** GA4 measurement ids look like G-XXXXXXXXXX; legacy ones like UA-123-4. */
const GA_ID = /^(G-[A-Z0-9]{4,20}|UA-\d{4,12}-\d{1,4}|AW-\d{6,16})$/i;
/** Meta pixel ids are numeric. */
const PIXEL_ID = /^\d{6,20}$/;

/**
 * Analytics ids are written into an inline <script>, so an invalid one is not
 * a broken tag — it is arbitrary JavaScript on every page. Admin-authored,
 * but that is precisely the account worth stealing, so the value is checked
 * against its known shape and dropped otherwise.
 */
export function safeAnalyticsId(
  id: string | null | undefined,
  kind: "ga" | "pixel",
): string | null {
  if (!id) return null;
  const trimmed = id.trim();
  const pattern = kind === "ga" ? GA_ID : PIXEL_ID;
  return pattern.test(trimmed) ? trimmed : null;
}
