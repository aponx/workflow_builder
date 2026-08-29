'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { BUSINESS_UNITS, NODE_COMPONENT_KINDS } from '@/lib/data/registry';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function NodePalette() {
  const addNode = useWorkflowStore((s) => s.addNode);
  const activeTemplateId = useWorkflowStore((s) => s.activeTemplateId);
  const [selectedBu, setSelectedBu] = useState<string | null>(null);

  const handleAddNode = (buId: string) => {
    if (!activeTemplateId) return;
    const bu = BUSINESS_UNITS.find((b) => b.id === buId);
    if (!bu) return;
    // Place new node at staggered offset from origin to avoid overlap
    const offset = Math.floor(Math.random() * 100);
    addNode(bu.shortCode.toLowerCase() + '-' + Date.now().toString(36).slice(-4), bu.name, buId, {
      x: 80 + offset,
      y: 80 + offset,
    });
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Node Palette
        </h3>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Klik untuk menambahkan node dari 10 divisi
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {BUSINESS_UNITS.map((bu) => (
              <button
                key={bu.id}
                onClick={() => handleAddNode(bu.id)}
                className="group flex flex-col items-start rounded-md border border-border bg-background p-2 text-left transition-colors hover:border-foreground/30 hover:bg-muted/40"
                style={{ borderLeftWidth: 3, borderLeftColor: bu.color }}
              >
                <span className="flex items-center gap-1">
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold text-white"
                    style={{ background: bu.color }}
                  >
                    {bu.shortCode}
                  </span>
                  <span className="text-[11px] font-medium leading-tight">{bu.name}</span>
                </span>
                <span className="mt-1 text-[9px] leading-tight text-muted-foreground line-clamp-2">
                  {bu.description}
                </span>
              </button>
            ))}
          </div>

          <Accordion type="single" collapsible className="mt-3">
            <AccordionItem value="custom" className="border-0">
              <AccordionTrigger className="rounded px-2 py-1.5 text-[11px] hover:no-underline hover:bg-muted/40">
                + Custom Node
              </AccordionTrigger>
              <AccordionContent className="px-1 pt-2">
                <CustomNodeCreator />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      {/* Component kinds quick reference */}
      <div className="border-t px-3 py-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Component Kinds (13)
        </h4>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <TooltipProvider delayDuration={200}>
            {NODE_COMPONENT_KINDS.map((k) => {
              const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[k.icon] ?? LucideIcons.Box;
              return (
                <Tooltip key={k.kind}>
                  <TooltipTrigger asChild>
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded"
                      style={{ background: `${k.color}1a`, color: k.color }}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[240px] text-xs">
                    <div className="font-semibold">{k.label} ({k.kind})</div>
                    <div className="mt-0.5 text-muted-foreground">{k.description}</div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

function CustomNodeCreator() {
  const addNode = useWorkflowStore((s) => s.addNode);
  const activeTemplateId = useWorkflowStore((s) => s.activeTemplateId);
  const [name, setName] = useState('');
  const [buId, setBuId] = useState(BUSINESS_UNITS[0].id);

  const handleAdd = () => {
    if (!activeTemplateId || !name.trim()) return;
    const nodeKey = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    addNode(nodeKey || 'custom-node', name.trim(), buId, {
      x: 80 + Math.floor(Math.random() * 100),
      y: 80 + Math.floor(Math.random() * 100),
    });
    setName('');
  };

  return (
    <div className="space-y-1.5">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Node name (e.g. Quality Hold)"
        className="w-full rounded border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
        }}
      />
      <select
        value={buId}
        onChange={(e) => setBuId(e.target.value)}
        className="w-full rounded border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
      >
        {BUSINESS_UNITS.map((b) => (
          <option key={b.id} value={b.id}>
            {b.shortCode} — {b.name}
          </option>
        ))}
      </select>
      <Button onClick={handleAdd} size="sm" className="w-full h-7 text-[11px]">
        Add Custom Node
      </Button>
    </div>
  );
}
