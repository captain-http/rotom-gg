import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
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
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <header className="flex items-center justify-between p-4">
            <Link href="/" className="font-semibold">
              rotom.gg
            </Link>
            <Show when="signed-out">
              <SignInButton fallbackRedirectUrl="/decks">
                <button
                  type="button"
                  className="rounded bg-foreground px-3 py-2 text-background"
                >
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <nav className="flex items-center gap-4">
                <Link href="/decks">Decks</Link>
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
