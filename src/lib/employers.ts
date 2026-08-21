export const EMPLOYERS = [
  "Post Office",
  "Wagamama",
  "CPM Tech",
  "Alpha",
  "Off",
  "Annual Leave",
  "Personal / Family",
  "Other",
] as const;

export type Employer = (typeof EMPLOYERS)[number];

export const WORK_MODES = [
  "WFH",
  "On site",
  "Office",
  "Travelling",
  "Off",
] as const;

export type WorkMode = (typeof WORK_MODES)[number];

export const SOURCES = [
  "manual",
  "chatgpt",
  "outlook",
  "import",
  "system",
] as const;

export type Source = (typeof SOURCES)[number];

export type EmployerTheme = {
  label: Employer;
  /** Soft background tint for cards/blocks */
  bg: string;
  /** Strong accent for badges and borders */
  accent: string;
  /** Text colour on accent backgrounds */
  onAccent: string;
  /** Muted text on tinted backgrounds */
  text: string;
};

/**
 * Central employer/theme mapping — do not scatter hard-coded colours elsewhere.
 */
export const EMPLOYER_THEMES: Record<Employer, EmployerTheme> = {
  "Post Office": {
    label: "Post Office",
    bg: "#fde8e8",
    accent: "#c41e3a",
    onAccent: "#ffffff",
    text: "#7a1224",
  },
  Wagamama: {
    label: "Wagamama",
    bg: "#ececec",
    accent: "#1a1a1a",
    onAccent: "#ffffff",
    text: "#1a1a1a",
  },
  "CPM Tech": {
    label: "CPM Tech",
    bg: "#e4eef8",
    accent: "#1f5f9a",
    onAccent: "#ffffff",
    text: "#143d63",
  },
  Alpha: {
    label: "Alpha",
    bg: "#efe8df",
    accent: "#8a5a2b",
    onAccent: "#ffffff",
    text: "#5a3a1c",
  },
  Off: {
    label: "Off",
    bg: "#e8f0ea",
    accent: "#4a6b55",
    onAccent: "#ffffff",
    text: "#2f4638",
  },
  "Annual Leave": {
    label: "Annual Leave",
    bg: "#f8f0dc",
    accent: "#b07d1a",
    onAccent: "#ffffff",
    text: "#6b4a0e",
  },
  "Personal / Family": {
    label: "Personal / Family",
    bg: "#f3e8e4",
    accent: "#8b5a4a",
    onAccent: "#ffffff",
    text: "#5c3a30",
  },
  Other: {
    label: "Other",
    bg: "#e9ecef",
    accent: "#5a6570",
    onAccent: "#ffffff",
    text: "#3a424a",
  },
};

export function getEmployerTheme(employer: string): EmployerTheme {
  if (employer in EMPLOYER_THEMES) {
    return EMPLOYER_THEMES[employer as Employer];
  }
  return EMPLOYER_THEMES.Other;
}

export function isOffDayEmployer(employer: string): boolean {
  return employer === "Off" || employer === "Annual Leave";
}
