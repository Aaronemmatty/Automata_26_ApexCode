import { Link } from "react-router-dom";
import {
  GraduationCap,
  FileSearch,
  BarChart3,
  School,
  Newspaper,
  Bell,
  LayoutDashboard,
  ArrowRight,
  ChevronRight,
  BookOpen,
  CalendarCheck,
  Activity,
  Brain,
  ShieldAlert,
  Clock,
  TrendingDown,
  AlertTriangle,
  CalendarX,
  Gauge,
  RotateCcw,
  Server,
  Monitor,
  Database,
  Cpu,
  ExternalLink,
  Github,
} from "lucide-react";

/* ─────────────────────── DATA ─────────────────────── */

const NAV_LINKS = ["Features", "Modules", "Risk Insights", "Launch App"];

const CAPABILITIES = [
  {
    icon: FileSearch,
    title: "Assignment Intelligence",
    desc: "Extract tasks, deadlines, question counts, and effort estimates from uploaded documents (PDF/image/doc).",
  },
  {
    icon: BarChart3,
    title: "Attendance Risk Engine",
    desc: "Monitor subject-wise attendance in real time with threshold alerts and recovery planning insights.",
  },
  {
    icon: School,
    title: "Classroom Sync",
    desc: "Connect Google Classroom to sync courses, assignments, posting timelines, and submission statuses.",
  },
  {
    icon: Newspaper,
    title: "Academic Event Ingestion",
    desc: "Pull college notices, exam schedules, holiday calendars, and institutional announcements into one timeline.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    desc: "Detect deadline clustering, missed-submission risk, attendance drop, and scheduling conflicts automatically.",
  },
  {
    icon: LayoutDashboard,
    title: "Unified Dashboard",
    desc: "See assignments, attendance, alerts, activities, and academic calendar signals in one operational view.",
  },
];

const MODULES = [
  {
    title: "Document Analyzer",
    desc: "OCR + NLP extraction for assignment metadata, due dates, and workload context.",
  },
  {
    title: "Classroom Connector",
    desc: "Integrates with Google Classroom and keeps course and assignment data aligned.",
  },
  {
    title: "Attendance Monitor",
    desc: "Tracks attendance health by subject and surfaces low-threshold risk patterns.",
  },
  {
    title: "Activity Planner",
    desc: "Captures non-academic activities and flags deadline/event collisions.",
  },
  {
    title: "Calendar Intelligence",
    desc: "Merges assignment deadlines with college events for practical planning visibility.",
  },
];

const RISKS = [
  {
    icon: Clock,
    title: "Deadline Congestion",
    desc: "Multiple high-effort tasks arriving in a narrow submission window.",
  },
  {
    icon: TrendingDown,
    title: "Attendance Drop",
    desc: "Projected attendance falls below required thresholds in one or more subjects.",
  },
  {
    icon: AlertTriangle,
    title: "Missed Submission Risk",
    desc: "Near-due tasks with low completion likelihood based on current workload.",
  },
  {
    icon: CalendarX,
    title: "Timetable Conflict",
    desc: "Overlap between classes, personal activities, and assessment events.",
  },
  {
    icon: Gauge,
    title: "Exam Pressure Window",
    desc: "Dense exam periods with reduced preparation buffer and high cognitive load.",
  },
  {
    icon: Activity,
    title: "Engagement Decay",
    desc: "Increasing late/missing submission patterns and reduced consistency over time.",
  },
  {
    icon: CalendarCheck,
    title: "Calendar Drift",
    desc: "Institutional event updates not reflected in student planning timelines.",
  },
  {
    icon: RotateCcw,
    title: "Recovery Pressure",
    desc: "Attendance or task recovery becomes difficult within the remaining term schedule.",
  },
];

const API_LANES = [
  {
    icon: Monitor,
    label: "Frontend (:5173)",
    tech: "React + Vite",
    desc: "Serves UI, orchestrates user workflows, and routes API requests.",
  },
  {
    icon: Server,
    label: "Backend API (:8000)",
    tech: "FastAPI + Python",
    desc: "Handles auth, assignments, attendance, documents, alerts, timetable, classroom, and event endpoints.",
  },
  {
    icon: Database,
    label: "Data Layer",
    tech: "PostgreSQL + SQLAlchemy",
    desc: "Stores users, assignments, attendance records, activities, documents, alerts, and integrations.",
  },
  {
    icon: Cpu,
    label: "AI Services",
    tech: "NLP/OCR + Rule Engine",
    desc: "Performs extraction, effort estimation, anomaly detection, and narrative risk analysis.",
  },
];

const FOOTER_LINKS = ["Docs", "GitHub", "Support", "Privacy"];

/* ─────────────────── COMPONENTS ───────────────────── */

