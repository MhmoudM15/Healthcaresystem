import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Activity, LayoutDashboard, Bell, Settings, LogOut, Menu, X,
  Users, AlertTriangle, Clock, CheckCircle, ChevronRight,
  FileText, Send, Loader2, Filter, Search, Eye, MessageSquare,
  Droplets, TrendingUp, Calendar, Stethoscope,
  AlertOctagon, Info,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type AlertType = "diabetes-critical" | "diabetes-moderate";
type AlertStatus = "unread" | "read" | "reviewed";

interface PatientAlert {
  id: string;
  patientName: string;
  patientId: string;
  alertType: AlertType;
  severity: "critical" | "moderate" | "low";
  timestamp: string;
  status: AlertStatus;
  summary: string;
  doctorNotes?: string;
  reportData: {
    // For diabetes alerts
    glucoseData?: {
      avgGlucose: number;
      maxGlucose: number;
      spikeCount: number;
      lastReading: number;
    };
  };
}

const sidebarNav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/doctor", active: true },
  { icon: Users, label: "Patients", path: "/dashboard/doctor/patients", active: false },
];

// ─── Mock Patient Alerts ──────────────────────────────────────────────────────
const initialAlerts: PatientAlert[] = [
  {
    id: "alert-001",
    patientName: "John Anderson",
    patientId: "P-2847",
    alertType: "diabetes-critical",
    severity: "critical",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    status: "unread",
    summary: "Critical glucose spike detected: 248 mg/dL post-meal. Patient experiencing symptoms of hyperglycemia.",
    reportData: {
      glucoseData: {
        avgGlucose: 156,
        maxGlucose: 248,
        spikeCount: 3,
        lastReading: 248,
      },
    },
  },
  {
    id: "alert-003",
    patientName: "Michael Chen",
    patientId: "P-1583",
    alertType: "diabetes-moderate",
    severity: "moderate",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    status: "read",
    summary: "Consistent elevated post-meal glucose levels (avg 165 mg/dL). Pattern suggests dietary adjustment needed.",
    reportData: {
      glucoseData: {
        avgGlucose: 148,
        maxGlucose: 182,
        spikeCount: 5,
        lastReading: 165,
      },
    },
  },
  {
    id: "alert-005",
    patientName: "David Kim",
    patientId: "P-2156",
    alertType: "diabetes-critical",
    severity: "critical",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    status: "read",
    summary: "Severe hypoglycemia event: 52 mg/dL. Patient reported dizziness and confusion.",
    reportData: {
      glucoseData: {
        avgGlucose: 98,
        maxGlucose: 142,
        spikeCount: 1,
        lastReading: 52,
      },
    },
  },
];

// ─── Alert Type Configuration ─────────────────────────────────────────────────
const alertTypeConfig: Record<AlertType, {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
}> = {
  "diabetes-critical": { icon: Droplets, iconBg: "bg-red-50",   iconColor: "text-red-600",   label: "Diabetes Critical" },
  "diabetes-moderate": { icon: Droplets, iconBg: "bg-amber-50", iconColor: "text-amber-600", label: "Diabetes Moderate" },
};

