/**
 * src/components/attendance/RecoveryPlanModal.jsx
 * ─────────────────────────────────────────────────
 * Modal that fetches and displays recovery scenarios for a subject.
 */
import { X, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getRecoveryPlan } from '../../api/attendance';

const SCENARIO_STYLES = [
    { icon: Target, color: 'text-amber-400', border: 'border-amber-400/30 bg-amber-400/5' },
    { icon: TrendingUp, color: 'text-blue-400', border: 'border-blue-400/30 bg-blue-400/5' },
    { icon: CheckCircle, color: 'text-green-400', border: 'border-green-400/30 bg-green-400/5' },
];

export default function RecoveryPlanModal({ subjectId, onClose }) {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!subjectId) return;
        setLoading(true);
        setError(false);
        getRecoveryPlan(subjectId)
            .then(({ data }) => setPlan(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [subjectId]);

    if (!subjectId) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-semibold text-white">Recovery Plan</h3>
                        {plan && (
                            <p className="text-sm text-slate-400 mt-0.5">{plan.subject_name}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="py-12 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <p className="text-center text-slate-500 py-12">Failed to load recovery plan</p>
                ) : plan ? (
                    <>
                        {/* Current Status */}
                        <div className="bg-slate-800/60 rounded-xl p-4 mb-5 flex items-center justify-between">
                            <span className="text-sm text-slate-400">Current Attendance</span>
                            <span
                                className={`text-2xl font-bold tabular-nums ${plan.current_percentage >= 75 ? 'text-green-400' : 'text-red-400'
                                    }`}
                            >
                                {plan.current_percentage.toFixed(1)}%
                            </span>
                        </div>

                        {/* Scenarios */}
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">
                            Recovery Scenarios
                        </p>
                        <div className="space-y-3">
                            {plan.scenarios.map((scenario, i) => {
                                const { icon: Icon, color, border } = SCENARIO_STYLES[i] ?? SCENARIO_STYLES[0];
                                return (
                                    <div key={i} className={`border rounded-xl p-4 ${border}`}>
                                        <div className="flex items-start gap-3">
                                            <Icon size={16} className={`${color} mt-0.5 flex-shrink-0`} />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-sm font-semibold text-white">{scenario.name}</span>
                                                    <span className={`text-xs font-mono font-bold ${color}`}>{scenario.target}%</span>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed">{scenario.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full mt-6 py-3 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-900 font-bold rounded-xl transition-colors"
                        >
                            Got it!
                        </button>
                    </>
                ) : null}
            </div>
        </div>
    );
}
