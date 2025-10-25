import { useEffect } from "react";

type NotificationVariant = "success" | "info" | "warning" | "error";

type NotificationBannerProps = {
  message: string;
  variant?: NotificationVariant;
  isOpen: boolean;
  duration?: number;
  onDismiss?: () => void;
};

const VARIANT_CLASSNAME: Record<NotificationVariant, string> = {
  success: "bg-emerald-500 text-white",
  info: "bg-sky-500 text-white",
  warning: "bg-amber-400 text-slate-900",
  error: "bg-rose-500 text-white",
};

function NotificationBanner({
  message,
  variant = "success",
  isOpen,
  duration = 2000,
  onDismiss,
}: NotificationBannerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      onDismiss?.();
    }, duration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen, duration, onDismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[80] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto w-full max-w-md rounded-xl px-6 py-3 shadow-lg transition-all duration-500 ease-in-out ${
          VARIANT_CLASSNAME[variant]
        } ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0"}`}
      >
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
}

export type { NotificationVariant };
export default NotificationBanner;

