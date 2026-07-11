import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Candidates from './pages/Candidates';
import ResumeUpload from './pages/ResumeUpload';
import Interviews from './pages/Interviews';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CandidateSlotSelection from './pages/CandidateSlotSelection';
import VoiceScreening from './pages/VoiceScreening';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user?.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/select-slot" element={<CandidateSlotSelection />} />

          <Route path="/" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute><Profile /></PrivateRoute>
          } />

          <Route path="/jobs" element={
            <RoleRoute allowedRoles={['super_admin', 'hr_manager', 'recruiter']}>
              <Jobs />
            </RoleRoute>
          } />

          <Route path="/candidates" element={
            <RoleRoute allowedRoles={['super_admin', 'hr_manager', 'recruiter']}>
              <Candidates />
            </RoleRoute>
          } />

          <Route path="/resume-upload" element={
            <RoleRoute allowedRoles={['super_admin', 'hr_manager', 'recruiter']}>
              <ResumeUpload />
            </RoleRoute>
          } />

          <Route path="/interviews" element={
            <RoleRoute allowedRoles={['super_admin', 'hr_manager', 'recruiter']}>
              <Interviews />
            </RoleRoute>
          } />

          <Route path="/voice-screening" element={
            <RoleRoute allowedRoles={['super_admin', 'hr_manager', 'recruiter']}>
              <VoiceScreening />
            </RoleRoute>
          } />

          <Route path="/projects" element={
            <RoleRoute allowedRoles={['super_admin', 'project_manager', 'team_lead', 'developer']}>
              <Projects />
            </RoleRoute>
          } />

          <Route path="/analytics" element={
            <RoleRoute allowedRoles={['super_admin', 'hr_manager', 'project_manager', 'team_lead']}>
              <Analytics />
            </RoleRoute>
          } />

          <Route path="/user-management" element={
            <RoleRoute allowedRoles={['super_admin']}>
              <UserManagement />
            </RoleRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;