import { SettingsPage } from "@/components/SettingsPage";

export const metadata = {
  title: "Settings | ASTRA Digital Risk Protection",
  description: "Configure automated defense thresholds, SOC alert notifications, and organization policies.",
};

export default function SettingsRoute() {
  return <SettingsPage />;
}
