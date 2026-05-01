import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  Activity, LayoutDashboard, Droplets, ShieldAlert,
  LineChart, Bell, Settings, LogOut, Menu, X, Calendar,
  ArrowLeft, AlertTriangle, CheckCircle, Info, Loader2,
  FileText, Stethoscope, Clock, Phone, MapPin, AlertOctagon,
  TrendingUp, TrendingDown, Minus, RefreshCw, Download,
  BookOpen, Heart, Brain,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type RiskLevel = "high" | "moderate" | "low";

interface BloodCondition {
  id: string;
  name: string;
  riskPercent: number;
  riskLevel: RiskLevel;
  description: string;
  whyFlagged: string[];
  learnMoreUrl?: string;
}

interface AnalysisResult {
  overallRisk: RiskLevel;
  confidenceScore: number;
  conditions: BloodCondition[];
  missingInputs: string[];
  doctorNotified: boolean;
  analysisDate: string;
  recommendations: {
    immediate: string[];
    followUp: string[];
  };
}

const sidebarNav = [
  { icon: LayoutDashboard, label: "Dashboard",          path: "/dashboard/patient",              active: false },
  { icon: Droplets,        label: "Glucose Logs",       path: "/dashboard/patient/glucose",      active: false },
  { icon: ShieldAlert,     label: "Blood Disease Check",path: "/dashboard/patient/blood-disease",active: true },
  { icon: Settings,        label: "Settings",           path: "/dashboard/patient/settings",     active: false },
];

