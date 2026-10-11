import { ConnectorsView } from '@/features/connectors/ConnectorsView';

export const metadata = {
  title: 'Data Connectors | ASTRA Digital Risk Protection',
  description: 'Manage authorized threat intelligence connectors, webhook signatures, and data pipeline health.',
};

export default function ConnectorsPage() {
  return <ConnectorsView />;
}
