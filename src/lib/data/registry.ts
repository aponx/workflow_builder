import type {
  GlobalComponent,
  DynamicElement,
  BusinessUnit,
  NodeComponentKindMeta,
  ActionKindMeta,
} from '../types';

// ============================================================
// Global Components Registry (G-01 .. G-20)
// From DYNAMIC_WORKFLOW_COMPONENT_REGISTRY.md §3
// ============================================================

export const GLOBAL_COMPONENTS: GlobalComponent[] = [
  {
    id: 'G-01',
    name: 'Timing & Schedule',
    group: 'Waktu & Eksekusi',
    fixedBehavior:
      'Semantik field: plannedStart/End, actualStart/End, estimatedDuration, actualDuration, requiredDate; perhitungan durasi & progress; konsumsi oleh Gantt/Kanban/report.',
    parameterized:
      'Field yang diaktifkan; satuan (jam/hari/pcs-jam); basis estimasi; kalender kerja; sumber aktual dari G-10.',
    examples: [
      'Marketing: required date',
      'Eng Process: durasi per operation',
      'PPIC: estimasi durasi + tanggal + kapasitas 22 jam/hari',
      'Assembly: durasi start–end',
    ],
    status: 'partial',
  },
  {
    id: 'G-02',
    name: 'Approval Engine',
    group: 'Tata Kelola',
    fixedBehavior:
      'Eksekusi rantai tahap; catatan sign-off (siapa–kapan–komentar); transisi PASS/REJECT; delegasi; antrean "menunggu persetujuan saya"; notifikasi pending.',
    parameterized:
      'Jumlah & nama tahap; aktor per tahap; mode sequential vs parallel; workMayStartAtStage; onReject; SLA per tahap; keharusan alasan.',
    examples: [
      'PPIC: PREPARED→CHECKED→APPROVED→FINAL JUDGE',
      'Pindah mesin: 1 tahap + alasan wajib',
      'Shipment: release oleh Marketing',
      'Cacat material: 4 penandatangan paralel',
    ],
    status: 'partial',
  },
  {
    id: 'G-03',
    name: 'Assignment & Actor Directory',
    group: 'Aktor & Kualitas',
    fixedBehavior:
      'Direktori user/role/unit/tenant; mekanisme assign, claim, reassign (dengan jejak); resolusi izin (RBAC).',
    parameterized: 'Siapa bermain di node ini → lihat D-02 Actor Binding.',
    examples: [
      'Sales Supervisor + Marketing Admin',
      'Eng Design Lead',
      'Operator mesin',
      'QC pair',
    ],
    status: 'ready',
  },
  {
    id: 'G-04',
    name: 'Form Renderer & Schema Registry',
    group: 'Data & Dokumen',
    fixedBehavior:
      'Render & validasi semua tipe field (text, number, date, dropdown, checkbox, signature, file/image upload, textarea); conditional visibility; draft/submit.',
    parameterized: 'Schema per node → lihat D-01 Form Schema.',
    examples: [
      'Incoming Order',
      'Set operation',
      'Form receiving',
      'Form retur',
    ],
    status: 'partial',
  },
  {
    id: 'G-05',
    name: 'Document Engine & Versioning',
    group: 'Data & Dokumen',
    fixedBehavior:
      'Generate dokumen dari template; menyimpan artefak; riwayat revisi (rev 1..n, siapa–kapan–apa berubah); notifikasi revisi; tautan dokumen ↔ node ↔ artefak.',
    parameterized: 'Template dokumen (field, layout, tipe file) per node → D-05.',
    examples: ['Drawing Request', 'Drawing 2D dengan riwayat revisi', 'Surat jalan'],
    status: 'missing',
  },
  {
    id: 'G-06',
    name: 'Numbering Service',
    group: 'Data & Dokumen',
    fixedBehavior:
      'Counter atomik per pattern (tidak ada nomor ganda walau concurrency); parse & format nomor; per-tenant.',
    parameterized:
      'Pattern per dokumen: prefix, suffix, padding, reset (per tahun/bulan/tanpa reset).',
    examples: [
      'Project number auto-generate',
      'MO-',
      'Jobsheet',
      'PR',
      'PO',
      'prefix SC- subcon',
    ],
    status: 'missing',
  },
  {
    id: 'G-07',
    name: 'Inventory Ledger & Stock Policy',
    group: 'Material & Pembelian',
    fixedBehavior:
      'Cek stok aktual; reservasi; mutasi IN/OUT/RESERVATION/ADJUSTMENT dengan balance berjalan & log tak terhapus; kebijakan konsumsi partial.',
    parameterized:
      'stockPolicy per kategori (STOCKED / NOT_STOCKED); partial incoming on/off; threshold reorder; aksi saat shortage.',
    examples: [
      'Stok ada → kurangi request',
      'Habis → PR',
      'Partial incoming dipersilakan',
      'Standard part masuk stok, raw material tidak',
    ],
    status: 'partial',
  },
  {
    id: 'G-08',
    name: 'Purchasing Core (PR/PO/Vendor)',
    group: 'Material & Pembelian',
    fixedBehavior:
      'Siklus PR → PO → monitor vendor → receiving link; status vendor; relasi PR ↔ PO ↔ material masuk.',
    parameterized:
      'Aturan MoQ (kenaikan qty); approval PO; jenis subcon (Preprocess/Process); dokumen & prefix via G-05/G-06.',
    examples: ['PR → PO dengan qty ditambah MoQ', 'PO subcon SC- dua jenis'],
    status: 'missing',
  },
  {
    id: 'G-09',
    name: 'Machine Scheduler & Capacity',
    group: 'Waktu & Eksekusi',
    fixedBehavior:
      'Validasi kapasitas harian saat assignment; deteksi konflik jadwal; riwayat reassignment; kaitan ke breakdown & maintenance.',
    parameterized:
      'Batas kapasitas per mesin per hari (22 jam); kebijakan reassign (butuh approval + alasan → G-02); auto-assign vs manual.',
    examples: ['PPIC assign mesin', 'Pindah mesin butuh approval + alasan'],
    status: 'partial',
  },
  {
    id: 'G-10',
    name: 'Timer / Clock & Attribution',
    group: 'Waktu & Eksekusi',
    fixedBehavior:
      'Start/stop/pause/resume; durasi kumulatif; korelasi ke task/artefak; sumber data actualHours.',
    parameterized:
      'Mode (per task / per node / per ronde QC); attribution split (operator vs QC dicatat terpisah); auto-pause saat breakdown.',
    examples: [
      'Production catat start/stop',
      'Assembly total start–end + split operator/QC',
    ],
    status: 'partial',
  },
  {
    id: 'G-11',
    name: 'Odoo / ERP Connector',
    group: 'Integrasi & Komunikasi',
    fixedBehavior:
      'RPC client; registry field-mapping; retry + idempotency (via action framework/outbox); karantina data gagal sync (bisa re-enqueue).',
    parameterized:
      'Entity yang disinkronkan; arah; trigger event; mapping field.',
    examples: ['Sync Incoming Order → Odoo', 'PR ke Procurement Odoo'],
    status: 'missing',
  },
  {
    id: 'G-12',
    name: 'Notification',
    group: 'Integrasi & Komunikasi',
    fixedBehavior: 'Channel in-app/email; render template; antrean & retry kirim; digest.',
    parameterized: 'Penerima (role/user/unit/customer); template pesan; event pemicu.',
    examples: [
      'Notif material ready',
      'Notif PR ke Purchasing',
      'Notif breakdown ke maintenance',
    ],
    status: 'ready',
  },
  {
    id: 'G-13',
    name: 'Evidence & Signature',
    group: 'Integrasi & Komunikasi',
    fixedBehavior:
      'Upload & penyimpanan berkas/foto; tipe & ukuran valid; jejak versi bukti; tanda tangan digital single/multi.',
    parameterized:
      'Bukti wajib per momen (foto material, surat jalan, foto, resi); jumlah minimal; siapa yang menandatangani.',
    examples: ['Bukti kirim (surat jalan/foto/resi)', 'Ttd 4 divisi'],
    status: 'partial',
  },
  {
    id: 'G-14',
    name: 'Master Data Directory',
    group: 'Data & Dokumen',
    fixedBehavior:
      'CRUD + versi master: customer, vendor, part & part number, operation type, mesin, divisi/unit.',
    parameterized: 'Taksonomi & atribut custom per master.',
    examples: [
      'Final Part List',
      'Daftar operation type',
      'Vendor subcon',
    ],
    status: 'partial',
  },
  {
    id: 'G-15',
    name: 'Public Order Tracking',
    group: 'Integrasi & Komunikasi',
    fixedBehavior: 'Portal read-only customer; progres agregat dari WorkflowRun.',
    parameterized:
      'Milestone apa yang tampil ke customer + labelnya (per order type bisa beda).',
    examples: ['Customer memantau progres order'],
    status: 'ready',
  },
  {
    id: 'G-16',
    name: 'Event Bus & Trigger Runtime',
    group: 'Tata Kelola',
    fixedBehavior:
      'Publish/subscribe event domain; dispatch ke trigger (EDGE/NODE_STATE/EVENT/SCHEDULE); menjamin delivery ke outbox.',
    parameterized: 'Subscription (event apa → aksi apa) via D-12.',
    examples: [
      'STOCK_SHORTAGE',
      'MATERIAL_READY',
      'MACHINE_DOWN',
    ],
    status: 'missing',
  },
  {
    id: 'G-17',
    name: 'Gate Runtime',
    group: 'Tata Kelola',
    fixedBehavior:
      'Evaluasi kondisi tunggu; membuka gate oleh event; banyak node boleh menunggu gate yang sama.',
    parameterized:
      'Definisi gate (kunci, event pembuka, mode: SEMUA lengkap vs PARTIAL cukup) → D-09.',
    examples: ['Ready to machining (partial boleh)', 'Shipment menunggu instruksi Marketing'],
    status: 'missing',
  },
  {
    id: 'G-18',
    name: 'SLA / Schedule Runtime',
    group: 'Tata Kelola',
    fixedBehavior: 'Evaluasi cron/delay; deteksi pelanggaran SLA; eskalasi.',
    parameterized: 'Nilai SLA per node/tahap; aksi saat telat (notif/eskalasi) → D-11.',
    examples: ['Target finish design di Drawing Request', 'Approval yang menggantung'],
    status: 'missing',
  },
  {
    id: 'G-19',
    name: 'QC Framework',
    group: 'Aktor & Kualitas',
    fixedBehavior:
      'Runtime checklist item; ronde inspeksi; hasil pass/rework per item; ping-pong loop dengan batas ronde; multi-party sign; pencatatan siapa-QC-apa-kapan.',
    parameterized: 'Pola per node → D-08; daftar item inspeksi; kriteria selesai.',
    examples: [
      'QC pair inspeksi tiap operation + hasil subcon',
      'Ping-pong Assembly',
      'Ttd 4 divisi',
    ],
    status: 'missing',
  },
  {
    id: 'G-20',
    name: 'Audit Trail',
    group: 'Tata Kelola',
    fixedBehavior:
      'Pencatatan semua aksi (siapa–kapan–apa–old/new value) — otomatis untuk semua komponen.',
    parameterized: 'Severity mapping (default sudah cukup).',
    examples: ['Audit otomatis semua komponen'],
    status: 'ready',
  },
];

