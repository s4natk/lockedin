"use client";

import { useEffect, useState } from "react";

export function useFocusTimer(expectedEndAt: string | null, plannedDurationSeconds: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expectedEndAt) return;

    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expectedEndAt]);

  if (!expectedEndAt || plannedDurationSeconds <= 0) {
    return { remainingSeconds: 0, progress: 0 };
  }

  const remainingMs = Math.max(0, new Date(expectedEndAt).getTime() - now);
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
