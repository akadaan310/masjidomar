import { describe, expect, it } from "vitest";
import {
  buildDay,
  calculateAdhan,
  localDateKey,
  nextPrayer,
  pickEffectivePublication,
  resolveIqamah,
  weekdayOf,
  zonedWallTime,
  type CalcConfig,
  type IqamahRule,
} from "@/lib/prayer/engine";

const TAMPA: CalcConfig = { latitude: 28.0337, longitude: -82.4012, method: "NorthAmerica", madhab: "shafi" };
const et = (d: Date) => new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
const fixed = (prayer: IqamahRule["prayer"], time: string, weekday: number | null = null): IqamahRule => ({ prayer, weekday, mode: "fixed", time_of_day: time, offset_minutes: null });

describe("local date & time zone handling", () => {
  it("rolls the masjid date at local midnight, not UTC midnight", () => {
    expect(localDateKey(new Date("2026-10-17T03:59:00Z"))).toBe("2026-10-16"); // 23:59 EDT
    expect(localDateKey(new Date("2026-10-17T04:00:00Z"))).toBe("2026-10-17"); // 00:00 EDT
    expect(localDateKey(new Date("2026-12-17T04:59:00Z"))).toBe("2026-12-16"); // 23:59 EST
  });

  it("computes weekday from the local date key regardless of server TZ", () => {
    expect(weekdayOf("2026-10-16")).toBe(5); // Friday
    expect(weekdayOf("2026-11-01")).toBe(0); // Sunday
  });

  it("keeps fixed iqamah at the same wall-clock time across DST (spring forward)", () => {
    const before = zonedWallTime("2027-03-13", "13:30");
    const after = zonedWallTime("2027-03-14", "13:30");
    expect(et(before)).toBe("13:30");
    expect(et(after)).toBe("13:30");
    expect(before.toISOString()).toBe("2027-03-13T18:30:00.000Z"); // EST = UTC-5
    expect(after.toISOString()).toBe("2027-03-14T17:30:00.000Z"); // EDT = UTC-4
  });

  it("keeps fixed iqamah at the same wall-clock time across DST (fall back)", () => {
    expect(zonedWallTime("2026-10-31", "20:00").toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(zonedWallTime("2026-11-01", "20:00").toISOString()).toBe("2026-11-02T01:00:00.000Z");
  });

  it("shifts calculated adhan by about an hour of clock time across the fall DST change", () => {
    const sat = calculateAdhan("2026-10-31", TAMPA);
    const sun = calculateAdhan("2026-11-01", TAMPA);
    const h = (d: Date) => Number(et(d).split(":")[0]);
    expect(h(sat.maghrib) - h(sun.maghrib)).toBe(1);
  });
});

describe("adhan calculation", () => {
  it("produces ordered times for Tampa", () => {
    const a = calculateAdhan("2026-10-16", TAMPA);
    const order = [a.fajr, a.sunrise, a.dhuhr, a.asr, a.maghrib, a.isha].map((d) => d.getTime());
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    expect(et(a.dhuhr)).toMatch(/^13:1\d$/);
  });

  it("uses a later Asr for the Hanafi rule", () => {
    const shafi = calculateAdhan("2026-10-16", TAMPA);
    const hanafi = calculateAdhan("2026-10-16", { ...TAMPA, madhab: "hanafi" });
    expect(hanafi.asr.getTime()).toBeGreaterThan(shafi.asr.getTime());
    expect(hanafi.dhuhr.getTime()).toBe(shafi.dhuhr.getTime());
  });

  it("applies minute adjustments", () => {
    const base = calculateAdhan("2026-10-16", TAMPA);
    const adj = calculateAdhan("2026-10-16", { ...TAMPA, adjustments: { maghrib: 3 } });
    expect(adj.maghrib.getTime() - base.maghrib.getTime()).toBe(3 * 60_000);
  });

  it("rejects unknown methods", () => {
    expect(() => calculateAdhan("2026-10-16", { ...TAMPA, method: "Invented" })).toThrow();
  });
});

describe("iqamah resolution — never derived silently", () => {
  const adhan = new Date("2026-10-16T17:16:00Z");
  it("returns 'awaiting' when no rule exists, even though adhan is known", () => {
    expect(resolveIqamah("2026-10-16", "dhuhr", adhan, [], [])).toEqual({ status: "awaiting" });
  });

  it("buildDay with no publication marks every prayer as awaiting", () => {
    const rows = buildDay("2026-10-16", TAMPA, null);
    expect(rows.filter((r) => r.key !== "sunrise").every((r) => r.iqamah?.status === "awaiting")).toBe(true);
    expect(rows.find((r) => r.key === "sunrise")?.iqamah).toBeNull();
  });

  it("uses an offset only when the admin explicitly chose an offset rule", () => {
    const r = resolveIqamah("2026-10-16", "dhuhr", adhan, [{ prayer: "dhuhr", weekday: null, mode: "offset", time_of_day: null, offset_minutes: 10 }], []);
    expect(r).toMatchObject({ status: "set", rule: "offset", offsetMinutes: 10 });
    if (r.status === "set") expect(r.at.getTime() - adhan.getTime()).toBe(600_000);
  });

  it("prefers date override > weekday rule > daily rule", () => {
    const rules = [fixed("dhuhr", "13:45"), fixed("dhuhr", "14:00", 5)];
    const friday = resolveIqamah("2026-10-16", "dhuhr", adhan, rules, []);
    expect(friday.status === "set" && et(friday.at)).toBe("14:00");
    const thursday = resolveIqamah("2026-10-15", "dhuhr", adhan, rules, []);
    expect(thursday.status === "set" && et(thursday.at)).toBe("13:45");
    const ov = resolveIqamah("2026-10-16", "dhuhr", adhan, rules, [{ on_date: "2026-10-16", prayer: "dhuhr", iqamah_time: "13:20", kind: "holiday", note: "Holiday" }]);
    expect(ov).toMatchObject({ status: "set", source: "override", note: "Holiday" });
  });

  it("does not leak an override onto other dates or prayers (blocked overrides)", () => {
    const overrides = [{ on_date: "2026-10-17", prayer: "isha" as const, iqamah_time: "21:00", kind: "eid", note: "" }];
    expect(resolveIqamah("2026-10-16", "isha", adhan, [], overrides)).toEqual({ status: "awaiting" });
    expect(resolveIqamah("2026-10-17", "maghrib", adhan, [], overrides)).toEqual({ status: "awaiting" });
  });

  it("flags an iqamah that precedes its calculated adhan", () => {
    const rows = buildDay("2026-10-16", TAMPA, [fixed("dhuhr", "12:00"), fixed("fajr", "06:40"), fixed("asr", "17:00"), fixed("maghrib", "19:05"), fixed("isha", "20:30")]);
    expect(rows.find((r) => r.key === "dhuhr")?.warning).toMatch(/earlier than the calculated adhan/);
    expect(rows.find((r) => r.key === "asr")?.warning).toBeUndefined();
  });
});

describe("next prayer", () => {
  it("finds the next prayer today", () => {
    const n = nextPrayer(new Date("2026-10-16T16:00:00Z"), TAMPA, null); // 12:00 EDT
    expect(n.key).toBe("dhuhr");
    expect(n.dateKey).toBe("2026-10-16");
  });
  it("rolls to tomorrow's Fajr after Isha", () => {
    const n = nextPrayer(new Date("2026-10-17T03:30:00Z"), TAMPA, null); // 23:30 EDT
    expect(n.key).toBe("fajr");
    expect(n.dateKey).toBe("2026-10-17");
  });
  it("handles the window just after local midnight", () => {
    const n = nextPrayer(new Date("2026-10-17T04:05:00Z"), TAMPA, null); // 00:05 EDT
    expect(n.key).toBe("fajr");
    expect(n.dateKey).toBe("2026-10-17");
  });
});

describe("effective publication", () => {
  const pubs = [
    { id: "a", status: "published" as const, effective_from: "2026-09-01", published_at: "2026-09-01T00:00:00Z", version: 1 },
    { id: "b", status: "published" as const, effective_from: "2026-10-01", published_at: "2026-10-01T00:00:00Z", version: 2 },
    { id: "c", status: "published" as const, effective_from: "2026-11-01", published_at: "2026-10-10T00:00:00Z", version: 3 },
    { id: "d", status: "draft" as const, effective_from: "2026-10-01", published_at: null, version: 4 },
  ];
  it("ignores drafts and future-dated schedules", () => {
    expect(pickEffectivePublication(pubs, "2026-10-16")?.id).toBe("b");
  });
  it("switches to a future schedule on its effective date", () => {
    expect(pickEffectivePublication(pubs, "2026-11-01")?.id).toBe("c");
  });
  it("prefers the newest version for the same effective date", () => {
    const more = [...pubs, { id: "e", status: "published" as const, effective_from: "2026-10-01", published_at: "2026-10-12T00:00:00Z", version: 5 }];
    expect(pickEffectivePublication(more, "2026-10-16")?.id).toBe("e");
  });
  it("returns null when nothing is published", () => {
    expect(pickEffectivePublication([pubs[3]], "2026-10-16")).toBeNull();
  });
});
