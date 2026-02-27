import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import client from '../../api/client'
import toast from 'react-hot-toast'

const CLASSROOM_COURSES_KEY = 'sais_classroom_courses'
const CLASSROOM_EVENTS_KEY = 'sais_classroom_events'
const CLASSROOM_LAST_SYNC_KEY = 'sais_classroom_last_sync'

export default function ClassroomDashboardPage() {
  const [courses, setCourses] = useState([])
  const [events, setEvents] = useState([])
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [loading, setLoading] = useState(false)
  const location = useLocation()

  useEffect(() => {
    try {
      const cachedCourses = localStorage.getItem(CLASSROOM_COURSES_KEY)
      const cachedEvents = localStorage.getItem(CLASSROOM_EVENTS_KEY)
      const cachedLastSync = localStorage.getItem(CLASSROOM_LAST_SYNC_KEY)

      if (cachedCourses) {
        setCourses(JSON.parse(cachedCourses))
      }
      if (cachedEvents) {
        setEvents(JSON.parse(cachedEvents))
      }
      if (cachedLastSync) {
        const parsed = Number(cachedLastSync)
        if (Number.isFinite(parsed) && parsed > 0) {
          setLastSyncedAt(parsed)
        }
      }
    } catch {
      localStorage.removeItem(CLASSROOM_COURSES_KEY)
      localStorage.removeItem(CLASSROOM_EVENTS_KEY)
      localStorage.removeItem(CLASSROOM_LAST_SYNC_KEY)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('connected') === '1') {
      toast.success('Google Classroom connected')
    }
  }, [location.search])

  async function connectGoogle() {
    try {
      const token = localStorage.getItem('sais_token')
      if (!token) {
        toast.error('Please login first')
        return
      }
      const apiBase = (client.defaults.baseURL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')
      const apiOrigin = new URL(apiBase).origin
      window.location.href = `${apiOrigin}/auth/google/connect?token=${encodeURIComponent(token)}`
    } catch {
      toast.error('Failed to start Google OAuth')
    }
  }

  const loadClassroom = useCallback(async ({ silent = false } = {}) => {
    setLoading(true)
    try {
      const [coursesResp, eventsResp] = await Promise.all([
        client.get('/classroom/courses'),
        client.get('/classroom/events'),
      ])
      const nextCourses = coursesResp.data || []
      const nextEvents = eventsResp.data || []
      const syncedAt = Date.now()
      setCourses(nextCourses)
      setEvents(nextEvents)
      setLastSyncedAt(syncedAt)
      localStorage.setItem(CLASSROOM_COURSES_KEY, JSON.stringify(nextCourses))
      localStorage.setItem(CLASSROOM_EVENTS_KEY, JSON.stringify(nextEvents))
      localStorage.setItem(CLASSROOM_LAST_SYNC_KEY, String(syncedAt))
    } catch (error) {
      if (!silent) {
        toast.error(error.response?.data?.detail || 'Failed to load Classroom data')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClassroom({ silent: true })
  }, [loadClassroom])

  const assignments = useMemo(() => {
    const isNineAClassroom = (courseName) => {
      const text = String(courseName || '').toLowerCase().trim()
      return text.includes('9a classroom') || text === '9a'
    }

    return events.filter((event) => event.type === 'Assignment' && !isNineAClassroom(event.course))
  }, [events])
  const categorizedAssignments = useMemo(() => {
    const assignedWithDueDate = []
    const assignedWithoutDueDate = []
    const submitted = []
    const missing = []

    const now = Date.now()
    const isNineAClassroom = (courseName) => {
      const text = String(courseName || '').toLowerCase().trim()
      return text.includes('9a classroom') || text === '9a'
    }

    const getEffectiveDueDate = (assignment) => {
      if (isNineAClassroom(assignment.course)) return null
      return assignment.due_date || null
    }

    const toTs = (value) => {
      if (!value) return null
      const ts = new Date(value).getTime()
      return Number.isFinite(ts) ? ts : null
    }

    const deriveStatus = (assignment) => {
      const explicit = (assignment.submission_status || '').toLowerCase()
      if (['assigned', 'submitted', 'late_submit', 'missing'].includes(explicit)) {
        return explicit
      }

      const state = (assignment.submission_state || '').toUpperCase()
      const dueTs = toTs(getEffectiveDueDate(assignment))
      const isPastDue = dueTs ? dueTs < now : false

      if (state === 'TURNED_IN' || state === 'RETURNED') return 'submitted'
      if (state === 'RECLAIMED_BY_STUDENT') return isPastDue ? 'missing' : 'assigned'
      if (state === 'NEW' || state === 'CREATED') return isPastDue ? 'missing' : 'assigned'
      return 'assigned'
    }

    const sortByDueThenPosted = (items) => items.sort((a, b) => {
      const aDue = toTs(a.due_date) ?? Number.MAX_SAFE_INTEGER
      const bDue = toTs(b.due_date) ?? Number.MAX_SAFE_INTEGER
      if (aDue !== bDue) return aDue - bDue
      const aPosted = toTs(a.posted_at) ?? 0
      const bPosted = toTs(b.posted_at) ?? 0
      return bPosted - aPosted
    })

    const sortByPostedDesc = (items) => items.sort((a, b) => {
      const aPosted = toTs(a.posted_at) ?? 0
      const bPosted = toTs(b.posted_at) ?? 0
      return bPosted - aPosted
    })

    const sortByMissingPriority = (items) => items.sort((a, b) => {
      const aDue = toTs(a.due_date) ?? 0
      const bDue = toTs(b.due_date) ?? 0
      return bDue - aDue
    })

    for (const assignment of assignments) {
      const status = deriveStatus(assignment)

      if (status === 'submitted' || status === 'late_submit') {
        submitted.push(assignment)
      } else if (status === 'missing') {
        missing.push(assignment)
      } else if (getEffectiveDueDate(assignment)) {
        assignedWithDueDate.push(assignment)
      } else {
        assignedWithoutDueDate.push(assignment)
      }
    }

    sortByDueThenPosted(assignedWithDueDate)
    sortByPostedDesc(assignedWithoutDueDate)
    sortByPostedDesc(submitted)
    sortByMissingPriority(missing)

    return {
      assignedWithDueDate,
      assignedWithoutDueDate,
      submitted,
      missing,
    }
  }, [assignments])

  const assignmentGroups = useMemo(() => ([
    { key: 'assignedWithDueDate', title: 'Assigned With Due Date', items: categorizedAssignments.assignedWithDueDate },
    { key: 'assignedWithoutDueDate', title: 'Assigned Without Due Date', items: categorizedAssignments.assignedWithoutDueDate },
    { key: 'submitted', title: 'Submitted', items: categorizedAssignments.submitted },
    { key: 'missing', title: 'Missing', items: categorizedAssignments.missing },
  ]), [categorizedAssignments])

  const lastSyncedLabel = useMemo(() => {
    if (!lastSyncedAt) return 'Not synced yet'
    return new Date(lastSyncedAt).toLocaleString()
  }, [lastSyncedAt])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl text-white mb-2">Google Classroom</h1>
      <p className="text-slate-400 mb-6">Connect Google and view your courses, assignments, announcements.</p>

      <div className="flex gap-3 mb-6">
        <button onClick={connectGoogle} className="px-4 py-2 bg-amber-400 text-slate-900 rounded-xl font-semibold hover:bg-amber-300">
          Connect Google Classroom
        </button>
        <button onClick={loadClassroom} disabled={loading} className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl hover:bg-slate-700 disabled:opacity-50">
          {loading ? 'Syncing...' : 'Sync Data'}
        </button>
      </div>
      <p className="text-slate-500 text-sm mb-6">Last synced: {lastSyncedLabel}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-3">Courses</h2>
          <div className="space-y-2">
            {courses.map((course) => (
              <div key={course.id} className="p-3 bg-slate-800/70 rounded-lg text-sm text-slate-200">
                {course.name}
              </div>
            ))}
            {!courses.length && <p className="text-slate-500 text-sm">No courses loaded.</p>}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-3">Assignments</h2>
          <div className="space-y-4">
            {assignmentGroups.map((group) => (
              <div key={group.key} className="border border-slate-800 rounded-xl p-3 bg-slate-900/60">
                <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  {group.title} ({group.items.length})
                </p>
                <div className="space-y-2">
                  {group.items.map((event, idx) => (
                    <div key={`${group.key}-${event.title}-${idx}`} className="p-3 bg-slate-800/70 rounded-lg text-sm">
                      <p className="text-slate-200 font-medium">{event.title}</p>
                      <p className="text-slate-400 text-xs">{event.course}</p>
                      <p className="text-slate-400 text-xs">Posted: {event.posted_at ? new Date(event.posted_at).toLocaleDateString() : 'Unknown'}</p>
                      <p className="text-slate-400 text-xs">Due: {(String(event.course || '').toLowerCase().includes('9a classroom') || String(event.course || '').toLowerCase().trim() === '9a') ? 'No due date' : (event.due_date || 'No due date')}</p>
                      {(event.submission_status === 'late_submit' || event.submission_status === 'submitted') && (
                        <p className="text-slate-400 text-xs">Status: {event.submission_status === 'late_submit' ? 'Late submit' : 'Submitted'}</p>
                      )}
                    </div>
                  ))}
                  {!group.items.length && <p className="text-slate-500 text-sm">No items.</p>}
                </div>
              </div>
            ))}

            {!assignments.length && <p className="text-slate-500 text-sm">No assignments loaded.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
