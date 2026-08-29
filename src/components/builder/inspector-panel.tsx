'use client';

import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import {
  BUSINESS_UNITS,
  NODE_COMPONENT_KINDS,
  ACTION_KINDS,
} from '@/lib/data/registry';
import type {
  NodeComponentKind,
  ActionKind,
  TriggerType,
  EdgeType,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function InspectorPanel() {
  const selection = useWorkflowStore((s) => s.selection);
  const template = useWorkflowStore((s) => s.templates.find((t) => t.id === s.activeTemplateId));

  if (!template) {
    return <EmptyInspector message="Tidak ada template aktif" />;
  }

  if (selection.type === 'none') {
    return (
      <EmptyInspector message="Pilih node atau edge di canvas untuk mengkonfigurasi. Klik node untuk melihat komponen, atau klik edge untuk melihat aksi." />
    );
  }

  if (selection.type === 'node') {
    const node = template.nodes.find((n) => n.id === selection.id);
    if (!node) return <EmptyInspector message="Node tidak ditemukan" />;
    return <NodeInspector key={node.id} nodeId={node.id} />;
  }

  // edge
  const edge = template.edges.find((e) => e.id === selection.id);
  if (!edge) return <EmptyInspector message="Edge tidak ditemukan" />;
  return <EdgeInspector key={edge.id} edgeId={edge.id} />;
}

function EmptyInspector({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-card p-6 text-center">
      <LucideIcons.MousePointer2 className="h-8 w-8 text-muted-foreground/40" />
      <p className="mt-3 text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ============================================================
// Node Inspector
// ============================================================

function NodeInspector({ nodeId }: { nodeId: string }) {
  const template = useWorkflowStore((s) => s.templates.find((t) => t.id === s.activeTemplateId)!);
  const node = template.nodes.find((n) => n.id === nodeId)!;
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const addComponent = useWorkflowStore((s) => s.addComponent);
  const removeComponent = useWorkflowStore((s) => s.removeComponent);
  const updateComponent = useWorkflowStore((s) => s.updateComponent);
  const reorderComponent = useWorkflowStore((s) => s.reorderComponent);
  const setSelection = useWorkflowStore((s) => s.setSelection);

  const bu = BUSINESS_UNITS.find((b) => b.id === node.businessUnitId);

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ background: bu?.color ?? '#64748b' }}
          >
            {bu?.shortCode ?? '?'}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{node.name}</h3>
            <p className="truncate text-[10px] text-muted-foreground">{node.nodeKey}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {/* Identity */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Identity
            </h4>
            <div className="space-y-1.5">
              <Label htmlFor="node-name" className="text-[11px]">Name</Label>
              <Input
                id="node-name"
                value={node.name}
                onChange={(e) => updateNode(nodeId, { name: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="node-key" className="text-[11px]">nodeKey</Label>
              <Input
                id="node-key"
                value={node.nodeKey}
                onChange={(e) => updateNode(nodeId, { nodeKey: e.target.value })}
                className="h-8 font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="node-bu" className="text-[11px]">Business Unit</Label>
              <Select
                value={node.businessUnitId}
                onValueChange={(v) => updateNode(nodeId, { businessUnitId: v })}
              >
                <SelectTrigger id="node-bu" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_UNITS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.shortCode} — {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Switch
                  id="is-start"
                  checked={!!node.isStart}
                  onCheckedChange={(v) => updateNode(nodeId, { isStart: v })}
                />
                <Label htmlFor="is-start" className="text-[11px]">Start node</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch
                  id="is-end"
                  checked={!!node.isEnd}
                  onCheckedChange={(v) => updateNode(nodeId, { isEnd: v })}
                />
                <Label htmlFor="is-end" className="text-[11px]">End node</Label>
              </div>
            </div>
          </div>

          {/* Components */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Components ({node.components.length})
              </h4>
              <AddComponentMenu onAdd={(k) => addComponent(nodeId, k)} />
            </div>
            {node.components.length === 0 ? (
              <p className="rounded border border-dashed p-3 text-center text-[10px] text-muted-foreground">
                Tidak ada komponen. Tambahkan dari tombol + di kanan.
              </p>
            ) : (
              <Accordion type="multiple" className="space-y-1.5">
                {node.components.map((comp, idx) => {
                  const meta = NODE_COMPONENT_KINDS.find((k) => k.kind === comp.kind)!;
                  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[meta.icon] ?? LucideIcons.Box;
                  return (
                    <AccordionItem
                      key={comp.id}
                      value={comp.id}
                      className="rounded-md border bg-background px-2"
                    >
                      <AccordionTrigger className="hover:no-underline py-2">
                        <div className="flex flex-1 items-center gap-1.5 pr-2">
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded"
                            style={{ background: `${meta.color}1a`, color: meta.color }}
                          >
                            <Icon className="h-3 w-3" />
                          </span>
                          <span className="text-[11px] font-medium">{meta.label}</span>
                          <Badge variant="outline" className="ml-auto text-[8px]">#{comp.order}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2 pt-1">
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-muted-foreground">{meta.description}</p>
                          <p className="text-[10px] italic text-muted-foreground/80">
                            Contoh: {meta.example}
                          </p>
                          <ComponentConfigEditor
                            kind={comp.kind}
                            config={comp.config}
                            onChange={(newCfg) => updateComponent(nodeId, comp.id, { config: newCfg })}
                          />
                          <div className="flex items-center gap-1 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px]"
                              disabled={idx === 0}
                              onClick={() => reorderComponent(nodeId, comp.id, 'up')}
                            >
                              ↑ Up
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px]"
                              disabled={idx === node.components.length - 1}
                              onClick={() => reorderComponent(nodeId, comp.id, 'down')}
                            >
                              ↓ Down
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="ml-auto h-6 px-2 text-[10px]"
                              onClick={() => removeComponent(nodeId, comp.id)}
                            >
                              <LucideIcons.Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>

          {/* Danger zone */}
          <div className="border-t pt-3">
            <Button
              variant="destructive"
              size="sm"
              className="w-full text-[11px]"
              onClick={() => {
                removeNode(nodeId);
                setSelection({ type: 'none' });
              }}
            >
              <LucideIcons.Trash2 className="h-3 w-3 mr-1" /> Delete Node
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function AddComponentMenu({ onAdd }: { onAdd: (k: NodeComponentKind) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className="h-6 px-2 text-[10px]"
        onClick={() => setOpen((v) => !v)}
      >
        <LucideIcons.Plus className="h-3 w-3 mr-0.5" /> Add
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-40 w-52 rounded-md border bg-popover shadow-lg">
            <ScrollArea className="max-h-72">
              <div className="p-1">
                {NODE_COMPONENT_KINDS.map((k) => {
                  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[k.icon] ?? LucideIcons.Box;
                  return (
                    <button
                      key={k.kind}
                      onClick={() => {
                        onAdd(k.kind);
                        setOpen(false);
                      }}
                      className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-accent"
                    >
                      <span
                        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded mt-0.5"
                        style={{ background: `${k.color}1a`, color: k.color }}
                      >
                        <Icon className="h-2.5 w-2.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium">{k.label}</div>
                        <div className="text-[9px] text-muted-foreground line-clamp-1">{k.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Component Config Editor (kind-aware form)
// ============================================================

function ComponentConfigEditor({
  kind,
  config,
  onChange,
}: {
  kind: NodeComponentKind;
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const setField = (key: string, value: unknown) => {
    onChange({ ...config, [key]: value });
  };

  // Render kind-specific editors
  switch (kind) {
    case 'FORM':
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">schemaRef</Label>
            <Input
              value={String(config.schemaRef ?? '')}
              onChange={(e) => setField('schemaRef', e.target.value)}
              className="h-7 text-[11px] font-mono"
            />
          </div>
          <div>
            <Label className="text-[10px]">Fields (comma-separated)</Label>
            <Input
              value={Array.isArray(config.fields) ? (config.fields as string[]).join(', ') : ''}
              onChange={(e) =>
                setField(
                  'fields',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              className="h-7 text-[11px]"
              placeholder="customer, produk, qty"
            />
          </div>
        </div>
      );

    case 'DOCUMENT':
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">templateRef</Label>
            <Input
              value={String(config.templateRef ?? '')}
              onChange={(e) => setField('templateRef', e.target.value)}
              className="h-7 text-[11px] font-mono"
            />
          </div>
          <div>
            <Label className="text-[10px]">Output type</Label>
            <Select value={String(config.outputType ?? 'PDF')} onValueChange={(v) => setField('outputType', v)}>
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['PDF', 'DWG', 'PNG', 'DOCX', 'XLSX'].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch
              id="doc-versioned"
              checked={!!config.versioned}
              onCheckedChange={(v) => setField('versioned', v)}
            />
            <Label htmlFor="doc-versioned" className="text-[10px]">Versioned (revision history)</Label>
          </div>
        </div>
      );

    case 'APPROVAL': {
      const stages = (config.stages as Array<{ name: string; role: string }>) ?? [];
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">Mode</Label>
            <Select
              value={String(config.mode ?? 'sequential')}
              onValueChange={(v) => setField('mode', v)}
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="parallel">Parallel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">Stages</Label>
            <div className="space-y-1">
              {stages.map((s, i) => (
                <div key={i} className="flex gap-1">
                  <Input
                    value={s.name}
                    onChange={(e) => {
                      const next = [...stages];
                      next[i] = { ...s, name: e.target.value };
                      setField('stages', next);
                    }}
                    className="h-7 text-[11px]"
                    placeholder="Stage name"
                  />
                  <Input
                    value={s.role}
                    onChange={(e) => {
                      const next = [...stages];
                      next[i] = { ...s, role: e.target.value };
                      setField('stages', next);
                    }}
                    className="h-7 text-[11px]"
                    placeholder="Role"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => setField('stages', stages.filter((_, j) => j !== i))}
                  >
                    <LucideIcons.X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="h-6 w-full text-[10px]"
                onClick={() => setField('stages', [...stages, { name: '', role: '' }])}
              >
                + Add stage
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-[10px]">workMayStartAtStage</Label>
            <Input
              value={String(config.workMayStartAtStage ?? '')}
              onChange={(e) => setField('workMayStartAtStage', e.target.value)}
              className="h-7 text-[11px]"
              placeholder="PREPARED"
            />
          </div>
          <div>
            <Label className="text-[10px]">onReject</Label>
            <Select
              value={String(config.onReject ?? 'RETURN_TO_STAGE')}
              onValueChange={(v) => setField('onReject', v)}
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RETURN_TO_STAGE">RETURN_TO_STAGE</SelectItem>
                <SelectItem value="RETURN_TO_NODE">RETURN_TO_NODE</SelectItem>
                <SelectItem value="CREATE_TICKET">CREATE_TICKET</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    case 'ROUTING': {
      const mapping = (config.mapping as Record<string, string>) ?? {};
      return (
        <div className="space-y-1.5">
          <Label className="text-[10px]">Mapping (classification → target nodeKey)</Label>
          <div className="space-y-1">
            {Object.entries(mapping).map(([k, v]) => (
              <div key={k} className="flex gap-1">
                <Input
                  value={k}
                  onChange={(e) => {
                    const next = { ...mapping };
                    delete next[k];
                    next[e.target.value] = v;
                    setField('mapping', next);
                  }}
                  className="h-7 text-[11px]"
                  placeholder="classification"
                />
                <span className="self-center text-[10px]">→</span>
                <Input
                  value={v}
                  onChange={(e) => {
                    const next = { ...mapping };
                    next[k] = e.target.value;
                    setField('mapping', next);
                  }}
                  className="h-7 text-[11px]"
                  placeholder="target"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    const next = { ...mapping };
                    delete next[k];
                    setField('mapping', next);
                  }}
                >
                  <LucideIcons.X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-full text-[10px]"
              onClick={() => setField('mapping', { ...mapping, 'new-class': 'target-node' })}
            >
              + Add mapping
            </Button>
          </div>
        </div>
      );
    }

    case 'CALC':
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">Expression</Label>
            <Input
              value={String(config.expression ?? '')}
              onChange={(e) => setField('expression', e.target.value)}
              className="h-7 text-[11px] font-mono"
              placeholder="qty + MoQ"
            />
          </div>
          <div>
            <Label className="text-[10px]">Output field</Label>
            <Input
              value={String(config.outputField ?? '')}
              onChange={(e) => setField('outputField', e.target.value)}
              className="h-7 text-[11px] font-mono"
              placeholder="po.qty"
            />
          </div>
        </div>
      );

    case 'FANOUT':
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">Rule</Label>
            <Input
              value={String(config.rule ?? '')}
              onChange={(e) => setField('rule', e.target.value)}
              className="h-7 text-[11px] font-mono"
              placeholder="ONE_PER_ORDER | PER_OPERATION_X2_QC_PAIR"
            />
          </div>
          <div>
            <Label className="text-[10px]">Artifact</Label>
            <Input
              value={String(config.artifact ?? '')}
              onChange={(e) => setField('artifact', e.target.value)}
              className="h-7 text-[11px] font-mono"
              placeholder="MANUFACTURING_ORDER | JOBSHEET"
            />
          </div>
          <div>
            <Label className="text-[10px]">Pair type (optional)</Label>
            <Input
              value={String(config.pairType ?? '')}
              onChange={(e) => setField('pairType', e.target.value)}
              className="h-7 text-[11px] font-mono"
              placeholder="PRODUCTION_QC"
            />
          </div>
        </div>
      );

    case 'QC_PATTERN': {
      const pattern = String(config.pattern ?? 'PER_OP_CHECKLIST');
      const items = (config.items as string[]) ?? [];
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">Pattern</Label>
            <Select value={pattern} onValueChange={(v) => setField('pattern', v)}>
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PER_OP_CHECKLIST">PER_OP_CHECKLIST</SelectItem>
                <SelectItem value="PING_PONG">PING_PONG</SelectItem>
                <SelectItem value="MULTI_PARTY_SIGN">MULTI_PARTY_SIGN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px]">Items (comma-separated)</Label>
            <Input
              value={items.join(', ')}
              onChange={(e) =>
                setField(
                  'items',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              className="h-7 text-[11px]"
              placeholder="dimensi, surface, toleransi"
            />
          </div>
          <div>
            <Label className="text-[10px]">Pass criteria</Label>
            <Input
              value={String(config.passCriteria ?? '')}
              onChange={(e) => setField('passCriteria', e.target.value)}
              className="h-7 text-[11px] font-mono"
              placeholder="ALL_ITEMS_PASS"
            />
          </div>
          <div>
            <Label className="text-[10px]">Max rounds</Label>
            <Input
              type="number"
              value={Number(config.maxRounds ?? 1)}
              onChange={(e) => setField('maxRounds', Number(e.target.value))}
              className="h-7 text-[11px]"
            />
          </div>
        </div>
      );
    }

    case 'TIMER':
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">Mode</Label>
            <Select value={String(config.mode ?? 'PER_TASK')} onValueChange={(v) => setField('mode', v)}>
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PER_TASK">PER_TASK</SelectItem>
                <SelectItem value="PER_NODE">PER_NODE</SelectItem>
                <SelectItem value="PER_QC_ROUND">PER_QC_ROUND</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch
              checked={!!config.attributionSplit}
              onCheckedChange={(v) => setField('attributionSplit', v)}
              id="attribution"
            />
            <Label htmlFor="attribution" className="text-[10px]">Attribution split (operator vs QC)</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch
              checked={!!config.autoPauseOnBreakdown}
              onCheckedChange={(v) => setField('autoPauseOnBreakdown', v)}
              id="auto-pause"
            />
            <Label htmlFor="auto-pause" className="text-[10px]">Auto-pause on breakdown</Label>
          </div>
        </div>
      );

    case 'EVIDENCE': {
      const requiredTypes = (config.requiredTypes as string[]) ?? [];
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">Required types (comma-separated)</Label>
            <Input
              value={requiredTypes.join(', ')}
              onChange={(e) =>
                setField(
                  'requiredTypes',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              className="h-7 text-[11px]"
              placeholder="surat_jalan, foto, resi"
            />
          </div>
          <div>
            <Label className="text-[10px]">Min count</Label>
            <Input
              type="number"
              value={Number(config.minCount ?? 1)}
              onChange={(e) => setField('minCount', Number(e.target.value))}
              className="h-7 text-[11px]"
            />
          </div>
        </div>
      );
    }

    case 'INVENTORY_POLICY': {
      const sp = (config.stockPolicy as Record<string, string>) ?? {};
      return (
        <div className="space-y-1.5">
          <Label className="text-[10px]">Stock policy per category</Label>
          <div className="space-y-1">
            {Object.entries(sp).map(([k, v]) => (
              <div key={k} className="flex gap-1">
                <Input
                  value={k}
                  onChange={(e) => {
                    const next = { ...sp };
                    delete next[k];
                    next[e.target.value] = v;
                    setField('stockPolicy', next);
                  }}
                  className="h-7 text-[11px]"
                />
                <Select value={v} onValueChange={(val) => {
                  const next = { ...sp, [k]: val };
                  setField('stockPolicy', next);
                }}>
                  <SelectTrigger className="h-7 text-[11px] w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STOCKED">STOCKED</SelectItem>
                    <SelectItem value="NOT_STOCKED">NOT_STOCKED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Switch
              checked={!!config.partialIncoming}
              onCheckedChange={(v) => setField('partialIncoming', v)}
              id="partial"
            />
            <Label htmlFor="partial" className="text-[10px]">Allow partial incoming</Label>
          </div>
          <div>
            <Label className="text-[10px]">On shortage</Label>
            <Select
              value={String(config.onShortage ?? 'PR_CREATE')}
              onValueChange={(v) => setField('onShortage', v)}
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PR_CREATE">PR_CREATE</SelectItem>
                <SelectItem value="NOTIFY_ONLY">NOTIFY_ONLY</SelectItem>
                <SelectItem value="BLOCK">BLOCK</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    case 'SCHEDULING':
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">Machine capacity (hours/day)</Label>
            <Input
              type="number"
              value={Number(config.machineCapacityHoursPerDay ?? 22)}
              onChange={(e) => setField('machineCapacityHoursPerDay', Number(e.target.value))}
              className="h-7 text-[11px]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Switch
              checked={!!config.reassignRequiresApproval}
              onCheckedChange={(v) => setField('reassignRequiresApproval', v)}
              id="ra"
            />
            <Label htmlFor="ra" className="text-[10px]">Reassign requires approval</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Switch
              checked={!!config.reassignReasonRequired}
              onCheckedChange={(v) => setField('reassignReasonRequired', v)}
              id="rr"
            />
            <Label htmlFor="rr" className="text-[10px]">Reassign reason required</Label>
          </div>
        </div>
      );

    case 'GATE':
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">Gate key</Label>
            <Input
              value={String(config.gateKey ?? '')}
              onChange={(e) => setField('gateKey', e.target.value)}
              className="h-7 text-[11px] font-mono"
              placeholder="MATERIAL_READY"
            />
          </div>
          <div>
            <Label className="text-[10px]">Opens on (events, comma-separated)</Label>
            <Input
              value={Array.isArray(config.opensOn) ? (config.opensOn as string[]).join(', ') : ''}
              onChange={(e) =>
                setField(
                  'opensOn',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              className="h-7 text-[11px]"
              placeholder="MATERIAL_RECEIVED"
            />
          </div>
          <div>
            <Label className="text-[10px]">Mode</Label>
            <Select
              value={String(config.mode ?? 'PARTIAL_OK')}
              onValueChange={(v) => setField('mode', v)}
            >
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PARTIAL_OK">PARTIAL_OK</SelectItem>
                <SelectItem value="ALL_REQUIRED">ALL_REQUIRED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'ESCALATION': {
      const triggers = (config.triggers as string[]) ?? [];
      const actions = (config.actions as string[]) ?? [];
      return (
        <div className="space-y-1.5">
          <div>
            <Label className="text-[10px]">Triggers (events, comma-separated)</Label>
            <Input
              value={triggers.join(', ')}
              onChange={(e) =>
                setField(
                  'triggers',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              className="h-7 text-[11px]"
              placeholder="MACHINE_DOWN, RETURN_FILED"
            />
          </div>
          <div>
            <Label className="text-[10px]">Actions (comma-separated)</Label>
            <Input
              value={actions.join(', ')}
              onChange={(e) =>
                setField(
                  'actions',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
              className="h-7 text-[11px]"
              placeholder="PAUSE, SUBCON_REDIRECT, URGENT_REVISION_TICKET"
            />
          </div>
        </div>
      );
    }

    default:
      return <RawJsonEditor config={config} onChange={onChange} />;
  }
}

function RawJsonEditor({
  config,
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(config, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(config, null, 2));
  }, [config]);

  return (
    <div className="space-y-1">
      <Textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            const parsed = JSON.parse(e.target.value);
            setError(null);
            onChange(parsed);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
        className="font-mono text-[10px]"
        rows={6}
      />
      {error && <p className="text-[9px] text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================
// Edge Inspector
// ============================================================

function EdgeInspector({ edgeId }: { edgeId: string }) {
  const template = useWorkflowStore((s) => s.templates.find((t) => t.id === s.activeTemplateId)!);
  const edge = template.edges.find((e) => e.id === edgeId)!;
  const fromNode = template.nodes.find((n) => n.id === edge.fromNodeId);
  const toNode = template.nodes.find((n) => n.id === edge.toNodeId);
  const updateEdge = useWorkflowStore((s) => s.updateEdge);
  const removeEdge = useWorkflowStore((s) => s.removeEdge);
  const addAction = useWorkflowStore((s) => s.addAction);
  const removeAction = useWorkflowStore((s) => s.removeAction);
  const updateAction = useWorkflowStore((s) => s.updateAction);
  const setSelection = useWorkflowStore((s) => s.setSelection);

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <LucideIcons.ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">
              {fromNode?.name ?? '?'} → {toNode?.name ?? '?'}
            </h3>
            <p className="truncate text-[10px] text-muted-foreground">{edge.edgeType}</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {/* Edge type & condition */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Routing
            </h4>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Edge type</Label>
              <Select
                value={edge.edgeType}
                onValueChange={(v) => updateEdge(edgeId, { edgeType: v as EdgeType })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEQUENTIAL">SEQUENTIAL</SelectItem>
                  <SelectItem value="PARALLEL">PARALLEL</SelectItem>
                  <SelectItem value="LOOP_BACK">LOOP_BACK</SelectItem>
                  <SelectItem value="EXCEPTION">EXCEPTION</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Condition label</Label>
              <Input
                value={edge.condition?.label ?? ''}
                onChange={(e) =>
                  updateEdge(edgeId, {
                    condition: { label: e.target.value, expression: edge.condition?.expression ?? `event == "${e.target.value}"` },
                  })
                }
                className="h-8 text-xs"
                placeholder="ORDER_RELEASED"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px]">Condition expression</Label>
              <Input
                value={edge.condition?.expression ?? ''}
                onChange={(e) =>
                  updateEdge(edgeId, {
                    condition: { label: edge.condition?.label ?? '', expression: e.target.value },
                  })
                }
                className="h-8 font-mono text-xs"
                placeholder='event == "ORDER_RELEASED"'
              />
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Actions ({edge.actions.length})
              </h4>
              <AddActionMenu onAdd={(k, t) => addAction(edgeId, k, t)} />
            </div>
            {edge.actions.length === 0 ? (
              <p className="rounded border border-dashed p-3 text-center text-[10px] text-muted-foreground">
                Tidak ada action. Edge ini hanya transisi state, tanpa efek samping.
              </p>
            ) : (
              <div className="space-y-1.5">
                {edge.actions.map((a, idx) => {
                  const meta = ACTION_KINDS.find((k) => k.kind === a.kind)!;
                  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[meta.icon] ?? LucideIcons.Box;
                  return (
                    <Accordion key={a.id} type="single" collapsible>
                      <AccordionItem
                        value={a.id}
                        className="rounded-md border bg-background px-2"
                      >
                        <AccordionTrigger className="hover:no-underline py-2">
                          <div className="flex flex-1 items-center gap-1.5 pr-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-amber-600">
                              <Icon className="h-3 w-3" />
                            </span>
                            <span className="text-[11px] font-medium">{meta.label}</span>
                            <Badge variant="outline" className="ml-auto text-[8px]">#{a.order}</Badge>
                            {a.blocking && (
                              <Badge className="text-[8px] bg-red-500/20 text-red-700">BLOCK</Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2 pt-1">
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-muted-foreground">{meta.description}</p>
                            <p className="text-[10px] italic text-muted-foreground/80">Contoh: {meta.example}</p>
                            <div className="flex items-center gap-1.5">
                              <Switch
                                checked={a.blocking}
                                onCheckedChange={(v) => updateAction(edgeId, a.id, { blocking: v, onFailure: v ? 'BLOCK' : 'CONTINUE' })}
                                id={`block-${a.id}`}
                              />
                              <Label htmlFor={`block-${a.id}`} className="text-[10px]">Blocking</Label>
                            </div>
                            <div>
                              <Label className="text-[10px]">onFailure</Label>
                              <Select
                                value={a.onFailure}
                                onValueChange={(v) => updateAction(edgeId, a.id, { onFailure: v as 'BLOCK' | 'CONTINUE' })}
                              >
                                <SelectTrigger className="h-7 text-[11px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="BLOCK">BLOCK</SelectItem>
                                  <SelectItem value="CONTINUE">CONTINUE</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-[10px]">Config (JSON)</Label>
                              <RawJsonEditor
                                config={a.config}
                                onChange={(c) => updateAction(edgeId, a.id, { config: c })}
                              />
                            </div>
                            {a.retry && (
                              <div className="rounded border bg-muted/30 p-1.5 text-[10px]">
                                <div className="font-mono">
                                  retry: max={a.retry.max}, backoff={a.retry.backoff}, timeout={a.retry.timeoutMs}ms
                                </div>
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 w-full text-[10px]"
                              onClick={() => removeAction(edgeId, a.id)}
                            >
                              <LucideIcons.Trash2 className="h-3 w-3 mr-1" /> Remove Action
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <Button
              variant="destructive"
              size="sm"
              className="w-full text-[11px]"
              onClick={() => {
                removeEdge(edgeId);
                setSelection({ type: 'none' });
              }}
            >
              <LucideIcons.Trash2 className="h-3 w-3 mr-1" /> Delete Edge
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function AddActionMenu({ onAdd }: { onAdd: (k: ActionKind, t: TriggerType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className="h-6 px-2 text-[10px]"
        onClick={() => setOpen((v) => !v)}
      >
        <LucideIcons.Plus className="h-3 w-3 mr-0.5" /> Add
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-40 w-56 rounded-md border bg-popover shadow-lg">
            <ScrollArea className="max-h-72">
              <div className="p-1">
                {ACTION_KINDS.map((k) => {
                  const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[k.icon] ?? LucideIcons.Box;
                  return (
                    <button
                      key={k.kind}
                      onClick={() => {
                        onAdd(k.kind, 'EDGE');
                        setOpen(false);
                      }}
                      className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-accent"
                    >
                      <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded mt-0.5 bg-amber-500/10 text-amber-600">
                        <Icon className="h-2.5 w-2.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-medium">{k.label}</span>
                          {k.blockingDefault && (
                            <span className="rounded bg-red-500/20 px-1 text-[8px] text-red-700">B</span>
                          )}
                        </div>
                        <div className="text-[9px] text-muted-foreground line-clamp-1">{k.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
