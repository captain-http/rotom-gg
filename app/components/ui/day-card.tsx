import type { Day } from "@/lib/domain/games";
import { GamesCard } from "./games-card";

// A Day as a menu row, shown by its date, that opens to its games. Goes in a
// Menu, inside an <li>.
export function DayCard({
  day,
  thisYear,
  open,
}: {
  day: Day;
  // The Viewer's current year, as YYYY: dates in it leave the year out.
  thisYear: string;
  open?: boolean;
}) {
  return (
    <GamesCard
      label={
        <time
          dateTime={day.date}
          className="font-mono text-body tracking-wider whitespace-nowrap uppercase"
        >
          {formatDate(day.date, thisYear)}
        </time>
      }
      wins={day.wins}
      losses={day.losses}
      games={day.games}
      open={open}
    />
  );
}

// "Tue 29 Sep", or "Mon 29 Sep 2025" outside this year. The day is padded so
// a column of dates lines up.
function formatDate(date: string, thisYear: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      // The date is already the Viewer's; UTC only keeps it from shifting.
      timeZone: "UTC",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .formatToParts(new Date(`${date}T00:00:00Z`))
      .map((part) => [part.type, part.value]),
  );
  const short = `${parts.weekday} ${parts.day} ${parts.month}`;
  return parts.year === thisYear ? short : `${short} ${parts.year}`;
}
