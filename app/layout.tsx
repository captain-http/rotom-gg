import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { Button } from "./components/ui/button";
import { GlyphLink } from "./components/ui/glyph-link";
import "./globals.css";

// Departure Mono by Helena Zhang, SIL OFL (./fonts/LICENSE-DepartureMono).
// The party: labels, figures, records, logs, menus. One weight.
const departureMono = localFont({
  src: "./fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure-mono",
  weight: "400",
  display: "swap",
  // A failed load should keep the monospace rhythm.
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Menlo",
    "Consolas",
    "monospace",
  ],
});

// IBM Plex Sans by Mike Abbink and Bold Monday for IBM, SIL OFL
// (./fonts/LICENSE-IBMPlexSans). The wordmark only: its bars are cut to
// Plex Sans's metrics. Variable, 400–700.
const ibmPlexSans = localFont({
  src: "./fonts/IBMPlexSans-Variable.woff2",
  variable: "--font-ibm-plex-sans",
  weight: "400 700",
  display: "swap",
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "Segoe UI",
    "Helvetica",
    "sans-serif",
  ],
});

// IBM Plex Mono by Mike Abbink and Bold Monday for IBM, SIL OFL
// (./fonts/LICENSE-IBMPlexMono). The business: everything read at length.
// Two static weights, 400 and 600.
const ibmPlexMono = localFont({
  src: [
    { path: "./fonts/IBMPlexMono-Regular.woff2", weight: "400" },
    { path: "./fonts/IBMPlexMono-SemiBold.woff2", weight: "600" },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  fallback: ["ui-monospace", "Menlo", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "rotom.gg",
  description: "Field reports for your Pokémon TCG Live games.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${departureMono.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ClerkProvider>
          <header className="flex items-center justify-between gap-4 px-4 py-4">
            <Link
              href="/"
              data-wordmark
              data-text="ROTOM.GG"
              className="wordmark spectrum corrupt text-heading"
            >
              ROTOM.GG
            </Link>
            <Show when="signed-out">
              <SignInButton fallbackRedirectUrl="/decks">
                <Button>Sign in</Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <nav className="flex items-center gap-4">
                <GlyphLink href="/decks">&gt; Decks</GlyphLink>
                <UserButton />
              </nav>
            </Show>
          </header>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
