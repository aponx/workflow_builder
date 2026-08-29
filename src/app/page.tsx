'use client';

import { useState } from 'react';
import { Toolbar } from '@/components/builder/toolbar';
import { OrderTypeSidebar } from '@/components/builder/order-type-sidebar';
import { NodePalette } from '@/components/builder/node-palette';
import { WorkflowCanvas } from '@/components/builder/workflow-canvas';
import { InspectorPanel } from '@/components/builder/inspector-panel';
import { RegistryBrowser } from '@/components/builder/registry-browser';
import { EventsCatalog } from '@/components/builder/events-catalog';
import { HelpOverlay } from '@/components/builder/help-overlay';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useWorkflowStore } from '@/lib/store/workflow-store';

export default function Home() {
  const [showRegistry, setShowRegistry] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Toolbar
        onOpenRegistry={() => setShowRegistry(true)}
        onOpenEvents={() => setShowEvents(true)}
        onOpenHelp={() => setShowHelp(true)}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Order types sidebar */}
          <ResizablePanel defaultSize={14} minSize={10} maxSize={20} className="bg-sidebar">
            <OrderTypeSidebar />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Node palette */}
          <ResizablePanel defaultSize={14} minSize={10} maxSize={20}>
            <NodePalette />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Canvas */}
          <ResizablePanel defaultSize={48} minSize={30}>
            <WorkflowCanvas />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Inspector */}
          <ResizablePanel defaultSize={24} minSize={18} maxSize={40}>
            <InspectorPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Overlays */}
      {showRegistry && <RegistryBrowser onClose={() => setShowRegistry(false)} />}
      {showEvents && <EventsCatalog onClose={() => setShowEvents(false)} />}
      {showHelp && (
        <HelpOverlay
          onClose={() => {
            setShowHelp(false);
          }}
        />
      )}
    </div>
  );
}

function StatusBar() {
  const template = useWorkflowStore((s) => s.templates.find((t) => t.id === s.activeTemplateId));
  const selection = useWorkflowStore((s) => s.selection);

  let selectionText = 'No selection';
  if (selection.type === 'node') {
    const node = template?.nodes.find((n) => n.id === selection.id);
    selectionText = node ? `Node: ${node.name} (${node.nodeKey})` : 'Node not found';
  } else if (selection.type === 'edge') {
    const edge = template?.edges.find((e) => e.id === selection.id);
    if (edge) {
      const from = template?.nodes.find((n) => n.id === edge.fromNodeId)?.name ?? '?';
      const to = template?.nodes.find((n) => n.id === edge.toNodeId)?.name ?? '?';
      selectionText = `Edge: ${from} → ${to} (${edge.edgeType})`;
    }
  }

  return (
    <div className="flex h-6 items-center gap-3 border-t bg-muted/30 px-3 text-[10px] text-muted-foreground">
      <span className="font-mono">{selectionText}</span>
      <span className="ml-auto">ManuOS Dynamic Workflow Builder · config-driven DAG · 20 global components · 13 dynamic elements · 19 action kinds · 13 node component kinds</span>
    </div>
  );
}
