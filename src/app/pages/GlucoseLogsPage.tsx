import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Activity, LayoutDashboard, Droplets, Utensils,
  Bell, Settings, LogOut, Menu, X, Calendar,
  Clock, Plus, Trash2,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Minus,
  Loader2, Brain, Info,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type MeasurementContext = "fasting" | "after-meal" | "before-sleep" | "random";
type ConditionStatus = "Critical" | "Mid" | "Low";
type Phase = "logging" | "analyzing";

interface GlucoseEntry {
  id: string;
  date: string;
  time: string;
  value: number;
  context: MeasurementContext;
  notes: string;
}

interface AIResult {
  riskLevel: ConditionStatus;
  riskScore: number;
  avgGlucose: number;
  maxGlucose: number;
  minGlucose: number;
  spikeCount: number;
  narrative: string[];
  recommendations: { icon: string; text: string }[];
}

const ctxConfig: Record<MeasurementContext, { label: string; color: string; bg: string }> = {
  fasting:        { label: "Fasting",       color: "text-blue-700",   bg: "bg-blue-50" },
  "after-meal":   { label: "After Meal",    color: "text-amber-700",  bg: "bg-amber-50" },
  "before-sleep": { label: "Before Sleep",  color: "text-purple-700", bg: "bg-purple-50" },
  random:         { label: "Random",        color: "text-slate-600",  bg: "bg-slate-100" },
};

const sidebarNav = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard/patient" },
  { icon: Droplets,        label: "Glucose Logs", path: "/dashboard/patient/glucose", active: true },
  { icon: Utensils,        label: "Meal Logs",    path: "/dashboard/patient/meals" },
  { icon: Settings,        label: "Settings",     path: "/dashboard/patient/settings" },
];

// ─── Pre-populated sample entries ─────────────────────────────────────────────
const sampleGlucose: GlucoseEntry[] = [
  { id: "g1", date: "2026-05-01", time: "07:30", value: 112, context: "fasting",     notes: "Feeling slightly tired" },
  { id: "g2", date: "2026-05-01", time: "10:00", value: 148, context: "after-meal",  notes: "" },
  { id: "g3", date: "2026-04-30", time: "07:20", value: 105, context: "fasting",     notes: "" },
  { id: "g4", date: "2026-04-30", time: "13:45", value: 162, context: "after-meal",  notes: "Had rice for lunch" },
];

// ─── AI Analysis generator ────────────────────────────────────────────────────
function generateAI(gEntries: GlucoseEntry[]): AIResult {
  const vals = gEntries.map((e) => e.value);
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  const max = vals.length ? Math.max(...vals) : 0;
  const min = vals.length ? Math.min(...vals) : 0;
  const spikes = vals.filter((v) => v > 140).length;
  const postMeal = gEntries.filter((e) => e.context === "after-meal").map((e) => e.value);
  const fasting  = gEntries.filter((e) => e.context === "fasting").map((e) => e.value);

  let riskLevel: ConditionStatus;
  let riskScore: number;
  if (avg >= 140 || max >= 200 || spikes >= 2) {
    riskLevel = "Critical"; riskScore = Math.min(95, 65 + spikes * 8);
  } else if (avg >= 110 || max >= 140 || (fasting.length && fasting[0] > 100)) {
    riskLevel = "Mid"; riskScore = Math.min(59, 38 + (avg - 100) * 0.6);
  } else {
    riskLevel = "Low"; riskScore = Math.max(8, 20 + (avg > 90 ? 10 : 0));
  }

  const narrative: string[] = [];
  if (vals.length === 0) {
    narrative.push("No glucose readings submitted. Add at least one reading to receive a meaningful analysis.");
  } else {
    const fastingNote = fasting.length
      ? fasting[0] > 126
        ? `Your fasting glucose of ${fasting[0]} mg/dL is above the diabetic threshold (≥126 mg/dL), indicating poor overnight glucose control.`
        : fasting[0] > 100
        ? `Your fasting glucose of ${fasting[0]} mg/dL falls in the pre-diabetic range (100–125 mg/dL). This warrants monitoring.`
        : `Your fasting glucose of ${fasting[0]} mg/dL is within the healthy range. Good overnight control.`
      : null;
    if (fastingNote) narrative.push(fastingNote);
    const postNote = postMeal.length
      ? postMeal.some((v) => v > 180)
        ? `Post-meal readings exceeded 180 mg/dL — this indicates significant post-prandial hyperglycemia. Review your meal carbohydrate content.`
        : postMeal.some((v) => v > 140)
        ? `Post-meal glucose peaked at ${Math.max(...postMeal)} mg/dL. Levels above 140 mg/dL two hours after eating may suggest impaired glucose tolerance.`
        : `Post-meal glucose remained under 140 mg/dL — a positive sign of adequate insulin response.`
      : null;
    if (postNote) narrative.push(postNote);
    narrative.push(
      spikes >= 3
        ? `You recorded ${spikes} glucose spikes above 140 mg/dL. This pattern is a strong indicator to review your medication and diet with your doctor.`
        : spikes > 0
        ? `You had ${spikes} reading${spikes > 1 ? "s" : ""} above 140 mg/dL. Monitoring trends over several days will help identify the trigger.`
        : `All readings were within or near the normal range. Continue logging consistently to spot any emerging trends.`
    );
  }

  const recommendations: { icon: string; text: string }[] = [];
  if (riskLevel === "Critical") {
    recommendations.push(
      { icon: "🏥", text: "Contact your doctor or healthcare provider today to review these readings." },
      { icon: "💊", text: "Review your medication schedule — do not adjust dosages without medical guidance." },
      { icon: "🚫", text: "Avoid high-glycaemic foods: white bread, sugary drinks, sweets, and processed carbs." },
    );
  } else if (riskLevel === "Mid") {
    recommendations.push(
      { icon: "🥗", text: "Swap refined carbs for complex ones: brown rice, quinoa, oats, and legumes." },
      { icon: "🚶", text: "A brisk 20-minute walk after meals can lower post-meal glucose by 10–20 mg/dL." },
      { icon: "📅", text: "Log glucose for 7 consecutive days to identify time-of-day patterns." },
    );
  } else {
    recommendations.push(
      { icon: "✅", text: "Your glucose control looks good. Keep maintaining your current diet and activity routine." },
      { icon: "💧", text: "Stay well-hydrated — 8 glasses of water daily supports kidney glucose excretion." },
      { icon: "😴", text: "Consistent sleep (7–8 hours) helps regulate cortisol and dawn-effect glucose spikes." },
    );
  }
  recommendations.push({ icon: "📊", text: "Log glucose daily for at least 2 weeks to establish accurate patterns for your doctor." });
  return { riskLevel, riskScore, avgGlucose: avg, maxGlucose: max, minGlucose: min, spikeCount: spikes, narrative, recommendations };
}

