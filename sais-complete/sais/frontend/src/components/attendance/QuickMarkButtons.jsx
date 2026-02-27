/**
 * src/components/attendance/QuickMarkButtons.jsx
 * ──────────────────────────────────────────────
 * Buttons for Present, Absent, Late, Excused.
 */
import { Check, X, Clock, LifeBuoy } from "lucide-react";
import { clsx } from "clsx";

const STATUS_BUTTONS = [
    { id: "present", label: "Present", icon: Check, color: "bg-emerald-500", hover: "hover:bg-emerald-600", active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    { id: "absent", label: "Absent", icon: X, color: "bg-rose-500", hover: "hover:bg-rose-600", active: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
    { id: "late", label: "Late", icon: Clock, color: "bg-amber-500", hover: "hover:bg-amber-600", active: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    { id: "excused", label: "Excused", icon: LifeBuoy, color: "bg-sky-500", hover: "hover:bg-sky-600", active: "bg-sky-500/10 text-sky-500 border-sky-500/20" },
];

export function QuickMarkButtons({ onMark, currentStatus, loading }) {
    return (
        <div className="grid grid-cols-4 gap-2">
            {STATUS_BUTTONS.map((btn) => {
                const isActive = currentStatus === btn.id;
                const Icon = btn.icon;

                return (
                    <button
                        key={btn.id}
                        onClick={() => !loading && onMark(btn.id)}
                        disabled={loading}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-150 active:scale-95",
                            isActive
                                ? btn.active + " border-opacity-100"
                                : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                        )}
                        title={btn.label}
                    >
                        <div className={clsx(
                            "p-1.5 rounded-lg",
                            isActive ? btn.color + " text-white" : "bg-slate-700 text-slate-400"
                        )}>
                            <Icon size={14} strokeWidth={2.5} />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{btn.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
