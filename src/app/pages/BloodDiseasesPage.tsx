import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Activity, LayoutDashboard, Droplets, ShieldAlert,
  LineChart, Bell, Settings, LogOut, Menu, X, Calendar,
  Upload, Info, HelpCircle, ArrowLeft, Loader2, ChevronRight,
  FileText, CheckCircle2, AlertCircle, User, Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BloodCountValues {
  hemoglobin: string;
  wbc: string;
  rbc: string;
  platelets: string;
  hematocrit: string;
  mcv: string;
  mch: string;
  mchc: string;
}

interface Symptoms {
  fatigue: boolean;
  pallor: boolean;
  frequentInfections: boolean;
  bruising: boolean;
  weightLoss: boolean;
  nightSweats: boolean;
  bonePain: boolean;
  shortnessOfBreath: boolean;
  dizziness: boolean;
  headaches: boolean;
  enlargedLymphNodes: boolean;
  fever: boolean;
}

interface FormData {
  bloodCount: BloodCountValues;
  symptoms: Symptoms;
  age: string;
  gender: "male" | "female" | "other" | "";
  familyHistory: "yes" | "no" | "";
  familyHistoryDetails: string;
  uploadedFile: File | null;
}

const sidebarNav = [
  { icon: LayoutDashboard, label: "Dashboard",          path: "/dashboard/patient",              active: false },
  { icon: Droplets,        label: "Glucose Logs",       path: "/dashboard/patient/glucose",      active: false },
  { icon: ShieldAlert,     label: "Blood Disease Check",path: "/dashboard/patient/blood-disease",active: true },
  { icon: Settings,        label: "Settings",           path: null,                              active: false },
];

// ─── Tooltip Component ────────────────────────────────────────────────────────
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}

