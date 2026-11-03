import { ReceiptText } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-2xl bg-brand text-white shadow-sm shadow-brand/25",
        className,
      )}
    >
      <ReceiptText className="size-5" strokeWidth={2.2} />
    </div>
  );
}
