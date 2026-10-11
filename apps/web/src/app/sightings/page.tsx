import { Suspense } from 'react';
import { SightingsQueueView } from "@/features/sightings/SightingsQueueView";

export const metadata = {
  title: "Sightings Queue | ASTRA Digital Risk Protection",
};

export default function SightingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading sightings queue...</div>}>
      <SightingsQueueView />
    </Suspense>
  );
}
