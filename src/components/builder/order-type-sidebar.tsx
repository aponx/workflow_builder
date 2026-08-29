'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function OrderTypeSidebar() {
  const orderTypes = useWorkflowStore((s) => s.orderTypes);
  const templates = useWorkflowStore((s) => s.templates);
  const activeTemplateId = useWorkflowStore((s) => s.activeTemplateId);
  const selectTemplate = useWorkflowStore((s) => s.selectTemplate);
  const toggleOrderType = useWorkflowStore((s) => s.toggleOrderType);
  const createTemplate = useWorkflowStore((s) => s.createTemplate);
  const cloneTemplate = useWorkflowStore((s) => s.cloneTemplate);
  const deleteTemplate = useWorkflowStore((s) => s.deleteTemplate);
  const addOrderType = useWorkflowStore((s) => s.addOrderType);
  const resetReference = useWorkflowStore((s) => s.resetReference);

  const [newOtOpen, setNewOtOpen] = useState(false);
  const [newTplOpen, setNewTplOpen] = useState(false);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="border-b border-sidebar-border px-3 py-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground">
            Order Types
          </h2>
          <Dialog open={newOtOpen} onOpenChange={setNewOtOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <LucideIcons.Plus className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <NewOrderTypeDialog
              onCreate={(code, name, desc) => {
                addOrderType(code, name, desc);
                setNewOtOpen(false);
              }}
            />
          </Dialog>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-2">
          {orderTypes.map((ot) => {
            const otTemplates = templates.filter((t) => t.orderTypeId === ot.id);
            return (
              <div key={ot.id} className="space-y-1">
                <div className="flex items-center gap-1.5 px-1">
                  <button
                    onClick={() => toggleOrderType(ot.id)}
                    className={cn(
                      'flex h-3 w-3 items-center justify-center rounded-full border',
                      ot.isActive ? 'bg-green-500 border-green-500' : 'border-muted-foreground/40'
                    )}
                    title={ot.isActive ? 'Active' : 'Inactive'}
                  />
                  <span className="text-[11px] font-semibold">{ot.name}</span>
                  <Badge variant="outline" className="ml-auto text-[8px] font-mono">
                    {ot.code}
                  </Badge>
                </div>
                <p className="px-1 text-[10px] leading-tight text-muted-foreground line-clamp-2">
                  {ot.description}
                </p>
                <div className="space-y-0.5 pl-3">
                  {otTemplates.length === 0 ? (
                    <div className="flex items-center gap-1 py-0.5 text-[10px] italic text-muted-foreground">
                      <LucideIcons.CircleDashed className="h-2.5 w-2.5" /> No templates
                    </div>
                  ) : (
                    otTemplates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => selectTemplate(t.id)}
                        className={cn(
                          'flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors',
                          activeTemplateId === t.id
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'hover:bg-sidebar-accent/60'
                        )}
                      >
                        {t.isActive ? (
                          <LucideIcons.CircleDot className="h-2.5 w-2.5 flex-shrink-0 text-green-500" />
                        ) : (
                          <LucideIcons.Circle className="h-2.5 w-2.5 flex-shrink-0 text-amber-500" />
                        )}
                        <span className="truncate text-[10px] font-medium">{t.name}</span>
                        <span className="ml-auto text-[9px] text-muted-foreground">v{t.version}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer actions */}
      <div className="space-y-1 border-t border-sidebar-border p-2">
        <Dialog open={newTplOpen} onOpenChange={setNewTplOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="w-full text-[10px] h-7">
              <LucideIcons.FilePlus className="h-3 w-3 mr-1" /> New Template
            </Button>
          </DialogTrigger>
          <NewTemplateDialog
            orderTypes={orderTypes}
            onCreate={(orderTypeId, name, desc) => {
              createTemplate(orderTypeId, name, desc);
              setNewTplOpen(false);
            }}
          />
        </Dialog>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-[10px] h-7"
            onClick={() => activeTemplateId && cloneTemplate(activeTemplateId)}
            disabled={!activeTemplateId}
          >
            <LucideIcons.Copy className="h-3 w-3 mr-1" /> Clone
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-[10px] h-7 text-destructive hover:bg-destructive/10"
            onClick={() => activeTemplateId && deleteTemplate(activeTemplateId)}
            disabled={!activeTemplateId}
          >
            <LucideIcons.Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="w-full text-[10px] h-7 text-muted-foreground"
          onClick={() => {
            if (confirm('Reset semua ke reference workflow? Perubahan lokal akan hilang.')) {
              resetReference();
            }
          }}
        >
          <LucideIcons.RotateCcw className="h-3 w-3 mr-1" /> Reset to Reference
        </Button>
      </div>
    </div>
  );
}

function NewOrderTypeDialog({
  onCreate,
}: {
  onCreate: (code: string, name: string, description: string) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>New Order Type</DialogTitle>
        <DialogDescription>
          Buat tipe order baru. Setiap order type bisa punya banyak versi workflow template.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="ot-code" className="text-xs">Code</Label>
          <Input
            id="ot-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
            placeholder="REGULAR, FINAL_PART, CUSTOM"
            className="font-mono text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ot-name" className="text-xs">Name</Label>
          <Input
            id="ot-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Regular Order"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ot-desc" className="text-xs">Description</Label>
          <Textarea
            id="ot-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat tipe order ini"
            rows={3}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onCreate(code, name, description)}
          disabled={!code || !name}
          size="sm"
        >
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function NewTemplateDialog({
  orderTypes,
  onCreate,
}: {
  orderTypes: { id: string; code: string; name: string; isActive: boolean }[];
  onCreate: (orderTypeId: string, name: string, description: string) => void;
}) {
  const [orderTypeId, setOrderTypeId] = useState(orderTypes[0]?.id ?? '');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>New Workflow Template</DialogTitle>
        <DialogDescription>
          Buat template kosong. Anda akan menyusun node dan edge di canvas.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Order Type</Label>
          <select
            value={orderTypeId}
            onChange={(e) => setOrderTypeId(e.target.value)}
            className="w-full rounded border bg-background px-2 py-1.5 text-xs"
          >
            {orderTypes.map((o) => (
              <option key={o.id} value={o.id}>
                {o.code} — {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-name" className="text-xs">Template name</Label>
          <Input
            id="t-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Regular Order Workflow v2"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-desc" className="text-xs">Description</Label>
          <Textarea
            id="t-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat template ini"
            rows={3}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onCreate(orderTypeId, name, description)}
          disabled={!orderTypeId || !name}
          size="sm"
        >
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
