import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/lib/sanitize";

describe("sanitizeHtml", () => {
  it("keeps the formatting the editor actually produces", () => {
    const html =
      "<p>A <strong>merino</strong> crew, <em>fully</em> fashioned.</p><ul><li>One</li></ul>";
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("keeps headings and blockquotes", () => {
    expect(sanitizeHtml("<h2>Care</h2><blockquote>Wash cold</blockquote>")).toBe(
      "<h2>Care</h2><blockquote>Wash cold</blockquote>",
    );
  });

  it("strips script tags and their contents", () => {
    expect(sanitizeHtml("<p>ok</p><script>alert(1)</script>")).toBe("<p>ok</p>");
  });

  it("strips iframes, objects and embeds", () => {
    expect(sanitizeHtml('<iframe src="//evil"></iframe><p>ok</p>')).toBe("<p>ok</p>");
    expect(sanitizeHtml('<object data="x"></object><p>ok</p>')).toBe("<p>ok</p>");
  });

  it("removes inline event handlers", () => {
    expect(sanitizeHtml('<p onclick="steal()">text</p>')).toBe("<p>text</p>");
    expect(sanitizeHtml('<span onmouseover="x()">hi</span>')).toBe("<span>hi</span>");
  });

  it("drops javascript: links but keeps the text", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">click</a>')).toBe(
      "<a>click</a>",
    );
  });

  it("drops data: URLs", () => {
    expect(sanitizeHtml('<a href="data:text/html,<script>x</script>">x</a>')).toBe(
      "<a>x</a>",
    );
  });

  it("keeps ordinary links", () => {
    expect(sanitizeHtml('<a href="/products">Shop</a>')).toBe(
      '<a href="/products">Shop</a>',
    );
    expect(sanitizeHtml('<a href="https://example.com">Ext</a>')).toBe(
      '<a href="https://example.com">Ext</a>',
    );
  });

  it("adds rel=noopener to links that open a new tab", () => {
    const out = sanitizeHtml('<a href="https://x.com" target="_blank">x</a>');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("strips attributes that are not on the allow list", () => {
    expect(sanitizeHtml('<p class="x" style="color:red">t</p>')).toBe("<p>t</p>");
  });

  it("drops unknown tags but keeps their text", () => {
    expect(sanitizeHtml("<marquee>text</marquee>")).toBe("text");
  });

  it("removes comments, which can hide markup in older engines", () => {
    expect(sanitizeHtml("<p>a</p><!-- [if IE]><script>x</script><![endif] -->")).toBe(
      "<p>a</p>",
    );
  });

  it("is not fooled by mixed casing", () => {
    expect(sanitizeHtml("<SCRIPT>alert(1)</SCRIPT><P>ok</P>")).toBe("<p>ok</p>");
  });

  it("handles null and empty input", () => {
    expect(sanitizeHtml(null)).toBe("");
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml("")).toBe("");
  });

  it("leaves plain text untouched", () => {
    expect(sanitizeHtml("Just words & an ampersand")).toBe(
      "Just words & an ampersand",
    );
  });
});
