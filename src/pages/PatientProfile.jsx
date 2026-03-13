import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function PatientProfile() {
  const { patientId } = useParams();
  const [patient, setPatient]       = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    async function fetchPatient() {
      if (!patientId) { setError('Invalid QR code'); setLoading(false); return; }
      try {
        const userDoc = await getDoc(doc(db, 'users', patientId));
        if (!userDoc.exists()) { setError('Patient not found'); setLoading(false); return; }
        setPatient(userDoc.data());

        const q = query(collection(db, 'testResults'), where('userId', '==', patientId));
        const snap = await getDocs(q);
        const results = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setTestResults(results);
      } catch (err) {
        console.error(err);
        setError('Failed to load patient data');
      }
      setLoading(false);
    }
    fetchPatient();
  }, [patientId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 neuro-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-animation">
          <span className="text-white font-black text-2xl">N</span>
        </div>
        <p className="text-gray-400">Loading patient profile...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
      <div className="text-center glass rounded-3xl p-10 max-w-md">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-black mb-2">Error</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    </div>
  );

  const latest = testResults[0] || null;
  const diseases = [
    { key: 'parkinsons', label: "Parkinson's", icon: '✋', color: '#ef4444' },
    { key: 'alzheimers', label: "Alzheimer's", icon: '🧩', color: '#f97316' },
    { key: 'stroke',     label: 'Stroke',      icon: '⚡', color: '#eab308' },
    { key: 'ms',         label: 'MS',          icon: '👁️', color: '#3b82f6' },
    { key: 'cognitive',  label: 'Cognitive',   icon: '🎮', color: '#8b5cf6' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 neuro-gradient rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <div>
            <span className="text-xl font-bold gradient-text">NeuroPulse</span>
            <p className="text-xs text-gray-400">Patient Medical Profile</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/30 rounded-full px-4 py-2">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-green-400 text-sm font-semibold">Verified MediPass</span>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Patient Identity Card */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="glass border border-purple-500/30 rounded-3xl p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 neuro-gradient rounded-2xl flex items-center justify-center text-3xl font-black flex-shrink-0">
              {patient?.name?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black mb-1">{patient?.name || 'Unknown'}</h1>
              <p className="text-gray-400 mb-3">{patient?.email}</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Age',         value: patient?.age         || 'N/A', icon: '🎂' },
                  { label: 'Blood Group', value: patient?.bloodGroup  || 'N/A', icon: '🩸', highlight: true },
                  { label: 'Phone',       value: patient?.phone       || 'N/A', icon: '📞' },
                ].map(item => (
                  <div key={item.label} className={`px-4 py-2 rounded-xl border text-sm ${
                    item.highlight
                      ? 'bg-red-900/30 border-red-500/40 text-red-300'
                      : 'bg-white/5 border-white/10 text-gray-300'
                  }`}>
                    <span className="mr-1">{item.icon}</span>
                    <span className="font-semibold">{item.label}:</span>
                    <span className="ml-1 font-black text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400 mb-1">Patient ID</p>
              <p className="font-mono text-sm text-purple-300">{patientId?.slice(0, 12).toUpperCase()}</p>
              <p className="text-xs text-gray-500 mt-2">
                Scanned {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Critical Medical Info */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <h2 className="text-xl font-black mb-3 flex items-center gap-2">
            <span className="text-red-400">⚠️</span> Critical Medical Information
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Allergies',          value: patient?.allergies,         icon: '⚠️',  color: 'from-red-900/40 to-red-800/20',    border: 'border-red-500/30',    text: 'text-red-300' },
              { label: 'Existing Conditions', value: patient?.conditions,       icon: '🏥',  color: 'from-orange-900/40 to-orange-800/20', border: 'border-orange-500/30', text: 'text-orange-300' },
              { label: 'Current Medications', value: patient?.medications,      icon: '💊',  color: 'from-blue-900/40 to-blue-800/20',   border: 'border-blue-500/30',   text: 'text-blue-300' },
              { label: 'Emergency Contact',  value: patient?.emergencyContact,  icon: '🆘',  color: 'from-yellow-900/40 to-yellow-800/20', border: 'border-yellow-500/30', text: 'text-yellow-300' },
              { label: 'Emergency Phone',    value: patient?.emergencyPhone,    icon: '📞',  color: 'from-yellow-900/40 to-yellow-800/20', border: 'border-yellow-500/30', text: 'text-yellow-300' },
              { label: 'Primary Doctor',     value: patient?.doctorName,        icon: '👨‍⚕️', color: 'from-green-900/40 to-green-800/20',  border: 'border-green-500/30',  text: 'text-green-300' },
            ].map(item => (
              <div key={item.label} className={`bg-gradient-to-br ${item.color} border ${item.border} rounded-2xl p-4`}>
                <p className="text-xs text-gray-400 mb-1">{item.icon} {item.label}</p>
                <p className={`font-bold text-sm ${item.value ? item.text : 'text-gray-500'}`}>
                  {item.value || 'Not recorded'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Physical Stats */}
        {(patient?.height || patient?.weight) && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
            <h2 className="text-xl font-black mb-3">📏 Physical Measurements</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Height', value: patient?.height ? `${patient.height} cm` : 'N/A', icon: '📏' },
                { label: 'Weight', value: patient?.weight ? `${patient.weight} kg` : 'N/A', icon: '⚖️' },
                { label: 'BMI',    value: patient?.height && patient?.weight
                    ? (patient.weight / Math.pow(patient.height/100, 2)).toFixed(1)
                    : 'N/A', icon: '📊' },
              ].map(item => (
                <div key={item.label} className="glass border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="text-2xl font-black gradient-text">{item.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Latest NeuroScan Results */}
        {latest && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            <h2 className="text-xl font-black mb-3">🧠 Latest NeuroScan Results</h2>
            <div className="glass border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-gray-400 text-sm">
                  Taken on {new Date(latest.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                </p>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Overall Brain Health</p>
                  <p className={`text-2xl font-black ${
                    (latest.overallScore||0) >= 70 ? 'text-green-400' :
                    (latest.overallScore||0) >= 40 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{latest.overallScore || 0}%</p>
                </div>
              </div>
              <div className="space-y-3">
                {diseases.map(d => {
                  const score = latest[d.key] || 0;
                  const risk  = score > 70 ? 'High Risk' : score > 40 ? 'Moderate' : 'Low Risk';
                  const riskColor = score > 70 ? 'text-red-400' : score > 40 ? 'text-yellow-400' : 'text-green-400';
                  return (
                    <div key={d.key}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span>{d.icon}</span>
                          <span className="font-medium">{d.label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className={`font-semibold ${riskColor}`}>{risk}</span>
                          <span className="font-black">{score}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <motion.div
                          initial={{ width:0 }} animate={{ width:`${score}%` }} transition={{ duration:1 }}
                          className="h-2 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Medical History */}
        {patient?.medicalHistory?.length > 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}>
            <h2 className="text-xl font-black mb-3">📜 Medical History</h2>
            <div className="space-y-3">
              {[...patient.medicalHistory]
                .sort((a,b) => new Date(b.date) - new Date(a.date))
                .map((record, i) => (
                <div key={record.id || i} className="glass border border-white/10 rounded-2xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">🏥</div>
                  <div className="flex-1">
                    <p className="font-bold">{record.condition}</p>
                    <p className="text-sm text-gray-400 mb-2">
                      {new Date(record.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {record.treatment && <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full">💊 {record.treatment}</span>}
                      {record.hospital  && <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded-full">🏥 {record.hospital}</span>}
                      {record.doctor    && <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full">👨‍⚕️ {record.doctor}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Notes */}
        {patient?.notes && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
            <h2 className="text-xl font-black mb-3">📝 Additional Notes</h2>
            <div className="glass border border-white/10 rounded-2xl p-5">
              <p className="text-gray-300 leading-relaxed">{patient.notes}</p>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
          className="text-center py-6 border-t border-white/10">
          <p className="text-gray-500 text-sm">
            This profile was accessed via NeuroPulse MediPass QR Code.
            Information is provided by the patient and is for medical reference only.
          </p>
          <p className="text-gray-600 text-xs mt-2">© NeuroPulse AI — For medical professionals</p>
        </motion.div>

      </div>
    </div>
  );
}
