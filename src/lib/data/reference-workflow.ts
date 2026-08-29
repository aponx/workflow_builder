import type { WorkflowTemplate, OrderType } from '../types';

// ============================================================
// Reference Order Types
// ============================================================

export const REFERENCE_ORDER_TYPES: OrderType[] = [
  {
    id: 'ot-regular',
    code: 'REGULAR',
    name: 'Regular Order',
    description:
      'Tipe order standar manufaktur — alur lengkap Marketing → Delivered dengan percabangan assy/machining/standard.',
    isActive: true,
  },
  {
    id: 'ot-final-part',
    code: 'FINAL_PART',
    name: 'Final Part Order',
    description:
      'Tipe order final part — sama dengan regular namun dengan klasifikasi part dan routing yang lebih ketat.',
    isActive: true,
  },
  {
    id: 'ot-subcon',
    code: 'SUBCON',
    name: 'Subcon Order',
    description: 'Tipe order subcon — PO prefix SC-, dua jenis Preprocess (dari Marketing) dan Process (dari PPIC).',
    isActive: false,
  },
];

// ============================================================
// Reference Workflow — Marketing → Delivered (10 divisi)
// Based on DYNAMIC_WORKFLOW_BLUEPRINT.md §6 DAG
// ============================================================

export const REFERENCE_TEMPLATE: WorkflowTemplate = {
  id: 'wt-reference-v1',
  orderTypeId: 'ot-regular',
  version: 1,
  isActive: true,
  name: 'Reference Workflow — Manufaktur End-to-End',
  description:
    'DAG default hasil interview 10 divisi: Marketing → Eng Design → Eng Process → PPIC → Warehouse & Purchasing → Production & Assembly → Packing → Delivered. Memuat loop-back retur ke Eng Design.',
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-15').toISOString(),
  nodes: [
    {
      id: 'n-marketing',
      nodeKey: 'marketing',
      name: 'Marketing',
      businessUnitId: 'bu-marketing',
      position: { x: 80, y: 280 },
      isStart: true,
      components: [
        {
          id: 'c-mkt-form',
          kind: 'FORM',
          order: 1,
          config: {
            schemaRef: 'frm-incoming-order',
            fields: ['customer', 'produk', 'qty', 'orderType', 'requiredDate'],
          },
        },
        {
          id: 'c-mkt-doc',
          kind: 'DOCUMENT',
          order: 2,
          config: { templateRef: 'doc-drawing-request', outputType: 'PDF' },
        },
      ],
    },
    {
      id: 'n-eng-design',
      nodeKey: 'eng-design',
      name: 'Engineering Design',
      businessUnitId: 'bu-eng-design',
      position: { x: 360, y: 280 },
      components: [
        {
          id: 'c-ed-fanout',
          kind: 'FANOUT',
          order: 1,
          config: { rule: 'FINAL_PART_LIST', artifact: 'PART' },
        },
        {
          id: 'c-ed-routing',
          kind: 'ROUTING',
          order: 2,
          config: {
            mapping: { machining: 'eng-process', assy: 'eng-process', standard: 'purchasing' },
          },
        },
        {
          id: 'c-ed-doc',
          kind: 'DOCUMENT',
          order: 3,
          config: { templateRef: 'doc-drawing-2d', outputType: 'PDF', versioned: true },
        },
      ],
    },
    {
      id: 'n-eng-process',
      nodeKey: 'eng-process',
      name: 'Engineering Process',
      businessUnitId: 'bu-eng-process',
      position: { x: 640, y: 280 },
      components: [
        {
          id: 'c-ep-form',
          kind: 'FORM',
          order: 1,
          config: { schemaRef: 'frm-set-operation', fields: ['sequence', 'machineType', 'duration', 'operationType'] },
        },
        {
          id: 'c-ep-calc',
          kind: 'CALC',
          order: 2,
          config: { expression: 'margin(20x150x5) = 25x175x8', outputField: 'material.margin' },
        },
        {
          id: 'c-ep-routing',
          kind: 'ROUTING',
          order: 3,
          config: { mapping: { machining: 'ppic', assy: 'ppic' } },
        },
      ],
    },
    {
      id: 'n-ppic',
      nodeKey: 'ppic',
      name: 'PPIC',
      businessUnitId: 'bu-ppic',
      position: { x: 920, y: 280 },
      components: [
        {
          id: 'c-pp-fanout-mo',
          kind: 'FANOUT',
          order: 1,
          config: { rule: 'ONE_PER_ORDER', artifact: 'MANUFACTURING_ORDER' },
        },
        {
          id: 'c-pp-fanout-js',
          kind: 'FANOUT',
          order: 2,
          config: { rule: 'PER_OPERATION_X2_QC_PAIR', artifact: 'JOBSHEET', pairType: 'PRODUCTION_QC' },
        },
        {
          id: 'c-pp-routing',
          kind: 'ROUTING',
          order: 3,
          config: { mapping: { machining: 'production', assy: 'assembly' } },
        },
        {
          id: 'c-pp-sched',
          kind: 'SCHEDULING',
          order: 4,
          config: {
            machineCapacityHoursPerDay: 22,
            reassignRequiresApproval: true,
            reassignReasonRequired: true,
          },
        },
        {
          id: 'c-pp-approval',
          kind: 'APPROVAL',
          order: 5,
          config: {
            mode: 'sequential',
            stages: [
              { name: 'PREPARED', role: 'PPIC' },
              { name: 'CHECKED', role: 'PPIC_LEAD' },
              { name: 'APPROVED', role: 'PRODUCTION_MANAGER' },
              { name: 'FINAL JUDGE', role: 'PLANT_MANAGER' },
            ],
            workMayStartAtStage: 'PREPARED',
            onReject: 'RETURN_TO_STAGE',
          },
        },
      ],
    },
    {
      id: 'n-warehouse-material',
      nodeKey: 'warehouse-material',
      name: 'Warehouse Material',
      businessUnitId: 'bu-warehouse-material',
      position: { x: 1200, y: 460 },
      components: [
        {
          id: 'c-wm-inv',
          kind: 'INVENTORY_POLICY',
          order: 1,
          config: {
            stockPolicy: { STANDARD_PART: 'STOCKED', RAW_MATERIAL: 'NOT_STOCKED' },
            partialIncoming: true,
            onShortage: 'PR_CREATE',
          },
        },
        {
          id: 'c-wm-form',
          kind: 'FORM',
          order: 2,
          config: { schemaRef: 'frm-receiving', fields: ['items', 'qtyReceived', 'defects'] },
        },
        {
          id: 'c-wm-qc',
          kind: 'QC_PATTERN',
          order: 3,
          config: {
            pattern: 'MULTI_PARTY_SIGN',
            signers: ['PPIC', 'WAREHOUSE', 'PURCHASING', 'QC'],
            mode: 'parallel',
            maxRounds: 1,
          },
        },
        {
          id: 'c-wm-gate',
          kind: 'GATE',
          order: 4,
          config: {
            gateKey: 'MATERIAL_READY',
            opensOn: ['MATERIAL_RECEIVED'],
            mode: 'PARTIAL_OK',
            unblocks: ['production', 'assembly'],
          },
        },
      ],
    },
    {
      id: 'n-purchasing',
      nodeKey: 'purchasing',
      name: 'Purchasing',
      businessUnitId: 'bu-purchasing',
      position: { x: 1200, y: 100 },
      components: [
        {
          id: 'c-pu-doc',
          kind: 'DOCUMENT',
          order: 1,
          config: { templateRef: 'doc-po', outputType: 'PDF' },
        },
        {
          id: 'c-pu-calc',
          kind: 'CALC',
          order: 2,
          config: { expression: 'qty + MoQ', outputField: 'po.qty' },
        },
        {
          id: 'c-pu-routing',
          kind: 'ROUTING',
          order: 3,
          config: { mapping: { preprocess: 'purchasing', process: 'purchasing' } },
        },
      ],
    },
    {
      id: 'n-production',
      nodeKey: 'production',
      name: 'Production',
      businessUnitId: 'bu-production',
      position: { x: 1500, y: 460 },
      components: [
        {
          id: 'c-pr-timer',
          kind: 'TIMER',
          order: 1,
          config: { mode: 'PER_TASK', attributionSplit: false, autoPauseOnBreakdown: true },
        },
        {
          id: 'c-pr-qc',
          kind: 'QC_PATTERN',
          order: 2,
          config: {
            pattern: 'PER_OP_CHECKLIST',
            items: ['dimensi', 'surface', 'toleransi'],
            passCriteria: 'ALL_ITEMS_PASS',
            maxRounds: 3,
            includesSubconResult: true,
          },
        },
        {
          id: 'c-pr-esc',
          kind: 'ESCALATION',
          order: 3,
          config: {
            triggers: ['MACHINE_DOWN'],
            actions: ['PAUSE', 'SUBCON_REDIRECT'],
          },
        },
      ],
    },
    {
      id: 'n-assembly',
      nodeKey: 'assembly',
      name: 'Assembly',
      businessUnitId: 'bu-assembly',
      position: { x: 1500, y: 100 },
      components: [
        {
          id: 'c-as-qc',
          kind: 'QC_PATTERN',
          order: 1,
          config: {
            pattern: 'PING_PONG',
            operatorRole: 'OPERATOR',
            inspectorRole: 'QC',
            maxRounds: 5,
            passCriteria: 'INSPECTOR_DONE',
          },
        },
        {
          id: 'c-as-timer',
          kind: 'TIMER',
          order: 2,
          config: { mode: 'PER_NODE', attributionSplit: true, trackOperatorVsQc: true },
        },
      ],
    },
    {
      id: 'n-packing',
      nodeKey: 'packing-shipment',
      name: 'Packing & Shipment',
      businessUnitId: 'bu-packing-shipment',
      position: { x: 1800, y: 280 },
      components: [
        {
          id: 'c-pk-gate',
          kind: 'GATE',
          order: 1,
          config: {
            gateKey: 'SHIPMENT_APPROVED',
            opensOn: ['SHIPMENT_APPROVED'],
            mode: 'ALL_REQUIRED',
          },
        },
        {
          id: 'c-pk-approval',
          kind: 'APPROVAL',
          order: 2,
          config: {
            mode: 'sequential',
            stages: [{ name: 'RELEASE', role: 'MARKETING' }],
            workMayStartAtStage: 'RELEASE',
          },
        },
        {
          id: 'c-pk-evidence',
          kind: 'EVIDENCE',
          order: 3,
          config: { requiredTypes: ['surat_jalan', 'foto', 'resi'], minCount: 1 },
        },
      ],
    },
    {
      id: 'n-delivered',
      nodeKey: 'delivered',
      name: 'Delivered',
      businessUnitId: 'bu-delivered',
      position: { x: 2080, y: 280 },
      isEnd: true,
      components: [
        {
          id: 'c-dl-esc',
          kind: 'ESCALATION',
          order: 1,
          config: {
            triggers: ['RETURN_FILED'],
            actions: ['URGENT_REVISION_TICKET', 'LOOP_BACK_TO_ENG_DESIGN'],
          },
        },
      ],
    },
  ],
  edges: [
    {
      id: 'e-mkt-ed',
      fromNodeId: 'n-marketing',
      toNodeId: 'n-eng-design',
      edgeType: 'SEQUENTIAL',
      condition: { label: 'ORDER_RELEASED', expression: 'event == "ORDER_RELEASED"' },
      actions: [
        {
          id: 'a-mkt-ed-1',
          kind: 'ODOO_RPC',
          triggerType: 'EDGE',
          order: 1,
          blocking: false,
          onFailure: 'CONTINUE',
          config: { model: 'sale.order', op: 'upsert', fieldMapping: 'odoo.so' },
          retry: { max: 5, backoff: 'exponential', timeoutMs: 30000 },
        },
        {
          id: 'a-mkt-ed-2',
          kind: 'DOC_GENERATE',
          triggerType: 'EDGE',
          order: 2,
          blocking: true,
          onFailure: 'BLOCK',
          config: { template: 'drawing-request' },
        },
        {
          id: 'a-mkt-ed-3',
          kind: 'TRACKING_UPDATE',
          triggerType: 'EDGE',
          order: 3,
          blocking: false,
          onFailure: 'CONTINUE',
          config: { progressLabel: 'Masuk Engineering Design' },
        },
      ],
    },
    {
      id: 'e-ed-ep',
      fromNodeId: 'n-eng-design',
      toNodeId: 'n-eng-process',
      edgeType: 'SEQUENTIAL',
      condition: { label: 'drawing released', expression: 'drawing.status == "RELEASED"' },
      actions: [],
    },
    {
      id: 'e-ep-pp',
      fromNodeId: 'n-eng-process',
      toNodeId: 'n-ppic',
      edgeType: 'SEQUENTIAL',
      condition: { label: 'operations defined', expression: 'operations.count >= 2' },
      actions: [
        {
          id: 'a-ep-pp-1',
          kind: 'NUMBER_ALLOCATE',
          triggerType: 'EDGE',
          order: 1,
          blocking: true,
          onFailure: 'BLOCK',
          config: { pattern: 'MO-{####}', prefix: 'MO-' },
        },
      ],
    },
    {
      id: 'e-pp-wm',
      fromNodeId: 'n-ppic',
      toNodeId: 'n-warehouse-material',
      edgeType: 'SEQUENTIAL',
      condition: { label: 'jobsheet approved', expression: 'approval.status == "FINAL_JUDGE"' },
      actions: [
        {
          id: 'a-pp-wm-1',
          kind: 'STOCK_CHECK',
          triggerType: 'EDGE',
          order: 1,
          blocking: true,
          onFailure: 'BLOCK',
          config: { itemsFrom: 'material.requirements', stockPolicy: { STANDARD_PART: 'STOCKED', RAW_MATERIAL: 'NOT_STOCKED' } },
        },
        {
          id: 'a-pp-wm-2',
          kind: 'LEDGER_POST',
          triggerType: 'EDGE',
          order: 2,
          blocking: true,
          onFailure: 'BLOCK',
          config: { type: 'RESERVATION', itemsFrom: 'stockCheck.available' },
        },
      ],
    },
    {
      id: 'e-pp-pu',
      fromNodeId: 'n-ppic',
      toNodeId: 'n-purchasing',
      edgeType: 'PARALLEL',
      condition: { label: 'STOCK_SHORTAGE', expression: 'stockCheck.shortfall > 0' },
      actions: [
        {
          id: 'a-pp-pu-1',
          kind: 'PR_CREATE',
          triggerType: 'EDGE',
          order: 1,
          blocking: true,
          onFailure: 'BLOCK',
          config: { target: 'odoo-procurement', itemsFrom: 'stockCheck.shortfall' },
        },
        {
          id: 'a-pp-pu-2',
          kind: 'NOTIFY',
          triggerType: 'EDGE',
          order: 2,
          blocking: false,
          onFailure: 'CONTINUE',
          config: { to: ['ROLE_PURCHASING'], template: 'PR_CREATED' },
        },
      ],
    },
    {
      id: 'e-pu-wm',
      fromNodeId: 'n-purchasing',
      toNodeId: 'n-warehouse-material',
      edgeType: 'LOOP_BACK',
      condition: { label: 'material datang', expression: 'po.status == "RECEIVED"' },
      actions: [
        {
          id: 'a-pu-wm-1',
          kind: 'LEDGER_POST',
          triggerType: 'EDGE',
          order: 1,
          blocking: true,
          onFailure: 'BLOCK',
          config: { type: 'IN', partial: true, itemsFrom: 'receipt.items' },
        },
      ],
    },
    {
      id: 'e-wm-pr',
      fromNodeId: 'n-warehouse-material',
      toNodeId: 'n-production',
      edgeType: 'SEQUENTIAL',
      condition: { label: 'machining route', expression: 'routing == "machining" AND gate.MATERIAL_READY == open' },
      actions: [
        {
          id: 'a-wm-pr-1',
          kind: 'GATE_OPEN',
          triggerType: 'EDGE',
          order: 1,
          blocking: true,
          onFailure: 'BLOCK',
          config: { gate: 'MATERIAL_READY' },
        },
        {
          id: 'a-wm-pr-2',
          kind: 'FIELD_SET',
          triggerType: 'EDGE',
          order: 2,
          blocking: true,
          onFailure: 'BLOCK',
          config: { path: 'jobsheet.readyToMachining', value: true },
        },
      ],
    },
    {
      id: 'e-wm-as',
      fromNodeId: 'n-warehouse-material',
      toNodeId: 'n-assembly',
      edgeType: 'PARALLEL',
      condition: { label: 'assy route', expression: 'routing == "assy" AND gate.MATERIAL_READY == open' },
      actions: [],
    },
    {
      id: 'e-pr-pk',
      fromNodeId: 'n-production',
      toNodeId: 'n-packing',
      edgeType: 'SEQUENTIAL',
      condition: { label: 'QC pass', expression: 'qc.status == "PASSED"' },
      actions: [
        {
          id: 'a-pr-pk-1',
          kind: 'NOTIFY',
          triggerType: 'EDGE',
          order: 1,
          blocking: false,
          onFailure: 'CONTINUE',
          config: { to: ['ROLE_PACKING'], template: 'PART_READY' },
        },
      ],
    },
    {
      id: 'e-as-pk',
      fromNodeId: 'n-assembly',
      toNodeId: 'n-packing',
      edgeType: 'SEQUENTIAL',
      condition: { label: 'assembly done', expression: 'assembly.qc.status == "DONE"' },
      actions: [],
    },
    {
      id: 'e-pk-dl',
      fromNodeId: 'n-packing',
      toNodeId: 'n-delivered',
      edgeType: 'SEQUENTIAL',
      condition: { label: 'proof uploaded', expression: 'evidence.uploaded == true' },
      actions: [
        {
          id: 'a-pk-dl-1',
          kind: 'TRACKING_UPDATE',
          triggerType: 'EDGE',
          order: 1,
          blocking: false,
          onFailure: 'CONTINUE',
          config: { progressLabel: 'Pesanan telah dikirim' },
        },
        {
          id: 'a-pk-dl-2',
          kind: 'ODOO_RPC',
          triggerType: 'EDGE',
          order: 2,
          blocking: false,
          onFailure: 'CONTINUE',
          config: { model: 'sale.order', op: 'update_status', status: 'delivered' },
        },
      ],
    },
    {
      id: 'e-dl-ed',
      fromNodeId: 'n-delivered',
      toNodeId: 'n-eng-design',
      edgeType: 'LOOP_BACK',
      condition: { label: 'retur salah gambar', expression: 'return.cause == "WRONG_DRAWING"' },
      actions: [
        {
          id: 'a-dl-ed-1',
          kind: 'NOTIFY',
          triggerType: 'EDGE',
          order: 1,
          blocking: false,
          onFailure: 'CONTINUE',
          config: { to: ['ROLE_ENG_DESIGN'], template: 'URGENT_REVISION', priority: 'URGENT' },
        },
      ],
    },
  ],
};
