import { CheckCircle2 } from 'lucide-react'

export default function EndOfDaySummary({ data }) {
  if (!data || !data.total_classes) return null

  return (
    <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-2xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={18} className="text-emerald-400 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-emerald-300 font-semibold text-sm mb-1">End of day attendance summary</p>
          <p className="text-xs text-emerald-100/90">
            Total: {data.total_classes} • Marked: {data.marked_classes} • Present: {data.present_count} • Absent: {data.absent_count} • Late: {data.late_count}
          </p>
          {data.unmarked_count > 0 && (
            <p className="text-xs text-amber-300 mt-1">Unmarked remaining: {data.unmarked_count}</p>
          )}
        </div>
      </div>
    </div>
  )
}
