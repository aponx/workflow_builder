'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflow-store';
import { BUSINESS_UNITS, NODE_COMPONENT_KINDS } from '@/lib/data/registry';
import type { WorkflowNodeDef, EdgeType } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WorkflowCanvasProps {
  showGrid?: boolean;
}

const NODE_W = 200;
const NODE_H = 110;

export function WorkflowCanvas({ showGrid = true }: WorkflowCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragInfo, setDragInfo] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const activeTemplateId = useWorkflowStore((s) => s.activeTemplateId);
  const template = useWorkflowStore((s) => s.templates.find((t) => t.id === s.activeTemplateId));
  const selection = useWorkflowStore((s) => s.selection);
  const pendingEdgeFrom = useWorkflowStore((s) => s.pendingEdgeFrom);
  const setSelection = useWorkflowStore((s) => s.setSelection);
  const moveNode = useWorkflowStore((s) => s.moveNode);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const setPendingEdgeFrom = useWorkflowStore((s) => s.setPendingEdgeFrom);

  const onMouseDownNode = useCallback(
    (e: React.MouseEvent, node: WorkflowNodeDef) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      setSelection({ type: 'node', id: node.id });
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom - node.position.x;
      const y = (e.clientY - rect.top - pan.y) / zoom - node.position.y;
      setDragInfo({ nodeId: node.id, offsetX: x, offsetY: y });
    },
    [pan, zoom, setSelection]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragInfo) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom - dragInfo.offsetX;
      const y = (e.clientY - rect.top - pan.y) / zoom - dragInfo.offsetY;
      moveNode(dragInfo.nodeId, {
        x: Math.max(0, Math.round(x / 10) * 10),
        y: Math.max(0, Math.round(y / 10) * 10),
      });
    },
    [dragInfo, moveNode, pan, zoom]
  );

  const onMouseUp = useCallback(() => {
    setDragInfo(null);
  }, []);

  const onCanvasClick = useCallback(() => {
    setSelection({ type: 'none' });
  }, [setSelection]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.3, Math.min(2.5, z * delta)));
  }, []);

  // Connect nodes via edge handle
  const onConnectClick = useCallback(
    (nodeId: string) => {
      if (!pendingEdgeFrom) {
        setPendingEdgeFrom(nodeId);
      } else if (pendingEdgeFrom === nodeId) {
        setPendingEdgeFrom(null);
      } else {
        const edgeType: EdgeType = 'SEQUENTIAL';
        const result = addEdge(pendingEdgeFrom, nodeId, edgeType);
        setPendingEdgeFrom(null);
        if (result) {
          setSelection({ type: 'edge', id: result });
        }
      }
    },
    [pendingEdgeFrom, setPendingEdgeFrom, addEdge, setSelection]
  );

  const bounds = useMemo(() => {
    if (!template || template.nodes.length === 0) {
      return { w: 2400, h: 1200 };
    }
    const maxX = Math.max(...template.nodes.map((n) => n.position.x + NODE_W));
    const maxY = Math.max(...template.nodes.map((n) => n.position.y + NODE_H));
    return { w: Math.max(2400, maxX + 400), h: Math.max(1200, maxY + 400) };
  }, [template]);

  if (!template) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 text-muted-foreground">
        <div className="text-center">
          <LucideIcons.Workflow className="mx-auto h-10 w-10 opacity-30" />
          <p className="mt-3 text-sm">Tidak ada template aktif. Buat atau pilih template di sidebar.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-muted/20"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClick={onCanvasClick}
      onWheel={onWheel}
      style={{
        backgroundImage: showGrid
          ? `radial-gradient(circle, hsl(var(--border) / 0.4) 1px, transparent 1px)`
          : undefined,
        backgroundSize: showGrid ? `${20 * zoom}px ${20 * zoom}px` : undefined,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
        cursor: dragInfo ? 'grabbing' : 'default',
      }}
    >
      {/* Pan/zoom controls */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1 rounded-md border bg-background/95 p-1 shadow-sm backdrop-blur">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(2.5, z * 1.2));
          }}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
          title="Zoom in (Ctrl+wheel)"
        >
          <LucideIcons.Plus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(0.3, z / 1.2));
          }}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-muted"
          title="Zoom out (Ctrl+wheel)"
        >
          <LucideIcons.Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="flex h-7 w-7 items-center justify-center rounded text-[10px] hover:bg-muted"
          title="Reset view"
        >
          1:1
        </button>
        <div className="border-t pt-1 text-center text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</div>
      </div>

      {/* Hint banner */}
      {pendingEdgeFrom && (
        <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary shadow-sm backdrop-blur">
          Klik node tujuan untuk membuat edge dari <strong>{template.nodes.find((n) => n.id === pendingEdgeFrom)?.name}</strong>, atau klik node asal untuk batal.
        </div>
      )}

      <div
        className="absolute left-0 top-0"
        style={{
          width: bounds.w,
          height: bounds.h,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* SVG edges layer */}
        <svg
          className="absolute left-0 top-0 pointer-events-none"
          width={bounds.w}
          height={bounds.h}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 Z" fill="hsl(var(--muted-foreground))" />
            </marker>
            <marker id="arrow-loop" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 Z" fill="#dc2626" />
            </marker>
            <marker id="arrow-selected" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 Z" fill="hsl(var(--primary))" />
            </marker>
          </defs>
          {template.edges.map((edge) => {
            const from = template.nodes.find((n) => n.id === edge.fromNodeId);
            const to = template.nodes.find((n) => n.id === edge.toNodeId);
            if (!from || !to) return null;
            const x1 = from.position.x + NODE_W;
            const y1 = from.position.y + NODE_H / 2;
            const x2 = to.position.x;
            const y2 = to.position.y + NODE_H / 2;
            const dx = Math.abs(x2 - x1);
            const cx1 = x1 + Math.max(50, dx / 2);
            const cx2 = x2 - Math.max(50, dx / 2);
            const isLoop = edge.edgeType === 'LOOP_BACK';
            const isParallel = edge.edgeType === 'PARALLEL';
            const isSelected = selection.type === 'edge' && selection.id === edge.id;
            const stroke = isSelected
              ? 'hsl(var(--primary))'
              : isLoop
              ? '#dc2626'
              : isParallel
              ? '#0ea5e9'
              : 'hsl(var(--muted-foreground))';
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            return (
              <g key={edge.id} className="pointer-events-auto cursor-pointer" onClick={(e) => {
                e.stopPropagation();
                setSelection({ type: 'edge', id: edge.id });
              }}>
                <path
                  d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  strokeDasharray={isLoop ? '6 4' : isParallel ? '4 4' : undefined}
                  markerEnd={`url(#${isLoop ? 'arrow-loop' : isSelected ? 'arrow-selected' : 'arrow'})`}
                  opacity={isSelected ? 1 : 0.7}
                />
                {/* invisible thicker hit area */}
                <path
                  d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={16}
                />
                {edge.condition?.label && (
                  <g>
                    <rect
                      x={midX - Math.min(120, edge.condition.label.length * 4 + 12) / 2}
                      y={midY - 10}
                      width={Math.min(120, edge.condition.label.length * 4 + 12)}
                      height={20}
                      rx={4}
                      fill="hsl(var(--popover))"
                      stroke={stroke}
                      strokeWidth={1}
                      opacity={0.95}
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      textAnchor="middle"
                      fontSize={10}
                      fill={stroke}
                      className="font-mono"
                    >
                      {edge.condition.label.length > 22 ? edge.condition.label.slice(0, 20) + '…' : edge.condition.label}
                    </text>
                  </g>
                )}
                {edge.actions.length > 0 && (
                  <g>
                    <circle cx={midX} cy={midY - 18} r={8} fill="#f59e0b" />
                    <text x={midX} y={midY - 15} textAnchor="middle" fontSize={9} fill="white" className="font-bold">
                      {edge.actions.length}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes layer */}
        {template.nodes.map((node) => {
          const bu = BUSINESS_UNITS.find((b) => b.id === node.businessUnitId);
          const isSelected = selection.type === 'node' && selection.id === node.id;
          const isPending = pendingEdgeFrom === node.id;
          return (
            <div
              key={node.id}
              className={cn(
                'group absolute select-none rounded-lg border-2 bg-card shadow-sm transition-shadow',
                isSelected ? 'border-primary shadow-md' : 'border-border hover:border-primary/40',
                isPending && 'ring-2 ring-primary ring-offset-2'
              )}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: NODE_W,
                minHeight: NODE_H,
                cursor: dragInfo?.nodeId === node.id ? 'grabbing' : 'grab',
              }}
              onMouseDown={(e) => onMouseDownNode(e, node)}
              onClick={(e) => {
                e.stopPropagation();
                setSelection({ type: 'node', id: node.id });
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between rounded-t-md px-2 py-1.5"
                style={{ background: `${bu?.color ?? '#64748b'}1a`, borderBottom: `2px solid ${bu?.color ?? '#64748b'}` }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
                    style={{ background: bu?.color ?? '#64748b' }}
                  >
                    {bu?.shortCode ?? '?'}
                  </span>
                  <span className="truncate text-xs font-semibold">{node.name}</span>
                </div>
                <div className="flex flex-shrink-0 items-center gap-0.5">
                  {node.isStart && (
                    <span className="rounded bg-green-500 px-1 text-[8px] font-bold text-white">START</span>
                  )}
                  {node.isEnd && (
                    <span className="rounded bg-blue-500 px-1 text-[8px] font-bold text-white">END</span>
                  )}
                </div>
              </div>

              {/* Components preview */}
              <div className="flex flex-wrap gap-1 p-2">
                {node.components.length === 0 ? (
                  <span className="text-[10px] italic text-muted-foreground">No components</span>
                ) : (
                  node.components.slice(0, 6).map((c) => {
                    const meta = NODE_COMPONENT_KINDS.find((k) => k.kind === c.kind);
                    const Icon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[meta?.icon ?? 'Box'];
                    return (
                      <span
                        key={c.id}
                        className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium"
                        style={{ background: `${meta?.color ?? '#64748b'}1a`, color: meta?.color ?? '#64748b' }}
                        title={meta?.label}
                      >
                        {Icon && <Icon className="h-2.5 w-2.5" />}
                        {meta?.label}
                      </span>
                    );
                  })
                )}
                {node.components.length > 6 && (
                  <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                    +{node.components.length - 6}
                  </span>
                )}
              </div>

              {/* nodeKey */}
              <div className="border-t px-2 py-1 font-mono text-[9px] text-muted-foreground">{node.nodeKey}</div>

              {/* Connection handles */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConnectClick(node.id);
                }}
                className={cn(
                  'absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 bg-background transition-colors',
                  isPending ? 'border-primary bg-primary' : 'border-muted-foreground/50 hover:border-primary'
                )}
                title="Click to start/end edge"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConnectClick(node.id);
                }}
                className={cn(
                  'absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 bg-background transition-colors',
                  isPending ? 'border-primary bg-primary' : 'border-muted-foreground/50 hover:border-primary'
                )}
                title="Click to start/end edge"
              />
            </div>
          );
        })}

        {/* Empty state overlay */}
        {template.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg border border-dashed bg-background/80 p-6 text-center backdrop-blur">
              <LucideIcons.Workflow className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Template kosong</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Klik dua kali salah satu node type di palette kiri untuk menambahkan node pertama.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom-left active template marker */}
      <div className="absolute bottom-3 left-3 rounded-md border bg-background/95 px-2 py-1 text-[10px] text-muted-foreground shadow-sm backdrop-blur">
        Template: <strong className="text-foreground">{template.name}</strong> · v{template.version} ·
        {template.isActive ? (
          <span className="ml-1 text-green-600">PUBLISHED</span>
        ) : (
          <span className="ml-1 text-amber-600">DRAFT</span>
        )}
        <span className="ml-2 text-muted-foreground/70">Active: {activeTemplateId ?? 'none'}</span>
      </div>
    </div>
  );
}
