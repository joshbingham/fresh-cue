import { describe, expect, it } from "vitest";
import {
  extractExpiryDateCandidates,
  getDaysUntilExpiry,
  getExpiryUrgency,
  parseExpiryDate,
} from "./expiry";

const today = new Date(2026, 7, 3);

describe("getDaysUntilExpiry", () => {
  it("returns a negative number for an expired item", () => {
    expect(getDaysUntilExpiry("2026-08-02", today)).toBe(-1);
  });

  it("returns zero for an item expiring today", () => {
    expect(getDaysUntilExpiry("2026-08-03", today)).toBe(0);
  });

  it("returns the number of days remaining", () => {
    expect(getDaysUntilExpiry("2026-08-06", today)).toBe(3);
  });
});

describe("getExpiryUrgency", () => {
  it("returns expired for a past date", () => {
    expect(getExpiryUrgency("2026-08-02", today)).toBe("expired");
  });

  it("returns today for the current date", () => {
    expect(getExpiryUrgency("2026-08-03", today)).toBe("today");
  });

  it("returns soon for an item expiring within three days", () => {
    expect(getExpiryUrgency("2026-08-06", today)).toBe("soon");
  });

  it("returns later for an item expiring after three days", () => {
    expect(getExpiryUrgency("2026-08-07", today)).toBe("later");
  });
});

describe("parseExpiryDate", () => {
  it("returns an ISO date unchanged", () => {
    expect(parseExpiryDate("2026-09-05")).toBe("2026-09-05");
  });

  it("parses a slash-separated day-first date", () => {
    expect(parseExpiryDate("05/09/2026")).toBe("2026-09-05");
  });

  it("parses a dash-separated day-first date", () => {
    expect(parseExpiryDate("5-9-2026")).toBe("2026-09-05");
  });

  it("parses a dot-separated date with a two-digit year", () => {
    expect(parseExpiryDate("05.09.26")).toBe("2026-09-05");
  });

  it("parses an abbreviated named month", () => {
    expect(parseExpiryDate("5 SEP 2026")).toBe("2026-09-05");
  });

  it("parses a full named month", () => {
    expect(parseExpiryDate("05 September 26")).toBe("2026-09-05");
  });

  it("handles named months case-insensitively", () => {
    expect(parseExpiryDate("5 sep 2026")).toBe("2026-09-05");
  });

  it("ignores surrounding whitespace", () => {
    expect(parseExpiryDate("  5 SEP 2026  ")).toBe("2026-09-05");
  });

  it("accepts a valid leap-day date", () => {
    expect(parseExpiryDate("29/02/2028")).toBe("2028-02-29");
  });

  it("rejects an invalid leap-day date", () => {
    expect(parseExpiryDate("29/02/2025")).toBeNull();
  });

  it("rejects a day that does not exist in the month", () => {
    expect(parseExpiryDate("31/04/2026")).toBeNull();
  });

  it("rejects an invalid month", () => {
    expect(parseExpiryDate("05/13/2026")).toBeNull();
  });

  it("rejects an invalid day", () => {
    expect(parseExpiryDate("32/01/2026")).toBeNull();
  });

  it("rejects an unknown named month", () => {
    expect(parseExpiryDate("5 Smarch 2026")).toBeNull();
  });

  it("rejects an empty value", () => {
    expect(parseExpiryDate("")).toBeNull();
  });

  it("rejects whitespace-only input", () => {
    expect(parseExpiryDate("   ")).toBeNull();
  });

  it("rejects a month and year without a day", () => {
    expect(parseExpiryDate("SEP 2026")).toBeNull();
  });

  it("rejects a date without a year", () => {
    expect(parseExpiryDate("05/09")).toBeNull();
  });

  it("rejects surrounding packaging text rather than guessing", () => {
    expect(parseExpiryDate("BEST BEFORE 05/09/2026")).toBeNull();
  });

  it("rejects years before the supported range", () => {
    expect(parseExpiryDate("05/09/1999")).toBeNull();
  });

  it("rejects years after the supported range", () => {
    expect(parseExpiryDate("05/09/2101")).toBeNull();
  });
});

describe("extractExpiryDateCandidates", () => {
  it("extracts a numeric date from surrounding packaging text", () => {
    expect(
      extractExpiryDateCandidates(
        "USE BY 05/09/2026 LOT 12345",
      ),
    ).toEqual(["05/09/2026"]);
  });

  it("extracts a named-month date", () => {
    expect(
      extractExpiryDateCandidates(
        "BEST BEFORE 05 SEP 2026",
      ),
    ).toEqual(["05 SEP 2026"]);
  });

  it("extracts a two-digit-year date joined to a time by OCR", () => {
    expect(
      extractExpiryDateCandidates(
        "BBE:09/01/2712:46SA",
      ),
    ).toEqual(["09/01/27"]);
  });

  it("extracts a date split across OCR whitespace", () => {
    expect(
      extractExpiryDateCandidates(
        "BEST BEFORE\n05   SEP   2026\nLOT 123",
      ),
    ).toEqual(["05 SEP 2026"]);
  });

  it("extracts an ISO-style date", () => {
    expect(
      extractExpiryDateCandidates(
        "Expiry: 2026-09-05",
      ),
    ).toEqual(["2026-09-05"]);
  });

  it("extracts multiple candidate dates", () => {
    expect(
      extractExpiryDateCandidates(
        "PACKED 01/09/2026 USE BY 05/09/2026",
      ),
    ).toEqual([
      "01/09/2026",
      "05/09/2026",
    ]);
  });

  it("removes duplicate candidates", () => {
    expect(
      extractExpiryDateCandidates(
        "05/09/2026 USE BY 05/09/2026",
      ),
    ).toEqual(["05/09/2026"]);
  });

  it("returns an invalid date-like candidate for the parser to reject", () => {
    const candidates =
      extractExpiryDateCandidates(
        "USE BY 31/02/2026",
      );

    expect(candidates).toEqual(["31/02/2026"]);
    expect(parseExpiryDate(candidates[0])).toBeNull();
  });

  it("ignores unrelated numbers", () => {
    expect(
      extractExpiryDateCandidates(
        "LOT 123456 BATCH 98765 500g",
      ),
    ).toEqual([]);
  });

  it("returns an empty array when OCR text is empty", () => {
    expect(
      extractExpiryDateCandidates(""),
    ).toEqual([]);
  });

  it("extracts a date next to punctuation", () => {
    expect(
      extractExpiryDateCandidates(
        "USE BY: 05/09/2026.",
      ),
    ).toEqual(["05/09/2026"]);
  });

  it("extracts mixed-case named months", () => {
    expect(
      extractExpiryDateCandidates(
        "Best before 05 Sep 2026",
      ),
    ).toEqual(["05 Sep 2026"]);
  });
});