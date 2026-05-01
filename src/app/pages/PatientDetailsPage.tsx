import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Activity, LayoutDashboard, Users, LogOut, Menu, X,
  Search, Stethoscope, Bell, ChevronRight,
  Droplets, Calendar, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Phone, Mail, Pill,
  User, Heart, Weight, Ruler,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, PieChart, Pie, Cell,
} from "recharts";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface GlucosePoint { day: string; value: number; }
interface WeeklyAvg    { week: string; avg: number; }
interface MealPoint    { day: string; carbs: number; }
interface HbA1cPoint   { month: string; value: number; }

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  dob: string;
  email: string;
  phone: string;
  diagnosis: string;
  hba1c: number;
  bmi: number;
  weight: number;
  height: number;
  medications: string[];
  riskLevel: "high" | "moderate" | "low";
  lastVisit: string;
  status: "active" | "inactive";
  avgGlucose: number;
  lastGlucose: number;
  glucoseTrend: GlucosePoint[];
  weeklyAvg: WeeklyAvg[];
  mealData: MealPoint[];
  hba1cHistory: HbA1cPoint[];
}

// ─── Mock Patient Data ────────────────────────────────────────────────────────
const mockPatients: Patient[] = [
  {
    id: "P-2847",
    name: "John Anderson",
    age: 52,
    gender: "Male",
    dob: "Mar 15, 1972",
    email: "j.anderson@email.com",
    phone: "+1 (555) 234-5678",
    diagnosis: "Type 2 Diabetes",
    hba1c: 8.2,
    bmi: 29.4,
    weight: 87,
    height: 172,
    medications: ["Metformin 1000mg", "Glipizide 5mg"],
    riskLevel: "high",
    lastVisit: "Apr 20, 2026",
    status: "active",
    avgGlucose: 156,
    lastGlucose: 248,
    glucoseTrend: [
      { day: "Apr 17", value: 142 }, { day: "Apr 18", value: 168 }, { day: "Apr 19", value: 155 },
      { day: "Apr 20", value: 188 }, { day: "Apr 21", value: 172 }, { day: "Apr 22", value: 163 },
      { day: "Apr 23", value: 145 }, { day: "Apr 24", value: 159 }, { day: "Apr 25", value: 177 },
      { day: "Apr 26", value: 196 }, { day: "Apr 27", value: 210 }, { day: "Apr 28", value: 182 },
      { day: "Apr 29", value: 221 }, { day: "Apr 30", value: 248 },
    ],
    weeklyAvg: [
      { week: "Wk 1", avg: 148 }, { week: "Wk 2", avg: 162 },
      { week: "Wk 3", avg: 171 }, { week: "Wk 4", avg: 183 },
    ],
    mealData: [
      { day: "Mon", carbs: 65 }, { day: "Tue", carbs: 48 }, { day: "Wed", carbs: 72 },
      { day: "Thu", carbs: 55 }, { day: "Fri", carbs: 80 }, { day: "Sat", carbs: 91 }, { day: "Sun", carbs: 60 },
    ],
    hba1cHistory: [
      { month: "Nov", value: 9.1 }, { month: "Dec", value: 8.8 },
      { month: "Jan", value: 8.5 }, { month: "Feb", value: 8.4 },
      { month: "Mar", value: 8.3 }, { month: "Apr", value: 8.2 },
    ],
  },
  {
    id: "P-1583",
    name: "Michael Chen",
    age: 44,
    gender: "Male",
    dob: "Jul 28, 1980",
    email: "m.chen@email.com",
    phone: "+1 (555) 876-4321",
    diagnosis: "Type 2 Diabetes",
    hba1c: 7.4,
    bmi: 26.8,
    weight: 78,
    height: 170,
    medications: ["Metformin 500mg"],
    riskLevel: "moderate",
    lastVisit: "Apr 25, 2026",
    status: "active",
    avgGlucose: 148,
    lastGlucose: 165,
    glucoseTrend: [
      { day: "Apr 17", value: 128 }, { day: "Apr 18", value: 144 }, { day: "Apr 19", value: 138 },
      { day: "Apr 20", value: 155 }, { day: "Apr 21", value: 149 }, { day: "Apr 22", value: 162 },
      { day: "Apr 23", value: 141 }, { day: "Apr 24", value: 153 }, { day: "Apr 25", value: 167 },
      { day: "Apr 26", value: 158 }, { day: "Apr 27", value: 144 }, { day: "Apr 28", value: 160 },
      { day: "Apr 29", value: 171 }, { day: "Apr 30", value: 165 },
    ],
    weeklyAvg: [
      { week: "Wk 1", avg: 139 }, { week: "Wk 2", avg: 145 },
      { week: "Wk 3", avg: 152 }, { week: "Wk 4", avg: 161 },
    ],
    mealData: [
      { day: "Mon", carbs: 52 }, { day: "Tue", carbs: 60 }, { day: "Wed", carbs: 45 },
      { day: "Thu", carbs: 68 }, { day: "Fri", carbs: 55 }, { day: "Sat", carbs: 74 }, { day: "Sun", carbs: 49 },
    ],
    hba1cHistory: [
      { month: "Nov", value: 8.1 }, { month: "Dec", value: 7.9 },
      { month: "Jan", value: 7.7 }, { month: "Feb", value: 7.6 },
      { month: "Mar", value: 7.5 }, { month: "Apr", value: 7.4 },
    ],
  },
  {
    id: "P-2156",
    name: "David Kim",
    age: 38,
    gender: "Male",
    dob: "Nov 2, 1987",
    email: "d.kim@email.com",
    phone: "+1 (555) 345-9876",
    diagnosis: "Type 1 Diabetes",
    hba1c: 6.8,
    bmi: 22.1,
    weight: 68,
    height: 175,
    medications: ["Insulin Lispro", "Insulin Glargine"],
    riskLevel: "high",
    lastVisit: "Apr 18, 2026",
    status: "active",
    avgGlucose: 98,
    lastGlucose: 52,
    glucoseTrend: [
      { day: "Apr 17", value: 112 }, { day: "Apr 18", value: 95 }, { day: "Apr 19", value: 88 },
      { day: "Apr 20", value: 104 }, { day: "Apr 21", value: 78 }, { day: "Apr 22", value: 92 },
      { day: "Apr 23", value: 115 }, { day: "Apr 24", value: 86 }, { day: "Apr 25", value: 73 },
      { day: "Apr 26", value: 109 }, { day: "Apr 27", value: 94 }, { day: "Apr 28", value: 81 },
      { day: "Apr 29", value: 68 }, { day: "Apr 30", value: 52 },
    ],
    weeklyAvg: [
      { week: "Wk 1", avg: 101 }, { week: "Wk 2", avg: 94 },
      { week: "Wk 3", avg: 98 }, { week: "Wk 4", avg: 88 },
    ],
    mealData: [
      { day: "Mon", carbs: 45 }, { day: "Tue", carbs: 52 }, { day: "Wed", carbs: 38 },
      { day: "Thu", carbs: 60 }, { day: "Fri", carbs: 42 }, { day: "Sat", carbs: 55 }, { day: "Sun", carbs: 48 },
    ],
    hba1cHistory: [
      { month: "Nov", value: 7.4 }, { month: "Dec", value: 7.2 },
      { month: "Jan", value: 7.0 }, { month: "Feb", value: 6.9 },
      { month: "Mar", value: 6.9 }, { month: "Apr", value: 6.8 },
    ],
  },
  {
    id: "P-3041",
    name: "Emily Rodriguez",
    age: 61,
    gender: "Female",
    dob: "Jan 9, 1965",
    email: "e.rodriguez@email.com",
    phone: "+1 (555) 512-7890",
    diagnosis: "Type 2 Diabetes",
    hba1c: 7.1,
    bmi: 28.2,
    weight: 73,
    height: 161,
    medications: ["Metformin 1000mg", "Sitagliptin 100mg"],
    riskLevel: "moderate",
    lastVisit: "Apr 28, 2026",
    status: "active",
    avgGlucose: 132,
    lastGlucose: 127,
    glucoseTrend: [
      { day: "Apr 17", value: 118 }, { day: "Apr 18", value: 131 }, { day: "Apr 19", value: 124 },
      { day: "Apr 20", value: 139 }, { day: "Apr 21", value: 128 }, { day: "Apr 22", value: 135 },
      { day: "Apr 23", value: 121 }, { day: "Apr 24", value: 142 }, { day: "Apr 25", value: 133 },
      { day: "Apr 26", value: 126 }, { day: "Apr 27", value: 138 }, { day: "Apr 28", value: 129 },
      { day: "Apr 29", value: 134 }, { day: "Apr 30", value: 127 },
    ],
    weeklyAvg: [
      { week: "Wk 1", avg: 128 }, { week: "Wk 2", avg: 133 },
      { week: "Wk 3", avg: 130 }, { week: "Wk 4", avg: 132 },
    ],
    mealData: [
      { day: "Mon", carbs: 42 }, { day: "Tue", carbs: 55 }, { day: "Wed", carbs: 38 },
      { day: "Thu", carbs: 61 }, { day: "Fri", carbs: 47 }, { day: "Sat", carbs: 53 }, { day: "Sun", carbs: 44 },
    ],
    hba1cHistory: [
      { month: "Nov", value: 7.8 }, { month: "Dec", value: 7.6 },
      { month: "Jan", value: 7.4 }, { month: "Feb", value: 7.3 },
      { month: "Mar", value: 7.2 }, { month: "Apr", value: 7.1 },
    ],
  },
  {
    id: "P-1892",
    name: "Sarah Thompson",
    age: 29,
    gender: "Female",
    dob: "Aug 22, 1996",
    email: "s.thompson@email.com",
    phone: "+1 (555) 678-2345",
    diagnosis: "Type 1 Diabetes",
    hba1c: 6.4,
    bmi: 21.3,
    weight: 58,
    height: 165,
    medications: ["Insulin Aspart", "Insulin Detemir"],
    riskLevel: "low",
    lastVisit: "Apr 30, 2026",
    status: "active",
    avgGlucose: 108,
    lastGlucose: 103,
    glucoseTrend: [
      { day: "Apr 17", value: 102 }, { day: "Apr 18", value: 98 }, { day: "Apr 19", value: 115 },
      { day: "Apr 20", value: 107 }, { day: "Apr 21", value: 95 }, { day: "Apr 22", value: 111 },
      { day: "Apr 23", value: 104 }, { day: "Apr 24", value: 99 }, { day: "Apr 25", value: 118 },
      { day: "Apr 26", value: 108 }, { day: "Apr 27", value: 101 }, { day: "Apr 28", value: 114 },
      { day: "Apr 29", value: 96 }, { day: "Apr 30", value: 103 },
    ],
    weeklyAvg: [
      { week: "Wk 1", avg: 106 }, { week: "Wk 2", avg: 109 },
      { week: "Wk 3", avg: 107 }, { week: "Wk 4", avg: 110 },
    ],
    mealData: [
      { day: "Mon", carbs: 38 }, { day: "Tue", carbs: 45 }, { day: "Wed", carbs: 42 },
      { day: "Thu", carbs: 50 }, { day: "Fri", carbs: 35 }, { day: "Sat", carbs: 48 }, { day: "Sun", carbs: 41 },
    ],
    hba1cHistory: [
      { month: "Nov", value: 6.9 }, { month: "Dec", value: 6.8 },
      { month: "Jan", value: 6.7 }, { month: "Feb", value: 6.6 },
      { month: "Mar", value: 6.5 }, { month: "Apr", value: 6.4 },
    ],
  },
  {
    id: "P-4217",
    name: "Robert Martinez",
    age: 67,
    gender: "Male",
    dob: "Feb 14, 1959",
    email: "r.martinez@email.com",
    phone: "+1 (555) 901-3456",
    diagnosis: "Type 2 Diabetes",
    hba1c: 9.1,
    bmi: 33.6,
    weight: 102,
    height: 174,
    medications: ["Metformin 1000mg", "Empagliflozin 10mg", "Dulaglutide 1.5mg"],
    riskLevel: "high",
    lastVisit: "Apr 15, 2026",
    status: "active",
    avgGlucose: 188,
    lastGlucose: 214,
    glucoseTrend: [
      { day: "Apr 17", value: 174 }, { day: "Apr 18", value: 192 }, { day: "Apr 19", value: 205 },
      { day: "Apr 20", value: 181 }, { day: "Apr 21", value: 197 }, { day: "Apr 22", value: 213 },
      { day: "Apr 23", value: 186 }, { day: "Apr 24", value: 202 }, { day: "Apr 25", value: 178 },
      { day: "Apr 26", value: 195 }, { day: "Apr 27", value: 219 }, { day: "Apr 28", value: 207 },
      { day: "Apr 29", value: 211 }, { day: "Apr 30", value: 214 },
    ],
    weeklyAvg: [
      { week: "Wk 1", avg: 179 }, { week: "Wk 2", avg: 185 },
      { week: "Wk 3", avg: 192 }, { week: "Wk 4", avg: 204 },
    ],
    mealData: [
      { day: "Mon", carbs: 88 }, { day: "Tue", carbs: 76 }, { day: "Wed", carbs: 95 },
      { day: "Thu", carbs: 82 }, { day: "Fri", carbs: 103 }, { day: "Sat", carbs: 110 }, { day: "Sun", carbs: 79 },
    ],
    hba1cHistory: [
      { month: "Nov", value: 10.2 }, { month: "Dec", value: 9.8 },
      { month: "Jan", value: 9.6 }, { month: "Feb", value: 9.4 },
      { month: "Mar", value: 9.2 }, { month: "Apr", value: 9.1 },
    ],
  },
  {
    id: "P-3388",
    name: "Linda Patel",
    age: 48,
    gender: "Female",
    dob: "Oct 5, 1977",
    email: "l.patel@email.com",
    phone: "+1 (555) 432-6789",
    diagnosis: "Prediabetes",
    hba1c: 6.1,
    bmi: 25.7,
    weight: 68,
    height: 163,
    medications: ["Metformin 500mg"],
    riskLevel: "low",
    lastVisit: "Apr 27, 2026",
    status: "active",
    avgGlucose: 112,
    lastGlucose: 109,
    glucoseTrend: [
      { day: "Apr 17", value: 108 }, { day: "Apr 18", value: 115 }, { day: "Apr 19", value: 111 },
      { day: "Apr 20", value: 119 }, { day: "Apr 21", value: 106 }, { day: "Apr 22", value: 113 },
      { day: "Apr 23", value: 121 }, { day: "Apr 24", value: 107 }, { day: "Apr 25", value: 116 },
      { day: "Apr 26", value: 110 }, { day: "Apr 27", value: 114 }, { day: "Apr 28", value: 108 },
      { day: "Apr 29", value: 112 }, { day: "Apr 30", value: 109 },
    ],
    weeklyAvg: [
      { week: "Wk 1", avg: 111 }, { week: "Wk 2", avg: 113 },
      { week: "Wk 3", avg: 110 }, { week: "Wk 4", avg: 112 },
    ],
    mealData: [
      { day: "Mon", carbs: 40 }, { day: "Tue", carbs: 47 }, { day: "Wed", carbs: 35 },
      { day: "Thu", carbs: 52 }, { day: "Fri", carbs: 43 }, { day: "Sat", carbs: 58 }, { day: "Sun", carbs: 38 },
    ],
    hba1cHistory: [
      { month: "Nov", value: 6.5 }, { month: "Dec", value: 6.4 },
      { month: "Jan", value: 6.3 }, { month: "Feb", value: 6.2 },
      { month: "Mar", value: 6.2 }, { month: "Apr", value: 6.1 },
    ],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────
const riskConfig = {
  high:     { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",   dot: "bg-red-500",    label: "High Risk" },
  moderate: { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200", dot: "bg-amber-500",  label: "Moderate" },
  low:      { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",dot:"bg-emerald-500",label: "Low Risk" },
};

// ─── Glucose tooltip ─────────────────────────────────────────────────────────
const GlucoseTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const color = val >= 126 ? "#ef4444" : val < 70 ? "#3b82f6" : "#10b981";
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2">
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{val} <span className="font-normal text-slate-400">mg/dL</span></p>
    </div>
  );
};

const GenericTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2">
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <p className="text-slate-900 text-sm font-bold">{payload[0].value} <span className="font-normal text-slate-400">{unit}</span></p>
    </div>
  );
};

// ─── Patient List Card ────────────────────────────────────────────────────────
function PatientCard({ patient, selected, onClick }: { patient: Patient; selected: boolean; onClick: () => void }) {
  const risk = riskConfig[patient.riskLevel];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
        selected
          ? "bg-blue-50 border-blue-200 shadow-sm"
          : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          {patient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={`text-sm truncate ${selected ? "text-blue-900" : "text-slate-900"}`} style={{ fontWeight: 700 }}>
              {patient.name}
            </p>
            <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${selected ? "text-blue-400" : "text-slate-300"}`} />
          </div>
          <p className="text-slate-400 text-xs mb-2">{patient.id} · {patient.diagnosis}</p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${risk.bg} ${risk.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
              {risk.label}
            </span>
            <span className="text-slate-300 text-xs">{patient.lastVisit}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PatientDetailsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient>(mockPatients[0]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "moderate" | "low">("all");

  const handleSignOut = () => { signOut(); navigate("/"); };

  const filtered = mockPatients.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search);
    const matchRisk = riskFilter === "all" || p.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  const p = selectedPatient;
  const risk = riskConfig[p.riskLevel];
  const hba1cTrend = p.hba1cHistory[p.hba1cHistory.length - 1].value - p.hba1cHistory[0].value;
  const glucoseBarColor = (val: number) => val >= 180 ? "#ef4444" : val >= 126 ? "#f59e0b" : "#10b981";

  return (
    <div className="flex h-screen bg-[#F7F8FC] overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
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
            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 text-sm truncate" style={{ fontWeight: 600 }}>{user?.name || "Dr. Sarah Chen"}</p>
              <p className="text-slate-400 text-xs">Physician</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {[
            { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/doctor", active: false },
            { icon: Users, label: "Patients", path: "/dashboard/doctor/patients", active: true },
          ].map(({ icon: Icon, label, active, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              style={{ fontWeight: active ? 600 : 400 }}
            >
              <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} strokeWidth={1.8} />
              <span className="flex-1 text-left">{label}</span>
            </button>
          ))}
        </nav>

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
          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500">
            <Users className="w-4 h-4" />
            <span style={{ fontWeight: 600 }}>Patient Records</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">{mockPatients.length} patients</span>
          </div>
          <button onClick={() => navigate("/dashboard/doctor")} className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts</span>
          </button>
        </header>

        {/* Body: list + detail */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Patient List Panel ────────────────────────────────────────── */}
          <div className="w-72 xl:w-80 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col overflow-hidden hidden md:flex">
            {/* Search + Filter */}
            <div className="px-4 py-4 border-b border-slate-50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search patients..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "high", "moderate", "low"] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      riskFilter === r ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No patients found</div>
              ) : (
                filtered.map(patient => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    selected={selectedPatient.id === patient.id}
                    onClick={() => setSelectedPatient(patient)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ── Detail Panel ──────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

            {/* ── Patient Header ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl flex-shrink-0" style={{ fontWeight: 800 }}>
                  {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="text-slate-900" style={{ fontWeight: 800, fontSize: "1.3rem" }}>{p.name}</h1>
                      <p className="text-slate-400 text-sm mt-0.5">{p.id} · {p.age} yrs · {p.gender} · Born {p.dob}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${risk.bg} ${risk.text} ${risk.border} border`}>
                      <span className={`w-2 h-2 rounded-full ${risk.dot}`} />
                      {risk.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" />{p.email}</div>
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" />{p.phone}</div>
                    <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" />Last visit: {p.lastVisit}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Key Metrics ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: "Avg Glucose",
                  value: p.avgGlucose,
                  unit: "mg/dL",
                  icon: Droplets,
                  color: p.avgGlucose >= 126 ? { bg: "bg-red-50", icon: "text-red-500", val: "text-red-700" } : { bg: "bg-blue-50", icon: "text-blue-500", val: "text-blue-700" },
                },
                {
                  label: "Latest Glucose",
                  value: p.lastGlucose,
                  unit: "mg/dL",
                  icon: Activity,
                  color: p.lastGlucose >= 126 ? { bg: "bg-red-50", icon: "text-red-500", val: "text-red-700" } : p.lastGlucose < 70 ? { bg: "bg-amber-50", icon: "text-amber-500", val: "text-amber-700" } : { bg: "bg-emerald-50", icon: "text-emerald-500", val: "text-emerald-700" },
                },
                {
                  label: "HbA1c",
                  value: p.hba1c,
                  unit: "%",
                  icon: Heart,
                  color: p.hba1c >= 8 ? { bg: "bg-red-50", icon: "text-red-500", val: "text-red-700" } : p.hba1c >= 6.5 ? { bg: "bg-amber-50", icon: "text-amber-500", val: "text-amber-700" } : { bg: "bg-emerald-50", icon: "text-emerald-500", val: "text-emerald-700" },
                },
                {
                  label: "BMI",
                  value: p.bmi,
                  unit: "kg/m²",
                  icon: User,
                  color: p.bmi >= 30 ? { bg: "bg-red-50", icon: "text-red-500", val: "text-red-700" } : p.bmi >= 25 ? { bg: "bg-amber-50", icon: "text-amber-500", val: "text-amber-700" } : { bg: "bg-emerald-50", icon: "text-emerald-500", val: "text-emerald-700" },
                },
              ].map(({ label, value, unit, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <div className={`w-9 h-9 ${color.bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-4.5 h-4.5 ${color.icon}`} strokeWidth={1.8} />
                  </div>
                  <p className="text-slate-400 text-xs mb-0.5">{label}</p>
                  <p className={`${color.val}`} style={{ fontWeight: 800, fontSize: "1.5rem", lineHeight: 1 }}>{value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{unit}</p>
                </div>
              ))}
            </div>

            {/* ── Info + Medications ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Physical Info */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-slate-900 text-sm mb-4" style={{ fontWeight: 700 }}>Physical Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Height", value: `${p.height} cm` },
                    { label: "Weight", value: `${p.weight} kg` },
                    { label: "BMI", value: p.bmi },
                    { label: "Diagnosis", value: p.diagnosis },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs mb-0.5">{label}</p>
                      <p className="text-slate-900 text-sm" style={{ fontWeight: 600 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medications */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Pill className="w-4 h-4 text-slate-400" />
                  <h3 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Current Medications</h3>
                </div>
                <div className="space-y-2">
                  {p.medications.map(med => (
                    <div key={med} className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                      <span className="text-blue-800 text-sm" style={{ fontWeight: 500 }}>{med}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Glucose Trend Chart ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Glucose Trend</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Last 14 days · mg/dL</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" />Normal</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-amber-400 inline-block rounded" />High</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={p.glucoseTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[40, 280]} />
                  <Tooltip content={<GlucoseTooltip />} />
                  <ReferenceLine y={126} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "High", position: "right", fontSize: 9, fill: "#f59e0b" }} />
                  <ReferenceLine y={70} stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Low", position: "right", fontSize: 9, fill: "#3b82f6" }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const color = payload.value >= 126 ? "#ef4444" : payload.value < 70 ? "#3b82f6" : "#10b981";
                      return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3.5} fill={color} stroke="white" strokeWidth={1.5} />;
                    }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Weekly Avg + Meal Carbs ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Weekly Average */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-slate-900 text-sm mb-1" style={{ fontWeight: 700 }}>Weekly Average Glucose</h3>
                <p className="text-slate-400 text-xs mb-5">Last 4 weeks · mg/dL</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={p.weeklyAvg} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[60, 250]} />
                    <Tooltip content={<GenericTooltip unit="mg/dL" />} />
                    <ReferenceLine y={126} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
                    <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                      {p.weeklyAvg.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={glucoseBarColor(entry.avg)} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Meal Carbs */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-slate-900 text-sm mb-1" style={{ fontWeight: 700 }}>Daily Carb Intake</h3>
                <p className="text-slate-400 text-xs mb-5">Last 7 days · grams</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={p.mealData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[0, 130]} />
                    <Tooltip content={<GenericTooltip unit="g" />} />
                    <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Target", position: "right", fontSize: 9, fill: "#10b981" }} />
                    <Bar dataKey="carbs" fill="#10b981" fillOpacity={0.8} radius={[6, 6, 0, 0]}>
                      {p.mealData.map((entry, i) => (
                        <Cell key={`meal-${i}`} fill={entry.carbs > 75 ? "#f59e0b" : "#10b981"} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── HbA1c History ── */}
            

          </div>
        </div>
      </div>
    </div>
  );
}
