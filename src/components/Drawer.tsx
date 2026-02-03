import { useEffect, useRef } from "react";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string; // tailwind width classes override
};

export default function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  widthClass = "w-[420px] sm:w-[480px] md:w-[560px]",
}: DrawerProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={
        "fixed inset-0 z-40 " +
        (open ? "pointer-events-auto" : "pointer-events-none")
      }
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className={
          "absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 " +
          (open ? "opacity-100" : "opacity-0")
        }
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={
          `absolute right-0 inset-y-0 ${widthClass} bg-white dark:bg-base border-l border-gray-200 shadow-xl flex flex-col transition-transform duration-300 ease-out ` +
          (open ? "translate-x-0" : "translate-x-full")
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            {typeof title === "string" ? (
              <h2 className="text-base font-semibold truncate">{title}</h2>
            ) : (
              title
            )}
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

        {/* Footer */}
        {footer !== undefined && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 dark:bg-white/5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

