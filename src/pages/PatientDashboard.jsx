import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function PatientDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) setUserData(userDoc.data());

        const resultsQ = query(collection(db, 'testResults'), where('userId', '==', currentUser.uid));
        const resultsSnap = await getDocs(resultsQ);
        setTestResults(resultsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const apptQ = query(collection(db, 'appointments'), where('patientId', '==', currentUser.uid));
        const apptSnap = await getDocs(apptQ);
        setAppointments(apptSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchData();
  }, [currentUser]);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const latestResult = testResults.length > 0
    ? testResults.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    : null;

  const diseases = [
    { key: 'parkinsons', label: "Parkinson's", icon: '✋', color: '#ef4444' },
    { key: 'alzheimers', label: "Alzheimer's", icon: '🧩', color: '#f97316' },
    { key: 'stroke', label: 'Stroke', icon: '⚡', color: '#eab308' },
    { key: 'ms', label: 'MS', icon: '👁️', color: '#3b82f6' },
    { key: 'cognitive', label: 'Cognitive', icon: '🎮', color: '#8b5cf6' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 neuro-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-animation">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 glass border-r border-white/10 z-40 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 neuro-gradient rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-xl font-bold gradient-text">NeuroPulse</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', icon: '🏠', label: 'Overview' },
            { id: 'medipass', icon: '🏥', label: 'MediPass' },
            { id: 'screening', icon: '🧠', label: 'NeuroScan' },
            { id: 'games', icon: '🎮', label: 'Brain Games' },
            { id: 'results', icon: '📊', label: 'My Results' },
            { id: 'appointments', icon: '📅', label: 'Appointments' },
            { id: 'history', icon: '📋', label: 'Medical History' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'medipass') navigate('/medipass');
                else if (item.id === 'screening') navigate('/screening');
                else if (item.id === 'results') navigate('/results');
                else if (item.id === 'games') navigate('/games');
                else setActiveTab(item.id);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left ${
                activeTab === item.id
                  ? 'neuro-gradient text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
              {userData?.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{userData?.name || 'Patient'}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition"
          >
            Logout →
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-black">
                Welcome back, <span className="gradient-text">{userData?.name?.split(' ')[0] || 'Patient'}</span>! 👋
              </h1>
              <p className="text-gray-400 mt-1">Here's your brain health overview</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Tests Taken', value: testResults.length, icon: '🧠', color: 'from-purple-900/40 to-purple-800/20' },
                { label: 'Appointments', value: appointments.length, icon: '📅', color: 'from-blue-900/40 to-blue-800/20' },
                { label: 'Brain Health', value: latestResult ? `${latestResult.overallScore || 0}%` : 'N/A', icon: '💚', color: 'from-green-900/40 to-green-800/20' },
                { label: 'Last Test', value: latestResult ? new Date(latestResult.date).toLocaleDateString() : 'Never', icon: '📆', color: 'from-orange-900/40 to-orange-800/20' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-gradient-to-br ${stat.color} border border-white/10 rounded-2xl p-5`}
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-black">{stat.value}</div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Disease Risk Bars */}
            {latestResult && (
              <div className="glass rounded-3xl p-6 mb-8">
                <h2 className="text-xl font-bold mb-6">Latest Screening Results</h2>
                <div className="space-y-4">
                  {diseases.map((disease, i) => {
                    const score = latestResult[disease.key] || 0;
                    const risk = score > 70 ? 'High Risk' : score > 40 ? 'Moderate' : 'Low Risk';
                    const riskColor = score > 70 ? 'text-red-400' : score > 40 ? 'text-yellow-400' : 'text-green-400';
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span>{disease.icon}</span>
                            <span className="font-medium">{disease.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-semibold ${riskColor}`}>{risk}</span>
                            <span className="font-bold">{score}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-2 rounded-full"
                            style={{ backgroundColor: disease.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: '🧠', title: 'Start NeuroScan', desc: 'Take neurological screening tests', action: () => navigate('/screening'), gradient: true },
                { icon: '🎮', title: 'Brain Games', desc: 'Memory training & cognitive exercises', action: () => navigate('/games'), gradient: false },
                { icon: '🏥', title: 'Open MediPass', desc: 'View your digital health passport', action: () => navigate('/medipass'), gradient: false },
                { icon: '📊', title: 'View Reports', desc: 'See detailed test results & graphs', action: () => navigate('/results'), gradient: false },
              ].map((item, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  onClick={item.action}
                  className={`p-6 rounded-2xl text-left card-hover transition ${
                    item.gradient ? 'neuro-gradient' : 'glass border border-white/10'
                  }`}
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="font-bold mb-1">{item.title}</div>
                  <div className="text-sm text-gray-300">{item.desc}</div>
                </motion.button>
              ))}
            </div>

            {!latestResult && (
              <div className="glass rounded-3xl p-10 text-center mt-8">
                <div className="text-5xl mb-4">🧠</div>
                <h3 className="text-xl font-bold mb-2">No Tests Taken Yet</h3>
                <p className="text-gray-400 mb-6">Take your first NeuroScan to see your brain health results here</p>
                <button
                  onClick={() => navigate('/screening')}
                  className="px-8 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition"
                >
                  Start First Screening →
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black mb-2">My Appointments</h1>
            <p className="text-gray-400 mb-8">View and manage your doctor appointments</p>
            {appointments.length === 0 ? (
              <div className="glass rounded-3xl p-10 text-center">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="text-xl font-bold mb-2">No Appointments Yet</h3>
                <p className="text-gray-400 mb-6">Book an appointment through MediPass</p>
                <button onClick={() => navigate('/medipass')} className="px-8 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">
                  Book Appointment →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt, i) => (
                  <div key={i} className="glass rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-2xl">👨‍⚕️</div>
                      <div>
                        <p className="font-bold">{appt.doctorName || 'Doctor'}</p>
                        <p className="text-sm text-gray-400">{appt.date} at {appt.time}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      appt.status === 'confirmed' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'
                    }`}>{appt.status || 'Pending'}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Medical History Tab */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black mb-2">Medical History</h1>
            <p className="text-gray-400 mb-8">Your complete medical background</p>
            <div className="glass rounded-3xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', value: userData?.name },
                  { label: 'Email', value: userData?.email },
                  { label: 'Blood Group', value: userData?.bloodGroup || 'Not set' },
                  { label: 'Age', value: userData?.age || 'Not set' },
                  { label: 'Phone', value: userData?.phone || 'Not set' },
                  { label: 'Member Since', value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="font-semibold">{item.value || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-4">Test History</h2>
              {testResults.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No tests taken yet</p>
              ) : (
                <div className="space-y-3">
                  {testResults.sort((a, b) => new Date(b.date) - new Date(a.date)).map((result, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">NeuroScan Screening</p>
                        <p className="text-sm text-gray-400">{new Date(result.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg gradient-text">{result.overallScore || 0}%</p>
                        <p className="text-xs text-gray-400">Overall Health</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}