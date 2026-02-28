/**
 * src/components/attendance/ProgressBar.jsx
 * ──────────────────────────────────────────
 * Visual % bar with color-coded fill.
 */
import { clsx } from "clsx";

export function ProgressBar({ percentage, colorClass }) {
    // Ensure percentage is between 0 and 100
    const clamped = Math.min(100, Math.max(0, percentage));

    return (
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
                className={clsx(
                    "h-full transition-all duration-500 ease-out rounded-full",
                    colorClass || "bg-accent"
                )}
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}
