import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "rotom.gg",
  description: "Track your Pokémon TCG Live games.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <header className="flex items-center justify-between p-4">
            <Link href="/" className="font-semibold">
              rotom.gg
            </Link>
            <Show when="signed-out">
              <SignInButton />
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
