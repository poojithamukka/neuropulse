import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { QRCodeSVG as QRCode } from 'qrcode.react';

export default function MediPass() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('passport');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    allergies: '',
    conditions: '',
    medications: '',
    emergencyContact: '',
    emergencyPhone: '',
    doctorName: '',
    doctorPhone: '',
    height: '',
    weight: '',
    notes: '',
  });
  const [history, setHistory] = useState([]);
  const [newHistory, setNewHistory] = useState({
    date: '',
    condition: '',
    treatment: '',
    hospital: '',
    doctor: '',
  });

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData({
            allergies: data.allergies || '',
            conditions: data.conditions || '',
            medications: data.medications || '',
            emergencyContact: data.emergencyContact || '',
            emergencyPhone: data.emergencyPhone || '',
            doctorName: data.doctorName || '',
            doctorPhone: data.doctorPhone || '',
            height: data.height || '',
            weight: data.weight || '',
            notes: data.notes || '',
          });
          setHistory(data.medicalHistory || []);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchData();
  }, [currentUser]);

  async function saveProfile() {
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      setUserData(prev => ({ ...prev, ...formData }));
      setEditing(false);
      toast.success('MediPass updated successfully!');
    } catch (err) {
      toast.error('Failed to update MediPass');
    }
  }

  async function addHistory() {
    if (!newHistory.condition || !newHistory.date) {
      return toast.error('Please fill date and condition!');
    }
    try {
      const updatedHistory = [...history, { ...newHistory, id: Date.now() }];
      await updateDoc(doc(db, 'users', currentUser.uid), {
        medicalHistory: updatedHistory,
      });
      setHistory(updatedHistory);
      setNewHistory({ date: '', condition: '', treatment: '', hospital: '', doctor: '' });
      toast.success('Medical history added!');
    } catch (err) {
      toast.error('Failed to add history');
    }
  }

  async function deleteHistory(id) {
    const updatedHistory = history.filter(h => h.id !== id);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      medicalHistory: updatedHistory,
    });
    setHistory(updatedHistory);
    toast.success('Record deleted!');
  }

  const qrData = window.location.origin + '/patient-profile/' + currentUser?.uid;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 neuro-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-animation">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <p className="text-gray-400">Loading MediPass...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <h1 className="text-xl font-black gradient-text">MediPass</h1>
              <p className="text-xs text-gray-400">Digital Health Passport</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {['passport', 'details', 'history', 'appointments'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? 'neuro-gradient text-white'
                  : 'glass text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'passport' ? '🪪 Passport' :
               tab === 'details' ? '📋 Details' :
               tab === 'history' ? '📜 History' : '📅 Appointments'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">

        {/* Passport Tab - QR Code */}
        {activeTab === 'passport' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-3xl font-black mb-2 text-center">
              Your <span className="gradient-text">MediPass</span> Card
            </h2>
            <p className="text-gray-400 mb-8 text-center">
              Show this QR code to any doctor for instant access to your medical records
            </p>

            {/* MediPass Card */}
            <div className="glass border border-purple-500/30 rounded-3xl p-8 max-w-md w-full mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 neuro-gradient rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">N</span>
                    </div>
                    <span className="font-bold gradient-text">NeuroPulse</span>
                  </div>
                  <p className="text-xs text-gray-400">Digital Health Passport</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Blood Group</p>
                  <p className="text-2xl font-black text-red-400">{userData?.bloodGroup || 'N/A'}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="bg-white p-4 rounded-2xl">
                  <QRCode
                    value={qrData}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-xl font-black">{userData?.name}</p>
                <p className="text-sm text-gray-400">ID: {currentUser?.uid?.slice(0, 12).toUpperCase()}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">Allergies</p>
                  <p className="font-semibold text-xs">{userData?.allergies || 'None listed'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">Conditions</p>
                  <p className="font-semibold text-xs">{userData?.conditions || 'None listed'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">Emergency</p>
                  <p className="font-semibold text-xs">{userData?.emergencyContact || 'Not set'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-1">Phone</p>
                  <p className="font-semibold text-xs">{userData?.emergencyPhone || 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.print()}
                className="px-6 py-3 glass border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition"
              >
                🖨️ Print Card
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className="px-6 py-3 neuro-gradient rounded-xl font-semibold hover:opacity-90 transition"
              >
                ✏️ Update Details
              </button>
            </div>
          </motion.div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black">Medical Details</h2>
                <p className="text-gray-400">Keep your health information up to date</p>
              </div>
              <button
                onClick={() => editing ? saveProfile() : setEditing(true)}
                className="px-6 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition"
              >
                {editing ? '💾 Save Changes' : '✏️ Edit Details'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Allergies', key: 'allergies', placeholder: 'e.g. Penicillin, Peanuts', icon: '⚠️' },
                { label: 'Existing Conditions', key: 'conditions', placeholder: 'e.g. Diabetes, Hypertension', icon: '🏥' },
                { label: 'Current Medications', key: 'medications', placeholder: 'e.g. Metformin 500mg', icon: '💊' },
                { label: 'Emergency Contact', key: 'emergencyContact', placeholder: 'Contact person name', icon: '🆘' },
                { label: 'Emergency Phone', key: 'emergencyPhone', placeholder: '+91 9999999999', icon: '📞' },
                { label: 'Primary Doctor', key: 'doctorName', placeholder: 'Dr. Name', icon: '👨‍⚕️' },
                { label: 'Doctor Phone', key: 'doctorPhone', placeholder: '+91 9999999999', icon: '📱' },
                { label: 'Height (cm)', key: 'height', placeholder: '170', icon: '📏' },
                { label: 'Weight (kg)', key: 'weight', placeholder: '70', icon: '⚖️' },
              ].map((field, i) => (
                <div key={i} className="glass rounded-2xl p-5">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {field.icon} {field.label}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData[field.key]}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <p className="text-white font-semibold">
                      {formData[field.key] || <span className="text-gray-500">Not set</span>}
                    </p>
                  )}
                </div>
              ))}

              <div className="glass rounded-2xl p-5 col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  📝 Additional Notes
                </label>
                {editing ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none"
                    placeholder="Any additional medical notes..."
                  />
                ) : (
                  <p className="text-white font-semibold">
                    {formData.notes || <span className="text-gray-500">No notes added</span>}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-black mb-2">Medical History</h2>
            <p className="text-gray-400 mb-8">Your complete past medical records</p>

            {/* Add New History */}
            <div className="glass rounded-3xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">➕ Add Medical Record</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Date', key: 'date', type: 'date' },
                  { label: 'Condition / Illness', key: 'condition', type: 'text', placeholder: 'e.g. Appendicitis' },
                  { label: 'Treatment Given', key: 'treatment', type: 'text', placeholder: 'e.g. Surgery, Medication' },
                  { label: 'Hospital / Clinic', key: 'hospital', type: 'text', placeholder: 'Hospital name' },
                  { label: 'Doctor Name', key: 'doctor', type: 'text', placeholder: 'Dr. Name' },
                ].map((field, i) => (
                  <div key={i}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{field.label}</label>
                    <input
                      type={field.type}
                      value={newHistory[field.key]}
                      onChange={(e) => setNewHistory({ ...newHistory, [field.key]: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={addHistory}
                className="px-6 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition"
              >
                Add Record →
              </button>
            </div>

            {/* History List */}
            {history.length === 0 ? (
              <div className="glass rounded-3xl p-10 text-center">
                <div className="text-5xl mb-4">📋</div>
                <h3 className="text-xl font-bold mb-2">No History Added Yet</h3>
                <p className="text-gray-400">Add your past medical records above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.sort((a, b) => new Date(b.date) - new Date(a.date)).map((record, i) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass border border-white/10 rounded-2xl p-5 flex items-start justify-between"
                  >
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        🏥
                      </div>
                      <div>
                        <p className="font-bold text-lg">{record.condition}</p>
                        <p className="text-sm text-gray-400 mb-2">{new Date(record.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          {record.treatment && (
                            <span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full">
                              💊 {record.treatment}
                            </span>
                          )}
                          {record.hospital && (
                            <span className="bg-green-900/30 text-green-300 px-3 py-1 rounded-full">
                              🏥 {record.hospital}
                            </span>
                          )}
                          {record.doctor && (
                            <span className="bg-purple-900/30 text-purple-300 px-3 py-1 rounded-full">
                              👨‍⚕️ {record.doctor}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteHistory(record.id)}
                      className="text-red-400 hover:text-red-300 transition text-sm ml-4"
                    >
                      🗑️ Delete
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-black mb-2">Book Appointment</h2>
            <p className="text-gray-400 mb-8">Find and book appointments with nearby doctors</p>

            <div className="glass rounded-3xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-4">🔍 Find a Doctor</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                    placeholder="e.g. Hyderabad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Specialization</label>
                  <select className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition">
                    <option>Neurologist</option>
                    <option>General Physician</option>
                    <option>Psychiatrist</option>
                    <option>Cardiologist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>
              <button className="px-6 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">
                Search Doctors →
              </button>
            </div>

            <div className="glass rounded-3xl p-10 text-center">
              <div className="text-5xl mb-4">👨‍⚕️</div>
              <h3 className="text-xl font-bold mb-2">Search for Available Doctors</h3>
              <p className="text-gray-400">Enter your city and preferred specialization to find doctors near you</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}