// ============================================================
// Dynamic Elements (D-01 .. D-13)
// From DYNAMIC_WORKFLOW_COMPONENT_REGISTRY.md §4
// ============================================================

export const DYNAMIC_ELEMENTS: DynamicElement[] = [
  {
    id: 'D-01',
    name: 'Form Schema',
    userControls: 'Field, tipe, validasi, default, conditional visibility, urutan/group',
    dependsOn: 'G-04 Form Renderer',
    example: 'Form Incoming Order (customer, produk, qty, tipe Regular/Final Part, req date)',
  },
  {
    id: 'D-02',
    name: 'Actor Binding',
    userControls:
      'Peran di node: initiator, owner, executor, approver, observer; resolver: role statis / user / unit / dinamis',
    dependsOn: 'G-03 Assignment & Actor Directory',
    example: 'Sales Supervisor & Marketing Admin mencatat; Eng Design Lead breakdown; QC pair',
  },
  {
    id: 'D-03',
    name: 'Business Status & Exit Criteria',
    userControls:
      'Label status bisnis per node + kriteria node dianggap selesai (semua form submitted? QC pass? gate terbuka?)',
    dependsOn: 'Engine state (PENDING/ACTIVE/WAITING/DONE)',
    example: '"Warehouse Done" → ready to machining',
  },
  {
    id: 'D-04',
    name: 'Routing & Classification',
    userControls: 'Taksonomi klasifikasi + routing table tujuan',
    dependsOn: 'Engine edge condition',
    example: 'assy→Assembly, machining→Production, standard→Purchasing; subcon Preprocess/Process',
  },
  {
    id: 'D-05',
    name: 'Document Template',
    userControls: 'Field, layout, tipe keluaran dokumen',
    dependsOn: 'G-05 Document Engine + G-06 Numbering',
    example: 'Drawing Request; Drawing 2D; surat jalan',
  },
  {
    id: 'D-06',
    name: 'Formula / Calculation',
    userControls: 'Ekspresi hitung pada context',
    dependsOn: 'Engine expression evaluator',
    example: 'Margin material 20×150×5→25×175×8; penambahan qty MoQ',
  },
  {
    id: 'D-07',
    name: 'Fan-out / Pairing Rule',
    userControls: 'Multiplier, rasio agregasi, pola pairing artefak',
    dependsOn: 'Engine + G-14 Master Data',
    example: '1 project = 1 MO; jobsheet = op × 2 (QC pair)',
  },
  {
    id: 'D-08',
    name: 'QC Pattern',
    userControls:
      'Pilihan pola: per-op checklist / ping-pong / multi-party sign; item inspeksi; kriteria lolos; batas ronde',
    dependsOn: 'G-19 QC Framework',
    example: 'Inspeksi tiap operation; ping-pong Assembly; ttd 4 divisi',
  },
  {
    id: 'D-09',
    name: 'Gate Definition',
    userControls: 'Kunci gate; event pembuka; mode SEMUA vs PARTIAL',
    dependsOn: 'G-17 Gate Runtime',
    example: 'MATERIAL_READY (partial ok); SHIPMENT_APPROVED',
  },
  {
    id: 'D-10',
    name: 'Escalation / Exception Rule',
    userControls: 'Pemicu kejadian (breakdown, defect, retur) → aksi (pause, subcon, tiket urgent, loop-back)',
    dependsOn: 'Engine + G-16 Event Bus',
    example: 'Breakdown→PAUSE/subcon; retur salah gambar→tiket Urgent ke Eng Design',
  },
  {
    id: 'D-11',
    name: 'SLA / Reminder',
    userControls: 'Durasi SLA per node/tahap + aksi saat telat',
    dependsOn: 'G-18 SLA / Schedule Runtime',
    example: 'Target finish design; approval menggantung',
  },
  {
    id: 'D-12',
    name: 'Action Binding',
    userControls: 'Trigger (EDGE/NODE_STATE/EVENT/SCHEDULE) → urutan action + blocking + retry',
    dependsOn: 'Semua G yang punya aksi (G-07, G-08, G-11, G-12, …)',
    example: 'Edge Marketing→EngDesign: ODOO_RPC + DOC_GENERATE + TRACKING_UPDATE',
  },
  {
    id: 'D-13',
    name: 'UI Presentation Hints',
    userControls: 'Ikon, warna, urutan tampil di board/dashboard per node',
    dependsOn: 'Renderer',
    example: 'Opsional — murni kosmetik',
  },
];

