import { Construction } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-10 text-center">
      <Construction className="h-8 w-8 text-zinc-400" aria-hidden="true" />
      <h1 className="text-base font-semibold text-zinc-900">{title}</h1>
      <p className="text-xs text-zinc-500">
        This module lands in a later Phase-2 iteration.
      </p>
    </Card>
  );
}