function glucoseColor(v: number) {
  if (v >= 180) return { text: "text-red-600",    bg: "bg-red-50",    border: "border-red-200" };
  if (v >= 140) return { text: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200" };
  if (v < 70)   return { text: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" };
  return           { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" };
}

function glucoseTrend(v: number): { icon: React.ElementType; color: string } {
  if (v > 140) return { icon: ArrowUpRight,   color: "text-red-400" };
  if (v < 70)  return { icon: ArrowDownRight, color: "text-blue-400" };
  return              { icon: Minus,          color: "text-emerald-400" };
}

const riskConfig = {
  Critical: { bg: "bg-red-50",     border: "border-red-200",    text: "text-red-700",    dot: "bg-red-500",    label: "Critical Risk",  grad: "from-red-600 to-rose-600" },
  Mid:      { bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-700",  dot: "bg-amber-500",  label: "Moderate Risk",  grad: "from-amber-500 to-orange-500" },
  Low:      { bg: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-700",dot: "bg-emerald-500",label: "Low Risk",        grad: "from-emerald-500 to-teal-500" },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GlucoseLogsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [gForm, setGForm] = useState({ date: today, time: nowTime, value: "", context: "fasting" as MeasurementContext, notes: "" });
  const [gErr, setGErr] = useState("");
  const [glucoseEntries, setGlucoseEntries] = useState<GlucoseEntry[]>(sampleGlucose);
  const [phase, setPhase] = useState<Phase>("logging");
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const handleSignOut = () => { signOut(); navigate("/"); };
  const updateG = (k: string, v: string) => setGForm((f) => ({ ...f, [k]: v }));

  const addGlucose = () => {
    const val = parseFloat(gForm.value);
    if (!gForm.value || isNaN(val)) { setGErr("Please enter a valid glucose value."); return; }
    if (val < 20 || val > 600) { setGErr("Value must be between 20 and 600 mg/dL."); return; }
    setGErr("");
    setGlucoseEntries((prev) => [
      { id: `g${Date.now()}`, date: gForm.date, time: gForm.time, value: val, context: gForm.context, notes: gForm.notes },
      ...prev,
    ]);
    setGForm((f) => ({ ...f, value: "", notes: "", time: new Date().toTimeString().slice(0, 5) }));
  };

  const removeGlucose = (id: string) => setGlucoseEntries((p) => p.filter((e) => e.id !== id));

  const handleAnalyze = async () => {
    if (glucoseEntries.length === 0) return;
    setPhase("analyzing");
    await new Promise((r) => setTimeout(r, 2000));
    const result = generateAI(glucoseEntries);
    setAiResult(result);
    setPhase("logging");
    setTimeout(() => {
      document.getElementById("glucose-ai-result")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // ─── Sidebar ──────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
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
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm" style={{ fontWeight: 700 }}>
            {user?.name?.charAt(0) ?? "P"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 text-sm truncate" style={{ fontWeight: 600 }}>{user?.name}</p>
            <p className="text-slate-400 text-xs">Patient</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {sidebarNav.map(({ icon: Icon, label, path, active }) => (
          <button
            key={label}
            onClick={() => path ? navigate(path) : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
            style={{ fontWeight: active ? 600 : 400 }}
          >
            <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} strokeWidth={1.8} />
            <span className="flex-1 text-left">{label}</span>
          </button>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-slate-100">
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" strokeWidth={1.8} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  // ─── Analyzing overlay ────────────────────────────────────────────────────
  if (phase === "analyzing") {
    return (
      <div className="flex h-screen bg-[#F7F8FC] overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200 animate-pulse">
              <Brain className="w-9 h-9 text-white" strokeWidth={1.8} />
            </div>
            <h2 className="text-slate-900 mb-2" style={{ fontWeight: 800, fontSize: "1.4rem" }}>Analysing glucose data…</h2>
            <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">Our AI is reviewing your readings to generate a personalised glucose health summary.</p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-600 text-sm font-semibold">Processing {glucoseEntries.length} reading{glucoseEntries.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F7F8FC] overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center gap-3 px-5 flex-shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-slate-500" />
          </button>
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Droplets className="w-4 h-4 text-blue-600" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Glucose Logs</h1>
            <p className="text-slate-400 text-xs">Thursday, May 1, 2026</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => navigate("/dashboard/patient/meals")}
              className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              <Utensils className="w-3.5 h-3.5" /> Switch to Meal Logs
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-5 py-6">
          <div className="max-w-5xl mx-auto space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* ── Glucose Form (left 3 cols) ── */}
              <div className="lg:col-span-3 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-blue-600" strokeWidth={1.8} />
                    </div>
                    <h2 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Add Glucose Reading</h2>
                  </div>

                  {gErr && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl px-3.5 py-2.5 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{gErr}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />Date
                      </label>
                      <input type="date" value={gForm.date} onChange={(e) => updateG("date", e.target.value)} max={today}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />Time
                      </label>
                      <input type="time" value={gForm.time} onChange={(e) => updateG("time", e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1.5 font-semibold">Glucose Value (mg/dL)</label>
                    <input
                      type="number" value={gForm.value}
                      onChange={(e) => { updateG("value", e.target.value); setGErr(""); }}
                      onKeyDown={(e) => e.key === "Enter" && addGlucose()}
                      placeholder="e.g. 96" min={20} max={600}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    {gForm.value && (() => {
                      const v = parseFloat(gForm.value);
                      const c = glucoseColor(v);
                      return (
                        <p className={`text-xs mt-1.5 font-medium ${c.text}`}>
                          {v < 70 ? "⚠ Below normal — possible hypoglycemia" : v > 180 ? "⚠ Critical high — seek medical advice" : v > 140 ? "⚠ Elevated — above post-meal target" : "✓ Within normal range"}
                        </p>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-2 font-semibold">Measurement Context</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["fasting", "after-meal", "before-sleep", "random"] as MeasurementContext[]).map((ctx) => (
                        <button
                          key={ctx}
                          onClick={() => updateG("context", ctx)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all text-left ${gForm.context === ctx ? `border-blue-400 ${ctxConfig[ctx].bg} ${ctxConfig[ctx].color}` : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                        >
                          {ctxConfig[ctx].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1.5 font-semibold">
                      Notes <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={gForm.notes} onChange={(e) => updateG("notes", e.target.value)}
                      placeholder="e.g. felt dizzy, skipped breakfast, exercised beforehand…"
                      rows={2}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                    />
                  </div>

                  <button
                    onClick={addGlucose}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-blue-100"
                  >
                    <Plus className="w-4 h-4" />Add to Log
                  </button>
                </div>

                {/* AI Analysis CTA */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-lg shadow-blue-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-white text-sm" style={{ fontWeight: 700 }}>AI Glucose Analysis</p>
                      <p className="text-blue-200 text-xs mt-0.5">
                        {glucoseEntries.length} reading{glucoseEntries.length !== 1 ? "s" : ""} ready for analysis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={glucoseEntries.length === 0}
                    className="w-full py-3 bg-white hover:bg-blue-50 disabled:bg-white/40 text-blue-700 disabled:text-blue-300 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Brain className="w-4 h-4" />
                    Analyse with AI
                  </button>
                  {glucoseEntries.length === 0 && (
                    <p className="text-blue-300 text-xs text-center mt-2">Add at least one reading to analyse</p>
                  )}
                </div>
              </div>

              {/* ── Glucose Entries List (right 2 cols) ── */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden lg:sticky lg:top-0">
                  <div className="px-5 pt-5 pb-4 border-b border-slate-50">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Logged Readings</h2>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg font-medium">{glucoseEntries.length} total</span>
                    </div>
                    {glucoseEntries.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                          <p className="text-slate-400 text-[10px] mb-0.5">Avg</p>
                          <p className="text-slate-800 text-sm" style={{ fontWeight: 700 }}>{Math.round(glucoseEntries.reduce((s, e) => s + e.value, 0) / glucoseEntries.length)}</p>
                        </div>
                        <div className="bg-red-50 rounded-xl p-2.5 text-center">
                          <p className="text-red-400 text-[10px] mb-0.5">Max</p>
                          <p className="text-red-600 text-sm" style={{ fontWeight: 700 }}>{Math.max(...glucoseEntries.map(e => e.value))}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                          <p className="text-emerald-400 text-[10px] mb-0.5">Min</p>
                          <p className="text-emerald-600 text-sm" style={{ fontWeight: 700 }}>{Math.min(...glucoseEntries.map(e => e.value))}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="max-h-[calc(100vh-330px)] overflow-y-auto">
                    {glucoseEntries.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Droplets className="w-6 h-6 text-blue-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-slate-400 text-sm">No readings logged yet</p>
                        <p className="text-slate-300 text-xs mt-1">Use the form to add your first reading</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {glucoseEntries.map((entry) => {
                          const col = glucoseColor(entry.value);
                          const { icon: TrendIcon, color: trendColor } = glucoseTrend(entry.value);
                          return (
                            <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${col.bg} border ${col.border}`}>
                                <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-sm ${col.text}`} style={{ fontWeight: 700 }}>
                                    {entry.value} <span className="font-normal text-xs text-slate-400">mg/dL</span>
                                  </span>
                                  <button onClick={() => removeGlucose(entry.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${ctxConfig[entry.context].bg} ${ctxConfig[entry.context].color}`}>
                                    {ctxConfig[entry.context].label}
                                  </span>
                                  <span className="text-slate-300 text-xs">{entry.date} · {entry.time}</span>
                                </div>
                                {entry.notes && <p className="text-slate-400 text-xs mt-0.5 truncate">{entry.notes}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Info className="w-3 h-3" />
                      <span>Normal range: 70–140 mg/dL</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── AI Results Panel ── */}
            {aiResult && (
              <div id="glucose-ai-result" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Hero banner */}
                <div className={`bg-gradient-to-r ${riskConfig[aiResult.riskLevel].grad} px-6 py-5`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" strokeWidth={1.8} />
                      </div>
                      <div>
                        <p className="text-white/80 text-xs mb-0.5">AI Glucose Analysis Result</p>
                        <h3 className="text-white" style={{ fontWeight: 800, fontSize: "1.2rem" }}>{riskConfig[aiResult.riskLevel].label}</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white" style={{ fontWeight: 800, fontSize: "2.2rem", lineHeight: 1 }}>{aiResult.riskScore}</p>
                      <p className="text-white/70 text-xs">/ 100 risk score</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Avg Glucose", value: `${aiResult.avgGlucose}`, unit: "mg/dL", color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Peak Glucose", value: `${aiResult.maxGlucose}`, unit: "mg/dL", color: "text-red-600",  bg: "bg-red-50" },
                      { label: "Lowest",       value: `${aiResult.minGlucose}`, unit: "mg/dL", color: "text-emerald-600", bg: "bg-emerald-50" },
                      { label: "Spikes >140",  value: `${aiResult.spikeCount}`, unit: "events", color: "text-amber-600", bg: "bg-amber-50" },
                    ].map((s) => (
                      <div key={s.label} className={`${s.bg} rounded-xl p-3.5 text-center`}>
                        <p className="text-slate-500 text-xs mb-1">{s.label}</p>
                        <p className={`${s.color} text-xl`} style={{ fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{s.unit}</p>
                      </div>
                    ))}
                  </div>

                  {/* Narrative */}
                  <div>
                    <h4 className="text-slate-900 text-sm mb-3" style={{ fontWeight: 700 }}>AI Insights</h4>
                    <div className="space-y-2.5">
                      {aiResult.narrative.map((text, i) => (
                        <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 text-[10px]" style={{ fontWeight: 700 }}>{i + 1}</span>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-slate-900 text-sm mb-3" style={{ fontWeight: 700 }}>Recommendations</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {aiResult.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                          <span className="text-xl flex-shrink-0">{rec.icon}</span>
                          <p className="text-slate-600 text-xs leading-relaxed">{rec.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <p className="text-slate-400 text-xs">Based on {glucoseEntries.length} readings · Generated just now</p>
                    <button onClick={handleAnalyze} className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                      <Brain className="w-3.5 h-3.5" />Re-analyse
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
