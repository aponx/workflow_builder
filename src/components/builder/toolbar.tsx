'use client';

import * as LucideIcons from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import type { BuilderView } from '@/lib/store/workflow-store';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  onOpenRegistry: () => void;
  onOpenEvents: () => void;
  onOpenHelp: () => void;
}

export function Toolbar({ onOpenRegistry, onOpenEvents, onOpenHelp }: ToolbarProps) {
  const template = useWorkflowStore((s) => s.templates.find((t) => t.id === s.activeTemplateId));
  const undo = useWorkflowStore((s) => s.undo);
  const redo = useWorkflowStore((s) => s.redo);
  const past = useWorkflowStore((s) => s.past);
  const future = useWorkflowStore((s) => s.future);
  const publishTemplate = useWorkflowStore((s) => s.publishTemplate);
  const validate = useWorkflowStore((s) => s.validate);
  const [validateOpen, setValidateOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validate> | null>(null);

  const handleValidate = () => {
    const result = validate();
    setValidationResult(result);
    setValidateOpen(true);
  };

  const handlePublish = () => {
    const result = validate();
    setValidationResult(result);
    if (result.passed) {
      publishTemplate(template!.id);
      setPublishOpen(true);
    } else {
      setValidateOpen(true);
    }
  };

  return (
    <div className="flex h-12 items-center gap-2 border-b bg-background px-3">
      <div className="flex items-center gap-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LucideIcons.Workflow className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-xs font-bold">ManuOS</div>
          <div className="text-[9px] text-muted-foreground">Dynamic Workflow Builder</div>
        </div>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Active template info */}
      {template ? (
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-xs font-medium">{template.name}</span>
          <Badge variant="outline" className="text-[9px]">v{template.version}</Badge>
          {template.isActive ? (
            <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/15 text-[9px]">PUBLISHED</Badge>
          ) : (
            <Badge variant="secondary" className="text-[9px]">DRAFT</Badge>
          )}
          <span className="text-[10px] text-muted-foreground hidden md:inline">
            · {template.nodes.length} nodes · {template.edges.length} edges
          </span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">No active template</span>
      )}

      <div className="ml-auto flex items-center gap-1">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={undo}
                disabled={past.length === 0}
              >
                <LucideIcons.Undo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo ({past.length} in history)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={redo}
                disabled={future.length === 0}
              >
                <LucideIcons.Redo2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo ({future.length} in history)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-5 w-px bg-border mx-1" />

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          onClick={onOpenRegistry}
        >
          <LucideIcons.Library className="h-3 w-3 mr-1" />
          Registry
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          onClick={onOpenEvents}
        >
          <LucideIcons.Radio className="h-3 w-3 mr-1" />
          Events
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          onClick={onOpenHelp}
        >
          <LucideIcons.HelpCircle className="h-3 w-3 mr-1" />
          Help
        </Button>

        <div className="h-5 w-px bg-border mx-1" />

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          onClick={handleValidate}
          disabled={!template}
        >
          <LucideIcons.CheckCheck className="h-3 w-3 mr-1" />
          Validate
        </Button>
        <Button
          size="sm"
          className="h-7 text-[11px]"
          onClick={handlePublish}
          disabled={!template}
        >
          <LucideIcons.Rocket className="h-3 w-3 mr-1" />
          Publish
        </Button>
      </div>

      {/* Validation Dialog */}
      <Dialog open={validateOpen} onOpenChange={setValidateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {validationResult?.passed ? (
                <LucideIcons.CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <LucideIcons.AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              Validation Result
            </DialogTitle>
            <DialogDescription>
              {validationResult?.passed
                ? 'Workflow lolos validasi struktur, kontrak, dan semantik. Siap publish.'
                : 'Beberapa issue ditemukan. Perbaiki dulu sebelum publish.'}
            </DialogDescription>
          </DialogHeader>

          {validationResult && (
            <ValidationResultView result={validationResult} />
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setValidateOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish success Dialog */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LucideIcons.PartyPopper className="h-5 w-5 text-green-500" />
              Template Published
            </DialogTitle>
            <DialogDescription>
              Template <strong>{template?.name}</strong> v{template?.version} sekarang aktif.
              Order baru yang menggunakan order type ini akan memakai versi template yang baru dipublish.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" onClick={() => setPublishOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ValidationResultView({
  result,
}: {
  result: NonNullable<ReturnType<typeof useWorkflowStore.getState>['validate']>;
}) {
  const errors = result.issues.filter((i) => i.level === 'error');
  const warnings = result.issues.filter((i) => i.level === 'warning');
  const infos = result.issues.filter((i) => i.level === 'info');

  return (
    <div className="space-y-3 py-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded border border-red-200 bg-red-50 p-2 text-center dark:border-red-900 dark:bg-red-950/30">
          <div className="text-xl font-bold text-red-600">{errors.length}</div>
          <div className="text-[10px] text-red-600">Errors</div>
        </div>
        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-center dark:border-amber-900 dark:bg-amber-950/30">
          <div className="text-xl font-bold text-amber-600">{warnings.length}</div>
          <div className="text-[10px] text-amber-600">Warnings</div>
        </div>
        <div className="rounded border border-blue-200 bg-blue-50 p-2 text-center dark:border-blue-900 dark:bg-blue-950/30">
          <div className="text-xl font-bold text-blue-600">{infos.length}</div>
          <div className="text-[10px] text-blue-600">Info</div>
        </div>
      </div>

      {result.dryRunPath && (
        <div className="rounded border bg-muted/30 p-2">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            <LucideIcons.PlayCircle className="h-3 w-3" />
            Dry-run path (start → end)
          </div>
          <div className="flex flex-wrap items-center gap-1 text-[10px]">
            {result.dryRunPath.map((id, i) => (
              <span key={id} className="flex items-center gap-1">
                <code className="rounded bg-background px-1 py-0.5">{id.slice(0, 12)}</code>
                {i < result.dryRunPath!.length - 1 && (
                  <LucideIcons.ChevronRight className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="max-h-72">
        <div className="space-y-1">
          {result.issues.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No issues — workflow siap publish.
            </p>
          ) : (
            result.issues.map((issue, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2 rounded border p-2 text-[11px]',
                  issue.level === 'error' && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20',
                  issue.level === 'warning' && 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20',
                  issue.level === 'info' && 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20'
                )}
              >
                {issue.level === 'error' && <LucideIcons.XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
                {issue.level === 'warning' && <LucideIcons.AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                {issue.level === 'info' && <LucideIcons.Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[8px] uppercase">{issue.category}</Badge>
                  </div>
                  <div className="mt-0.5">{issue.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// satisfy BuilderView type usage
export type { BuilderView };
