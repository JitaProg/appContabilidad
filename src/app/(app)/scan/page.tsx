import { redirect } from "next/navigation";

/** Ruta antigua del escáner: ahora todo se añade desde el formulario de ticket. */
export default function ScanPage() {
  redirect("/receipts/new");
}
