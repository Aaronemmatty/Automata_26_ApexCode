import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../api/assignments'
import { getDocuments } from '../api/documents'
import client from '../api/client'
import { format } from 'date-fns'
import { Plus, Trash2, CheckCircle, Clock, AlertCircle, BookOpen, X, Calendar as CalendarIcon, List } from 'lucide-react'
import CalendarView from '../components/assignments/CalendarView'
import toast from 'react-hot-toast'

const TASK_TYPES = ['assignment', 'exam', 'quiz', 'project', 'announcement', 'other']
const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = ['pending', 'in_progress', 'completed', 'overdue']

const typeColors = { assignment: 'bg-blue-400/10 text-blue-400', exam: 'bg-red-400/10 text-red-400', quiz: 'bg-purple-400/10 text-purple-400', project: 'bg-green-400/10 text-green-400', announcement: 'bg-amber-400/10 text-amber-400', other: 'bg-slate-600/30 text-slate-400' }
const statusIcons = { pending: <Clock size={14} />, in_progress: <AlertCircle size={14} />, completed: <CheckCircle size={14} />, overdue: <AlertCircle size={14} /> }
const statusColors = { pending: 'text-amber-400', in_progress: 'text-blue-400', completed: 'text-emerald-400', overdue: 'text-red-400' }

function AssignmentModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', subject: '', task_type: 'assignment', description: '', deadline: '', priority: 'medium' })
  const [saving, setSaving] = useState(false)
  async function submit(e) {
    e.preventDefault(); setSaving(true)
    try {
      const cleanForm = Object.fromEntries(
        Object.entries(form).map(([key, val]) => [key, val === '' ? null : val])
      )
      await onSave(cleanForm)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create')
    } finally { setSaving(false) }
  }
  const inp = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-400 transition-all"
  const lbl = "block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider"
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="font-display text-xl text-white">New Assignment</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div><label className={lbl}>Title *</label><input className={inp} required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Assignment title" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Subject</label><input className={inp} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Physics" /></div>
            <div><label className={lbl}>Deadline</label><input className={inp} type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Type</label>
              <select className={inp} value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}>
                {TASK_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className={lbl}>Priority</label>
              <select className={inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div><label className={lbl}>Description</label><textarea className={`${inp} resize-none`} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes..." /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-700 rounded-xl text-sm text-slate-400 hover:text-slate-200 transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-amber-400 text-slate-900 font-semibold rounded-xl text-sm hover:bg-amber-300 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AssignmentsPage() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [documents, setDocuments] = useState([])
  const [classroomEvents, setClassroomEvents] = useState([])
  const [filter, setFilter] = useState({ status: '', subject: '' })
  const [showModal, setShowModal] = useState(false)
  const [view, setView] = useState('list') // 'list' or 'calendar'

  async function load() {
    const [assignmentsResult, documentsResult] = await Promise.allSettled([
      getAssignments(filter),
      getDocuments(),
    ])

    if (assignmentsResult.status === 'fulfilled') {
      setAssignments(assignmentsResult.value.data || [])
    }
    if (documentsResult.status === 'fulfilled') {
      setDocuments(documentsResult.value.data || [])
    }

    client.get('/classroom/events')
      .then((resp) => setClassroomEvents(resp.data || []))
      .catch(() => setClassroomEvents([]))
  }

  useEffect(() => { load() }, [filter])

  async function handleCreate(form) {
    await createAssignment(form); load(); toast.success('Assignment created!')
  }

  async function handleStatusChange(id, status) {
    await updateAssignment(id, { status }).catch(() => toast.error('Update failed'))
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this assignment?')) return
    await deleteAssignment(id).catch(() => toast.error('Delete failed'))
    load(); toast.success('Deleted')
  }

  const documentCalendarItems = documents
    .map((doc) => {
      const extracted = doc.extracted_data || {}
      const deadline = extracted.deadline
      if (!deadline) return null

      return {
        id: `doc-${doc.id}`,
        sourceDocumentId: doc.id,
        title: extracted.title || doc.original_filename || doc.filename || 'Document deadline',
        subject: extracted.subject || 'Document',
        task_type: extracted.task_type || 'document',
        deadline,
        priority: 'medium',
        status: 'pending',
        sourceType: 'document',
      }
    })
    .filter(Boolean)

  const classroomCalendarItems = classroomEvents
    .filter((event) => event?.type === 'Assignment')
    .map((event, idx) => ({
      id: `classroom-${idx}-${event.title || 'assignment'}`,
      title: event.title || 'Classroom Assignment',
      subject: event.course || 'Google Classroom',
      task_type: 'assignment',
      deadline: event.due_date,
      priority: 'medium',
      status: event.submission_status === 'submitted' ? 'completed' : 'pending',
      classroomSubmissionStatus: event.submission_status || 'assigned',
      classroomSubmissionState: event.submission_state || null,
      link: event.link || null,
      sourceType: 'classroom',
    }))

  const listItems = [...classroomCalendarItems, ...assignments]
  const calendarItems = [...assignments, ...documentCalendarItems, ...classroomCalendarItems].filter((item) => item.deadline)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-white">Assignments</h1>
          <p className="text-slate-400 text-sm mt-1">{listItems.length} total</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${view === 'list'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <List size={14} />
              LIST
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${view === 'calendar'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              <CalendarIcon size={14} />
              CALENDAR
            </button>
          </div>

          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-amber-400 text-slate-900 font-bold rounded-xl hover:bg-amber-300 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Plus size={16} /> New Assignment
          </button>
        </div>
      </div>

      {/* Conditional Rendering */}
      {view === 'list' ? (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-6">
            {['', 'pending', 'in_progress', 'completed', 'overdue'].map(s => (
              <button key={s} onClick={() => setFilter(f => ({ ...f, status: s }))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter.status === s ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {listItems.length === 0
              ? <div className="py-16 text-center"><BookOpen size={32} className="text-slate-600 mx-auto mb-3" /><p className="text-slate-500">No assignments yet</p></div>
              : <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Title', 'Subject', 'Type', 'Estimate', 'Deadline', 'Priority', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listItems.map(a => (
                    <tr key={a.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-all">
                      <td className="px-4 py-3 text-sm text-slate-200 font-medium max-w-xs truncate">{a.title}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{a.subject || '—'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeColors[a.task_type] || typeColors.other}`}>{a.task_type}</span></td>
                      <td className="px-4 py-3">
                        {a.ai_metadata?.time_estimate ? (
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-amber-400" />
                            <span className="text-sm text-slate-300">
                              {a.ai_metadata.time_estimate.estimated_hours}h
                            </span>
                            <span className="text-xs text-slate-500">
                              ({a.ai_metadata.time_estimate.complexity})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-300">{a.deadline ? format(new Date(a.deadline), 'MMM d, yy') : '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-400 capitalize">{a.priority}</td>
                      <td className="px-4 py-3">
                        {a.sourceType === 'classroom' ? (
                          <span className="text-xs font-medium text-slate-300">
                            {(a.classroomSubmissionStatus || 'assigned').replace('_', ' ')}
                          </span>
                        ) : (
                          <select value={a.status} onChange={e => handleStatusChange(a.id, e.target.value)}
                            className={`text-xs font-medium bg-transparent border-0 outline-none cursor-pointer ${statusColors[a.status]}`}>
                            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {a.sourceType === 'classroom' ? (
                          <span className="text-xs text-slate-600">—</span>
                        ) : (
                          <button onClick={() => handleDelete(a.id)} className="text-slate-600 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </div>
        </>
      ) : (
        <CalendarView
          assignments={calendarItems}
          onStatusChange={handleStatusChange}
          onClassroomClick={(assignment) => {
            if (assignment?.link) {
              window.open(assignment.link, '_blank', 'noopener,noreferrer')
            }
          }}
          onDocumentClick={(documentId) => navigate(`/upload?doc=${documentId}`)}
        />
      )}


      {showModal && <AssignmentModal onClose={() => setShowModal(false)} onSave={handleCreate} />}
    </div>
  )
}
