import { getEmployerTheme } from "@/lib/employers";

type Props = {
  employer: string;
  size?: "sm" | "md" | "lg";
};

export function EmployerBadge({ employer, size = "md" }: Props) {
  const theme = getEmployerTheme(employer);
  const sizeClass =
    size === "lg"
      ? "px-3.5 py-1.5 text-base"
      : size === "sm"
        ? "px-2 py-0.5 text-xs"
        : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-lg font-semibold tracking-wide uppercase ${sizeClass}`}
      style={{
        backgroundColor: theme.accent,
        color: theme.onAccent,
      }}
    >
      {employer}
    </span>
  );
}
