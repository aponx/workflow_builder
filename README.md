# ManuOS — Dynamic Workflow Builder

Visual builder untuk **config-driven DAG workflow engine** berdasarkan dua dokumen:
- `DYNAMIC_WORKFLOW_BLUEPRINT.md` — arsitektur, metamodel, DAG reference, state machine, action catalog
- `DYNAMIC_WORKFLOW_COMPONENT_REGISTRY.md` — 20 global components (G-01..G-20), 13 dynamic elements (D-01..D-13), matriks pemakaian per node

## Teknologi

- **Next.js 16** (App Router, Turbopack)
- **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (New York)
- **Zustand** + persist middleware (state workflow disimpan otomatis di localStorage)
- **Lucide React** untuk ikon
- **react-resizable-panels** untuk layout yang resizable

## Fitur utama

### 1. Visual DAG Canvas
- Klik-drag node untuk reposisi
- Klik handle (lingkaran kiri/kanan node) untuk membuat edge antar node
- Ctrl+scroll untuk zoom, button 1:1 untuk reset view
- 4 tipe edge: SEQUENTIAL, PARALLEL, LOOP_BACK, EXCEPTION (warna berbeda)

### 2. Order Types & Templates
- Multi order type (Regular, Final Part, Subcon, custom)
- Multi-version template per order type (publish → version lock untuk run berjalan)
- Clone template, reset ke reference workflow

### 3. Node Component Palette (13 kinds)
Dari blueprint §9: FORM, DOCUMENT, APPROVAL, ROUTING, CALC, FANOUT, QC_PATTERN, TIMER, EVIDENCE, INVENTORY_POLICY, SCHEDULING, GATE, ESCALATION.

### 4. Action Catalog (19 kinds)
Dari blueprint §10.2: ODOO_RPC, HTTP_REQUEST, STOCK_CHECK, LEDGER_POST, STOCK_RESERVE, PR_CREATE, PO_CREATE, DOC_GENERATE, NUMBER_ALLOCATE, ARTIFACT_CREATE, MACHINE_ASSIGN, APPROVAL_START, NOTIFY, CALC_APPLY, FIELD_SET, GATE_OPEN, GATE_WAIT, TRACKING_UPDATE, AUDIT_LOG.

### 5. Inspector Panel (kind-aware editors)
- Editor khusus untuk tiap node component kind (APPROVAL stages, ROUTING mapping, QC_PATTERN items, SCHEDULING capacity, dst.)
- Editor JSON untuk action config
- Switch blocking/non-blocking, retry config, onFailure policy

### 6. Validation & Publish
- **Structure**: orphan nodes, duplikat start/end, edge reference valid
- **Contract**: komponen minimal per node
- **Semantic**: gate wait harus punya gate open
- **Dry-run**: BFS dari start → end (loop-back diabaikan)
- Publish mengaktifkan template → order baru pakai versi baru

### 7. Component Registry Browser
Browse detail 20 global components (G-01..G-20) dan 13 dynamic elements (D-01..D-13) — termasuk fixed behavior, parameterized, contoh interview, dan status implementasi.

### 8. Event Catalog
8 domain event (Order, Engineering, PPIC, Approval, Material, Shopfloor, Shipment, Retur) — klik untuk copy ke clipboard.

## Cara menjalankan

```bash
# install dependencies
bun install

# jalankan dev server (port 3000)
bun run dev

# build production
bun run build

# push prisma schema (opsional, untuk database)
bun run db:push
```

Buka http://localhost:3000 di browser.

## Struktur file

```
src/
├── app/
│   ├── layout.tsx              # Root layout + metadata
│   ├── page.tsx                # Main page (toolbar + 4-panel resizable + overlays)
│   └── globals.css             # Tailwind theme
├── components/
│   ├── builder/
│   │   ├── workflow-canvas.tsx       # SVG DAG canvas + drag + zoom
│   │   ├── node-palette.tsx          # 10 divisi + custom node
│   │   ├── inspector-panel.tsx       # Node & edge config editors
│   │   ├── order-type-sidebar.tsx    # Order types & templates list
│   │   ├── toolbar.tsx               # Top bar + validate + publish
│   │   ├── registry-browser.tsx      # G/D browser modal
│   │   ├── events-catalog.tsx        # Event domain catalog modal
│   │   └── help-overlay.tsx          # Onboarding help modal
│   └── ui/                     # shadcn/ui components
└── lib/
    ├── types.ts                # Domain types (WorkflowTemplate, Node, Edge, Action, etc.)
    ├── store/
    │   └── workflow-store.ts   # Zustand store + validation logic
    └── data/
        ├── registry.ts         # G-01..G-20, D-01..D-13, business units, kind catalogs, events
        └── reference-workflow.ts  # Reference DAG (10 divisi, 12 edge, loop-back retur)
```

## Reference workflow

Saat pertama dibuka, aplikasi sudah pre-loaded dengan reference workflow end-to-end:
**Marketing → Eng Design → Eng Process → PPIC → (Warehouse Material ‖ Purchasing) → (Production ‖ Assembly) → Packing & Shipment → Delivered**

dengan loop-back **Delivered → Eng Design** untuk retur / urgent revision ticket.

## Sumber data

Semua data komponen, action, event, dan reference workflow diambil langsung dari dua dokumen sumber. Tidak ada data sintetis yang dibuat-buat — semua contoh interview (PPIC approval 4 tahap, kapasitas mesin 22 jam/hari, jobsheet × 2 QC pair, subcon SC-, dll.) dijelaskan persis seperti di dokumen.

## Lisensi

Internal ManuOS.
