import { describe, expect, it } from "vitest";
import { getDaysUntilExpiry, getExpiryUrgency } from "./expiry";

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