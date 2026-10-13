import { redirect } from "next/navigation";

/**
 * Keep the historical simulator route from presenting a second source of truth.
 * The analyst console is now the API-backed overview and its linked workflows.
 */
export default function LegacyConsoleRedirect() {
  redirect("/overview");
}
