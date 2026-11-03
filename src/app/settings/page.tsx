"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronRight,
  Database,
  Download,
  FileSpreadsheet,
  HardDrive,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { InstallCard } from "@/components/install-card";
import { Button, Card, Dialog, SectionTitle, Skeleton } from "@/components/ui";
import { useToast } from "@/components/providers";
import { clearAllData, db } from "@/lib/db";
import { buildBackup, downloadBlob, exportCsv, importBackup } from "@/lib/backup";
import { todayISO } from "@/lib/dates";
import { formatInteger } from "@/lib/money";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${mb.toFixed(1)} MB`;
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const importInput = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [usageBytes, setUsageBytes] = useState<number | null>(null);

  const receiptCount = useLiveQuery(() => db.receipts.count(), []);
  const itemCount = useLiveQuery(() => db.items.count(), []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.storage?.estimate) return;

    navigator.storage
      .estimate()
      .then((estimate) => setUsageBytes(estimate.usage ?? 0))
      .catch(() => setUsageBytes(null));
  }, [receiptCount, itemCount]);

  async function handleExportCsv() {
    const receipts = await db.receipts.toArray();
    const categories = await db.categories.toArray();

    if (receipts.length === 0) {
      showToast("Todavía no hay tickets que exportar.", "info");
      return;
    }

    exportCsv(receipts, categories);
    showToast(`CSV creado con ${receipts.length} tickets.`);
  }

  async function handleBackup() {
    setExporting(true);
    try {
      const { blob, count } = await buildBackup();
      downloadBlob(blob, `tiquet-backup-${todayISO()}.zip`);
      showToast(`Copia de seguridad creada con ${count} tickets.`);
    } catch (error) {
      console.error(error);
      showToast("No se ha podido crear la copia de seguridad.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(file: File) {
    setImporting(true);
    try {
      const result = await importBackup(file);
      showToast(
        `Copia restaurada: ${result.receipts} tickets y ${result.items} artículos.`,
      );
    } catch (error) {
      console.error(error);
      showToast(
        error instanceof Error ? error.message : "No se ha podido restaurar la copia.",
        "error",
      );
    } finally {
      setImporting(false);
    }
  }

  async function handleClear() {
    await clearAllData();
    setConfirmClear(false);
    showToast("Se han eliminado todos los tickets.", "info");
  }

  return (
    <div className="animate-rise">
      <PageHeader title="Ajustes" subtitle="Datos, copias y privacidad" />

      <div className="space-y-7 px-5 pt-5">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Database className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {receiptCount === undefined ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  `${formatInteger(receiptCount)} ${
                    receiptCount === 1 ? "ticket guardado" : "tickets guardados"
                  }`
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {itemCount === undefined
                  ? "Calculando…"
                  : `${formatInteger(itemCount)} artículos · ${
                      usageBytes === null ? "espacio local" : formatBytes(usageBytes)
                    }`}
              </p>
            </div>
            <HardDrive className="size-4 text-muted" />
          </div>
        </Card>

        <section>
          <SectionTitle>Copia de seguridad</SectionTitle>
          <Card className="divide-y divide-line overflow-hidden">
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper/60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper-deep text-ink-soft">
                <FileSpreadsheet className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">
                  Exportar a CSV
                </span>
                <span className="block text-xs text-muted">
                  Para abrir en Excel o Google Sheets
                </span>
              </span>
              <ChevronRight className="size-4 text-muted" />
            </button>

            <button
              type="button"
              onClick={handleBackup}
              disabled={exporting}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper/60 disabled:opacity-60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper-deep text-ink-soft">
                {exporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">
                  Descargar copia completa
                </span>
                <span className="block text-xs text-muted">
                  ZIP con tickets, fotos y artículos
                </span>
              </span>
              <ChevronRight className="size-4 text-muted" />
            </button>

            <button
              type="button"
              onClick={() => importInput.current?.click()}
              disabled={importing}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper/60 disabled:opacity-60"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-paper-deep text-ink-soft">
                {importing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">
                  Restaurar una copia
                </span>
                <span className="block text-xs text-muted">
                  Se añaden a los tickets que ya tengas
                </span>
              </span>
              <ChevronRight className="size-4 text-muted" />
            </button>
          </Card>

          <input
            ref={importInput}
            type="file"
            accept=".zip,.json,application/zip,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleImport(file);
            }}
          />

          <p className="mt-2 px-1 text-[0.7rem] leading-relaxed text-muted">
            Guarda la copia en un sitio seguro. Si cambias de móvil o borras los
            datos del navegador, podrás recuperar todo desde el ZIP.
          </p>
        </section>

        <section>
          <SectionTitle>Instalar en el móvil</SectionTitle>
          <InstallCard />
        </section>

        <section>
          <SectionTitle>Privacidad</SectionTitle>
          <Card className="space-y-3 p-4">
            <div className="flex gap-3">
              <Lock className="mt-0.5 size-4 shrink-0 text-brand" />
              <p className="text-xs leading-relaxed text-muted">
                Tus tickets se guardan solo en este dispositivo, dentro del
                almacenamiento del navegador. No hay cuentas, servidores ni
                analítica.
              </p>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
              <p className="text-xs leading-relaxed text-muted">
                El texto de las fotos se reconoce en tu propio móvil. La imagen no
                se envía a ningún servicio externo.
              </p>
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle>Zona peligrosa</SectionTitle>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">Borrar todos los datos</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  Elimina tickets, fotos y ajustes de este dispositivo. Exporta una
                  copia antes si quieres conservarlos.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => setConfirmClear(true)}
                >
                  Borrar todo
                </Button>
              </div>
            </div>
          </Card>
        </section>

        <footer className="pb-4 text-center text-[0.7rem] leading-relaxed text-muted">
          <p className="font-semibold text-ink-soft">Tiquet · v1.0</p>
          <p className="mt-0.5">Hecho para llevar tus gastos sin complicaciones.</p>
        </footer>
      </div>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="¿Borrar todos los datos?"
        description="Se eliminarán todos los tickets, fotos y ajustes guardados en este dispositivo. Esta acción no se puede deshacer."
        footer={
          <>
            <Button variant="outline" fullWidth onClick={() => setConfirmClear(false)}>
              Cancelar
            </Button>
            <Button variant="danger" fullWidth onClick={handleClear}>
              Sí, borrar todo
            </Button>
          </>
        }
      />
    </div>
  );
}
