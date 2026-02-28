import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAssignments } from '../api/assignments'
import { getSummary } from '../api/attendance'
import { getActivities } from '../api/activities'
import { getAlerts, refreshAlerts, markAlertRead } from '../api/alerts'
import { getMorningCheckin, getUnmarkedReminders, getEndOfDaySummary } from '../api/timetable'
import { useAuth } from '../hooks/useAuth'
import {
  format,
  differenceInDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { AlertTriangle, CheckCircle, BookOpen, CalendarCheck, Trophy, Bell, RefreshCw, ChevronRight } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import AlertsWidget from '../components/attendance/AlertsWidget'
import MorningCheckin from '../components/reminders/MorningCheckin'
import UnmarkedAlert from '../components/reminders/UnmarkedAlert'
import EndOfDaySummary from '../components/reminders/EndOfDaySummary'

function StatCard({ title, value, sub, accent, icon: Icon }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function AlertItem({ alert, onRead }) {
  const colors = { critical: 'border-red-400/30 bg-red-400/5 text-red-400', warning: 'border-amber-400/30 bg-amber-400/5 text-amber-400', info: 'border-blue-400/30 bg-blue-400/5 text-blue-400' }
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${colors[alert.severity]} cursor-pointer`} onClick={() => onRead(alert.id)}>
      <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{alert.title}</p>
        <p className="text-xs opacity-80 mt-0.5 line-clamp-2">{alert.message}</p>
      </div>
    </div>
  )
}

function DeadlineItem({ a }) {
  const dateObj = a.deadline ? new Date(a.deadline) : null
  const daysLeft = dateObj && !isNaN(dateObj.getTime()) ? differenceInDays(dateObj, new Date()) : null
  const urgent = daysLeft !== null && daysLeft <= 2
  const dateLabel = dateObj && !isNaN(dateObj.getTime()) ? format(dateObj, 'MMM d') : null
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-800 last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${urgent ? 'bg-red-400' : 'bg-amber-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{a.title}</p>
        <p className="text-xs text-slate-500">
          {a.subject || 'No subject'} · {a.task_type}
          {dateLabel && <span className="ml-1 text-slate-400">· Due {dateLabel}</span>}
        </p>
      </div>
      <span className={`text-xs font-mono font-medium flex-shrink-0 ${urgent ? 'text-red-400' : 'text-amber-400'}`}>
        {daysLeft === null ? 'No date' : daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [summaries, setSummaries] = useState([])
  const [activities, setActivities] = useState([])
  const [alerts, setAlerts] = useState([])
  const [morningCheckin, setMorningCheckin] = useState(null)
  const [unmarkedReminder, setUnmarkedReminder] = useState(null)
  const [endOfDaySummary, setEndOfDaySummary] = useState(null)
  const [academicEvents, setAcademicEvents] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarAnchored, setCalendarAnchored] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Load critical data first (fast endpoints)
    Promise.allSettled([
      getAssignments().then(r => setAssignments(r.data)),
      getSummary().then(r => setSummaries(r.data)),
      getActivities().then(r => setActivities(r.data)),
      getAlerts(true).then(r => setAlerts(r.data)),
    ])

    // Load timetable reminders (secondary priority)
    getMorningCheckin().then(r => setMorningCheckin(r.data)).catch(() => { })
    getUnmarkedReminders().then(r => setUnmarkedReminder(r.data)).catch(() => { })
    getEndOfDaySummary().then(r => setEndOfDaySummary(r.data)).catch(() => { })

    // Defer events loading (slowest endpoint — web scraping)
    const eventsTimer = setTimeout(() => {
      fetch('http://127.0.0.1:8000/events')
        .then((res) => res.json())
        .then((data) => setAcademicEvents(Array.isArray(data) ? data : []))
        .catch(() => setAcademicEvents([]))
    }, 100)
    return () => clearTimeout(eventsTimer)
  }, [])

  useEffect(() => {
    if (calendarAnchored) return

    const today = new Date()
    const candidates = []

    academicEvents.forEach((event) => {
      const raw = String(event?.start || event?.date || '').trim()
      const normalized = raw.length >= 10 ? raw.slice(0, 10) : raw
      if (!normalized) return
      const parsed = new Date(normalized)
      if (!isNaN(parsed.getTime())) candidates.push(parsed)
    })

    assignments.forEach((assignment) => {
      if (!assignment?.deadline) return
      const parsed = new Date(assignment.deadline)
      if (!isNaN(parsed.getTime())) candidates.push(parsed)
    })

    if (candidates.length === 0) return

    let nearest = candidates[0]
    let nearestDelta = Math.abs(candidates[0].getTime() - today.getTime())
    for (let i = 1; i < candidates.length; i += 1) {
      const delta = Math.abs(candidates[i].getTime() - today.getTime())
      if (delta < nearestDelta) {
        nearest = candidates[i]
        nearestDelta = delta
      }
    }

    setCurrentMonth(nearest)
    setCalendarAnchored(true)
  }, [academicEvents, assignments, calendarAnchored])

  async function handleRefreshAlerts() {
    setRefreshing(true)
    try {
      const { data } = await refreshAlerts()
      const fresh = await getAlerts(true)
      setAlerts(fresh.data)
      toast.success(`Generated ${data.generated} new alert${data.generated !== 1 ? 's' : ''}`)
    } catch { toast.error('Failed to refresh alerts') }
    finally { setRefreshing(false) }
  }

  async function handleReadAlert(id) {
    await markAlertRead(id).catch(() => { })
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const avgAttendance = summaries.length
    ? Math.round(summaries.reduce((s, x) => s + x.attendance_percentage, 0) / summaries.length)
    : 0
  const lowAttendance = summaries.filter(s => s.below_threshold).length
  const conflictCount = activities.filter(a => a.has_conflict).length
  const activeAssignments = assignments.filter(a => a.status !== 'completed')
  const assignmentsForPanel = [...activeAssignments].sort((a, b) => {
    const aHasDeadline = Boolean(a.deadline)
    const bHasDeadline = Boolean(b.deadline)

    if (aHasDeadline && bHasDeadline) {
      return new Date(a.deadline) - new Date(b.deadline)
    }
    if (aHasDeadline !== bHasDeadline) {
      return aHasDeadline ? -1 : 1
    }

    return new Date(b.created_at) - new Date(a.created_at)
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const eventsByDate = {}

  function normalizeEventType(event) {
    const typeText = String(event?.type || '').toLowerCase()
    const titleText = String(event?.title || event?.event_name || '').toLowerCase()
    const combined = `${typeText} ${titleText}`

    if (combined.includes('exam') || combined.includes('ese') || combined.includes('mse')) return 'exam'
    if (combined.includes('holiday') || combined.includes('break')) return 'holiday'
    if (combined.includes('semester') || combined.includes('sem')) return 'semester'
    return 'academic'
  }

  academicEvents.forEach((event) => {
    const rawDay = String(event?.start || event?.date || '').trim()
    const day = rawDay.length >= 10 ? rawDay.slice(0, 10) : rawDay
    if (!day) return
    if (!eventsByDate[day]) eventsByDate[day] = []
    eventsByDate[day].push({
      title: event?.title || event?.event_name || 'Academic Event',
      type: normalizeEventType(event),
    })
  })

  assignments.forEach((assignment) => {
    if (!assignment?.deadline) return
    const key = format(new Date(assignment.deadline), 'yyyy-MM-dd')
    if (!eventsByDate[key]) eventsByDate[key] = []
    eventsByDate[key].push({
      title: assignment.title,
      type: 'assignment',
    })
  })

  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  function getEventPillClass(type) {
    if (type === 'assignment') return 'bg-amber-400/15 text-amber-300 border border-amber-400/20'
    if (type === 'exam') return 'bg-red-400/15 text-red-300 border border-red-400/20'
    if (type === 'holiday') return 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/20'
    if (type === 'semester') return 'bg-blue-400/15 text-blue-300 border border-blue-400/20'
    return 'bg-slate-700/60 text-slate-300 border border-slate-600/40'
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'},{' '}
          <span className="text-amber-400">{user?.full_name?.split(' ')[0] || user?.username}</span>
        </h1>
        <p className="text-slate-400 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <MorningCheckin data={morningCheckin} />
      <UnmarkedAlert data={unmarkedReminder} />
      <EndOfDaySummary data={endOfDaySummary} />

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Open Assignments" value={activeAssignments.length} sub="Including new drafts" accent="bg-amber-400/10 text-amber-400" icon={BookOpen} />
        <StatCard title="Avg Attendance" value={`${avgAttendance}%`} sub={lowAttendance > 0 ? `${lowAttendance} subject${lowAttendance > 1 ? 's' : ''} at risk` : 'All good'} accent="bg-emerald-400/10 text-emerald-400" icon={CalendarCheck} />
        <StatCard title="Activities" value={activities.length} sub={conflictCount > 0 ? `${conflictCount} conflict${conflictCount > 1 ? 's' : ''}` : 'No conflicts'} accent="bg-blue-400/10 text-blue-400" icon={Trophy} />
        <StatCard title="Alerts" value={alerts.length} sub="Unread" accent={alerts.length > 0 ? "bg-red-400/10 text-red-400" : "bg-slate-700/50 text-slate-400"} icon={Bell} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Upcoming assignments */}
        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-white">Assignments</h2>
            <Link to="/assignments" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">View all <ChevronRight size={12} /></Link>
          </div>
          {assignmentsForPanel.length === 0
            ? <p className="text-sm text-slate-500 py-6 text-center">No assignments yet</p>
            : <div>{assignmentsForPanel.slice(0, 8).map(a => <DeadlineItem key={a.id} a={a} />)}</div>
          }
        </div>

        {/* Alerts panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-white">AI Alerts</h2>
            <button onClick={handleRefreshAlerts} disabled={refreshing}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-all disabled:opacity-50">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          {alerts.length === 0
            ? <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle size={28} className="text-emerald-400 mb-2" />
              <p className="text-sm text-slate-400">All clear — no alerts right now</p>
            </div>
            : <div className="space-y-2">{alerts.map(a => <AlertItem key={a.id} alert={a} onRead={handleReadAlert} />)}</div>
          }
        </div>

        {/* Attendance bar */}
        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-white">Attendance by Subject</h2>
            <Link to="/attendance" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">Manage <ChevronRight size={12} /></Link>
          </div>
          {summaries.length === 0
            ? <p className="text-sm text-slate-500 py-4 text-center">No subjects tracked yet</p>
            : <div className="space-y-3">
              {summaries.map(s => (
                <div key={String(s.subject_id)}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{s.subject_name}</span>
                    <span className={`font-mono font-medium ${s.below_threshold ? 'text-red-400' : 'text-emerald-400'}`}>{s.attendance_percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${s.below_threshold ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${s.attendance_percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        {/* Attendance Smart Alerts Widget */}
        <div>
          <AlertsWidget />
        </div>

        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-white">Academic Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Prev
              </button>
              <span className="text-sm text-slate-300 min-w-[130px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekdayLabels.map((label) => (
              <div key={label} className="text-xs text-slate-500 text-center py-1">{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsByDate[key] || []
              const isInMonth = isSameMonth(day, monthStart)
              return (
                <div
                  key={key}
                  className={`min-h-[90px] rounded-xl border p-2 ${isInMonth ? 'border-slate-700 bg-slate-800/60' : 'border-slate-800 bg-slate-900/50'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${isInMonth ? 'text-slate-300' : 'text-slate-600'}`}>{format(day, 'd')}</span>
                    {isToday(day) && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event, idx) => (
                      <div key={`${key}-${idx}`} className={`text-[10px] leading-tight px-1.5 py-1 rounded ${getEventPillClass(event.type)}`}>
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Activities */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-white">Activities</h2>
            <Link to="/activities" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">View all <ChevronRight size={12} /></Link>
          </div>
          {activities.length === 0
            ? <p className="text-sm text-slate-500 py-4 text-center">No activities added</p>
            : <div className="space-y-2">
              {activities.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center gap-3 py-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.has_conflict ? 'bg-red-400' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{a.title}</p>
                    <p className="text-xs text-slate-500">{a.activity_date ? format(new Date(a.activity_date), 'MMM d') : 'TBD'}{a.category ? ` · ${a.category}` : ''}</p>
                  </div>
                  {a.has_conflict && <span className="text-xs text-red-400 font-medium flex-shrink-0">Conflict</span>}
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  )
}

