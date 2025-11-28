import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SignupPatient from "./pages/SignupPatient";
import SignupDoctor from "./pages/SignupDoctor";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Consultations from "./pages/Consultations";
import Chat from "./pages/Chat";
import Analysis from "./pages/Analysis";
import Settings from "./pages/Settings";
import HealthTips from "./pages/HealthTips";

import PatientDashboard from "./pages/patient/Dashboard";
import PatientUpload from "./pages/patient/Upload";
import PatientHistory from "./pages/patient/History";
import PatientReport from "./pages/patient/Report";
import PatientConsult from "./pages/patient/Consult";
import PatientCall from "./pages/patient/Call";

import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorPatients from "./pages/doctor/Patients";
import DoctorViewReport from "./pages/doctor/ViewReport";
import DoctorCall from "./pages/doctor/Call";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup-patient" element={<SignupPatient />} />
              <Route path="/signup-doctor" element={<SignupDoctor />} />
              
              {/* Main Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/consultations" element={
                <ProtectedRoute>
                  <Consultations />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/chat/:chatId" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/analysis" element={
                <ProtectedRoute>
                  <Analysis />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/health-tips" element={
                <ProtectedRoute>
                  <HealthTips />
                </ProtectedRoute>
              } />

            <Route path="/patient/dashboard" element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientDashboard />
              </ProtectedRoute>
            } />
            <Route path="/patient/upload" element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientUpload />
              </ProtectedRoute>
            } />
            <Route path="/patient/history" element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientHistory />
              </ProtectedRoute>
            } />
            <Route path="/patient/report/:id" element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientReport />
              </ProtectedRoute>
            } />
            <Route path="/patient/consult" element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientConsult />
              </ProtectedRoute>
            } />
            <Route path="/patient/consult/:roomID" element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientCall />
              </ProtectedRoute>
            } />

            <Route path="/doctor/dashboard" element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/doctor/patients" element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorPatients />
              </ProtectedRoute>
            } />
            <Route path="/doctor/view/:id" element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorViewReport />
              </ProtectedRoute>
            } />
            <Route path="/doctor/consult/:roomID" element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <DoctorCall />
              </ProtectedRoute>
            } />

            {/* Redirect /auth to /login */}
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
