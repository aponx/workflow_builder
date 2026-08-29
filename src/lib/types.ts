// ============================================================
// ManuOS Dynamic Workflow Builder — Core Type Definitions
// Based on DYNAMIC_WORKFLOW_BLUEPRINT.md & COMPONENT_REGISTRY.md
// ============================================================

export type EdgeType = 'SEQUENTIAL' | 'PARALLEL' | 'LOOP_BACK' | 'EXCEPTION';
export type TriggerType = 'EDGE' | 'NODE_STATE' | 'EVENT' | 'SCHEDULE';

export type NodeComponentKind =
  | 'FORM'
  | 'DOCUMENT'
  | 'APPROVAL'
  | 'ROUTING'
  | 'CALC'
  | 'FANOUT'
  | 'QC_PATTERN'
  | 'TIMER'
  | 'EVIDENCE'
  | 'INVENTORY_POLICY'
  | 'SCHEDULING'
  | 'GATE'
  | 'ESCALATION';

export type ActionKind =
  | 'ODOO_RPC'
  | 'HTTP_REQUEST'
  | 'STOCK_CHECK'
  | 'LEDGER_POST'
  | 'STOCK_RESERVE'
  | 'PR_CREATE'
  | 'PO_CREATE'
  | 'DOC_GENERATE'
  | 'NUMBER_ALLOCATE'
  | 'ARTIFACT_CREATE'
  | 'MACHINE_ASSIGN'
  | 'APPROVAL_START'
  | 'NOTIFY'
  | 'CALC_APPLY'
  | 'FIELD_SET'
  | 'GATE_OPEN'
  | 'GATE_WAIT'
  | 'TRACKING_UPDATE'
  | 'AUDIT_LOG';

export type NodeRunStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'WAITING'
  | 'ON_HOLD'
  | 'DONE'
  | 'SKIPPED';

export type ActionRunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCESS'
  | 'RETRYING'
  | 'DEAD';

// ============================================================
// Definitions (editable)
// ============================================================

export interface NodeComponent {
  id: string;
  kind: NodeComponentKind;
  config: Record<string, unknown>;
  order: number;
}

export interface ActionDef {
  id: string;
  kind: ActionKind;
  triggerType: TriggerType;
  config: Record<string, unknown>;
  blocking: boolean;
  retry?: {
    max: number;
    backoff: 'exponential' | 'linear' | 'fixed';
    timeoutMs: number;
  };
  onFailure: 'BLOCK' | 'CONTINUE';
  order: number;
}

export interface WorkflowNodeDef {
  id: string;
  nodeKey: string;
  name: string;
  businessUnitId: string;
  components: NodeComponent[];
  position: { x: number; y: number };
  isStart?: boolean;
  isEnd?: boolean;
}

export interface WorkflowEdgeDef {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: EdgeType;
  condition?: {
    label: string;
    expression: string;
  };
  actions: ActionDef[];
}

export interface WorkflowTemplate {
  id: string;
  orderTypeId: string;
  version: number;
  isActive: boolean;
  name: string;
  description: string;
  nodes: WorkflowNodeDef[];
  edges: WorkflowEdgeDef[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderType {
  id: string;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
}

// ============================================================
// Registry metadata
// ============================================================

export type GlobalComponentStatus = 'ready' | 'partial' | 'missing';

export interface GlobalComponent {
  id: string; // "G-01"
  name: string;
  group: string;
  fixedBehavior: string;
  parameterized: string;
  examples: string[];
  status: GlobalComponentStatus;
}

export interface DynamicElement {
  id: string; // "D-01"
  name: string;
  userControls: string;
  dependsOn: string;
  example: string;
}

export interface NodeComponentKindMeta {
  kind: NodeComponentKind;
  label: string;
  description: string;
  example: string;
  icon: string;
  color: string;
  defaultConfig: Record<string, unknown>;
}

export interface ActionKindMeta {
  kind: ActionKind;
  label: string;
  description: string;
  blockingDefault: boolean;
  example: string;
  icon: string;
}

export interface BusinessUnit {
  id: string;
  name: string;
  shortCode: string;
  description: string;
  color: string;
}

// ============================================================
// Validation
// ============================================================

export interface ValidationIssue {
  level: 'error' | 'warning' | 'info';
  category: 'structure' | 'contract' | 'semantic' | 'dry-run';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  dryRunPath?: string[];
}
