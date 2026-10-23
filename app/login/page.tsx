import { getSettings } from "@/lib/site";
import { LoginForm } from "@/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In" };

// The access note is editable in Site Settings, so never prerender.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const site = await getSettings();
  return <LoginForm accessNote={site.accessNote} />;
}