// ─── Risk Configuration ───────────────────────────────────────────────────────
const riskConfig: Record<RiskLevel, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
  barColor: string;
}> = {
  high:     { bg: "bg-red-50",     text: "text-red-700",    border: "border-red-200",   dot: "bg-red-500",    label: "High Risk",     barColor: "bg-red-500" },
  moderate: { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200", dot: "bg-amber-500",  label: "Moderate Risk", barColor: "bg-amber-500" },
  low:      { bg: "bg-emerald-50", text: "text-emerald-700",border: "border-emerald-200",dot:"bg-emerald-500",label: "Low Risk",      barColor: "bg-emerald-500" },
};

function getRiskLevel(percent: number): RiskLevel {
  if (percent > 65) return "high";
  if (percent >= 35) return "moderate";
  return "low";
}

// ─── Mock AI Analysis Results ─────────────────────────────────────────────────
// In production, this would come from the actual AI analysis
const mockAnalysisResult: AnalysisResult = {
  overallRisk: "high", // Will be computed from highest risk condition
  confidenceScore: 78,
  analysisDate: new Date().toISOString(),
  doctorNotified: true,
  missingInputs: ["Platelet Count", "MCV", "MCH", "MCHC"],
  conditions: [
    {
      id: "anemia",
      name: "Iron-Deficiency Anemia",
      riskPercent: 72,
      riskLevel: "high",
      description: "A condition where blood lacks adequate healthy red blood cells due to insufficient iron, leading to reduced oxygen delivery to tissues.",
      whyFlagged: [
        "Hemoglobin level (11.2 g/dL) is below normal range for your gender",
        "Reported symptoms: unusual fatigue, pallor, and dizziness",
        "Family history of anemia reported",
      ],
    },
    {
      id: "thalassemia",
      name: "Thalassemia (Minor)",
      riskPercent: 28,
      riskLevel: "low",
      description: "An inherited blood disorder causing abnormal hemoglobin production, leading to mild anemia in minor forms.",
      whyFlagged: [
        "Low hemoglobin with family history of blood disorders",
        "No severe symptoms reported, suggesting minor variant if present",
      ],
    },
    {
      id: "leukemia",
      name: "Leukemia",
      riskPercent: 14,
      riskLevel: "low",
      description: "Cancer of blood-forming tissues, including bone marrow and lymphatic system, causing abnormal white blood cell production.",
      whyFlagged: [
        "Elevated WBC count (12,500 cells/μL) slightly above normal",
        "However, no other strong indicators present",
      ],
    },
    {
      id: "sickle-cell",
      name: "Sickle Cell Disease",
      riskPercent: 8,
      riskLevel: "low",
      description: "An inherited disorder causing red blood cells to become rigid and crescent-shaped, blocking blood flow.",
      whyFlagged: [
        "Family history of blood conditions noted",
        "No specific symptoms matching sickle cell pattern",
      ],
    },
    {
      id: "hemophilia",
      name: "Hemophilia",
      riskPercent: 6,
      riskLevel: "low",
      description: "A rare disorder where blood doesn't clot properly due to lack of clotting factors.",
      whyFlagged: [
        "Reported easy bruising symptom",
        "However, no severe bleeding episodes reported",
      ],
    },
  ],
  recommendations: {
    immediate: [
      "Schedule an appointment with a hematologist within the next 2 weeks",
      "Request a complete iron panel test (serum iron, ferritin, TIBC, transferrin saturation)",
      "Avoid taking iron supplements without medical supervision",
      "Monitor and log any changes in symptoms (increased fatigue, shortness of breath)",
    ],
    followUp: [
      "Complete the missing CBC values for a more accurate assessment",
      "Discuss family history details with your doctor",
      "Re-test in 3 months after initial consultation",
      "Consider genetic counseling if family history shows inherited blood disorders",
    ],
  },
};

// ─── Risk Gauge Component ─────────────────────────────────────────────────────
function RiskGauge({ condition }: { condition: BloodCondition }) {
  const config = riskConfig[condition.riskLevel];

  return (
    <div className={`bg-white rounded-2xl border ${config.border} shadow-sm p-6 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-slate-900 mb-1" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
            {condition.name}
          </h3>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl ${config.text}`} style={{ fontWeight: 800, lineHeight: 1 }}>
            {condition.riskPercent}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Risk Score</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.barColor} transition-all duration-700 ease-out`}
            style={{ width: `${condition.riskPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-400">
          <span>0%</span>
          <span>Low</span>
          <span>Moderate</span>
          <span>High</span>
          <span>100%</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-3 leading-relaxed">
        {condition.description}
      </p>

      {/* Why Flagged */}
      <div className={`${config.bg} border ${config.border} rounded-xl p-3`}>
        <p className={`text-xs ${config.text} mb-2`} style={{ fontWeight: 600 }}>
          Why this was flagged:
        </p>
        <ul className="space-y-1.5">
          {condition.whyFlagged.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
              <span className={`w-1 h-1 rounded-full ${config.dot} flex-shrink-0 mt-1.5`} />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Doctor Alert Modal ───────────────────────────────────────────────────────
function DoctorAlertModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-teal-600" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Doctor Notified</h3>
              <p className="text-slate-400 text-xs">Your assigned physician has been alerted</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-900">
              <p className="font-semibold mb-1">Alert sent successfully</p>
              <p className="text-emerald-700">Dr. Sarah Chen has been notified of your high-risk blood analysis results and will review them shortly.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 text-sm">
            <Stethoscope className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-slate-500 text-xs">Assigned Doctor</p>
              <p className="text-slate-900 font-semibold">Dr. Sarah Chen, MD</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-slate-500 text-xs">Expected Response</p>
              <p className="text-slate-900 font-semibold">Within 24 hours</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-slate-500 text-xs">Emergency Contact</p>
              <p className="text-slate-900 font-semibold">1-800-HEALTH-1</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BloodDiseaseResultsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    // Simulate loading AI results
    const loadResults = async () => {
      await new Promise((r) => setTimeout(r, 1500));
      setResults(mockAnalysisResult);
      setLoading(false);

      // Show doctor notification modal if high risk
      if (mockAnalysisResult.overallRisk === "high" && mockAnalysisResult.doctorNotified) {
        setTimeout(() => setShowDoctorModal(true), 800);
      }
    };
    loadResults();
  }, []);

  const handleSignOut = () => { signOut(); navigate("/"); };

  const hasHighRisk = results?.conditions.some((c) => c.riskLevel === "high");
  const allLowRisk = results?.conditions.every((c) => c.riskLevel === "low");

  if (loading || !results) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F7F8FC]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-sm" style={{ fontWeight: 600 }}>Analyzing your blood health data...</p>
          <p className="text-slate-400 text-xs mt-1">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F7F8FC] overflow-hidden">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─ Sidebar ──────────────────────────────────────────────────────────── */}
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
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {sidebarNav.map(({ icon: Icon, label, active, badge, path }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${active ? "bg-red-50 text-red-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              style={{ fontWeight: active ? 600 : 400 }}
              onClick={() => path && navigate(path)}
            >
              <Icon className={`w-4 h-4 ${active ? "text-red-600" : "text-slate-400"}`} strokeWidth={1.8} />
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
          <button
            onClick={() => navigate("/dashboard/patient/blood-disease")}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">New Analysis</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-medium">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Report</span>
            </button>
            <button className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                2
              </span>
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-5 py-6">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="mb-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-red-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h1 className="text-slate-900" style={{ fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.02em" }}>
                    AI Risk Analysis Results
                  </h1>
                  <p className="text-slate-500 text-sm">
                    Analysis completed on {new Date(results.analysisDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* ── High Risk Alert Banner ────────────────────────────────── */}
            {hasHighRisk && (
              <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertOctagon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "1.2rem" }}>
                      High Risk Detected — Doctor Notified
                    </h2>
                    <p className="text-white/90 text-sm leading-relaxed mb-4">
                      Your analysis indicates a high risk for one or more blood conditions. {results.doctorNotified ? "Your assigned doctor (Dr. Sarah Chen) has been automatically notified and will review your results." : "Please contact your healthcare provider immediately."}
                    </p>
                    <button
                      onClick={() => setShowDoctorModal(true)}
                      className="flex items-center gap-2 bg-white text-red-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/95 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                      View Notification Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── All Low Risk Reassurance ───────────────────────────────── */}
            {allLowRisk && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white mb-2" style={{ fontWeight: 800, fontSize: "1.2rem" }}>
                      Good News — All Results Are Low Risk
                    </h2>
                    <p className="text-white/90 text-sm leading-relaxed mb-2">
                      Based on your current blood health indicators, the AI analysis shows low risk across all screened conditions. This is a positive result!
                    </p>
                    <p className="text-white/80 text-sm">
                      <strong>Recommendation:</strong> Re-check in 3–6 months to monitor your blood health, or sooner if you notice new symptoms.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Confidence & Missing Inputs ────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Confidence Score */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Brain className="w-4 h-4 text-blue-600" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-slate-900 text-sm" style={{ fontWeight: 700 }}>Confidence Score</p>
                      <p className="text-slate-400 text-xs">Analysis accuracy</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-blue-600" style={{ fontWeight: 800 }}>
                      {results.confidenceScore}%
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-700"
                    style={{ width: `${results.confidenceScore}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Based on {8 - results.missingInputs.length} out of 8 CBC values provided
                </p>
              </div>

              {/* Missing Inputs */}
              {results.missingInputs.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-amber-700" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1">
                      <p className="text-amber-900 text-sm mb-2" style={{ fontWeight: 700 }}>Missing Data Points</p>
                      <p className="text-amber-700 text-xs mb-2">
                        The following values were not provided. Adding them could improve accuracy:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {results.missingInputs.map((input) => (
                          <span key={input} className="bg-white border border-amber-200 text-amber-800 text-xs px-2 py-1 rounded-lg font-medium">
                            {input}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Condition Risk Cards ───────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                  Risk Assessment by Condition
                </h2>
                <p className="text-slate-400 text-xs">
                  {results.conditions.length} conditions analyzed
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {results.conditions.map((condition) => (
                  <RiskGauge key={condition.id} condition={condition} />
                ))}
              </div>
            </div>

            {/* ── What This Means Summary ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>What This Means</h2>
                  <p className="text-slate-400 text-xs">Understanding your results</p>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 leading-relaxed mb-4">
                  This AI-powered analysis evaluates your blood health indicators against known patterns for various blood diseases.
                  {hasHighRisk
                    ? " Your results show elevated risk markers that require medical attention. The conditions flagged above have risk percentages indicating the likelihood based on your current symptoms, lab values, and health history."
                    : " Your results show generally healthy blood indicators with low risk across the screened conditions."
                  }
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                  <h3 className="text-slate-900 text-sm mb-2" style={{ fontWeight: 700 }}>Risk Level Guide:</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0 mt-1" />
                      <span className="text-slate-700"><strong className="text-red-700">High Risk (&gt;65%):</strong> Requires immediate medical attention. A doctor has been notified.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-3 h-3 bg-amber-500 rounded-full flex-shrink-0 mt-1" />
                      <span className="text-slate-700"><strong className="text-amber-700">Moderate Risk (35–65%):</strong> Worth discussing with your doctor at your next appointment.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0 mt-1" />
                      <span className="text-slate-700"><strong className="text-emerald-700">Low Risk (&lt;35%):</strong> Current indicators don't suggest concern for this condition.</span>
                    </li>
                  </ul>
                </div>

                <p className="text-slate-600 text-sm">
                  <strong>Important:</strong> This analysis is a screening tool and not a definitive diagnosis. Only a qualified healthcare professional can diagnose blood diseases through comprehensive clinical evaluation and laboratory testing.
                </p>
              </div>
            </div>

            {/* ── Recommendations ──────────────────────────────────────────── */}
            {hasHighRisk && (
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-600" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Immediate Recommended Actions</h2>
                    <p className="text-slate-400 text-xs">Steps to take right away</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {results.recommendations.immediate.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                      <div className="w-6 h-6 bg-red-200 text-red-700 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-slate-700 flex-1">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Follow-Up Recommendations ────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Follow-Up Recommendations</h2>
                  <p className="text-slate-400 text-xs">Next steps for ongoing monitoring</p>
                </div>
              </div>

              <div className="space-y-3">
                {results.recommendations.followUp.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Action Buttons ────────────────────────���──────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
              <button
                onClick={() => navigate("/dashboard/patient/blood-disease")}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-red-200 text-red-700 rounded-xl font-semibold hover:bg-red-50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Run New Analysis
              </button>
              <button
                onClick={() => navigate("/dashboard/patient")}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all"
              >
                Back to Dashboard
              </button>
            </div>

          </div>
        </main>
      </div>

      {/* ── Doctor Alert Modal ─────────────────────────────────────────────── */}
      {showDoctorModal && <DoctorAlertModal onClose={() => setShowDoctorModal(false)} />}
    </div>
  );
}