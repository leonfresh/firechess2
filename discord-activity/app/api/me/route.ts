// Activity v1 uses the game's existing guest identity. Website session cookies
// are not available on Discord's proxy origin, and Discord identity is not yet linked.
export function GET() {
  return Response.json({ authenticated: false, plan: 'free', user: null, isAdmin: false });
}
