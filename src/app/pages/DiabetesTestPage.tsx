import { useState } from "react";
import { useNavigate, Link } from "react-router";
import {
  Activity, ArrowRight, ArrowLeft, ChevronRight, ChevronLeft,
  User, Scale, Droplets, Users, Dumbbell, CheckCircle,
  AlertTriangle, Heart, X, ShieldCheck, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  age: string;
  bmi: string;
  fastingGlucose: string;
  familyHistory: string;
  activityLevel: string;
}

type PageState = "test" | "result-positive" | "result-negative";

// ─── Steps Config ─────────────────────────────────────────────────────────────
const steps = [
  {
    id: 1,
    icon: User,
    color: "blue",
    question: "How old are you?",
    description: "Age is one of the most significant factors in diabetes risk assessment.",
    field: "age" as keyof FormData,
    type: "number" as const,
    placeholder: "e.g. 35",
    unit: "years",
    hint: "Risk increases significantly after age 45",
  },
  {
    id: 2,
    icon: Scale,
    color: "indigo",
    question: "What is your BMI?",
    description: "Body Mass Index helps assess weight-related health risks.",
    field: "bmi" as keyof FormData,
    type: "number" as const,
    placeholder: "e.g. 24.5",
    unit: "kg/m²",
    hint: "Normal: 18.5–24.9 · Overweight: ≥25 · Obese: ≥30",
  },
  {
    id: 3,
    icon: Droplets,
    color: "cyan",
    question: "What is your fasting glucose level?",
    description: "Measured after at least 8 hours without eating.",
    field: "fastingGlucose" as keyof FormData,
    type: "number" as const,
    placeholder: "e.g. 95",
    unit: "mg/dL",
    hint: "Normal: <100 · Prediabetes: 100–125 · Diabetes: ≥126",
  },
  {
    id: 4,
    icon: Users,
    color: "violet",
    question: "Do you have a family history of diabetes?",
    description: "Having a first-degree relative with diabetes increases your risk.",
    field: "familyHistory" as keyof FormData,
    type: "select" as const,
    options: [
      { value: "no", label: "No family history", detail: "No parent or sibling with diabetes" },
      { value: "yes", label: "Yes, parent or sibling", detail: "At least one first-degree relative has/had diabetes" },
    ],
  },
  {
    id: 5,
    icon: Dumbbell,
    color: "teal",
    question: "How would you describe your physical activity?",
    description: "Regular exercise significantly reduces diabetes risk.",
    field: "activityLevel" as keyof FormData,
    type: "select" as const,
    options: [
      { value: "active",    label: "Active",    detail: "I exercise 3+ times per week" },
      { value: "moderate",  label: "Moderate",  detail: "I exercise 1–2 times per week" },
      { value: "sedentary", label: "Sedentary", detail: "I rarely or never exercise" },
    ],
  },
];

// ─── Risk Calculator ──────────────────────────────────────────────────────────
function calculateRisk(data: FormData): { isAtRisk: boolean; score: number; maxScore: number } {
  let score = 0;
  const age = parseInt(data.age);
  const bmi = parseFloat(data.bmi);
  const glucose = parseInt(data.fastingGlucose);

  if (age >= 45) score += 2;
  else if (age >= 35) score += 1;

  if (bmi >= 30) score += 2;
  else if (bmi >= 25) score += 1;

  if (glucose >= 126) score += 3;
  else if (glucose >= 100) score += 2;

  if (data.familyHistory === "yes") score += 2;
  if (data.activityLevel === "sedentary") score += 1;

  return { isAtRisk: score >= 4, score, maxScore: 10 };
}

