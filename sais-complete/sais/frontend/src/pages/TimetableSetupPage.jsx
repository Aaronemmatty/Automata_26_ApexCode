import { useEffect, useMemo, useState } from 'react'
import { Grid3X3, List, Save, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

import TimetableGridView from '../components/timetable/TimetableGridView'
import TimetableListEditor from '../components/timetable/TimetableListEditor'
import UploadTimetable from '../components/timetable/UploadTimetable'
import { getSubjects } from '../api/attendance'
import { bulkSaveTimetableEntries, getTimetableEntries } from '../api/timetable'

export default function TimetableSetupPage() {
  const [view, setView] = useState('grid')
  const [entries, setEntries] = useState([])
  const [subjects, setSubjects] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [{ data: timetable }, { data: subjectList }] = await Promise.all([
          getTimetableEntries(),
          getSubjects(),
        ])
        setEntries(timetable)
        setSubjects(subjectList)
      } catch {
        toast.error('Failed to load timetable data')
      }
    }

    loadData()
  }, [])

  const savePayload = useMemo(
    () => entries.map((entry) => ({
      subject_id: entry.subject_id,
      day_of_week: Number(entry.day_of_week),
      start_time: entry.start_time,
      end_time: entry.end_time,
      room: entry.room || null,
      notes: entry.notes || null,
    })),
    [entries]
  )

  async function handleSave() {
    setSaving(true)
    try {
      await bulkSaveTimetableEntries(savePayload)
      toast.success('Timetable saved successfully')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save timetable')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl text-white mb-1">Weekly Timetable</h1>
            <p className="text-slate-400 text-sm">Manage your class schedule with Gemini-powered extraction</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-900/50 backdrop-blur-md border border-slate-800/50 rounded-lg p-1">
              <button
                onClick={() => setView('grid')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  view === 'grid' ? 'bg-amber-400 text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid3X3 size={16} /> Grid
              </button>
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  view === 'list' ? 'bg-amber-400 text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List size={16} /> List
              </button>
            </div>

            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 font-semibold rounded-xl transition-all shadow-lg shadow-amber-400/20"
            >
              <Upload size={18} /> Upload Timetable
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !entries.length}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl transition-all disabled:opacity-50"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </div>

        {view === 'grid' ? (
          <TimetableGridView entries={entries} />
        ) : (
          <TimetableListEditor entries={entries} subjects={subjects} onChange={setEntries} />
        )}
      </div>

      {showUpload && (
        <UploadTimetable
          onClose={() => setShowUpload(false)}
          onExtracted={(extractedEntries) => {
            setEntries(extractedEntries)
            setShowUpload(false)
          }}
        />
      )}
    </div>
  )
}
