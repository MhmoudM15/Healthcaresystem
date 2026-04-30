import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  Activity, LayoutDashboard, Droplets, Utensils, ShieldAlert,
  LineChart, Bell, Settings, LogOut, Menu, X, Calendar,
  Clock, Plus, Trash2, Search, CheckCircle,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Minus,
  Loader2, Brain, Info,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type MeasurementContext = "fasting" | "after-meal" | "before-sleep" | "random";
type MealType = "breakfast" | "lunch" | "dinner" | "snack";
type ConditionStatus = "Critical" | "Mid" | "Low";
type Phase = "logging" | "analyzing" | "summary";

interface GlucoseEntry {
  id: string;
  date: string;
  time: string;
  value: number;
  context: MeasurementContext;
  notes: string;
}

interface FoodItem {
  name: string;
  carbs: number;
  unit: string;
  custom?: boolean;
}

interface MealEntry {
  id: string;
  mealType: MealType;
  foods: FoodItem[];
  portion: "small" | "medium" | "large";
  carbEstimate: number;
  time: string;
}

interface AIResult {
  riskLevel: ConditionStatus;
  riskScore: number;
  avgGlucose: number;
  maxGlucose: number;
  minGlucose: number;
  spikeCount: number;
  totalCarbs: number;
  narrative: string[];
  recommendations: { icon: string; text: string }[];
}

// ─── Static data ──────────────────────────────────────────────────────────────
const FOOD_DB: FoodItem[] = [
  { name: "White Rice", carbs: 45, unit: "1 cup" },
  { name: "Brown Rice", carbs: 38, unit: "1 cup" },
  { name: "Oatmeal", carbs: 27, unit: "1 cup" },
  { name: "Whole Wheat Bread", carbs: 12, unit: "1 slice" },
  { name: "White Bread", carbs: 14, unit: "1 slice" },
  { name: "Pita Bread", carbs: 33, unit: "1 piece" },
  { name: "Banana", carbs: 27, unit: "1 medium" },
  { name: "Apple", carbs: 25, unit: "1 medium" },
  { name: "Orange", carbs: 15, unit: "1 medium" },
  { name: "Grapes", carbs: 16, unit: "½ cup" },
  { name: "Mango", carbs: 25, unit: "1 cup" },
  { name: "Chicken Breast", carbs: 0, unit: "100g" },
  { name: "Salmon", carbs: 0, unit: "100g" },
  { name: "Eggs (scrambled)", carbs: 2, unit: "2 large" },
  { name: "Whole Milk", carbs: 12, unit: "1 cup" },
  { name: "Greek Yogurt", carbs: 9, unit: "½ cup" },
  { name: "Pasta (cooked)", carbs: 43, unit: "1 cup" },
  { name: "Baked Potato", carbs: 37, unit: "1 medium" },
  { name: "Sweet Potato", carbs: 26, unit: "1 medium" },
  { name: "Lentils (cooked)", carbs: 40, unit: "1 cup" },
  { name: "Black Beans", carbs: 41, unit: "1 cup" },
  { name: "Orange Juice", carbs: 26, unit: "1 cup" },
  { name: "Mixed Green Salad", carbs: 4, unit: "2 cups" },
  { name: "Corn", carbs: 27, unit: "1 cup" },
  { name: "Cereal (cornflakes)", carbs: 24, unit: "1 cup" },
  { name: "Pizza (cheese)", carbs: 36, unit: "1 slice" },
  { name: "Hummus", carbs: 18, unit: "½ cup" },
  { name: "Dates", carbs: 18, unit: "3 pieces" },
  { name: "Flatbread", carbs: 28, unit: "1 piece" },
  { name: "Tuna (canned)", carbs: 0, unit: "100g" },
];

const portionMultiplier = { small: 0.7, medium: 1.0, large: 1.4 };

const ctxConfig: Record<MeasurementContext, { label: string; color: string; bg: string }> = {
  fasting:       { label: "Fasting",       color: "text-blue-700",   bg: "bg-blue-50" },
  "after-meal":  { label: "After Meal",    color: "text-amber-700",  bg: "bg-amber-50" },
  "before-sleep":{ label: "Before Sleep",  color: "text-purple-700", bg: "bg-purple-50" },
  random:        { label: "Random",        color: "text-slate-600",  bg: "bg-slate-100" },
};



const sidebarNav = [
  { icon: LayoutDashboard, label: "Dashboard",          path: "/dashboard/patient" },
  { icon: Droplets,        label: "Glucose Logs",       path: "/dashboard/patient/glucose", active: true },
  { icon: ShieldAlert,     label: "Blood Disease Check",path: "/dashboard/patient/blood-disease" },
  { icon: Settings,        label: "Settings",           path: "/dashboard/patient/settings" },
];

