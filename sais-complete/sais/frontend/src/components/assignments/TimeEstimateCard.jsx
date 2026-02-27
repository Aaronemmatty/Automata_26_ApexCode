import { Clock, BookOpen, Zap, Target, TrendingUp } from 'lucide-react'

export default function TimeEstimateCard({ estimate }) {
  if (!estimate) return null

  const getComplexityColor = (complexity) => {
    const colors = {
      simple: 'text-green-400 bg-green-400/10 border-green-400/30',
      medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      complex: 'text-red-400 bg-red-400/10 border-red-400/30'
    }
    return colors[complexity] || colors.medium
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.6) return 'text-amber-400'
    return 'text-slate-400'
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center">
            <Clock size={20} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Time Estimate</h3>
            <p className="text-xs text-slate-500">AI-powered analysis</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold text-amber-400">
            {estimate.estimated_hours}
            <span className="text-lg text-slate-500 font-normal">h</span>
          </div>
          <div className="text-xs text-slate-500">
            ~{estimate.estimated_minutes} minutes
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
          <BookOpen size={16} className="text-blue-400" />
          <div className="flex-1">
            <p className="text-sm text-slate-300">Reading Time</p>
          </div>
          <span className="text-sm font-medium text-blue-400">
            {estimate.reading_time_minutes} min
          </span>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
          <Zap size={16} className="text-amber-400" />
          <div className="flex-1">
            <p className="text-sm text-slate-300">Work Time</p>
          </div>
          <span className="text-sm font-medium text-amber-400">
            {estimate.work_time_minutes} min
          </span>
        </div>

        {estimate.question_count > 0 && (
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
            <Target size={16} className="text-purple-400" />
            <div className="flex-1">
              <p className="text-sm text-slate-300">Questions/Problems</p>
            </div>
            <span className="text-sm font-medium text-purple-400">
              {estimate.question_count}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border ${getComplexityColor(estimate.complexity)}`}>
          {estimate.complexity} complexity
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          {estimate.task_type}
        </span>
        {estimate.has_mathematical_content && (
          <span className="inline-flex items-center px-2 py-1.5 rounded-lg text-xs bg-blue-400/10 text-blue-400">
            📐 Math
          </span>
        )}
        {estimate.has_code_content && (
          <span className="inline-flex items-center px-2 py-1.5 rounded-lg text-xs bg-green-400/10 text-green-400">
            💻 Code
          </span>
        )}
      </div>

      {estimate.recommended_sessions && (
        <div className="p-3 bg-blue-400/5 border border-blue-400/20 rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingUp size={14} className="text-blue-400 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-400 mb-1">
                💡 Recommendation
              </p>
              <p className="text-xs text-blue-300">
                {estimate.recommended_sessions.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Confidence</span>
          <span className={`font-medium ${getConfidenceColor(estimate.confidence_score)}`}>
            {(estimate.confidence_score * 100).toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-green-400 transition-all duration-500"
            style={{ width: `${estimate.confidence_score * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
