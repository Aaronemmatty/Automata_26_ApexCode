import { CheckCircle, Circle, Sun } from 'lucide-react'

export default function MorningCheckin({ data }) {
  if (!data || !data.classes?.length) return null

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-400/10 via-orange-400/10 to-amber-400/10 backdrop-blur-md border border-amber-400/30 rounded-2xl p-5 mb-6">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-orange-400/5 blur-2xl" />

      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/20">
          <Sun size={22} className="text-slate-900" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold mb-1 text-lg">Morning Check-in</h3>
          <p className="text-amber-100/80 text-sm mb-3">
            You have {data.total} class{data.total !== 1 ? 'es' : ''} today • {data.marked}/{data.total} marked
          </p>

          <div className="space-y-2">
            {data.classes.map((cls) => (
              <div key={`${cls.subject_id}-${cls.start_time}`} className="flex items-center justify-between p-3 bg-slate-900/30 backdrop-blur-sm rounded-lg border border-slate-800/30">
                <div className="flex items-center gap-3">
                  {cls.is_marked ? (
                    <CheckCircle size={16} className="text-emerald-400" />
                  ) : (
                    <Circle size={16} className="text-slate-500" />
                  )}
                  <div>
                    <p className="text-white font-medium text-sm">{cls.subject_name}</p>
                    <p className="text-xs text-slate-400">{cls.start_time} - {cls.end_time}{cls.room ? ` • ${cls.room}` : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