// ============================================================
// Business Units (10 divisi from interview)
// ============================================================

export const BUSINESS_UNITS: BusinessUnit[] = [
  {
    id: 'bu-marketing',
    name: 'Marketing',
    shortCode: 'MKT',
    description: 'Incoming Order + Odoo sync + Drawing Request',
    color: '#f97316',
  },
  {
    id: 'bu-eng-design',
    name: 'Engineering Design',
    shortCode: 'ED',
    description: 'Breakdown Final Part List + Drawing 2D + revisi',
    color: '#06b6d4',
  },
  {
    id: 'bu-eng-process',
    name: 'Engineering Process',
    shortCode: 'EP',
    description: 'Operations + CAM + margin material',
    color: '#0ea5e9',
  },
  {
    id: 'bu-ppic',
    name: 'PPIC',
    shortCode: 'PP',
    description: 'MO + Jobsheet + Approval + Scheduling',
    color: '#8b5cf6',
  },
  {
    id: 'bu-warehouse-material',
    name: 'Warehouse Material',
    shortCode: 'WM',
    description: 'Stok + Receiving + Material Ready gate',
    color: '#14b8a6',
  },
  {
    id: 'bu-purchasing',
    name: 'Purchasing',
    shortCode: 'PU',
    description: 'PR + PO + Vendor + Subcon',
    color: '#ec4899',
  },
  {
    id: 'bu-production',
    name: 'Production',
    shortCode: 'PR',
    description: 'Machining + Timer + QC per operation',
    color: '#ef4444',
  },
  {
    id: 'bu-assembly',
    name: 'Assembly',
    shortCode: 'AS',
    description: 'Ping-pong operator ⇄ QC + timer attribution',
    color: '#f59e0b',
  },
  {
    id: 'bu-packing-shipment',
    name: 'Packing & Shipment',
    shortCode: 'PK',
    description: 'Packing + Approval Marketing + Evidence',
    color: '#84cc16',
  },
  {
    id: 'bu-delivered',
    name: 'Delivered',
    shortCode: 'DL',
    description: 'Public tracking + Retur + Urgent ticket loop-back',
    color: '#10b981',
  },
];

