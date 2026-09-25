"use client";

import { useEffect, useState } from "react";

export function useFocusTimer(
  expectedEndAt: string | null,
  plannedDurationSeconds: number,
  pausedAt: string | null,
) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expectedEndAt || pausedAt) return;

    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expectedEndAt, pausedAt]);

  if (!expectedEndAt || plannedDurationSeconds <= 0) {
    return { remainingSeconds: 0, progress: 0 };
  }

  const clock = pausedAt ? new Date(pausedAt).getTime() : now;
  const remainingMs = Math.max(0, new Date(expectedEndAt).getTime() - clock);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, Math.max(0, 1 - remainingSeconds / plannedDurationSeconds));

  return { remainingSeconds, progress };
}

export function formatRemaining(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return hours > 0 ? `${hours}:${clock}` : clock;
}
