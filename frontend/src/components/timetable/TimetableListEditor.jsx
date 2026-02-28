import { Plus, Trash2 } from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function TimetableListEditor({ entries, subjects, onChange }) {
  function updateEntry(index, key, value) {
    const next = [...entries]
    const current = { ...next[index] }

    if (key === 'subject_id') {
      const selected = subjects.find((s) => String(s.id) === String(value))
      current.subject_id = value
      current.subject_name = selected?.name || current.subject_name
    } else if (key === 'day_of_week') {
      current.day_of_week = Number(value)
    } else {
      current[key] = value
    }

    next[index] = current
    onChange(next)
  }

  function removeEntry(index) {
    const next = entries.filter((_, idx) => idx !== index)
    onChange(next)
  }

  function addEntry() {
    const fallbackSubject = subjects[0]
    if (!fallbackSubject) return

    const next = [...entries, {
      id: `draft-${Date.now()}`,
      subject_id: fallbackSubject.id,
      subject_name: fallbackSubject.name,
      day_of_week: 0,
      start_time: '09:00',
      end_time: '10:00',
      room: '',
      notes: '',
      is_active: true,
    }]
    onChange(next)
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">List Editor</h3>
        <button
          onClick={addEntry}
          disabled={!subjects.length}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-400 text-slate-900 text-sm font-semibold hover:bg-amber-300 transition-all disabled:opacity-50"
        >
          <Plus size={14} /> Add Class
        </button>
      </div>

      {!subjects.length && (
        <p className="text-sm text-amber-400 mb-4">
          Add at least one subject in Attendance first, then you can add timetable rows manually.
        </p>
      )}

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div key={entry.id || index} className="grid grid-cols-1 lg:grid-cols-6 gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/40">
            <select
              value={entry.subject_id || ''}
              onChange={(e) => updateEntry(index, 'subject_id', e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>

            <select
              value={entry.day_of_week}
              onChange={(e) => updateEntry(index, 'day_of_week', e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              {DAYS.map((day, dayIndex) => (
                <option key={day} value={dayIndex}>{day}</option>
              ))}
            </select>

            <input
              type="time"
              value={entry.start_time}
              onChange={(e) => updateEntry(index, 'start_time', e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            />

            <input
              type="time"
              value={entry.end_time}
              onChange={(e) => updateEntry(index, 'end_time', e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            />

            <input
              type="text"
              placeholder="Room"
              value={entry.room || ''}
              onChange={(e) => updateEntry(index, 'room', e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500"
            />

            <button
              onClick={() => removeEntry(index)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {!entries.length && (
          <div className="text-center py-10 text-slate-500 text-sm border border-dashed border-slate-700 rounded-xl">
            No timetable entries yet. Upload a timetable or add classes manually.
          </div>
        )}
      </div>
    </div>
  )
}