function CapabilityCard({ icon: Icon, title, desc }) {
  return (
    <div className="group bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-amber-400/30 transition-all duration-300">
      <div className="w-11 h-11 rounded-xl bg-amber-400/10 flex items-center justify-center mb-4 group-hover:bg-amber-400/20 transition-colors">
        <Icon size={20} className="text-amber-400" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function ModuleCard({ title, desc, idx }) {
  return (
    <div className="group relative bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-amber-400/30 transition-all duration-300">
      <div className="absolute top-5 right-5 text-xs font-mono text-slate-700 group-hover:text-slate-500 transition-colors">
        {String(idx + 1).padStart(2, "0")}
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed mb-4">{desc}</p>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 group-hover:gap-2 transition-all cursor-pointer">
        Learn more <ChevronRight size={12} />
      </span>
    </div>
  );
}

function RiskCard({ icon: Icon, title, desc }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 hover:border-red-400/20 transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={16} className="text-red-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
          <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function ApiLane({ icon: Icon, label, tech, desc }) {
  return (
    <div className="flex items-start gap-4 p-5 bg-slate-900/40 border border-slate-800/60 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-blue-400/10 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-blue-400" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            {tech}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─────────────────── LANDING PAGE ─────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
              <GraduationCap size={18} className="text-slate-900" />
            </div>
            <span className="font-display text-lg text-white tracking-tight">
              SAIS
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.slice(0, 3).map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/\s/g, "-")}`}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {l}
              </a>
            ))}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-semibold rounded-lg transition-all"
            >
              Launch App <ArrowRight size={14} />
            </Link>
          </div>

          {/* Mobile */}
          <Link
            to="/login"
            className="md:hidden inline-flex items-center gap-1 px-3 py-1.5 bg-amber-400 text-slate-900 text-sm font-semibold rounded-lg"
          >
            Launch <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full mb-6">
            <Brain size={14} className="text-amber-400" />
            <span className="text-xs font-medium text-amber-400">
              Academic Intelligence Platform
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white leading-tight mb-6">
            Predict Academic Risk
            <br />
            <span className="text-amber-400">Before It Happens</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-augmented academic planning platform for students and
            institutions. Track assignments, attendance, classroom sync,
            timetable health, and event-driven risk alerts in one place.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold rounded-xl transition-all text-sm"
            >
              Start Tracking <ArrowRight size={16} />
            </Link>
            <a
              href="#api-architecture"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700 hover:border-slate-600 text-slate-300 font-medium rounded-xl transition-all text-sm"
            >
              Read Docs <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES (6 cards) ──────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              Platform Capabilities
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Built for students, educators, and academic teams who want to
              detect workload and performance risks before they escalate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((c) => (
              <CapabilityCard key={c.title} {...c} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE MODULES (5 cards) ──────────────────── */}
      <section id="modules" className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              Core Modules
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Key SAIS engines that power planning, extraction, synchronization,
              and risk analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((m, i) => (
              <ModuleCard key={m.title} idx={i} {...m} />
            ))}
          </div>
        </div>
      </section>

      {/* ── RISK SCENARIOS (8 cards) ────────────────── */}
      <section id="risk-insights" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              Risk Scenarios
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Simulate and monitor realistic academic stress patterns to prevent
              failures before they happen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RISKS.map((r) => (
              <RiskCard key={r.title} {...r} />
            ))}
          </div>
        </div>
      </section>

      {/* ── API / ARCHITECTURE ──────────────────────── */}
      <section id="api-architecture" className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
              Unified Academic Intelligence API Layer
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              All assignment processing, classroom sync, event ingestion, and AI
              risk evaluation flows through one API layer — so each service
              stays independently maintainable and deployable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {API_LANES.map((lane) => (
              <ApiLane key={lane.label} {...lane} />
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE INSIGHTS ────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-blue-400/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BarChart3 size={28} className="text-blue-400" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
            Interactive Academic Insights
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Visualize assignment density, attendance trends, and calendar
            pressure points through clear, real-time academic signal mapping.
          </p>

          {/* Decorative chart placeholder */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex items-end justify-center gap-3 h-40">
              {[40, 65, 50, 80, 55, 90, 70, 85, 45, 75, 60, 95].map((h, i) => (
                <div
                  key={i}
                  className="w-6 rounded-t-md transition-all duration-500"
                  style={{
                    height: `${h}%`,
                    background:
                      h > 75
                        ? "linear-gradient(to top, #f59e0b, #fbbf24)"
                        : "linear-gradient(to top, #334155, #475569)",
                  }}
                />
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-slate-600" /> Normal load
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-amber-400" /> High risk
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI REPORTS ──────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-16 h-16 bg-amber-400/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={28} className="text-amber-400" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
            AI Risk Reports
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Generate downloadable reports with risk summaries, workload
            patterns, attendance outlook, and recommendation highlights.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl sm:text-4xl text-white mb-4">
            Ready to de-risk your academic workflow?
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto mb-10">
            Connect your classroom, upload your documents, and generate
            actionable insights in minutes.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-semibold rounded-xl transition-all text-sm"
            >
              Launch SAIS <ArrowRight size={16} />
            </Link>
            <a
              href="#api-architecture"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-slate-700 hover:border-slate-600 text-slate-300 font-medium rounded-xl transition-all text-sm"
            >
              View API Docs <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="border-t border-slate-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-amber-400" />
            <span className="text-sm text-slate-400">
              SAIS — Smart Academic Intelligence System
            </span>
          </div>
          <div className="flex items-center gap-6">
            {FOOTER_LINKS.map((l) => (
              <a
                key={l}
                href="#"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-600">© 2026 SAIS</p>
        </div>
      </footer>
    </div>
  );
}
