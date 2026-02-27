/**
 * src/components/ui/Layout.jsx
 * ─────────────────────────────
 * Main shell: dark sidebar + content area.
 * Uses "electric lime on dark slate" aesthetic — editorial/tech hybrid.
 */
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, CheckSquare,
  Calendar, Upload, LogOut, Bell, GraduationCap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import { useAuthStore } from "../../store/authStore";
import { alertsAPI } from "../../lib/api";

const NAV = [
  { to: "/",            icon: LayoutDashboard, label: "Dashboard"   },
  { to: "/assignments", icon: BookOpen,         label: "Assignments" },
  { to: "/attendance",  icon: CheckSquare,      label: "Attendance"  },
  { to: "/activities",  icon: Calendar,         label: "Activities"  },
  { to: "/documents",   icon: Upload,           label: "Documents"   },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => alertsAPI.list().then((r) => r.data),
    refetchInterval: 60_000,
  });

  const unreadCount = alerts?.filter((a) => !a.is_read).length || 0;

  return (
    <div className="flex h-screen bg-slate-950 font-body overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
              <GraduationCap size={20} className="text-ink" />
            </div>
            <div>
              <p className="text-paper font-display font-bold text-base leading-tight">SAIS</p>
              <p className="text-slate-500 text-xs">Academic Intel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150",
                  isActive
                    ? "bg-accent text-ink font-semibold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-paper"
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-2">
          {/* Alert badge */}
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 rounded-xl border border-danger/20">
              <Bell size={15} className="text-danger animate-pulse-slow" />
              <span className="text-danger text-xs font-medium">
                {unreadCount} active alert{unreadCount > 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-paper text-xs font-bold uppercase">
              {user?.full_name?.[0] || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-paper text-xs font-medium truncate">{user?.full_name}</p>
              <p className="text-slate-500 text-[10px] truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-slate-500 hover:text-danger transition-colors"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-slate-950">
        <div className="p-8 max-w-6xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
