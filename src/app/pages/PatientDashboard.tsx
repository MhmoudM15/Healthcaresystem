import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Activity, LayoutDashboard, LineChart, Bell, Settings, LogOut,
  Menu, X, Droplets, Utensils, ShieldAlert, Clock, ChevronRight,
  AlertTriangle, CheckCircle, Info, Loader2, Plus, Calendar,
  Stethoscope, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type ConditionStatus = "Critical" | "Mid" | "Low";
type LogType = "glucose" | "meal" | "blood_check" | "alert";

interface ActivityLog {
  id: number;
  type: LogType;
  title: string;
  detail: string;
  time: string;
  trend?: "up" | "down" | "stable";
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const initialActivity: ActivityLog[] = [
  { id: 1, type: "glucose", title: "Fasting Glucose Logged", detail: "112 mg/dL", time: "Today, 7:30 AM", trend: "up" },
  { id: 2, type: "meal",    title: "Breakfast Logged",       detail: "Oatmeal + fruit · ~65g carbs", time: "Today, 8:10 AM" },
  { id: 3, type: "glucose", title: "Post-meal Glucose",      detail: "148 mg/dL", time: "Today, 10:00 AM", trend: "up" },
  { id: 4, type: "blood_check", title: "Blood Disease Check", detail: "Risk Score: 42 / 100", time: "Yesterday, 3:15 PM" },
  { id: 5, type: "meal",    title: "Lunch Logged",            detail: "Grilled chicken + rice · ~80g carbs", time: "Yesterday, 1:00 PM" },
];

const notifications = [
  { id: 1, type: "doctor",  text: "Dr. Sarah Chen responded to your weekly report.", time: "30 min ago", unread: true },
  { id: 2, type: "alert",   text: "Your post-meal glucose exceeded 140 mg/dL twice this week.", time: "2h ago", unread: true },
  { id: 3, type: "reminder",text: "HbA1c lab test is due in 5 days. Schedule now.", time: "Yesterday", unread: false },
  { id: 4, type: "doctor",  text: "Dr. Chen updated your medication plan.", time: "2 days ago", unread: false },
];

const statusConfig: Record<ConditionStatus, { bg: string; text: string; border: string; dot: string; label: string }> = {
  Critical: { bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200",   dot: "bg-red-500",    label: "Critical" },
  Mid:      { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200", dot: "bg-amber-500",  label: "Mid Risk" },
  Low:      { bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200",dot:"bg-emerald-500", label: "Low Risk" },
};

const sidebarNav = [
  { icon: LayoutDashboard, label: "Dashboard",          path: "/dashboard/patient",              active: true },
  { icon: Droplets,        label: "Glucose Logs",       path: "/dashboard/patient/glucose",      active: false },
  { icon: ShieldAlert,     label: "Blood Disease Check",path: "/dashboard/patient/blood-disease",active: false },
  { icon: Settings,        label: "Settings",           path: "/dashboard/patient/settings",     active: false },
];

// ─── Log Glucose Modal ────────────────────────────────────────────────────────
function LogGlucoseModal({ onClose, onSave }: { onClose: () => void; onSave: (log: ActivityLog) => void }) {
  const [value, setValue] = useState("");
  const [time, setTime] = useState("fasting");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!value) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const num = parseFloat(value);
    const trend: "up" | "down" | "stable" = num > 140 ? "up" : num < 70 ? "down" : "stable";
    onSave({
      id: Date.now(),
      type: "glucose",
      title: `${time.charAt(0).toUpperCase() + time.slice(1)} Glucose Logged`,
      detail: `${value} mg/dL${note ? " · " + note : ""}`,
      time: "Just now",
      trend,
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-slate-900" style={{ fontWeight: 700 }}>Log Glucose</h3>
              <p className="text-slate-400 text-xs">Record your blood glucose reading</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>Glucose Value (mg/dL)</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 96"
              min={20}
              max={600}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
              autoFocus
            />
            {value && (
              <p className={`text-xs mt-1.5 font-medium ${parseFloat(value) < 70 ? "text-blue-600" : parseFloat(value) > 140 ? "text-red-600" : "text-emerald-600"}`}>
                {parseFloat(value) < 70 ? "⚠ Below normal range (hypoglycemia)" : parseFloat(value) > 140 ? "⚠ Above normal range (hyperglycemia)" : "✓ Within normal range"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>Reading Type</label>
            <div className="grid grid-cols-3 gap-2">
              {["fasting", "post-meal", "bedtime"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`py-2 rounded-xl border text-xs font-medium transition-all capitalize ${time === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Before breakfast, felt tired…"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!value || loading}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Reading"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Log Meal Modal ───────────────────────────────────────────────────────────
function LogMealModal({ onClose, onSave }: { onClose: () => void; onSave: (log: ActivityLog) => void }) {
  const [meal, setMeal] = useState("");
  const [carbs, setCarbs] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!meal) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    onSave({
      id: Date.now(),
      type: "meal",
      title: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Logged`,
      detail: `${meal}${carbs ? ` · ~${carbs}g carbs` : ""}`,
      time: "Just now",
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-emerald-600" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-slate-900" style={{ fontWeight: 700 }}>Log Meal</h3>
              <p className="text-slate-400 text-xs">Record what you ate</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>Meal Type</label>
            <div className="grid grid-cols-4 gap-2">
              {["breakfast", "lunch", "dinner", "snack"].map((t) => (
                <button
                  key={t}
                  onClick={() => setMealType(t)}
                  className={`py-2 rounded-xl border text-xs font-medium transition-all capitalize ${mealType === t ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>What did you eat?</label>
            <input
              type="text"
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              placeholder="e.g. Grilled chicken with salad"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>
              Estimated Carbs (g) <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="e.g. 45"
              min={0}
              max={500}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!meal || loading}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Log Meal"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Blood Disease Check Modal ────────────────────────────────────────────────
function BloodCheckModal({ onClose, onSave }: { onClose: () => void; onSave: (log: ActivityLog) => void }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({ hb: "", wbc: "", platelets: "", fatigue: "", bruising: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; level: ConditionStatus } | null>(null);

  const update = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));

  const computeResult = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    // Simple mock scoring
    let score = 20;
    const hb = parseFloat(answers.hb);
    if (hb > 0) { if (hb < 12) score += 25; else if (hb < 13.5) score += 10; }
    if (answers.fatigue === "yes") score += 20;
    if (answers.bruising === "yes") score += 15;
    score = Math.min(score, 100);
    const level: ConditionStatus = score >= 60 ? "Critical" : score >= 35 ? "Mid" : "Low";
    setResult({ score, level });
    setLoading(false);
  };

  const handleFinish = () => {
    if (!result) return;
    onSave({
      id: Date.now(),
      type: "blood_check",
      title: "Blood Disease Check",
      detail: `Risk Score: ${result.score} / 100 · ${result.level} Risk`,
      time: "Just now",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-purple-600" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-slate-900" style={{ fontWeight: 700 }}>Blood Disease Check</h3>
              <p className="text-slate-400 text-xs">Quick screening · 3 questions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        {!result && (
          <div className="flex gap-1.5 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "bg-purple-500" : "bg-slate-100"}`} />
            ))}
          </div>
        )}

        {!result ? (
          <div className="space-y-5">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>
                    Hemoglobin (Hb) level — g/dL <span className="text-slate-400 font-normal">(if known)</span>
                  </label>
                  <input
                    type="number"
                    value={answers.hb}
                    onChange={(e) => update("hb", e.target.value)}
                    placeholder="e.g. 13.5"
                    step={0.1}
                    min={0}
                    max={20}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                    autoFocus
                  />
                  <p className="text-xs text-slate-400 mt-1.5">Normal: ≥12 (women) · ≥13.5 (men) g/dL</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>
                    WBC Count <span className="text-slate-400 font-normal">(×10³/μL, if known)</span>
                  </label>
                  <input
                    type="number"
                    value={answers.wbc}
                    onChange={(e) => update("wbc", e.target.value)}
                    placeholder="e.g. 7.5"
                    step={0.1}
                    min={0}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">Normal range: 4.5 – 11.0 ×10³/μL</p>
                </div>
              </>
            )}

            {step === 2 && (
              <div>
                <label className="block text-sm text-slate-700 mb-3" style={{ fontWeight: 600 }}>
                  Do you experience unusual fatigue or weakness regularly?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["yes", "no"].map((v) => (
                    <button
                      key={v}
                      onClick={() => update("fatigue", v)}
                      className={`py-3.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${answers.fatigue === v ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                    >
                      {v === "yes" ? "Yes, often" : "No / Rarely"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <label className="block text-sm text-slate-700 mb-3" style={{ fontWeight: 600 }}>
                  Do you notice unexplained bruising or bleeding?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["yes", "no"].map((v) => (
                    <button
                      key={v}
                      onClick={() => update("bruising", v)}
                      className={`py-3.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${answers.bruising === v ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                    >
                      {v === "yes" ? "Yes, sometimes" : "No / Rarely"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={computeResult}
                  disabled={loading}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analysing…</> : "Get Results"}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Result */
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${result.level === "Critical" ? "bg-red-100" : result.level === "Mid" ? "bg-amber-100" : "bg-emerald-100"}`}>
              <span className={`text-3xl font-black ${result.level === "Critical" ? "text-red-600" : result.level === "Mid" ? "text-amber-600" : "text-emerald-600"}`}>
                {result.score}
              </span>
            </div>
            <p className="text-slate-500 text-xs mb-1">Risk Score out of 100</p>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 ${statusConfig[result.level].bg} ${statusConfig[result.level].text} border ${statusConfig[result.level].border}`}>
              <span className={`w-2 h-2 rounded-full ${statusConfig[result.level].dot}`} />
              {statusConfig[result.level].label}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {result.level === "Critical"
                ? "Your indicators suggest a potential blood health concern. Please consult your doctor as soon as possible."
                : result.level === "Mid"
                ? "Some indicators are slightly outside normal range. Monitor your symptoms and follow up with your doctor."
                : "Your blood health indicators look within normal ranges. Keep up your healthy habits!"}
            </p>
            <button
              onClick={handleFinish}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Save & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity Icon ────────────────────────────────────────────────────────────
function ActivityIcon({ type }: { type: LogType }) {
  const map: Record<LogType, { icon: React.ElementType; bg: string; color: string }> = {
    glucose:     { icon: Droplets,    bg: "bg-blue-50",   color: "text-blue-500" },
    meal:        { icon: Utensils,    bg: "bg-emerald-50",color: "text-emerald-500" },
    blood_check: { icon: ShieldAlert, bg: "bg-purple-50", color: "text-purple-500" },
    alert:       { icon: AlertTriangle, bg: "bg-red-50",  color: "text-red-500" },
  };
  const { icon: Icon, bg, color } = map[type];
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
      <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.8} />
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function PatientDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState<"glucose" | "meal" | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>(initialActivity);
  const [notifRead, setNotifRead] = useState<number[]>([]);

  const handleSignOut = () => { signOut(); navigate("/"); };

  const addLog = (log: ActivityLog) => {
    setActivity((prev) => [log, ...prev].slice(0, 10));
  };

  const markRead = (id: number) => setNotifRead((r) => [...r, id]);
  const markAllRead = () => setNotifRead(notifications.map((n) => n.id));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const unreadCount = notifications.filter((n) => n.unread && !notifRead.includes(n.id)).length;

  // Latest glucose from activity
  const latestGlucose = activity.find((a) => a.type === "glucose");
  const latestMeal = activity.find((a) => a.type === "meal");
  const latestBlood = activity.find((a) => a.type === "blood_check");

  // Derive condition status from latest glucose
  const conditionStatus: ConditionStatus = latestGlucose
    ? parseFloat(latestGlucose.detail) >= 140
      ? "Critical"
      : parseFloat(latestGlucose.detail) >= 110
      ? "Mid"
      : "Low"
    : "Low";

  // Blood risk score from latest check
  const bloodRiskScore = latestBlood
    ? parseInt(latestBlood.detail.match(/\d+/)?.[0] ?? "42")
    : 42;

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
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm" style={{ fontWeight: 700 }}>
              {user?.name?.charAt(0) ?? "P"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 text-sm truncate" style={{ fontWeight: 600 }}>{user?.name}</p>
              <p className="text-slate-400 text-xs">Patient</p>
            </div>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusConfig[conditionStatus].dot}`} />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {sidebarNav.map(({ icon: Icon, label, active, badge, path }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              style={{ fontWeight: active ? 600 : 400 }}
              onClick={() => path && navigate(path)}
            >
              <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} strokeWidth={1.8} />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span className="bg-red-500 text-white text-xs rounded-full w-[18px] h-[18px] flex items-center justify-center">{badge}</span>
              )}
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal("glucose")}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Quick Log
            </button>
            <div className="relative">
              <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-5 py-6">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* ── Greeting ─────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-slate-900" style={{ fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.02em" }}>
                  {greeting}, {firstName}! 👋
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Here's your health snapshot for today — Thursday, April 30, 2026
                </p>
              </div>
              <div className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm ${statusConfig[conditionStatus].bg} ${statusConfig[conditionStatus].text} ${statusConfig[conditionStatus].border}`} style={{ fontWeight: 600 }}>
                <span className={`w-2 h-2 rounded-full ${statusConfig[conditionStatus].dot}`} />
                {statusConfig[conditionStatus].label}
              </div>
            </div>

            {/* ── Summary Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Latest Glucose */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-blue-500" strokeWidth={1.8} />
                  </div>
                  {latestGlucose?.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4 text-red-400" />
                  ) : latestGlucose?.trend === "down" ? (
                    <ArrowDownRight className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-slate-400 text-xs mb-1">Latest Glucose</p>
                <p className="text-slate-900" style={{ fontWeight: 800, fontSize: "1.6rem", lineHeight: 1 }}>
                  {latestGlucose ? latestGlucose.detail.split(" ")[0] : "—"}
                </p>
                <p className="text-slate-400 text-xs mt-1">{latestGlucose ? latestGlucose.detail.split(" ")[1] || "mg/dL" : "mg/dL"}</p>
                <p className="text-slate-300 text-xs mt-2 truncate">{latestGlucose?.time ?? "No reading yet"}</p>
              </div>

              {/* Last Meal */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Utensils className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-slate-400 text-xs mb-1">Last Meal</p>
                <p className="text-slate-900 text-sm leading-snug" style={{ fontWeight: 700 }}>
                  {latestMeal ? latestMeal.title.replace(" Logged", "") : "Not logged"}
                </p>
                <p className="text-slate-500 text-xs mt-1 line-clamp-1">{latestMeal?.detail ?? "—"}</p>
                <p className="text-slate-300 text-xs mt-2 truncate">{latestMeal?.time ?? "No meal yet"}</p>
              </div>

              {/* Condition Status */}
              <div className={`rounded-2xl p-5 border shadow-sm ${statusConfig[conditionStatus].bg} ${statusConfig[conditionStatus].border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white/60`}>
                    <Activity className={`w-4 h-4 ${statusConfig[conditionStatus].text}`} strokeWidth={1.8} />
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${statusConfig[conditionStatus].dot} animate-pulse`} />
                </div>
                <p className={`text-xs mb-1 ${statusConfig[conditionStatus].text} opacity-70`}>Condition Status</p>
                <p className={`text-xl ${statusConfig[conditionStatus].text}`} style={{ fontWeight: 800 }}>
                  {statusConfig[conditionStatus].label}
                </p>
                <p className={`text-xs mt-1 ${statusConfig[conditionStatus].text} opacity-60`}>
                  Based on recent readings
                </p>
                <p className="text-slate-400 text-xs mt-2">Updated today</p>
              </div>

              {/* Blood Risk Score */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-purple-500" strokeWidth={1.8} />
                  </div>
                  <Info className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-slate-400 text-xs mb-1">Blood Risk Score</p>
                <p className="text-slate-900" style={{ fontWeight: 800, fontSize: "1.6rem", lineHeight: 1 }}>
                  {bloodRiskScore}
                  <span className="text-slate-300 text-base font-normal"> /100</span>
                </p>
                {/* Mini gauge */}
                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${bloodRiskScore >= 60 ? "bg-red-500" : bloodRiskScore >= 35 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${bloodRiskScore}%` }}
                  />
                </div>
                <p className="text-slate-300 text-xs mt-1.5">{latestBlood?.time ?? "Run a check below"}</p>
              </div>
            </div>

            {/* ── Quick Actions ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setModal("glucose")}
                className="group flex flex-col items-center gap-3 bg-white hover:bg-blue-600 border border-slate-100 hover:border-blue-600 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 bg-blue-50 group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                  <Droplets className="w-6 h-6 text-blue-500 group-hover:text-white transition-colors" strokeWidth={1.8} />
                </div>
                <span className="text-slate-700 group-hover:text-white text-sm transition-colors" style={{ fontWeight: 600 }}>Log Glucose</span>
              </button>

              <button
                onClick={() => setModal("meal")}
                className="group flex flex-col items-center gap-3 bg-white hover:bg-emerald-600 border border-slate-100 hover:border-emerald-600 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 bg-emerald-50 group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                  <Utensils className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" strokeWidth={1.8} />
                </div>
                <span className="text-slate-700 group-hover:text-white text-sm transition-colors" style={{ fontWeight: 600 }}>Log Meal</span>
              </button>

              <button
                onClick={() => navigate("/dashboard/patient/blood-disease")}
                className="group flex flex-col items-center gap-3 bg-white hover:bg-purple-600 border border-slate-100 hover:border-purple-600 rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 bg-purple-50 group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-colors">
                  <ShieldAlert className="w-6 h-6 text-purple-500 group-hover:text-white transition-colors" strokeWidth={1.8} />
                </div>
                <span className="text-slate-700 group-hover:text-white text-sm transition-colors" style={{ fontWeight: 600 }}>Blood Disease Check</span>
              </button>
            </div>

            {/* ── Bottom Row: Activity Feed + Notifications ──────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* Recent Activity — 3 cols */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-50">
                  <div>
                    <h2 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Recent Activity</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Last {Math.min(activity.length, 5)} logs</p>
                  </div>
                  <button className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors">View all</button>
                </div>

                <div className="divide-y divide-slate-50">
                  {activity.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                      <ActivityIcon type={log.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 text-sm truncate" style={{ fontWeight: 600 }}>{log.title}</p>
                        <p className="text-slate-400 text-xs truncate mt-0.5">{log.detail}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {log.trend === "up" && <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />}
                        {log.trend === "down" && <ArrowDownRight className="w-3.5 h-3.5 text-blue-400" />}
                        <span className="text-slate-300 text-xs whitespace-nowrap">{log.time}</span>
                      </div>
                    </div>
                  ))}

                  {activity.length === 0 && (
                    <div className="py-10 text-center text-slate-400 text-sm">
                      No activity yet. Use the quick actions above to get started.
                    </div>
                  )}
                </div>
              </div>

              {/* Notifications — 2 cols */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <h2 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Notifications</h2>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                  {notifications.map((notif) => {
                    const isRead = notifRead.includes(notif.id) || !notif.unread;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => markRead(notif.id)}
                        className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors ${!isRead ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-slate-50/60"}`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${notif.type === "doctor" ? "bg-teal-50" : notif.type === "alert" ? "bg-red-50" : "bg-slate-100"}`}>
                          {notif.type === "doctor"
                            ? <Stethoscope className="w-3.5 h-3.5 text-teal-600" strokeWidth={1.8} />
                            : notif.type === "alert"
                            ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" strokeWidth={1.8} />
                            : <Bell className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.8} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${!isRead ? "text-slate-800" : "text-slate-500"}`} style={{ fontWeight: !isRead ? 500 : 400 }}>
                            {notif.text}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span className="text-slate-300 text-xs">{notif.time}</span>
                          </div>
                        </div>
                        {!isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                    );
                  })}
                </div>

                <div className="px-5 py-3 border-t border-slate-50">
                  <button className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors py-1">
                    View all notifications <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {modal === "glucose" && (
        <LogGlucoseModal onClose={() => setModal(null)} onSave={(log) => { addLog(log); }} />
      )}
      {modal === "meal" && (
        <LogMealModal onClose={() => setModal(null)} onSave={(log) => { addLog(log); }} />
      )}
    </div>
  );
}