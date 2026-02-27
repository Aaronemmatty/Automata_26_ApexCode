import { X, Calendar, BookOpen, Clock, Flag, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect } from 'react';

export default function AssignmentModal({ assignment, onClose, onStatusChange }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const priorityColors = {
        high: 'text-red-400 bg-red-400/10 border-red-400/30',
        medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
        low: 'text-blue-400 bg-blue-400/10 border-blue-400/30'
    };

    const statusColors = {
        pending: 'bg-slate-800 text-slate-400',
        in_progress: 'bg-blue-500/20 text-blue-400 border border-blue-400/30',
        completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30',
        overdue: 'bg-rose-500/20 text-rose-400 border border-rose-400/30'
    };

    const statusButtonColors = {
        pending: 'bg-slate-700 text-slate-300',
        in_progress: 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]',
        completed: 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        overdue: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
    };

    function handleStatusClick(newStatus) {
        onStatusChange(assignment.id, newStatus);
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div
                className="bg-slate-900 border border-slate-800/50 rounded-3xl max-w-lg w-full p-8 shadow-2xl overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Glow Effects */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-400/5 blur-3xl rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-400/5 blur-3xl rounded-full" />

                {/* Header */}
                <div className="flex items-start justify-between mb-8 relative">
                    <div className="flex-1 pr-4">
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{assignment.title}</h3>
                        <div className="flex flex-wrap gap-2.5">
                            {/* Priority Badge */}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${priorityColors[assignment.priority]}`}>
                                <Flag size={12} />
                                {assignment.priority}
                            </span>
                            {/* Task Type Badge */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                                {assignment.task_type}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800/50 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all duration-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Details Control Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 relative">
                    <div className="space-y-5">
                        {/* Subject */}
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-2xl bg-blue-400/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-400/20 transition-colors">
                                <BookOpen size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subject</p>
                                <p className="text-sm font-semibold text-slate-200">{assignment.subject || 'Not specified'}</p>
                            </div>
                        </div>

                        {/* Deadline */}
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-400/20 transition-colors">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deadline</p>
                                <p className="text-sm font-semibold text-slate-200">
                                    {assignment.deadline ? format(new Date(assignment.deadline), 'MMM d, yyyy') : 'No deadline'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        {/* Status Badge */}
                        <div className="p-4 rounded-3xl bg-slate-800/30 border border-slate-700/50 h-full flex flex-col justify-center">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">Current Status</p>
                            <div className={`px-4 py-2.5 rounded-2xl text-center text-xs font-bold uppercase tracking-widest ${statusColors[assignment.status]}`}>
                                {assignment.status.replace('_', ' ')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description Section */}
                {assignment.description && (
                    <div className="mb-10 relative">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Description</p>
                        <div className="p-5 rounded-3xl bg-slate-800/40 border border-slate-700/50 text-slate-300 text-sm leading-relaxed italic">
                            "{assignment.description}"
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="relative pt-6 border-t border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-5">Update Progress</p>
                    <div className="grid grid-cols-3 gap-3">
                        {['pending', 'in_progress', 'completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => handleStatusClick(status)}
                                className={`py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${assignment.status === status
                                        ? statusButtonColors[status]
                                        : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
                                    }`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
