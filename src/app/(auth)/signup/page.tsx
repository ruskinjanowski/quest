import type { Metadata } from "next";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Create account · Quest" };

export default function SignupPage() {
  return <AuthForm mode="sign-up" />;
}
