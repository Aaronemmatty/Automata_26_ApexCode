import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { estimateTime } from '../../api/assignments'
import TimeEstimateCard from './TimeEstimateCard'
import toast from 'react-hot-toast'

export default function ManualTimeEstimate() {
  const [text, setText] = useState('')
  const [taskType, setTaskType] = useState('assignment')
  const [loading, setLoading] = useState(false)
  const [estimate, setEstimate] = useState(null)

  async function handleEstimate() {
    if (!text.trim()) {
      toast.error('Please enter some text')
      return
    }

    setLoading(true)
    try {
      const { data } = await estimateTime({
        text,
        task_type: taskType
      })
      setEstimate(data)
    } catch (error) {
      toast.error('Failed to estimate time')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h3 className="font-display text-lg text-white mb-4">
        Estimate Assignment Time
      </h3>

      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-xs text-slate-400 mb-2">
            Task Type
          </label>
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300"
          >
            <option value="assignment">Assignment</option>
            <option value="essay">Essay</option>
            <option value="programming">Programming</option>
            <option value="research">Research</option>
            <option value="problem_set">Problem Set</option>
            <option value="reading">Reading</option>
            <option value="project">Project</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-2">
            Assignment Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste assignment instructions here..."
            rows={8}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder-slate-500"
          />
        </div>

        <button
          onClick={handleEstimate}
          disabled={loading || !text.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Estimate Time with AI
            </>
          )}
        </button>
      </div>

      {estimate && (
        <div className="mt-6">
          <TimeEstimateCard estimate={estimate} />
        </div>
      )}
    </div>
  )
}
