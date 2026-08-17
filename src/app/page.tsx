import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

/** There is no marketing page in the prototype: you are either working or logging in. */
export default async function RootPage() {
  const user = await getCurrentUser();
  redirect(user ? "/home" : "/login");
}
