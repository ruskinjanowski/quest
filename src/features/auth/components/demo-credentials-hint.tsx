/**
 * The seeded demo account, printed on the sign-in screen so the credentials can
 * be typed on camera during the Loom (PRODUCT_PLAN 1.9). Renders nothing unless
 * a demo account is configured, so it disappears from a real deployment by
 * simply not setting the variables.
 */
export function DemoCredentialsHint() {
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;

  if (!email || !password) return null;

  return (
    <div className="bg-muted/50 text-muted-foreground rounded-lg border p-3 text-center text-xs">
      <p className="font-medium">Demo account</p>
      <p className="mt-1 font-mono">
        {email} · {password}
      </p>
    </div>
  );
}
