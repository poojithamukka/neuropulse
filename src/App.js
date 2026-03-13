import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
 
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import MediPass from './pages/MediPass';
import Screening from './pages/Screening';
import Results from './pages/Results';
import MemoryGames from './pages/MemoryGames';
 
function PrivateRoute({ children, role }) {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-16 h-16 neuro-gradient rounded-2xl flex items-center justify-center pulse-animation">
        <span className="text-white font-black text-2xl">N</span>
      </div>
    </div>
  );
  if (!currentUser) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to="/login" />;
  return children;
}
 
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-950">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/patient/dashboard" element={
              <PrivateRoute role="patient">
                <PatientDashboard />
              </PrivateRoute>
            } />
            <Route path="/doctor/dashboard" element={
              <PrivateRoute role="doctor">
                <DoctorDashboard />
              </PrivateRoute>
            } />
            <Route path="/medipass" element={
              <PrivateRoute role="patient">
                <MediPass />
              </PrivateRoute>
            } />
            <Route path="/screening" element={
              <PrivateRoute role="patient">
                <Screening />
              </PrivateRoute>
            } />
            <Route path="/results" element={
              <PrivateRoute role="patient">
                <Results />
              </PrivateRoute>
            } />
            <Route path="/games" element={
              <PrivateRoute role="patient">
                <MemoryGames />
              </PrivateRoute>
            } />
          </Routes>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          theme="dark"
        />
      </Router>
    </AuthProvider>
  );
}
 
export default App;
