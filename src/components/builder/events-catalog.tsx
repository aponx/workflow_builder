'use client';

import * as LucideIcons from 'lucide-react';
import { EVENT_CATALOG } from '@/lib/data/registry';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function EventsCatalog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-lg border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <LucideIcons.Radio className="h-4 w-4" />
            <h2 className="text-sm font-semibold">Event Catalog</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
            <LucideIcons.X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <p className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-100">
              Event adalah <strong>bahasa bersama</strong> antara node components, action triggers, dan SLA/schedule triggers.
              Gunakan event-event ini sebagai <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">condition.label</code> pada edge,
              atau sebagai trigger pada D-12 Action Binding.
            </p>

            <div className="space-y-3">
              {EVENT_CATALOG.map((cat) => (
                <div key={cat.domain}>
                  <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {cat.domain}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.events.map((ev) => (
                      <Badge
                        key={ev}
                        variant="outline"
                        className="cursor-pointer font-mono text-[10px] hover:border-primary hover:text-primary"
                        title={`Click to copy: ${ev}`}
                        onClick={() => {
                          if (navigator?.clipboard) navigator.clipboard.writeText(ev);
                        }}
                      >
                        {ev}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="border-t px-4 py-2 text-[10px] text-muted-foreground">
          Source: <code>DYNAMIC_WORKFLOW_BLUEPRINT.md §16</code> — 8 domain event.
        </div>
      </div>
    </div>
  );
}
