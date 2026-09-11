import { describe, expect, it } from "vitest";
import {
  discountPercent,
  effectivePrice,
  isOnSale,
  round2,
  slugify,
  stripHtml,
  toCsv,
  truncate,
} from "@/lib/utils";

const product = (over: Partial<Parameters<typeof isOnSale>[0]> = {}) => ({
  price: 1000,
  sale_price: null as number | null,
  sale_start: null as string | null,
  sale_end: null as string | null,
  ...over,
});

const daysFromNow = (n: number) =>
  new Date(Date.now() + n * 86_400_000).toISOString();

describe("isOnSale", () => {
  it("is false with no sale price", () => {
    expect(isOnSale(product())).toBe(false);
  });

  it("is true inside an open-ended sale", () => {
    expect(isOnSale(product({ sale_price: 800 }))).toBe(true);
  });

  it("ignores a sale price that is not actually cheaper", () => {
    // A 'sale' at or above list is a data-entry mistake, not a sale.
    expect(isOnSale(product({ sale_price: 1000 }))).toBe(false);
    expect(isOnSale(product({ sale_price: 1200 }))).toBe(false);
  });

  it("is false before the window opens", () => {
    expect(
      isOnSale(product({ sale_price: 800, sale_start: daysFromNow(1) })),
    ).toBe(false);
  });

  it("is false after the window closes", () => {
    expect(
      isOnSale(product({ sale_price: 800, sale_end: daysFromNow(-1) })),
    ).toBe(false);
  });

  it("is true inside a bounded window", () => {
    expect(
      isOnSale(
        product({
          sale_price: 800,
          sale_start: daysFromNow(-1),
          sale_end: daysFromNow(1),
        }),
      ),
    ).toBe(true);
  });
});

describe("effectivePrice", () => {
  it("returns list price when not on sale", () => {
    expect(effectivePrice(product())).toBe(1000);
  });

  it("returns the sale price during a live sale", () => {
    expect(effectivePrice(product({ sale_price: 800 }))).toBe(800);
  });

  it("returns list price once the sale has expired", () => {
    expect(
      effectivePrice(product({ sale_price: 800, sale_end: daysFromNow(-1) })),
    ).toBe(1000);
  });
});

describe("discountPercent", () => {
  it("computes a whole-number percentage", () => {
    expect(discountPercent(1000, 750)).toBe(25);
  });

  it("rounds to the nearest percent", () => {
    expect(discountPercent(1000, 667)).toBe(33);
  });

  it("returns zero rather than dividing by zero", () => {
    expect(discountPercent(0, 0)).toBe(0);
  });
});

describe("round2", () => {
  it("fixes float drift", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it("rounds half up", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
  });

  it("leaves clean values alone", () => {
    expect(round2(10)).toBe(10);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Oxford Shirt")).toBe("oxford-shirt");
  });

  it("strips punctuation and apostrophes", () => {
    expect(slugify("Women's  Silk — Dress!")).toBe("womens-silk-dress");
  });

  it("trims leading and trailing separators", () => {
    expect(slugify("  --Hello--  ")).toBe("hello");
  });

  it("caps length so it stays a usable URL", () => {
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});

describe("stripHtml", () => {
  it("removes tags and decodes entities", () => {
    expect(stripHtml("<p>Merino &amp; cashmere</p>")).toBe("Merino & cashmere");
  });

  it("collapses whitespace", () => {
    expect(stripHtml("<p>a</p>\n\n  <p>b</p>")).toBe("a b");
  });
});

describe("truncate", () => {
  it("leaves short text alone", () => {
    expect(truncate("short", 10)).toBe("short");
  });

  it("appends an ellipsis when cutting", () => {
    expect(truncate("abcdefghij", 5)).toBe("abcde…");
  });
});

describe("toCsv", () => {
  it("writes a header row and the values", () => {
    expect(toCsv([{ a: 1, b: 2 }], ["a", "b"])).toBe("a,b\n1,2");
  });

  it("quotes values containing a comma", () => {
    expect(toCsv([{ a: "x,y" }], ["a"])).toBe('a\n"x,y"');
  });

  it("escapes embedded quotes by doubling them", () => {
    expect(toCsv([{ a: 'say "hi"' }], ["a"])).toBe('a\n"say ""hi"""');
  });

  it("renders null and undefined as empty, not as the word null", () => {
    expect(toCsv([{ a: null, b: undefined }], ["a", "b"])).toBe("a,b\n,");
  });
});
