'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  OrderType,
  WorkflowTemplate,
  WorkflowNodeDef,
  WorkflowEdgeDef,
  NodeComponent,
  ActionDef,
  ValidationResult,
  ValidationIssue,
  NodeComponentKind,
  ActionKind,
  TriggerType,
  EdgeType,
} from '../types';
import { REFERENCE_ORDER_TYPES, REFERENCE_TEMPLATE } from '../data/reference-workflow';
import { NODE_COMPONENT_KINDS, ACTION_KINDS } from '../data/registry';

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

// ============================================================
// Selection state
// ============================================================

export type Selection =
  | { type: 'node'; id: string }
  | { type: 'edge'; id: string }
  | { type: 'none' };

export type BuilderView = 'builder' | 'registry' | 'events' | 'help';

interface WorkflowState {
  // Catalog
  orderTypes: OrderType[];
  templates: WorkflowTemplate[];

  // Active editor state
  activeTemplateId: string | null;
  selection: Selection;
  view: BuilderView;

  // Pending edge creation
  pendingEdgeFrom: string | null;

  // History (simple undo/redo)
  past: WorkflowTemplate[];
  future: WorkflowTemplate[];

  // ============================================================
  // Actions
  // ============================================================

  setView: (v: BuilderView) => void;
  selectTemplate: (id: string) => void;
  setSelection: (s: Selection) => void;
  setPendingEdgeFrom: (id: string | null) => void;

  // Order types
  addOrderType: (code: string, name: string, description: string) => string;
  toggleOrderType: (id: string) => void;

  // Templates
  createTemplate: (orderTypeId: string, name: string, description: string) => string;
  cloneTemplate: (id: string) => string;
  publishTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;

  // Nodes
  addNode: (nodeKey: string, name: string, businessUnitId: string, position: { x: number; y: number }) => string;
  updateNode: (id: string, patch: Partial<WorkflowNodeDef>) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;

  // Node components
  addComponent: (nodeId: string, kind: NodeComponentKind) => void;
  updateComponent: (nodeId: string, componentId: string, patch: Partial<NodeComponent>) => void;
  removeComponent: (nodeId: string, componentId: string) => void;
  reorderComponent: (nodeId: string, componentId: string, direction: 'up' | 'down') => void;

  // Edges
  addEdge: (fromNodeId: string, toNodeId: string, edgeType: EdgeType, conditionLabel?: string) => string | null;
  updateEdge: (id: string, patch: Partial<WorkflowEdgeDef>) => void;
  removeEdge: (id: string) => void;

  // Actions
  addAction: (edgeId: string, kind: ActionKind, triggerType: TriggerType) => void;
  updateAction: (edgeId: string, actionId: string, patch: Partial<ActionDef>) => void;
  removeAction: (edgeId: string, actionId: string) => void;

  // Validation
  validate: () => ValidationResult;

  // History
  undo: () => void;
  redo: () => void;
  resetReference: () => void;
}

// ============================================================
// Validation logic
// From DYNAMIC_WORKFLOW_BLUEPRINT.md §15
// ============================================================