// ============================================================
// Node Component Kinds Catalog
// From DYNAMIC_WORKFLOW_BLUEPRINT.md §9
// ============================================================

export const NODE_COMPONENT_KINDS: NodeComponentKindMeta[] = [
  {
    kind: 'FORM',
    label: 'Form',
    description: 'Form dinamis dengan field, validasi, dan conditional visibility.',
    example: 'Incoming Order: customer, produk, qty, tipe Regular/Final Part, req date',
    icon: 'FormInput',
    color: '#3b82f6',
    defaultConfig: { schemaRef: 'frm-default', fields: [] },
  },
  {
    kind: 'DOCUMENT',
    label: 'Document',
    description: 'Template dokumen + field + tipe keluaran (PDF, 2D, dll).',
    example: 'Drawing Request; Drawing 2D; surat jalan',
    icon: 'FileText',
    color: '#0ea5e9',
    defaultConfig: { templateRef: 'doc-default', outputType: 'PDF' },
  },
  {
    kind: 'APPROVAL',
    label: 'Approval',
    description: 'Rantai tahap + role + aturan mulai kerja + kebijakan reject.',
    example: 'PREPARED → CHECKED → APPROVED → FINAL JUDGE; mulai sejak PREPARED',
    icon: 'CheckSquare',
    color: '#8b5cf6',
    defaultConfig: {
      mode: 'sequential',
      stages: [{ name: 'PREPARED', role: 'PPIC' }],
      workMayStartAtStage: 'PREPARED',
      onReject: 'RETURN_TO_STAGE',
    },
  },
  {
    kind: 'ROUTING',
    label: 'Routing',
    description: 'Taksonomi klasifikasi + routing table tujuan.',
    example: 'assy → Assembly; machining → Production; standard → Purchasing',
    icon: 'Split',
    color: '#06b6d4',
    defaultConfig: {
      mapping: { machining: 'production', assy: 'assembly', standard: 'purchasing' },
    },
  },
  {
    kind: 'CALC',
    label: 'Calculation',
    description: 'Formula hitung pada data context.',
    example: 'Margin material 20×150×5 → 25×175×8',
    icon: 'Calculator',
    color: '#f59e0b',
    defaultConfig: { expression: '', outputField: '' },
  },
  {
    kind: 'FANOUT',
    label: 'Fan-out',
    description: 'Multiplier / agregasi / pairing artefak.',
    example: '1 project = 1 MO; jobsheet = op × 2 QC pair',
    icon: 'GitBranch',
    color: '#14b8a6',
    defaultConfig: { rule: 'ONE_PER_ORDER', artifact: 'MANUFACTURING_ORDER' },
  },
  {
    kind: 'QC_PATTERN',
    label: 'QC Pattern',
    description: 'Checklist per operation · ping-pong loop · multi-party signature.',
    example: 'Inspeksi tiap op + hasil subcon; ttd 4 divisi',
    icon: 'ShieldCheck',
    color: '#10b981',
    defaultConfig: {
      pattern: 'PER_OP_CHECKLIST',
      items: [],
      passCriteria: 'ALL_ITEMS_PASS',
      maxRounds: 3,
    },
  },
  {
    kind: 'TIMER',
    label: 'Timer',
    description: 'Mode pencatatan waktu + atribusi (operator vs QC).',
    example: 'Start/stop machining; operator vs QC terpisah',
    icon: 'Timer',
    color: '#ef4444',
    defaultConfig: { mode: 'PER_TASK', attributionSplit: false },
  },
  {
    kind: 'EVIDENCE',
    label: 'Evidence',
    description: 'Upload wajib (foto, ttd, dokumen).',
    example: 'Surat jalan, foto, resi saat shipment',
    icon: 'Paperclip',
    color: '#a855f7',
    defaultConfig: { requiredTypes: [], minCount: 1 },
  },
  {
    kind: 'INVENTORY_POLICY',
    label: 'Inventory Policy',
    description: 'Kebijakan stok & receiving.',
    example: 'Standard part masuk stok, raw tidak; partial incoming',
    icon: 'Boxes',
    color: '#84cc16',
    defaultConfig: {
      stockPolicy: { STANDARD_PART: 'STOCKED', RAW_MATERIAL: 'NOT_STOCKED' },
      partialIncoming: true,
      onShortage: 'PR_CREATE',
    },
  },
  {
    kind: 'SCHEDULING',
    label: 'Scheduling',
    description: 'Constraint penjadwalan mesin.',
    example: 'Kapasitas ≤ 22 jam/hari; pindah mesin = approval + alasan',
    icon: 'CalendarClock',
    color: '#f97316',
    defaultConfig: {
      machineCapacityHoursPerDay: 22,
      reassignRequiresApproval: true,
      reassignReasonRequired: true,
    },
  },
  {
    kind: 'GATE',
    label: 'Gate',
    description: 'Kondisi node boleh dieksekusi.',
    example: 'Ready to machining; tunggu approval Marketing',
    icon: 'Lock',
    color: '#64748b',
    defaultConfig: { gateKey: 'MATERIAL_READY', opensOn: ['MATERIAL_RECEIVED'], mode: 'PARTIAL_OK' },
  },
  {
    kind: 'ESCALATION',
    label: 'Escalation',
    description: 'Penanganan kejadian luar biasa.',
    example: 'Breakdown → PAUSE / subcon; retur → tiket Urgent',
    icon: 'AlertTriangle',
    color: '#dc2626',
    defaultConfig: { triggers: [], actions: [] },
  },
];

