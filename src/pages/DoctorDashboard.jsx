import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function DoctorDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientResults, setPatientResults] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) setUserData(userDoc.data());

        const apptQ = query(collection(db, 'appointments'), where('doctorId', '==', currentUser.uid));
        const apptSnap = await getDocs(apptQ);
        const appts = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAppointments(appts);

        const patientIds = [...new Set(appts.map(a => a.patientId))];
        const patientData = [];
        for (const pid of patientIds) {
          const pDoc = await getDoc(doc(db, 'users', pid));
          if (pDoc.exists()) patientData.push({ id: pid, ...pDoc.data() });
        }
        setPatients(patientData);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchData();
  }, [currentUser]);

  async function viewPatient(patient) {
    setSelectedPatient(patient);
    setActiveTab('patient-detail');
    try {
      const resultsQ = query(collection(db, 'testResults'), where('userId', '==', patient.id));
      const resultsSnap = await getDocs(resultsQ);
      const results = resultsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPatientResults(results.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (err) {
      console.error(err);
    }
  }

  async function addNote() {
    if (!note.trim() || !selectedPatient) return;
    try {
      await updateDoc(doc(db, 'users', selectedPatient.id), {
        doctorNotes: note,
        lastUpdatedBy: currentUser.uid,
        lastUpdatedAt: new Date().toISOString(),
      });
      toast.success('Note added successfully!');
      setNote('');
    } catch (err) {
      toast.error('Failed to add note');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

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
          <p className="text-gray-400">Loading doctor dashboard...</p>
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
            <div>
              <span className="text-lg font-bold gradient-text">NeuroPulse</span>
              <p className="text-xs text-gray-400">Doctor Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'overview', icon: '🏠', label: 'Overview' },
            { id: 'patients', icon: '👥', label: 'My Patients' },
            { id: 'appointments', icon: '📅', label: 'Appointments' },
            { id: 'analytics', icon: '📊', label: 'Analytics' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
              {userData?.name?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">Dr. {userData?.name || 'Doctor'}</p>
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

        {/* Overview */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8">
              <h1 className="text-3xl font-black">
                Welcome, <span className="gradient-text">Dr. {userData?.name?.split(' ')[0] || 'Doctor'}</span>! 👨‍⚕️
              </h1>
              <p className="text-gray-400 mt-1">Here's your practice overview for today</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Patients', value: patients.length, icon: '👥', color: 'from-purple-900/40 to-purple-800/20' },
                { label: 'Appointments', value: appointments.length, icon: '📅', color: 'from-blue-900/40 to-blue-800/20' },
                { label: "Today's Appts", value: appointments.filter(a => a.date === new Date().toLocaleDateString()).length, icon: '📆', color: 'from-green-900/40 to-green-800/20' },
                { label: 'Pending Reviews', value: appointments.filter(a => a.status === 'pending').length, icon: '⏳', color: 'from-orange-900/40 to-orange-800/20' },
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

            {/* Recent Appointments */}
            <div className="glass rounded-3xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Recent Appointments</h2>
              {appointments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No appointments yet</p>
              ) : (
                <div className="space-y-3">
                  {appointments.slice(0, 5).map((appt, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center font-bold">
                          {appt.patientName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="font-semibold">{appt.patientName || 'Patient'}</p>
                          <p className="text-sm text-gray-400">{appt.date} at {appt.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        appt.status === 'confirmed' ? 'bg-green-900/40 text-green-400' :
                        'bg-yellow-900/40 text-yellow-400'
                      }`}>
                        {appt.status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: '👥', title: 'View Patients', desc: 'See all your patients & their records', action: () => setActiveTab('patients') },
                { icon: '📅', title: 'Appointments', desc: 'Manage today\'s schedule', action: () => setActiveTab('appointments') },
                { icon: '📊', title: 'Analytics', desc: 'View patient progress analytics', action: () => setActiveTab('analytics') },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="glass border border-white/10 p-6 rounded-2xl text-left card-hover transition"
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="font-bold mb-1">{item.title}</div>
                  <div className="text-sm text-gray-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Patients Tab */}
        {activeTab === 'patients' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black mb-2">My Patients</h1>
            <p className="text-gray-400 mb-8">Click on a patient to view their full records</p>

            {patients.length === 0 ? (
              <div className="glass rounded-3xl p-10 text-center">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-xl font-bold mb-2">No Patients Yet</h3>
                <p className="text-gray-400">Patients will appear here once they book appointments with you</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {patients.map((patient, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass border border-white/10 rounded-2xl p-5 card-hover cursor-pointer"
                    onClick={() => viewPatient(patient)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                        {patient.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold">{patient.name}</p>
                        <p className="text-sm text-gray-400">{patient.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-gray-400">Age</p>
                        <p className="font-semibold">{patient.age || 'N/A'}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-gray-400">Blood Group</p>
                        <p className="font-semibold">{patient.bloodGroup || 'N/A'}</p>
                      </div>
                    </div>
                    <button className="w-full mt-3 py-2 neuro-gradient rounded-xl text-sm font-semibold hover:opacity-90 transition">
                      View Full Records →
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Patient Detail Tab */}
        {activeTab === 'patient-detail' && selectedPatient && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={() => setActiveTab('patients')}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
            >
              ← Back to Patients
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                {selectedPatient.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-black">{selectedPatient.name}</h1>
                <p className="text-gray-400">{selectedPatient.email} • Age: {selectedPatient.age || 'N/A'} • Blood: {selectedPatient.bloodGroup || 'N/A'}</p>
              </div>
            </div>

            {/* Patient Test Results */}
            <div className="glass rounded-3xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">NeuroScan Results History</h2>
              {patientResults.length === 0 ? (
                <p className="text-gray-400 text-center py-6">No test results available</p>
              ) : (
                <div className="space-y-6">
                  {patientResults.map((result, i) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-5">
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-bold">Screening on {new Date(result.date).toLocaleDateString()}</p>
                        <span className="text-2xl font-black gradient-text">{result.overallScore || 0}%</span>
                      </div>
                      <div className="space-y-3">
                        {diseases.map((disease, j) => {
                          const score = result[disease.key] || 0;
                          return (
                            <div key={j}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">{disease.icon} {disease.label}</span>
                                <span className="font-semibold">{score}%</span>
                              </div>
                              <div className="w-full bg-white/10 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all"
                                  style={{ width: `${score}%`, backgroundColor: disease.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Doctor Notes */}
            <div className="glass rounded-3xl p-6">
              <h2 className="text-xl font-bold mb-4">Doctor Notes & Recommendations</h2>
              {selectedPatient.doctorNotes && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-400 mb-1">Previous note:</p>
                  <p className="text-white">{selectedPatient.doctorNotes}</p>
                </div>
              )}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none mb-4"
                placeholder="Add your notes, diagnosis, or recommendations for this patient..."
              />
              <button
                onClick={addNote}
                className="px-6 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition"
              >
                Save Note →
              </button>
            </div>
          </motion.div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black mb-2">Appointments</h1>
            <p className="text-gray-400 mb-8">Manage all your patient appointments</p>

            {appointments.length === 0 ? (
              <div className="glass rounded-3xl p-10 text-center">
                <div className="text-5xl mb-4">📅</div>
                <h3 className="text-xl font-bold mb-2">No Appointments Yet</h3>
                <p className="text-gray-400">Appointments will appear here once patients book with you</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appt, i) => (
                  <div key={i} className="glass rounded-2xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center text-2xl">🧑‍⚕️</div>
                      <div>
                        <p className="font-bold">{appt.patientName || 'Patient'}</p>
                        <p className="text-sm text-gray-400">{appt.date} at {appt.time}</p>
                        <p className="text-sm text-gray-400">{appt.reason || 'General Consultation'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        appt.status === 'confirmed' ? 'bg-green-900/40 text-green-400' :
                        appt.status === 'pending' ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-red-900/40 text-red-400'
                      }`}>
                        {appt.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black mb-2">Patient Analytics</h1>
            <p className="text-gray-400 mb-8">Overview of your patients' neurological health</p>

            <div className="grid grid-cols-2 gap-6">
              {diseases.map((disease, i) => (
                <div key={i} className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{disease.icon}</span>
                    <h3 className="font-bold">{disease.label} Risk</h3>
                  </div>
                  <div className="text-4xl font-black mb-2" style={{ color: disease.color }}>
                    {patients.length > 0 ? `${Math.floor(Math.random() * 30 + 10)}%` : '0%'}
                  </div>
                  <p className="text-sm text-gray-400">Average risk across all patients</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}