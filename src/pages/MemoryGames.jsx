import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ════════════════════════════════════════════════════
// GAME 1 — VISUAL GRID PATTERN
// Flashes a pattern on a grid. Player must recreate it.
// ════════════════════════════════════════════════════

const GRID_SIZE = 4; // 4x4 = 16 cells

function generatePattern(level) {
  const count = Math.min(3 + level, 10);
  const cells = new Set();
  while (cells.size < count) cells.add(Math.floor(Math.random() * 16));
  return [...cells];
}

function GridPatternGame({ onFinish }) {
  const [phase, setPhase]           = useState('intro');   // intro|show|input|result
  const [level, setLevel]           = useState(1);
  const [pattern, setPattern]       = useState([]);
  const [flashIdx, setFlashIdx]     = useState(-1);
  const [selected, setSelected]     = useState([]);
  const [score, setScore]           = useState(0);
  const [maxLevel, setMaxLevel]     = useState(0);
  const [showCorrect, setShowCorrect] = useState(false);
  const timerRef = useRef(null);

  function startLevel(lvl) {
    const p = generatePattern(lvl);
    setPattern(p);
    setSelected([]);
    setShowCorrect(false);
    setPhase('show');
    // Flash each cell one by one
    let i = 0;
    setFlashIdx(p[0]);
    timerRef.current = setInterval(() => {
      i++;
      if (i < p.length) {
        setFlashIdx(p[i]);
      } else {
        clearInterval(timerRef.current);
        setFlashIdx(-1);
        setTimeout(() => setPhase('input'), 400);
      }
    }, 600);
  }

  function handleCellClick(idx) {
    if (phase !== 'input') return;
    setSelected(prev => {
      if (prev.includes(idx)) return prev.filter(x => x !== idx);
      return [...prev, idx];
    });
  }

  function checkAnswer() {
    const correct = pattern.every(c => selected.includes(c)) && selected.length === pattern.length;
    setShowCorrect(true);
    setPhase('result');
    if (correct) {
      const newScore = score + level * 10;
      setScore(newScore);
      setMaxLevel(Math.max(maxLevel, level));
      setTimeout(() => {
        if (level >= 8) { onFinish(Math.min(100, newScore)); }
        else { setLevel(l => l + 1); startLevel(level + 1); }
      }, 1500);
    } else {
      setMaxLevel(Math.max(maxLevel, level));
      setTimeout(() => onFinish(Math.min(100, score)), 2000);
    }
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  const cellColor = (idx) => {
    if (phase === 'show' && flashIdx === idx) return 'bg-yellow-400 shadow-lg shadow-yellow-400/60 scale-105';
    if (phase === 'result' && showCorrect) {
      if (pattern.includes(idx) && selected.includes(idx)) return 'bg-green-500 scale-105';
      if (pattern.includes(idx) && !selected.includes(idx)) return 'bg-red-500 scale-105';
      if (!pattern.includes(idx) && selected.includes(idx)) return 'bg-red-800 scale-105';
    }
    if (phase === 'input' && selected.includes(idx)) return 'bg-purple-500 scale-105';
    return 'bg-white/10 hover:bg-white/20';
  };

  return (
    <div className="max-w-lg mx-auto">
      {phase === 'intro' && (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-6xl mb-4">🟦</div>
          <h3 className="text-2xl font-black mb-3">Grid Pattern Memory</h3>
          <p className="text-gray-400 mb-6">Watch the cells light up one by one, then tap the same cells in any order. The pattern gets longer each level!</p>
          <div className="grid grid-cols-3 gap-3 text-sm text-gray-300 mb-6">
            {[['👀','Watch the pattern','Cells flash one by one'],['🧠','Remember positions','Keep them in mind'],['👆','Recreate it','Tap the same cells']].map(([icon,title,desc])=>(
              <div key={title} className="glass rounded-xl p-3">
                <div className="text-2xl mb-1">{icon}</div>
                <div className="font-bold text-white mb-1">{title}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            ))}
          </div>
          <button onClick={() => startLevel(1)} className="px-8 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">
            Start Game →
          </button>
        </div>
      )}

      {(phase === 'show' || phase === 'input' || phase === 'result') && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="glass rounded-xl px-4 py-2 text-sm font-bold">Level {level}/8</div>
            <div className="glass rounded-xl px-4 py-2 text-sm">
              Pattern: <span className="text-yellow-400 font-black">{pattern.length} cells</span>
            </div>
            <div className="glass rounded-xl px-4 py-2 text-sm font-bold gradient-text">Score: {score}</div>
          </div>

          <div className="text-center mb-4">
            {phase === 'show' && <p className="text-yellow-400 font-bold pulse-animation">👀 Memorize the pattern!</p>}
            {phase === 'input' && <p className="text-green-400 font-bold">👆 Tap the cells you saw! ({selected.length}/{pattern.length} selected)</p>}
            {phase === 'result' && (
              <p className={`font-black text-lg ${
                pattern.every(c=>selected.includes(c))&&selected.length===pattern.length ? 'text-green-400' : 'text-red-400'
              }`}>
                {pattern.every(c=>selected.includes(c))&&selected.length===pattern.length ? '✅ Correct! Next level...' : '❌ Wrong! Game over'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {Array.from({length:16},(_,i)=>(
              <motion.button
                key={i}
                onClick={() => handleCellClick(i)}
                whileTap={{ scale: 0.92 }}
                className={`aspect-square rounded-xl transition-all duration-200 cursor-pointer ${cellColor(i)}`}
              />
            ))}
          </div>

          {phase === 'input' && (
            <button onClick={checkAnswer} disabled={selected.length === 0}
              className="w-full py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition disabled:opacity-40">
              Submit Answer →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// GAME 2 — WORD CHAIN CHALLENGE
// Player sees a category. Must type words belonging to it.
// No word can be repeated. Timer pressure. Fully unique.
// ════════════════════════════════════════════════════

const WORD_CATEGORIES = [
  {
    name: 'Animals', emoji: '🐾',
    words: ['dog','cat','elephant','tiger','lion','giraffe','zebra','dolphin','whale','eagle','shark','penguin','rabbit','bear','wolf','fox','deer','monkey','gorilla','cheetah','hippo','rhino','crocodile','parrot','owl','snake','frog','turtle','butterfly','bee'],
  },
  {
    name: 'Fruits', emoji: '🍎',
    words: ['apple','mango','banana','grape','orange','kiwi','peach','plum','cherry','lemon','lime','melon','papaya','pear','pineapple','strawberry','blueberry','raspberry','watermelon','coconut','apricot','avocado','fig','guava','lychee','pomegranate','tangerine','dragonfruit','jackfruit','passion fruit'],
  },
  {
    name: 'Countries', emoji: '🌍',
    words: ['india','japan','france','brazil','canada','germany','australia','mexico','china','russia','italy','spain','egypt','kenya','peru','chile','iran','iraq','norway','sweden','denmark','finland','greece','turkey','poland','ukraine','vietnam','thailand','indonesia','argentina'],
  },
  {
    name: 'Colors', emoji: '🎨',
    words: ['red','blue','green','yellow','orange','purple','pink','brown','black','white','grey','cyan','magenta','violet','indigo','teal','maroon','navy','coral','gold','silver','beige','turquoise','lavender','scarlet','crimson','azure','amber','ivory','jade'],
  },
  {
    name: 'Sports', emoji: '⚽',
    words: ['football','cricket','tennis','basketball','swimming','boxing','cycling','golf','hockey','badminton','volleyball','baseball','rugby','archery','skiing','surfing','wrestling','gymnastics','rowing','fencing','diving','polo','skating','karate','judo','taekwondo','snooker','squash','handball','lacrosse'],
  },
  {
    name: 'Vegetables', emoji: '🥦',
    words: ['carrot','potato','tomato','onion','garlic','spinach','broccoli','cabbage','cucumber','pepper','mushroom','celery','eggplant','zucchini','pumpkin','beetroot','radish','lettuce','pea','corn','asparagus','artichoke','leek','cauliflower','kale','turnip','parsnip','okra','fennel','coriander'],
  },
];

function WordChainGame({ onFinish }) {
  const [phase, setPhase]         = useState('intro');
  const [category, setCategory]   = useState(null);
  const [input, setInput]         = useState('');
  const [usedWords, setUsedWords] = useState([]);
  const [timeLeft, setTimeLeft]   = useState(60);
  const [feedback, setFeedback]   = useState(null); // {type:'correct'|'wrong'|'repeat'|'invalid', word}
  const [score, setScore]         = useState(0);
  const inputRef = useRef(null);

  function startGame() {
    const cat = WORD_CATEGORIES[Math.floor(Math.random() * WORD_CATEGORIES.length)];
    setCategory(cat);
    setUsedWords([]);
    setInput('');
    setScore(0);
    setTimeLeft(60);
    setFeedback(null);
    setPhase('playing');
  }

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) { setPhase('done'); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === 'playing') inputRef.current?.focus();
  }, [phase]);

  function submitWord(e) {
    e.preventDefault();
    const word = input.trim().toLowerCase();
    if (!word) return;
    setInput('');

    if (usedWords.includes(word)) {
      setFeedback({ type: 'repeat', word });
      setTimeout(() => setFeedback(null), 1200);
      return;
    }
    if (!category.words.includes(word)) {
      setFeedback({ type: 'invalid', word });
      setTimeout(() => setFeedback(null), 1200);
      return;
    }
    // Correct!
    const newUsed = [...usedWords, word];
    setUsedWords(newUsed);
    const pts = Math.max(1, Math.floor(timeLeft / 10)) * 5;
    setScore(s => s + pts);
    setFeedback({ type: 'correct', word, pts });
    setTimeout(() => setFeedback(null), 900);
  }

  const timerColor = timeLeft > 30 ? 'text-green-400' : timeLeft > 15 ? 'text-yellow-400' : 'text-red-400';
  const finalScore = Math.min(100, Math.round((usedWords.length / 15) * 100));

  return (
    <div className="max-w-lg mx-auto">
      {phase === 'intro' && (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-2xl font-black mb-3">Word Chain Challenge</h3>
          <p className="text-gray-400 mb-6">You'll get a random category. Type as many words as you can that belong to it — in 60 seconds! <span className="text-red-400 font-bold">No word can be used twice.</span></p>
          <div className="grid grid-cols-2 gap-3 text-sm mb-6">
            {[['✅','Correct word','+5–30 pts'],['🔁','Repeated word','0 pts, warning'],['❌','Wrong word','0 pts'],['⏱','Faster = more pts','Bonus per word']].map(([icon,title,desc])=>(
              <div key={title} className="glass rounded-xl p-3 text-left">
                <span className="text-lg">{icon}</span>
                <span className="font-bold text-white ml-2">{title}</span>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <button onClick={startGame} className="px-8 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">Start Game →</button>
        </div>
      )}

      {phase === 'playing' && category && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="glass rounded-xl px-4 py-2">
              <span className="text-lg mr-2">{category.emoji}</span>
              <span className="font-black text-white">{category.name}</span>
            </div>
            <div className={`glass rounded-xl px-4 py-2 font-black text-2xl ${timerColor}`}>{timeLeft}s</div>
            <div className="glass rounded-xl px-4 py-2 text-sm font-bold gradient-text">Score: {score}</div>
          </div>

          <p className="text-gray-400 text-sm text-center mb-4">
            Type any <span className="text-white font-bold">{category.name}</span> — {usedWords.length} word{usedWords.length!==1?'s':''} so far, no repeats allowed!
          </p>

          <form onSubmit={submitWord} className="mb-4">
            <div className="relative">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                placeholder={`Type a ${category.name.toLowerCase()}...`}
                autoComplete="off"
                spellCheck="false"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 neuro-gradient rounded-lg text-sm font-bold">
                Enter
              </button>
            </div>
          </form>

          {/* Feedback toast */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                className={`mb-4 p-3 rounded-xl text-center font-bold text-sm ${
                  feedback.type==='correct'   ? 'bg-green-900/40 text-green-400 border border-green-500/30' :
                  feedback.type==='repeat'    ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-500/30' :
                  'bg-red-900/40 text-red-400 border border-red-500/30'
                }`}
              >
                {feedback.type==='correct'  && `✅ "${feedback.word}" +${feedback.pts} pts!`}
                {feedback.type==='repeat'   && `🔁 "${feedback.word}" already used!`}
                {feedback.type==='invalid'  && `❌ "${feedback.word}" not in ${category.name}!`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Used words */}
          {usedWords.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-gray-400 mb-2">Words used ({usedWords.length}):</p>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                {usedWords.map(w => (
                  <span key={w} className="px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-xs text-purple-300 font-medium">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-6xl mb-4">{usedWords.length >= 10 ? '🏆' : usedWords.length >= 5 ? '👍' : '😅'}</div>
          <h3 className="text-2xl font-black mb-2">Time's Up!</h3>
          <p className="text-gray-400 mb-1">Category: <span className="text-white font-bold">{category?.name}</span></p>
          <p className="text-4xl font-black gradient-text my-4">{score} pts</p>
          <p className="text-gray-400 mb-6">{usedWords.length} unique words typed</p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {usedWords.map(w => (
              <span key={w} className="px-3 py-1 bg-green-900/30 border border-green-500/30 rounded-full text-xs text-green-300">{w}</span>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={startGame} className="flex-1 py-3 glass border border-white/20 rounded-xl font-bold hover:bg-white/10 transition">Play Again</button>
            <button onClick={() => onFinish(finalScore)} className="flex-1 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">Finish →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// GAME 3 — NUMBER PYRAMID
// Shows a pyramid of numbers briefly. Player reconstructs it.
// Each row disappears top-down. Player fills in missing numbers.
// ════════════════════════════════════════════════════

function generatePyramid(level) {
  const rows = Math.min(2 + level, 5); // 3 to 5 rows
  const pyramid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c <= r; c++) {
      row.push(Math.floor(Math.random() * 9) + 1);
    }
    pyramid.push(row);
  }
  return pyramid;
}

function NumberPyramidGame({ onFinish }) {
  const [phase, setPhase]           = useState('intro');
  const [level, setLevel]           = useState(1);
  const [pyramid, setPyramid]       = useState([]);
  const [visibleRows, setVisibleRows] = useState([]);
  const [answers, setAnswers]       = useState({});
  const [score, setScore]           = useState(0);
  const [checked, setChecked]       = useState(false);
  const [results, setResults]       = useState({});
  const timerRef = useRef(null);

  function startLevel(lvl) {
    const p = generatePyramid(lvl);
    setPyramid(p);
    setVisibleRows(p.map((_,i) => i)); // all visible first
    setAnswers({});
    setChecked(false);
    setResults({});
    setPhase('show');

    // Fade out rows top-down one by one
    let rowToHide = 0;
    const hideNext = () => {
      if (rowToHide < p.length) {
        setVisibleRows(prev => prev.filter(r => r !== rowToHide));
        rowToHide++;
        timerRef.current = setTimeout(hideNext, 800);
      } else {
        setPhase('input');
      }
    };
    timerRef.current = setTimeout(hideNext, 1200); // show all for 1.2s first
  }

  function handleInput(row, col, val) {
    setAnswers(prev => ({ ...prev, [`${row}-${col}`]: val }));
  }

  function checkAnswers() {
    const res = {};
    let correct = 0, total = 0;
    pyramid.forEach((row, r) => {
      row.forEach((num, c) => {
        if (!visibleRows.includes(r)) {
          total++;
          const key = `${r}-${c}`;
          const userVal = parseInt(answers[key]);
          const isCorrect = userVal === num;
          res[key] = isCorrect;
          if (isCorrect) correct++;
        }
      });
    });
    setResults(res);
    setChecked(true);
    const pts = Math.round((correct / Math.max(total,1)) * level * 20);
    const newScore = score + pts;
    setScore(newScore);

    setTimeout(() => {
      if (correct === total && level < 6) {
        setLevel(l => l+1);
        startLevel(level+1);
      } else {
        onFinish(Math.min(100, newScore));
      }
    }, 2000);
  }

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const cellStyle = (r, c) => {
    const key = `${r}-${c}`;
    if (!checked) return 'bg-white/10 border border-white/20';
    if (!results.hasOwnProperty(key)) return 'bg-white/10 border border-white/20';
    return results[key] ? 'bg-green-900/60 border border-green-400' : 'bg-red-900/60 border border-red-400';
  };

  return (
    <div className="max-w-lg mx-auto">
      {phase === 'intro' && (
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-6xl mb-4">🔢</div>
          <h3 className="text-2xl font-black mb-3">Number Pyramid</h3>
          <p className="text-gray-400 mb-6">A pyramid of numbers will appear, then rows will disappear one by one from the top. Fill in the missing numbers from memory!</p>
          <div className="glass rounded-2xl p-4 mb-6 text-left space-y-2 text-sm text-gray-300">
            <p>🔵 Numbers appear row by row</p>
            <p>🟡 Rows disappear top-down</p>
            <p>✏️ Type the missing numbers</p>
            <p>📈 More rows = higher level</p>
          </div>
          <button onClick={() => startLevel(1)} className="px-8 py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">Start Game →</button>
        </div>
      )}

      {(phase === 'show' || phase === 'input') && pyramid.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="glass rounded-xl px-4 py-2 text-sm font-bold">Level {level}/6</div>
            <div className="glass rounded-xl px-4 py-2 text-sm">
              {phase==='show' ? <span className="text-yellow-400 font-bold pulse-animation">👀 Memorize!</span>
                              : <span className="text-green-400 font-bold">✏️ Fill in missing numbers</span>}
            </div>
            <div className="glass rounded-xl px-4 py-2 text-sm font-bold gradient-text">Score: {score}</div>
          </div>

          {/* Pyramid */}
          <div className="flex flex-col items-center gap-2 mb-6">
            {pyramid.map((row, r) => (
              <div key={r} className="flex gap-2">
                {row.map((num, c) => {
                  const isVisible = visibleRows.includes(r);
                  const key = `${r}-${c}`;
                  return (
                    <motion.div
                      key={c}
                      initial={{ opacity: 1 }}
                      animate={{ opacity: isVisible ? 1 : 0.15 }}
                      transition={{ duration: 0.4 }}
                      className="relative"
                    >
                      {isVisible ? (
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black
                          ${r % 2 === 0 ? 'bg-purple-900/60 border border-purple-400/40 text-purple-200'
                                        : 'bg-blue-900/60 border border-blue-400/40 text-blue-200'}`}>
                          {num}
                        </div>
                      ) : (
                        <div className={`w-14 h-14 rounded-xl ${cellStyle(r,c)}`}>
                          {checked ? (
                            <div className={`w-full h-full flex items-center justify-center text-lg font-black ${results[key] ? 'text-green-400' : 'text-red-400'}`}>
                              {results[key] ? answers[key] : `${answers[key]||'?'}→${num}`}
                            </div>
                          ) : (
                            <input
                              type="number"
                              min="1" max="9"
                              value={answers[key] || ''}
                              onChange={e => handleInput(r, c, e.target.value)}
                              className="w-full h-full bg-transparent text-center text-xl font-black text-white focus:outline-none"
                              placeholder="?"
                            />
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          {phase === 'input' && !checked && (
            <button onClick={checkAnswers} className="w-full py-3 neuro-gradient rounded-xl font-bold hover:opacity-90 transition">
              Check Answers →
            </button>
          )}
          {checked && (
            <div className={`text-center p-4 rounded-xl font-black text-lg ${
              Object.values(results).every(v=>v) ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
            }`}>
              {Object.values(results).every(v=>v) ? '✅ Perfect! Next level...' : `❌ ${Object.values(results).filter(v=>v).length}/${Object.values(results).length} correct`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════

const GAMES = [
  {
    id: 'grid',
    icon: '🟦',
    title: 'Grid Pattern Memory',
    subtitle: 'Visual / Spatial',
    desc: 'Watch cells light up on a 4×4 grid and recreate the pattern from memory. Gets harder each level.',
    color: 'from-purple-900/40 to-purple-800/20',
    border: 'border-purple-500/30',
    tag: 'Visual',
    tagColor: 'bg-purple-900/40 text-purple-300',
    difficulty: 'Medium',
  },
  {
    id: 'words',
    icon: '💬',
    title: 'Word Chain Challenge',
    subtitle: 'Language / Verbal',
    desc: 'Type as many words as you can in a category within 60 seconds. No word can be repeated!',
    color: 'from-green-900/40 to-green-800/20',
    border: 'border-green-500/30',
    tag: 'Language',
    tagColor: 'bg-green-900/40 text-green-300',
    difficulty: 'Easy–Hard',
  },
  {
    id: 'numbers',
    icon: '🔢',
    title: 'Number Pyramid',
    subtitle: 'Numerical / Working Memory',
    desc: 'A pyramid of numbers appears then vanishes row by row. Reconstruct all the missing numbers.',
    color: 'from-blue-900/40 to-blue-800/20',
    border: 'border-blue-500/30',
    tag: 'Numbers',
    tagColor: 'bg-blue-900/40 text-blue-300',
    difficulty: 'Hard',
  },
];

export default function MemoryGames() {
  const navigate = useNavigate();
  const [activeGame, setActiveGame]     = useState(null);
  const [completedGames, setCompleted]  = useState({});
  const [showResult, setShowResult]     = useState(null);

  function handleFinish(gameId, score) {
    setCompleted(prev => ({ ...prev, [gameId]: score }));
    setShowResult({ gameId, score });
    setActiveGame(null);
  }

  const totalScore = Object.values(completedGames).reduce((a,b)=>a+b,0);
  const avgScore   = Object.keys(completedGames).length > 0
    ? Math.round(totalScore / Object.keys(completedGames).length)
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Header */}
      <div className="glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/patient/dashboard')} className="text-gray-400 hover:text-white transition">← Dashboard</button>
          <div>
            <h1 className="text-xl font-black gradient-text">Brain Games</h1>
            <p className="text-xs text-gray-400">Memory Training & Cognitive Exercises</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{Object.keys(completedGames).length}/3 played</span>
          <div className="flex gap-1">
            {GAMES.map(g => (
              <div key={g.id} className={`w-8 h-2 rounded-full transition ${completedGames[g.id]!==undefined ? 'bg-green-400' : 'bg-white/20'}`} />
            ))}
          </div>
          {avgScore !== null && (
            <div className="glass rounded-xl px-4 py-2 text-sm">
              Avg Score: <span className="font-black gradient-text">{avgScore}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">

        {/* Score result toast */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="mb-6 glass border border-green-500/30 rounded-2xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{GAMES.find(g=>g.id===showResult.gameId)?.icon}</span>
                <div>
                  <p className="font-bold text-green-400">✅ {GAMES.find(g=>g.id===showResult.gameId)?.title} Complete!</p>
                  <p className="text-sm text-gray-400">Score recorded</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-2xl font-black gradient-text">{showResult.score}%</p>
                <button onClick={() => setShowResult(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game selector */}
        {!activeGame && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            <div className="mb-8">
              <h2 className="text-3xl font-black mb-2">Memory Training Games</h2>
              <p className="text-gray-400">Three unique brain exercises targeting different types of memory and cognitive function.</p>
            </div>

            {/* Stats row */}
            {Object.keys(completedGames).length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {GAMES.map(g => (
                  <div key={g.id} className={`bg-gradient-to-br ${g.color} border ${g.border} rounded-2xl p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{g.icon}</span>
                      {completedGames[g.id] !== undefined
                        ? <span className="text-green-400 font-bold text-sm">✅ Played</span>
                        : <span className="text-gray-500 text-sm">Not played</span>}
                    </div>
                    <p className="font-bold text-sm text-white">{g.title}</p>
                    {completedGames[g.id] !== undefined && (
                      <p className="text-2xl font-black gradient-text mt-1">{completedGames[g.id]}%</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Game cards */}
            <div className="grid gap-5">
              {GAMES.map((game, i) => (
                <motion.div
                  key={game.id}
                  initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}}
                  className={`bg-gradient-to-br ${game.color} border ${game.border} rounded-3xl p-6 flex items-center justify-between card-hover transition cursor-pointer`}
                  onClick={() => setActiveGame(game.id)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-4xl border border-white/10">
                      {game.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black">{game.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${game.tagColor}`}>{game.tag}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-gray-300">{game.difficulty}</span>
                      </div>
                      <p className="text-sm text-purple-300 font-medium mb-1">{game.subtitle}</p>
                      <p className="text-sm text-gray-400 max-w-md">{game.desc}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    {completedGames[game.id] !== undefined ? (
                      <div className="text-right">
                        <p className="text-3xl font-black gradient-text">{completedGames[game.id]}%</p>
                        <p className="text-xs text-gray-400">Last score</p>
                        <button className="mt-2 px-4 py-2 glass border border-white/20 rounded-xl text-xs font-bold hover:bg-white/10 transition">
                          Play Again
                        </button>
                      </div>
                    ) : (
                      <span className="px-6 py-3 neuro-gradient rounded-xl font-bold text-sm">Play →</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Overall score */}
            {Object.keys(completedGames).length === 3 && (
              <motion.div
                initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                className="mt-8 glass rounded-3xl p-8 text-center border border-purple-500/30"
              >
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-2xl font-black mb-2">All Games Complete!</h3>
                <p className="text-gray-400 mb-4">Your average brain game score</p>
                <p className="text-6xl font-black gradient-text mb-6">{avgScore}%</p>
                <div className="grid grid-cols-3 gap-4">
                  {GAMES.map(g => (
                    <div key={g.id} className="glass rounded-xl p-3">
                      <p className="text-lg">{g.icon}</p>
                      <p className="text-xs text-gray-400 mt-1">{g.title.split(' ')[0]}</p>
                      <p className="text-xl font-black gradient-text">{completedGames[g.id]}%</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Active game */}
        <AnimatePresence>
          {activeGame && (
            <motion.div initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} exit={{opacity:0}}>
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setActiveGame(null)} className="text-gray-400 hover:text-white transition">← Back to Games</button>
                <div>
                  <h2 className="text-2xl font-black">{GAMES.find(g=>g.id===activeGame)?.icon} {GAMES.find(g=>g.id===activeGame)?.title}</h2>
                  <p className="text-sm text-gray-400">{GAMES.find(g=>g.id===activeGame)?.subtitle}</p>
                </div>
              </div>

              {activeGame === 'grid'    && <GridPatternGame  onFinish={score => handleFinish('grid', score)} />}
              {activeGame === 'words'   && <WordChainGame    onFinish={score => handleFinish('words', score)} />}
              {activeGame === 'numbers' && <NumberPyramidGame onFinish={score => handleFinish('numbers', score)} />}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
