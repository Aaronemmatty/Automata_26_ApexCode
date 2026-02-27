/**
 * src/components/ui/components.jsx
 * ──────────────────────────────────
 * Shared primitive components used throughout the app.
 * Card, Badge, Button, Input, Select, Modal, Spinner, EmptyState
 */
import { clsx } from "clsx";
import { X, Loader2 } from "lucide-react";

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, className, ...props }) {
  return (
    <div
      className={clsx(
        "bg-slate-900 border border-slate-800 rounded-card p-5 shadow-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  default:    "bg-slate-800 text-slate-300",
  success:    "bg-ok/20 text-ok",
  warning:    "bg-warn/20 text-warn",
  danger:     "bg-danger/20 text-danger",
  info:       "bg-info/20 text-info",
  accent:     "bg-accent text-ink",
};

export function Badge({ variant = "default", children, className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        BADGE_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ── Button ────────────────────────────────────────────────────────────────
export function Button({
  children, variant = "primary", size = "md",
  loading = false, className, disabled, ...props
}) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:  "bg-accent text-ink hover:bg-accent-hover active:scale-[0.98]",
    ghost:    "bg-transparent text-slate-400 hover:bg-slate-800 hover:text-paper",
    danger:   "bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20",
    outline:  "border border-slate-700 text-paper hover:border-slate-600 hover:bg-slate-800",
  };
  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5",
  };
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────
export function Input({ label, error, className, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-slate-400 text-xs font-medium">{label}</label>}
      <input
        className={clsx(
          "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2",
          "text-paper text-sm placeholder-slate-500",
          "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30",
          "transition-colors",
          error && "border-danger focus:border-danger focus:ring-danger/20",
          className
        )}
        {...props}
      />
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────
export function Select({ label, options = [], className, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-slate-400 text-xs font-medium">{label}</label>}
      <select
        className={clsx(
          "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2",
          "text-paper text-sm",
          "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30",
          "transition-colors",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-hover animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-paper font-display font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-paper">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className="animate-spin text-accent" />;
}

// ── EmptyState ────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
        {Icon && <Icon size={22} className="text-slate-500" />}
      </div>
      <p className="text-slate-500 text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-paper font-display font-bold text-2xl">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
