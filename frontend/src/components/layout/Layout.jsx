import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import {
  LayoutDashboard, BookOpen, CalendarCheck, Trophy,
  Upload, LogOut, GraduationCap, Bell, Grid3X3, Newspaper, School, MessageSquare
} from 'lucide-react'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assignments', icon: BookOpen,         label: 'Assignments' },
  { to: '/attendance',  icon: CalendarCheck,    label: 'Attendance' },
  { to: '/activities',  icon: Trophy,           label: 'Activities' },
  { to: '/timetable',   icon: Grid3X3,          label: 'Timetable' },
  { to: '/events',      icon: Newspaper,        label: 'College Events' },
  { to: '/classroom',   icon: School,           label: 'Classroom' },
  { to: '/upload',      icon: Upload,           label: 'Upload Doc' },
  { to: '/chat',        icon: MessageSquare,     label: 'AI Chatbot' },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-400 rounded-lg flex items-center justify-center">
              <GraduationCap size={20} className="text-slate-900" />
            </div>
            <div>
              <p className="font-display text-lg leading-none text-white">SAIS</p>
              <p className="text-xs text-slate-500 mt-0.5">Academic Intelligence</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-slate-900 font-semibold text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.username}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