const severityConfig = {
  critical:  { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",   dot: "bg-red-500",    label: "Critical" },
  moderate:  { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200", dot: "bg-amber-500",  label: "Moderate" },
  low:       { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",dot:"bg-emerald-500",label: "Low" },
};

const statusConfig = {
  unread:   { bg: "bg-blue-50",    text: "text-blue-700",   icon: Bell,        label: "Unread" },
  read:     { bg: "bg-slate-50",   text: "text-slate-600",  icon: Eye,         label: "Read" },
  reviewed: { bg: "bg-emerald-50", text: "text-emerald-700",icon: CheckCircle, label: "Reviewed" },
};

// ─── Alert Details Modal ──────────────────────────────────────────────────────
function AlertDetailsModal({
  alert,
  onClose,
  onReview,
}: {
  alert: PatientAlert;
  onClose: () => void;
  onReview: (alertId: string, notes: string) => void;
}) {
  const [notes, setNotes] = useState(alert.doctorNotes || "");
  const [saving, setSaving] = useState(false);

  const handleReview = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    onReview(alert.id, notes);
    setSaving(false);
    onClose();
  };

  const typeConfig = alertTypeConfig[alert.alertType];
  const sevConfig = severityConfig[alert.severity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden z-10 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${typeConfig.iconBg} rounded-2xl flex items-center justify-center`}>
              <typeConfig.icon className={`w-6 h-6 ${typeConfig.iconColor}`} strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                {alert.patientName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-400 text-xs">ID: {alert.patientId}</span>
                <span className="text-slate-300">•</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sevConfig.bg} ${sevConfig.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sevConfig.dot}`} />
                  {sevConfig.label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-7 py-6">

          {/* Alert Summary */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-slate-400" />
              <h4 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Alert Summary</h4>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
              {alert.summary}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(alert.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
              <div className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                {typeConfig.label}
              </div>
            </div>
          </div>

          {/* Report Data */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-slate-400" />
              <h4 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Clinical Data</h4>
            </div>

            {alert.reportData.glucoseData && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-600 text-xs mb-1">Last Reading</p>
                  <p className="text-blue-900 text-2xl" style={{ fontWeight: 800 }}>
                    {alert.reportData.glucoseData.lastReading}
                  </p>
                  <p className="text-blue-600 text-xs">mg/dL</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-slate-600 text-xs mb-1">Avg Glucose (7d)</p>
                  <p className="text-slate-900 text-2xl" style={{ fontWeight: 800 }}>
                    {alert.reportData.glucoseData.avgGlucose}
                  </p>
                  <p className="text-slate-600 text-xs">mg/dL</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="text-slate-600 text-xs mb-1">Peak Glucose</p>
                  <p className="text-slate-900 text-2xl" style={{ fontWeight: 800 }}>
                    {alert.reportData.glucoseData.maxGlucose}
                  </p>
                  <p className="text-slate-600 text-xs">mg/dL</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-600 text-xs mb-1">Spike Events (7d)</p>
                  <p className="text-amber-900 text-2xl" style={{ fontWeight: 800 }}>
                    {alert.reportData.glucoseData.spikeCount}
                  </p>
                  <p className="text-amber-600 text-xs">occurrences</p>
                </div>
              </div>
            )}
          </div>

          {/* Doctor Notes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <h4 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Doctor's Response</h4>
              {alert.status === "reviewed" && (
                <span className="text-xs text-emerald-600 font-semibold">(Sent to Patient)</span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your clinical assessment, recommendations, or instructions for the patient..."
              rows={5}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm resize-none"
              disabled={alert.status === "reviewed"}
            />
            {alert.status === "reviewed" && (
              <p className="text-xs text-slate-500 mt-2">
                This alert was reviewed on {new Date(alert.timestamp).toLocaleDateString()}. Notes have been sent to the patient.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-7 py-5 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          {alert.status !== "reviewed" && (
            <button
              onClick={handleReview}
              disabled={!notes.trim() || saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Mark as Reviewed & Send to Patient
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Alert Card Component ─────────────────────────────────────────────────────
function AlertCard({
  alert,
  onClick,
}: {
  alert: PatientAlert;
  onClick: () => void;
}) {
  const typeConfig = alertTypeConfig[alert.alertType];
  const sevConfig = severityConfig[alert.severity];
  const statConfig = statusConfig[alert.status];

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border ${alert.status === "unread" ? "border-blue-200 shadow-md shadow-blue-100" : "border-slate-100 shadow-sm"} p-5 hover:shadow-lg transition-all cursor-pointer relative`}
    >
      {/* Unread Indicator */}
      {alert.status === "unread" && (
        <div className="absolute top-4 right-4">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 ${typeConfig.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
          <typeConfig.icon className={`w-6 h-6 ${typeConfig.iconColor}`} strokeWidth={1.8} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="text-slate-900 text-sm mb-1" style={{ fontWeight: 700 }}>
                {alert.patientName}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 text-xs">ID: {alert.patientId}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 text-xs">{typeConfig.label}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${sevConfig.bg} ${sevConfig.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sevConfig.dot}`} />
                {sevConfig.label}
              </span>
            </div>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-3 line-clamp-2">
            {alert.summary}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(alert.timestamp)}
              </div>
              <div className={`flex items-center gap-1.5 ${statConfig.text}`}>
                <statConfig.icon className="w-3.5 h-3.5" />
                {statConfig.label}
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              View Report
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState<PatientAlert[]>(initialAlerts);
  const [selectedAlert, setSelectedAlert] = useState<PatientAlert | null>(null);
  const [filterStatus, setFilterStatus] = useState<AlertStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = () => { signOut(); navigate("/"); };

  const handleAlertClick = (alert: PatientAlert) => {
    setSelectedAlert(alert);
    // Mark as read if unread
    if (alert.status === "unread") {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alert.id ? { ...a, status: "read" as AlertStatus } : a))
      );
    }
  };

  const handleReview = (alertId: string, notes: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, status: "reviewed" as AlertStatus, doctorNotes: notes }
          : a
      )
    );
    setSelectedAlert(null);
  };

  // Filter and sort alerts
  const filteredAlerts = alerts
    .filter((a) => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
      if (searchQuery && !a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) && !a.patientId.includes(searchQuery)) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by severity first, then by timestamp
      const severityOrder = { critical: 0, moderate: 1, low: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const unreadCount = alerts.filter((a) => a.status === "unread").length;
  const criticalCount = alerts.filter((a) => a.severity === "critical" && a.status !== "reviewed").length;

  return (
    <div className="flex h-screen bg-[#F7F8FC] overflow-hidden">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-slate-800" style={{ fontWeight: 700, fontSize: "1rem" }}>
              Dia<span className="text-blue-600">Check</span>
            </span>
          </Link>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-sm" style={{ fontWeight: 700 }}>
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 text-sm truncate" style={{ fontWeight: 600 }}>{user?.name || "Dr. Sarah Chen"}</p>
              <p className="text-slate-400 text-xs">Physician</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {sidebarNav.map(({ icon: Icon, label, active, path }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              style={{ fontWeight: active ? 600 : 400 }}
              onClick={() => path && navigate(path)}
            >
              <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} strokeWidth={1.8} />
              <span className="flex-1 text-left">{label}</span>
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.8} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-5 flex-shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                <Bell className="w-3.5 h-3.5" />
                {unreadCount} New Alert{unreadCount > 1 ? "s" : ""}
              </div>
            )}
            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-5 py-6">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div>
              <h1 className="text-slate-900 mb-2" style={{ fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.02em" }}>
                Patient Alerts
              </h1>
              <p className="text-slate-500 text-sm">
                Manage and respond to critical patient health notifications
              </p>
            </div>

            {/* ── Stats Cards ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-slate-400 text-xs mb-1">Unread Alerts</p>
                <p className="text-slate-900" style={{ fontWeight: 800, fontSize: "1.8rem", lineHeight: 1 }}>
                  {unreadCount}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertOctagon className="w-5 h-5 text-red-600" strokeWidth={1.8} />
                  </div>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-slate-400 text-xs mb-1">Critical Cases</p>
                <p className="text-slate-900" style={{ fontWeight: 800, fontSize: "1.8rem", lineHeight: 1 }}>
                  {criticalCount}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
                  </div>
                  <Info className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-slate-400 text-xs mb-1">Reviewed Today</p>
                <p className="text-slate-900" style={{ fontWeight: 800, fontSize: "1.8rem", lineHeight: 1 }}>
                  {alerts.filter((a) => a.status === "reviewed").length}
                </p>
              </div>
            </div>

            {/* ── Filters & Search ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by patient name or ID..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                {(["all", "unread", "read", "reviewed"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      filterStatus === status
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Alert List ─────────────────────────────────────────────── */}
            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No alerts match your current filters</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onClick={() => handleAlertClick(alert)} />
                ))
              )}
            </div>

          </div>
        </main>
      </div>

      {/* ── Alert Details Modal ──────────────────────────────────────────── */}
      {selectedAlert && (
        <AlertDetailsModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onReview={handleReview}
        />
      )}
    </div>
  );
}