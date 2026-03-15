import { describe, it, expect } from "vitest";
import {
  formatBytes,
  formatBytesPerSec,
  formatPercent,
  formatDuration,
  formatNumber,
  clamp,
  percentColor,
  interpolateColor,
} from "@/lib/format-utils";

describe("formatBytes", () => {
  it("returns '0 B' for zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1024 ** 3)).toBe("1 GB");
  });

  it("respects decimals parameter", () => {
    // parseFloat strips trailing zeros: 1.50 → 1.5
    expect(formatBytes(1536, 2)).toBe("1.5 KB");
  });

  it("handles negative bytes (uses abs for tier selection)", () => {
    // Negative bytes are unusual but the function uses Math.abs for tier
    expect(formatBytes(-1024)).toBe("-1 KB");
  });
});

describe("formatBytesPerSec", () => {
  it("appends /s suffix", () => {
    expect(formatBytesPerSec(1024)).toBe("1 KB/s");
  });

  it("handles zero", () => {
    expect(formatBytesPerSec(0)).toBe("0 B/s");
  });
});

describe("formatPercent", () => {
  it("formats with default 1 decimal", () => {
    expect(formatPercent(75)).toBe("75.0%");
  });

  it("formats with custom decimals", () => {
    expect(formatPercent(50.123, 2)).toBe("50.12%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("formats 100", () => {
    expect(formatPercent(100)).toBe("100.0%");
  });
});

describe("formatDuration", () => {
  it("formats seconds under a minute", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  it("formats exactly 60 seconds as minutes", () => {
    expect(formatDuration(60)).toBe("1m 0s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(90)).toBe("1m 30s");
  });

  it("formats hours", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3661)).toBe("1h 1m");
  });

  it("formats zero seconds", () => {
    expect(formatDuration(0)).toBe("0s");
  });
});

describe("formatNumber", () => {
  it("formats values below 1000 as integers", () => {
    expect(formatNumber(999)).toBe("999");
  });

  it("formats thousands with K suffix", () => {
    expect(formatNumber(1500)).toBe("1.5K");
  });

  it("formats millions with M suffix", () => {
    expect(formatNumber(2_500_000)).toBe("2.50M");
  });

  it("formats billions with G suffix", () => {
    expect(formatNumber(1_000_000_000)).toBe("1.00G");
  });

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it("clamps to min", () => {
    expect(clamp(-10, 0, 100)).toBe(0);
  });

  it("clamps to max", () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 100)).toBe(0);
  });

  it("returns max when value equals max", () => {
    expect(clamp(100, 0, 100)).toBe(100);
  });
});

describe("percentColor", () => {
  it("returns green for low usage", () => {
    expect(percentColor(30)).toBe("#22c55e");
  });

  it("returns green just below 60", () => {
    expect(percentColor(59)).toBe("#22c55e");
  });

  it("returns amber for moderate usage (60-79)", () => {
    expect(percentColor(60)).toBe("#f59e0b");
    expect(percentColor(79)).toBe("#f59e0b");
  });

  it("returns red for high usage (80+)", () => {
    expect(percentColor(80)).toBe("#ef4444");
    expect(percentColor(100)).toBe("#ef4444");
  });
});

describe("interpolateColor", () => {
  it("returns green for < 60%", () => {
    expect(interpolateColor(0)).toBe("#22c55e");
    expect(interpolateColor(59)).toBe("#22c55e");
  });

  it("returns yellow for 60-79%", () => {
    expect(interpolateColor(60)).toBe("#eab308");
    expect(interpolateColor(79)).toBe("#eab308");
  });

  it("returns orange for 80-94%", () => {
    expect(interpolateColor(80)).toBe("#f97316");
    expect(interpolateColor(94)).toBe("#f97316");
  });

  it("returns red for 95%+", () => {
    expect(interpolateColor(95)).toBe("#ef4444");
    expect(interpolateColor(100)).toBe("#ef4444");
  });
});
