import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { Button } from "./components/ui/button";
import "./globals.css";

// Departure Mono by Helena Zhang, SIL OFL (./fonts/LICENSE). Self-hosted, and
// the only face: sans and mono both. It has one weight.
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

export const metadata: Metadata = {
  title: "rotom.gg",
  description: "Track your Pokémon TCG Live games.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${departureMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ClerkProvider>
          <header className="flex items-center justify-between gap-4 px-4 py-4">
            <Link
              href="/"
              className="bg-highlight px-1 text-title text-highlight-foreground"
            >
              ROTOM_GG
            </Link>
            <Show when="signed-out">
              <SignInButton fallbackRedirectUrl="/decks">
                <Button>Sign in</Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <nav className="flex items-center gap-4 tracking-wider uppercase">
                <Link
                  href="/decks"
                  className="px-1 transition-colors duration-75 ease-flick hover:bg-mark hover:text-mark-foreground"
                >
                  &gt; Decks
                </Link>
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
