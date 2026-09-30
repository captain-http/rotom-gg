"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TIME_ZONE_COOKIE } from "./time-zone-cookie";

// Tells the server the Viewer's timezone. The server can't know it, and
// without it a game filed at 11pm lands on the next day. When the cookie was
// missing or out of date (a first visit, a trip), it's written and the page
// rendered again, once. Renders nothing.
export function TimeZoneSync() {
  const router = useRouter();
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${TIME_ZONE_COOKIE}=`))
      ?.slice(TIME_ZONE_COOKIE.length + 1);
    if (current === encodeURIComponent(timeZone)) return;

    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);
  return null;
}