// ============================================================
// Action Kinds Catalog
// From DYNAMIC_WORKFLOW_BLUEPRINT.md §10.2
// ============================================================

export const ACTION_KINDS: ActionKindMeta[] = [
  {
    kind: 'ODOO_RPC',
    label: 'Odoo RPC',
    description: 'Upsert / update entity di Odoo via XML-RPC.',
    blockingDefault: false,
    example: 'Upsert Sales Order saat Incoming Order; update status delivered',
    icon: 'Database',
  },
  {
    kind: 'HTTP_REQUEST',
    label: 'HTTP Request',
    description: 'Webhook / REST call ke pihak ketiga.',
    blockingDefault: false,
    example: 'Webhook pihak ketiga',
    icon: 'Globe',
  },
  {
    kind: 'STOCK_CHECK',
    label: 'Stock Check',
    description: 'Cek kebutuhan vs stok aktual → hasil shortfall di context.',
    blockingDefault: true,
    example: 'Warehouse cek kebutuhan → hasil shortfall di context',
    icon: 'Search',
  },
  {
    kind: 'LEDGER_POST',
    label: 'Ledger Post',
    description: 'Mutasi stok IN / OUT / RESERVATION / ADJUSTMENT.',
    blockingDefault: true,
    example: 'Material diterima → IN; issue → OUT; reservasi',
    icon: 'BookOpen',
  },
  {
    kind: 'STOCK_RESERVE',
    label: 'Stock Reserve',
    description: 'Reservasi stok standard part yang tersedia.',
    blockingDefault: true,
    example: 'Standard part tersedia → reserved',
    icon: 'Bookmark',
  },
  {
    kind: 'PR_CREATE',
    label: 'PR Create',
    description: 'Buat Purchase Request ke Purchasing / Odoo Procurement.',
    blockingDefault: true,
    example: 'Stok habis → PR ke Purchasing / Odoo Procurement',
    icon: 'FilePlus',
  },
  {
    kind: 'PO_CREATE',
    label: 'PO Create',
    description: 'Buat Purchase Order ke vendor; subcon SC- prefix.',
    blockingDefault: false,
    example: 'PO vendor; subcon SC- Process/Preprocess',
    icon: 'ShoppingCart',
  },
  {
    kind: 'DOC_GENERATE',
    label: 'Document Generate',
    description: 'Generate dokumen dari template.',
    blockingDefault: true,
    example: 'Drawing Request, jobsheet, surat jalan',
    icon: 'FileText',
  },
  {
    kind: 'NUMBER_ALLOCATE',
    label: 'Number Allocate',
    description: 'Alokasi nomor atomik (project no, MO-, SC-).',
    blockingDefault: true,
    example: 'Project number auto; MO-01; prefix SC-',
    icon: 'Hash',
  },
  {
    kind: 'ARTIFACT_CREATE',
    label: 'Artifact Create',
    description: 'Buat artefak domain (MO, jobsheet pair, task).',
    blockingDefault: true,
    example: 'MO, jobsheet pair, machining task',
    icon: 'Package',
  },
  {
    kind: 'MACHINE_ASSIGN',
    label: 'Machine Assign',
    description: 'Assign mesin + validasi kapasitas 22 jam/hari.',
    blockingDefault: true,
    example: 'Assign + validasi kapasitas 22 jam/hari',
    icon: 'Cog',
  },
  {
    kind: 'APPROVAL_START',
    label: 'Approval Start',
    description: 'Mulai rantai approval jobsheet.',
    blockingDefault: true,
    example: 'Mulai rantai approval jobsheet',
    icon: 'CheckCircle',
  },
  {
    kind: 'NOTIFY',
    label: 'Notify',
    description: 'Kirim notifikasi in-app / email.',
    blockingDefault: false,
    example: 'Material ready → operator; breakdown → maintenance',
    icon: 'Bell',
  },
  {
    kind: 'CALC_APPLY',
    label: 'Calc Apply',
    description: 'Terapkan formula (mis. margin material).',
    blockingDefault: true,
    example: 'Terapkan margin material',
    icon: 'Calculator',
  },
  {
    kind: 'FIELD_SET',
    label: 'Field Set',
    description: 'Set field di context.',
    blockingDefault: true,
    example: 'Set readyToMachining = true',
    icon: 'Edit',
  },
  {
    kind: 'GATE_OPEN',
    label: 'Gate Open',
    description: 'Buka gate yang ditunggu node lain.',
    blockingDefault: true,
    example: 'Buka gate shipment approval',
    icon: 'Unlock',
  },
  {
    kind: 'GATE_WAIT',
    label: 'Gate Wait',
    description: 'Tunggu gate terbuka sebelum lanjut.',
    blockingDefault: true,
    example: 'Tunggu MATERIAL_READY',
    icon: 'Lock',
  },
  {
    kind: 'TRACKING_UPDATE',
    label: 'Tracking Update',
    description: 'Update progres di public tracking portal.',
    blockingDefault: false,
    example: 'Update progres public tracking',
    icon: 'MapPin',
  },
  {
    kind: 'AUDIT_LOG',
    label: 'Audit Log',
    description: 'Audit eksplisit (semua aksi sudah otomatis ter-audit).',
    blockingDefault: false,
    example: 'Audit eksplisit',
    icon: 'History',
  },
];