// ─── Input Field with Tooltip ─────────────────────────────────────────────────
function InputWithTooltip({
  label,
  tooltip,
  value,
  onChange,
  placeholder,
  unit,
  optional = false,
  type = "text",
}: {
  label: string;
  tooltip: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  unit?: string;
  optional?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>
        {label}
        {optional && <span className="text-slate-400 font-normal text-xs">(optional)</span>}
        <Tooltip content={tooltip}>
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        </Tooltip>
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-sm"
        />
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BloodDiseasesPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    bloodCount: {
      hemoglobin: "",
      wbc: "",
      rbc: "",
      platelets: "",
      hematocrit: "",
      mcv: "",
      mch: "",
      mchc: "",
    },
    symptoms: {
      fatigue: false,
      pallor: false,
      frequentInfections: false,
      bruising: false,
      weightLoss: false,
      nightSweats: false,
      bonePain: false,
      shortnessOfBreath: false,
      dizziness: false,
      headaches: false,
      enlargedLymphNodes: false,
      fever: false,
    },
    age: "",
    gender: "",
    familyHistory: "",
    familyHistoryDetails: "",
    uploadedFile: null,
  });

  const handleSignOut = () => { signOut(); navigate("/"); };

  const updateBloodCount = (field: keyof BloodCountValues, value: string) => {
    setFormData((prev) => ({
      ...prev,
      bloodCount: { ...prev.bloodCount, [field]: value },
    }));
  };

  const toggleSymptom = (symptom: keyof Symptoms) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: { ...prev.symptoms, [symptom]: !prev.symptoms[symptom] },
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, uploadedFile: file }));
  };

  const selectedSymptomsCount = Object.values(formData.symptoms).filter(Boolean).length;

  const handleRunAnalysis = async () => {
    setLoading(true);
    // Simulate AI analysis
    await new Promise((r) => setTimeout(r, 2000));
    setLoading(false);
    // Navigate to results page
    navigate("/dashboard/patient/blood-disease/results");
  };

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
            onClick={() => navigate("/dashboard/patient")}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
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
          <div className="max-w-4xl mx-auto">

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-red-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h1 className="text-slate-900" style={{ fontWeight: 800, fontSize: "1.6rem", letterSpacing: "-0.02em" }}>
                    Blood Disease Screening
                  </h1>
                  <p className="text-slate-500 text-sm">AI-powered risk assessment for blood conditions</p>
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Partial data entry is allowed</p>
                    <p className="text-blue-700">Enter any available information. The AI will analyze what you provide and note missing inputs, adjusting the confidence score accordingly.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 1: Full Blood Count ────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Full Blood Count (CBC)</h2>
                  <p className="text-slate-400 text-xs">If you have recent lab results, enter the values below</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputWithTooltip
                  label="Hemoglobin (Hb)"
                  tooltip="Normal: Men 13.5-17.5 g/dL, Women 12.0-15.5 g/dL. Low levels may indicate anemia."
                  value={formData.bloodCount.hemoglobin}
                  onChange={(v) => updateBloodCount("hemoglobin", v)}
                  placeholder="e.g. 14.2"
                  unit="g/dL"
                  optional
                />

                <InputWithTooltip
                  label="White Blood Cell Count (WBC)"
                  tooltip="Normal: 4,500-11,000 cells/μL. Abnormal levels may indicate infection or blood disorders."
                  value={formData.bloodCount.wbc}
                  onChange={(v) => updateBloodCount("wbc", v)}
                  placeholder="e.g. 7500"
                  unit="cells/μL"
                  optional
                />

                <InputWithTooltip
                  label="Red Blood Cell Count (RBC)"
                  tooltip="Normal: Men 4.5-5.9 million/μL, Women 4.1-5.1 million/μL"
                  value={formData.bloodCount.rbc}
                  onChange={(v) => updateBloodCount("rbc", v)}
                  placeholder="e.g. 4.8"
                  unit="million/μL"
                  optional
                />

                <InputWithTooltip
                  label="Platelet Count"
                  tooltip="Normal: 150,000-450,000 cells/μL. Low levels increase bleeding risk."
                  value={formData.bloodCount.platelets}
                  onChange={(v) => updateBloodCount("platelets", v)}
                  placeholder="e.g. 250000"
                  unit="cells/μL"
                  optional
                />

                <InputWithTooltip
                  label="Hematocrit (Hct)"
                  tooltip="Normal: Men 38.8-50.0%, Women 34.9-44.5%. Percentage of blood volume occupied by red blood cells."
                  value={formData.bloodCount.hematocrit}
                  onChange={(v) => updateBloodCount("hematocrit", v)}
                  placeholder="e.g. 42.5"
                  unit="%"
                  optional
                />

                <InputWithTooltip
                  label="Mean Corpuscular Volume (MCV)"
                  tooltip="Normal: 80-100 fL. Average size of red blood cells. Helps classify types of anemia."
                  value={formData.bloodCount.mcv}
                  onChange={(v) => updateBloodCount("mcv", v)}
                  placeholder="e.g. 90"
                  unit="fL"
                  optional
                />

                <InputWithTooltip
                  label="Mean Corpuscular Hemoglobin (MCH)"
                  tooltip="Normal: 27-33 pg. Average amount of hemoglobin per red blood cell."
                  value={formData.bloodCount.mch}
                  onChange={(v) => updateBloodCount("mch", v)}
                  placeholder="e.g. 30"
                  unit="pg"
                  optional
                />

                <InputWithTooltip
                  label="MCHC"
                  tooltip="Normal: 32-36 g/dL. Average concentration of hemoglobin in red blood cells."
                  value={formData.bloodCount.mchc}
                  onChange={(v) => updateBloodCount("mchc", v)}
                  placeholder="e.g. 34"
                  unit="g/dL"
                  optional
                />
              </div>

              {/* File Upload */}
              <div className="mt-5 pt-5 border-t border-slate-100">
                <label className="flex items-center gap-2 text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>
                  Upload CBC Lab Report
                  <span className="text-slate-400 font-normal text-xs">(optional)</span>
                  <Tooltip content="Upload a PDF or image of your recent Complete Blood Count lab results">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </Tooltip>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center gap-3 w-full px-4 py-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-red-300 hover:bg-red-50/30 transition-all cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {formData.uploadedFile ? formData.uploadedFile.name : "Click to upload PDF or image"}
                    </span>
                  </label>
                  {formData.uploadedFile && (
                    <button
                      onClick={() => setFormData((prev) => ({ ...prev, uploadedFile: null }))}
                      className="absolute top-3 right-3 p-1 bg-white rounded-lg border border-slate-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Section 2: Symptoms ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-5">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Symptoms Checklist</h2>
                    <p className="text-slate-400 text-xs">Select any symptoms you've experienced recently</p>
                  </div>
                </div>
                {selectedSymptomsCount > 0 && (
                  <div className="bg-amber-50 text-amber-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                    {selectedSymptomsCount} selected
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: "fatigue" as const, label: "Unusual Fatigue or Weakness" },
                  { key: "pallor" as const, label: "Pale Skin or Pallor" },
                  { key: "frequentInfections" as const, label: "Frequent Infections" },
                  { key: "bruising" as const, label: "Easy Bruising or Bleeding" },
                  { key: "weightLoss" as const, label: "Unexplained Weight Loss" },
                  { key: "nightSweats" as const, label: "Night Sweats" },
                  { key: "bonePain" as const, label: "Bone or Joint Pain" },
                  { key: "shortnessOfBreath" as const, label: "Shortness of Breath" },
                  { key: "dizziness" as const, label: "Dizziness or Lightheadedness" },
                  { key: "headaches" as const, label: "Frequent Headaches" },
                  { key: "enlargedLymphNodes" as const, label: "Swollen Lymph Nodes" },
                  { key: "fever" as const, label: "Recurrent Fever" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleSymptom(key)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                      formData.symptoms[key]
                        ? "border-amber-500 bg-amber-50 text-amber-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.symptoms[key]
                        ? "border-amber-500 bg-amber-500"
                        : "border-slate-300 bg-white"
                    }`}>
                      {formData.symptoms[key] && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-sm" style={{ fontWeight: formData.symptoms[key] ? 600 : 400 }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Section 3: Demographics & History ──────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-slate-900" style={{ fontWeight: 700, fontSize: "1.1rem" }}>Demographics & Family History</h2>
                  <p className="text-slate-400 text-xs">Help us personalize your risk assessment</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Age */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>
                    Age
                    <Tooltip content="Your age helps determine age-specific risk factors for blood diseases">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </Tooltip>
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                    placeholder="e.g. 45"
                    min={1}
                    max={120}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>
                    Gender
                    <Tooltip content="Biological sex affects normal blood count ranges and disease risk">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </Tooltip>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "male" as const, label: "Male" },
                      { value: "female" as const, label: "Female" },
                      { value: "other" as const, label: "Other" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setFormData((prev) => ({ ...prev, gender: value }))}
                        className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          formData.gender === value
                            ? "border-teal-500 bg-teal-50 text-teal-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Family History */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-slate-700 mb-2" style={{ fontWeight: 600 }}>
                    Family History of Blood Conditions
                    <Tooltip content="Family history of anemia, leukemia, sickle cell, thalassemia, or other blood disorders">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    </Tooltip>
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { value: "yes" as const, label: "Yes" },
                      { value: "no" as const, label: "No" },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setFormData((prev) => ({ ...prev, familyHistory: value }))}
                        className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          formData.familyHistory === value
                            ? "border-teal-500 bg-teal-50 text-teal-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {formData.familyHistory === "yes" && (
                    <div className="mt-3">
                      <textarea
                        value={formData.familyHistoryDetails}
                        onChange={(e) => setFormData((prev) => ({ ...prev, familyHistoryDetails: e.target.value }))}
                        placeholder="Please describe the condition(s) and relationship (e.g., mother had iron-deficiency anemia)"
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm resize-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Run AI Analysis Button ─────────────────────────────────── */}
            <div className="sticky bottom-0 bg-white rounded-2xl border border-slate-100 shadow-lg p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-700" style={{ fontWeight: 600 }}>Ready to analyze?</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      The AI will process your inputs and provide a detailed risk assessment
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRunAnalysis}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 transition-all disabled:shadow-none whitespace-nowrap"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Run AI Analysis
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}