"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Cloud,
  Download,
  FileSpreadsheet,
  Loader2,
  LogOut,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { InstallCard } from "@/components/install-card";
import { BlobImage } from "@/components/blob-image";
import { Button, Card, Dialog, SectionTitle, Skeleton } from "@/components/ui";
import { useToast } from "@/components/providers";
import { useAuth } from "@/components/auth-provider";
import { useReceipts } from "@/components/receipts-provider";
import { buildBackup, downloadBlob, exportCsv, importBackup } from "@/lib/backup";
import { todayISO } from "@/lib/dates";
import { formatInteger } from "@/lib/money";

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { receipts, loading, refresh, clearReceipts } = useReceipts();
  const { showToast } = useToast();
  const importInput = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "Tu cuenta";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;
  const email = user?.email ?? "";

  function handleExportCsv() {
    if (receipts.length === 0) {
      showToast("Todavía no hay tickets que exportar.", "info");
      return;
    }

    exportCsv(receipts);
    showToast(`CSV creado con ${receipts.length} tickets.`);
  }

  async function handleBackup() {
    setExporting(true);
    try {
      const { blob, count } = await buildBackup(receipts);
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
    if (!user) return;

    setImporting(true);
    try {
      const result = await importBackup(file, user.id);
      await refresh();
      showToast(
        `Copia restaurada: ${result.receipts} ${
          result.receipts === 1 ? "ticket" : "tickets"
        }.`,
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
    setClearing(true);
    try {
      await clearReceipts();
      setConfirmClear(false);
      showToast("Se han eliminado todos los tickets.", "info");
    } catch (error) {
      console.error(error);
      showToast("No se han podido eliminar los tickets.", "error");
    } finally {
      setClearing(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error(error);
      showToast("No se ha podido cerrar la sesión.", "error");
      setSigningOut(false);
    }
  }

  return (
    <div className="animate-rise">
      <PageHeader title="Ajustes" subtitle="Cuenta, copias y privacidad" />

      <div className="space-y-7 px-5 pt-5">
        <section>
          <SectionTitle>Cuenta</SectionTitle>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <BlobImage
                  src={avatarUrl}
                  alt={`Foto de ${displayName}`}
                  className="size-11 shrink-0 rounded-2xl"
                />
              ) : (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <UserRound className="size-5" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{email}</p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-paper-deep px-2 py-1 text-[0.65rem] font-medium text-muted">
                <Cloud className="size-3" />
                Google
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
            </Button>
          </Card>
        </section>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Cloud className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {loading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  `${formatInteger(receipts.length)} ${
                    receipts.length === 1 ? "ticket guardado" : "tickets guardados"
                  }`
                )}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Sincronizados en tu cuenta de Supabase
              </p>
            </div>
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
                  ZIP con tickets y sus fotos
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
            La copia incluye todos tus tickets y fotos. Guárdala en un sitio seguro
            por si algún día quieres recuperarlos en otra cuenta.
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
              <Cloud className="mt-0.5 size-4 shrink-0 text-brand" />
              <p className="text-xs leading-relaxed text-muted">
                Tus tickets se guardan en Supabase, en un espacio privado vinculado a
                tu cuenta de Google. Nadie más puede verlos.
              </p>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
              <p className="text-xs leading-relaxed text-muted">
                Las fotos se guardan en un bucket privado y solo se muestran mediante
                enlaces temporales firmados. No se envían a ningún otro servicio.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-3 text-xs font-semibold">
              <Link href="/about" className="text-brand underline-offset-2 hover:underline">
                Sobre Tiquet
              </Link>
              <Link href="/privacy" className="text-brand underline-offset-2 hover:underline">
                Política de privacidad
              </Link>
              <Link href="/terms" className="text-brand underline-offset-2 hover:underline">
                Términos de uso
              </Link>
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
                  Elimina los tickets y sus fotos de tu cuenta en la nube. Exporta una
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
          <p className="font-semibold text-ink-soft">Tiquet · v2.1</p>
          <p className="mt-0.5">Hecho para llevar tus gastos sin complicaciones.</p>
        </footer>
      </div>

      <Dialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="¿Borrar todos los datos?"
        description="Se eliminarán todos los tickets y fotos guardados en tu cuenta. Esta acción no se puede deshacer."
        footer={
          <>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setConfirmClear(false)}
              disabled={clearing}
            >
              Cancelar
            </Button>
            <Button variant="danger" fullWidth onClick={handleClear} disabled={clearing}>
              {clearing ? <Loader2 className="size-4 animate-spin" /> : null}
              {clearing ? "Borrando…" : "Sí, borrar todo"}
            </Button>
          </>
        }
      />
    </div>
  );
}
