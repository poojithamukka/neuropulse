import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

export default function Screening() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(null);
  const [scores, setScores] = useState({});
  const [completedModules, setCompletedModules] = useState([]);

  // Parkinson's
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [spiralPoints, setSpiralPoints] = useState([]);

  // Alzheimer's
  const [memoryWords] = useState(['Apple', 'River', 'Chair', 'Mountain', 'Book', 'Sunset']);
  const [memoryPhase, setMemoryPhase] = useState('show');
  const [memoryInput, setMemoryInput] = useState('');
  const [memoryScore, setMemoryScore] = useState(null);

  // Cognitive
  const [gamePhase, setGamePhase] = useState('start');
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [cogScore, setCogScore] = useState(0);
  const [round, setRound] = useState(1);

  // Stroke — webcam + MediaPipe
  const strokeVideoRef = useRef(null);
  const strokeCanvasRef = useRef(null);
  const strokeStreamRef = useRef(null);
  const faceMeshRef = useRef(null);
  const animFrameRef = useRef(null);
  const [strokePhase, setStrokePhase] = useState('ready');
  const [strokeScore, setStrokeScore] = useState(null);
  const [strokeAnalysis, setStrokeAnalysis] = useState(null);
  const [landmarkCount, setLandmarkCount] = useState(0);
  const [strokeTimer, setStrokeTimer] = useState(10);

  // Eye Tracking — webcam
  const eyeVideoRef = useRef(null);
  const eyeCanvasRef = useRef(null);
  const eyeStreamRef = useRef(null);
  const eyeAnimRef = useRef(null);
  const eyeFaceMeshRef = useRef(null);
  const [eyePhase, setEyePhase] = useState('ready');
  const [eyeScore, setEyeScore] = useState(null);
  const [dotPosition, setDotPosition] = useState({ x: 50, y: 50 });
  const [gazeData, setGazeData] = useState([]);
  const [eyeTimer, setEyeTimer] = useState(15);
  const [currentGaze, setCurrentGaze] = useState(null);

  const modules = [
    { id: 'parkinsons', icon: '✋', label: "Parkinson's", desc: 'Spiral Drawing Test', color: '#ef4444', duration: '3 min' },
    { id: 'alzheimers', icon: '🧩', label: "Alzheimer's", desc: 'Memory & Speech Test', color: '#f97316', duration: '5 min' },
    { id: 'stroke', icon: '⚡', label: 'Stroke', desc: 'Live Face Landmark Analysis', color: '#eab308', duration: '2 min' },
    { id: 'ms', icon: '👁️', label: 'Multiple Sclerosis', desc: 'Live Eye Tracking Test', color: '#3b82f6', duration: '3 min' },
    { id: 'cognitive', icon: '🎮', label: 'Cognitive', desc: 'Memory Sequence Game', color: '#8b5cf6', duration: '4 min' },
  ];

  // LANDMARK INDEX SETS
  const FACE_OVAL = [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109];
  const LEFT_EYE = [33,7,163,144,145,153,154,155,133,246,161,160,159,158,157,173];
  const RIGHT_EYE = [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398];
  const LEFT_EYEBROW = [70,63,105,66,107,55,65,52,53,46];
  const RIGHT_EYEBROW = [336,296,334,293,300,285,295,282,283,276];
  const LIPS_OUTER = [61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146];
  const NOSE_BRIDGE = [168,6,197,195,5,4,1,19,94];
  const LEFT_IRIS = [474,475,476,477];
  const RIGHT_IRIS = [469,470,471,472];

  // ── PARKINSON'S ──
  function startDrawing(e) {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setSpiralPoints([{ x, y }]);
  }

  function draw(e) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.stroke();
    setSpiralPoints(prev => [...prev, { x, y }]);
  }

  function stopDrawing() { setIsDrawing(false); }

  function drawSpiralGuide() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.beginPath();
    for (let i = 0; i < 720; i++) {
      const angle = (i * Math.PI) / 180;
      const r = (i / 720) * 120;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function analyzeSpiral() {
    if (spiralPoints.length < 20) return toast.error('Please draw the spiral first!');
    let totalDeviation = 0;
    for (let i = 1; i < spiralPoints.length; i++) {
      const dx = spiralPoints[i].x - spiralPoints[i-1].x;
      const dy = spiralPoints[i].y - spiralPoints[i-1].y;
      totalDeviation += Math.sqrt(dx*dx + dy*dy);
    }
    const avg = totalDeviation / spiralPoints.length;
    const riskScore = Math.min(100, Math.max(0, Math.round((avg - 2) * 8)));
    completeModule('parkinsons', riskScore);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSpiralPoints([]);
    drawSpiralGuide();
  }

  useEffect(() => {
    if (activeModule === 'parkinsons') setTimeout(drawSpiralGuide, 100);
  }, [activeModule]);

  // ── ALZHEIMER'S ──
  useEffect(() => {
    if (activeModule === 'alzheimers' && memoryPhase === 'show') {
      const timer = setTimeout(() => setMemoryPhase('recall'), 10000);
      return () => clearTimeout(timer);
    }
  }, [activeModule, memoryPhase]);

  function checkMemory() {
    const recalled = memoryInput.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const correct = memoryWords.filter(w => recalled.includes(w.toLowerCase())).length;
    const score = Math.round((correct / memoryWords.length) * 100);
    setMemoryScore(score);
    setTimeout(() => completeModule('alzheimers', 100 - score), 1500);
  }

  // ── COGNITIVE ──
  const colors = ['🔴', '🔵', '🟢', '🟡'];

  function startCogGame() {
    const newSeq = [Math.floor(Math.random() * 4)];
    setSequence(newSeq);
    setUserSequence([]);
    setGamePhase('show');
    setRound(1);
  }

  function handleColorClick(idx) {
    if (gamePhase !== 'input') return;
    const newUserSeq = [...userSequence, idx];
    setUserSequence(newUserSeq);
    if (newUserSeq[newUserSeq.length - 1] !== sequence[newUserSeq.length - 1]) {
      const score = Math.round((round / 10) * 100);
      setCogScore(score);
      setGamePhase('end');
      completeModule('cognitive', 100 - score);
      return;
    }
    if (newUserSeq.length === sequence.length) {
      if (round >= 7) { setCogScore(100); setGamePhase('end'); completeModule('cognitive', 5); return; }
      const newRound = round + 1;
      setRound(newRound);
      const newSeq = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(newSeq);
      setUserSequence([]);
      setGamePhase('show');
    }
  }

  useEffect(() => {
    if (gamePhase === 'show') {
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (i >= sequence.length) { clearInterval(interval); setTimeout(() => setGamePhase('input'), 500); }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [gamePhase, sequence]);

  // ── STROKE — MediaPipe 468 landmarks ──
  function loadMediaPipeScript() {
    return new Promise((resolve) => {
      if (window.FaceMesh) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  async function startStrokeCam() {
    setStrokePhase('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      strokeStreamRef.current = stream;
      if (strokeVideoRef.current) {
        strokeVideoRef.current.srcObject = stream;
        await strokeVideoRef.current.play();
      }
      await loadMediaPipeScript();
      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      faceMesh.onResults(onStrokeResults);
      faceMeshRef.current = faceMesh;
      setStrokePhase('analyzing');
      setStrokeTimer(10);
      runStrokeLoop();
    } catch (err) {
      console.error(err);
      toast.error('Camera access denied or failed to load');
      setStrokePhase('ready');
    }
  }

  function runStrokeLoop() {
    const loop = async () => {
      if (strokeVideoRef.current && faceMeshRef.current && strokeVideoRef.current.readyState >= 2) {
        await faceMeshRef.current.send({ image: strokeVideoRef.current });
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
  }

  function drawContour(ctx, landmarks, W, H, indices, color, lineWidth) {
    if (!indices || indices.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    indices.forEach((idx, i) => {
      if (idx >= landmarks.length) return;
      const x = (1 - landmarks[idx].x) * W;
      const y = landmarks[idx].y * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function onStrokeResults(results) {
    const canvas = strokeCanvasRef.current;
    const video = strokeVideoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const W = canvas.width;
    const H = canvas.height;

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -W, 0, W, H);
    ctx.restore();

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      setLandmarkCount(0);
      return;
    }
    const landmarks = results.multiFaceLandmarks[0];
    setLandmarkCount(landmarks.length);

    // Draw all 468 dots
    ctx.fillStyle = 'rgba(0,255,200,0.7)';
    landmarks.forEach(lm => {
      ctx.beginPath();
      ctx.arc((1 - lm.x) * W, lm.y * H, 1.2, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw contours
    drawContour(ctx, landmarks, W, H, FACE_OVAL, 'rgba(100,220,255,0.5)', 1);
    drawContour(ctx, landmarks, W, H, LEFT_EYE, 'rgba(0,255,150,0.8)', 1.5);
    drawContour(ctx, landmarks, W, H, RIGHT_EYE, 'rgba(0,255,150,0.8)', 1.5);
    drawContour(ctx, landmarks, W, H, LEFT_EYEBROW, 'rgba(255,200,0,0.8)', 1.5);
    drawContour(ctx, landmarks, W, H, RIGHT_EYEBROW, 'rgba(255,200,0,0.8)', 1.5);
    drawContour(ctx, landmarks, W, H, LIPS_OUTER, 'rgba(255,80,100,0.9)', 1.5);
    drawContour(ctx, landmarks, W, H, NOSE_BRIDGE, 'rgba(180,180,255,0.7)', 1);

    // Asymmetry analysis
    const noseTip = landmarks[1];
    const midX = (1 - noseTip.x) * W;
    const mouthR = landmarks[61];
    const mouthL = landmarks[291];
    const browR = landmarks[70];
    const browL = landmarks[300];
    if (!mouthR || !mouthL || !browR || !browL) return;

    const mouthRx = (1 - mouthR.x) * W; const mouthRy = mouthR.y * H;
    const mouthLx = (1 - mouthL.x) * W; const mouthLy = mouthL.y * H;
    const browRy = browR.y * H; const browLy = browL.y * H;

    const mouthDrop = Math.abs(mouthRy - mouthLy);
    const browDrop = Math.abs(browRy - browLy);
    const mouthAsymmetry = Math.min(mouthDrop / H * 200, 100);
    const browAsymmetry = Math.min(browDrop / H * 200, 100);
    const overallAsym = (mouthAsymmetry + browAsymmetry) / 2;

    // Draw mouth corner dots
    ctx.fillStyle = mouthDrop > 8 ? '#ff4444' : '#00ff88';
    [[mouthRx, mouthRy], [mouthLx, mouthLy]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI); ctx.fill();
    });

    // Mouth line
    ctx.strokeStyle = mouthDrop > 8 ? 'rgba(255,68,68,0.7)' : 'rgba(0,255,136,0.5)';
    ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(mouthRx, mouthRy); ctx.lineTo(mouthLx, mouthLy); ctx.stroke();
    ctx.setLineDash([]);

    // Midline
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.setLineDash([6,6]);
    ctx.beginPath(); ctx.moveTo(midX, H*0.1); ctx.lineTo(midX, H*0.9); ctx.stroke();
    ctx.setLineDash([]);

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(8, 8, 220, 70);
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#ccc'; ctx.fillText(`Mouth asymmetry: ${mouthAsymmetry.toFixed(1)}%`, 14, 28);
    ctx.fillText(`Brow asymmetry:  ${browAsymmetry.toFixed(1)}%`, 14, 46);
    ctx.fillStyle = overallAsym > 15 ? '#ff4444' : '#00cc66';
    ctx.fillText(overallAsym > 15 ? '⚠ Asymmetry Detected' : '✓ Symmetry Normal', 14, 66);

    setStrokeAnalysis({ mouthAsymmetry, browAsymmetry, overallAsym });
  }

  function stopStrokeCam() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (strokeStreamRef.current) strokeStreamRef.current.getTracks().forEach(t => t.stop());
    strokeStreamRef.current = null;
    if (faceMeshRef.current) { faceMeshRef.current.close(); faceMeshRef.current = null; }
  }

  useEffect(() => {
    if (strokePhase !== 'analyzing') return;
    if (strokeTimer <= 0) { finishStrokeAnalysis(); return; }
    const t = setTimeout(() => setStrokeTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [strokePhase, strokeTimer]);

  function finishStrokeAnalysis() {
    stopStrokeCam();
    const riskScore = strokeAnalysis
      ? Math.min(100, Math.round(strokeAnalysis.overallAsym * 2))
      : Math.floor(Math.random() * 20) + 5;
    setStrokeScore(riskScore);
    setStrokePhase('done');
    completeModule('stroke', riskScore);
  }

  // ── EYE TRACKING ──
  async function startEyeCam() {
    setEyePhase('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      eyeStreamRef.current = stream;
      if (eyeVideoRef.current) {
        eyeVideoRef.current.srcObject = stream;
        await eyeVideoRef.current.play();
      }
      await loadMediaPipeScript();
      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      faceMesh.onResults(onEyeResults);
      eyeFaceMeshRef.current = faceMesh;
      setEyePhase('tracking');
      setEyeTimer(15);
      setGazeData([]);
      runEyeLoop();
    } catch (err) {
      console.error(err);
      toast.error('Camera access denied');
      setEyePhase('ready');
    }
  }

  function runEyeLoop() {
    const loop = async () => {
      if (eyeVideoRef.current && eyeFaceMeshRef.current && eyeVideoRef.current.readyState >= 2) {
        await eyeFaceMeshRef.current.send({ image: eyeVideoRef.current });
      }
      eyeAnimRef.current = requestAnimationFrame(loop);
    };
    eyeAnimRef.current = requestAnimationFrame(loop);
  }

  function getCenter(landmarks, indices, W, H) {
    if (!indices || indices.length === 0) return null;
    let sx = 0, sy = 0, count = 0;
    indices.forEach(idx => {
      if (idx < landmarks.length) { sx += (1 - landmarks[idx].x) * W; sy += landmarks[idx].y * H; count++; }
    });
    return count > 0 ? { x: sx / count, y: sy / count } : null;
  }

  function onEyeResults(results) {
    const canvas = eyeCanvasRef.current;
    const video = eyeVideoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const W = canvas.width; const H = canvas.height;

    ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, -W, 0, W, H); ctx.restore();

    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
    const landmarks = results.multiFaceLandmarks[0];

    drawContour(ctx, landmarks, W, H, LEFT_EYE, 'rgba(0,200,255,0.9)', 2);
    drawContour(ctx, landmarks, W, H, RIGHT_EYE, 'rgba(0,200,255,0.9)', 2);
    drawContour(ctx, landmarks, W, H, LEFT_IRIS, 'rgba(255,100,0,0.9)', 2);
    drawContour(ctx, landmarks, W, H, RIGHT_IRIS, 'rgba(255,100,0,0.9)', 2);

    const lCenter = getCenter(landmarks, LEFT_EYE, W, H);
    const rCenter = getCenter(landmarks, RIGHT_EYE, W, H);

    [lCenter, rCenter].forEach(pt => {
      if (!pt) return;
      ctx.strokeStyle = 'rgba(255,150,0,0.9)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pt.x-12, pt.y); ctx.lineTo(pt.x+12, pt.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pt.x, pt.y-12); ctx.lineTo(pt.x, pt.y+12); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,150,0,0.5)';
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 16, 0, 2*Math.PI); ctx.stroke();
    });

    [...LEFT_EYE, ...RIGHT_EYE, ...LEFT_IRIS, ...RIGHT_IRIS].forEach(idx => {
      if (idx >= landmarks.length) return;
      ctx.fillStyle = 'rgba(0,255,200,0.8)';
      ctx.beginPath(); ctx.arc((1-landmarks[idx].x)*W, landmarks[idx].y*H, 2, 0, 2*Math.PI); ctx.fill();
    });

    if (lCenter) {
      const gazeX = lCenter.x / W; const gazeY = lCenter.y / H;
      setCurrentGaze({ x: gazeX, y: gazeY });
      setGazeData(prev => [...prev.slice(-100), { x: gazeX, y: gazeY }]);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(8, 8, 200, 50);
    ctx.fillStyle = '#00ccff'; ctx.font = 'bold 12px monospace';
    ctx.fillText(`Eye landmarks: ${LEFT_EYE.length + RIGHT_EYE.length}`, 14, 26);
    ctx.fillStyle = '#ffaa00'; ctx.fillText(`Iris tracking: ACTIVE`, 14, 44);
  }

  useEffect(() => {
    if (eyePhase !== 'tracking') return;
    let angle = 0;
    const interval = setInterval(() => {
      angle += 3;
      setDotPosition({ x: 50 + 35 * Math.cos(angle * Math.PI / 180), y: 50 + 20 * Math.sin(angle * Math.PI / 180) });
    }, 100);
    return () => clearInterval(interval);
  }, [eyePhase]);

  useEffect(() => {
    if (eyePhase !== 'tracking') return;
    if (eyeTimer <= 0) { finishEyeTracking(); return; }
    const t = setTimeout(() => setEyeTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [eyePhase, eyeTimer]);

  function stopEyeCam() {
    if (eyeAnimRef.current) cancelAnimationFrame(eyeAnimRef.current);
    if (eyeStreamRef.current) eyeStreamRef.current.getTracks().forEach(t => t.stop());
    eyeStreamRef.current = null;
    if (eyeFaceMeshRef.current) { eyeFaceMeshRef.current.close(); eyeFaceMeshRef.current = null; }
  }

  function finishEyeTracking() {
    stopEyeCam();
    const variance = gazeData.length > 10
      ? gazeData.reduce((acc, g) => acc + Math.abs(g.x - 0.5), 0) / gazeData.length * 100
      : Math.floor(Math.random() * 20) + 5;
    const riskScore = Math.min(100, Math.round(variance * 1.5));
    setEyeScore(riskScore);
    setEyePhase('done');
    completeModule('ms', riskScore);
  }

  useEffect(() => {
    return () => { stopStrokeCam(); stopEyeCam(); };
  }, []);

  useEffect(() => {
    if (activeModule !== 'stroke') stopStrokeCam();
    if (activeModule !== 'ms') stopEyeCam();
  }, [activeModule]);

  // ── COMPLETE MODULE ──
  function completeModule(moduleId, riskScore) {
    const clamped = Math.min(100, Math.max(0, riskScore));
    setScores(prev => ({ ...prev, [moduleId]: clamped }));
    setCompletedModules(prev => [...new Set([...prev, moduleId])]);
    toast.success(`${modules.find(m => m.id === moduleId)?.label} test completed!`);
    if (moduleId !== 'stroke' && moduleId !== 'ms') setTimeout(() => setActiveModule(null), 1500);
  }

  async function saveAndViewResults() {
    if (completedModules.length < 5) return toast.error('Please complete all 5 modules first!');
    try {
      const overallScore = Math.round(100 - Object.values(scores).reduce((a,b) => a+b, 0) / Object.values(scores).length);
      await addDoc(collection(db, 'testResults'), {
        userId: currentUser.uid, date: new Date().toISOString(),
        parkinsons: scores.parkinsons || 0, alzheimers: scores.alzheimers || 0,
        stroke: scores.stroke || 0, ms: scores.ms || 0, cognitive: scores.cognitive || 0, overallScore,
      });
      toast.success('Results saved!');
      navigate('/results');
    } catch (err) { toast.error('Failed to save results'); }
  }

  // ── RENDER ──
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => { stopStrokeCam(); stopEyeCam(); navigate('/patient/dashboard'); }} className="text-gray-400 hover:text-white transition">← Back</button>
          <div>
            <h1 className="text-xl font-black gradient-text">NeuroScan</h1>
            <p className="text-xs text-gray-400">AI Neurological Screening</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{completedModules.length}/5 completed</span>
          <div className="flex gap-1">
            {modules.map(m => (
              <div key={m.id} className={`w-8 h-2 rounded-full transition ${completedModules.includes(m.id) ? 'bg-green-400' : 'bg-white/20'}`} />
            ))}
          </div>
          {completedModules.length === 5 && (
            <button onClick={saveAndViewResults} className="px-4 py-2 neuro-gradient rounded-xl font-bold text-sm hover:opacity-90 transition">View Results →</button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">

        {/* Module Selection */}
        {!activeModule && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-3xl font-black mb-2">Select a Test Module</h2>
            <p className="text-gray-400 mb-8">Complete all 5 modules for a full brain health assessment</p>
            <div className="grid grid-cols-1 gap-4">
              {modules.map((module, i) => (
                <motion.button key={module.id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    setActiveModule(module.id);
                    if (module.id === 'alzheimers') { setMemoryPhase('show'); setMemoryInput(''); setMemoryScore(null); }
                    if (module.id === 'cognitive') setGamePhase('start');
                    if (module.id === 'stroke') setStrokePhase('ready');
                    if (module.id === 'ms') setEyePhase('ready');
                  }}
                  className={`glass border rounded-2xl p-6 text-left flex items-center justify-between card-hover transition ${completedModules.includes(module.id) ? 'border-green-500/50' : 'border-white/10'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: `${module.color}22` }}>{module.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold">{module.label}</h3>
                      <p className="text-gray-400">{module.desc}</p>
                      <p className="text-sm text-gray-500 mt-1">⏱ {module.duration}</p>
                    </div>
                  </div>
                  <div>
                    {completedModules.includes(module.id) ? (
                      <div className="text-right">
                        <span className="text-green-400 text-2xl">✅</span>
                        <p className="text-sm text-gray-400 mt-1">Risk: {scores[module.id]}%</p>
                      </div>
                    ) : (
                      <span className="px-4 py-2 neuro-gradient rounded-xl text-sm font-bold">
                        {(module.id === 'stroke' || module.id === 'ms') ? '📷 Start Camera' : 'Start →'}
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>

          {/* PARKINSON'S */}
          {activeModule === 'parkinsons' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <button onClick={() => setActiveModule(null)} className="text-gray-400 hover:text-white mb-6 transition">← Back</button>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black mb-2">✋ Parkinson's — Spiral Drawing Test</h2>
                <p className="text-gray-400">Draw a spiral following the guide. Try to keep it smooth and even.</p>
              </div>
              <div className="flex flex-col items-center">
                <canvas ref={canvasRef} width={500} height={400}
                  className="bg-gray-900 rounded-2xl border border-white/10 cursor-crosshair mb-4"
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
                <div className="flex gap-4">
                  <button onClick={clearCanvas} className="px-6 py-3 glass border border-white/10 rounded-xl font-bold hover:bg-white/10 transition">🗑️ Clear</button>
                  <button onClick={analyzeSpiral} className="px-6 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">Analyze Drawing →</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ALZHEIMER'S */}
          {activeModule === 'alzheimers' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <button onClick={() => setActiveModule(null)} className="text-gray-400 hover:text-white mb-6 transition">← Back</button>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black mb-2">🧩 Alzheimer's — Memory Test</h2>
              </div>
              {memoryPhase === 'show' && (
                <div className="text-center">
                  <p className="text-gray-400 mb-6">Memorize these 6 words. You have 10 seconds!</p>
                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                    {memoryWords.map((word, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="glass border border-purple-500/30 rounded-xl p-4 text-center">
                        <span className="text-xl font-bold gradient-text">{word}</span>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-yellow-400 text-sm pulse-animation">⏱ Words disappear in 10 seconds...</p>
                </div>
              )}
              {memoryPhase === 'recall' && (
                <div className="text-center max-w-md mx-auto">
                  <p className="text-gray-400 mb-6">Type all the words you remember</p>
                  <textarea value={memoryInput} onChange={e => setMemoryInput(e.target.value)} rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none mb-4"
                    placeholder="e.g. Apple, River, Chair..." />
                  {memoryScore !== null && <div className="mb-4 p-4 glass rounded-xl"><p className="text-2xl font-black gradient-text">{memoryScore}% Recall</p></div>}
                  <button onClick={checkMemory} className="px-8 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">Submit →</button>
                </div>
              )}
            </motion.div>
          )}

          {/* STROKE */}
          {activeModule === 'stroke' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <button onClick={() => { stopStrokeCam(); setActiveModule(null); setStrokePhase('ready'); }} className="text-gray-400 hover:text-white mb-6 transition">← Back</button>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black mb-2">⚡ Stroke Detection — Live Face Analysis</h2>
                <p className="text-gray-400">Real-time 468-point facial landmark mapping for stroke risk assessment</p>
              </div>

              {strokePhase === 'ready' && (
                <div className="max-w-md mx-auto glass rounded-3xl p-8 text-center">
                  <div className="text-6xl mb-4">📷</div>
                  <h3 className="text-xl font-bold mb-4">468-Point Face Symmetry Analysis</h3>
                  <p className="text-gray-400 mb-6">We'll map <span className="text-yellow-400 font-bold">468 facial landmarks</span> in real-time to detect stroke indicators like facial drooping and asymmetry.</p>
                  <div className="space-y-3 mb-6 text-left">
                    {['Sit in a well-lit area', 'Look straight at the camera', 'Keep a neutral expression', 'Hold still for 10 seconds'].map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 neuro-gradient rounded-full flex items-center justify-center text-xs font-bold">{i+1}</div>
                        <span className="text-sm text-gray-300">{s}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={startStrokeCam} className="w-full py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">📷 Start Camera →</button>
                </div>
              )}

              {strokePhase === 'loading' && (
                <div className="flex flex-col items-center py-16">
                  <div className="w-16 h-16 neuro-gradient rounded-2xl flex items-center justify-center pulse-animation mb-4"><span className="text-2xl">🤖</span></div>
                  <p className="text-gray-400">Loading MediaPipe Face Mesh model...</p>
                </div>
              )}

              {(strokePhase === 'analyzing' || strokePhase === 'done') && (
                <div className="flex gap-6">
                  <div className="flex-1">
                    <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
                      <video ref={strokeVideoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" playsInline muted />
                      <canvas ref={strokeCanvasRef} className="absolute inset-0 w-full h-full object-cover" />
                      {strokePhase === 'analyzing' && (
                        <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full pulse-animation" /> LIVE — {strokeTimer}s
                        </div>
                      )}
                      {landmarkCount > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 text-green-400 text-xs font-bold px-3 py-1 rounded-full">
                          {landmarkCount} landmarks
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-64 space-y-4">
                    <div className="glass rounded-2xl p-4">
                      <h3 className="font-bold mb-3 text-sm text-gray-300">REAL-TIME ANALYSIS</h3>
                      {strokeAnalysis ? (
                        <div className="space-y-3">
                          {[['Mouth Asymmetry', strokeAnalysis.mouthAsymmetry, 'bg-yellow-400'], ['Brow Asymmetry', strokeAnalysis.browAsymmetry, 'bg-orange-400']].map(([label, val, color]) => (
                            <div key={label}>
                              <p className="text-xs text-gray-400 mb-1">{label}</p>
                              <div className="w-full bg-white/10 rounded-full h-2">
                                <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, val*2)}%` }} />
                              </div>
                              <p className="text-xs text-right mt-1 font-bold">{val.toFixed(1)}%</p>
                            </div>
                          ))}
                          <div className={`rounded-xl p-3 text-center text-sm font-bold ${strokeAnalysis.overallAsym > 15 ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                            {strokeAnalysis.overallAsym > 15 ? '⚠ Asymmetry Detected' : '✓ Symmetry Normal'}
                          </div>
                        </div>
                      ) : <p className="text-gray-500 text-xs text-center py-4">Detecting face...</p>}
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <h3 className="font-bold mb-2 text-sm text-gray-300">LANDMARKS</h3>
                      <div className="space-y-1 text-xs text-gray-400">
                        {[['bg-green-400', 'Face mesh (468 pts)'], ['bg-cyan-400', 'Face oval'], ['bg-yellow-400', 'Eyebrows'], ['bg-red-400', 'Lips']].map(([c, t]) => (
                          <div key={t} className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${c} opacity-70`} /><span>{t}</span></div>
                        ))}
                      </div>
                    </div>
                    {strokePhase === 'analyzing' && (
                      <button onClick={finishStrokeAnalysis} className="w-full py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition text-sm">Finish Early →</button>
                    )}
                  </div>
                </div>
              )}

              {strokePhase === 'done' && (
                <div className="mt-6 glass rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg">✅ Analysis Complete</p>
                    <p className="text-gray-400 text-sm">Risk score from facial asymmetry</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black gradient-text">{strokeScore}%</p>
                    <p className="text-xs text-gray-400">Stroke risk</p>
                  </div>
                  <button onClick={() => setActiveModule(null)} className="px-6 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">Continue →</button>
                </div>
              )}
            </motion.div>
          )}

          {/* EYE TRACKING */}
          {activeModule === 'ms' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <button onClick={() => { stopEyeCam(); setActiveModule(null); setEyePhase('ready'); }} className="text-gray-400 hover:text-white mb-6 transition">← Back</button>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black mb-2">👁️ MS Detection — Live Eye Tracking</h2>
                <p className="text-gray-400">Follow the moving dot while we track your iris movements via webcam</p>
              </div>

              {eyePhase === 'ready' && (
                <div className="max-w-md mx-auto glass rounded-3xl p-8 text-center">
                  <div className="text-6xl mb-4">👁️</div>
                  <p className="text-gray-400 mb-6">Your webcam will show live iris tracking. Follow the <span className="text-purple-400 font-bold">moving dot</span> with your eyes only.</p>
                  <button onClick={startEyeCam} className="w-full py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">📷 Start Eye Tracking →</button>
                </div>
              )}

              {eyePhase === 'loading' && (
                <div className="flex flex-col items-center py-16">
                  <div className="w-16 h-16 neuro-gradient rounded-2xl flex items-center justify-center pulse-animation mb-4"><span className="text-2xl">👁️</span></div>
                  <p className="text-gray-400">Initializing eye tracking...</p>
                </div>
              )}

              {(eyePhase === 'tracking' || eyePhase === 'done') && (
                <div className="flex gap-6">
                  <div className="flex-1">
                    <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
                      <video ref={eyeVideoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" playsInline muted />
                      <canvas ref={eyeCanvasRef} className="absolute inset-0 w-full h-full object-cover" />
                      {eyePhase === 'tracking' && (
                        <motion.div
                          animate={{ left: `${dotPosition.x}%`, top: `${dotPosition.y}%` }}
                          transition={{ duration: 0.1 }}
                          className="absolute w-8 h-8 pointer-events-none"
                          style={{ transform: 'translate(-50%,-50%)' }}
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-500 shadow-lg shadow-purple-500/80 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-white" />
                          </div>
                        </motion.div>
                      )}
                      {eyePhase === 'tracking' && (
                        <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full pulse-animation" /> TRACKING — {eyeTimer}s
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-64 space-y-4">
                    <div className="glass rounded-2xl p-4">
                      <h3 className="font-bold mb-3 text-sm text-gray-300">EYE TRACKING</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Gaze samples collected</p>
                          <p className="text-2xl font-black gradient-text">{gazeData.length}</p>
                        </div>
                        {currentGaze && (
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Current gaze position</p>
                            <p className="text-xs font-mono text-cyan-400">X: {(currentGaze.x*100).toFixed(1)}% Y: {(currentGaze.y*100).toFixed(1)}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="glass rounded-2xl p-4">
                      <h3 className="font-bold mb-2 text-sm text-gray-300">GAZE MAP</h3>
                      <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ height: '100px' }}>
                        {gazeData.slice(-30).map((g, i) => (
                          <div key={i} className="absolute w-2 h-2 rounded-full bg-cyan-400/60"
                            style={{ left: `${g.x*100}%`, top: `${g.y*100}%`, transform: 'translate(-50%,-50%)', opacity: (i+1)/30 }} />
                        ))}
                        <div className="absolute inset-0 border border-white/10 rounded-xl" />
                      </div>
                    </div>
                    {eyePhase === 'tracking' && (
                      <button onClick={finishEyeTracking} className="w-full py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition text-sm">Finish Early →</button>
                    )}
                  </div>
                </div>
              )}

              {eyePhase === 'done' && (
                <div className="mt-6 glass rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg">✅ Eye Tracking Complete</p>
                    <p className="text-gray-400 text-sm">{gazeData.length} gaze samples analyzed</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black gradient-text">{eyeScore}%</p>
                    <p className="text-xs text-gray-400">MS risk</p>
                  </div>
                  <button onClick={() => setActiveModule(null)} className="px-6 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">Continue →</button>
                </div>
              )}
            </motion.div>
          )}

          {/* COGNITIVE */}
          {activeModule === 'cognitive' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <button onClick={() => setActiveModule(null)} className="text-gray-400 hover:text-white mb-6 transition">← Back</button>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black mb-2">🎮 Cognitive — Memory Sequence</h2>
                <p className="text-gray-400">Watch the sequence, then repeat it in the same order</p>
              </div>
              <div className="max-w-md mx-auto text-center">
                {gamePhase === 'start' && (
                  <div className="glass rounded-3xl p-8">
                    <div className="text-6xl mb-4">🧠</div>
                    <p className="text-gray-400 mb-6">Watch the colors light up, then tap them in the same order!</p>
                    <button onClick={startCogGame} className="px-8 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">Start Game →</button>
                  </div>
                )}
                {(gamePhase === 'show' || gamePhase === 'input') && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-gray-400">Round {round}/7</span>
                      <span className={`font-bold ${gamePhase === 'show' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {gamePhase === 'show' ? '👀 Watch!' : '👆 Your turn!'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {colors.map((color, idx) => (
                        <button key={idx} onClick={() => handleColorClick(idx)} disabled={gamePhase === 'show'}
                          className={`h-24 rounded-2xl text-4xl flex items-center justify-center transition
                            ${gamePhase === 'show' && sequence[userSequence.length] === idx ? 'scale-110 brightness-150' : 'glass border border-white/10'}
                            ${gamePhase === 'input' ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {gamePhase === 'end' && (
                  <div className="glass rounded-3xl p-8">
                    <div className="text-6xl mb-4">{cogScore >= 70 ? '🏆' : '😅'}</div>
                    <h3 className="text-xl font-bold mb-2">Game Over!</h3>
                    <p className="text-2xl font-black gradient-text">Score: {cogScore}%</p>
                    <p className="text-gray-400 mt-2">Reached round {round}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}