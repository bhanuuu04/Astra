import { AlertsView } from '@/features/alerts/AlertsView';

export const metadata = {
  title: 'Alert Feed | ASTRA Digital Risk Protection',
  description: 'Real-time alert feed for brand threats, new sightings, and campaign escalations.',
};

export default function AlertsPage() {
  return <AlertsView />;
}