// ─── Color map ────────────────────────────────────────────────────────────────
const colorMap: Record<string, { bg: string; icon: string; border: string; ring: string }> = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   border: "border-blue-500",  ring: "ring-blue-100" },
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", border: "border-indigo-500",ring: "ring-indigo-100" },
  cyan:   { bg: "bg-cyan-50",   icon: "text-cyan-600",   border: "border-cyan-500",  ring: "ring-cyan-100" },
  violet: { bg: "bg-violet-50", icon: "text-violet-600", border: "border-violet-500",ring: "ring-violet-100" },
  teal:   { bg: "bg-teal-50",   icon: "text-teal-600",   border: "border-teal-500",  ring: "ring-teal-100" },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DiabetesTestPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("test");
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    age: "", bmi: "", fastingGlucose: "", familyHistory: "", activityLevel: "",
  });
  const [riskResult, setRiskResult] = useState<{ score: number; maxScore: number } | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentValue = formData[step.field];
  const colors = colorMap[step.color];

  const isValid =
    step.type === "select"
      ? currentValue !== ""
      : currentValue !== "" && !isNaN(Number(currentValue)) && Number(currentValue) > 0;

  const handleNext = () => {
    if (!isValid) return;
    if (isLastStep) {
      const result = calculateRisk(formData);
      setRiskResult({ score: result.score, maxScore: result.maxScore });
      setPageState(result.isAtRisk ? "result-positive" : "result-negative");
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleRetake = () => {
    setCurrentStep(0);
    setFormData({ age: "", bmi: "", fastingGlucose: "", familyHistory: "", activityLevel: "" });
    setRiskResult(null);
    setPageState("test");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) handleNext();
  };

  const Icon = step.icon;
  const riskPercent = riskResult ? Math.round((riskResult.score / riskResult.maxScore) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex flex-col">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-slate-800" style={{ fontWeight: 700, fontSize: "1rem" }}>
            Dia<span className="text-blue-600">Check</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/auth"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-200"
          >
            Create Account
          </Link>
        </div>
      </nav>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">

        {/* ── TEST FORM ─────────────────────────────────────────────────────── */}
        {pageState === "test" && (
          <div className="w-full max-w-2xl">

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                Free · Instant · Confidential
              </div>
              <h1 className="text-slate-900 mb-3" style={{ fontWeight: 800, fontSize: "clamp(1.6rem, 4vw, 2.2rem)", letterSpacing: "-0.02em" }}>
                Diabetes Risk Screening
              </h1>
              <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
                Answer 5 simple questions to get your personalized diabetes risk assessment powered by AI.
              </p>
            </div>

            {/* Card */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

              {/* Progress Header */}
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-8 pt-7 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-white/80 text-sm font-medium">
                    Question {currentStep + 1} of {steps.length}
                  </span>
                  <span className="text-white/80 text-sm font-medium">
                    {Math.round(progress)}% complete
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {/* Step dots */}
                <div className="flex gap-2 mt-4 justify-center">
                  {steps.map((s, i) => (
                    <div
                      key={s.id}
                      className={`rounded-full transition-all duration-300 ${
                        i === currentStep
                          ? "w-6 h-2 bg-white"
                          : i < currentStep
                          ? "w-2 h-2 bg-white/60"
                          : "w-2 h-2 bg-white/25"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div className="px-8 py-8">

                {/* Question */}
                <div className="flex items-start gap-4 mb-7">
                  <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-7 h-7 ${colors.icon}`} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="text-slate-900 mb-1.5" style={{ fontWeight: 700, fontSize: "1.2rem" }}>
                      {step.question}
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Number Input */}
                {step.type === "number" && (
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="number"
                        value={currentValue}
                        onChange={(e) => setFormData((d) => ({ ...d, [step.field]: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        placeholder={step.placeholder}
                        autoFocus
                        className={`w-full px-5 py-4 pr-24 border-2 rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none transition-all text-lg ${
                          currentValue
                            ? `${colors.border} ring-4 ${colors.ring} focus:${colors.border}`
                            : "border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                        }`}
                        style={{ fontWeight: 600 }}
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                        {step.unit}
                      </span>
                    </div>
                    {step.hint && (
                      <div className="flex items-start gap-2 mt-3 text-xs text-slate-400">
                        <Info className="w-3.5 h-3.5 mt-0.5 text-blue-400 flex-shrink-0" />
                        <span>{step.hint}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Select Options */}
                {step.type === "select" && (
                  <div className="space-y-3 mb-6">
                    {step.options?.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFormData((d) => ({ ...d, [step.field]: opt.value }))}
                        className={`w-full px-5 py-4 rounded-2xl border-2 text-left transition-all duration-150 ${
                          currentValue === opt.value
                            ? `${colors.border} ${colors.bg} ring-4 ${colors.ring}`
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm ${currentValue === opt.value ? colors.icon : "text-slate-800"}`}
                               style={{ fontWeight: currentValue === opt.value ? 700 : 500 }}>
                              {opt.label}
                            </p>
                            {"detail" in opt && (
                              <p className="text-slate-400 text-xs mt-0.5">{(opt as { detail: string }).detail}</p>
                            )}
                          </div>
                          {currentValue === opt.value && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${colors.icon.replace("text-", "bg-").replace("-600", "-500")}`}
                                 style={{ backgroundColor: undefined }}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                step.color === "violet" ? "bg-violet-500" :
                                step.color === "teal"   ? "bg-teal-500"   : "bg-blue-500"
                              }`}>
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-2 px-5 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm font-semibold"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    disabled={!isValid}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isValid
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {isLastStep ? "Get My Results" : "Continue"}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Disclaimer */}
                <p className="text-center text-xs text-slate-400 mt-5">
                  ⚕️ This screening is for informational purposes only and is not a medical diagnosis.
                </p>
              </div>
            </div>

            {/* Back to home */}
            <div className="text-center mt-6">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm transition-colors mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>
            </div>
          </div>
        )}

        {/* ── RESULT: AT RISK ────────────────────────────────────────────────── */}
        {pageState === "result-positive" && (
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
              {/* Top stripe */}
              <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" />

              <div className="px-8 py-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-12 h-12 text-amber-500" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className="text-center mb-6">
                  <h2 className="text-slate-900 mb-2" style={{ fontWeight: 800, fontSize: "1.5rem" }}>
                    You May Be at Risk
                  </h2>
                  <p className="text-amber-600 font-semibold mb-3 text-base">
                    Elevated diabetes risk indicators detected.
                  </p>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Based on your responses, some of your health indicators suggest a potentially elevated 
                    risk of diabetes. Early detection is the first step toward better health — 
                    create a free account to start monitoring and receive personalized guidance.
                  </p>
                </div>

                {/* Risk score bar */}
                {riskResult && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-amber-700 text-xs font-semibold uppercase tracking-wide">Risk Score</span>
                      <span className="text-amber-700 text-sm font-bold">{riskResult.score} / {riskResult.maxScore}</span>
                    </div>
                    <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-700"
                        style={{ width: `${riskPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Next steps */}
                <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                  <p className="text-slate-700 text-xs font-semibold uppercase tracking-wide mb-3">Recommended Next Steps</p>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    {[
                      "Create a free DiaCheck account to track your metrics",
                      "Consult with your healthcare provider soon",
                      "Start monitoring your blood glucose levels daily",
                      "Review your diet and physical activity habits",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => navigate("/auth")}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    Create a Free Account & Start Monitoring
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate("/auth")}
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Sign In to Existing Account
                  </button>
                  <button
                    onClick={handleRetake}
                    className="w-full py-3 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                  >
                    ↺ Retake the Test
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                  ⚕️ This result is not a clinical diagnosis. Please consult a physician.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT: LOW RISK ──────────────────────────────────────────────── */}
        {pageState === "result-negative" && (
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
              {/* Top stripe */}
              <div className="h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

              <div className="px-8 py-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-teal-400 rounded-full flex items-center justify-center shadow-md">
                      <Heart className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                </div>

                {/* Text */}
                <div className="text-center mb-6">
                  <h2 className="text-slate-900 mb-2" style={{ fontWeight: 800, fontSize: "1.5rem" }}>
                    Great News! 🎉
                  </h2>
                  <p className="text-emerald-600 font-semibold mb-3 text-base">
                    Your condition looks good — no diabetes risk detected.
                  </p>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Based on your responses, your health indicators currently show a low risk for diabetes. 
                    Keep up the healthy habits! Regular check-ups and an active lifestyle 
                    are your best allies for long-term wellness.
                  </p>
                </div>

                {/* Risk score bar */}
                {riskResult && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wide">Risk Score</span>
                      <span className="text-emerald-700 text-sm font-bold">{riskResult.score} / {riskResult.maxScore}</span>
                    </div>
                    <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
                        style={{ width: `${riskPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div className="bg-emerald-50 rounded-2xl p-4 mb-6">
                  <p className="text-emerald-700 text-xs font-semibold uppercase tracking-wide mb-3">Tips to Stay Healthy</p>
                  <ul className="space-y-2 text-emerald-800 text-sm">
                    {[
                      "Exercise for 30 minutes most days of the week",
                      "Maintain a balanced, low-sugar diet",
                      "Get an annual blood glucose check with your doctor",
                      "Stay hydrated and manage stress levels",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => navigate("/")}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    Back to Home
                  </button>
                  <button
                    onClick={() => navigate("/auth")}
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Create an Account to Track Over Time
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRetake}
                    className="w-full py-3 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                  >
                    ↺ Retake the Test
                  </button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                  ⚕️ This result is not a clinical diagnosis. Please consult a physician regularly.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
