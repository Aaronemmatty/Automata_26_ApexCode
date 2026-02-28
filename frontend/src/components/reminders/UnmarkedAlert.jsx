import { AlertTriangle } from 'lucide-react'

export default function UnmarkedAlert({ data }) {
  if (!data || !data.count) return null

  return (
    <div className="bg-red-400/10 border border-red-400/30 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-red-400 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-red-300 font-semibold text-sm mb-1">
            You missed marking attendance for {data.count} class{data.count !== 1 ? 'es' : ''}
          </p>
          <div className="space-y-1">
            {data.classes.map((item) => (
              <p key={`${item.subject_id}-${item.time}`} className="text-xs text-red-200/90">
                {item.subject_name} • {item.time}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