function validateTemplate(tpl: WorkflowTemplate): ValidationResult {
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(tpl.nodes.map((n) => n.id));

  // Structure: must have at least 1 start and 1 end
  const starts = tpl.nodes.filter((n) => n.isStart);
  const ends = tpl.nodes.filter((n) => n.isEnd);
  if (starts.length === 0) {
    issues.push({ level: 'error', category: 'structure', message: 'Tidak ada node start (isStart=true).' });
  }
  if (starts.length > 1) {
    issues.push({ level: 'error', category: 'structure', message: `Ditemukan ${starts.length} node start. Hanya boleh 1.` });
  }
  if (ends.length === 0) {
    issues.push({ level: 'warning', category: 'structure', message: 'Tidak ada node end (isEnd=true).' });
  }

  // Structure: orphan nodes (no incoming/outgoing edges) — except start/end
  const incoming = new Set(tpl.edges.map((e) => e.toNodeId));
  const outgoing = new Set(tpl.edges.map((e) => e.fromNodeId));
  tpl.nodes.forEach((n) => {
    if (!n.isStart && !incoming.has(n.id) && !n.isEnd) {
      issues.push({
        level: 'warning',
        category: 'structure',
        message: `Node "${n.name}" tidak punya edge masuk.`,
        nodeId: n.id,
      });
    }
    if (!n.isEnd && !outgoing.has(n.id) && !n.isStart) {
      issues.push({
        level: 'warning',
        category: 'structure',
        message: `Node "${n.name}" tidak punya edge keluar.`,
        nodeId: n.id,
      });
    }
  });

  // Structure: edges reference valid nodes
  tpl.edges.forEach((e) => {
    if (!nodeIds.has(e.fromNodeId)) {
      issues.push({
        level: 'error',
        category: 'structure',
        message: `Edge ${e.id} merujuk fromNodeId yang tidak ada: ${e.fromNodeId}`,
        edgeId: e.id,
      });
    }
    if (!nodeIds.has(e.toNodeId)) {
      issues.push({
        level: 'error',
        category: 'structure',
        message: `Edge ${e.id} merujuk toNodeId yang tidak ada: ${e.toNodeId}`,
        edgeId: e.id,
      });
    }
  });

  // Structure: loop-back must be on LOOP_BACK edge type
  tpl.edges.forEach((e) => {
    if (e.edgeType === 'LOOP_BACK' && !e.condition?.label?.toLowerCase().includes('retur')) {
      issues.push({
        level: 'info',
        category: 'structure',
        message: `Loop-back edge ${e.id} — pastikan ini disengaja (mis. retur).`,
        edgeId: e.id,
      });
    }
  });

  // Contract: every node should have at least 1 component (unless start/end terminal)
  tpl.nodes.forEach((n) => {
    if (n.components.length === 0 && !n.isStart && !n.isEnd) {
      issues.push({
        level: 'warning',
        category: 'contract',
        message: `Node "${n.name}" tidak punya komponen — tidak akan mengerjakan apa-apa.`,
        nodeId: n.id,
      });
    }
  });

  // Semantic: GATE_WAIT should have at least one GATE_OPEN somewhere
  const gateOpens = tpl.edges.flatMap((e) =>
    e.actions.filter((a) => a.kind === 'GATE_OPEN').map((a) => (a.config as { gate?: string }).gate)
  );
  const gateWaits = tpl.nodes.flatMap((n) =>
    n.components
      .filter((c) => c.kind === 'GATE')
      .map((c) => (c.config as { gateKey?: string }).gateKey)
  );
  gateWaits.forEach((gw) => {
    if (gw && !gateOpens.includes(gw)) {
      issues.push({
        level: 'warning',
        category: 'semantic',
        message: `Gate "${gw}" ditunggu tapi tidak ada GATE_OPEN yang membukanya di edge mana pun.`,
      });
    }
  });

  // Semantic: blocking actions should not deadlock (simple heuristic — same gate cannot be waited by node waiting on the same gate)
  // (skipped — too complex for inline)

  // Dry-run path simulation ( Marketing → ... → Delivered if it exists)
  const start = tpl.nodes.find((n) => n.isStart);
  const end = tpl.nodes.find((n) => n.isEnd);
  let dryRunPath: string[] | undefined;
  if (start && end) {
    const path = simulatePath(tpl, start.id, end.id);
    if (path) {
      dryRunPath = path;
    } else {
      issues.push({
        level: 'error',
        category: 'dry-run',
        message: 'Tidak ada jalur dari start ke end — workflow tidak akan pernah selesai.',
      });
    }
  }

  const errors = issues.filter((i) => i.level === 'error');
  return {
    passed: errors.length === 0,
    issues,
    dryRunPath,
  };
}

