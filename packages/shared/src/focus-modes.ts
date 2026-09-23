export const FOCUS_MODE_IDS = ['pomodoro', 'deep_work', 'flow', 'custom'] as const;

export type FocusModeId = (typeof FOCUS_MODE_IDS)[number];

export type FocusMode = {
  id: FocusModeId;
  label: string;
  focusMinutes: number | null;
  breakMinutes: number | null;
};

export const FOCUS_MODES: Record<FocusModeId, FocusMode> = {
  pomodoro: {
    id: 'pomodoro',
    label: 'Pomodoro',
    focusMinutes: 25,
    breakMinutes: 5,
  },
  deep_work: {
    id: 'deep_work',
    label: 'Deep Work',
    focusMinutes: 50,
    breakMinutes: 10,
  },
  flow: {
    id: 'flow',
    label: 'Flow',
    focusMinutes: 90,
    breakMinutes: 15,
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    focusMinutes: null,
    breakMinutes: null,
  },
};
