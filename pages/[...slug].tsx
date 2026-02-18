// Catch-all page so Next.js serves the app for any URL path.
// The actual routing (home, search, artist-detail, etc.) is handled by
// NavigationContext + AppRouter inside _app.tsx.
// This component is never rendered because _app.tsx ignores `Component`.
export default function CatchAll() {
  return null;
}
