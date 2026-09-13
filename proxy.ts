import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk only reads the session here. Pages decide what requires sign-in.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next internals and static files, unless found in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes and Clerk's own endpoints.
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
