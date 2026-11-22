const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Kolkata",
});

/** Stable server-side formatting (no locale/timezone drift between renders). */
export function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  return `${dateFormatter.format(date)} · ${timeFormatter.format(date)}`;
}

export function formatAverage(value: number): string {
  return value.toFixed(1);
}
