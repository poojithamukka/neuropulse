import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => prev < 98 ? prev + 1 : 98);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 neuro-gradient rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-xl font-bold gradient-text">NeuroPulse</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-gray-300 hover:text-white transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-2 neuro-gradient rounded-xl font-semibold hover:opacity-90 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full pulse-animation"></div>
            <span className="text-sm text-purple-300">AI-Powered Neurological Care</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="gradient-text">NeuroPulse</span>
            <br />
            <span className="text-white">Detect. Support.</span>
            <br />
            <span className="text-white">Protect.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Advanced AI-powered neurological disease screening combined with
            a complete digital health passport. Your brain health, monitored
            and protected.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 neuro-gradient rounded-xl font-bold text-lg hover:opacity-90 transition transform hover:scale-105"
            >
              Start Free Screening
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 glass rounded-xl font-bold text-lg hover:bg-white/10 transition"
            >
              Doctor Login →
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { value: '5+', label: 'Diseases Detected' },
              { value: `${count}%`, label: 'Accuracy Rate' },
              { value: '2', label: 'Portals' },
            ].map((stat, i) => (
              <div key={i} className="glass rounded-2xl p-4">
                <div className="text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-4">
            Everything You Need For
            <span className="gradient-text"> Brain Health</span>
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            Two powerful systems working together to keep your neurological health in check
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* MediPass Card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="glass rounded-3xl p-8 card-hover"
            >
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🏥</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">MediPass Portal</h3>
              <p className="text-gray-400 mb-6">
                Your complete digital health passport. Store all medical records,
                MRI scans, prescriptions and get a unique QR code for instant
                doctor access.
              </p>
              <ul className="space-y-2">
                {['Digital Health QR Code', 'Medical History Storage', 'Doctor Access Control', 'Appointment Booking'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* NeuroScan Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="glass rounded-3xl p-8 card-hover"
            >
              <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">NeuroScan AI</h3>
              <p className="text-gray-400 mb-6">
                AI-powered screening for 5 neurological diseases using advanced
                computer vision, speech analysis, and cognitive testing.
              </p>
              <ul className="space-y-2">
               {["Parkinson's Detection", "Alzheimer's Screening", 'Stroke Risk Analysis', 'MS Eye Tracking', 'Cognitive Assessment'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-purple-400">✓</span> {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* 5 Disease Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: '✋', name: "Parkinson's", desc: 'Spiral Drawing Test', color: 'from-red-900/40 to-red-800/20' },
              { icon: '🧩', name: "Alzheimer's", desc: 'Memory & Speech Test', color: 'from-orange-900/40 to-orange-800/20' },
              { icon: '⚡', name: 'Stroke', desc: 'Face Symmetry Test', color: 'from-yellow-900/40 to-yellow-800/20' },
              { icon: '👁️', name: 'Multiple Sclerosis', desc: 'Eye Tracking Test', color: 'from-blue-900/40 to-blue-800/20' },
              { icon: '🎮', name: 'Cognitive Decline', desc: 'Brain Games', color: 'from-purple-900/40 to-purple-800/20' },
            ].map((disease, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`bg-gradient-to-br ${disease.color} border border-white/10 rounded-2xl p-4 text-center card-hover`}
              >
                <div className="text-3xl mb-2">{disease.icon}</div>
                <div className="font-bold text-sm mb-1">{disease.name}</div>
                <div className="text-xs text-gray-400">{disease.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto glass rounded-3xl p-12 text-center">
          <h2 className="text-4xl font-black mb-4">
            Ready to Check Your
            <span className="gradient-text"> Brain Health?</span>
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands of patients using NeuroPulse for early neurological disease detection
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-4 neuro-gradient rounded-xl font-bold text-xl hover:opacity-90 transition transform hover:scale-105"
          >
            Start Your Free Screening Today →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10 text-center text-gray-500 text-sm">
        <p>© 2024 NeuroPulse AI — For screening purposes only. Not a medical diagnosis.</p>
      </footer>
    </div>
  );
}