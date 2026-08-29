'use client';

import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-3xl flex-col rounded-lg border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <LucideIcons.HelpCircle className="h-4 w-4" />
            <h2 className="text-sm font-semibold">How to use the Workflow Builder</h2>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
            <LucideIcons.X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-5 p-5 text-sm">
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
                <LucideIcons.Compass className="h-4 w-4 text-primary" />
                Konsep inti
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Builder ini mengimplementasikan <strong>config-driven DAG workflow engine</strong> dari blueprint ManuOS.
                Node itu <em>wadah, bukan modul</em>. Anda mengustomisasi 3 hal:
              </p>
              <ol className="mt-2 space-y-1 text-xs">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  <span>Struktur DAG (node + edge + kondisi routing)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  <span>Komponen di tiap node (FORM, APPROVAL, FANOUT, QC_PATTERN, dll.)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  <span>Aksi di tiap routing/trigger (ODOO_RPC, LEDGER_POST, NOTIFY, dll.)</span>
                </li>
              </ol>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
                <LucideIcons.MousePointerClick className="h-4 w-4 text-primary" />
                Cara menambah node
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Di panel <strong>Node Palette</strong> (kiri), klik salah satu dari 10 divisi (Marketing, Eng Design, dst.).
                Node baru akan muncul di canvas di posisi acak — drag untuk memindah.
                Anda juga bisa membuat custom node dengan meng-expand <em>+ Custom Node</em>.
              </p>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
                <LucideIcons.GitBranch className="h-4 w-4 text-primary" />
                Cara menghubungkan node (membuat edge)
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Klik bulatan kecil di sisi kiri atau kanan node untuk memulai koneksi.
                Node asal akan disorot — klik node tujuan untuk membuat edge.
                Untuk membatalkan, klik node asal lagi.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Tipe edge:
              </p>
              <ul className="mt-1 space-y-1 text-xs">
                <li><Badge variant="outline" className="mr-1">SEQUENTIAL</Badge> default, transisi normal</li>
                <li><Badge variant="outline" className="mr-1">PARALLEL</Badge> garis putus-putus biru, cabang paralel</li>
                <li><Badge variant="outline" className="mr-1">LOOP_BACK</Badge> garis putus-putus merah, retur/revisi</li>
                <li><Badge variant="outline" className="mr-1">EXCEPTION</Badge> jalur kejadian luar biasa</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
                <LucideIcons.Settings2 className="h-4 w-4 text-primary" />
                Cara mengkonfigurasi
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Klik node atau edge di canvas → panel <strong>Inspector</strong> (kanan) akan muncul.
                Untuk node: tambah komponen (FORM, APPROVAL, dst.) lewat tombol <em>+ Add</em>.
                Untuk edge: tambah action (ODOO_RPC, LEDGER_POST, dst.) dengan urutan eksekusi.
              </p>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
                <LucideIcons.CheckCheck className="h-4 w-4 text-primary" />
                Validasi & Publish
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Klik <strong>Validate</strong> untuk cek struktur (orphan, duplikat), kontrak (komponen minimal),
                semantik (gate wait vs gate open), dan dry-run path (start → end). Klik <strong>Publish</strong>
                untuk mengaktifkan template — order baru akan memakai versi yang baru dipublish.
              </p>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
                <LucideIcons.Lightbulb className="h-4 w-4 text-amber-500" />
                Tips
              </h3>
              <ul className="space-y-1 text-xs">
                <li>• Ctrl/Cmd + scroll untuk zoom in/out canvas</li>
                <li>• State disimpan otomatis di localStorage — refresh aman</li>
                <li>• Klik <em>Reset to Reference</em> di sidebar kiri untuk kembali ke contoh workflow 10 divisi</li>
                <li>• Klik tombol Registry untuk lihat detail 20 global components + 13 dynamic elements</li>
                <li>• Klik badge angka kuning di edge untuk lihat actions yang sudah ditempel</li>
              </ul>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
                <LucideIcons.BookMarked className="h-4 w-4 text-primary" />
                Sumber dokumentasi
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Builder ini mengimplementasikan spesifikasi dari dua dokumen:
              </p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• <code>DYNAMIC_WORKFLOW_BLUEPRINT.md</code> — arsitektur, metamodel, DAG reference, state machine, action catalog</li>
                <li>• <code>DYNAMIC_WORKFLOW_COMPONENT_REGISTRY.md</code> — 20 global components (G-01..G-20), 13 dynamic elements (D-01..D-13), matriks pemakaian per node</li>
              </ul>
            </section>
          </div>
        </ScrollArea>

        <div className="flex justify-end border-t px-4 py-2">
          <Button size="sm" onClick={onClose}>Got it</Button>
        </div>
      </div>
    </div>
  );
}

function Badge({ variant, className, children }: { variant?: string; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-semibold ${className ?? ''}`}
      data-variant={variant}
    >
      {children}
    </span>
  );
}