// ─── Pre-populated sample entries ─────────────────────────────────────────────
const sampleGlucose: GlucoseEntry[] = [
  { id: "g1", date: "2026-04-30", time: "07:30", value: 112, context: "fasting",      notes: "Feeling slightly tired" },
  { id: "g2", date: "2026-04-30", time: "10:00", value: 148, context: "after-meal",   notes: "" },
];

const sampleMeals: MealEntry[] = [
  {
    id: "m1",
    mealType: "breakfast",
    foods: [{ name: "Oatmeal", carbs: 27, unit: "1 cup" }, { name: "Banana", carbs: 27, unit: "1 medium" }],
    portion: "medium",
    carbEstimate: 54,
    time: "08:10",
  },
];

// ─── AI Analysis generator ────────────────────────────────────────────────────
function generateAI(gEntries: GlucoseEntry[], mEntries: MealEntry[]): AIResult {
  const vals = gEntries.map((e) => e.value);
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  const max = vals.length ? Math.max(...vals) : 0;
  const min = vals.length ? Math.min(...vals) : 0;
  const spikes = vals.filter((v) => v > 140).length;
  const totalCarbs = Math.round(mEntries.reduce((s, m) => s + m.carbEstimate, 0));

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
    narrative.push("No glucose readings were submitted for today. Log at least one reading to receive a meaningful glucose analysis.");
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
        ? `Post-meal readings exceeded 180 mg/dL — this indicates significant post-prandial hyperglycemia. Review meal carbohydrate content.`
        : postMeal.some((v) => v > 140)
        ? `Post-meal glucose peaked at ${Math.max(...postMeal)} mg/dL. Levels above 140 mg/dL two hours after eating may suggest impaired glucose tolerance.`
        : `Post-meal glucose remained under 140 mg/dL — a positive sign of adequate insulin response.`
      : null;
    if (postNote) narrative.push(postNote);

    narrative.push(
      totalCarbs > 150
        ? `Today's estimated carbohydrate intake of ${totalCarbs}g is high. Reducing refined carbs and spacing meals evenly can significantly flatten glucose spikes.`
        : totalCarbs > 0
        ? `Your estimated carbohydrate intake of ${totalCarbs}g is moderate. Continue balancing complex carbs with protein to maintain stable glucose.`
        : `No meal data submitted. Logging meals alongside glucose readings gives a clearer picture of how food affects your glucose levels.`
    );
  }

  const recommendations: { icon: string; text: string }[] = [];

  if (riskLevel === "Critical") {
    recommendations.push(
      { icon: "🏥", text: "Contact your doctor or healthcare provider today to review these readings." },
      { icon: "💊", text: "Review your current medication schedule — do not adjust dosages without medical guidance." },
      { icon: "🚫", text: "Avoid high-glycaemic foods: white bread, sugary drinks, sweets, and processed carbs." },
    );
  } else if (riskLevel === "Mid") {
    recommendations.push(
      { icon: "🥗", text: "Swap refined carbs for complex ones: brown rice, quinoa, oats, and legumes." },
      { icon: "🚶", text: "A brisk 20-minute walk after meals can lower post-meal glucose by 10–20 mg/dL." },
      { icon: "📅", text: "Log your glucose for 7 consecutive days to identify time-of-day patterns." },
    );
  } else {
    recommendations.push(
      { icon: "✅", text: "Your glucose control looks good today. Keep maintaining your current diet and activity routine." },
      { icon: "💧", text: "Stay well-hydrated — aim for 8 glasses of water daily to support kidney glucose excretion." },
      { icon: "😴", text: "Consistent sleep (7–8 hours) helps regulate cortisol and dawn-effect glucose spikes." },
    );
  }

  recommendations.push({ icon: "📊", text: "Log both glucose and meals daily for at least 2 weeks to establish accurate patterns for your doctor." });

  return { riskLevel, riskScore, avgGlucose: avg, maxGlucose: max, minGlucose: min, spikeCount: spikes, totalCarbs, narrative, recommendations };
}

// ─── Glucose value colour ─────────────────────────────────────────────────────
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



// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GlucoseLogsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Form state
  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);
  const [activeTab, setActiveTab] = useState<"glucose" | "meal">("glucose");

  const [gForm, setGForm] = useState({ date: today, time: nowTime, value: "", context: "fasting" as MeasurementContext, notes: "" });
  const [gErr, setGErr] = useState("");

  const [mForm, setMForm] = useState({
    mealType: "breakfast" as MealType,
    selectedFoods: [] as FoodItem[],
    customText: "",
    foodSearch: "",
    portion: "medium" as "small" | "medium" | "large",
    carbEstimate: "",
  });
  const [foodSearch, setFoodSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mErr, setMErr] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Entries
  const [glucoseEntries, setGlucoseEntries] = useState<GlucoseEntry[]>(sampleGlucose);
  const [mealEntries, setMealEntries] = useState<MealEntry[]>(sampleMeals);
  const [historyTab, setHistoryTab] = useState<"glucose" | "meal">("glucose");

  // ── Phase
  const [phase, setPhase] = useState<Phase>("logging");

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = () => { signOut(); navigate("/"); };

  // ── Glucose form actions
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

  // ── Meal form actions
  const filteredFoods = FOOD_DB.filter(
    (f) => f.name.toLowerCase().includes(foodSearch.toLowerCase()) && !mForm.selectedFoods.find((s) => s.name === f.name)
  ).slice(0, 8);

  const addFood = (food: FoodItem) => {
    const newFoods = [...mForm.selectedFoods, food];
    const total = Math.round(newFoods.reduce((s, f) => s + f.carbs, 0) * portionMultiplier[mForm.portion]);
    setMForm((f) => ({ ...f, selectedFoods: newFoods, carbEstimate: String(total) }));
    setFoodSearch("");
    setShowDropdown(false);
  };

  const removeFood = (name: string) => {
    const newFoods = mForm.selectedFoods.filter((f) => f.name !== name);
    const total = Math.round(newFoods.reduce((s, f) => s + f.carbs, 0) * portionMultiplier[mForm.portion]);
    setMForm((f) => ({ ...f, selectedFoods: newFoods, carbEstimate: newFoods.length ? String(total) : "" }));
  };

  const updatePortion = (portion: "small" | "medium" | "large") => {
    const total = Math.round(mForm.selectedFoods.reduce((s, f) => s + f.carbs, 0) * portionMultiplier[portion]);
    setMForm((f) => ({ ...f, portion, carbEstimate: mForm.selectedFoods.length ? String(total) : f.carbEstimate }));
  };

  const addMeal = () => {
    if (mForm.selectedFoods.length === 0 && !mForm.customText.trim()) {
      setMErr("Add at least one food item."); return;
    }
    setMErr("");
    const allFoods: FoodItem[] = [...mForm.selectedFoods];
    if (mForm.customText.trim()) allFoods.push({ name: mForm.customText.trim(), carbs: 0, unit: "", custom: true });

    const carbs = parseInt(mForm.carbEstimate || "0");
    setMealEntries((prev) => [
      {
        id: `m${Date.now()}`,
        mealType: mForm.mealType,
        foods: allFoods,
        portion: mForm.portion,
        carbEstimate: carbs,
        time: new Date().toTimeString().slice(0, 5),
      },
      ...prev,
    ]);
    setMForm({ mealType: "breakfast", selectedFoods: [], customText: "", foodSearch: "", portion: "medium", carbEstimate: "" });
    setFoodSearch("");
  };

  const removeMeal = (id: string) => setMealEntries((p) => p.filter((e) => e.id !== id));

  // ── Submit & Analyze
  const canSubmit = glucoseEntries.length > 0 || mealEntries.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setPhase("analyzing");
    await new Promise((r) => setTimeout(r, 2200));
    const result = generateAI(glucoseEntries, mealEntries);
    navigate("/dashboard/patient/ai-summary", {
      state: { glucoseEntries, mealEntries, aiResult: result },
    });
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
        {sidebarNav.map(({ icon: Icon, label, path, active, badge }) => (
          <button
            key={label}
            onClick={() => path ? navigate(path) : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-blue-50 text-blue-700" : path ? "text-slate-600 hover:bg-slate-50 hover:text-slate-900" : "text-slate-400 cursor-default"}`}
            style={{ fontWeight: active ? 600 : 400 }}
          >
            <Icon className={`w-4 h-4 ${active ? "text-blue-600" : path ? "text-slate-400" : "text-slate-300"}`} strokeWidth={1.8} />
            <span className="flex-1 text-left">{label}</span>
            {badge && <span className="bg-red-500 text-white text-xs rounded-full w-[18px] h-[18px] flex items-center justify-center">{badge}</span>}
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
            <h2 className="text-slate-900 mb-2" style={{ fontWeight: 800, fontSize: "1.4rem" }}>Analysing your data…</h2>
            <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">Our AI is reviewing your glucose readings and meal logs to generate your personalised health summary.</p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-blue-600 text-sm font-semibold">Processing {glucoseEntries.length + mealEntries.length} entries</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Logging View ─────────────────────────────────────────────────────────
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
          <Droplets className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
          <div>
            <h1 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Glucose & Meal Log</h1>
            <p className="text-slate-400 text-xs">Thursday, April 30, 2026</p>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-5 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* ── Forms (left) ── */}
              <div className="lg:col-span-3 space-y-5">

                {/* Tab bar */}
                <div className="flex bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm gap-1.5">
                  {([
                    { key: "glucose", icon: Droplets, label: "Glucose Log", color: "blue" },
                    { key: "meal",    icon: Utensils,  label: "Meal Log",    color: "emerald" },
                  ] as const).map(({ key, icon: Icon, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === key ? (color === "blue" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-emerald-600 text-white shadow-md shadow-emerald-200") : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.8} />
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── Glucose Form ── */}
                {activeTab === "glucose" && (
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

                    {/* Date + Time */}
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

                    {/* Glucose value */}
                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 font-semibold">Glucose Value (mg/dL)</label>
                      <input
                        type="number" value={gForm.value} onChange={(e) => { updateG("value", e.target.value); setGErr(""); }}
                        onKeyDown={(e) => e.key === "Enter" && addGlucose()}
                        placeholder="Enter value (e.g. 96)" min={20} max={600}
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

                    {/* Context */}
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

                    {/* Notes */}
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
                      <Plus className="w-4 h-4" />Add to Today's Log
                    </button>
                  </div>
                )}

                {/* ── Meal Form ── */}
                {activeTab === "meal" && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                        <Utensils className="w-4 h-4 text-emerald-600" strokeWidth={1.8} />
                      </div>
                      <h2 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Add Meal Log</h2>
                    </div>

                    {mErr && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl px-3.5 py-2.5 text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{mErr}
                      </div>
                    )}

                    {/* Meal type */}
                    <div>
                      <label className="block text-xs text-slate-600 mb-2 font-semibold">Meal Type</label>
                      <div className="grid grid-cols-4 gap-2">
                        {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => setMForm((f) => ({ ...f, mealType: t }))}
                            className={`py-2.5 rounded-xl border text-xs font-medium transition-all capitalize ${mForm.mealType === t ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Food search */}
                    <div ref={searchRef}>
                      <label className="block text-xs text-slate-600 mb-1.5 font-semibold">Food Items</label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={foodSearch}
                          onChange={(e) => { setFoodSearch(e.target.value); setShowDropdown(true); }}
                          onFocus={() => setShowDropdown(true)}
                          placeholder="Search food (e.g. rice, banana, chicken…)"
                          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                        {showDropdown && filteredFoods.length > 0 && (
                          <div className="absolute z-20 top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                            {filteredFoods.map((food) => (
                              <button
                                key={food.name}
                                onMouseDown={(e) => { e.preventDefault(); addFood(food); }}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50 text-left transition-colors"
                              >
                                <span className="text-slate-800 text-sm">{food.name}</span>
                                <span className="text-xs text-slate-400">{food.carbs}g carbs · {food.unit}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selected food tags */}
                      {mForm.selectedFoods.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {mForm.selectedFoods.map((food) => (
                            <span key={food.name} className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">
                              {food.name}
                              {food.carbs > 0 && <span className="text-emerald-500">({food.carbs}g)</span>}
                              <button onClick={() => removeFood(food.name)} className="text-emerald-400 hover:text-red-500 transition-colors ml-0.5">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Custom free text */}
                    <div>
                      <label className="block text-xs text-slate-600 mb-1.5 font-semibold">
                        Other Items <span className="text-slate-400 font-normal">(free text)</span>
                      </label>
                      <input
                        type="text"
                        value={mForm.customText}
                        onChange={(e) => setMForm((f) => ({ ...f, customText: e.target.value }))}
                        placeholder="e.g. homemade stew, salad dressing…"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>

                    {/* Portion + Carbs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-2 font-semibold">Portion Size</label>
                        <div className="flex gap-1.5">
                          {(["small", "medium", "large"] as const).map((p) => (
                            <button
                              key={p}
                              onClick={() => { updatePortion(p); setMErr(""); }}
                              className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all capitalize ${mForm.portion === p ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                            >
                              {p[0].toUpperCase()}
                            </button>
                          ))}
                        </div>
                        <p className="text-slate-400 text-xs mt-1">S · M · L</p>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1.5 font-semibold">Est. Carbs (g)</label>
                        <input
                          type="number" value={mForm.carbEstimate}
                          onChange={(e) => setMForm((f) => ({ ...f, carbEstimate: e.target.value }))}
                          placeholder="Auto or enter"
                          min={0} max={500}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                        {mForm.selectedFoods.length > 0 && (
                          <p className="text-xs text-emerald-600 mt-1">Auto-calculated from selected foods</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={addMeal}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-100"
                    >
                      <Plus className="w-4 h-4" />Add to Today's Log
                    </button>
                  </div>
                )}

                {/* Submit */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-lg shadow-blue-200">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-white text-sm" style={{ fontWeight: 700 }}>Ready to analyse?</p>
                      <p className="text-blue-200 text-xs mt-0.5">
                        {glucoseEntries.length} glucose reading{glucoseEntries.length !== 1 ? "s" : ""} · {mealEntries.length} meal log{mealEntries.length !== 1 ? "s" : ""} ready
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full py-3 bg-white hover:bg-blue-50 disabled:bg-white/40 text-blue-700 disabled:text-blue-300 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Brain className="w-4 h-4" />
                    Submit & Analyse with AI
                  </button>
                  {!canSubmit && (
                    <p className="text-blue-300 text-xs text-center mt-2">Add at least one entry to submit</p>
                  )}
                </div>
              </div>

              {/* ── Today's Entries (right) ── */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-0">
                  {/* Header */}
                  <div className="px-5 pt-5 pb-0">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Today's Entries</h2>
                      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                        {(["glucose", "meal"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setHistoryTab(t)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${historyTab === t ? "bg-white shadow text-slate-800" : "text-slate-400"}`}
                          >
                            {t === "glucose" ? `Glucose (${glucoseEntries.length})` : `Meals (${mealEntries.length})`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Glucose list */}
                  {historyTab === "glucose" && (
                    <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                      {glucoseEntries.length === 0 ? (
                        <div className="px-5 pb-5 pt-4 text-center">
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Droplets className="w-6 h-6 text-blue-300" strokeWidth={1.5} />
                          </div>
                          <p className="text-slate-400 text-sm">No glucose readings yet</p>
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
                                    <span className={`text-sm ${col.text}`} style={{ fontWeight: 700 }}>{entry.value} <span className="font-normal text-xs text-slate-400">mg/dL</span></span>
                                    <button onClick={() => removeGlucose(entry.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${ctxConfig[entry.context].bg} ${ctxConfig[entry.context].color}`}>
                                      {ctxConfig[entry.context].label}
                                    </span>
                                    <span className="text-slate-300 text-xs">{entry.time}</span>
                                  </div>
                                  {entry.notes && <p className="text-slate-400 text-xs mt-0.5 truncate">{entry.notes}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Meals list */}
                  {historyTab === "meal" && (
                    <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                      {mealEntries.length === 0 ? (
                        <div className="px-5 pb-5 pt-4 text-center">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Utensils className="w-6 h-6 text-emerald-300" strokeWidth={1.5} />
                          </div>
                          <p className="text-slate-400 text-sm">No meals logged yet</p>
                          <p className="text-slate-300 text-xs mt-1">Switch to Meal Log to add meals</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {mealEntries.map((entry) => (
                            <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
                              <div className="w-8 h-8 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-slate-700 text-sm capitalize" style={{ fontWeight: 600 }}>{entry.mealType}</span>
                                  <button onClick={() => removeMeal(entry.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                                  {entry.foods.map((f) => f.name).join(", ")}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {entry.carbEstimate > 0 && (
                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-medium border border-emerald-100">
                                      ~{entry.carbEstimate}g carbs
                                    </span>
                                  )}
                                  <span className="text-slate-300 text-xs capitalize">{entry.portion}</span>
                                  <span className="text-slate-300 text-xs">{entry.time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary footer */}
                  {(glucoseEntries.length > 0 || mealEntries.length > 0) && (
                    <div className="px-5 py-3.5 border-t border-slate-50 bg-slate-50/50">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                          {glucoseEntries.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Droplets className="w-3 h-3 text-blue-400" />
                              Avg: <strong className="text-slate-700">{Math.round(glucoseEntries.reduce((s, e) => s + e.value, 0) / glucoseEntries.length)} mg/dL</strong>
                            </span>
                          )}
                          {mealEntries.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Utensils className="w-3 h-3 text-emerald-400" />
                              <strong className="text-slate-700">{mealEntries.reduce((s, m) => s + m.carbEstimate, 0)}g</strong> carbs
                            </span>
                          )}
                        </div>
                        <Info className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}