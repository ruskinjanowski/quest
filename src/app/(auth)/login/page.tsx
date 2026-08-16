import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/auth-form";
import { DemoCredentialsHint } from "@/features/auth/components/demo-credentials-hint";

export const metadata: Metadata = { title: "Sign in · Quest" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <AuthForm mode="sign-in" />
      <DemoCredentialsHint />
    </div>
  );
}
