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

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/jobs" element={
            <PrivateRoute><Jobs /></PrivateRoute>
          } />
          <Route path="/candidates" element={
            <PrivateRoute><Candidates /></PrivateRoute>
          } />
          <Route path="/resume-upload" element={
            <PrivateRoute><ResumeUpload /></PrivateRoute>
          } />
          <Route path="/interviews" element={
            <PrivateRoute><Interviews /></PrivateRoute>
          } />
          <Route path="/projects" element={
            <PrivateRoute><Projects /></PrivateRoute>
          } />
          <Route path="/analytics" element={
            <PrivateRoute><Analytics /></PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;