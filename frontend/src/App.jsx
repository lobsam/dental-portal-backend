import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardHome from "./pages/DashboardHome";
import PatientsPage from "./pages/PatientsPage";
import PatientAddPage from "./pages/PatientAddPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import PatientEditPage from "./pages/PatientEditPage";
import DentalChartPage from "./pages/DentalChartPage";
import DentalNoteAddPage from "./pages/DentalNoteAddPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import ManagersPage from "./pages/ManagersPage";
import StaffListPage from "./pages/StaffListPage";
import StaffAddPage from "./pages/StaffAddPage";
import RoleManagerPage from "./pages/RoleManagerPage";
import RoleFormPage from "./pages/RoleFormPage";
import ComingSoonPage from "./pages/ComingSoonPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/add" element={<PatientAddPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/patients/:id/edit" element={<PatientEditPage />} />
        <Route path="/patients/:id/dental-chart" element={<DentalChartPage />} />
        <Route path="/patients/:id/dental-notes/add" element={<DentalNoteAddPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/managers/:tab" element={<ManagersPage />} />
        <Route path="/managers" element={<Navigate to="/managers/procedures" replace />} />
        <Route path="/finance" element={<ComingSoonPage title="Finance" />} />
        <Route path="/settings" element={<Navigate to="/settings/staff" replace />} />
        <Route path="/settings/staff" element={<StaffListPage />} />
        <Route path="/settings/staff/add" element={<StaffAddPage />} />
        <Route path="/settings/staff/:id/edit" element={<StaffAddPage />} />
        <Route path="/settings/roles" element={<RoleManagerPage />} />
        <Route path="/settings/roles/add" element={<RoleFormPage />} />
        <Route path="/settings/roles/:id/edit" element={<RoleFormPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
