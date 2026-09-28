export const ENVIRONMENT_CODES = ["library", "cabin", "space_station"] as const;

export type EnvironmentCode = (typeof ENVIRONMENT_CODES)[number];

export const ENVIRONMENT_TREATMENT: Record<
  EnvironmentCode,
  { page: string; accent: string; ink: string }
> = {
  library: {
    page: "bg-[#09090b]",
    accent: "bg-zinc-100",
    ink: "text-zinc-500",
  },
  cabin: {
    page: "bg-[#1c1410] bg-[radial-gradient(circle_at_bottom,_#3a2618,_#1c1410_55%)]",
    accent: "bg-amber-100",
    ink: "text-amber-200/80",
  },
  space_station: {
    page: "bg-[#070b14] bg-[radial-gradient(circle_at_top,_#142033,_#070b14_55%)]",
    accent: "bg-sky-100",
    ink: "text-sky-200/80",
  },
};

export function activeEnvironment(
  environments: { code: string; name: string; unlocked: boolean }[],
): { code: EnvironmentCode; name: string } {
  const unlocked = environments.filter((item) => item.unlocked);
  const current = unlocked[unlocked.length - 1];

  if (current && isEnvironmentCode(current.code)) {
    return { code: current.code, name: current.name };
  }

  return { code: "library", name: "Library" };
}

function isEnvironmentCode(code: string): code is EnvironmentCode {
  return ENVIRONMENT_CODES.some((item) => item === code);
}
