import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, BarChart, Bar, Legend
} from 'recharts';

export default function Results() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchResults() {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, 'testResults'),
          where('userId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setResults(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchResults();
  }, [currentUser]);

  const latest = results[results.length - 1];

  const diseases = [
    { key: 'parkinsons', label: "Parkinson's", icon: '✋', color: '#ef4444' },
    { key: 'alzheimers', label: "Alzheimer's", icon: '🧩', color: '#f97316' },
    { key: 'stroke', label: 'Stroke', icon: '⚡', color: '#eab308' },
    { key: 'ms', label: 'MS', icon: '👁️', color: '#3b82f6' },
    { key: 'cognitive', label: 'Cognitive', icon: '🎮', color: '#8b5cf6' },
  ];

  // Weekly progress chart data
  const weeklyData = results.map((r, i) => ({
    name: `Test ${i + 1}`,
    'Brain Health': r.overallScore || 0,
    "Parkinson's": 100 - (r.parkinsons || 0),
    "Alzheimer's": 100 - (r.alzheimers || 0),
    'Stroke': 100 - (r.stroke || 0),
    'MS': 100 - (r.ms || 0),
    'Cognitive': 100 - (r.cognitive || 0),
  }));

  // Radar chart data
  const radarData = diseases.map(d => ({
    disease: d.label,
    Risk: latest ? (latest[d.key] || 0) : 0,
    Healthy: 15,
  }));

  // Bar chart data
  const barData = diseases.map(d => ({
    name: d.label,
    'Your Risk': latest ? (latest[d.key] || 0) : 0,
    'Avg Healthy': 12,
  }));

  // Brain age calculation
  const userAge = 25;
  const brainAgeDiff = latest
    ? Math.round((Object.values({
        parkinsons: latest.parkinsons || 0,
        alzheimers: latest.alzheimers || 0,
        stroke: latest.stroke || 0,
        ms: latest.ms || 0,
        cognitive: latest.cognitive || 0,
      }).reduce((a, b) => a + b, 0) / 5) / 10)
    : 0;
  const brainAge = userAge + brainAgeDiff;

  function getRiskLevel(score) {
    if (score > 70) return { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-900/30' };
    if (score > 40) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-900/30' };
    return { label: 'Low Risk', color: 'text-green-400', bg: 'bg-green-900/30' };
  }

  function generatePDF() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 neuro-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-animation">
            <span className="text-white font-black text-2xl">N</span>
          </div>
          <p className="text-gray-400">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-black mb-2">No Results Yet</h2>
          <p className="text-gray-400 mb-6">Complete a NeuroScan screening to see your results here</p>
          <button
            onClick={() => navigate('/screening')}
            className="px-8 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition"
          >
            Start Screening →
          </button>
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
          <div>
            <h1 className="text-xl font-black gradient-text">My Results</h1>
            <p className="text-xs text-gray-400">Brain Health Analytics</p>
          </div>
        </div>
        <div className="flex gap-2">
          {['overview', 'graphs', 'history', 'report'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? 'neuro-gradient text-white'
                  : 'glass text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'overview' ? '📊 Overview' :
               tab === 'graphs' ? '📈 Graphs' :
               tab === 'history' ? '📋 History' : '📄 Report'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">

        {/* Overview Tab */}
        {activeTab === 'overview' && latest && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

            {/* Overall Score */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="col-span-1 glass rounded-3xl p-6 flex flex-col items-center justify-center">
                <p className="text-gray-400 mb-2">Overall Brain Health</p>
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                    <motion.circle
                      cx="50" cy="50" r="40" fill="none"
                      stroke="url(#gradient)" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - (latest.overallScore || 0) / 100) }}
                      transition={{ duration: 1.5 }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black gradient-text">{latest.overallScore || 0}%</span>
                    <span className="text-xs text-gray-400">Health Score</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Last tested: {new Date(latest.date).toLocaleDateString()}
                </p>
              </div>

              {/* Brain Age */}
              <div className="glass rounded-3xl p-6">
                <h3 className="font-bold mb-4">🧠 Brain Age Prediction</h3>
                <div className="flex items-end gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Real Age</p>
                    <p className="text-3xl font-black">{userAge}</p>
                  </div>
                  <div className="text-gray-500 mb-2">vs</div>
                  <div>
                    <p className="text-xs text-gray-400">Brain Age</p>
                    <p className={`text-3xl font-black ${brainAge > userAge ? 'text-red-400' : 'text-green-400'}`}>
                      {brainAge}
                    </p>
                  </div>
                </div>
                <div className={`rounded-xl p-3 text-sm ${brainAge > userAge ? 'bg-red-900/20 text-red-300' : 'bg-green-900/20 text-green-300'}`}>
                  {brainAge > userAge
                    ? `⚠️ Brain aging ${brainAge - userAge} years faster than average`
                    : '✅ Brain age is healthy for your age!'}
                </div>
                <div className="mt-4 space-y-2 text-xs text-gray-400">
                  <p>💡 Recommendations:</p>
                  <p>• Improve sleep quality (7-8 hrs)</p>
                  <p>• Daily memory exercises</p>
                  <p>• Mediterranean diet</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="glass rounded-3xl p-6">
                <h3 className="font-bold mb-4">📈 Progress Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Tests</span>
                    <span className="font-bold">{results.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Best Score</span>
                    <span className="font-bold text-green-400">
                      {Math.max(...results.map(r => r.overallScore || 0))}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Latest Score</span>
                    <span className="font-bold gradient-text">{latest.overallScore || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trend</span>
                    <span className={`font-bold ${
                      results.length > 1 && latest.overallScore > results[results.length - 2].overallScore
                        ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {results.length > 1
                        ? (latest.overallScore > results[results.length - 2].overallScore ? '📈 Improving' : '📉 Declining')
                        : '➡️ First test'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Disease Risk Breakdown */}
            <div className="glass rounded-3xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-6">Disease Risk Breakdown</h3>
              <div className="space-y-5">
                {diseases.map((disease, i) => {
                  const score = latest[disease.key] || 0;
                  const risk = getRiskLevel(score);
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{disease.icon}</span>
                          <span className="font-semibold">{disease.label}</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${risk.bg} ${risk.color}`}>
                            {risk.label}
                          </span>
                        </div>
                        <span className="font-black text-lg">{score}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-3 rounded-full"
                          style={{ backgroundColor: disease.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div className="grid grid-cols-2 gap-6">
              <div className="glass rounded-3xl p-6">
                <h3 className="font-bold mb-4">🥗 Diet Recommendations</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {(latest.parkinsons > 40 ? ['🫐 Antioxidant-rich berries', '🐟 Omega-3 fatty acids', '🥦 Dark leafy greens'] :
                    latest.alzheimers > 40 ? ['🥜 Nuts and seeds', '🫒 Olive oil (MIND diet)', '🍓 Mixed berries daily'] :
                    ['🥗 Mediterranean diet', '💧 Stay well hydrated', '🌾 Whole grains daily']).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-green-400">✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass rounded-3xl p-6">
                <h3 className="font-bold mb-4">🏃 Exercise Plan</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  {(latest.parkinsons > 40 ? ['🚶 Walking 30 min daily', '🧘 Tai Chi exercises', '⚖️ Balance training'] :
                    latest.ms > 40 ? ['🏊 Swimming (low impact)', '🧘 Yoga & stretching', '🚴 Light cycling'] :
                    ['🏃 Aerobic exercise', '🧠 Memory card games', '🎯 Coordination drills']).map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-blue-400">✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Graphs Tab */}
        {activeTab === 'graphs' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-black mb-8">Health Trend Graphs</h2>

            {/* Line Chart */}
            <div className="glass rounded-3xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-6">📈 Overall Brain Health Over Time</h3>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Brain Health" stroke="#7c3aed" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">Need more test data to show trends</p>
              )}
            </div>

            {/* Radar Chart */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="glass rounded-3xl p-6">
                <h3 className="text-xl font-bold mb-6">🕸️ Risk Profile Radar</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="disease" stroke="#9ca3af" fontSize={12} />
                    <Radar name="Your Risk" dataKey="Risk" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                    <Radar name="Healthy Avg" dataKey="Healthy" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="glass rounded-3xl p-6">
                <h3 className="text-xl font-bold mb-6">📊 Risk vs Healthy Average</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Legend />
                    <Bar dataKey="Your Risk" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Avg Healthy" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Multi-disease Line Chart */}
            <div className="glass rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-6">📉 Disease Risk Trends</h3>
              {weeklyData.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Legend />
                    {diseases.map(d => (
                      <Line key={d.key} type="monotone" dataKey={d.label} stroke={d.color} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">Take more tests to see disease trends over time</p>
              )}
            </div>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-black mb-8">Test History</h2>
            <div className="space-y-6">
              {[...results].reverse().map((result, i) => (
                <div key={result.id} className="glass rounded-3xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-lg">NeuroScan #{results.length - i}</h3>
                      <p className="text-gray-400 text-sm">{new Date(result.date).toLocaleDateString('en-IN', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black gradient-text">{result.overallScore || 0}%</p>
                      <p className="text-xs text-gray-400">Overall Health</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {diseases.map((disease, j) => {
                      const score = result[disease.key] || 0;
                      const risk = getRiskLevel(score);
                      return (
                        <div key={j} className="bg-white/5 rounded-xl p-3 text-center">
                          <div className="text-xl mb-1">{disease.icon}</div>
                          <div className="font-bold text-sm">{score}%</div>
                          <div className={`text-xs ${risk.color}`}>{risk.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && latest && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black">PDF Report</h2>
              <button
                onClick={generatePDF}
                className="px-6 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition"
              >
                🖨️ Download / Print Report
              </button>
            </div>

            <div className="glass rounded-3xl p-8 space-y-6" id="report">
              {/* Report Header */}
              <div className="border-b border-white/10 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 neuro-gradient rounded-xl flex items-center justify-center">
                    <span className="text-white font-black text-xl">N</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black gradient-text">NeuroPulse</h1>
                    <p className="text-gray-400 text-sm">Neurological Health Report</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Report Date</p>
                    <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Test Date</p>
                    <p className="font-semibold">{new Date(latest.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Overall Score</p>
                    <p className="font-semibold gradient-text text-xl">{latest.overallScore || 0}%</p>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-400 font-bold mb-1">⚠️ Important Disclaimer</p>
                <p className="text-sm text-gray-300">
                  This is an AI screening tool only. These results are NOT a medical diagnosis.
                  Please consult a qualified neurologist for proper evaluation and treatment.
                  Results are for informational purposes only.
                </p>
              </div>

              {/* Results Summary */}
              <div>
                <h3 className="font-bold text-lg mb-4">Test Results Summary</h3>
                <div className="space-y-4">
                  {diseases.map((disease, i) => {
                    const score = latest[disease.key] || 0;
                    const risk = getRiskLevel(score);
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-xl w-8">{disease.icon}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{disease.label}</span>
                            <span className="font-bold">{score}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${score}%`, backgroundColor: disease.color }}
                            />
                          </div>
                        </div>
                        <span className={`text-sm font-semibold w-24 text-right ${risk.color}`}>
                          {risk.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Referral */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                <p className="font-bold mb-2">👨‍⚕️ Doctor Referral Recommendation</p>
                <p className="text-sm text-gray-300">
                  {Object.values({ p: latest.parkinsons || 0, a: latest.alzheimers || 0, s: latest.stroke || 0 }).some(v => v > 60)
                    ? '🔴 Urgent: Please consult a Neurologist within 1-2 weeks'
                    : Object.values({ p: latest.parkinsons || 0, a: latest.alzheimers || 0, s: latest.stroke || 0 }).some(v => v > 35)
                    ? '🟡 Recommended: Schedule a check-up with a Neurologist within 1 month'
                    : '🟢 Optional: Annual neurological check-up recommended'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}