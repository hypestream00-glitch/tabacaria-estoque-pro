import { type LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="fade-in border-slate-800/80 bg-slate-900/75">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-xl font-semibold">{value}</h3>
            {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="rounded-md bg-sky-500/15 p-2 text-sky-300">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