// ============================================================
// Event Catalog
// From DYNAMIC_WORKFLOW_BLUEPRINT.md §16
// ============================================================

export const EVENT_CATALOG: { domain: string; events: string[] }[] = [
  {
    domain: 'Order',
    events: ['ORDER_CREATED', 'ORDER_RELEASED', 'ORDER_CANCELLED', 'ORDER_DELIVERED'],
  },
  {
    domain: 'Engineering',
    events: [
      'DRAWING_REQUEST_CREATED',
      'DRAWING_RELEASED',
      'DRAWING_REVISED',
      'OPERATIONS_DEFINED',
      'CAM_CREATED',
    ],
  },
  {
    domain: 'PPIC',
    events: [
      'MO_CREATED',
      'JOBSHEET_CREATED',
      'JOBSHEET_ROUTED',
      'MACHINE_ASSIGNED',
      'MACHINE_REASSIGN_REQUESTED',
    ],
  },
  {
    domain: 'Approval',
    events: ['APPROVAL_STAGE_PASSED', 'APPROVAL_REJECTED', 'APPROVAL_COMPLETED'],
  },
  {
    domain: 'Material',
    events: [
      'STOCK_CHECKED',
      'STOCK_SHORTAGE',
      'MATERIAL_RESERVED',
      'PR_CREATED',
      'PO_ISSUED',
      'MATERIAL_PARTIAL_RECEIVED',
      'MATERIAL_READY',
      'MATERIAL_DEFECT_VERIFIED',
    ],
  },
  {
    domain: 'Shopfloor',
    events: [
      'WORK_STARTED',
      'WORK_PAUSED',
      'WORK_RESUMED',
      'QC_PASSED',
      'QC_REJECTED',
      'MACHINE_DOWN',
      'SUBCON_REDIRECTED',
      'SUBCON_RETURNED',
    ],
  },
  {
    domain: 'Shipment',
    events: ['PACKING_DONE', 'SHIPMENT_APPROVED', 'DELIVERY_PROOF_UPLOADED'],
  },
  {
    domain: 'Retur',
    events: ['RETURN_FILED', 'URGENT_REVISION_TICKET'],
  },
];
