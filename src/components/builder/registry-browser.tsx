'use client';

import * as LucideIcons from 'lucide-react';
import { useState } from 'react';
import {
  GLOBAL_COMPONENTS,
  DYNAMIC_ELEMENTS,
} from '@/lib/data/registry';
import type { GlobalComponentStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const STATUS_META: Record<GlobalComponentStatus, { label: string; color: string; icon: string }> = {
  ready: { label: 'Ready', color: 'bg-green-500/15 text-green-700 border-green-300', icon: 'CheckCircle2' },
  partial: { label: 'Partial', color: 'bg-amber-500/15 text-amber-700 border-amber-300', icon: 'CircleDashed' },
  missing: { label: 'Missing', color: 'bg-red-500/15 text-red-700 border-red-300', icon: 'CircleSlash' },
};

export function RegistryBrowser({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-lg border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <LucideIcons.Library className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Component Registry Browser</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
            <LucideIcons.X className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="global" className="flex-1 overflow-hidden">
          <div className="border-b px-4 py-2">
            <TabsList>
              <TabsTrigger value="global" className="text-xs">
                Global Components (G-01..G-20)
              </TabsTrigger>
              <TabsTrigger value="dynamic" className="text-xs">
                Dynamic Elements (D-01..D-13)
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="global" className="m-0 flex-1 overflow-hidden">
            <div className="grid h-full grid-cols-12 overflow-hidden">
              <ScrollArea className="col-span-4 border-r">
                <div className="p-2">
                  {GLOBAL_COMPONENTS.map((g) => {
                    const meta = STATUS_META[g.status];
                    const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[meta.icon];
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelected(g.id)}
                        className={cn(
                          'mb-1 flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors',
                          selected === g.id ? 'bg-accent' : 'hover:bg-accent/60'
                        )}
                      >
                        <span className="mt-0.5 flex h-5 w-9 flex-shrink-0 items-center justify-center rounded bg-primary/10 font-mono text-[9px] font-bold text-primary">
                          {g.id}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11px] font-medium">{g.name}</div>
                          <div className="truncate text-[9px] text-muted-foreground">{g.group}</div>
                        </div>
                        <Badge variant="outline" className={cn('flex-shrink-0 text-[8px]', meta.color)}>
                          <Icon className="h-2 w-2 mr-0.5" />
                          {meta.label}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
              <ScrollArea className="col-span-8">
                <GlobalComponentDetail id={selected ?? 'G-01'} />
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="dynamic" className="m-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2">
                {DYNAMIC_ELEMENTS.map((d) => (
                  <div key={d.id} className="rounded-md border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-12 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
                        {d.id}
                      </span>
                      <h3 className="text-sm font-semibold">{d.name}</h3>
                    </div>
                    <dl className="mt-2 space-y-1.5 text-[11px]">
                      <div>
                        <dt className="font-semibold text-muted-foreground">End user mengatur:</dt>
                        <dd className="mt-0.5">{d.userControls}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-muted-foreground">Bertumpu pada:</dt>
                        <dd className="mt-0.5 font-mono">{d.dependsOn}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-muted-foreground">Contoh interview:</dt>
                        <dd className="mt-0.5 italic text-muted-foreground">{d.example}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="border-t px-4 py-2 text-[10px] text-muted-foreground">
          Source: <code>DYNAMIC_WORKFLOW_COMPONENT_REGISTRY.md</code> — 20 global components + 13 dynamic elements.
        </div>
      </div>
    </div>
  );
}

function GlobalComponentDetail({ id }: { id: string }) {
  const g = GLOBAL_COMPONENTS.find((x) => x.id === id);
  if (!g) return null;
  const meta = STATUS_META[g.status];
  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[meta.icon];

  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-14 items-center justify-center rounded-md bg-primary/10 font-mono text-sm font-bold text-primary">
            {g.id}
          </span>
          <div>
            <h2 className="text-lg font-bold">{g.name}</h2>
            <p className="text-xs text-muted-foreground">Group: {g.group}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn('text-xs', meta.color)}>
          <Icon className="h-3 w-3 mr-1" />
          {meta.label}
        </Badge>
      </div>

      <div className="mt-4 space-y-4">
        <section>
          <h3 className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <LucideIcons.Lock className="h-3 w-3" /> Yang FIXED (engine)
          </h3>
          <p className="rounded-md border bg-muted/30 p-2 text-xs leading-relaxed">{g.fixedBehavior}</p>
        </section>

        <section>
          <h3 className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <LucideIcons.SlidersHorizontal className="h-3 w-3" /> Yang DIPARAMETERISASI per node
          </h3>
          <p className="rounded-md border bg-muted/30 p-2 text-xs leading-relaxed">{g.parameterized}</p>
        </section>

        <section>
          <h3 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <LucideIcons.MessageSquareQuote className="h-3 w-3" /> Contoh dari interview
          </h3>
          <ul className="space-y-1">
            {g.examples.map((e, i) => (
              <li key={i} className="flex items-start gap-1.5 rounded border bg-card p-1.5 text-xs">
                <LucideIcons.Quote className="h-3 w-3 flex-shrink-0 text-muted-foreground mt-0.5" />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
