import { describe, expect, it } from "vitest";
import { formatRemaining, remainingFromClock } from "./use-focus-timer";

const planned = 25 * 60;
const end = "2026-09-28T18:25:00.000Z";

describe("remainingFromClock", () => {
  it("reads the time left from the end timestamp", () => {
    const tenMinutesLeft = new Date("2026-09-28T18:15:00.000Z").getTime();
    const oneSecondLater = tenMinutesLeft + 1000;

    expect(remainingFromClock(end, planned, tenMinutesLeft)).toEqual({
      remainingSeconds: 600,
      progress: 0.6,
    });
    expect(remainingFromClock(end, planned, oneSecondLater).remainingSeconds).toBe(599);
  });

  it("stays on the paused timestamp instead of the live clock", () => {
    const pausedAt = new Date("2026-09-28T18:15:00.000Z").getTime();
    const later = pausedAt + 5 * 60 * 1000;

    expect(remainingFromClock(end, planned, pausedAt).remainingSeconds).toBe(600);
    expect(remainingFromClock(end, planned, later).remainingSeconds).toBe(300);
  });

  it("hits zero when the end timestamp has passed", () => {
    const after = new Date("2026-09-28T18:26:00.000Z").getTime();

    expect(remainingFromClock(end, planned, after)).toEqual({
      remainingSeconds: 0,
      progress: 1,
    });
  });

  it("returns an empty clock when there is no session", () => {
    expect(remainingFromClock(null, planned, Date.now())).toEqual({
      remainingSeconds: 0,
      progress: 0,
    });
  });
});

describe("formatRemaining", () => {
  it("formats minutes and hours", () => {
    expect(formatRemaining(0)).toBe("00:00");
    expect(formatRemaining(65)).toBe("01:05");
    expect(formatRemaining(3661)).toBe("1:01:01");
  });
});
