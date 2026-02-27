import { useState, useEffect } from 'react'
import { getActivities, createActivity, deleteActivity, refreshConflicts } from '../api/activities'
import { format } from 'date-fns'
import { Plus, AlertTriangle, X, Trophy, RefreshCw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Sports', 'Cultural', 'Tech Club', 'Volunteer', 'Art', 'Music', 'Other']

function ActivityModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', category: '', activity_date: '', start_time: '', end_time: '', location: '', description: '' })
  const [saving, setSaving] = useState(false)
  async function submit(e) {
    e.preventDefault(); setSaving(true)
    try {
      const cleanForm = Object.fromEntries(
        Object.entries(form).map(([key, val]) => [key, val === '' ? null : val])
      )
      const res = await onSave(cleanForm);
      onClose()
    }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setSaving(false) }
  }
  const inp = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition-all"
  const lbl = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="font-display text-xl text-white">Add Activity</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div><label className={lbl}>Title *</label><input className={inp} required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Activity name" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Category</label>
              <select className={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Select...</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className={lbl}>Date *</label><input className={inp} type="date" required value={form.activity_date} onChange={e => setForm(f => ({ ...f, activity_date: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Start Time</label><input className={inp} type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} /></div>
            <div><label className={lbl}>End Time</label><input className={inp} type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} /></div>
          </div>
          <div><label className={lbl}>Location</label><input className={inp} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Venue / Room" /></div>
          <div><label className={lbl}>Notes</label><textarea className={`${inp} resize-none`} rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-700 rounded-xl text-sm text-slate-400 hover:text-slate-200">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm hover:bg-amber-300 disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function load() { try { const { data } = await getActivities(); setActivities(data) } catch { } }
  useEffect(() => { load() }, [])

  async function handleCreate(form) { await createActivity(form); load(); toast.success('Activity added!') }
  async function handleDelete(id) {
    if (!confirm('Delete activity?')) return
    await deleteActivity(id); load(); toast.success('Deleted')
  }
  async function handleRefresh() {
    setRefreshing(true)
    try { const { data } = await refreshConflicts(); toast.success(`Updated ${data.updated} conflicts`) } catch { toast.error('Failed') }
    finally { setRefreshing(false); load() }
  }

  const conflicts = activities.filter(a => a.has_conflict)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white">Activities</h1>
          <p className="text-slate-400 text-sm mt-1">{activities.length} activities · {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-3 py-2.5 border border-slate-700 rounded-xl text-sm text-slate-400 hover:text-amber-400 hover:border-amber-400/30 transition-all">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Check Conflicts
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 text-slate-900 font-semibold rounded-xl hover:bg-amber-300 transition-all text-sm">
            <Plus size={16} /> Add Activity
          </button>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Schedule Conflicts Detected</p>
            <p className="text-xs text-red-400/70 mt-0.5">{conflicts.length} activit{conflicts.length !== 1 ? 'ies clash' : 'y clashes'} with assignment deadlines.</p>
          </div>
        </div>
      )}

      {activities.length === 0
        ? <div className="py-20 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Trophy size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No activities yet</p>
          <p className="text-slate-500 text-sm mt-1">Add clubs, sports, or events to track them</p>
        </div>
        : <div className="grid grid-cols-3 gap-4">
          {activities.map(a => (
            <div key={a.id} className={`bg-slate-900 border rounded-2xl p-5 ${a.has_conflict ? 'border-red-400/30' : 'border-slate-800'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-white">{a.title}</h3>
                  {a.category && <span className="text-xs text-blue-400 font-medium mt-0.5 block">{a.category}</span>}
                </div>
                <button onClick={() => handleDelete(a.id)} className="text-slate-600 hover:text-red-400 transition-all ml-2"><Trash2 size={14} /></button>
              </div>
              <div className="space-y-1 text-xs text-slate-400 mb-3">
                <p>📅 {a.activity_date ? format(new Date(a.activity_date), 'EEEE, MMM d, yyyy') : 'No date'}</p>
                {(a.start_time || a.end_time) && <p>🕐 {a.start_time || ''}{a.start_time && a.end_time ? ' – ' : ''}{a.end_time || ''}</p>}
                {a.location && <p>📍 {a.location}</p>}
              </div>
              {a.has_conflict && (
                <div className="bg-red-400/10 rounded-lg p-2.5 mt-2">
                  <div className="flex items-center gap-1.5 mb-0.5"><AlertTriangle size={11} className="text-red-400" /><span className="text-xs text-red-400 font-medium">Deadline Conflict</span></div>
                  <p className="text-xs text-red-400/70">{a.conflict_detail}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      }
      {showModal && <ActivityModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
    </div>
  )
}
