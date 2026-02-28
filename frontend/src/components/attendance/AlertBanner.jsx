/**
 * src/components/attendance/AlertBanner.jsx
 * ─────────────────────────────────────────
 * Reusable alert row component. Shown on AttendancePage and inside AlertsWidget.
 */
import { AlertTriangle, AlertCircle, Info, X, TrendingUp } from 'lucide-react';

const SEVERITY = {
    critical: {
        bg: 'bg-red-400/10',
        border: 'border-red-400/30',
        text: 'text-red-400',
        Icon: AlertTriangle,
    },
    warning: {
        bg: 'bg-amber-400/10',
        border: 'border-amber-400/30',
        text: 'text-amber-400',
        Icon: AlertCircle,
    },
    info: {
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/30',
        text: 'text-blue-400',
        Icon: Info,
    },
};

export default function AlertBanner({ alert, onDismiss, onViewRecovery }) {
    const style = SEVERITY[alert.severity] ?? SEVERITY.info;
    const { Icon } = style;

    return (
        <div className={`${style.bg} border ${style.border} rounded-xl p-4 ${style.text}`}>
            <div className="flex items-start gap-3">
                <Icon size={17} className="flex-shrink-0 mt-0.5" />

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug">{alert.title}</p>
                    <p className="text-xs mt-1 opacity-80 leading-relaxed">{alert.message}</p>

                    {onViewRecovery && (
                        <button
                            onClick={() => onViewRecovery(alert.subject_id)}
                            className={`inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 ${style.bg} border ${style.border}`}
                        >
                            <TrendingUp size={11} />
                            Recovery Plan
                        </button>
                    )}
                </div>

                {onDismiss && (
                    <button
                        onClick={() => onDismiss(alert.id)}
                        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                        aria-label="Dismiss alert"
                    >
                        <X size={15} />
                    </button>
                )}
            </div>
        </div>
    );
}