function simulatePath(tpl: WorkflowTemplate, startId: string, endId: string): string[] | null {
  // BFS over edges, ignoring LOOP_BACK (loop-back tidak boleh jadi jalur "happy path")
  const visited = new Set<string>();
  const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];
  while (queue.length > 0) {
    const { id, path } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    if (id === endId) return path;
    const nexts = tpl.edges
      .filter((e) => e.fromNodeId === id && e.edgeType !== 'LOOP_BACK')
      .map((e) => e.toNodeId);
    for (const n of nexts) {
      if (!visited.has(n)) queue.push({ id: n, path: [...path, n] });
    }
  }
  return null;
}

// ============================================================
// Store implementation
// ============================================================

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      orderTypes: REFERENCE_ORDER_TYPES,
      templates: [REFERENCE_TEMPLATE],
      activeTemplateId: REFERENCE_TEMPLATE.id,
      selection: { type: 'none' },
      view: 'builder',
      pendingEdgeFrom: null,
      past: [],
      future: [],

      setView: (v) => set({ view: v }),
      selectTemplate: (id) => set({ activeTemplateId: id, selection: { type: 'none' }, pendingEdgeFrom: null }),
      setSelection: (s) => set({ selection: s, pendingEdgeFrom: null }),
      setPendingEdgeFrom: (id) => set({ pendingEdgeFrom: id }),

      addOrderType: (code, name, description) => {
        const id = uid('ot');
        const ot: OrderType = {
          id,
          code: code.toUpperCase().replace(/\s+/g, '_'),
          name,
          description,
          isActive: true,
        };
        set((s) => ({ orderTypes: [...s.orderTypes, ot] }));
        return id;
      },

      toggleOrderType: (id) =>
        set((s) => ({
          orderTypes: s.orderTypes.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o)),
        })),

      createTemplate: (orderTypeId, name, description) => {
        const id = uid('wt');
        const tpl: WorkflowTemplate = {
          id,
          orderTypeId,
          version: 1,
          isActive: false,
          name,
          description,
          nodes: [],
          edges: [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        set((s) => ({ templates: [...s.templates, tpl], activeTemplateId: id }));
        return id;
      },

      cloneTemplate: (id) => {
        const src = get().templates.find((t) => t.id === id);
        if (!src) return id;
        const newId = uid('wt');
        const maxVersion = Math.max(
          ...get().templates.filter((t) => t.orderTypeId === src.orderTypeId).map((t) => t.version),
          0
        );
        const tpl: WorkflowTemplate = {
          ...structuredClone(src),
          id: newId,
          version: maxVersion + 1,
          isActive: false,
          name: `${src.name} (copy)`,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        };
        // Regenerate all internal ids to avoid collisions
        const idMap = new Map<string, string>();
        tpl.nodes.forEach((n) => {
          const newNid = uid('n');
          idMap.set(n.id, newNid);
          n.id = newNid;
          n.components.forEach((c) => (c.id = uid('c')));
        });
        tpl.edges.forEach((e) => {
          const newEid = uid('e');
          e.id = newEid;
          e.fromNodeId = idMap.get(e.fromNodeId) ?? e.fromNodeId;
          e.toNodeId = idMap.get(e.toNodeId) ?? e.toNodeId;
          e.actions.forEach((a) => (a.id = uid('a')));
        });
        set((s) => ({ templates: [...s.templates, tpl], activeTemplateId: newId }));
        return newId;
      },

      publishTemplate: (id) => {
        const result = validateTemplate(get().templates.find((t) => t.id === id)!);
        if (!result.passed) {
          return;
        }
        set((s) => {
          const tpl = s.templates.find((t) => t.id === id);
          if (!tpl) return s;
          const orderTypeId = tpl.orderTypeId;
          return {
            templates: s.templates.map((t) =>
              t.id === id
                ? { ...t, isActive: true, updatedAt: nowIso() }
                : t.orderTypeId === orderTypeId
                ? { ...t, isActive: false }
                : t
            ),
          };
        });
      },

      deleteTemplate: (id) =>
        set((s) => {
          const filtered = s.templates.filter((t) => t.id !== id);
          return {
            templates: filtered,
            activeTemplateId: s.activeTemplateId === id ? filtered[0]?.id ?? null : s.activeTemplateId,
            selection: { type: 'none' },
          };
        }),

      addNode: (nodeKey, name, businessUnitId, position) => {
        const id = uid('n');
        const node: WorkflowNodeDef = {
          id,
          nodeKey,
          name,
          businessUnitId,
          position,
          components: [],
        };
        set((s) => {
          const tpl = s.templates.find((t) => t.id === s.activeTemplateId);
          if (!tpl) return s;
          return updateActiveTemplate(s, (t) => ({ ...t, nodes: [...t.nodes, node], updatedAt: nowIso() }));
        });
        return id;
      },

      updateNode: (id, patch) =>
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            nodes: t.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
            updatedAt: nowIso(),
          }))
        ),

      removeNode: (id) =>
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            nodes: t.nodes.filter((n) => n.id !== id),
            edges: t.edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id),
            updatedAt: nowIso(),
          }))
        ),

      moveNode: (id, position) =>
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            nodes: t.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
            updatedAt: nowIso(),
          }))
        ),

      addComponent: (nodeId, kind) => {
        const meta = NODE_COMPONENT_KINDS.find((k) => k.kind === kind);
        if (!meta) return;
        const comp: NodeComponent = {
          id: uid('c'),
          kind,
          config: structuredClone(meta.defaultConfig),
          order: 0,
        };
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            nodes: t.nodes.map((n) => {
              if (n.id !== nodeId) return n;
              const order = n.components.length + 1;
              return { ...n, components: [...n.components, { ...comp, order }] };
            }),
            updatedAt: nowIso(),
          }))
        );
      },

      updateComponent: (nodeId, componentId, patch) =>
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            nodes: t.nodes.map((n) =>
              n.id !== nodeId
                ? n
                : {
                    ...n,
                    components: n.components.map((c) => (c.id === componentId ? { ...c, ...patch } : c)),
                  }
            ),
            updatedAt: nowIso(),
          }))
        ),

      removeComponent: (nodeId, componentId) =>
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            nodes: t.nodes.map((n) =>
              n.id !== nodeId
                ? n
                : {
                    ...n,
                    components: n.components
                      .filter((c) => c.id !== componentId)
                      .map((c, i) => ({ ...c, order: i + 1 })),
                  }
            ),
            updatedAt: nowIso(),
          }))
        ),

      reorderComponent: (nodeId, componentId, direction) =>
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            nodes: t.nodes.map((n) => {
              if (n.id !== nodeId) return n;
              const idx = n.components.findIndex((c) => c.id === componentId);
              if (idx === -1) return n;
              const newIdx = direction === 'up' ? idx - 1 : idx + 1;
              if (newIdx < 0 || newIdx >= n.components.length) return n;
              const arr = [...n.components];
              [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
              return { ...n, components: arr.map((c, i) => ({ ...c, order: i + 1 })) };
            }),
            updatedAt: nowIso(),
          }))
        ),

      addEdge: (fromNodeId, toNodeId, edgeType, conditionLabel) => {
        if (fromNodeId === toNodeId) return null;
        const s0 = get();
        const tpl = s0.templates.find((t) => t.id === s0.activeTemplateId);
        if (!tpl) return null;
        // prevent duplicates
        if (tpl.edges.some((e) => e.fromNodeId === fromNodeId && e.toNodeId === toNodeId)) {
          return null;
        }
        const id = uid('e');
        const edge: WorkflowEdgeDef = {
          id,
          fromNodeId,
          toNodeId,
          edgeType,
          condition: conditionLabel ? { label: conditionLabel, expression: `event == "${conditionLabel}"` } : undefined,
          actions: [],
        };
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            edges: [...t.edges, edge],
            updatedAt: nowIso(),
          }))
        );
        return id;
      },

      updateEdge: (id, patch) =>
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            edges: t.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
            updatedAt: nowIso(),
          }))
        ),

      removeEdge: (id) =>
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            edges: t.edges.filter((e) => e.id !== id),
            updatedAt: nowIso(),
          }))
        ),

      addAction: (edgeId, kind, triggerType) => {
        const meta = ACTION_KINDS.find((k) => k.kind === kind);
        if (!meta) return;
        const action: ActionDef = {
          id: uid('a'),
          kind,
          triggerType,
          config: {},
          blocking: meta.blockingDefault,
          onFailure: meta.blockingDefault ? 'BLOCK' : 'CONTINUE',
          order: 0,
        };
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            edges: t.edges.map((e) => {
              if (e.id !== edgeId) return e;
              const order = e.actions.length + 1;
              return { ...e, actions: [...e.actions, { ...action, order }] };
            }),
            updatedAt: nowIso(),
          }))
        );
      },

      updateAction: (edgeId, actionId, patch) =>
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            edges: t.edges.map((e) =>
              e.id !== edgeId
                ? e
                : {
                    ...e,
                    actions: e.actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a)),
                  }
            ),
            updatedAt: nowIso(),
          }))
        ),

      removeAction: (edgeId, actionId) =>
        set((s) =>
          updateActiveTemplate(s, (t) => ({
            ...t,
            edges: t.edges.map((e) =>
              e.id !== edgeId
                ? e
                : {
                    ...e,
                    actions: e.actions
                      .filter((a) => a.id !== actionId)
                      .map((a, i) => ({ ...a, order: i + 1 })),
                  }
            ),
            updatedAt: nowIso(),
          }))
        ),

      validate: () => {
        const tpl = get().templates.find((t) => t.id === get().activeTemplateId);
        if (!tpl) return { passed: false, issues: [] };
        return validateTemplate(tpl);
      },

      undo: () =>
        set((s) => {
          if (s.past.length === 0) return s;
          const previous = s.past[s.past.length - 1];
          const newPast = s.past.slice(0, -1);
          return {
            ...s,
            templates: s.templates.map((t) => (t.id === previous.id ? previous : t)),
            past: newPast,
            future: [s.templates.find((t) => t.id === previous.id)!, ...s.future].filter(Boolean) as WorkflowTemplate[],
          };
        }),

      redo: () =>
        set((s) => {
          if (s.future.length === 0) return s;
          const next = s.future[0];
          const newFuture = s.future.slice(1);
          return {
            ...s,
            templates: s.templates.map((t) => (t.id === next.id ? next : t)),
            past: [...s.past, s.templates.find((t) => t.id === next.id)!].filter(Boolean) as WorkflowTemplate[],
            future: newFuture,
          };
        }),

      resetReference: () =>
        set({
          orderTypes: REFERENCE_ORDER_TYPES,
          templates: [REFERENCE_TEMPLATE],
          activeTemplateId: REFERENCE_TEMPLATE.id,
          selection: { type: 'none' },
          pendingEdgeFrom: null,
          past: [],
          future: [],
        }),
    }),
    {
      name: 'manuos-workflow-builder-v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : (undefined as unknown as Storage))),
      partialize: (s) => ({
        orderTypes: s.orderTypes,
        templates: s.templates,
        activeTemplateId: s.activeTemplateId,
      }),
    }
  )
);

// ============================================================
// Helper: update active template with simple history push
// ============================================================

function updateActiveTemplate(
  s: WorkflowState,
  fn: (t: WorkflowTemplate) => WorkflowTemplate
): Partial<WorkflowState> {
  const tpl = s.templates.find((t) => t.id === s.activeTemplateId);
  if (!tpl) return {};
  const newTpl = fn(tpl);
  return {
    templates: s.templates.map((t) => (t.id === newTpl.id ? newTpl : t)),
    past: [...s.past.slice(-49), tpl],
    future: [],
  };
}
