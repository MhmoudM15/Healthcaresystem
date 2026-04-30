import { createBrowserRouter, Navigate } from "react-router";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import GlucoseLogsPage from "./pages/GlucoseLogsPage";
import AISummaryPage from "./pages/AISummaryPage";
import BloodDiseasesPage from "./pages/BloodDiseasesPage";
import BloodDiseaseResultsPage from "./pages/BloodDiseaseResultsPage";
import PatientSettingsPage from "./pages/PatientSettingsPage";

export const router = createBrowserRouter([
  { path: "/",                                         Component: LandingPage },
  { path: "/auth",                                     Component: AuthPage },
  { path: "/dashboard/patient",                        Component: PatientDashboard },
  { path: "/dashboard/patient/glucose",                Component: GlucoseLogsPage },
  { path: "/dashboard/patient/ai-summary",             Component: AISummaryPage },
  { path: "/dashboard/patient/blood-disease",          Component: BloodDiseasesPage },
  { path: "/dashboard/patient/blood-disease/results",  Component: BloodDiseaseResultsPage },
  { path: "/dashboard/patient/settings",               Component: PatientSettingsPage },
  { path: "/dashboard/doctor",                         Component: DoctorDashboard },
  { path: "*", Component: () => <Navigate to="/" replace /> },
]);
