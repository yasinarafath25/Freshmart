import { describe, expect, it } from "vitest";
import { DICTS, fmtMoney, fmtNum, slotLabel, toBnDigits, unitLabel } from "@/lib/i18n/dict";
import { tMsg, tState } from "@/lib/i18n/messages";

function keysOf(o: object, prefix = ""): string[] {
  return Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" && !Array.isArray(v) ? keysOf(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe("dictionaries", () => {
  it("Bangla covers every English key", () => {
    expect(keysOf(DICTS.bn).sort()).toEqual(keysOf(DICTS.en).sort());
  });
  it("has no empty strings", () => {
    for (const lang of ["en", "bn"] as const) {
      const empty = keysOf(DICTS[lang]).filter((k) => k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], DICTS[lang]) === "");
      expect(empty).toEqual([]);
    }
  });
});

describe("formatting", () => {
  it("converts digits", () => expect(toBnDigits("৳1,250.50")).toBe("৳১,২৫০.৫০"));
  it("formats money per language", () => {
    expect(fmtMoney(12000, "৳", "en")).toBe("৳120");
    expect(fmtMoney(12000, "৳", "bn")).toBe("৳১২০");
    expect(fmtMoney(12345600, "₹", "bn")).toBe("₹১,২৩,৪৫৬");
  });
  it("formats numbers", () => expect(fmtNum(1234, "bn")).toBe("১,২৩৪"));
  it("translates unit labels", () => {
    expect(unitLabel("1 kg", "bn")).toBe("১ কেজি");
    expect(unitLabel("500 g", "bn")).toBe("৫০০ গ্রাম");
    expect(unitLabel("Half dozen", "bn")).toBe("হাফ ডজন");
    expect(unitLabel("4 pieces", "bn")).toBe("৪ পিস");
    expect(unitLabel("1 bunch", "bn")).toBe("১ আঁটি");
    expect(unitLabel("1 piece (~400 g)", "bn")).toBe("১ পিস (প্রায় ৪০০ গ্রাম)");
    expect(unitLabel("1 kg", "en")).toBe("1 kg");
  });
  it("translates delivery slots", () => {
    expect(slotLabel("8:00 AM – 11:00 AM", "bn")).toBe("সকাল ৮:০০ – সকাল ১১:০০");
    expect(slotLabel("5:00 PM – 8:00 PM", "bn")).toBe("বিকেল ৫:০০ – রাত ৮:০০");
    expect(slotLabel("8:00 AM – 11:00 AM", "en")).toBe("8:00 AM – 11:00 AM");
  });
});

describe("server message translation", () => {
  it("translates exact and templated messages", () => {
    expect(tMsg("Incorrect email or password.", "bn")).toBe("ইমেইল বা পাসওয়ার্ড সঠিক নয়।");
    expect(tMsg("Minimum order of ৳500 required for this coupon.", "bn")).toBe("এই কুপনের জন্য সর্বনিম্ন ৳৫০০-এর অর্ডার লাগবে।");
    expect(tMsg("Order FM-261127-ABCDE placed", "bn")).toBe("অর্ডার FM-261127-ABCDE সম্পন্ন হয়েছে");
    expect(tMsg("Order FM-1: Out for delivery", "bn")).toBe("অর্ডার FM-1: ডেলিভারিতে বের হয়েছে");
  });
  it("leaves English and unknown text alone", () => {
    expect(tMsg("Incorrect email or password.", "en")).toBe("Incorrect email or password.");
    expect(tMsg("Something new", "bn")).toBe("Something new");
  });
  it("translates action state", () => {
    expect(tState({ message: "Profile updated.", errors: { name: "Please enter your name." } }, "bn")).toEqual({ message: "প্রোফাইল আপডেট হয়েছে।", errors: { name: "আপনার নাম দিন।" } });
  });
});
